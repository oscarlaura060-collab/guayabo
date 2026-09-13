"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, BookmarkCheck, PackageCheck, Ban, Sparkles, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusChip } from "@/components/ui/StatusChip";
import { Vacio } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { pesos, fecha as fmtFecha } from "@/lib/format";
import { crearApartado, convertirAVenta, cancelarApartado } from "./actions";
import { firmarComprobante } from "../comprobante-actions";

export interface ApartadoRow {
  id: string;
  codigo: string | null;
  cliente_nombre: string | null;
  prenda_nombre: string | null;
  talla: string | null;
  color: string | null;
  cantidad: number;
  precio: number;
  total: number;
  abonado: number;
  saldo: number;
  estado: string;
  disponible: boolean;
  fecha: string | null;
  fecha_limite: string | null;
  observaciones: string | null;
}
export interface AbonoRow {
  id: string;
  apartado_id: string;
  fecha: string | null;
  valor: number;
  metodo: string | null;
  comprobantes: string[];
}
export interface ClienteOpt { id: string; nombre: string }
export interface PrendaOpt { id: string; nombre: string; precio: number; stock: number; talla: string | null; color: string | null }

const inputCls = "rounded-xl border bg-[var(--color-tarjeta)] px-3 py-2 text-sm outline-none";
const inputStyle = { borderColor: "var(--borde-suave)" } as const;

