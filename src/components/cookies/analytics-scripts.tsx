"use client";

import Script from "next/script";
import { useConsent } from "@/lib/cookies/consent-context";

// Bloqueo real (no cosmético): este componente literalmente no inserta el
// script de GA4 en el DOM salvo que consent.analytics === true. Sin
// consentimiento, NEXT_PUBLIC_ANALYTICS_ID puede estar seteado y el script
// igual no se monta — la decisión vive en React, no en ocultar el banner.
export function AnalyticsScripts() {
  const { consent } = useConsent();
  const gaId = process.env.NEXT_PUBLIC_ANALYTICS_ID;

  if (!gaId || !consent?.analytics) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
