import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getConfig } from "@/lib/config";
import { WHATSAPP_DEFECTO, linkWhatsApp } from "@/lib/tienda";
import { CarritoProvider } from "@/lib/carrito";
import { EMOJI } from "@/lib/emoji";
import { TiendaHeader } from "@/components/tienda/TiendaHeader";

export default async function TiendaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const config = await getConfig().catch(() => ({}) as Record<string, string>);
  const nombre = config.NOMBRE_MARCA || "GUAYABO";
  const logoUrl = config.LOGO_URL || null;
  const whatsapp = (config.WHATSAPP || WHATSAPP_DEFECTO).replace(/\D/g, "");
  const lema = config.LEMA || "Moda colombiana, alegre y con actitud.";
  const anio = new Date().getFullYear();

  const waSaludo = linkWhatsApp(whatsapp, `Hola ${EMOJI.saludo}, quiero saber más sobre ${nombre}.`);

  return (
    <CarritoProvider>
    <div className="flex min-h-dvh flex-col" style={{ background: "var(--color-fondo)", color: "var(--color-texto)" }}>
      <TiendaHeader nombre={nombre} logoUrl={logoUrl} />

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t" style={{ borderColor: "var(--borde-suave, rgba(0,0,0,.08))" }}>
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-bold tracking-tight">{nombre}</div>
            <p className="mt-1 text-sm opacity-70">{lema}</p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <a href={waSaludo} target="_blank" rel="noopener noreferrer" className="font-semibold" style={{ color: "var(--color-secundario)" }}>
              Escríbenos por WhatsApp
            </a>
            <Link href="/catalogo" className="opacity-80 hover:opacity-100">Ver catálogo</Link>
          </div>
        </div>
        <div className="px-4 pb-6 text-center text-xs opacity-50">© {anio} {nombre}. Todos los derechos reservados.</div>
      </footer>

      {/* Botón flotante de WhatsApp */}
      <a
        href={waSaludo}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp"
        className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition hover:scale-105"
        style={{ background: "#25D366" }}
      >
        <MessageCircle size={26} />
      </a>
    </div>
    </CarritoProvider>
  );
}
