"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  CONSENT_COOKIE_NAME,
  CONSENT_COOKIE_MAX_AGE,
  type CookieConsent,
} from "./consent-types";

interface ConsentContextValue {
  /** null = todavía no decidió nada — el banner tiene que mostrarse. */
  consent: CookieConsent | null;
  /** false en el primer render de servidor/cliente — evita parpadeo del banner. */
  hydrated: boolean;
  preferencesOpen: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  saveConsent: (partial: Omit<CookieConsent, "essential" | "decidedAt">) => void;
  acceptAll: () => void;
  rejectNonEssential: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

function readConsentCookie(): CookieConsent | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CONSENT_COOKIE_NAME}=([^;]*)`),
  );
  const raw = match?.[1];
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as CookieConsent;
  } catch {
    return null;
  }
}

function writeConsentCookie(consent: CookieConsent) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(consent),
  )}; Max-Age=${CONSENT_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

// No-httpOnly a propósito: el propio banner (client component) necesita
// leerla para decidir si mostrarse, y AnalyticsScripts necesita leerla para
// decidir si monta o no el script de GA4. No guarda nada sensible, solo
// 4 booleans y una fecha.
export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    setConsent(readConsentCookie());
    setHydrated(true);
  }, []);

  function persist(partial: Omit<CookieConsent, "essential" | "decidedAt">) {
    const next: CookieConsent = {
      essential: true,
      decidedAt: new Date().toISOString(),
      ...partial,
    };
    writeConsentCookie(next);
    setConsent(next);
    setPreferencesOpen(false);
  }

  const value: ConsentContextValue = {
    consent,
    hydrated,
    preferencesOpen,
    openPreferences: () => setPreferencesOpen(true),
    closePreferences: () => setPreferencesOpen(false),
    saveConsent: persist,
    acceptAll: () =>
      persist({ functional: true, analytics: true, marketing: true }),
    rejectNonEssential: () =>
      persist({ functional: false, analytics: false, marketing: false }),
  };

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent debe usarse dentro de <ConsentProvider>");
  }
  return ctx;
}
