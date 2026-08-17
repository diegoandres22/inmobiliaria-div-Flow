import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppCTA } from "@/components/layout/whatsapp-cta";
import { LegalSimulationNotice } from "@/components/legal/simulation-notice";
import { clientConfig } from "@/config/client.config";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: `Cómo tratamos tus datos personales en ${clientConfig.brand.name}.`,
};

// Modo demo (Venezuela) — el mecanismo (consentimiento de cookies, RLS,
// derechos de acceso, etc.) ya está implementado y descrito con precisión.
// Los datos de identificación (razón social, RIF, domicilio) salen de
// client.config.ts y son de simulación. El texto en sí es una plantilla
// razonable para el contexto legal venezolano actual (ver nota sobre marco
// normativo más abajo), pero no reemplaza la redacción de un abogado antes
// de operar con datos de usuarios reales.
export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 md:px-6 md:py-16">
        <p className="mb-1 text-xs font-medium tracking-[0.2em] text-brand-accent-dark uppercase">
          Legal
        </p>
        <h1 className="font-heading text-2xl text-foreground md:text-3xl">
          Política de Privacidad
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última actualización: {new Date().toLocaleDateString("es")}
        </p>

        <div className="mt-6">
          <LegalSimulationNotice />
        </div>

        <div className="space-y-8 text-sm text-foreground">
          <section className="space-y-2">
            <h2 className="font-heading text-base">Quiénes somos</h2>
            <p className="text-muted-foreground">
              {clientConfig.legal.companyName} ({clientConfig.brand.name}),
              RIF {clientConfig.legal.taxId}, con domicilio en{" "}
              {clientConfig.legal.registeredAddress}, opera este sitio como
              portal inmobiliario multi-agencia. Podés contactarnos en{" "}
              {clientConfig.contact.email}.
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
            <h2 className="font-heading text-base">
              Marco legal aplicable (Venezuela)
            </h2>
            <p className="text-muted-foreground">
              Venezuela todavía no cuenta con una ley orgánica de protección
              de datos personales equivalente al RGPD europeo o a las leyes
              de países vecinos (México, Colombia, Argentina). El respaldo
              normativo actual surge de la Constitución de la República
              Bolivariana de Venezuela: el artículo 28 reconoce el derecho de
              toda persona a acceder a la información que sobre sí misma
              conste en registros públicos o privados, y a conocer el uso que
              se hace de ella; el artículo 60 garantiza el derecho al honor,
              la vida privada, la intimidad, la propia imagen, la
              confidencialidad y la reputación. Complementariamente aplica la
              Ley Especial contra los Delitos Informáticos en lo que
              respecta al uso indebido de sistemas y datos.
            </p>
            <p className="text-muted-foreground">
              Mientras no exista una ley específica que lo exija, los
              compromisos de esta sección (acceso, corrección, eliminación)
              son un compromiso voluntario de {clientConfig.brand.name},
              alineado con buenas prácticas internacionales — no una
              enumeración de derechos ARCO reconocidos por una ley
              venezolana específica.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base">Tus derechos</h2>
            <p className="text-muted-foreground">
              Podés pedirnos acceder, corregir o eliminar los datos
              personales que tenemos sobre vos escribiéndonos a{" "}
              {clientConfig.contact.email}. Vamos a responder tu pedido en un
              plazo razonable, sin costo para vos.
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
    </div>
  );
}
