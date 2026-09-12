import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getCatalogosPrenda } from "@/lib/listas";
import { getSesion, rolDe } from "@/lib/auth";
import { PrendasManager } from "./PrendasManager";

export const metadata = { title: "Prendas" };

export default async function PrendasPage() {
  const supabase = await createClient();
  const [{ data: prendas }, catalogos, sesion] = await Promise.all([
    supabase
      .from("prendas")
      .select("*")
      .eq("activo", true)
      .order("created_at", { ascending: false }),
    getCatalogosPrenda(),
    getSesion(),
  ]);

  const rol = rolDe(sesion);
  const puedeEscribir = rol === "ADMINISTRADOR" || rol === "VENDEDOR";

  return (
    <>
      <PageHeader
        titulo="Prendas"
        descripcion="Catálogo con fotos y desglose de costos. Una prenda por talla."
      />
      <PrendasManager
        prendas={prendas ?? []}
        catalogos={catalogos}
        puedeEscribir={puedeEscribir}
      />
    </>
  );
}
