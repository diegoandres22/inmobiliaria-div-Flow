import "server-only";
import { Resend } from "resend";

// Sin RESEND_API_KEY configurada, los emails de seguridad simplemente no se
// envían (se loguea un aviso) — mismo criterio que MapTiler/Google Maps en
// este proyecto: degradar con gracia en vez de romper el flujo. El cambio de
// contraseña tiene que funcionar aunque el email de confirmación no pueda salir.
let client: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}
