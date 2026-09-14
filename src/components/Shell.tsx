"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search, LogOut } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { seccionesVisibles } from "@/lib/nav";
import { adminHref } from "@/lib/adminPath";
import type { Rol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface ShellProps {
  nombreMarca: string;
  logoUrl?: string | null;
  rol: Rol;
  usuario: { nombre: string; email: string };
  children: ReactNode;
}

export function Shell({ nombreMarca, logoUrl, rol, usuario, children }: ShellProps) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const secciones = seccionesVisibles(rol);

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(adminHref("/login"));
    router.refresh();
  }

  const menu = (
    <nav className="flex flex-col gap-1.5">
      {secciones.map((s) => {
        const href = adminHref(s.href);
        const activo = pathname === href || pathname.startsWith(href + "/");
        const Icono = s.icon;
        return (
          <Link
            key={s.href}
            href={href}
            className="gy-pill"
            data-activo={activo}
            onClick={() => setAbierto(false)}
          >
            <Icono size={18} />
            {s.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-dvh">
      {/* Menú lateral (escritorio) */}
      <aside
        className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-5 p-4 lg:flex"
        style={{ background: "var(--color-primario)" }}
      >
        <div className="px-2 pt-2">
          <BrandLogo nombre={nombreMarca} logoUrl={logoUrl} />
        </div>
        <div className="overflow-y-auto pr-1">{menu}</div>
      </aside>

      {/* Cajón lateral (móvil) */}
      {abierto && (
        <div className="fixed inset-0 z-40 lg:hidden" role="presentation">
          <div
            className="absolute inset-0"
            style={{ background: "color-mix(in srgb, var(--color-texto) 45%, transparent)" }}
            onClick={() => setAbierto(false)}
          />
          <aside
            className="absolute left-0 top-0 flex h-full w-72 flex-col gap-5 p-4"
            style={{ background: "var(--color-primario)" }}
          >
            <div className="flex items-center justify-between px-2 pt-2">
              <BrandLogo nombre={nombreMarca} logoUrl={logoUrl} />
              <button
                className="gy-btn gy-btn-plano !p-2"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto pr-1">{menu}</div>
          </aside>
        </div>
      )}

      {/* Columna principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-3"
          style={{ background: "var(--color-fondo)", borderColor: "var(--borde-suave)" }}
        >
          <button
            className="gy-btn gy-btn-plano !p-2 lg:hidden"
            onClick={() => setAbierto(true)}
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>

          <label className="relative flex max-w-md flex-1 items-center">
            <Search
              size={17}
              className="pointer-events-none absolute left-3"
              style={{ color: "var(--tenue)" }}
            />
            <input
              type="search"
              placeholder="Buscar clientes, prendas, pedidos…"
              className="w-full rounded-full border bg-[var(--color-tarjeta)] py-2 pl-9 pr-3 text-sm outline-none"
              style={{ borderColor: "var(--borde-suave)" }}
            />
          </label>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold leading-tight">{usuario.nombre}</div>
              <div className="text-xs" style={{ color: "var(--tenue)" }}>
                {usuario.email}
              </div>
            </div>
            <button
              className="gy-btn gy-btn-plano !p-2"
              onClick={salir}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
