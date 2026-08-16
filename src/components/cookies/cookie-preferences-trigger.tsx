"use client";

import { useConsent } from "@/lib/cookies/consent-context";

// Enlace persistente para reabrir el banner y cambiar de opinión en
// cualquier momento — vive en el footer, visible en todo el sitio.
export function CookiePreferencesTrigger() {
  const { openPreferences } = useConsent();
  return (
    <button
      type="button"
      onClick={openPreferences}
      className="underline-offset-2 hover:text-brand-accent hover:underline"
    >
      Preferencias de cookies
    </button>
  );
}
