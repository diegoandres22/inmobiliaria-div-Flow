export interface CookieConsent {
  essential: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
}

export const CONSENT_COOKIE_NAME = "df_cookie_consent";
export const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año
