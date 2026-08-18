"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { customAlphabet } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAgent } from "@/lib/queries/get-current-agent";
import { validateImageFile } from "@/lib/security/validate-image";
import { sendPasswordChangedEmail } from "@/lib/email/send-password-changed-email";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);
const AVATAR_URL_PREFIX = "/storage/v1/object/public/agent-avatars/";

async function getClientIp() {
  const headersList = await headers();
  return headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocida";
}

// Borra el archivo viejo del bucket a partir de la URL pública guardada en
// agents.photo_path — best-effort, no bloquea el flujo si falla (un archivo
// huérfano en Storage no rompe nada, solo ocupa espacio de más).
async function removeOldAvatarFile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  photoPath: string | null,
) {
  if (!photoPath) return;
  const idx = photoPath.indexOf(AVATAR_URL_PREFIX);
  if (idx === -1) return;
  await supabase.storage
    .from("agent-avatars")
    .remove([photoPath.slice(idx + AVATAR_URL_PREFIX.length)]);
}

// El path en Storage se arma con auth.uid(), no con el id de agents — así
// las policies de RLS del bucket (agents_upload_own_avatar, etc.) no
// necesitan hacer join a la tabla agents, alcanza con comparar contra
// auth.uid() directo (ver migración create_agent_avatars_bucket).
export async function uploadAvatar(formData: FormData): Promise<{ error?: string }> {
  const agent = await getCurrentAgent();
  if (!agent) return { error: "Tu sesión expiró — volvé a iniciar sesión." };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elegí una imagen." };
  }

  const validation = await validateImageFile(file);
  if (!validation.ok) return { error: validation.reason };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró — volvé a iniciar sesión." };

  const { data: current } = await supabase
    .from("agents")
    .select("photo_path")
    .eq("id", agent.id)
    .single();

  const path = `${user.id}/${nanoid()}.${validation.ext}`;
  const { error: uploadError } = await supabase.storage
    .from("agent-avatars")
    .upload(path, file, { contentType: validation.mime, upsert: false });

  if (uploadError) {
    return { error: "No se pudo subir la imagen. Probá de nuevo." };
  }

  const { data: publicUrl } = supabase.storage.from("agent-avatars").getPublicUrl(path);

  const { error: dbError } = await supabase
    .from("agents")
    .update({ photo_path: publicUrl.publicUrl })
    .eq("id", agent.id);

  if (dbError) {
    await supabase.storage.from("agent-avatars").remove([path]);
    console.error("[uploadAvatar/db]", dbError.message);
    return { error: "La foto se subió pero no se pudo guardar. Probá de nuevo." };
  }

  await removeOldAvatarFile(supabase, current?.photo_path ?? null);

  revalidatePath("/admin/mi-cuenta");
  revalidatePath("/agencias");
  return {};
}

export async function removeAvatar(): Promise<{ error?: string }> {
  const agent = await getCurrentAgent();
  if (!agent) return { error: "Tu sesión expiró — volvé a iniciar sesión." };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("agents")
    .select("photo_path")
    .eq("id", agent.id)
    .single();

  const { error } = await supabase
    .from("agents")
    .update({ photo_path: null })
    .eq("id", agent.id);
  if (error) {
    console.error("[removeAvatar]", error.message);
    return { error: "No se pudo quitar la foto. Probá de nuevo." };
  }

  await removeOldAvatarFile(supabase, current?.photo_path ?? null);

  revalidatePath("/admin/mi-cuenta");
  revalidatePath("/agencias");
  return {};
}

// Cambio de contraseña "manual" (a diferencia del reset por email, acá el
// agente YA está logueado y tiene que probar que conoce la contraseña
// actual). current_password lo valida el propio Supabase server-side
// (supabase-js >= 2.102.0) — nunca hicimos un segundo signInWithPassword acá
// para verificarla nosotros mismos, evita una llamada de más y una posible
// carrera entre "verificar" y "aplicar".
export async function changePassword(formData: FormData): Promise<{ error?: string }> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (newPassword.length < 8) {
    return { error: "La contraseña nueva debe tener al menos 8 caracteres." };
  }
  if (currentPassword === newPassword) {
    return { error: "La contraseña nueva tiene que ser distinta a la actual." };
  }

  const agent = await getCurrentAgent();
  if (!agent) return { error: "Tu sesión expiró — volvé a iniciar sesión." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
    current_password: currentPassword,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("password") || msg.includes("credential")) {
      return {
        error:
          "La contraseña actual no es correcta. Si iniciás sesión con Google y nunca tuviste una, usá \"olvidé mi contraseña\" desde el login para crear una.",
      };
    }
    return { error: "No se pudo actualizar la contraseña. Probá de nuevo." };
  }

  // Cierra cualquier otra sesión abierta (otro navegador, otro dispositivo)
  // — si alguien más tenía acceso con la contraseña vieja, deja de tenerlo acá.
  await supabase.auth.signOut({ scope: "others" });

  await sendPasswordChangedEmail({
    to: agent.email,
    agentName: agent.name,
    method: "manual",
    ip: await getClientIp(),
  });

  return {};
}
