# Documentación de Implementación — Inmobiliaria DivFlow

> Guía paso a paso para desplegar esta base (nueva instalación) o para adaptarla a un cliente inmobiliario nuevo. Para entender cómo funciona el código por dentro, ver `docs/DOCUMENTACION-PROYECTO.md`.

Última actualización: agosto 2026.

---

## 1. Proveedores usados

| Proveedor | Para qué | Plan mínimo necesario | Obligatorio |
|---|---|---|---|
| **Supabase** | Base de datos, autenticación, storage de imágenes | Free (Pro si se quiere "Leaked Password Protection", ver 3.3) | Sí |
| **Vercel** | Hosting del sitio | Free (Hobby) | Sí |
| **Google Cloud Console** | Login con Google (OAuth) + Google Maps Embed API + Geocoding (opcional) | Free (Maps tiene cuota gratuita mensual) | Google OAuth y Maps Embed sí; Geocoding no |
| **Upstash** | Rate limiting distribuido (login, reset de contraseña, leads) | Free | Recomendado fuerte — sin esto el rate limiting no protege nada en producción real (ver `DOCUMENTACION-PROYECTO.md`, sección 6.8) |
| **Resend** | Email transaccional (aviso de cambio de contraseña) | Free (100 emails/día) | No — sin esto los emails simplemente no se mandan, el resto del sitio funciona igual |
| **Un dominio propio** | Branding correcto (URL del sitio, pantalla de login de Google, SMTP con Resend) | — | No para lanzar, sí recomendado apenas se pueda |

---

## 2. Checklist de alto nivel (orden recomendado)

1. Clonar el repo / usarlo como template.
2. Provisionar el proyecto Supabase (base de datos + Auth).
3. Configurar Supabase Auth (signup, Google OAuth, MFA).
4. Completar variables de entorno.
5. Editar `src/config/client.config.ts` — el único archivo de identidad de marca.
6. Reemplazar los assets de logo en `public/brand/`.
7. Deployar en Vercel.
8. (Opcional, cuando haya dominio) Configurar dominio propio.
9. (Opcional, recomendado) Configurar Resend + SMTP custom en Supabase.
10. Configurar Upstash.
11. QA final antes de recibir tráfico real.

---

## 3. Paso a paso

### 3.1 Clonar el repo

Usar este repositorio como template o clonarlo directo. No hace falta tocar nada de `src/components`, `src/lib` ni `src/app` para un cliente nuevo — solo lo listado en los pasos 5 y 6.

### 3.2 Provisionar Supabase

