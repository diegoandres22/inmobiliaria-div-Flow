"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "@/components/admin/logout-button";

export function MfaChallengeForm() {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFactor() {
      const supabase = createClient();
      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      const verified = data?.totp?.find((f) => f.status === "verified");
      if (listError || !verified) {
        setError("No encontramos un factor de verificación activo en tu cuenta.");
      } else {
        setFactorId(verified.id);
      }
      setReady(true);
    }
    loadFactor();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!factorId || code.length !== 6) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    if (verifyError) {
      setError("Código incorrecto o vencido. Probá de nuevo.");
      setLoading(false);
      return;
    }

    // Hard nav: fuerza a middleware.ts a re-evaluar con la sesión ya en aal2.
    window.location.href = "/admin/propiedades";
  }

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="000000"
        inputMode="numeric"
        maxLength={6}
        autoFocus
        required
        disabled={!factorId}
      />
      {error && (
        <p role="alert" aria-live="assertive" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={!factorId || code.length !== 6 || loading}>
        {loading ? "Verificando..." : "Verificar"}
      </Button>
      <div className="text-center">
        <LogoutButton />
      </div>
    </form>
  );
}
