import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppCTA } from "@/components/layout/whatsapp-cta";
import { LegalSimulationNotice } from "@/components/legal/simulation-notice";
import { clientConfig } from "@/config/client.config";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: `Términos de uso del sitio de ${clientConfig.brand.name}.`,
};

// Modo demo (Venezuela) — no existía ninguna página de Términos y
// Condiciones antes de esto (solo Privacidad y Cookies). El texto describe
// con precisión cómo funciona el sitio realmente (portal multi-agencia,
// DivFlow no es parte de la operación inmobiliaria en sí), con datos de
// identificación de simulación desde client.config.ts. No reemplaza la
// redacción de un abogado antes de operar con un cliente real.
export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
        <p className="mb-1 text-xs font-medium tracking-[0.2em] text-brand-accent-dark uppercase">
          Legal
        </p>
        <h1 className="font-heading text-2xl text-foreground md:text-3xl">
          Términos y Condiciones
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última actualización: {new Date().toLocaleDateString("es")}
        </p>

        <div className="mt-6">
          <LegalSimulationNotice />
        </div>

        <div className="space-y-8 text-sm text-foreground">
          <section className="space-y-2">
            <h2 className="font-heading text-base">1. Aceptación de estos términos</h2>
            <p className="text-muted-foreground">
              Al usar este sitio (búsqueda de propiedades, favoritos,
              comparador, formularios de contacto, o el panel de
              administración si sos agente), aceptás estos Términos y
              Condiciones y nuestra{" "}
              <a href="/legal/privacidad" className="underline hover:text-brand-accent-dark">
                Política de Privacidad
              </a>
              . Si no estás de acuerdo, te pedimos que no uses el sitio.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base">2. Qué es {clientConfig.brand.name}</h2>
            <p className="text-muted-foreground">
              {clientConfig.legal.companyName} (RIF {clientConfig.legal.taxId}
              ), con domicilio en {clientConfig.legal.registeredAddress},
              opera {clientConfig.brand.name} como un portal tecnológico que
              conecta a personas interesadas en comprar o alquilar
              propiedades con agencias y agentes inmobiliarios
              independientes. {clientConfig.brand.name}{" "}
              <strong>no es parte</strong> de ninguna operación de compra,
              venta o alquiler que se acuerde entre un usuario y una agencia
              — actuamos únicamente como intermediario tecnológico que
              facilita el contacto.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base">3. Cuentas de agente y panel de administración</h2>
            <p className="text-muted-foreground">
              El acceso al panel de administración (<code>/admin</code>) es
              exclusivo para agentes dados de alta por un super-agente de la
              red — no hay registro público de cuentas. Cada agente es
              responsable de la veracidad de la información que publica
              sobre sus propiedades, y de mantener la confidencialidad de sus
              credenciales de acceso (incluyendo, si lo activó, su segundo
              factor de autenticación).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base">4. Uso permitido</h2>
            <p className="text-muted-foreground">
              Te pedimos usar el sitio de buena fe: no intentar acceder sin
              autorización a cuentas o datos de terceros, no extraer datos de
              forma masiva y automatizada (scraping) sin nuestro
              consentimiento previo, no usar los formularios de contacto para
              enviar spam o contenido malicioso, y no intentar vulnerar las
              medidas de seguridad del sitio.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base">5. Contenido publicado por agencias y agentes</h2>
            <p className="text-muted-foreground">
              La información de cada propiedad (precio, características,
              fotos, ubicación) es cargada y actualizada por la agencia o el
              agente correspondiente, quien es responsable de que sea exacta
              y esté vigente. {clientConfig.brand.name} modera la
              publicación (estados borrador/publicada/pausada/archivada) pero
              no verifica de forma independiente cada dato cargado — te
              recomendamos confirmar los detalles importantes directamente
              con el agente antes de tomar una decisión.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base">6. Propiedad intelectual</h2>
            <p className="text-muted-foreground">
              El diseño, la marca {clientConfig.brand.name} y el software del
              sitio son propiedad de {clientConfig.legal.companyName}. Las
              fotos y descripciones de cada propiedad son propiedad de la
              agencia o el agente que las publicó.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base">7. Limitación de responsabilidad</h2>
            <p className="text-muted-foreground">
              {clientConfig.brand.name} se ofrece &quot;tal cual&quot;. No
              garantizamos que el sitio esté disponible de forma
              ininterrumpida, ni la exactitud absoluta de la información
              publicada por terceros (agencias/agentes). No somos
              responsables por acuerdos, negociaciones o transacciones que
              resulten del contacto entre un usuario y una agencia — esa
              relación es exclusivamente entre ellos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base">8. Modificaciones</h2>
            <p className="text-muted-foreground">
              Podemos actualizar estos Términos en cualquier momento. Los
              cambios importantes se van a reflejar con una nueva fecha de
              &quot;Última actualización&quot; arriba. El uso continuado del
              sitio después de un cambio implica que lo aceptás.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base">9. Ley aplicable y jurisdicción</h2>
            <p className="text-muted-foreground">
              Estos Términos se rigen por las leyes de la República
              Bolivariana de Venezuela. Cualquier controversia que no pueda
              resolverse de forma directa se someterá a los tribunales
              competentes de Caracas, Venezuela, con renuncia expresa a
              cualquier otro fuero.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base">10. Contacto</h2>
            <p className="text-muted-foreground">
              Para consultas sobre estos Términos, escribinos a{" "}
              {clientConfig.contact.email}.
            </p>
          </section>
        </div>
      </main>
      <Footer />
      <WhatsAppCTA phoneNumber={clientConfig.contact.whatsapp ?? undefined} />
    </>
  );
}
