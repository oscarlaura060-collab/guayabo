import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";
import { InventarioManager, type PrendaStock } from "./InventarioManager";

export const metadata = { title: "Inventario" };

// Columnas de "solicitada por cliente". Si la migración 0007 aún no se aplicó,
// la consulta falla; en ese caso reintentamos sin ellas para no romper la página.
const COLS_CON_SOLICITADA =
  "id, codigo, nombre, talla, color, stock, stock_minimo, vendidas, precio, costo, hecho_por, solicitada, solicitada_nota";
const COLS_SIN_SOLICITADA =
  "id, codigo, nombre, talla, color, stock, stock_minimo, vendidas, precio, costo, hecho_por";

export default async function InventarioPage() {
  const supabase = await createClient();
  const [prendasRes, { data: movimientos }, sesion] = await Promise.all([
    supabase.from("prendas").select(COLS_CON_SOLICITADA).eq("activo", true).order("nombre", { ascending: true }),
    supabase
      .from("movimientos_inventario")
      .select("id, created_at, prenda_nombre, tipo, cantidad, stock_anterior, stock_nuevo, referencia, nota, usuario_email")
      .order("created_at", { ascending: false })
      .limit(80),
    getSesion(),
  ]);

  // Fallback si las columnas de solicitada todavía no existen en la base.
  let prendas = prendasRes.data as Record<string, unknown>[] | null;
  if (prendasRes.error) {
    const { data } = await supabase
      .from("prendas")
      .select(COLS_SIN_SOLICITADA)
      .eq("activo", true)
      .order("nombre", { ascending: true });
    prendas = (data ?? []).map((p) => ({ ...p, solicitada: false, solicitada_nota: null }));
  }

  const rol = rolDe(sesion);
  const puedeEscribir = rol === "ADMINISTRADOR" || rol === "VENDEDOR";

  return (
    <>
      <PageHeader titulo="Inventario" descripcion="Stock, alertas de stock bajo y movimientos." />
      <InventarioManager
        prendas={(prendas ?? []) as unknown as PrendaStock[]}
        movimientos={movimientos ?? []}
        puedeEscribir={puedeEscribir}
      />
    </>
  );
}
