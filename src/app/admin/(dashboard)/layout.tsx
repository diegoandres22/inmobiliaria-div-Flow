import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { LogoutButton } from "@/components/admin/logout-button";
import { AdminMobileNav } from "@/components/admin/mobile-nav";
import { getCurrentAgent } from "@/lib/queries/get-current-agent";

function agentInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

// Antes esto asumía que middleware.ts ya había cortado el paso sin sesión y
// solo resolvía el agente para el shell visual. Pero el layout SIEMPRE debe
// verificar por su cuenta: es el único punto que envuelve a todas las
// páginas de /admin (dashboard, propiedades, leads, agentes), así que es acá
// donde tiene que vivir la garantía real de "sin agente válido no se
// renderiza nada de esto" — sin depender de un único chequeo upstream.
export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const agent = await getCurrentAgent();

  if (!agent) {
    redirect("/admin/login");
  }

  // Única fuente de verdad para los links del nav — se usa tanto en el nav
  // horizontal de escritorio como en el drawer de mobile, para que agregar o
  // sacar una sección no requiera tocar dos listas por separado.
  const navLinks = [
    { href: "/admin/propiedades", label: "Propiedades" },
    { href: "/admin/leads", label: "Leads" },
    ...(agent.isSuperAgent
      ? [
          { href: "/admin/agentes", label: "Agentes" },
          { href: "/admin/auditoria", label: "Auditoría" },
        ]
      : []),
    { href: "/admin/mi-cuenta", label: "Mi cuenta" },
  ];

  return (
    <div className="min-h-screen bg-brand-neutral">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <AdminMobileNav links={navLinks} />
            <Link href="/admin" className="flex shrink-0 items-center gap-2">
              <Logo className="h-7 w-auto" />
              <span className="hidden text-sm text-muted-foreground sm:inline">
                / admin
              </span>
            </Link>
            {/* Oculto en mobile (sm:flex) — ahí la navegación vive en el
                drawer de AdminMobileNav. En escritorio sigue siendo el nav
                horizontal de siempre. */}
            <nav className="hidden items-center gap-3 text-sm font-medium whitespace-nowrap text-foreground sm:flex sm:gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-brand-accent-dark"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {/* Confirmación visual de que la foto subida en "Mi cuenta"
                efectivamente se aplicó — sin esto, un agente podía subir una
                foto y nunca verla reflejada en ningún lado del panel. */}
            <Link
              href="/admin/mi-cuenta"
              aria-label="Mi cuenta"
              className="block size-8 shrink-0 overflow-hidden rounded-full border border-border"
            >
              {agent.photoUrl ? (
                <div className="relative size-full">
                  <Image
                    src={agent.photoUrl}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex size-full items-center justify-center bg-brand-neutral font-heading text-xs text-brand-ink">
                  {agentInitials(agent.name)}
                </div>
              )}
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
