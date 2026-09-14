import { getConfig } from "@/lib/config";
import { WHATSAPP_DEFECTO } from "@/lib/tienda";
import { CarritoCliente } from "./CarritoCliente";

export const metadata = { title: "Carrito" };

export default async function CarritoPage() {
  const config = await getConfig().catch(() => ({}) as Record<string, string>);
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold" style={{ fontFamily: "var(--font-fraunces, serif)" }}>Tu pedido</h1>
      <CarritoCliente
        nombreMarca={config.NOMBRE_MARCA || "GUAYABO"}
        whatsapp={(config.WHATSAPP || WHATSAPP_DEFECTO).replace(/\D/g, "")}
        pagoMetodo={config.PAGO_METODO || "Nequi o Llave"}
        pagoNumero={config.PAGO_NUMERO || "314 310 9678"}
        pagoTitular={config.PAGO_TITULAR || "Karina Quintana"}
      />
    </div>
  );
}
