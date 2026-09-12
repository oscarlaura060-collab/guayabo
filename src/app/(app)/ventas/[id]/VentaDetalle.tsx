"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, Mail, MessageCircle, CheckCircle2, Plus, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusChip } from "@/components/ui/StatusChip";
import { useToast } from "@/components/ui/Toast";
import { pesos, fecha as fmtFecha, fechaHora } from "@/lib/format";
import { mensajeEnvio, urlWhatsapp } from "@/lib/envio";
import type { Tables } from "@/types/database.types";
import {
  cambiarEstado,
  marcarEnviado,
  notificarEnvioEmail,
  marcarNotificado,
  registrarPago,
  actualizarEntrega,
} from "../actions";

type Venta = Tables<"pedidos">;
type Item = Tables<"pedido_items">;
type Pago = Tables<"pagos">;

const TRANSPORTADORAS = ["Servientrega", "Interrapidísimo", "Coordinadora", "Envía", "TCC", "Deprisa", "4-72"];
const inputCls = "rounded-xl border bg-[var(--color-tarjeta)] px-3 py-2 text-sm outline-none";
const inputStyle = { borderColor: "var(--borde-suave)" } as const;
const colorPago: Record<string, string> = { Pagado: "#3AA76D", Abono: "#7FB2F0", Pendiente: "#F4B740", Reembolsado: "#C4C4C4" };

