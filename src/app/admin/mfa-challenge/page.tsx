import { MfaChallengeForm } from "@/components/admin/mfa-challenge-form";

// Paso intermedio para agentes que activaron 2FA: middleware.ts redirige
// acá cuando detecta aal1 (contraseña ya validada) pero aal2 pendiente
// (falta el código de 6 dígitos). Vive fuera de (dashboard) a propósito —
// esa layout exige la sesión completa via getCurrentAgent(), y acá todavía
// no la tenemos del todo.
export default function MfaChallengePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-neutral p-4">
      <div className="w-full max-w-sm space-y-6 rounded-[var(--radius)] border border-border bg-background p-8 shadow-sm">
        <div>
          <p className="font-heading text-lg text-foreground">
            Verificación en dos pasos
          </p>
          <p className="text-sm text-muted-foreground">
            Ingresá el código de 6 dígitos de tu app de autenticación.
          </p>
        </div>
        <MfaChallengeForm />
      </div>
    </div>
  );
}
