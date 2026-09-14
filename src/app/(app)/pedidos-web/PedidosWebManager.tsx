"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Globe, Trash2, Phone, User, MapPin, Mail, CreditCard, CheckCircle2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusChip } from "@/components/ui/StatusChip";
import { Vacio } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { pesos, fechaHora } from "@/lib/format";
import { actualizarEstadoSolicitud, eliminarSolicitud, confirmarSolicitud } from "./actions";
import { ESTADOS_SOLICITUD } from "./estados";

interface ItemSolicitud {
  nombre?: string;
  talla?: string | null;
  color?: string | null;
  cantidad?: number;
  precio?: number;
}
export interface SolicitudRow {
  id: string;
  codigo: string | null;
  created_at: string;
  cliente_nombre: string | null;
  cedula: string | null;
  telefono: string | null;
  email: string | null;
  ciudad: string | null;
  direccion: string | null;
  items: ItemSolicitud[];
  envio: number;
  total: number;
  estado: string;
  notas: string | null;
  venta_id: string | null;
}

const COLOR_ESTADO: Record<string, string> = {
  Nueva: "#E8288E",
  Contactada: "#7FB2F0",
  Pagada: "#F4B740",
  Confirmada: "#9B7FF0",
  Entregada: "#3AA76D",
  Cancelada: "#D33A2C",
};

