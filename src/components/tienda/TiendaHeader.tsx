"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag } from "lucide-react";

export function TiendaHeader({
  nombre,
  logoUrl,
  waSaludo,
}: {
  nombre: string;
  logoUrl: string | null;
  waSaludo: string;
}) {
  const [abierto, setAbierto] = useState(false);

  const enlaces = [
    { href: "/", texto: "Inicio" },
    { href: "/catalogo", texto: "Catálogo" },
  ];

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur"
      style={{ borderColor: "rgba(0,0,0,.06)", background: "color-mix(in srgb, var(--color-fondo) 88%, transparent)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2" onClick={() => setAbierto(false)}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={nombre} className="h-9 w-9 rounded-full object-contain" style={{ background: "var(--color-primario)" }} />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold" style={{ background: "var(--color-secundario)", color: "#fff" }}>G</span>
          )}
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-fraunces, serif)" }}>{nombre}</span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          {enlaces.map((e) => (
            <Link key={e.href} href={e.href} className="text-sm font-medium italic opacity-80 transition hover:opacity-100">
              {e.texto}
            </Link>
          ))}
          <a
            href={waSaludo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "var(--color-secundario)" }}
          >
            <ShoppingBag size={16} /> WhatsApp
          </a>
        </nav>

        <button className="sm:hidden" onClick={() => setAbierto((x) => !x)} aria-label="Menú">
          {abierto ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {abierto && (
        <div className="border-t px-4 py-3 sm:hidden" style={{ borderColor: "rgba(0,0,0,.06)" }}>
          <div className="flex flex-col gap-1">
            {enlaces.map((e) => (
              <Link key={e.href} href={e.href} onClick={() => setAbierto(false)} className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-black/5">
                {e.texto}
              </Link>
            ))}
            <a href={waSaludo} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--color-secundario)" }}>
              <ShoppingBag size={16} /> Escríbenos por WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
