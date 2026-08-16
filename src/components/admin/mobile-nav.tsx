"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavLink {
  href: string;
  label: string;
}

// Reemplaza el viejo "overflow-x-auto" del nav de escritorio en mobile —
// scrollear un nav horizontal a los tumbos no es un patrón de navegación
// reconocible, y con 5 links (Propiedades/Leads/Agentes/Auditoría/Mi cuenta)
// tampoco entraban igual. Un ítem de menú estándar (hamburguesa → drawer) es
// el patrón esperado en mobile: descubrible, con área de toque >=44px por
// link, y reutiliza Sheet (Radix Dialog) en vez de un dropdown armado a mano
// — foco atrapado, cierre con Escape/click afuera y roles ARIA correctos
// vienen gratis del primitive, no hay que reinventarlos.
export function AdminMobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 sm:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle>Menú</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col px-2 pb-4">
          {links.map((link) => (
            // SheetClose asChild: clickear el link navega Y cierra el
            // drawer en el mismo gesto — sin esto, quedaba abierto tapando
            // la página de destino hasta que el usuario lo cerrara a mano.
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className="rounded-[var(--radius)] px-3 py-3 text-sm font-medium text-foreground hover:bg-brand-neutral active:bg-brand-neutral"
              >
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
