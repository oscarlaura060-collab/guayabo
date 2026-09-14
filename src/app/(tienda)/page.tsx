import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { getConfig } from "@/lib/config";
import { getProductos, WHATSAPP_DEFECTO, linkWhatsApp } from "@/lib/tienda";
import { EMOJI } from "@/lib/emoji";
import { ProductCard } from "@/components/tienda/ProductCard";
import { Reveal } from "@/components/tienda/Reveal";
import { HeroCarrusel } from "@/components/tienda/HeroCarrusel";
import { PatronTropical, PalmeraGrande } from "@/components/tienda/FondoTropical";

export const metadata = { title: "Inicio" };

function parseHeroImgs(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default async function TiendaHome() {
  const [config, productos] = await Promise.all([
    getConfig().catch(() => ({}) as Record<string, string>),
    getProductos(),
  ]);
  const nombre = config.NOMBRE_MARCA || "GUAYABO";
  const whatsapp = (config.WHATSAPP || WHATSAPP_DEFECTO).replace(/\D/g, "");
  const waSaludo = linkWhatsApp(whatsapp, `Hola ${EMOJI.saludo}, quiero saber la disponibilidad de las prendas de ${nombre}.`);

  // Botones tipo "linktree" del inicio. Tiktok y Playlist se activan al
  // guardar TIKTOK_URL y PLAYLIST_URL en Configuración.
  const enlacesHero = [
    { texto: "Whatsapp", href: waSaludo, externo: true },
    { texto: "¿Quiénes somos?", href: "/nosotros", externo: false },
    { texto: "Cónoce la historia", href: "/memoria", externo: false },
    { texto: "Siguenos en Tiktok", href: config.TIKTOK_URL || "#", externo: true },
    { texto: `Playlist ${nombre}`, href: config.PLAYLIST_URL || "#", externo: true },
  ];

  const disponibles = productos.filter((p) => p.estado !== "AGOTADO");
  const destacados = disponibles.filter((p) => p.destacado).slice(0, 8);
  const novedades = disponibles.slice(0, 8);
  const categorias = [...new Set(productos.map((p) => p.categoria).filter(Boolean) as string[])];

  // Fotos del hero: las configuradas en el admin, o las de los productos.
  const configuradas = parseHeroImgs(config.HERO_IMAGENES);
  const heroImgs = (configuradas.length ? configuradas : [...new Set(disponibles.flatMap((p) => p.imagenes))].slice(0, 5));

  return (
    <>
      {/* Hero tipo linktree */}
      <section className="relative overflow-hidden pb-12" style={{ background: "var(--color-primario)" }}>
        {/* clipPath para el borde rasgado de la foto */}
        <svg width="0" height="0" className="absolute" aria-hidden>
          <clipPath id="gy-rip" clipPathUnits="objectBoundingBox">
            <path d="M0.12,0 L1,0 L1,1 L0.07,1 L0.12,0.93 L0.04,0.86 L0.13,0.79 L0.05,0.72 L0.14,0.64 L0.05,0.57 L0.12,0.49 L0.04,0.42 L0.13,0.34 L0.05,0.27 L0.12,0.18 L0.06,0.09 Z" />
          </clipPath>
        </svg>

        {/* Palmeras de fondo */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <PalmeraGrande className="-left-12 top-[26rem] h-[34rem] w-64" color="var(--color-secundario)" opacity={0.13} />
          <PalmeraGrande className="-right-16 top-[34rem] hidden h-[38rem] w-72 sm:block" color="var(--color-secundario)" opacity={0.11} />
        </div>

        {/* Panel crema con título + foto */}
        <div className="relative z-10 mx-auto max-w-5xl px-3 pt-3">
          <div className="relative overflow-hidden rounded-[26px_26px_46px_46px] shadow-sm" style={{ background: "var(--color-fondo)" }}>
            <PalmeraGrande className="left-1 bottom-[-6rem] h-72 w-44" color="var(--color-secundario)" opacity={0.12} />
            <div className="relative z-10 grid grid-cols-[1.15fr_0.85fr] items-center gap-3 p-5 sm:gap-6 sm:p-8">
              <div className="flex flex-col gap-5">
                <h1 className="gy-hero-in text-[28px] leading-[1.08] sm:text-5xl" style={{ fontFamily: "var(--font-fraunces, serif)" }}>
                  <span className="font-semibold">Tener </span>
                  <span className="mx-0.5 inline-block -rotate-2 rounded-full px-3 py-0.5 font-bold italic shadow-sm sm:px-4" style={{ background: "var(--color-secundario)", color: "var(--color-primario)" }}>{nombre}</span>
                  <br />
                  <span className="font-medium italic">nunca había sido tan </span>
                  <span className="inline-block -rotate-2 rounded-full px-3 py-0.5 font-bold italic shadow-sm sm:px-4" style={{ background: "var(--color-primario)" }}>¡Bacanooo!</span>
                </h1>
                <Link
                  href="/catalogo"
                  className="gy-hero-in inline-flex w-fit items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold italic underline shadow-sm transition hover:opacity-90 sm:px-6 sm:py-3 sm:text-sm"
                  style={{ background: "color-mix(in srgb, var(--color-secundario) 20%, #fff)", color: "var(--color-secundario)", animationDelay: "90ms" }}
                >
                  Explora nuestra última cápsula <ArrowRight size={16} />
                </Link>
              </div>
              {/* Foto con borde rasgado */}
              <div className="gy-hero-in relative aspect-[3/4] w-full overflow-hidden" style={{ clipPath: "url(#gy-rip)", background: "color-mix(in srgb, var(--color-primario) 70%, #fff)", animationDelay: "60ms" }}>
                {heroImgs.length ? (
                  <HeroCarrusel imagenes={heroImgs} alt={nombre} />
                ) : (
                  <div className="grid h-full place-items-center text-6xl font-bold opacity-30" style={{ fontFamily: "var(--font-fraunces, serif)" }}>{nombre.charAt(0)}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botones tipo linktree */}
        <div className="relative z-10 mx-auto flex max-w-md flex-col gap-5 px-6 pt-9">
          {enlacesHero.map((e, i) => {
            const clase = "gy-hero-in group flex items-center justify-center rounded-full border-[3px] bg-[var(--color-fondo)] px-6 py-4 text-center text-lg font-semibold italic underline underline-offset-2 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg sm:text-xl";
            const estilo = { borderColor: "var(--color-secundario)", color: "var(--color-secundario)", fontFamily: "var(--font-fraunces, serif)", animationDelay: `${i * 70}ms` } as const;
            return e.externo ? (
              <a key={e.texto} href={e.href} target="_blank" rel="noopener noreferrer" className={clase} style={estilo}>{e.texto}</a>
            ) : (
              <Link key={e.texto} href={e.href} className={clase} style={estilo}>{e.texto}</Link>
            );
          })}
        </div>
      </section>

      {/* Categorías */}
      {categorias.length > 0 && (
        <Reveal className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => (
              <Link key={c} href={`/catalogo?categoria=${encodeURIComponent(c)}`} className="rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-black/5" style={{ borderColor: "rgba(0,0,0,.12)" }}>
                {c}
              </Link>
            ))}
          </div>
        </Reveal>
      )}

      {/* Destacados */}
      {destacados.length > 0 && (
        <Seccion titulo="Destacados" href="/catalogo">
          {destacados.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 60}><ProductCard producto={p} /></Reveal>
          ))}
        </Seccion>
      )}

      {/* Novedades */}
      {novedades.length > 0 && (
        <Seccion titulo="Nuevas prendas" href="/catalogo">
          {novedades.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 60}><ProductCard producto={p} /></Reveal>
          ))}
        </Seccion>
      )}

      {productos.length === 0 && (
        <div className="mx-auto max-w-6xl px-4 py-16 text-center opacity-60">
          Muy pronto verás aquí nuestras prendas. Escríbenos por WhatsApp mientras tanto.
        </div>
      )}

      {/* CTA final */}
      <Reveal className="mx-auto my-10 max-w-6xl px-4">
        <div className="relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl px-6 py-12 text-center" style={{ background: "var(--color-primario)" }}>
          <PatronTropical id="trop-cta" color="var(--color-texto)" opacity={0.08} />
          <h2 className="relative z-10 text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--font-fraunces, serif)" }}>¿Viste algo que te encantó?</h2>
          <p className="relative z-10 max-w-md opacity-80">Elige tu prenda, talla y color, y envíanos tu solicitud por WhatsApp. Nosotros confirmamos disponibilidad.</p>
          <a href={waSaludo} target="_blank" rel="noopener noreferrer" className="relative z-10 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90" style={{ background: "var(--color-secundario)" }}>
            <MessageCircle size={17} /> Escríbenos por WhatsApp
          </a>
        </div>
      </Reveal>
    </>
  );
}

function Seccion({ titulo, href, children }: { titulo: string; href: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-5 flex items-end justify-between">
        <h2 className="text-2xl font-bold italic" style={{ fontFamily: "var(--font-fraunces, serif)" }}>{titulo}</h2>
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--color-secundario)" }}>
          Ver todo <ArrowRight size={15} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}
