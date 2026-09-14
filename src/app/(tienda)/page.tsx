import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { getConfig } from "@/lib/config";
import { getProductos, WHATSAPP_DEFECTO, linkWhatsApp } from "@/lib/tienda";
import { EMOJI } from "@/lib/emoji";
import { ProductCard } from "@/components/tienda/ProductCard";
import { Reveal } from "@/components/tienda/Reveal";
import { HeroCarrusel } from "@/components/tienda/HeroCarrusel";

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

  const disponibles = productos.filter((p) => p.estado !== "AGOTADO");
  const destacados = disponibles.filter((p) => p.destacado).slice(0, 8);
  const novedades = disponibles.slice(0, 8);
  const categorias = [...new Set(productos.map((p) => p.categoria).filter(Boolean) as string[])];

  // Fotos del hero: las configuradas en el admin, o las de los productos.
  const configuradas = parseHeroImgs(config.HERO_IMAGENES);
  const heroImgs = (configuradas.length ? configuradas : [...new Set(disponibles.flatMap((p) => p.imagenes))].slice(0, 5));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--color-primario)" }}>
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-8 sm:py-12 lg:grid-cols-2">
          <div className="order-2 flex flex-col gap-5 lg:order-1">
            <h1 className="gy-hero-in text-4xl leading-[1.05] sm:text-5xl" style={{ fontFamily: "var(--font-fraunces, serif)" }}>
              <span className="font-medium">Tener </span>
              <span className="mx-1 inline-block rounded-full px-4 py-1 font-bold text-white" style={{ background: "var(--color-secundario)" }}>{nombre}</span>
              <br />
              <span className="italic">nunca había sido tan </span>
              <span className="inline-block rounded-full px-4 py-1 font-bold italic" style={{ background: "color-mix(in srgb, var(--color-primario) 60%, #fff)" }}>¡Bacanooo!</span>
            </h1>
            <Link
              href="/catalogo"
              className="gy-hero-in inline-flex w-fit items-center gap-3 rounded-full px-6 py-3 text-base font-medium italic transition hover:opacity-90"
              style={{ background: "color-mix(in srgb, var(--color-secundario) 22%, #fff)", color: "var(--color-secundario)", animationDelay: "90ms" }}
            >
              Explora nuestra última cápsula <ArrowRight size={18} />
            </Link>
          </div>
          <div className="gy-hero-in order-1 mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[40%_40%_45%_45%/8%_8%_50%_50%] lg:order-2" style={{ background: "color-mix(in srgb, var(--color-primario) 70%, #fff)", animationDelay: "60ms" }}>
            {heroImgs.length ? (
              <HeroCarrusel imagenes={heroImgs} alt={nombre} />
            ) : (
              <div className="grid h-full place-items-center text-7xl font-bold opacity-30" style={{ fontFamily: "var(--font-fraunces, serif)" }}>{nombre.charAt(0)}</div>
            )}
          </div>
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
        <div className="flex flex-col items-center gap-4 rounded-3xl px-6 py-12 text-center" style={{ background: "var(--color-primario)" }}>
          <h2 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--font-fraunces, serif)" }}>¿Viste algo que te encantó?</h2>
          <p className="max-w-md opacity-80">Elige tu prenda, talla y color, y envíanos tu solicitud por WhatsApp. Nosotros confirmamos disponibilidad.</p>
          <a href={waSaludo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90" style={{ background: "var(--color-secundario)" }}>
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
