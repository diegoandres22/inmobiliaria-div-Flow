import type { Metadata } from "next";
import Image from "next/image";
import { Mail, Phone } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppCTA } from "@/components/layout/whatsapp-cta";
import { getAgenciesWithAgents } from "@/lib/queries/get-agencies";
import { clientConfig } from "@/config/client.config";

export const metadata: Metadata = {
  title: "Agencias",
  description: "Las agencias y agentes que publican en la red.",
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default async function AgenciesPage() {
  const agencies = await getAgenciesWithAgents();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:px-6 md:py-14">
        <p className="mb-1 text-xs font-medium tracking-[0.2em] text-brand-accent-dark uppercase">
          Red DivFlow
        </p>
        <h1 className="font-heading text-2xl text-foreground md:text-3xl">
          Agencias
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Agencias y agentes que publican propiedades en la red.
        </p>

        {agencies.length === 0 ? (
          <p className="mt-8 rounded-[var(--radius)] border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            Todavía no hay agencias cargadas.
          </p>
        ) : (
          <div className="mt-8 space-y-10">
            {agencies.map((agency) => (
              <section key={agency.id}>
                <h2 className="font-heading text-lg text-foreground">
                  {agency.name}
                </h2>
                {agency.agents.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sin agentes cargados todavía.
                  </p>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {agency.agents.map((agent) => (
                      <div
                        key={agent.id}
                        className="flex items-start gap-3 rounded-[var(--radius)] border border-border bg-background p-4"
                      >
                        {agent.photoPath ? (
                          <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-brand-neutral">
                            <Image
                              src={agent.photoPath}
                              alt={agent.name}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-neutral font-heading text-sm text-brand-ink">
                            {initials(agent.name)}
                          </div>
                        )}
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            {agent.name}
                          </p>
                          <a
                            href={`mailto:${agent.email}`}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand-accent-dark"
                          >
                            <Mail className="size-3.5 shrink-0" />
                            <span className="truncate">{agent.email}</span>
                          </a>
                          {agent.phone && (
                            <a
                              href={`tel:${agent.phone}`}
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand-accent-dark"
                            >
                              <Phone className="size-3.5 shrink-0" />
                              {agent.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
      <Footer />
      <WhatsAppCTA phoneNumber={clientConfig.contact.whatsapp ?? undefined} />
    </div>
  );
}
