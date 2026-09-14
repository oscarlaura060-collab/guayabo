import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { getConfig } from "@/lib/config";
import { getProductos, WHATSAPP_DEFECTO, linkWhatsApp } from "@/lib/tienda";
import { ProductCard } from "@/components/tienda/ProductCard";

export const metadata = { title: "Inicio" };

export default async function TiendaHome() {
  const [config, productos] = await Promise.all([
    getConfig().catch(() => ({}) as Record<string, string>),
    getProductos(),
  ]);
  const nombre = config.NOMBRE_MARCA || "GUAYABO";
  const lema = config.LEMA || "Moda colombiana, alegre y con actitud.";
  const bannerUrl = config.BANNER_URL || null;
  const whatsapp = (config.WHATSAPP || WHATSAPP_DEFECTO).replace(/\D/g, "");
  const waSaludo = linkWhatsApp(whatsapp, `Hola 👋, quiero saber la disponibilidad de las prendas de ${nombre}.`);

  const disponibles = productos.filter((p) => p.estado !== "AGOTADO");
  const destacados = disponibles.filter((p) => p.destacado).slice(0, 8);
  const novedades = disponibles.slice(0, 8);
  const categorias = [...new Set(productos.map((p) => p.categoria).filter(Boolean) as string[])];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:py-20 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <span className="w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest" style={{ background: "var(--color-primario)", color: "var(--color-texto)" }}>
              Nueva colección
            </span>
            <h1 className="text-4xl font-bold leading-[1.05] sm:text-6xl" style={{ fontFamily: "var(--font-fraunces, serif)" }}>
              {nombre}
            </h1>
            <p className="max-w-md text-lg opacity-75">{lema}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link href="/catalogo" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90" style={{ background: "var(--color-secundario)" }}>
                Ver catálogo <ArrowRight size={17} />
              </Link>
              <a href={waSaludo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition hover:bg-black/5" style={{ borderColor: "var(--color-texto)" }}>
                <MessageCircle size={17} /> Consultar disponibilidad
              </a>
            </div>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl lg:aspect-square" style={{ background: "var(--color-primario)" }}>
            {bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerUrl} alt={nombre} className="h-full w-full object-cover" />
            ) : novedades[0]?.imagenes[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={novedades[0].imagenes[0]} alt={nombre} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-7xl font-bold opacity-30" style={{ fontFamily: "var(--font-fraunces, serif)" }}>
                {nombre.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categorías */}
      {categorias.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => (
              <Link key={c} href={`/catalogo?categoria=${encodeURIComponent(c)}`} className="rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-black/5" style={{ borderColor: "rgba(0,0,0,.12)" }}>
                {c}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Destacados */}
      {destacados.length > 0 && (
        <Seccion titulo="Destacados" href="/catalogo">
          {destacados.map((p) => <ProductCard key={p.id} producto={p} />)}
        </Seccion>
      )}

      {/* Novedades */}
      {novedades.length > 0 && (
        <Seccion titulo="Nuevas prendas" href="/catalogo">
          {novedades.map((p) => <ProductCard key={p.id} producto={p} />)}
        </Seccion>
      )}

      {productos.length === 0 && (
        <div className="mx-auto max-w-6xl px-4 py-16 text-center opacity-60">
          Muy pronto verás aquí nuestras prendas. Escríbenos por WhatsApp mientras tanto.
        </div>
      )}

      {/* CTA final */}
      <section className="mx-auto my-10 max-w-6xl px-4">
        <div className="flex flex-col items-center gap-4 rounded-3xl px-6 py-12 text-center" style={{ background: "var(--color-primario)" }}>
          <h2 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--font-fraunces, serif)" }}>¿Viste algo que te encantó?</h2>
          <p className="max-w-md opacity-80">Elige tu prenda, talla y color, y envíanos tu solicitud por WhatsApp. Nosotros confirmamos disponibilidad.</p>
          <a href={waSaludo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90" style={{ background: "var(--color-secundario)" }}>
            <MessageCircle size={17} /> Escríbenos por WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}

function Seccion({ titulo, href, children }: { titulo: string; href: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-5 flex items-end justify-between">
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-fraunces, serif)" }}>{titulo}</h2>
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--color-secundario)" }}>
          Ver todo <ArrowRight size={15} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}
