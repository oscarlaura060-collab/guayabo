import { type ReactNode } from "react";

export function PageHeader({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        {descripcion && (
          <p className="mt-1 text-sm" style={{ color: "var(--tenue)" }}>
            {descripcion}
          </p>
        )}
      </div>
      {accion}
    </div>
  );
}

/** Aviso de sección pendiente para los bloques que aún no construimos. */
export function Proximamente({ bloque }: { bloque: string }) {
  return (
    <div className="gy-card p-8 text-center">
      <p className="text-sm" style={{ color: "var(--tenue)" }}>
        Esta sección se construye en el bloque <strong>{bloque}</strong>.
      </p>
    </div>
  );
}
