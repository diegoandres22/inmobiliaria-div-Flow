import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppCTA } from "@/components/layout/whatsapp-cta";
import { CookiePreferencesTrigger } from "@/components/cookies/cookie-preferences-trigger";
import { LegalSimulationNotice } from "@/components/legal/simulation-notice";
import { COOKIE_REGISTRY } from "@/lib/cookies/registry";
import { clientConfig } from "@/config/client.config";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: `Qué cookies usa ${clientConfig.brand.name} y para qué.`,
};

const CATEGORY_DESCRIPTION: Record<string, string> = {
  Esenciales: "Necesarias para que el sitio funcione. No se pueden desactivar.",
  Funcionales: "Mejoran tu experiencia recordando preferencias no esenciales.",
  Analíticas: "Nos ayudan a entender el uso del sitio de forma agregada.",
  Marketing: "Permiten mostrar publicidad más relevante en otros sitios.",
};

// La tabla de cookies sale de src/lib/cookies/registry.ts — es la misma
// fuente que usa el banner de consentimiento, así que esta página nunca
// puede quedar desactualizada respecto a lo que el código realmente hace.
export default function CookiesPolicyPage() {
  const grouped = COOKIE_REGISTRY.reduce<Record<string, typeof COOKIE_REGISTRY>>(
    (acc, entry) => {
      (acc[entry.category] ??= []).push(entry);
      return acc;
    },
    {},
  );

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
        <p className="mb-1 text-xs font-medium tracking-[0.2em] text-brand-accent-dark uppercase">
          Legal
        </p>
        <h1 className="font-heading text-2xl text-foreground md:text-3xl">
          Política de Cookies
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última actualización: {new Date().toLocaleDateString("es")}
        </p>

        <div className="mt-6">
          <LegalSimulationNotice />
        </div>

        <div className="space-y-8 text-sm text-foreground">
          <section className="space-y-2">
            <h2 className="font-heading text-base">Qué es una cookie</h2>
            <p className="text-muted-foreground">
              Un archivo pequeño que se guarda en tu navegador para recordar
              información entre visitas. Podés gestionar tus preferencias en
              cualquier momento desde{" "}
              <CookiePreferencesTrigger />.
            </p>
            <p className="text-muted-foreground">
              Venezuela no tiene hoy una ley específica sobre cookies
              equivalente a la directiva ePrivacy europea. Igual pedimos tu
              consentimiento explícito antes de activar cualquier cookie que
              no sea estrictamente necesaria para que el sitio funcione — es
              una buena práctica que aplicamos de forma voluntaria,
              alineada con el derecho de acceso a la información propia que
              reconoce el artículo 28 de la Constitución.
            </p>
          </section>

          {Object.entries(grouped).map(([category, entries]) => (
            <section key={category} className="space-y-3">
              <div>
                <h2 className="font-heading text-base">{category}</h2>
                <p className="text-muted-foreground">
                  {CATEGORY_DESCRIPTION[category]}
                </p>
              </div>
              <div className="overflow-x-auto rounded-[var(--radius)] border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-neutral text-muted-foreground">
                    <tr>
                      <th className="p-2.5 font-medium">Cookie</th>
                      <th className="p-2.5 font-medium">Finalidad</th>
                      <th className="p-2.5 font-medium">Duración</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {entries.map((entry) => (
                      <tr key={entry.name}>
                        <td className="p-2.5 font-mono text-foreground">{entry.name}</td>
                        <td className="p-2.5 text-muted-foreground">{entry.purpose}</td>
                        <td className="p-2.5 text-muted-foreground whitespace-nowrap">
                          {entry.duration}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
      <WhatsAppCTA phoneNumber={clientConfig.contact.whatsapp ?? undefined} />
    </>
  );
}
