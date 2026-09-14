/**
 * Marca de agua tropical: un patrón vectorial de palmeras (líneas) que se
 * repite detrás del contenido. Muy sutil (baja opacidad), fijo, sin capturar
 * clics y sin peso extra (SVG puro). No afecta la legibilidad porque el
 * contenido va sobre tarjetas opacas y el patrón queda al ~6%.
 */

// Genera una palma en abanico (varias frondas curvas desde una base).
function palmaPaths(cx: number, cy: number, largo: number): string[] {
  const angulos = [-74, -56, -38, -19, 0, 19, 38, 56, 74];
  return angulos.map((deg) => {
    const a = (deg * Math.PI) / 180;
    const dx = Math.sin(a);
    const dy = -Math.cos(a);
    const tipx = cx + dx * largo;
    const tipy = cy + dy * largo;
    // Punto de control desplazado en perpendicular para dar curvatura al abanico.
    const perp = 18 * Math.sign(deg || 1);
    const ctrlx = cx + dx * largo * 0.55 + Math.cos(a) * perp;
    const ctrly = cy + dy * largo * 0.55 + Math.sin(a) * perp;
    return `M${cx.toFixed(1)},${cy.toFixed(1)} Q${ctrlx.toFixed(1)},${ctrly.toFixed(1)} ${tipx.toFixed(1)},${tipy.toFixed(1)}`;
  });
}

export function FondoTropical() {
  const tile = 420;
  const palma1 = palmaPaths(90, 350, 150);
  const palma2 = palmaPaths(320, 130, 120);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ background: "var(--color-fondo)", color: "var(--color-secundario)" }}
    >
      <svg width="100%" height="100%" role="presentation">
        <defs>
          <pattern id="gy-palmas" patternUnits="userSpaceOnUse" width={tile} height={tile} patternTransform="rotate(6)">
            <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeOpacity="0.06">
              {palma1.map((d, i) => <path key={`a${i}`} d={d} />)}
              {/* tallo de la palma */}
              <path d="M90,350 q4,-30 0,-70" />
            </g>
            <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.05">
              {palma2.map((d, i) => <path key={`b${i}`} d={d} />)}
              <path d="M320,130 q3,-24 0,-56" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gy-palmas)" />
      </svg>
    </div>
  );
}
