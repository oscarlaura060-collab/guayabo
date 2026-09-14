/**
 * Optimización de imágenes en el navegador antes de subirlas.
 * Redimensiona a un lado máximo y re-codifica a WebP (con caída a JPEG si el
 * navegador no soporta WebP). Así una foto de celular de varios MB queda en
 * cientos de KB y sube rápido y sin fallar por peso. Si algo falla, devuelve
 * el original para no perder la imagen.
 */
export interface OpcionesImagen {
  /** Lado máximo (px). Prendas 1600; portadas/banners 2000. */
  maxLado?: number;
  /** Calidad 0–1. */
  calidad?: number;
}

async function aBlob(canvas: HTMLCanvasElement, tipo: string, calidad: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), tipo, calidad));
}

export async function comprimirImagen(file: File, opts: OpcionesImagen = {}): Promise<File> {
  const maxLado = opts.maxLado ?? 1600;
  const calidad = opts.calidad ?? 0.82;
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * escala));
    const h = Math.max(1, Math.round(bitmap.height * escala));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    // Preferimos WebP; si el navegador no lo produce, caemos a JPEG.
    let blob = await aBlob(canvas, "image/webp", calidad);
    let ext = "webp";
    if (!blob || blob.type !== "image/webp") {
      blob = await aBlob(canvas, "image/jpeg", calidad);
      ext = "jpg";
    }
    if (!blob) return file;
    // Si no logramos reducir y no cambió el formato, dejamos el original.
    if (blob.size >= file.size && ext === (file.type.split("/")[1] || "")) return file;

    const nombre = file.name.replace(/\.[^.]+$/, "") + "." + ext;
    return new File([blob], nombre, { type: blob.type });
  } catch {
    return file;
  }
}
