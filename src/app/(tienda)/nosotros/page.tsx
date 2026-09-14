import { getConfig } from "@/lib/config";
import { FrondaGrande } from "@/components/tienda/FondoTropical";

export const metadata = { title: "Nosotros" };

const EQUIPO = [
  { nombre: "Mela", clave: "EQUIPO_MELA_URL", rot: -8, shift: "sm:-translate-y-3" },
  { nombre: "Karina", clave: "EQUIPO_KARINA_URL", rot: 4, shift: "sm:translate-y-4" },
  { nombre: "Oscar", clave: "EQUIPO_OSCAR_URL", rot: 10, shift: "sm:-translate-y-5" },
];

/**
 * Sombrero vueltiao que corona cada foto. Si hay imagen configurada
 * (EQUIPO_SOMBRERO_URL) se usa esa; si no, se dibuja una versión en SVG con
 * las "vueltas" características (bandas blancas sobre trenza oscura).
 */
function SombreroVueltiao({ className = "", url }: { className?: string; url?: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" aria-hidden className={className} loading="lazy" decoding="async" />;
  }
  const claro = "#efe7d2";
  const oscuro = "#211d19";
  return (
    <svg viewBox="0 0 260 150" className={className} aria-hidden role="presentation">
      {/* sombra bajo el ala */}
      <ellipse cx="130" cy="120" rx="118" ry="14" fill="rgba(0,0,0,.16)" />
      {/* ala ancha con puntas (forma de lente) */}
      <path d="M8,98 Q130,52 252,98 Q130,130 8,98 Z" fill={oscuro} />
      {/* vueltas del ala */}
      <path d="M8,98 Q130,52 252,98 Q130,130 8,98 Z" fill="none" stroke={claro} strokeWidth="2.4" strokeDasharray="8 7" />
      <path d="M40,96 Q130,64 220,96 Q130,116 40,96 Z" fill="none" stroke={claro} strokeWidth="2.2" />
      <path d="M74,95 Q130,74 186,95 Q130,108 74,95 Z" fill="none" stroke={claro} strokeWidth="2" strokeDasharray="5 5" />
      {/* copa */}
      <path d="M72,92 Q70,30 130,24 Q190,30 188,92 Z" fill={oscuro} />
      {/* vueltas de la copa */}
      <path d="M75,80 Q130,64 185,80" fill="none" stroke={claro} strokeWidth="2.4" strokeDasharray="6 6" />
      <path d="M78,62 Q130,46 182,62" fill="none" stroke={claro} strokeWidth="2.4" />
      <path d="M84,46 Q130,32 176,46" fill="none" stroke={claro} strokeWidth="2.4" strokeDasharray="6 6" />
      <path d="M96,34 Q130,26 164,34" fill="none" stroke={claro} strokeWidth="2.2" />
    </svg>
  );
}

