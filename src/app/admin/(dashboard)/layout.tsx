import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { LogoutButton } from "@/components/admin/logout-button";
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

  return (
    <div className="min-h-screen bg-brand-neutral">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <Link href="/admin" className="flex shrink-0 items-center gap-2">
              <Logo className="h-7 w-auto" />
              <span className="hidden text-sm text-muted-foreground sm:inline">
                / admin
              </span>
            </Link>
            {/* Antes este nav estaba oculto por completo debajo de sm (640px)
                y no había ningún menú alternativo — en mobile no se podía
                llegar a Propiedades/Leads/Agentes desde acá. Ahora siempre
                visible, con overflow-x-auto como red de seguridad si algún
                día hay más de 3-4 links y no entran en una fila. */}
            <nav className="flex items-center gap-3 overflow-x-auto text-sm font-medium whitespace-nowrap text-foreground sm:gap-4">
              <Link href="/admin/propiedades" className="hover:text-brand-accent-dark">
                Propiedades
              </Link>
              <Link href="/admin/leads" className="hover:text-brand-accent-dark">
                Leads
              </Link>
              {agent?.isSuperAgent && (
                <Link href="/admin/agentes" className="hover:text-brand-accent-dark">
                  Agentes
                </Link>
              )}
              {agent?.isSuperAgent && (
                <Link href="/admin/auditoria" className="hover:text-brand-accent-dark">
                  Auditoría
                </Link>
              )}
              <Link href="/admin/mi-cuenta" className="hover:text-brand-accent-dark">
                Mi cuenta
              </Link>
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
