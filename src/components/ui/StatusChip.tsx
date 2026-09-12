export interface StatusChipProps {
  texto: string;
  /** Color del estado (hex). Viene de la tabla `listas` (ámbito del estado). */
  color?: string | null;
}

/** Chip de estado con punto de color. El color se pasa desde `listas`. */
export function StatusChip({ texto, color }: StatusChipProps) {
  const c = color || "var(--color-secundario)";
  return (
    <span
      className="gy-chip"
      style={{
        background: `color-mix(in srgb, ${c} 14%, transparent)`,
        borderColor: `color-mix(in srgb, ${c} 40%, transparent)`,
        color: `color-mix(in srgb, ${c} 78%, var(--color-texto))`,
      }}
    >
      <span className="gy-chip-dot" style={{ background: c }} />
      {texto}
    </span>
  );
}
