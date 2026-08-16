import "server-only";
import { getResendClient } from "./resend-client";
import { clientConfig } from "@/config/client.config";

interface SendPasswordChangedEmailParams {
  to: string;
  agentName: string;
  /** "reset" = vino de "olvidé mi contraseña"; "manual" = cambio desde Mi cuenta. */
  method: "reset" | "manual";
  ip: string;
}

const FROM =
  process.env.RESEND_FROM_EMAIL ?? `${clientConfig.brand.name} <onboarding@resend.dev>`;

// Auditoría 2026-08-15 (A1): `ip` sale de un header (x-forwarded-for) que el
// cliente controla — cualquier agente autenticado podía forjarlo al cambiar
// su propia contraseña y lograr HTML injection en este correo. `agentName`
// también se interpolaba crudo. Ninguno de los dos se usaba en ningún otro
// lado sin escapar, así que esto no afecta nada más que este template.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Se manda SIEMPRE que la contraseña cambia, sea cual sea el flujo — es la
// única forma de que el dueño real de la cuenta se entere si alguien más la
// cambió (ej. tras un descuido con el email). Incluye una vía de reporte y
// deja explícito que ya se cerraron las otras sesiones (ver
// signOut({scope:"others"}) en los dos Server Actions que llaman a esto).
export async function sendPasswordChangedEmail({
  to,
  agentName,
  method,
  ip,
}: SendPasswordChangedEmailParams) {
  const resend = getResendClient();
  if (!resend) {
    console.warn(
      "RESEND_API_KEY no configurada — no se envió el email de confirmación de contraseña.",
    );
    return;
  }

  const when = new Date().toLocaleString("es", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const methodLabel =
    method === "reset"
      ? 'se restableció usando el enlace de "olvidé mi contraseña"'
      : 'se cambió manualmente desde "Mi cuenta"';
  const reportUrl = `mailto:${clientConfig.contact.email}?subject=${encodeURIComponent(
    "No reconozco un cambio de contraseña en mi cuenta",
  )}`;
  const safeAgentName = escapeHtml(agentName);
  const safeIp = escapeHtml(ip);

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Tu contraseña de ${clientConfig.brand.name} cambió`,
      html: `
        <div style="font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;color:#2C2C2A;">
          <h2 style="color:#0F6E56;margin-bottom:4px;">Tu contraseña cambió</h2>
          <p>Hola ${safeAgentName},</p>
          <p>Te escribimos para confirmar que la contraseña de tu cuenta en ${clientConfig.brand.name} ${methodLabel}.</p>
          <p style="font-size:13px;color:#6b6b67;">Fecha: ${when}<br/>Dirección IP: ${safeIp}</p>
          <p>Por seguridad, cerramos cualquier otra sesión que tuvieras abierta en otros dispositivos o navegadores — vas a tener que iniciar sesión de nuevo ahí.</p>
          <p style="margin-top:24px;padding:12px 16px;background:#FEF3C7;border-radius:8px;color:#92400E;">
            ¿No reconocés este cambio? <a href="${reportUrl}" style="color:#92400E;font-weight:600;">Escribinos ahora mismo</a> — puede que alguien más tenga acceso a tu cuenta.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("No se pudo enviar el email de confirmación de contraseña:", err);
    // No relanzamos: la contraseña ya cambió y revertirla por un email que
    // no salió sería peor UX que simplemente degradar en silencio.
  }
}
