"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange } from "lucide-react";

/**
 * Selector de rango de fechas personalizado para Utilidades. Al aplicar,
 * navega con ?periodo=personalizado&desde=...&hasta=... para que el servidor
 * calcule las cifras de ese rango exacto.
 */
export function RangoPersonalizado({
  desde: desdeInicial,
  hasta: hastaInicial,
  activo,
}: {
  desde: string;
  hasta: string;
  activo: boolean;
}) {
  const router = useRouter();
  const [desde, setDesde] = useState(desdeInicial);
  const [hasta, setHasta] = useState(hastaInicial);

  function aplicar() {
    if (!desde || !hasta) return;
    router.push(`/utilidades?periodo=personalizado&desde=${desde}&hasta=${hasta}`);
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-2xl border p-2"
      style={{ borderColor: activo ? "color-mix(in srgb, var(--color-secundario) 45%, transparent)" : "var(--borde-suave)" }}
    >
      <CalendarRange size={16} style={{ color: "var(--color-secundario)" }} />
      <label className="flex items-center gap-1 text-sm" style={{ color: "var(--tenue)" }}>
        Desde
        <input type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)}
          className="rounded-xl border bg-[var(--color-tarjeta)] px-2 py-1.5 text-sm outline-none" style={{ borderColor: "var(--borde-suave)", color: "var(--color-texto)" }} />
      </label>
      <label className="flex items-center gap-1 text-sm" style={{ color: "var(--tenue)" }}>
        Hasta
        <input type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)}
          className="rounded-xl border bg-[var(--color-tarjeta)] px-2 py-1.5 text-sm outline-none" style={{ borderColor: "var(--borde-suave)", color: "var(--color-texto)" }} />
      </label>
      <button
        onClick={aplicar}
        disabled={!desde || !hasta}
        className="gy-btn gy-btn-contorno !px-3 !py-1.5 text-sm disabled:opacity-50"
      >
        Aplicar
      </button>
    </div>
  );
}
