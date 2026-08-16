"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAgent } from "@/lib/queries/get-current-agent";
import { sendPasswordChangedEmail } from "@/lib/email/send-password-changed-email";

// A diferencia de changePassword (mi-cuenta/actions.ts), acá NO se pide la
// contraseña actual — la prueba de identidad ya la dio el propio enlace de
// email de un solo uso (exchangeCodeForSession en auth/callback ya creó la
// sesión antes de que esta page se renderice). Pedir la contraseña vieja acá
// no tendría sentido: si el agente la supiera, no estaría en este flujo.
export async function confirmPasswordReset(newPassword: string): Promise<{ error?: string }> {
  if (newPassword.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "El enlace expiró o ya se usó. Pedí uno nuevo." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) {
    // Loguear el motivo real server-side (nunca al cliente) — el mensaje
    // genérico de abajo no distinguía "el link venció/ya se usó" de "la
    // contraseña nueva es igual a la actual", que Supabase sí rechaza
    // (`same_password`) y es la causa más común de este error en pruebas
    // repetidas con la misma contraseña de prueba.
    console.error("confirmPasswordReset updateUser error:", updateError.message);
    const msg = updateError.message.toLowerCase();
    if (msg.includes("different") || msg.includes("same_password") || msg.includes("should be different")) {
      return {
        error: "La contraseña nueva tiene que ser distinta a la que ya tenías. Probá con otra.",
      };
    }
    return { error: "No se pudo actualizar la contraseña. Probá pedir un enlace nuevo." };
  }

  // Mismo cierre de otras sesiones que en el cambio manual — si esto se
  // disparó porque alguien más tenía acceso a la cuenta, deja de tenerlo.
  await supabase.auth.signOut({ scope: "others" });

  const agent = await getCurrentAgent();
  if (agent) {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocida";
    await sendPasswordChangedEmail({
      to: agent.email,
      agentName: agent.name,
      method: "reset",
      ip,
    });
  }

  return {};
}
