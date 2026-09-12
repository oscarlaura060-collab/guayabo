import { createClient } from "@/lib/supabase/server";

/** Colores de la marca (respaldo cuando config falta o guarda un valor inválido). */
export const MARCA = {
  COLOR_PRIMARIO: "#D2DE52",
  COLOR_SECUNDARIO: "#E8288E",
  COLOR_BOTON: "#E8288E",
  COLOR_FONDO: "#FFFDF4",
  COLOR_TARJETA: "#FFFFFF",
  COLOR_TEXTO: "#191914",
  RADIO_BORDE: "22",
  NOMBRE_MARCA: "GUAYABO",
  MONEDA: "$",
} as const;

export type Config = Record<string, string>;

/** Lee toda la configuración activa como mapa clave→valor. */
export async function getConfig(): Promise<Config> {
  const supabase = await createClient();
  const { data } = await supabase.from("config").select("clave, valor").eq("activo", true);
  const mapa: Config = {};
  for (const row of data ?? []) mapa[row.clave] = row.valor;
  return mapa;
}

function hex6(hex: string): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return `#${h.toLowerCase()}`;
}

/** Luminancia relativa (0 negro … 1 blanco). */
function luminancia(hex: string): number {
  const h = hex6(hex);
  if (!h) return 1;
  const r = parseInt(h.slice(1, 3), 16) / 255;
  const g = parseInt(h.slice(3, 5), 16) / 255;
  const b = parseInt(h.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Un color "casi blanco" dejaría botones/textos invisibles sobre tarjetas claras. */
function casiBlanco(hex: string): boolean {
  return luminancia(hex) > 0.92;
}

/**
 * Color de marca saneado: si está vacío, es inválido, o (para colores que deben
 * contrastar sobre blanco) es casi blanco, usa el color de la marca.
 */
function colorSeguro(valor: string | undefined, fallback: string, evitarBlanco: boolean): string {
  const h = valor ? hex6(valor) : null;
  if (!h) return fallback;
  if (evitarBlanco && casiBlanco(h)) return fallback;
  return h;
}

export interface Tema {
  primario: string;
  secundario: string;
  boton: string;
  fondo: string;
  tarjeta: string;
  texto: string;
  radio: string;
  /** Variables CSS listas para inyectar en el layout raíz. */
  cssVars: Record<string, string>;
}

/** Deriva el tema (colores + radio) desde config, con saneo y respaldo de marca. */
export function temaDesdeConfig(config: Config): Tema {
  // Estos tres deben contrastar sobre tarjetas/fondo claros → se evita el casi-blanco.
  const primario = colorSeguro(config.COLOR_PRIMARIO, MARCA.COLOR_PRIMARIO, true);
  const secundario = colorSeguro(config.COLOR_SECUNDARIO, MARCA.COLOR_SECUNDARIO, true);
  const boton = colorSeguro(config.COLOR_BOTON, MARCA.COLOR_BOTON, true);
  const texto = colorSeguro(config.COLOR_TEXTO, MARCA.COLOR_TEXTO, true);
  // Fondo y tarjeta sí pueden ser claros.
  const fondo = colorSeguro(config.COLOR_FONDO, MARCA.COLOR_FONDO, false);
  const tarjeta = colorSeguro(config.COLOR_TARJETA, MARCA.COLOR_TARJETA, false);

  const radioNum = Number(config.RADIO_BORDE ?? MARCA.RADIO_BORDE);
  const radio = `${Number.isFinite(radioNum) && radioNum >= 0 ? radioNum : 22}px`;

  return {
    primario,
    secundario,
    boton,
    fondo,
    tarjeta,
    texto,
    radio,
    cssVars: {
      "--color-primario": primario,
      "--color-secundario": secundario,
      "--color-boton": boton,
      "--color-fondo": fondo,
      "--color-tarjeta": tarjeta,
      "--color-texto": texto,
      "--radio-borde": radio,
    },
  };
}
