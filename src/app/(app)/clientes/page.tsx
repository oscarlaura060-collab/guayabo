import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getSesion, rolDe } from "@/lib/auth";
import { ClientesManager } from "./ClientesManager";

export const metadata = { title: "Clientes" };

export default async function ClientesPage() {
  const supabase = await createClient();
  const [{ data: clientes }, sesion] = await Promise.all([
    supabase
      .from("clientes")
      .select("*")
      .eq("activo", true)
      .order("nombre", { ascending: true }),
    getSesion(),
  ]);

  const rol = rolDe(sesion);
  const puedeEscribir = rol === "ADMINISTRADOR" || rol === "VENDEDOR";

  return (
    <>
      <PageHeader titulo="Clientes" descripcion="Listado, búsqueda y ficha con el historial de compras." />
      <ClientesManager clientes={clientes ?? []} puedeEscribir={puedeEscribir} />
    </>
  );
}
