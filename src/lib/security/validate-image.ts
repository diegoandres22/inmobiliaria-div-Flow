import "server-only";

// Nunca confiar en file.type ni en la extensión del nombre — ambos los
// controla quien sube el archivo. Se valida el tipo real leyendo los
// primeros bytes (magic numbers), server-side, antes de escribir a
// Storage. La extensión final del path también sale de acá, nunca del
// nombre original del archivo.
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB — igual al file_size_limit del bucket

const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF = [0x52, 0x49, 0x46, 0x46]; // "RIFF"
const WEBP = [0x57, 0x45, 0x42, 0x50]; // "WEBP", offset 8 dentro de un RIFF

function matchesAt(bytes: Uint8Array, offset: number, signature: number[]) {
  return signature.every((b, i) => bytes[offset + i] === b);
}

export type ImageValidation =
  | { ok: true; ext: "jpg" | "png" | "webp"; mime: string }
  | { ok: false; reason: string };

export async function validateImageFile(file: File): Promise<ImageValidation> {
  if (file.size === 0) {
    return { ok: false, reason: `"${file.name}": el archivo está vacío.` };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      reason: `"${file.name}": supera el máximo de 8 MB por imagen.`,
    };
  }

  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  if (matchesAt(head, 0, JPEG)) {
    return { ok: true, ext: "jpg", mime: "image/jpeg" };
  }
  if (matchesAt(head, 0, PNG)) {
    return { ok: true, ext: "png", mime: "image/png" };
  }
  if (matchesAt(head, 0, RIFF) && matchesAt(head, 8, WEBP)) {
    return { ok: true, ext: "webp", mime: "image/webp" };
  }

  return {
    ok: false,
    reason: `"${file.name}": solo se aceptan imágenes JPEG, PNG o WEBP.`,
  };
}
