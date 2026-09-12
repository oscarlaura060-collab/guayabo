import { createClient as createAdminBase } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cliente de Supabase con la clave service_role (SOLO servidor).
 * Se usa para operaciones de administración como crear usuarios en Auth.
 * Devuelve null si no está configurada SUPABASE_SERVICE_ROLE_KEY.
 * NUNCA exponer esta clave al navegador ni subirla al repositorio.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminBase<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
