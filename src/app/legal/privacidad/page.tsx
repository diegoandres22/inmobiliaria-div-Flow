import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppCTA } from "@/components/layout/whatsapp-cta";
import { clientConfig } from "@/config/client.config";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: `Cómo tratamos tus datos personales en ${clientConfig.brand.name}.`,
};

// Texto de referencia — el mecanismo (consentimiento de cookies, RLS,
// derechos ARCO, etc.) ya está implementado y descrito con precisión. El
// texto legal definitivo (base normativa exacta, plazos, datos del
// responsable inscrito) queda marcado [PENDIENTE DE REVISIÓN LEGAL] y no
// debe publicarse sin que lo confirme un abogado o el cliente.
export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
        <p className="mb-1 text-xs font-medium tracking-[0.2em] text-brand-accent-dark uppercase">
          Legal
        </p>
        <h1 className="font-heading text-2xl text-foreground md:text-3xl">
          Política de Privacidad
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última actualización: {new Date().toLocaleDateString("es")}
        </p>

        <div className="mt-8 space-y-8 text-sm text-foreground">
          <section className="space-y-2">
            <h2 className="font-heading text-base">Quiénes somos</h2>
            <p className="text-muted-foreground">
              {clientConfig.legal.companyName} ({clientConfig.brand.name}) opera este
              sitio como portal inmobiliario multi-agencia. Podés contactarnos en{" "}
              {clientConfig.contact.email}.
            </p>
            <p className="rounded-[var(--radius)] border border-warning bg-warning-bg p-3 text-xs text-warning-foreground">
              [PENDIENTE DE REVISIÓN LEGAL]: razón social exacta, CUIT/RFC/NIT,
              domicilio legal y datos de inscripción registral correspondientes
              a la jurisdicción real de operación.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base">Qué datos recolectamos</h2>
            <p className="text-muted-foreground">
              Cuando usás el formulario de contacto o el de una propiedad
              puntual, recolectamos nombre, email, teléfono (opcional) y el
              mensaje que escribís. Si marcás propiedades como favoritas sin
              iniciar sesión, generamos un identificador de sesión anónimo
              (no asociado a tu identidad) para recordarlas. Si sos agente y
              accedés al panel de administración, tratamos tu email y las
              acciones que realizás (quedan en un registro de auditoría
              interno).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base">Con qué fin las usamos</h2>
            <p className="text-muted-foreground">
              Para responder tus consultas, ponerte en contacto con el agente
              correspondiente, recordar tus favoritos, y — solo si diste tu
              consentimiento — para medir el uso del sitio con fines
              analíticos. Nunca vendemos tus datos a terceros.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base">Con quién los compartimos</h2>
            <p className="text-muted-foreground">
              Con el agente/agencia dueño de la propiedad que consultaste (para
              que pueda responderte), y con nuestros proveedores de
              infraestructura (hosting, base de datos) que procesan los datos
              en nuestro nombre bajo sus propios acuerdos de confidencialidad.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base">Tus derechos</h2>
            <p className="text-muted-foreground">
              Podés pedirnos acceder, corregir o eliminar tus datos personales
              escribiéndonos a {clientConfig.contact.email}.
            </p>
            <p className="rounded-[var(--radius)] border border-warning bg-warning-bg p-3 text-xs text-warning-foreground">
              [PENDIENTE DE REVISIÓN LEGAL]: enumerar los derechos exactos
              (acceso, rectificación, cancelación, oposición / portabilidad,
              limitación) según la normativa aplicable (GDPR, LGPD, LFPDPPP,
              etc. según el país de operación real), y el plazo de respuesta
              legal correspondiente.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base">Cookies</h2>
            <p className="text-muted-foreground">
              Usamos cookies propias y, si lo permitís, de terceros. El
              detalle completo está en nuestra{" "}
              <a href="/legal/cookies" className="underline hover:text-brand-accent-dark">
                Política de Cookies
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
      <WhatsAppCTA phoneNumber={clientConfig.contact.whatsapp ?? undefined} />
    </>
  );
}
