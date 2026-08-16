"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/social";
import { createClient } from "@/lib/supabase/client";
import { signInWithPassword } from "@/app/admin/login/actions";

// Mensajes para el ?error= de la URL — no solo de Google, también cubre el
// logout forzado por inactividad que hace middleware.ts.
const URL_ERROR_MESSAGES: Record<string, string> = {
  not_authorized:
    "Esa cuenta de Google no está autorizada — pedile a un super-agente que te dé de alta primero.",
  oauth: "No pudimos completar el login con Google. Probá de nuevo.",
  inactivity: "Tu sesión expiró por inactividad. Volvé a iniciar sesión.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const justReset = searchParams.get("reset") === "1";

  const [error, setError] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // El intento de login ahora pasa por un Server Action (signInWithPassword
  // en admin/login/actions.ts) en vez de llamar a Supabase directo desde el
  // cliente — así se puede aplicar rate limiting agresivo (8 intentos / 15
  // min por IP) antes de que el intento llegue a Supabase, y el Server
  // Action redirige él mismo en éxito (next/navigation redirect()).
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signInWithPassword(formData);
      if (result?.error) setError(result.error);
    });
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/admin/auth/callback` },
    });
    // No hace falta setGoogleLoading(false): signInWithOAuth navega fuera
    // de la página (a Google) si todo sale bien.
  }

  const displayedError =
    error ?? (oauthError ? URL_ERROR_MESSAGES[oauthError] ?? URL_ERROR_MESSAGES.oauth : null);

  return (
    <div className="space-y-4">
      {justReset && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-[var(--radius)] border border-brand-accent bg-brand-neutral p-3 text-sm text-foreground"
        >
          Contraseña actualizada — iniciá sesión con la nueva.
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={googleLoading}
        onClick={handleGoogleLogin}
      >
        <GoogleIcon className="size-4" />
        {googleLoading ? "Redirigiendo..." : "Continuar con Google"}
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">o con email</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input name="email" type="email" placeholder="Email" required />
        <div className="relative">
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            required
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {displayedError && (
          <p role="alert" aria-live="assertive" className="text-sm text-destructive">
            {displayedError}
          </p>
        )}
        <div className="text-right">
          <Link
            href="/admin/olvide-password"
            className="text-xs text-muted-foreground hover:text-brand-accent-dark"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>
    </div>
  );
}
