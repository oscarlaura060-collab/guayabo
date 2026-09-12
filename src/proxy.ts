import { type NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/middleware";

// Convención "proxy" de Next.js 16 (antes "middleware"):
// refresca la sesión de Supabase y protege todo salvo /login y /auth.
export async function proxy(request: NextRequest) {
  return actualizarSesion(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
