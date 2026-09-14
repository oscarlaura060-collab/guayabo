"use server";

import { createClient } from "@/lib/supabase/server";
import { esStaffActivo } from "@/lib/auth";

/** Genera una URL firmada del comprobante bajo demanda (al tocar "Ver"). */
export async function firmarComprobante(path: string): Promise<{ url: string | null }> {
  if (!path) return { url: null };
  if (!(await esStaffActivo())) return { url: null };
  const supabase = await createClient();
  const { data } = await supabase.storage.from("comprobantes").createSignedUrl(path, 3600);
  return { url: data?.signedUrl ?? null };
}
