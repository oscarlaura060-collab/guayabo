/**
 * Comprime una imagen en el navegador antes de subirla: la reduce a un lado
 * máximo y la re-codifica como JPEG. Así una foto de celular de varios MB queda
 * en cientos de KB y sube mucho más rápido. Si algo falla, devuelve el original.
 */
export async function comprimirImagen(
  file: File,
  maxLado = 1400,
  calidad = 0.82,
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * escala);
    const h = Math.round(bitmap.height * escala);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", calidad),
    );
    if (!blob || blob.size >= file.size) return file; // no empeorar

    const nombre = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nombre, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
