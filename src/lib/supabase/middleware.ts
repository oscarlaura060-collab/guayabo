import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

/**
 * Rutas del panel administrativo: SOLO estas exigen sesión. Todo lo demás
 * (la vitrina pública: inicio, catálogo, producto) es de acceso libre.
 */
const ADMIN = [
  "/dashboard",
  "/prendas",
  "/inventario",
  "/apartados",
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
  const esAdmin = ADMIN.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!user && esAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
