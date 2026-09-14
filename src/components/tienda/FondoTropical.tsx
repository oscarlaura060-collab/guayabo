/**
 * Marca de agua tropical de GUAYABO: motivos costeños (fronda, palmera, cocos,
 * olas y pez) dibujados en SVG (sin peso extra), repetidos en un patrón
 * organizado. Se usa como fondo sutil tanto en zonas crema (rosa) como sobre
 * el verde del hero (tinta), sin afectar la legibilidad.
 */

// ---- Fronda tipo pluma (rib + foliolos), en caja ~220x160 ----
function frondPaths(): string[] {
  const bx = 8, by = 150, mx = 110, my = 80, tx = 210, ty = 10;
  const d: string[] = [`M${bx},${by} Q${mx},${my} ${tx},${ty}`];
  const N = 11;
  for (let i = 1; i <= N; i++) {
    const t = i / (N + 1);
    const x = (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * mx + t * t * tx;
    const y = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * my + t * t * ty;
    let dx = 2 * ((1 - t) * (mx - bx) + t * (tx - mx));
    let dy = 2 * ((1 - t) * (my - by) + t * (ty - my));
    const L = Math.hypot(dx, dy); dx /= L; dy /= L;
    const len = 52 * (1 - 0.55 * t);
    const ax = x + dx * len * 0.5 - dy * len, ay = y + dy * len * 0.5 + dx * len;
    const bx2 = x + dx * len * 0.5 + dy * len, by2 = y + dy * len * 0.5 - dx * len;
    d.push(`M${x.toFixed(0)},${y.toFixed(0)} Q${(x + dx * len * 0.35 - dy * len * 0.5).toFixed(0)},${(y + dy * len * 0.35 + dx * len * 0.5).toFixed(0)} ${ax.toFixed(0)},${ay.toFixed(0)}`);
    d.push(`M${x.toFixed(0)},${y.toFixed(0)} Q${(x + dx * len * 0.35 + dy * len * 0.5).toFixed(0)},${(y + dy * len * 0.35 - dx * len * 0.5).toFixed(0)} ${bx2.toFixed(0)},${by2.toFixed(0)}`);
  }
  return d;
}
const FROND = frondPaths();

const PALMERA_FRONDS = [
  "M58,60 C40,30 18,30 4,46", "M58,60 C44,24 26,18 12,24", "M58,60 C52,20 48,10 46,2",
  "M58,60 C66,20 72,12 78,4", "M58,60 C76,24 96,20 108,30", "M58,60 C78,32 98,38 114,52",
  "M58,60 C46,36 40,48 34,60", "M58,60 C70,36 82,48 92,62",
];

function Motivos({ id }: { id: string }) {
  const w = 1.9;
  return (
    <g fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      {/* Fronda (arriba izquierda) */}
      <g transform="translate(20,24) scale(0.85)">
        {FROND.map((d, i) => <path key={`f${id}${i}`} d={d} />)}
      </g>
      {/* Cocos (arriba derecha) */}
      <g transform="translate(770,40) scale(0.9)">
        <circle cx="50" cy="50" r="40" />
        <path d="M30,20 q20,30 6,60" />
        <path d="M55,15 q18,35 4,68" />
        <circle cx="38" cy="55" r="3.2" fill="currentColor" stroke="none" />
        <circle cx="55" cy="50" r="3.2" fill="currentColor" stroke="none" />
        <circle cx="47" cy="66" r="3.2" fill="currentColor" stroke="none" />
        <circle cx="120" cy="60" r="34" />
        <ellipse cx="120" cy="60" rx="20" ry="24" />
        <path d="M120,40 L120,84 M104,52 L136,52 M106,70 L134,70" strokeWidth="1.4" />
      </g>
      {/* Palmera (centro) */}
      <g transform="translate(430,300) scale(0.82)">
        <path d="M58,60 q10,60 -6,128" />
        {PALMERA_FRONDS.map((d, i) => <path key={`p${id}${i}`} d={d} />)}
        <circle cx="52" cy="58" r="3" fill="currentColor" stroke="none" />
        <circle cx="64" cy="58" r="3" fill="currentColor" stroke="none" />
        <circle cx="58" cy="64" r="3" fill="currentColor" stroke="none" />
      </g>
      {/* Olas (abajo izquierda) */}
      <g transform="translate(70,580) scale(1.1)">
        <path d="M0,20 c22,-20 50,-20 72,0 s50,20 72,0 s50,-20 72,0" />
        <path d="M-8,40 c26,-16 56,-16 82,0 s56,16 82,0 s56,-16 82,0" />
        <path d="M6,58 c22,-12 48,-12 70,0 s48,12 70,0 s48,-12 70,0" />
      </g>
      {/* Pez (abajo derecha) */}
      <g transform="translate(800,590) scale(1.1)">
        <path d="M20,50 Q70,10 130,50 Q70,90 20,50 Z" />
        <path d="M20,50 l-22,-18 l0,36 z" />
        <path d="M60,26 q14,10 0,22" />
        <circle cx="112" cy="44" r="3.5" fill="currentColor" stroke="none" />
        <path d="M70,70 q18,10 40,2" />
        <path d="M78,42 q6,6 0,12 M92,40 q6,7 0,14" strokeWidth="1.3" />
      </g>
    </g>
  );
}

/** Patrón repetido, dropeable en cualquier contenedor (absolute inset-0). */
export function PatronTropical({ id, color, opacity }: { id: string; color: string; opacity: number }) {
  const tile = 1040;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" style={{ color, opacity }}>
      <svg width="100%" height="100%" role="presentation">
        <defs>
          <pattern id={id} patternUnits="userSpaceOnUse" width={tile} height={tile * 0.75}>
            <Motivos id={id} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </div>
  );
}

/** Capa de fondo fija para las zonas crema de la vitrina. */
export function FondoTropical() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10" style={{ background: "var(--color-fondo)" }}>
      <PatronTropical id="trop-fondo" color="var(--color-secundario)" opacity={0.06} />
    </div>
  );
}
