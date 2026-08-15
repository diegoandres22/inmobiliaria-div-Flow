"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
    } catch {
      // Si la llamada de red a Supabase falla (VPN, conexión inestable),
      // igual queremos sacar al usuario del panel — no dejarlo "logueado"
      // en la UI por un error de red silencioso.
    }
    // Navegación dura (no router.push) a propósito: fuerza al navegador a
    // pedirle todo de cero al servidor, sin depender del router cache de
    // Next para una ruta que antes ya visitó como autenticado.
    window.location.href = "/admin/login";
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loading}>
      <LogOut className="size-4" />
      {loading ? "Saliendo..." : "Cerrar sesión"}
    </Button>
  );
}
