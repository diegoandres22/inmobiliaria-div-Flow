import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAgent } from "@/lib/queries/get-current-agent";
import { MfaEnroll } from "@/components/admin/mfa-enroll";

// Verificación en dos pasos (TOTP) — opcional, cada agente decide activarla
// para su propia cuenta. Nadie queda bloqueado por defecto: solo quien
// activa un factor acá pasa a necesitar el código de 6 dígitos en el
// próximo login (ver middleware.ts + /admin/mfa-challenge).
export default async function MiCuentaPage() {
  const agent = await getCurrentAgent();
  if (!agent) redirect("/admin/login");

  const supabase = await createClient();
  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const totpFactor = factorsData?.totp?.find((f) => f.status === "verified") ?? null;

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="font-heading text-xl text-foreground">Mi cuenta</h1>
        <p className="text-sm text-muted-foreground">
          {agent.name} · {agent.email}
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="font-heading text-base text-foreground">
          Verificación en dos pasos
        </h2>
        <p className="text-sm text-muted-foreground">
          Agrega un código de tu app de autenticación (Google Authenticator,
          Authy, etc.) además de tu contraseña. Es opcional — activala solo
          si querés esa capa extra en tu cuenta.
        </p>
        <MfaEnroll
          initialFactor={
            totpFactor
              ? { id: totpFactor.id, friendlyName: totpFactor.friendly_name ?? null }
              : null
          }
        />
      </div>
    </div>
  );
}
