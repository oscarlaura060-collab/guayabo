import { createClient } from "@/lib/supabase/server";
import { getConfig } from "@/lib/config";
import { WHATSAPP_DEFECTO } from "@/lib/tienda";
import { CarritoCliente, type Envio } from "./CarritoCliente";

export const metadata = { title: "Carrito" };

export default async function CarritoPage() {
  const supabase = await createClient();
  const [config, { data: envios }] = await Promise.all([
    getConfig().catch(() => ({}) as Record<string, string>),
    supabase.from("envios").select("ciudad, precio").eq("activo", true),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold" style={{ fontFamily: "var(--font-fraunces, serif)" }}>Tu pedido</h1>
      <CarritoCliente
        nombreMarca={config.NOMBRE_MARCA || "GUAYABO"}
        whatsapp={(config.WHATSAPP || WHATSAPP_DEFECTO).replace(/\D/g, "")}
        pagoMetodo={config.PAGO_METODO || "Nequi o Llave"}
        pagoNumero={config.PAGO_NUMERO || "314 310 9678"}
        pagoTitular={config.PAGO_TITULAR || "Karina Quintana"}
        envios={(envios ?? []).map((e) => ({ ciudad: e.ciudad, precio: Number(e.precio) })) as Envio[]}
        envioDefecto={Number(config.ENVIO_DEFECTO ?? 0)}
      />
    </div>
  );
}