export default async function NosotrosPage() {
  const config = await getConfig().catch(() => ({}) as Record<string, string>);
  const nombre = config.NOMBRE_MARCA || "GUAYABO";
  const fotoNosotros = config.NOSOTROS_FOTO_URL || null;
  const sombreroUrl = config.EQUIPO_SOMBRERO_URL || null;

  return (
    <>
      {/* ---- Creencias (crema) con foto flotante ---- */}
      <section className="relative overflow-hidden">
        <FrondaGrande className="-left-16 bottom-4 h-72 w-96" color="var(--color-secundario)" opacity={0.06} rotate={-18} />
        <div className="relative mx-auto max-w-5xl px-5 pb-16 pt-10 sm:pb-24">
          {/* Foto: flota a la derecha en desktop, se apila arriba en móvil */}
          <div className="mb-4 aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-md sm:float-right sm:mb-3 sm:ml-6 sm:w-[46%] sm:rounded-[36px_36px_36px_60px]" style={{ background: "color-mix(in srgb, var(--color-primario) 55%, #fff)" }}>
            {fotoNosotros ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoNosotros} alt={`Equipo ${nombre}`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
            ) : (
              <div className="grid h-full w-full place-items-center text-center text-sm opacity-60" style={{ fontFamily: "var(--font-poppins, sans-serif)" }}>
                Sube una foto del equipo<br />en Configuración
              </div>
            )}
          </div>

          <div className="text-[26px] leading-snug sm:text-[30px]" style={{ fontFamily: "var(--font-poppins, sans-serif)" }}>
            <p className="mb-3">
              En <b style={{ color: "var(--color-secundario)", fontStyle: "italic" }}>{nombre}</b> creemos que la vida se disfruta mejor cuando se comparte.
            </p>
            <p className="mb-3 text-justify">
              Creemos en las mesas grandes donde siempre cabe alguien más, en las conversaciones que empiezan con una <i>risa</i> y terminan cuando cae la noche, en los <b><i>amigos</i></b> que se vuelven <b><i>familia</i></b> y en las familias que nunca dejan de reunirse.
            </p>
            <p className="text-justify">
              Creemos en la <b><i>alegría</i></b> como una forma de <b><i>vivir.</i></b>
            </p>
          </div>
        </div>
      </section>

      {/* ---- Equipo (verde) con borde ondulado ---- */}
      <section className="relative" style={{ background: "var(--color-primario)" }}>
        {/* Onda: el verde sube en curva hacia la crema */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -translate-y-[99%] leading-[0]">
          <svg viewBox="0 0 1440 130" preserveAspectRatio="none" className="h-12 w-full sm:h-24" role="presentation" aria-hidden>
            <path d="M0,130 L0,74 C 260,14 520,104 800,58 C 1050,16 1270,66 1440,44 L1440,130 Z" fill="var(--color-primario)" />
          </svg>
        </div>
        {/* Brillo suave bajo la onda */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40" style={{ background: "linear-gradient(to bottom, color-mix(in srgb, var(--color-primario) 55%, #fff), transparent)" }} />

        {/* Marca de agua grande (recortada a la sección) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <FrondaGrande className="left-2 top-10 h-96 w-[34rem]" color="var(--color-texto)" opacity={0.07} rotate={-12} />
          <FrondaGrande className="-right-24 bottom-20 hidden h-80 w-[30rem] sm:block" color="var(--color-texto)" opacity={0.06} rotate={150} />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-5 pb-14 pt-10">
          {/* Fotos del equipo */}
          <div className="flex flex-wrap items-end justify-center gap-x-6 gap-y-14 sm:gap-x-10">
            {EQUIPO.map((m) => {
              const url = config[m.clave] || null;
              return (
                <div key={m.nombre} className={`relative flex flex-col items-center ${m.shift}`}>
                  {/* Sombrero encima */}
                  <SombreroVueltiao url={sombreroUrl} className="pointer-events-none absolute -top-12 z-20 w-44 drop-shadow-md sm:w-48" />
                  {/* Foto circular */}
                  <div className="h-36 w-36 overflow-hidden rounded-full border-[5px] border-white shadow-lg sm:h-40 sm:w-40">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt={m.nombre} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-5xl font-bold" style={{ background: "color-mix(in srgb, var(--color-primario) 60%, #fff)", fontFamily: "var(--font-fraunces, serif)" }}>
                        {m.nombre.charAt(0)}
                      </div>
                    )}
                  </div>
                  {/* Píldora con el nombre, montada sobre la foto */}
                  <span className="relative z-30 -mt-5 rounded-full px-7 py-1.5 text-2xl italic text-white shadow-md" style={{ background: "var(--color-secundario)", fontFamily: "var(--font-fraunces, serif)" }}>{m.nombre}</span>
                </div>
              );
            })}
          </div>

          {/* Historia */}
          <div className="mx-auto mt-12 max-w-2xl rounded-[34px] px-7 py-9 text-center text-[17px] italic leading-relaxed shadow-sm" style={{ background: "var(--color-fondo)", fontFamily: "var(--font-fraunces, serif)" }}>
            <p className="mb-4">Somos tres amigos, soñadores y apasionados por nuestra tierra. {nombre} nació del deseo de transformar los sabores, las historias y las expresiones que nos hicieron crecer en prendas que puedan acompañar a otros a donde vayan.</p>
            <p className="mb-4">Creemos que la moda también puede contar de dónde venimos. Por eso diseñamos cada colección con orgullo, convirtiendo nuestra cultura en arte y nuestros recuerdos en piezas llenas de identidad.</p>
            <p>Más que crear ropa, queremos que cada persona que vista {nombre} lleve consigo un pedacito de la Costa Caribe.</p>
          </div>
        </div>
      </section>
    </>
  );
}
