import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

/**
 * Rutas del panel administrativo: SOLO estas exigen sesión. Todo lo demás
 * (la vitrina pública: inicio, catálogo, producto) es de acceso libre.
 */
const ADMIN = [
  "/dashboard",
  "/pedidos-web",
  "/prendas",
  "/inventario",
  "/apartados",
  "/envios",
  "/ventas",
  "/pagos",
  "/gastos",
  "/utilidades",
  "/reportes",
  "/clientes",
  "/configuracion",
];

/**
 * Refresca la sesión en cada petición y protege todo salvo las rutas públicas.
 * Se llama desde src/middleware.ts.
 */
export async function actualizarSesion(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: no metas lógica entre createServerClient y getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const esRutaAdmin = (p: string) => ADMIN.some((a) => p === a || p.startsWith(a + "/"));

  // Copia las cookies de sesión (refrescadas por getUser) a otra respuesta,
  // imprescindible para no romper la sesión al redirigir/reescribir.
  const conCookies = (nr: NextResponse) => {
    response.cookies.getAll().forEach((c) => nr.cookies.set(c));
    return nr;
  };

  // Prefijo opcional del panel ("ruta no predecible"). Vacío => comportamiento
  // por defecto (idéntico al anterior).
  const base = (process.env.NEXT_PUBLIC_ADMIN_PATH || "").trim().replace(/\/+$/, "");

  if (base) {
    const dentroPrefijo = pathname === base || pathname.startsWith(base + "/");

    if (dentroPrefijo) {
      const interna = pathname.slice(base.length) || "/";
      // Sin sesión y ruta de panel (no el login) → al login del prefijo.
      if (esRutaAdmin(interna) && !user) {
        const url = request.nextUrl.clone();
        url.pathname = base + "/login";
        url.searchParams.set("redirect", interna);
        return conCookies(NextResponse.redirect(url));
      }
      // Servir la ruta real sin exponer el prefijo internamente.
      const url = request.nextUrl.clone();
      url.pathname = interna;
      return conCookies(NextResponse.rewrite(url));
    }

    // Rutas "desnudas" del panel o del login, accedidas sin el prefijo.
    if (esRutaAdmin(pathname) || pathname === "/login") {
      if (user) {
        // Staff con sesión: mándalo al prefijo (los enlaces antiguos siguen sirviendo).
        const url = request.nextUrl.clone();
        url.pathname = base + pathname;
        return conCookies(NextResponse.redirect(url));
      }
      // Sin sesión: ocultar (404) en vez de confirmar que existe.
      const url = request.nextUrl.clone();
      url.pathname = "/__no-encontrado-" + Math.random().toString(36).slice(2, 8);
      return conCookies(NextResponse.rewrite(url));
    }

    // Vitrina pública: pasa sin tocar.
    return response;
  }

  // --- Sin prefijo: comportamiento por defecto ---
  if (!user && esRutaAdmin(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return conCookies(NextResponse.redirect(url));
  }

  return response;
}
