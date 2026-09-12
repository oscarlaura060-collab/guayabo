import { formatInTimeZone } from "date-fns-tz";

export const ZONA = "America/Bogota";

const nf = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

/** Pesos colombianos sin decimales: `$ 120.000`. */
export function pesos(valor: number | string | null | undefined): string {
  const n = typeof valor === "string" ? Number(valor) : valor ?? 0;
  if (!Number.isFinite(n as number)) return "$ 0";
  return `$ ${nf.format(Math.round(n as number))}`;
}

/** Número con separador de miles (sin símbolo). */
export function numero(valor: number | string | null | undefined): string {
  const n = typeof valor === "string" ? Number(valor) : valor ?? 0;
  return nf.format(Number.isFinite(n as number) ? (n as number) : 0);
}

function aDate(fecha: string | number | Date | null | undefined): Date | null {
  if (fecha == null || fecha === "") return null;
  // Fechas "YYYY-MM-DD" se interpretan como día local en Bogotá.
  if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return new Date(`${fecha}T12:00:00`);
  }
  const d = new Date(fecha);
  return isNaN(d.getTime()) ? null : d;
}

/** Fecha corta en Bogotá: `12/09/2026`. */
export function fecha(f: string | number | Date | null | undefined): string {
  const d = aDate(f);
  return d ? formatInTimeZone(d, ZONA, "dd/MM/yyyy") : "—";
}

/** Fecha y hora en Bogotá: `12/09/2026 14:30`. */
export function fechaHora(f: string | number | Date | null | undefined): string {
  const d = aDate(f);
  return d ? formatInTimeZone(d, ZONA, "dd/MM/yyyy HH:mm") : "—";
}

/** Fecha larga en Bogotá: `12 de septiembre de 2026`. */
export function fechaLarga(f: string | number | Date | null | undefined): string {
  const d = aDate(f);
  return d ? formatInTimeZone(d, ZONA, "d 'de' MMMM 'de' yyyy", { locale: undefined }) : "—";
}

/** `YYYY-MM-DD` de hoy en Bogotá (para inputs de tipo date). */
export function hoyBogota(): string {
  return formatInTimeZone(new Date(), ZONA, "yyyy-MM-dd");
}
