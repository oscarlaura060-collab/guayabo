import type { Metadata } from "next";
import { Poppins, Fraunces } from "next/font/google";
import "./globals.css";
import { getConfig, temaDesdeConfig } from "@/lib/config";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig().catch(() => ({}) as Record<string, string>);
  const nombre = config.NOMBRE_MARCA || "GUAYABO";
  return {
    title: { default: nombre, template: `%s · ${nombre}` },
    description: config.LEMA || "Sistema de gestión GUAYABO",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Los colores salen de la tabla `config`, no del CSS. Se sanean aquí
  // (un color casi-blanco mal guardado se reemplaza por el de la marca).
  const config = await getConfig().catch(() => ({}) as Record<string, string>);
  const tema = temaDesdeConfig(config);
  const styleVars = tema.cssVars as React.CSSProperties;

  return (
    <html lang="es" className={`${poppins.variable} ${fraunces.variable}`} style={styleVars}>
      <body>{children}</body>
    </html>
  );
}
