import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAgent } from "@/lib/queries/get-current-agent";
import { MfaEnroll } from "@/components/admin/mfa-enroll";
import { AvatarUpload } from "@/components/admin/avatar-upload";
import { ChangePasswordForm } from "@/components/admin/change-password-form";

// Orden pensado para un agente no técnico: primero lo más visual/simple
// (foto), después lo más importante para seguridad de la cuenta (contraseña),
// y al final lo opcional/avanzado (2FA) — de lo más liviano a lo más
// sensible, no alfabético ni por orden de implementación.
export default async function MiCuentaPage() {
  const agent = await getCurrentAgent();
  if (!agent) redirect("/admin/login");

  const supabase = await createClient();
  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const totpFactor = factorsData?.totp?.find((f) => f.status === "verified") ?? null;

  // Todo agente se crea con una contraseña (ver agentes/actions.ts), pero si
  // esta sesión se autenticó con Google y nunca con password, el agente no
  // conoce esa contraseña — pedirle "la actual" para cambiarla es un
  // callejón sin salida. Se mira el `amr` de la sesión (qué métodos se
  // usaron para autenticarla, no si el usuario "tiene" o no una contraseña
  // en la base): si aparece "oauth" y en ningún momento "password", esta
  // sesión entró solo por Google.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  // El tipo de supabase-js para cada entrada es `string | AMREntry` (no
  // siempre viene como objeto) — se contempla el caso string directo además
  // del objeto {method, timestamp}.
  const authMethods =
    aal?.currentAuthenticationMethods?.map((m) => (typeof m === "string" ? m : m.method)) ?? [];
  const loggedInWithGoogleOnly =
    authMethods.includes("oauth") && !authMethods.includes("password");

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="font-heading text-xl text-foreground">Mi cuenta</h1>
        <p className="text-sm text-muted-foreground">
          {agent.name} · {agent.email}
        </p>
      </div>

      <div className="space-y-3 border-t border-border pt-6">
        <AvatarUpload name={agent.name} initialUrl={agent.photoUrl} />
      </div>

      <div className="space-y-3 border-t border-border pt-6">
        <h2 className="font-heading text-base text-foreground">
          Contraseña
        </h2>
        {loggedInWithGoogleOnly ? (
          <div className="space-y-2 rounded-[var(--radius)] border border-dashed border-border bg-brand-neutral p-4 text-sm text-muted-foreground">
            <p>Entraste con tu cuenta de Google — no hace falta contraseña.</p>
            <p>
              Si igual querés poder entrar con contraseña además de Google,{" "}
              <Link
                href="/admin/olvide-password"
                className="font-medium text-brand-accent-dark hover:underline"
              >
                creá una desde acá
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Para cambiarla necesitás tu contraseña actual. Te mandamos un
              email de confirmación cada vez que cambia, y cerramos cualquier
              otra sesión abierta en otros dispositivos.
            </p>
            <ChangePasswordForm />
          </>
        )}
      </div>

      <div className="space-y-3 border-t border-border pt-6">
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