1. Crear un proyecto nuevo en [supabase.com](https://supabase.com) — anotar el **Project URL** y las keys (`anon` y `service_role`) desde *Project Settings → API*.
2. Habilitar la extensión **PostGIS** (*Database → Extensions* → buscar `postgis` → Enable). Es requisito duro: la columna `properties.location` es `geography`.
3. Correr el esquema completo (tablas, enums, funciones, triggers, RLS) — ver las migraciones del repo o `docs/DOCUMENTACION-PROYECTO.md` sección 5 para el detalle de qué tablas/políticas/funciones deben existir. Si el proyecto tiene migraciones versionadas (`supabase/migrations/`), correrlas en orden con la CLI de Supabase o el MCP.
4. Verificar que RLS quedó habilitado en **todas** las tablas propias (no solo creadas, sino con `ENABLE ROW LEVEL SECURITY` y las policies correspondientes) — confirmar con:
   ```sql
   select tablename, rowsecurity from pg_tables where schemaname = 'public';
   ```
5. Cargar el catálogo base: al menos una `agency` y un `agent` con `is_super_agent = true`, vinculado a un usuario real de `auth.users` (ver paso siguiente) vía `auth_user_id`.

### 3.3 Configurar Supabase Auth

En *Authentication* del dashboard de Supabase:

- **Restringir signup público:** *Authentication → Providers → Email* → desactivar "Allow new users to sign up" (o el equivalente vigente en la versión del dashboard). Los agentes se dan de alta manualmente desde `/admin/agentes`, no por registro abierto.
- **Google OAuth (si se usa login con Google):**
  1. En Google Cloud Console, crear un proyecto y una pantalla de consentimiento OAuth (*APIs & Services → OAuth consent screen*) con nombre de la app, logo, dominio de la app y política de privacidad/términos.
  2. Crear credenciales *OAuth client ID* (tipo *Web application*), agregando como **Authorized redirect URI**: `https://<project-ref>.supabase.co/auth/v1/callback`.
  3. Copiar Client ID y Client Secret a Supabase: *Authentication → Providers → Google*.
  4. **Importante — pantalla "Selecciona una cuenta" muestra el dominio de Supabase, no el nombre de la app:** por defecto Google muestra "Ir a `<project-ref>.supabase.co`" en vez del nombre configurado. Para que muestre el nombre real, hace falta verificar un dominio propio en Google Search Console, agregarlo a *Authorized domains* del OAuth consent screen, y **publicar** la app (Publishing status → Publish App). No requiere el add-on de Custom Domains de Supabase ($10/mes) — es enteramente configuración de Google Cloud Console. Bloqueado hasta tener un dominio propio.
- **URL Configuration** (*Authentication → URL Configuration*):
  - **Site URL:** el dominio real de producción (ej. `https://tu-proyecto.vercel.app` o el dominio propio).
  - **Redirect URLs:** agregar el mismo dominio de Site URL **más** `http://localhost:3000/**` si se va a probar el flujo de login/reset localmente durante desarrollo. Si un `redirectTo` que pide la app no está en esta lista, Supabase lo ignora silenciosamente y redirige al Site URL en su lugar — causa típica de "el reset de contraseña siempre me manda a producción aunque lo pida desde local".
- **MFA (2FA):** no requiere configuración especial del lado de Supabase — el TOTP es opt-in por agente desde `/admin/mi-cuenta`.
- **Leaked Password Protection** (recomendado): *Authentication → Policies* (o *Auth → Settings* según la versión) → activar "Leaked password protection" (usa HaveIBeenPwned). **Requiere plan Pro de Supabase** — en Free el toggle no aparece en el dashboard.

### 3.4 Variables de entorno

Copiar `.env.example` a `.env.local` (desarrollo) y cargar las mismas en Vercel (*Project Settings → Environment Variables*) para producción.

| Variable | De dónde sale | Obligatoria |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` key | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key. **Nunca** exponer con prefijo `NEXT_PUBLIC_`, nunca commitear | Sí |
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string | Solo si algo se conecta directo a Postgres fuera de la API de Supabase |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | Google Cloud Console → Credentials → API key, restringida por HTTP referrer al dominio del sitio | No — sin esto el mapa muestra un fallback, las coordenadas se guardan igual |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Upstash → crear una base Redis → REST API | Recomendado fuerte |
| `RESEND_API_KEY` | Resend → API Keys | No |
| `RESEND_FROM_EMAIL` | Formato `"Nombre <email@tudominio.com>"`. Sin dominio verificado, se puede usar el sandbox `onboarding@resend.dev` (no apto para producción real) | No |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile — opcional, solo si el honeypot de leads no alcanza | No |
| `IP_HASH_SALT` | Cualquier string largo y secreto, generado una vez (ej. `openssl rand -hex 32`) | Sí en producción — sin esto usa un fallback hardcodeado y público, anulando la anonimización de IP en `leads.ip_hash` |
| `NEXT_PUBLIC_ANALYTICS_ID` | Google Analytics 4 — opcional, solo carga si el visitante acepta la categoría "Analíticas" del banner de cookies | No |
| `GOOGLE_MAPS_GEOCODING_API_KEY` | Google Cloud Console — fallback server-side cuando el link de Maps pegado en el admin no trae coordenadas embebidas | No |

**En Vercel específicamente:** si el dashboard bloquea la creación de una variable `NEXT_PUBLIC_*` con el aviso "Mantenga este valor en privado. El prefijo NEXT_PUBLIC_ expone este valor al navegador" — **no** quitar el prefijo `NEXT_PUBLIC_` (rompe el cliente de Supabase en el browser). Ese aviso aparece cuando la variable quedó marcada como "Sensitive" (encriptada, ilegible después de creada) — para una variable que necesita ir al bundle del cliente, desmarcar "Sensitive" al crearla, o desactivar la política de equipo "Enforce Sensitive Environment Variables" en *Team Settings → Security & Privacy* si está forzada a nivel organización.

### 3.5 Editar `src/config/client.config.ts`

Es el **único archivo** que hace falta tocar para adaptar la identidad de marca — no requiere tocar componentes ni CSS. Editar los valores del objeto `clientConfig`:

- `brand.name`, `brand.legalName`, `brand.tagline`
- `brand.colors` (`accent`, `accentDark`, `ink`, `paper`, `neutral`, en hex) — correr `pnpm dev` o `pnpm build` después de guardar: el script `scripts/sync-theme.mjs` sincroniza automáticamente estos valores hacia los tokens de Tailwind en `src/app/globals.css`, no hace falta tocar ese CSS a mano. Si se quiere forzar la sincronización sin levantar el servidor: `pnpm sync-theme`.
- `brand.fonts` — si se cambia la tipografía, también hay que cargar la fuente nueva en `src/app/layout.tsx` (`next/font`); el nombre acá es solo documentación de lo que ya está cargado.
- `contact.*` — teléfono, email, dirección, redes sociales. `contact.whatsapp` en `null` oculta el botón flotante de WhatsApp por completo (no lo deja roto apuntando a ningún lado) — poner el número en formato E.164 sin "+" (ej. `"521234567890"`) para activarlo.
- `copy.*` — textos del hero, about, zonas de cobertura (`coverageZones`, se muestra en el footer), prompt del formulario de contacto en la ficha.
- `legal.*` — razón social, links a política de privacidad/términos (`null` = el link no se muestra), disclaimer del footer.
- `seo.siteUrl` — el dominio real de producción, **sin barra final**. Actualizar esto cada vez que cambie el dominio (de Vercel a uno propio, por ejemplo) — se usa en metadata, Open Graph y JSON-LD.

Los campos marcados `// TODO(cliente)` en el archivo son los que hay que completar sí o sí antes de salir a producción con un cliente nuevo.

### 3.6 Reemplazar el logo

`src/components/layout/logo.tsx` referencia archivos en `public/brand/` (`logo-mark-positivo.png`, `logo-mark-negativo.png` — versión clara y oscura del ícono de marca). Reemplazar esos archivos manteniendo el aspect ratio (o ajustar `MARK_ASPECT_RATIO` en el componente si cambia). El favicon se referencia por separado en `client.config.ts` (`brand.favicon`) y en `src/app/`.

### 3.7 Deploy en Vercel

1. Conectar el repositorio de GitHub al proyecto de Vercel (*Import Project*).
2. Cargar todas las variables de entorno del paso 3.4 en *Project Settings → Environment Variables* (aplicarlas a Production, y a Preview/Development si se van a usar).
3. La rama de producción por defecto en Vercel es la que esté marcada como *Production Branch* en *Settings → Git* — confirmar que apunta a la rama correcta del repo (en este proyecto, `main`).
4. Deploy. Si tira `MIDDLEWARE_INVOCATION_FAILED` (error 500 en todas las rutas), es casi siempre `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` faltantes o mal cargadas — revisar los logs de runtime del deployment en Vercel, van a mostrar el error real de `createServerClient`.
5. Una vez live, actualizar `seo.siteUrl` en `client.config.ts` con la URL real que asignó Vercel (ej. `https://tu-proyecto.vercel.app`) y actualizar **Site URL** + **Redirect URLs** en Supabase Auth (paso 3.3) para que apunten a esa misma URL — si no, el login con Google y el reset de contraseña van a redirigir a `localhost` o a una URL vieja.

### 3.8 Dominio propio (cuando esté disponible)

1. Comprar el dominio y conectarlo en Vercel (*Project Settings → Domains*).
2. Actualizar `seo.siteUrl` en `client.config.ts` al dominio nuevo.
3. Actualizar Site URL / Redirect URLs en Supabase Auth (paso 3.3) al dominio nuevo.
4. Si se usa Google OAuth, verificar el dominio en Google Search Console y agregarlo a *Authorized domains* del OAuth consent screen (ver 3.3) para que la pantalla de login de Google muestre el nombre de la marca en vez del subdominio de Supabase.
5. Si se configura Resend con dominio propio (paso 3.9), agregar los registros DNS que pida Resend para verificarlo.

### 3.9 Resend + SMTP custom en Supabase (opcional, requiere dominio propio para producción real)

1. Crear cuenta en Resend, generar un `RESEND_API_KEY`.
2. Sin dominio propio: se puede probar con `onboarding@resend.dev` como remitente — no apto para producción, va a spam fácilmente y no es la marca del cliente.
3. Con dominio propio: *Resend → Domains → Add Domain*, agregar los registros DNS (SPF/DKIM) que indique Resend, esperar verificación. Usar `RESEND_FROM_EMAIL="Nombre <noreply@tudominio.com>"`.
4. Opcional — reemplazar el servicio de email por defecto de Supabase Auth (rate-limited, no apto para volumen real) por SMTP custom vía Resend: *Authentication → Settings → SMTP Settings* en Supabase, usar el SMTP relay de Resend con el mismo dominio verificado.

### 3.10 Upstash Redis

1. Crear una base Redis en [upstash.com](https://upstash.com) (tier gratuito alcanza).
2. Copiar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` desde el dashboard de la base (REST API, no la conexión Redis nativa).
3. Cargar ambas en `.env.local` y en Vercel. Sin esto, el rate limiting sigue funcionando en desarrollo pero no protege nada real en producción (cada instancia serverless tiene su propio contador en memoria).

### 3.11 Google Maps

1. Google Cloud Console → habilitar **Maps Embed API**.
2. Crear una API key, restringirla por **HTTP referrer** al dominio del sitio (no por IP — es una clave client-side, va en el `src` del `<iframe>`).
3. Cargarla como `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`.
4. Opcional: habilitar **Geocoding API** y cargar `GOOGLE_MAPS_GEOCODING_API_KEY` (server-side, no restringir por referrer) — mejora la resolución automática de coordenadas cuando el link de Google Maps pegado en el admin no las trae embebidas. Sin esto, el parseo por regex y la carga manual de lat/lng siguen funcionando.

### 3.12 QA final antes de recibir tráfico real

- [ ] `pnpm typecheck && pnpm lint && pnpm build` pasan limpio.
- [ ] Login con email/contraseña y con Google (si está habilitado) funcionan en el dominio real de producción (no redirige a `localhost`).
- [ ] Activar 2FA en una cuenta de prueba y confirmar que el challenge se pide en el próximo login.
- [ ] Crear una propiedad completa (con imágenes, ubicación, comodidades), publicarla, verificar que aparece en el listado público y que la ficha carga bien.
- [ ] Enviar un lead desde el formulario público y confirmar que llega a `/admin/leads`.
- [ ] Probar el flujo de "olvidé mi contraseña" de punta a punta.
- [ ] Revisar el panel admin en mobile (nav, formularios, listados) — ver sección de responsive en `DOCUMENTACION-PROYECTO.md` si hace falta tocar algo.
- [ ] Confirmar que `IP_HASH_SALT` está seteada en producción (no el fallback de desarrollo).
- [ ] Confirmar que Upstash está realmente conectado (revisar logs — sin esto, no hay warning visible salvo el `console.warn` en los logs del servidor).
- [ ] Revisar `get_advisors` de Supabase (seguridad y performance) antes de considerar el proyecto cerrado.

---

## 4. Flujo de trabajo con Git

Este proyecto usa **`develop`** como rama de trabajo diario y **`main`** como rama de producción (la que Vercel despliega). Regla establecida para este proyecto: **todo commit va directo a `develop`, nunca se crea una rama nueva por feature/fix.** Cuando `develop` está listo para salir a producción, se fusiona a `main` (vía PR en GitHub o merge directo) y se pushea — eso dispara el redeploy en Vercel.

Antes de fusionar `develop` → `main`, correr la QA de la sección 3.12 sobre `develop`.

---

## 5. Problemas ya resueltos — referencia rápida

| Síntoma | Causa | Fix |
|---|---|---|
| `MIDDLEWARE_INVOCATION_FAILED`, 500 en todas las rutas tras deployar | Faltan o están mal cargadas `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel | Cargar ambas variables, redeploy |
| Vercel bloquea crear una env var `NEXT_PUBLIC_*` ("Mantenga este valor en privado...") | La variable quedó marcada "Sensitive" (o hay una política de equipo que lo fuerza) | Desmarcar "Sensitive" al crearla, o desactivar "Enforce Sensitive Environment Variables" en Team Settings — **nunca** quitar el prefijo `NEXT_PUBLIC_` como solución |
| Login/reset de contraseña siempre redirige a producción aunque se pida desde `localhost` | `localhost:3000` no está en la lista de Redirect URLs de Supabase Auth — Supabase cae al Site URL por defecto | Agregar `http://localhost:3000/**` a Redirect URLs (Authentication → URL Configuration) |
| Reset de contraseña falla con `otp_expired` | El link de un solo uso ya expiró, ya se usó, o un escáner de seguridad del cliente de correo lo abrió automáticamente antes que el usuario | Pedir un link nuevo y usarlo directo, sin reenviar/reabrir |
| Reset de contraseña iniciado en un dispositivo y abierto en otro siempre falla | Limitación de PKCE — el `code_verifier` queda atado al navegador de origen | Pedir el link y abrirlo en el mismo dispositivo/navegador; no hay fix sin migrar a otro flujo de Auth |
| Pantalla de Google "Selecciona una cuenta" muestra "Ir a `xxxxx.supabase.co`" en vez del nombre de la marca | Comportamiento default de Google cuando el OAuth consent screen no tiene un dominio verificado propio | Verificar dominio en Google Search Console + agregarlo a Authorized domains + publicar la app (ver 3.3) — requiere dominio propio |
| Toggle "Leaked Password Protection" no aparece en el dashboard de Supabase | Feature gateada al plan Pro | Confirmar el plan del proyecto; no es un problema de navegación de la UI |
| `git checkout <rama>` falla con `fatal: not a git repository` | La carpeta `.git` se borró o se corrompió | `git init && git remote add origin <url> && git fetch origin && git symbolic-ref HEAD refs/heads/develop && git update-ref refs/heads/develop origin/develop && git reset` — reconecta el repo sin tocar ningún archivo del working tree |
| Warning de hidratación en consola con atributos `bis_skin_checked` | Extensión del navegador (Bitdefender) inyectando atributos en el DOM antes de que React hidrate | No es un bug del código — probar en incógnito sin extensiones para confirmar |
