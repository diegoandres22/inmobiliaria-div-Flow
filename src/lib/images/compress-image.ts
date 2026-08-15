// Compresión client-side antes de subir — corre en el navegador del agente
// (Canvas API, sin librerías nuevas). No reemplaza la validación real de
// tipo MIME server-side (ver src/lib/security/validate-image.ts, que lee
// magic bytes): esto es optimización de peso, no seguridad.
const MAX_DIMENSION = 2000; // lado más largo, en px
const JPEG_QUALITY = 0.82;

export async function compressImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) return file;

    // Si "comprimir" terminó pesando más (pasa con fotos ya optimizadas o
    // muy chicas), nos quedamos con el archivo original.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    // Navegador sin soporte o archivo corrupto — mejor subir el original
    // tal cual que romper el flujo de carga.
    return file;
  }
}
