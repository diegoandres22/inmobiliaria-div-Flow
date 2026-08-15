import Link from "next/link";
import type { SVGProps, ReactNode } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { InstagramIcon, FacebookIcon, TiktokIcon } from "@/components/icons/social";
import { clientConfig } from "@/config/client.config";

// Fuente de verdad: src/config/client.config.ts. Regla dura: nunca un link
// roto tipo href="#" — si no hay URL real, el ícono simplemente no se
// renderiza (ver `activeSocial` abajo). Corrige directamente la debilidad de
// enlaces muertos de la referencia.
//
// WhatsApp/correo usan íconos genéricos de lucide-react (MessageCircle es el
// mismo que ya usa WhatsAppCTA en todo el sitio, Mail es el estándar de la
// librería) — Instagram/Facebook/TikTok siguen siendo SVG a mano porque
// lucide-react no tiene íconos de marca (los sacaron de su set).
// Devuelve ReactNode (no JSX.Element) a propósito: los componentes de
// lucide-react son ForwardRefExoticComponent, que retornan ReactNode — un
// tipo más angosto acá rompía la asignación de MessageCircle/Mail.
type SocialIcon = (props: SVGProps<SVGSVGElement>) => ReactNode;

const SOCIAL_LINKS: { label: string; href: string | null; icon: SocialIcon }[] = [
  { label: "Instagram", href: clientConfig.contact.social.instagram, icon: InstagramIcon },
  { label: "Facebook", href: clientConfig.contact.social.facebook, icon: FacebookIcon },
  {
    label: "WhatsApp",
    href: clientConfig.contact.whatsapp
      ? `https://wa.me/${clientConfig.contact.whatsapp}`
      : null,
    icon: MessageCircle,
  },
  {
    label: "Correo",
    href: clientConfig.contact.email ? `mailto:${clientConfig.contact.email}` : null,
    icon: Mail,
  },
  { label: "TikTok", href: clientConfig.contact.social.tiktok, icon: TiktokIcon },
];

const COVERAGE_ZONES: string[] = clientConfig.copy.coverageZones;

export function Footer() {
  const activeSocial = SOCIAL_LINKS.filter(
    (s): s is { label: string; href: string; icon: SocialIcon } => Boolean(s.href),
  );

  return (
    <footer className="border-t border-border bg-brand-ink text-brand-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4 md:px-6">
        <div className="space-y-3">
          <Logo variant="negativo" className="h-8 w-auto" />
          <p className="text-sm text-brand-paper/70">
            {clientConfig.brand.tagline}
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-sm uppercase tracking-wide text-brand-paper/60">
            Navegación
          </h3>
          <nav className="flex flex-col gap-2 text-sm">
            <Link href="/propiedades" className="hover:text-brand-accent">
              Propiedades
            </Link>
            <Link href="/agencias" className="hover:text-brand-accent">
              Agencias
            </Link>
            <Link href="/contacto" className="hover:text-brand-accent">
              Contacto
            </Link>
          </nav>
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-sm uppercase tracking-wide text-brand-paper/60">
            Zonas de cobertura
          </h3>
          {COVERAGE_ZONES.length > 0 ? (
            <ul className="space-y-1 text-sm text-brand-paper/80">
              {COVERAGE_ZONES.map((zone) => (
                <li key={zone}>{zone}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-brand-paper/50">
              Se define en client.config.ts
            </p>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-sm uppercase tracking-wide text-brand-paper/60">
            Seguinos
          </h3>
          {activeSocial.length > 0 ? (
            <div className="flex gap-3">
              {activeSocial.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-full bg-brand-paper/10 hover:bg-brand-accent hover:text-brand-accent-dark"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-brand-paper/50">
              Sin redes configuradas todavía
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-brand-paper/10 px-4 py-4 text-center text-xs text-brand-paper/50 md:px-6">
        © {new Date().getFullYear()} {clientConfig.legal.companyName}.{" "}
        {clientConfig.legal.footerDisclaimer}
      </div>
    </footer>
  );
}
