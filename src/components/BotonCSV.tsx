"use client";

import { Download } from "lucide-react";

function escapar(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function BotonCSV({
  archivo,
  columnas,
  filas,
}: {
  archivo: string;
  columnas: string[];
  filas: (string | number)[][];
}) {
  function descargar() {
    const sep = ";"; // Excel en español usa punto y coma
    const contenido = [columnas, ...filas].map((f) => f.map(escapar).join(sep)).join("\n");
    const blob = new Blob(["﻿" + contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = archivo;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button className="gy-btn gy-btn-contorno !px-3 !py-1.5 text-sm" onClick={descargar} disabled={filas.length === 0}>
      <Download size={15} /> CSV
    </button>
  );
}
