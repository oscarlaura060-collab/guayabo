export interface DatosEnvio {
  clienteNombre: string | null;
  numero: string | null;
  prendas: string[];
  transportadora: string | null;
  guia: string | null;
  urlRastreo?: string | null;
  marca?: string;
}

/** Mensaje de aviso de envío (mismo texto para correo y WhatsApp). */
export function mensajeEnvio(d: DatosEnvio): string {
  const marca = d.marca || "GUAYABO";
  const nombre = d.clienteNombre?.split(" ")[0] || "Hola";
  const prendas = d.prendas.length ? d.prendas.join(", ") : "tu pedido";
  let msg =
    `¡Hola ${nombre}! 🌴 Tu pedido ${d.numero ?? ""} con ${prendas} ya va en camino. ` +
    `Enviado por ${d.transportadora ?? "la transportadora"}`;
  if (d.guia) msg += ` con guía ${d.guia}`;
  msg += ".";
  if (d.urlRastreo) msg += ` Rastrea aquí: ${d.urlRastreo}`;
  msg += ` ¡Gracias por comprar en ${marca}!`;
  return msg;
}

/** Versión HTML simple para el correo. */
export function mensajeEnvioHtml(d: DatosEnvio): string {
  const texto = mensajeEnvio(d).replace(/\n/g, "<br>");
  return `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#191914">${texto}</div>`;
}

/** Enlace wa.me con el mensaje ya escrito (WhatsApp de un toque). */
export function urlWhatsapp(whatsapp: string | null, mensaje: string): string | null {
  if (!whatsapp) return null;
  const num = whatsapp.replace(/\D/g, "");
  if (num.length < 7) return null;
  // Colombia: si viene sin indicativo (10 dígitos), anteponer 57.
  const full = num.length === 10 ? `57${num}` : num;
  return `https://wa.me/${full}?text=${encodeURIComponent(mensaje)}`;
}
