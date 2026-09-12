import { PageHeader } from "@/components/PageHeader";
import { exigirAcceso } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { getSesion } from "@/lib/auth";
import { ConfiguracionManager, type ConfigRow, type PerfilRow } from "./ConfiguracionManager";

export const metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  await exigirAcceso("/configuracion");
  const supabase = await createClient();

  const [{ data: config }, { data: perfiles }, sesion] = await Promise.all([
    supabase
      .from("config")
      .select("clave, valor, tipo, grupo, descripcion")
      .eq("activo", true)
      .order("grupo", { ascending: true })
      .order("clave", { ascending: true }),
    supabase
      .from("perfiles")
      .select("id, email, nombre, rol, activo")
      .order("email", { ascending: true }),
    getSesion(),
  ]);

  return (
    <>
      <PageHeader
        titulo="Configuración"
        descripcion="Ajusta la marca, los colores, las reglas del negocio y las cuentas de tu equipo."
      />
      <ConfiguracionManager
        config={(config ?? []) as ConfigRow[]}
        perfiles={(perfiles ?? []) as PerfilRow[]}
        currentUserId={sesion?.userId ?? ""}
      />
    </>
  );
}
