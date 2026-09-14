"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingCart, Shirt, MessageCircle, Check } from "lucide-react";
import { pesos } from "@/lib/format";
import { useCarrito } from "@/lib/carrito";
import { linkWhatsApp } from "@/lib/tienda-tipos";
import { EMOJI } from "@/lib/emoji";
import { crearSolicitud } from "./actions";

const inputCls = "rounded-xl border bg-[var(--color-tarjeta)] px-3 py-2.5 text-sm outline-none";

export function CarritoCliente({
  nombreMarca,
  whatsapp,
  pagoMetodo,
  pagoNumero,
  pagoTitular,
}: {
  nombreMarca: string;
  whatsapp: string;
  pagoMetodo: string;
  pagoNumero: string;
  pagoTitular: string;
}) {
  const { items, total, setCantidad, quitar, limpiar } = useCarrito();

  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [direccion, setDireccion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  function construirMensaje() {
    const lineas = items.map(
      (it) =>
        `• ${it.nombre} — Talla ${it.talla ?? "-"}, Color ${it.color ?? "-"} x${it.cantidad} — ${pesos(it.precio * it.cantidad)}`,
    );
    return (
      `Hola ${EMOJI.saludo}, quiero hacer un pedido en ${nombreMarca}:\n\n` +
      `${lineas.join("\n")}\n` +
      `Total: ${pesos(total)}\n\n` +
      `Mis datos:\n` +
      `${EMOJI.usuario} Nombre: ${nombre}\n` +
      `${EMOJI.cedula} Cédula: ${cedula || "-"}\n` +
      `${EMOJI.movil} Teléfono: ${telefono}\n` +
      `${EMOJI.correo} Correo: ${email || "-"}\n` +
      `${EMOJI.pin} Ciudad y dirección: ${[ciudad, direccion].filter(Boolean).join(", ") || "-"}\n\n` +
      `Pago por ${pagoMetodo} y les envío el comprobante ${EMOJI.camara}`
    );
  }

  async function onEnviar() {
    setError(null);
    if (!nombre.trim()) return setError("Escribe tu nombre.");
    if (telefono.trim().length < 5) return setError("Escribe tu teléfono.");
    setEnviando(true);
    // Registrar el pedido en el panel (si falla, igual seguimos por WhatsApp
    // para no perder el pedido).
    await crearSolicitud({
      cliente_nombre: nombre,
      cedula,
      telefono,
      email,
      ciudad,
      direccion,
      items,
      total,
    });
    setEnviando(false);
    // Abrir WhatsApp con el pedido y los datos, y vaciar el carrito.
    window.open(linkWhatsApp(whatsapp, construirMensaje()), "_blank", "noopener,noreferrer");
    limpiar();
    setListo(true);
  }

  if (listo) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl px-6 py-14 text-center" style={{ background: "color-mix(in srgb, #3AA76D 12%, transparent)" }}>
        <span className="grid h-14 w-14 place-items-center rounded-full text-white" style={{ background: "#3AA76D" }}><Check size={28} /></span>
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-fraunces, serif)" }}>¡Pedido enviado!</h2>
        <p className="max-w-md opacity-75">Ya recibimos tu solicitud. Te escribimos por WhatsApp para confirmar disponibilidad y coordinar el pago. No olvides enviarnos el comprobante {EMOJI.camara}</p>
        <Link href="/catalogo" className="rounded-full px-6 py-3 text-sm font-semibold text-white" style={{ background: "var(--color-secundario)" }}>Seguir viendo prendas</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center opacity-70">
        <ShoppingCart size={40} />
        <p>Tu carrito está vacío.</p>
        <Link href="/catalogo" className="rounded-full px-6 py-3 text-sm font-semibold text-white" style={{ background: "var(--color-secundario)" }}>Ver catálogo</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* Items */}
      <div className="flex flex-col gap-3">
        {items.map((it) => (
          <div key={it.prendaId} className="flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: "rgba(0,0,0,.1)" }}>
            <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl" style={{ background: "color-mix(in srgb, var(--color-texto) 6%, transparent)" }}>
              {it.imagen ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.imagen} alt={it.nombre} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center opacity-30"><Shirt size={22} /></div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{it.nombre}</div>
              <div className="text-xs opacity-60">{[it.talla, it.color].filter(Boolean).join(" · ") || "—"}</div>
              <div className="mt-1 text-sm font-medium">{pesos(it.precio)}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={() => quitar(it.prendaId)} aria-label="Quitar" className="opacity-50 hover:opacity-100"><Trash2 size={16} /></button>
              <div className="flex items-center gap-1 rounded-full border" style={{ borderColor: "rgba(0,0,0,.16)" }}>
                <button className="px-2 py-1" onClick={() => setCantidad(it.prendaId, it.cantidad - 1)} aria-label="Menos"><Minus size={13} /></button>
                <span className="w-6 text-center text-sm tabular-nums">{it.cantidad}</span>
                <button className="px-2 py-1" onClick={() => setCantidad(it.prendaId, it.cantidad + 1)} aria-label="Más"><Plus size={13} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Datos + pago */}
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(0,0,0,.1)" }}>
          <div className="flex items-center justify-between">
            <span className="opacity-70">Total</span>
            <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-fraunces, serif)" }}>{pesos(total)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold">Tus datos para el pedido</div>
          <input className={inputCls} style={{ borderColor: "var(--borde-suave, rgba(0,0,0,.16))" }} placeholder="Nombre completo *" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <input className={inputCls} style={{ borderColor: "var(--borde-suave, rgba(0,0,0,.16))" }} placeholder="Cédula" value={cedula} onChange={(e) => setCedula(e.target.value)} />
          <input className={inputCls} style={{ borderColor: "var(--borde-suave, rgba(0,0,0,.16))" }} placeholder="Teléfono *" inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          <input className={inputCls} style={{ borderColor: "var(--borde-suave, rgba(0,0,0,.16))" }} placeholder="Correo electrónico" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={inputCls} style={{ borderColor: "var(--borde-suave, rgba(0,0,0,.16))" }} placeholder="Ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
          <input className={inputCls} style={{ borderColor: "var(--borde-suave, rgba(0,0,0,.16))" }} placeholder="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </div>

        {/* Datos de pago */}
        <div className="rounded-2xl p-4 text-sm" style={{ background: "color-mix(in srgb, var(--color-primario) 30%, transparent)" }}>
          <div className="mb-1 font-bold">{EMOJI.tarjeta} Datos de pago</div>
          <p>{EMOJI.llave} <b>{pagoMetodo}:</b> {pagoNumero}</p>
          <p>{EMOJI.usuario} <b>Titular:</b> {pagoTitular}</p>
          <p className="mt-2 opacity-80">{EMOJI.alerta} Cuando hagas el pago, envíanos el <b>comprobante</b> {EMOJI.camara} por WhatsApp para verificarlo.</p>
        </div>

        {error && (
          <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "color-mix(in srgb, #d33a2c 10%, transparent)", color: "#b02a1f" }}>{error}</p>
        )}

        <button
          onClick={onEnviar}
          disabled={enviando}
          className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          style={{ background: "var(--color-secundario)" }}
        >
          <MessageCircle size={19} /> {enviando ? "Enviando…" : "Enviar pedido por WhatsApp"}
        </button>
        <p className="text-center text-xs opacity-60">Confirmamos disponibilidad antes de preparar tu pedido.</p>
      </div>
    </div>
  );
}
