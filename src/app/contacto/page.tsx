import type { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppCTA } from "@/components/layout/whatsapp-cta";
import { GeneralLeadForm } from "@/components/contact/general-lead-form";
import { clientConfig } from "@/config/client.config";

export const metadata: Metadata = {
  title: "Contacto",
  description: `Escribinos — ${clientConfig.brand.tagline}`,
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium tracking-[0.2em] text-brand-accent-dark uppercase">
              Hablemos
            </p>
            <h1 className="font-heading text-2xl text-foreground md:text-3xl">
              Contacto
            </h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              ¿Buscás publicar una propiedad o tenés una consulta general?
              Escribinos y te respondemos a la brevedad.
            </p>

            <div className="mt-8 space-y-4 text-sm text-foreground">
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-brand-accent-dark" />
                {clientConfig.contact.email}
              </div>
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-brand-accent-dark" />
                {clientConfig.contact.phone}
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="size-4 text-brand-accent-dark" />
                {clientConfig.contact.address}
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius)] border border-border bg-background p-6 shadow-sm">
            <GeneralLeadForm />
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppCTA phoneNumber={clientConfig.contact.whatsapp ?? undefined} />
    </>
  );
}
