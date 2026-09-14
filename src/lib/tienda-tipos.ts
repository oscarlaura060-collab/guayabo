// Tipos y helpers de la vitrina SIN dependencias de servidor (se pueden usar
// en Client Components). La lectura de datos vive en `@/lib/tienda`.

/** Número de WhatsApp de la tienda (solo dígitos, con indicativo). */
export const WHATSAPP_DEFECTO = "573332379454";

export type EstadoTienda = "DISPONIBLE" | "POCAS UNIDADES" | "AGOTADO";

export const COLOR_ESTADO: Record<EstadoTienda, string> = {
  DISPONIBLE: "#3AA76D",
  "POCAS UNIDADES": "#F4B740",
  AGOTADO: "#D33A2C",
};

export interface Variante {
  id: string;
  talla: string | null;
  color: string | null;
  precio: number;
  stock: number;
  stockMinimo: number;
  imagenes: string[];
}

export interface TablaMedidas {
  nota: string;
  columnas: string[];
  filas: { label: string; valores: string[] }[];
}

export interface Producto {
  id: string; // id de una variante representativa (para la URL)
  nombre: string;
  categoria: string | null;
  descripcion: string | null;
  composicion: string | null;
  medidas: TablaMedidas | null;
  destacado: boolean;
  precioMin: number;
  precioMax: number;
  stockTotal: number;
  estado: EstadoTienda;
  tallas: string[];
  colores: string[];
  imagenes: string[];
  createdAt: string;
  variantes: Variante[];
}

/** Enlace wa.me con un mensaje pre-armado. */
export function linkWhatsApp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
