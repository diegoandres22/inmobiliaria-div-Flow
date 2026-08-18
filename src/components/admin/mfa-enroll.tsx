"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface ActiveFactor {
  id: string;
  friendlyName: string | null;
}

// Enrolar TOTP es un flujo de 2 pasos en la API de Supabase:
//   1. mfa.enroll() -> te da un QR + secret, el factor queda "unverified".
//   2. mfa.challengeAndVerify() con el primer código de 6 dígitos que
//      genera la app -> recién ahí el factor pasa a "verified" y empieza a
//      exigirse en el próximo login (ver middleware.ts).
// Si el usuario cierra la pantalla entre el paso 1 y 2, el factor queda a
// medio activar — no molesta (no se exige hasta estar "verified"), pero
// Supabase no deja crear dos factores con el mismo nombre, así que antes de
// reintentar limpiamos cualquier factor "unverified" previo.
export function MfaEnroll({ initialFactor }: { initialFactor: ActiveFactor | null }) {
  const [factor, setFactor] = useState(initialFactor);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Desactivar 2FA pide el código vigente, no solo un "¿estás seguro?" — es
  // una acción de seguridad sensible, re-autentica antes de bajar la guardia
  // de la cuenta aunque la sesión ya esté aal2 desde el login.
  const [disabling, setDisabling] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [disableError, setDisableError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleStartEnroll() {
    setError(null);
    setEnrolling(true);
    const supabase = createClient();

    // Limpieza best-effort de intentos anteriores sin verificar. `totp` en
    // listFactors() solo trae factores YA verificados — los pendientes de
    // verificar solo aparecen en `all`, por eso se filtra ahí.
    const { data: existing } = await supabase.auth.mfa.listFactors();
    for (const f of existing?.all ?? []) {
      if (f.factor_type === "totp" && f.status === "unverified") {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
    }

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
    });

    if (enrollError || !data) {
      // No mostramos enrollError.message crudo — es el mensaje de la API de
      // Supabase Auth, en inglés y sin traducir (ver DOCUMENTACION-PROYECTO.md
      // sección 8, mensajes de error). Queda logueado para diagnosticar.
      if (enrollError) console.error("[mfa.enroll]", enrollError.message);
      setError("No se pudo iniciar la activación. Probá de nuevo en unos segundos.");
      setEnrolling(false);
      return;
    }

    setPendingFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
  }

  function handleVerify() {
    if (!pendingFactorId || code.length !== 6) return;
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: pendingFactorId,
        code,
      });

      if (verifyError) {
        setError("Código incorrecto o vencido. Probá de nuevo.");
        return;
      }

      setFactor({ id: pendingFactorId, friendlyName: null });
      setQrCode(null);
      setSecret(null);
      setPendingFactorId(null);
      setCode("");
      setEnrolling(false);
      toast.success("Verificación en dos pasos activada.");
    });
  }

  function handleDisableSubmit() {
    if (!factor || disableCode.length !== 6) return;
    setDisableError(null);
    startTransition(async () => {
      const supabase = createClient();
      // challengeAndVerify primero: confirma que quien está en el teclado
      // ahora mismo sigue teniendo la app de autenticación en mano, no solo
      // una sesión de navegador que quedó abierta. Recién si el código es
      // válido se pide el unenroll.
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factor.id,
        code: disableCode,
      });
      if (verifyError) {
        setDisableError("Código incorrecto o vencido. Probá de nuevo.");
        return;
      }

      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });
      if (unenrollError) {
        console.error("[mfa.unenroll]", unenrollError.message);
        const message = "No se pudo desactivar. Probá de nuevo en unos segundos.";
        setDisableError(message);
        toast.error(message);
        return;
      }
      setFactor(null);
      setDisabling(false);
      setDisableCode("");
      toast.success("Verificación en dos pasos desactivada.");
    });
  }

  if (factor) {
    if (disabling) {
      return (
        <div className="space-y-3 rounded-[var(--radius)] border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm text-foreground">
            Para desactivar, confirmá con el código actual de tu app de autenticación:
          </p>
          <div className="flex items-end gap-2">
            <Input
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              className="max-w-40"
            />
            <Button
              type="button"
              variant="destructive"
              disabled={disableCode.length !== 6 || isPending}
              onClick={handleDisableSubmit}
            >
              {isPending ? "Verificando..." : "Desactivar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => {
                setDisabling(false);
                setDisableCode("");
                setDisableError(null);
              }}
            >
              Cancelar
            </Button>
          </div>
          {disableError && (
            <p role="alert" aria-live="assertive" className="text-sm text-destructive">
              {disableError}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-brand-accent/40 bg-brand-neutral p-4">
        <p className="flex items-center gap-2 text-sm text-foreground">
          <ShieldCheck className="size-4 text-brand-accent-dark" />
          Verificación en dos pasos activada
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive"
          disabled={isPending}
          onClick={() => setDisabling(true)}
        >
          Desactivar
        </Button>
      </div>
    );
  }

  if (!enrolling) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldOff className="size-4" />
          No está activada.
        </div>
        <Button type="button" variant="outline" onClick={handleStartEnroll}>
          Activar verificación en dos pasos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[var(--radius)] border border-border bg-background p-4">
      {qrCode ? (
        <>
          <p className="text-sm text-foreground">
            Escaneá este código con tu app de autenticación:
          </p>
          {/* qr_code de Supabase es un data:image/svg+xml — no pasa por next/image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="Código QR para configurar 2FA" className="size-40" />
          {secret && (
            <p className="text-xs text-muted-foreground">
              ¿No podés escanear? Ingresá este código manualmente:{" "}
              <code className="rounded bg-brand-neutral px-1.5 py-0.5">{secret}</code>
            </p>
          )}
          <div className="flex items-end gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Código de 6 dígitos"
              inputMode="numeric"
              maxLength={6}
              className="max-w-40"
            />
            <Button type="button" disabled={code.length !== 6 || isPending} onClick={handleVerify}>
              {isPending ? "Verificando..." : "Confirmar"}
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Generando código QR...</p>
      )}
      {error && (
        <p role="alert" aria-live="assertive" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
