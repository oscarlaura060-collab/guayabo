"use client";

import { useEffect, useState } from "react";

/**
 * Carrusel del hero: hace crossfade entre las fotos con un zoom lento.
 * Transición (no keyframes) para el fundido, y CSS animation para el zoom.
 */
export function HeroCarrusel({ imagenes, alt }: { imagenes: string[]; alt: string }) {
  const [activa, setActiva] = useState(0);

  useEffect(() => {
    if (imagenes.length <= 1) return;
    const t = setInterval(() => setActiva((i) => (i + 1) % imagenes.length), 4500);
    return () => clearInterval(t);
  }, [imagenes.length]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {imagenes.map((src, i) => (
        <div key={src + i} className="gy-slide" data-on={i === activa}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} loading={i === 0 ? "eager" : "lazy"} />
        </div>
      ))}
      {imagenes.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {imagenes.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiva(i)}
              aria-label={`Foto ${i + 1}`}
              className="h-2 rounded-full transition-all"
              style={{ width: i === activa ? 20 : 8, background: i === activa ? "#fff" : "rgba(255,255,255,.6)" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
