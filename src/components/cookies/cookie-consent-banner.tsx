"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useConsent } from "@/lib/cookies/consent-context";

export function CookieConsentBanner() {
  const {
    consent,
    hydrated,
    preferencesOpen,
    closePreferences,
    saveConsent,
    acceptAll,
    rejectNonEssential,
  } = useConsent();

  const [expanded, setExpanded] = useState(false);
  const [functional, setFunctional] = useState(consent?.functional ?? false);
  const [analytics, setAnalytics] = useState(consent?.analytics ?? false);
  const [marketing, setMarketing] = useState(consent?.marketing ?? false);

  // Evita parpadeo: en el primer render (servidor y primer paint cliente)
  // todavía no sabemos si hay o no una decisión guardada.
  if (!hydrated) return null;

  const shouldShow = consent === null || preferencesOpen;
  if (!shouldShow) return null;

  function handleSave() {
    saveConsent({ functional, analytics, marketing });
    setExpanded(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Preferencias de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] sm:p-6"
    >
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Usamos cookies</p>
            <p className="text-sm text-muted-foreground">
              Usamos cookies esenciales para que el sitio funcione. Si nos das
              permiso, también usamos cookies de análisis y marketing para
              mejorar tu experiencia. Podés cambiar tu decisión en cualquier
              momento desde el pie de página. Más info en nuestra{" "}
              <Link href="/legal/cookies" className="underline hover:text-brand-accent-dark">
                Política de Cookies
              </Link>{" "}
              y{" "}
              <Link href="/legal/privacidad" className="underline hover:text-brand-accent-dark">
                Política de Privacidad
              </Link>
              .
            </p>
          </div>
          {consent && preferencesOpen && (
            <button
              type="button"
              onClick={closePreferences}
              aria-label="Cerrar"
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {expanded && (
          <div className="grid gap-3 rounded-[var(--radius)] border border-border bg-brand-neutral p-4 sm:grid-cols-2">
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked disabled className="mt-0.5 size-4 accent-brand-accent" />
              <span>
                <span className="font-medium text-foreground">Esenciales</span>
                <br />
                <span className="text-muted-foreground">
                  Necesarias para navegar e iniciar sesión. Siempre activas.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={functional}
                onChange={(e) => setFunctional(e.target.checked)}
                className="mt-0.5 size-4 accent-brand-accent"
              />
              <span>
                <span className="font-medium text-foreground">Funcionales</span>
                <br />
                <span className="text-muted-foreground">
                  Preferencias que mejoran tu experiencia de uso.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-0.5 size-4 accent-brand-accent"
              />
              <span>
                <span className="font-medium text-foreground">Analíticas</span>
                <br />
                <span className="text-muted-foreground">
                  Nos ayudan a entender cómo se usa el sitio.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-0.5 size-4 accent-brand-accent"
              />
              <span>
                <span className="font-medium text-foreground">Marketing</span>
                <br />
                <span className="text-muted-foreground">
                  Publicidad personalizada en otros sitios.
                </span>
              </span>
            </label>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {!expanded ? (
            <>
              <Button type="button" onClick={acceptAll}>
                Aceptar todo
              </Button>
              <Button type="button" variant="outline" onClick={rejectNonEssential}>
                Rechazar no esenciales
              </Button>
              <Button type="button" variant="ghost" onClick={() => setExpanded(true)}>
                Personalizar
              </Button>
            </>
          ) : (
            <Button type="button" onClick={handleSave}>
              Guardar preferencias
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