export function PedidosWebManager({
  solicitudes,
  metodos,
  esAdmin,
  puedeEscribir,
}: {
  solicitudes: SolicitudRow[];
  metodos: string[];
  esAdmin: boolean;
  puedeEscribir: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [filtro, setFiltro] = useState<string>("");
  const [confirmando, setConfirmando] = useState(false);
  // Pedido en proceso de confirmación + opciones de pago elegidas.
  const [aConfirmar, setAConfirmar] = useState<SolicitudRow | null>(null);
  const [metodo, setMetodo] = useState(metodos[0] ?? "Nequi");
  const [pagado, setPagado] = useState(true);

  function abrirConfirmar(s: SolicitudRow) {
    setAConfirmar(s);
    setMetodo(metodos[0] ?? "Nequi");
    setPagado(s.estado === "Pagada" || s.estado === "Nueva");
  }

  async function confirmar() {
    if (!aConfirmar) return;
    setConfirmando(true);
    const res = await confirmarSolicitud(aConfirmar.id, { metodo, pagado });
    setConfirmando(false);
    if (res.ok) {
      toast("Pedido confirmado como venta", "exito");
      setAConfirmar(null);
      if (res.ventaId) router.push(`/ventas/${res.ventaId}`);
      else router.refresh();
    } else toast(res.error ?? "Error", "error");
  }

  const lista = useMemo(
    () => (filtro ? solicitudes.filter((s) => s.estado === filtro) : solicitudes),
    [solicitudes, filtro],
  );
  const nuevas = solicitudes.filter((s) => s.estado === "Nueva").length;

  async function cambiarEstado(id: string, estado: string) {
    const res = await actualizarEstadoSolicitud(id, estado);
    if (res.ok) { toast("Estado actualizado", "exito"); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }
  async function borrar(s: SolicitudRow) {
    if (!confirm(`¿Eliminar el pedido de ${s.cliente_nombre ?? "—"}?`)) return;
    const res = await eliminarSolicitud(s.id);
    if (res.ok) { toast("Pedido eliminado", "exito"); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button className="gy-chip" onClick={() => setFiltro("")} style={{ cursor: "pointer", background: filtro === "" ? "color-mix(in srgb, var(--color-secundario) 16%, transparent)" : "transparent", borderColor: "var(--borde-suave)" }}>
          Todos ({solicitudes.length})
        </button>
        {ESTADOS_SOLICITUD.map((e) => (
          <button key={e} className="gy-chip" onClick={() => setFiltro(filtro === e ? "" : e)}
            style={{ cursor: "pointer", background: filtro === e ? `color-mix(in srgb, ${COLOR_ESTADO[e]} 20%, transparent)` : "transparent", borderColor: `color-mix(in srgb, ${COLOR_ESTADO[e]} 45%, transparent)` }}>
            {e}{e === "Nueva" && nuevas > 0 ? ` (${nuevas})` : ""}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <Vacio icono={<Globe size={28} />} titulo="Sin pedidos web" descripcion="Aquí llegan los pedidos que hacen los clientes desde la tienda." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {lista.map((s) => (
            <div key={s.id} className="gy-card flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs" style={{ color: "var(--tenue)" }}>{s.codigo} · {fechaHora(s.created_at)}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 font-semibold"><User size={15} /> {s.cliente_nombre ?? "—"}</div>
                </div>
                <StatusChip texto={s.estado} color={COLOR_ESTADO[s.estado] ?? "#888"} />
              </div>

              {/* Datos del cliente */}
              <div className="flex flex-col gap-1 text-sm">
                {s.telefono && (
                  <a href={`https://wa.me/57${s.telefono.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5" style={{ color: "var(--color-secundario)" }}>
                    <Phone size={14} /> {s.telefono}
                  </a>
                )}
                {s.cedula && <span className="inline-flex items-center gap-1.5" style={{ color: "var(--tenue)" }}><CreditCard size={14} /> {s.cedula}</span>}
                {s.email && <span className="inline-flex items-center gap-1.5" style={{ color: "var(--tenue)" }}><Mail size={14} /> {s.email}</span>}
                {(s.ciudad || s.direccion) && <span className="inline-flex items-center gap-1.5" style={{ color: "var(--tenue)" }}><MapPin size={14} /> {[s.ciudad, s.direccion].filter(Boolean).join(", ")}</span>}
              </div>

              {/* Items */}
              <div className="rounded-xl border p-2 text-sm" style={{ borderColor: "var(--borde-suave)" }}>
                {s.items.map((it, i) => (
                  <div key={i} className="flex justify-between gap-2 py-0.5">
                    <span>{it.nombre} <span style={{ color: "var(--tenue)" }}>{[it.talla, it.color].filter(Boolean).join(" · ")} ×{it.cantidad}</span></span>
                    <span className="tabular-nums">{pesos((it.precio ?? 0) * (it.cantidad ?? 0))}</span>
                  </div>
                ))}
                {s.envio > 0 && (
                  <div className="flex justify-between py-0.5" style={{ color: "var(--tenue)" }}>
                    <span>Envío{s.ciudad ? ` · ${s.ciudad}` : ""}</span><span className="tabular-nums">{pesos(s.envio)}</span>
                  </div>
                )}
                <div className="mt-1 flex justify-between border-t pt-1 font-semibold" style={{ borderColor: "var(--borde-suave)" }}>
                  <span>Total</span><span className="tabular-nums">{pesos(s.total)}</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-between gap-2">
                {puedeEscribir ? (
                  <select
                    className="rounded-xl border bg-[var(--color-tarjeta)] px-3 py-1.5 text-sm outline-none"
                    style={{ borderColor: "var(--borde-suave)" }}
                    value={s.estado}
                    onChange={(e) => cambiarEstado(s.id, e.target.value)}
                  >
                    {ESTADOS_SOLICITUD.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                ) : <span />}
                {esAdmin && (
                  <button className="gy-btn gy-btn-plano !p-1.5" onClick={() => borrar(s)} aria-label="Eliminar" title="Eliminar"><Trash2 size={15} /></button>
                )}
              </div>

              {/* Conexión con Ventas */}
              {s.venta_id ? (
                <Link href={`/ventas/${s.venta_id}`} className="inline-flex items-center justify-center gap-1.5 rounded-xl border py-2 text-sm font-semibold" style={{ borderColor: "color-mix(in srgb, #3AA76D 45%, transparent)", color: "#2e8b57" }}>
                  <CheckCircle2 size={16} /> Ver venta
                </Link>
              ) : puedeEscribir && s.estado !== "Cancelada" ? (
                <Button onClick={() => abrirConfirmar(s)} className="w-full justify-center">
                  <ShoppingBag size={16} /> Confirmar como venta
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Confirmar como venta: método de pago y si está pagado */}
      <Modal abierto={!!aConfirmar} onClose={() => setAConfirmar(null)} titulo="Confirmar como venta">
        {aConfirmar && (
          <div className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: "var(--tenue)" }}>
              Se creará la venta de <b style={{ color: "var(--color-texto)" }}>{aConfirmar.cliente_nombre ?? "—"}</b> por <b style={{ color: "var(--color-texto)" }}>{pesos(aConfirmar.total)}</b> y se descontará el inventario.
            </p>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={pagado} onChange={(e) => setPagado(e.target.checked)} />
              El pedido ya está pagado (registrar el pago del total)
            </label>

            {pagado && (
              <label className="flex flex-col gap-1 text-sm font-medium">
                Método de pago
                <select
                  className="rounded-xl border bg-[var(--color-tarjeta)] px-3 py-2 text-sm outline-none"
                  style={{ borderColor: "var(--borde-suave)" }}
                  value={metodo}
                  onChange={(e) => setMetodo(e.target.value)}
                >
                  {metodos.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
            )}
            {!pagado && (
              <p className="text-xs" style={{ color: "#9a6f0a" }}>La venta quedará con saldo pendiente; el pago lo registras luego en Pagos.</p>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variante="plano" onClick={() => setAConfirmar(null)}>Cancelar</Button>
              <Button onClick={confirmar} disabled={confirmando}>{confirmando ? "Creando venta…" : "Crear venta"}</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
