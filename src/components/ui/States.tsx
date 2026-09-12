import { type ReactNode } from "react";

/** Estado de carga: filas skeleton. */
export function Cargando({ filas = 4 }: { filas?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="gy-skel" style={{ height: 48 }} />
      ))}
    </div>
  );
}

/** Estado vacío con mensaje y acción opcional. */
export function Vacio({
  titulo,
  descripcion,
  icono,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  icono?: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <div className="gy-card flex flex-col items-center gap-3 p-10 text-center">
      {icono && <div style={{ color: "var(--color-secundario)" }}>{icono}</div>}
      <h3 className="text-lg font-semibold">{titulo}</h3>
      {descripcion && (
        <p className="max-w-sm text-sm" style={{ color: "var(--tenue)" }}>
          {descripcion}
        </p>
      )}
      {accion}
    </div>
  );
}
