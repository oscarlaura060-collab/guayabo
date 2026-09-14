import { PageHeader } from "@/components/PageHeader";
import { exigirAcceso } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { getConfig } from "@/lib/config";
import { EnviosManager, type CiudadEnvio } from "./EnviosManager";

export const metadata = { title: "Envíos" };

export default async function EnviosPage() {
  await exigirAcceso("/envios");
  const supabase = await createClient();
  const [{ data }, config] = await Promise.all([
    supabase.from("envios").select("id, ciudad, precio, activo").order("ciudad", { ascending: true }),
    getConfig().catch(() => ({}) as Record<string, string>),
  ]);

  return (
    <>
      <PageHeader titulo="Envíos" descripcion="Tarifa de envío por ciudad. Se suma automáticamente en el carrito de la tienda." />
      <EnviosManager ciudades={(data ?? []) as CiudadEnvio[]} envioDefecto={Number(config.ENVIO_DEFECTO ?? 0)} />
    </>
  );
}