export function VentaDetalle({
  venta,
  items,
  pagos,
  cliente,
  estados,
  metodos,
  marca,
  puedeEscribir,
}: {
  venta: Venta;
  items: Item[];
  pagos: Pago[];
  cliente: { nombre: string; whatsapp: string | null; email: string | null } | null;
  estados: { nombre: string; hex: string | null }[];
  metodos: string[];
  marca: string;
  puedeEscribir: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [estado, setEstado] = useState(venta.estado);
  const [modalEnvio, setModalEnvio] = useState(false);
  const [modalPago, setModalPago] = useState(false);
  const [transportadora, setTransportadora] = useState(venta.transportadora ?? "");
  const [guia, setGuia] = useState(venta.guia ?? "");
  const [urlRastreo, setUrlRastreo] = useState(venta.url_rastreo ?? "");
  const [notificado, setNotificado] = useState(venta.notificado_envio);
  const [entrega, setEntrega] = useState(venta.fecha_entrega ?? "");
  const [ocupado, setOcupado] = useState(false);

  const colorEstado = estados.find((e) => e.nombre === estado)?.hex ?? undefined;
  const enviado = estado === "Enviado" || !!venta.guia;

  const datosEnvio = {
    clienteNombre: venta.cliente_nombre ?? cliente?.nombre ?? null,
    numero: venta.numero,
    prendas: items.map((i) => i.nombre).filter(Boolean) as string[],
    transportadora,
    guia,
    urlRastreo,
    marca,
  };
  const waUrl = urlWhatsapp(cliente?.whatsapp ?? null, mensajeEnvio(datosEnvio));

  async function onEstado(nuevo: string) {
    if (nuevo === estado) return;
    if (nuevo === "Enviado") { setModalEnvio(true); return; }
    setOcupado(true);
    const res = await cambiarEstado(venta.id, nuevo);
    setOcupado(false);
    if (res.ok) { setEstado(nuevo); toast(`Estado: ${nuevo}`, "exito"); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }

  async function guardarEnvio() {
    setOcupado(true);
    const res = await marcarEnviado(venta.id, { transportadora, guia, url_rastreo: urlRastreo });
    setOcupado(false);
    if (res.ok) { setEstado("Enviado"); setModalEnvio(false); toast("Marcada como enviada", "exito"); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }

  async function guardarEntrega() {
    setOcupado(true);
    const res = await actualizarEntrega(venta.id, entrega || null);
    setOcupado(false);
    if (res.ok) { toast("Fecha de entrega actualizada", "exito"); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }

  async function enviarCorreo() {
    setOcupado(true);
    const res = await notificarEnvioEmail(venta.id);
    setOcupado(false);
    if (res.ok) { setNotificado(true); toast("Correo de aviso enviado", "exito"); }
    else toast(res.error ?? "No se pudo enviar", "error");
  }

  function avisarWhatsapp() {
    if (!waUrl) { toast("El cliente no tiene WhatsApp registrado", "error"); return; }
    window.open(waUrl, "_blank", "noopener,noreferrer");
    marcarNotificado(venta.id).then(() => setNotificado(true));
  }

  async function onPago(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setOcupado(true);
    const res = await registrarPago(venta.id, {
      valor: Number(fd.get("valor")),
      metodo: String(fd.get("metodo")),
      observaciones: String(fd.get("observaciones") || ""),
    });
    setOcupado(false);
    if (res.ok) { setModalPago(false); toast("Pago registrado", "exito"); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Cabecera */}
      <div className="gy-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{venta.numero}</h1>
            <p className="text-sm" style={{ color: "var(--tenue)" }}>
              {venta.cliente_nombre ?? cliente?.nombre ?? "Sin cliente"} · {fmtFecha(venta.fecha)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusChip texto={estado} color={colorEstado} />
            <StatusChip texto={venta.est_pago} color={colorPago[venta.est_pago]} />
          </div>
        </div>

        {puedeEscribir && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span style={{ color: "var(--tenue)" }}>Estado:</span>
              <select className={inputCls} style={inputStyle} value={estado} onChange={(e) => onEstado(e.target.value)} disabled={ocupado}>
                {estados.map((e) => <option key={e.nombre} value={e.nombre}>{e.nombre}</option>)}
              </select>
            </label>
            <Button variante="contorno" onClick={() => setModalEnvio(true)} disabled={ocupado}>
              <Truck size={16} /> {enviado ? "Editar envío" : "Marcar enviada"}
            </Button>
            {venta.saldo > 0 && (
              <Button onClick={() => setModalPago(true)} disabled={ocupado}>
                <Plus size={16} /> Registrar pago
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Entrega */}
      {puedeEscribir && (
        <div className="gy-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <CalendarClock size={16} style={{ color: "var(--color-secundario)" }} /> Entrega
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span style={{ color: "var(--tenue)" }}>Fecha de entrega estimada</span>
              <input className={inputCls} style={inputStyle} type="date" value={entrega} onChange={(e) => setEntrega(e.target.value)} />
            </label>
            <Button variante="plano" onClick={guardarEntrega} disabled={ocupado}>Guardar</Button>
          </div>
        </div>
      )}

      {/* Envío */}
      {enviado && (
        <div className="gy-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Truck size={16} style={{ color: "var(--color-secundario)" }} /> Envío
            {notificado && <span className="inline-flex items-center gap-1 text-xs" style={{ color: "#3AA76D" }}><CheckCircle2 size={14} /> avisado</span>}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <Dato etiqueta="Transportadora" valor={venta.transportadora} />
            <Dato etiqueta="Guía" valor={venta.guia} />
            {venta.fecha_envio && <Dato etiqueta="Enviado" valor={fechaHora(venta.fecha_envio)} />}
          </div>
          {puedeEscribir && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variante="contorno" onClick={enviarCorreo} disabled={ocupado}><Mail size={16} /> Avisar por correo</Button>
              <button className="gy-btn gy-btn-solido" style={{ background: "#25D366" }} onClick={avisarWhatsapp} disabled={!waUrl}
                title={waUrl ? "Abrir WhatsApp con el mensaje listo" : "El cliente no tiene WhatsApp"}>
                <MessageCircle size={16} /> Avisar por WhatsApp
              </button>
            </div>
          )}
        </div>
      )}

      {/* Prendas */}
      <div className="gy-card overflow-hidden">
        <div className="gy-table-wrap">
          <table className="gy-table">
            <thead><tr><th>Prenda</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>{it.nombre}<span className="ml-1 text-xs" style={{ color: "var(--tenue)" }}>{[it.talla, it.color].filter(Boolean).join(" · ")}</span></td>
                  <td className="num">{it.cantidad}</td>
                  <td className="num">{pesos(it.precio)}</td>
                  <td className="num">{pesos(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totales y pagos */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="gy-card p-4">
          <div className="mb-2 text-sm font-semibold">Totales</div>
          <div className="flex flex-col gap-1 text-sm">
            <Linea etiqueta="Subtotal" valor={pesos(venta.subtotal)} />
            <Linea etiqueta="Descuento" valor={pesos(venta.descuento)} />
            <Linea etiqueta="Envío" valor={pesos(venta.envio)} />
            <div className="mt-1 flex justify-between border-t pt-2 font-semibold" style={{ borderColor: "var(--borde-suave)" }}>
              <span>Total</span><span className="gy-cifra text-lg">{pesos(venta.total)}</span>
            </div>
            <Linea etiqueta="Pagado" valor={pesos(venta.pagado)} />
            <Linea etiqueta="Saldo" valor={pesos(venta.saldo)} />
          </div>
        </div>

        <div className="gy-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">Pagos</span>
            {puedeEscribir && venta.saldo > 0 && (
              <button className="gy-btn gy-btn-plano !px-2 !py-1 text-sm" onClick={() => setModalPago(true)}><Plus size={14} /> Agregar</button>
            )}
          </div>
          {pagos.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--tenue)" }}>Sin pagos registrados.</p>
          ) : (
            <div className="flex flex-col gap-2 text-sm">
              {pagos.map((p) => (
                <div key={p.id} className="flex justify-between">
                  <span style={{ color: "var(--tenue)" }}>{fmtFecha(p.fecha)} · {p.metodo}</span>
                  <span className="tabular-nums font-medium">{pesos(p.valor)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal envío */}
      <Modal abierto={modalEnvio} onClose={() => setModalEnvio(false)} titulo="Datos de envío">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Transportadora
            <input className={inputCls} style={inputStyle} list="transportadoras" value={transportadora} onChange={(e) => setTransportadora(e.target.value)} />
            <datalist id="transportadoras">{TRANSPORTADORAS.map((t) => <option key={t} value={t} />)}</datalist>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Número de guía
            <input className={inputCls} style={inputStyle} value={guia} onChange={(e) => setGuia(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Enlace de rastreo (opcional)
            <input className={inputCls} style={inputStyle} type="url" placeholder="https://…" value={urlRastreo} onChange={(e) => setUrlRastreo(e.target.value)} />
          </label>
          <div className="flex justify-end gap-2">
            <Button variante="plano" onClick={() => setModalEnvio(false)}>Cancelar</Button>
            <Button onClick={guardarEnvio} disabled={ocupado || !transportadora.trim() || !guia.trim()}>{ocupado ? "Guardando…" : "Marcar enviada"}</Button>
          </div>
        </div>
      </Modal>

      {/* Modal pago */}
      <Modal abierto={modalPago} onClose={() => setModalPago(false)} titulo="Registrar pago">
        <form onSubmit={onPago} className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: "var(--tenue)" }}>Saldo actual: <b style={{ color: "var(--color-texto)" }}>{pesos(venta.saldo)}</b></p>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Valor
              <input className={inputCls} style={inputStyle} name="valor" type="number" min="1" defaultValue={venta.saldo || ""} required />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Método
              <select className={inputCls} style={inputStyle} name="metodo" defaultValue={metodos[0] ?? ""} required>
                {metodos.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Observaciones
            <input className={inputCls} style={inputStyle} name="observaciones" />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variante="plano" onClick={() => setModalPago(false)}>Cancelar</Button>
            <Button type="submit" disabled={ocupado}>{ocupado ? "Guardando…" : "Registrar pago"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return <div><div className="text-xs" style={{ color: "var(--tenue)" }}>{etiqueta}</div><div>{valor || "—"}</div></div>;
}
function Linea({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return <div className="flex justify-between"><span style={{ color: "var(--tenue)" }}>{etiqueta}</span><span className="tabular-nums">{valor}</span></div>;
}
