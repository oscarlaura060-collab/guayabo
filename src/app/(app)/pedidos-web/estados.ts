export const ESTADOS_SOLICITUD = [
  "Nueva",
  "Contactada",
  "Pagada",
  "Confirmada",
  "Entregada",
  "Cancelada",
] as const;

export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number];
