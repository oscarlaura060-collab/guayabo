"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingCart } from "lucide-react";
import { useCarrito } from "@/lib/carrito";

const ENLACES = [
  { href: "/", texto: "Inicio" },
  { href: "/catalogo", texto: "Cápsulas" },
  { href: "/memoria", texto: "Memoria Colectiva" },
  { href: "/nosotros", texto: "Nosotros" },
];

function esActivo(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Pildora({ href, texto, activo, onClick, rosa }: { href: string; texto: string; activo: boolean; onClick: () => void; rosa: boolean }) {
  // En cabecera rosa las píldoras son blancas; en cabecera verde son rosas.
  const linea = rosa ? "#fff" : "var(--color-secundario)";
  const activoBg = rosa ? "#fff" : "var(--color-secundario)";
  const activoTxt = rosa ? "var(--color-secundario)" : "#fff";
  return (
    <Link
      href={href}
      onClick={onClick}
      className="rounded-full border px-3 py-1.5 text-center text-sm font-medium italic leading-tight transition"
      style={{
        borderColor: linea,
        background: activo ? activoBg : "transparent",
        color: activo ? activoTxt : linea,
        textDecoration: activo ? "underline" : "none",
      }}
    >
      {texto}
    </Link>
  );
}

export function TiendaHeader({ nombre, logoUrl }: { nombre: string; logoUrl: string | null }) {
  const [abierto, setAbierto] = useState(false);
  const { cantidadTotal } = useCarrito();
  const pathname = usePathname();
  const cerrar = () => setAbierto(false);

  // Cabecera verde en las páginas de compra; rosa en las de historia.
  const rutasRosa = ["/nosotros", "/memoria"];
  const rosa = rutasRosa.some((r) => pathname.startsWith(r));
  const headerBg = rosa ? "var(--color-secundario)" : "var(--color-primario)";
  const iconColor = rosa ? "#fff" : "var(--color-secundario)";

  const logo = (
    <Link href="/" onClick={cerrar} className="shrink-0" aria-label={nombre}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={nombre} className="h-12 w-12 rounded-full object-contain" />
      ) : (
        <span className="grid h-11 w-11 place-items-center rounded-full text-sm font-bold" style={{ background: rosa ? "#fff" : "var(--color-secundario)", color: rosa ? "var(--color-secundario)" : "#fff" }}>G</span>
      )}
    </Link>
  );

  const carrito = (
    <Link href="/carrito" className="relative inline-flex" aria-label="Carrito" onClick={cerrar} style={{ color: iconColor }}>
      <ShoppingCart size={22} />
      {cantidadTotal > 0 && (
        <span suppressHydrationWarning className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold" style={{ background: rosa ? "#fff" : "var(--color-secundario)", color: rosa ? "var(--color-secundario)" : "#fff" }}>
          {cantidadTotal}
        </span>
      )}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40" style={{ background: headerBg }}>
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5">
        {/* Escritorio */}
        <div className="hidden flex-1 items-center justify-end gap-2 lg:flex">
          <Pildora href="/" texto="Inicio" activo={esActivo("/", pathname)} onClick={cerrar} rosa={rosa} />
          <Pildora href="/catalogo" texto="Cápsulas" activo={esActivo("/catalogo", pathname)} onClick={cerrar} rosa={rosa} />
        </div>
        <div className="hidden lg:block">{logo}</div>
        <div className="hidden flex-1 items-center gap-2 lg:flex">
          <Pildora href="/memoria" texto="Memoria Colectiva" activo={esActivo("/memoria", pathname)} onClick={cerrar} rosa={rosa} />
          <Pildora href="/nosotros" texto="Nosotros" activo={esActivo("/nosotros", pathname)} onClick={cerrar} rosa={rosa} />
          <div className="ml-2">{carrito}</div>
        </div>

        {/* Móvil */}
        <div className="flex w-full items-center justify-between lg:hidden">
          {logo}
          <div className="flex items-center gap-4">
            {carrito}
            <button onClick={() => setAbierto((x) => !x)} aria-label="Menú" style={{ color: iconColor }}>
              {abierto ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {abierto && (
        <div className="lg:hidden" style={{ background: headerBg }}>
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 px-3 pb-3">
            {ENLACES.map((e) => (
              <Pildora key={e.href} href={e.href} texto={e.texto} activo={esActivo(e.href, pathname)} onClick={cerrar} rosa={rosa} />
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