export function ApartadosManager({
  apartados,
  clientes,
  prendas,
  abonos,
  metodos,
  coloresEstado,
  puedeEscribir,
}: {
  apartados: ApartadoRow[];
  clientes: ClienteOpt[];
  prendas: PrendaOpt[];
  abonos: AbonoRow[];
  metodos: string[];
  coloresEstado: Record<string, string>;
  puedeEscribir: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [detalle, setDetalle] = useState<ApartadoRow | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [precioSugerido, setPrecioSugerido] = useState("");

  const abonosDetalle = detalle ? abonos.filter((a) => a.apartado_id === detalle.id) : [];

  async function verComprobante(path: string) {
    const { url } = await firmarComprobante(path);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else toast("No se pudo abrir el comprobante", "error");
  }

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return apartados;
    return apartados.filter((a) =>
      [a.codigo, a.cliente_nombre, a.prenda_nombre, a.estado].filter(Boolean).some((x) => String(x).toLowerCase().includes(t)),
    );
  }, [apartados, q]);

  const disponibles = apartados.filter((a) => a.disponible && a.estado !== "Entregado" && a.estado !== "Cancelado");

  async function onCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOcupado(true);
    const res = await crearApartado(new FormData(e.currentTarget));
    setOcupado(false);
    if (res.ok) { toast("Apartado creado", "exito"); setModal(false); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }
  async function onConvertir(a: ApartadoRow) {
    if (!confirm(`Entregar "${a.prenda_nombre}" a ${a.cliente_nombre ?? "el cliente"}? Se creará la venta y se descontará el stock.`)) return;
    setOcupado(true);
    const res = await convertirAVenta(a.id);
    setOcupado(false);
    if (res.ok) {
      toast("Apartado entregado como venta", "exito");
      if (res.ventaId) router.push(`/ventas/${res.ventaId}`);
      else router.refresh();
    } else toast(res.error ?? "Error", "error");
  }
  async function onCancelar(a: ApartadoRow) {
    if (!confirm("¿Cancelar este apartado?")) return;
    const res = await cancelarApartado(a.id);
    if (res.ok) { toast("Apartado cancelado", "exito"); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }

  return (
    <>
      {disponibles.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border p-3 text-sm"
          style={{ borderColor: "color-mix(in srgb, #3AA76D 45%, transparent)", background: "color-mix(in srgb, #3AA76D 12%, transparent)" }}>
          <Sparkles size={18} style={{ color: "#3AA76D" }} />
          <span><b>{disponibles.length}</b> apartado(s) con stock disponible, listos para entregar.</span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative flex min-w-56 flex-1 items-center">
          <Search size={16} className="pointer-events-none absolute left-3" style={{ color: "var(--tenue)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar apartado…"
            className="w-full rounded-full border bg-[var(--color-tarjeta)] py-2 pl-9 pr-3 text-sm outline-none" style={{ borderColor: "var(--borde-suave)" }} />
        </label>
        {puedeEscribir && <Button onClick={() => setModal(true)}><Plus size={17} /> Nuevo apartado</Button>}
      </div>

      {lista.length === 0 ? (
        <Vacio icono={<BookmarkCheck size={28} />} titulo="Sin apartados"
          descripcion="Crea un apartado cuando alguien reserva una prenda (por ejemplo sin stock). Al reingresar stock, se marca disponible para entregar." />
      ) : (
        <div className="gy-table-wrap gy-card">
          <table className="gy-table">
            <thead>
              <tr><th>Código</th><th>Cliente</th><th>Prenda</th><th>Total</th><th>Abonado</th><th>Saldo</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {lista.map((a) => (
                <tr key={a.id}>
                  <td className="font-semibold">{a.codigo}</td>
                  <td>{a.cliente_nombre ?? "—"}</td>
                  <td>{a.prenda_nombre}<span className="ml-1 text-xs" style={{ color: "var(--tenue)" }}>{[a.talla, a.color].filter(Boolean).join(" · ")}</span></td>
                  <td className="num">{pesos(a.total)}</td>
                  <td className="num">{pesos(a.abonado)}</td>
                  <td className="num" style={{ color: a.saldo > 0 ? "#D33A2C" : undefined }}>{pesos(a.saldo)}</td>
                  <td>
                    <StatusChip texto={a.estado} color={coloresEstado[a.estado]} />
                    {a.disponible && a.estado !== "Entregado" && a.estado !== "Cancelado" && (
                      <span className="ml-1"><StatusChip texto="Disponible" color="#3AA76D" /></span>
                    )}
                  </td>
                  <td>
                    <span className="flex justify-end gap-1">
                      <button className="gy-btn gy-btn-plano !p-1.5" onClick={() => setDetalle(a)} aria-label="Ver detalles" title="Ver detalles">
                        <Eye size={15} />
                      </button>
                      {puedeEscribir && a.estado !== "Entregado" && a.estado !== "Cancelado" && (
                        <button className="gy-btn gy-btn-contorno !px-2 !py-1 text-sm" onClick={() => onConvertir(a)} title="Entregar (crear venta)">
                          <PackageCheck size={14} /> Entregar
                        </button>
                      )}
                      {puedeEscribir && a.estado !== "Cancelado" && a.estado !== "Entregado" && (
                        <button className="gy-btn gy-btn-plano !p-1.5" onClick={() => onCancelar(a)} aria-label="Cancelar"><Ban size={15} /></button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal abierto={modal} onClose={() => setModal(false)} titulo="Nuevo apartado">
        <form onSubmit={onCrear} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Cliente
            <select className={inputCls} style={inputStyle} name="cliente_id" defaultValue="">
              <option value="">— Sin ficha —</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Nombre (si no tiene ficha)
            <input className={inputCls} style={inputStyle} name="cliente_nombre" placeholder="Opcional" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Prenda
            <select className={inputCls} style={inputStyle} name="prenda_id" required defaultValue=""
              onChange={(e) => {
                const p = prendas.find((x) => x.id === e.target.value);
                setPrecioSugerido(p ? String(p.precio) : "");
              }}>
              <option value="" disabled>Elige la prenda…</option>
              {prendas.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} {[p.talla, p.color].filter(Boolean).join(" ")} · stock {p.stock}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Cantidad
              <input className={inputCls} style={inputStyle} name="cantidad" type="number" min="1" defaultValue="1" required />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Precio
              <input className={inputCls} style={inputStyle} name="precio" type="number" min="0" value={precioSugerido} onChange={(e) => setPrecioSugerido(e.target.value)} required />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Abono
              <input className={inputCls} style={inputStyle} name="abono" type="number" min="0" defaultValue="0" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Método del abono
              <select className={inputCls} style={inputStyle} name="metodo" defaultValue={metodos[0] ?? ""}>
                {metodos.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Fecha límite
              <input className={inputCls} style={inputStyle} name="fecha_limite" type="date" />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variante="plano" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={ocupado}>{ocupado ? "Guardando…" : "Crear apartado"}</Button>
          </div>
        </form>
      </Modal>

      {/* Detalles del apartado */}
      <Modal abierto={!!detalle} onClose={() => setDetalle(null)} titulo={`Apartado ${detalle?.codigo ?? ""}`}>
        {detalle && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <StatusChip texto={detalle.estado} color={coloresEstado[detalle.estado]} />
              {detalle.disponible && detalle.estado !== "Entregado" && detalle.estado !== "Cancelado" && (
                <StatusChip texto="Disponible" color="#3AA76D" />
              )}
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Dato etiqueta="Cliente" valor={detalle.cliente_nombre ?? "—"} />
              <Dato etiqueta="Prenda" valor={`${detalle.prenda_nombre ?? "—"}${[detalle.talla, detalle.color].filter(Boolean).length ? " · " + [detalle.talla, detalle.color].filter(Boolean).join(" · ") : ""}`} />
              <Dato etiqueta="Cantidad" valor={String(detalle.cantidad)} />
              <Dato etiqueta="Precio unitario" valor={pesos(detalle.precio)} />
              <Dato etiqueta="Total" valor={pesos(detalle.total)} />
              <Dato etiqueta="Abonado" valor={pesos(detalle.abonado)} />
              <Dato etiqueta="Saldo" valor={pesos(detalle.saldo)} acento={detalle.saldo > 0 ? "#D33A2C" : "#3AA76D"} />
              <Dato etiqueta="Fecha" valor={fmtFecha(detalle.fecha)} />
              <Dato etiqueta="Fecha límite" valor={detalle.fecha_limite ? fmtFecha(detalle.fecha_limite) : "—"} />
            </dl>

            {detalle.observaciones && (
              <div className="text-sm">
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>Observaciones</div>
                <p className="mt-1">{detalle.observaciones}</p>
              </div>
            )}

            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>
                Abonos ({abonosDetalle.length})
              </div>
              {abonosDetalle.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--tenue)" }}>Sin abonos registrados.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {abonosDetalle.map((ab) => (
                    <div key={ab.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2 text-sm" style={{ borderColor: "var(--borde-suave)" }}>
                      <span style={{ color: "var(--tenue)" }}>{fmtFecha(ab.fecha)}</span>
                      <span>{ab.metodo ?? "—"}</span>
                      <span className="font-semibold tabular-nums">{pesos(ab.valor)}</span>
                      {ab.comprobantes.length > 0 && (
                        <button onClick={() => verComprobante(ab.comprobantes[0])} className="inline-flex items-center gap-1" style={{ color: "var(--color-secundario)" }}>
                          <FileText size={14} /> comprobante
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              {puedeEscribir && detalle.estado !== "Entregado" && detalle.estado !== "Cancelado" && (
                <Button variante="contorno" onClick={() => { const a = detalle; setDetalle(null); onConvertir(a); }}>
                  <PackageCheck size={15} /> Entregar
                </Button>
              )}
              <Button variante="plano" onClick={() => setDetalle(null)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function Dato({ etiqueta, valor, acento }: { etiqueta: string; valor: string; acento?: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>{etiqueta}</dt>
      <dd className="mt-0.5 font-medium" style={{ color: acento }}>{valor}</dd>
    </div>
  );
}
