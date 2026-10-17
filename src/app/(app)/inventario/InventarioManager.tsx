"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, AlertTriangle, Boxes, SlidersHorizontal, ArrowRight, Tag, Scissors } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusChip } from "@/components/ui/StatusChip";
import { Vacio } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { fechaHora, pesos } from "@/lib/format";
import { estadoStock } from "@/lib/prendas";
import { ajustarStock, marcarSolicitada } from "./actions";

export interface PrendaStock {
  id: string;
  codigo: string | null;
  nombre: string;
  talla: string | null;
  color: string | null;
  stock: number;
  stock_minimo: number;
  vendidas: number;
  precio: number;
  costo: number;
  hecho_por: string | null;
  solicitada: boolean;
  solicitada_nota: string | null;
}
export interface Movimiento {
  id: string;
  created_at: string;
  prenda_nombre: string | null;
  tipo: string;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  referencia: string | null;
  nota: string | null;
  usuario_email: string | null;
}

const inputCls = "rounded-xl border bg-[var(--color-tarjeta)] px-3 py-2 text-sm outline-none";
const inputStyle = { borderColor: "var(--borde-suave)" } as const;
const colorTipo: Record<string, string> = { ENTRADA: "#3AA76D", SALIDA: "#D33A2C", AJUSTE: "#7FB2F0" };

export function InventarioManager({
  prendas,
  movimientos,
  puedeEscribir,
}: {
  prendas: PrendaStock[];
  movimientos: Movimiento[];
  puedeEscribir: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<"stock" | "movimientos">("stock");
  const [q, setQ] = useState("");
  const [soloBajo, setSoloBajo] = useState(false);
  const [soloSolicitadas, setSoloSolicitadas] = useState(false);
  const [hechoPor, setHechoPor] = useState("");
  const [ajuste, setAjuste] = useState<PrendaStock | null>(null);
  const [solicitud, setSolicitud] = useState<PrendaStock | null>(null);
  const [notaSolicitud, setNotaSolicitud] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const confeccionistas = useMemo(
    () => [...new Set(prendas.map((p) => (p.hecho_por ?? "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [prendas],
  );

  // Casillas de resumen: solicitadas por clientes y prendas hechas por cada persona.
  const solicitadas = useMemo(() => prendas.filter((p) => p.solicitada), [prendas]);
  const porConfeccionista = useMemo(
    () => confeccionistas.map((c) => ({
      nombre: c,
      prendas: prendas.filter((p) => (p.hecho_por ?? "").trim() === c).length,
      unidades: prendas.filter((p) => (p.hecho_por ?? "").trim() === c).reduce((s, p) => s + p.stock, 0),
    })),
    [prendas, confeccionistas],
  );

  const bajos = prendas.filter((p) => p.stock <= p.stock_minimo);
  const unidades = prendas.reduce((s, p) => s + p.stock, 0);
  const valorVenta = prendas.reduce((s, p) => s + p.stock * p.precio, 0);
  const valorCosto = prendas.reduce((s, p) => s + p.stock * p.costo, 0);
  const margenPot = valorVenta - valorCosto;

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    let r = prendas;
    if (soloBajo) r = r.filter((p) => p.stock <= p.stock_minimo);
    if (soloSolicitadas) r = r.filter((p) => p.solicitada);
    if (hechoPor) r = r.filter((p) => (p.hecho_por ?? "").trim() === hechoPor);
    if (t) {
      r = r.filter((p) =>
        [p.nombre, p.codigo, p.talla, p.color, p.hecho_por, p.solicitada_nota].filter(Boolean).some((x) => String(x).toLowerCase().includes(t)),
      );
    }
    return [...r].sort((a, b) => a.stock - b.stock);
  }, [prendas, q, soloBajo, soloSolicitadas, hechoPor]);

  const resumenHechoPor = useMemo(() => {
    if (!hechoPor) return null;
    const suyas = prendas.filter((p) => (p.hecho_por ?? "").trim() === hechoPor);
    return {
      prendas: suyas.length,
      unidades: suyas.reduce((s, p) => s + p.stock, 0),
      vendidas: suyas.reduce((s, p) => s + p.vendidas, 0),
    };
  }, [prendas, hechoPor]);

  async function onAjustar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOcupado(true);
    const res = await ajustarStock(new FormData(e.currentTarget));
    setOcupado(false);
    if (res.ok) {
      toast("Stock actualizado", "exito");
      setAjuste(null);
      router.refresh();
    } else {
      toast(res.error ?? "Error", "error");
    }
  }

  function abrirSolicitud(p: PrendaStock) {
    setNotaSolicitud(p.solicitada_nota ?? "");
    setSolicitud(p);
  }

  async function guardarSolicitud(solicitada: boolean) {
    if (!solicitud) return;
    setOcupado(true);
    const res = await marcarSolicitada({ prendaId: solicitud.id, solicitada, nota: notaSolicitud });
    setOcupado(false);
    if (res.ok) {
      toast(solicitada ? "Marcada como solicitada" : "Solicitud quitada", "exito");
      setSolicitud(null);
      router.refresh();
    } else {
      toast(res.error ?? "Error", "error");
    }
  }

  return (
    <>
      {/* Resumen del inventario */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="gy-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>Unidades en stock</div>
          <div className="gy-cifra mt-2 text-2xl">{unidades}</div>
        </div>
        <div className="gy-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>Valor a precio de venta</div>
          <div className="gy-cifra mt-2 text-2xl" style={{ color: "var(--color-secundario)" }}>{pesos(valorVenta)}</div>
        </div>
        <div className="gy-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>Valor a costo</div>
          <div className="gy-cifra mt-2 text-2xl">{pesos(valorCosto)}</div>
        </div>
        <div className="gy-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>Margen potencial</div>
          <div className="gy-cifra mt-2 text-2xl" style={{ color: "#3AA76D" }}>{pesos(margenPot)}</div>
        </div>
      </div>

      {/* Casillas: solicitadas por clientes y hechas por cada confeccionista */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button
          onClick={() => { setTab("stock"); setSoloSolicitadas((v) => !v); setSoloBajo(false); }}
          className="gy-card p-4 text-left"
          style={soloSolicitadas ? { outline: "2px solid var(--color-primario)", outlineOffset: "-2px" } : undefined}
          title="Ver prendas solicitadas por clientes"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>
            <Tag size={14} style={{ color: "var(--color-secundario)" }} /> Solicitadas por clientes
          </div>
          <div className="gy-cifra mt-2 text-2xl" style={{ color: "var(--color-secundario)" }}>{solicitadas.length}</div>
          <div className="text-xs" style={{ color: "var(--tenue)" }}>prenda(s) por hacer / reponer</div>
        </button>
        {porConfeccionista.map((c) => (
          <button
            key={c.nombre}
            onClick={() => { setTab("stock"); setHechoPor(hechoPor === c.nombre ? "" : c.nombre); }}
            className="gy-card p-4 text-left"
            style={hechoPor === c.nombre ? { outline: "2px solid var(--color-primario)", outlineOffset: "-2px" } : undefined}
            title={`Ver prendas hechas por ${c.nombre}`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>
              <Scissors size={14} style={{ color: "var(--color-primario-fuerte, #9a6f0a)" }} /> Hechas por {c.nombre}
            </div>
            <div className="gy-cifra mt-2 text-2xl">{c.prendas}</div>
            <div className="text-xs" style={{ color: "var(--tenue)" }}>{c.unidades} unidad(es) en stock</div>
          </button>
        ))}
      </div>

      {bajos.length > 0 && (
        <button
          onClick={() => { setTab("stock"); setSoloBajo(true); }}
          className="mb-4 flex w-full items-center gap-2 rounded-2xl border p-3 text-left text-sm"
          style={{ borderColor: "color-mix(in srgb, #F4B740 50%, transparent)", background: "color-mix(in srgb, #F4B740 12%, transparent)" }}
        >
          <AlertTriangle size={18} style={{ color: "#9a6f0a" }} />
          <span><b>{bajos.length}</b> prenda(s) con stock bajo o agotado. Toca para verlas.</span>
        </button>
      )}

      <div className="mb-4 flex gap-2">
        <button className="gy-pill" data-activo={tab === "stock"} onClick={() => setTab("stock")}>
          <Boxes size={16} /> Stock
        </button>
        <button className="gy-pill" data-activo={tab === "movimientos"} onClick={() => setTab("movimientos")}>
          <SlidersHorizontal size={16} /> Movimientos
        </button>
      </div>

      {tab === "stock" && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="relative flex min-w-56 flex-1 items-center">
              <Search size={16} className="pointer-events-none absolute left-3" style={{ color: "var(--tenue)" }} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar prenda…"
                className="w-full rounded-full border bg-[var(--color-tarjeta)] py-2 pl-9 pr-3 text-sm outline-none"
                style={{ borderColor: "var(--borde-suave)" }}
              />
            </label>
            {confeccionistas.length > 0 && (
              <label className="flex items-center gap-2 text-sm font-medium">
                Hecho por
                <select
                  className={inputCls}
                  style={inputStyle}
                  value={hechoPor}
                  onChange={(e) => setHechoPor(e.target.value)}
                >
                  <option value="">Todas</option>
                  {confeccionistas.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={soloBajo} onChange={(e) => setSoloBajo(e.target.checked)} /> Solo stock bajo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={soloSolicitadas} onChange={(e) => setSoloSolicitadas(e.target.checked)} /> Solo solicitadas
            </label>
          </div>

          {resumenHechoPor && (
            <div
              className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-2xl border p-3 text-sm"
              style={{ borderColor: "color-mix(in srgb, var(--color-secundario) 40%, transparent)", background: "color-mix(in srgb, var(--color-secundario) 10%, transparent)" }}
            >
              <span className="font-semibold">Prendas realizadas por {hechoPor}</span>
              <span><b>{resumenHechoPor.prendas}</b> prenda(s)</span>
              <span><b>{resumenHechoPor.unidades}</b> unidad(es) en stock</span>
              <span><b>{resumenHechoPor.vendidas}</b> vendida(s)</span>
            </div>
          )}

          {lista.length === 0 ? (
            <Vacio icono={<Boxes size={28} />} titulo="Sin prendas" descripcion="No hay prendas que coincidan." />
          ) : (
            <div className="gy-table-wrap gy-card">
              <table className="gy-table">
                <thead>
                  <tr>
                    <th>Prenda</th><th>Hecho por</th><th>Stock</th><th>Mínimo</th><th>Estado</th><th>Vendidas</th><th>Solicitada</th>
                    {puedeEscribir && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {lista.map((p) => {
                    const est = estadoStock(p.stock, p.stock_minimo);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="font-medium">{p.nombre}</div>
                          <div className="text-xs" style={{ color: "var(--tenue)" }}>
                            {[p.codigo, p.talla, p.color].filter(Boolean).join(" · ")}
                          </div>
                        </td>
                        <td>
                          {p.hecho_por ? (
                            <button
                              className="rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{ background: "color-mix(in srgb, var(--color-secundario) 14%, transparent)", color: "var(--color-secundario)" }}
                              onClick={() => { setTab("stock"); setHechoPor(p.hecho_por!.trim()); }}
                            >
                              {p.hecho_por}
                            </button>
                          ) : (
                            <span style={{ color: "var(--tenue)" }}>—</span>
                          )}
                        </td>
                        <td className="num font-semibold">{p.stock}</td>
                        <td className="num">{p.stock_minimo}</td>
                        <td><StatusChip texto={est.etiqueta} color={est.color} /></td>
                        <td className="num">{p.vendidas}</td>
                        <td>
                          {puedeEscribir ? (
                            <button
                              className="rounded-full px-2 py-0.5 text-xs font-medium"
                              style={p.solicitada
                                ? { background: "color-mix(in srgb, var(--color-secundario) 16%, transparent)", color: "var(--color-secundario)" }
                                : { border: "1px dashed var(--borde-suave)", color: "var(--tenue)" }}
                              onClick={() => abrirSolicitud(p)}
                              title={p.solicitada_nota || "Marcar como solicitada por un cliente"}
                            >
                              {p.solicitada ? "✓ Solicitada" : "+ Marcar"}
                            </button>
                          ) : (
                            p.solicitada
                              ? <span className="text-xs font-medium" style={{ color: "var(--color-secundario)" }} title={p.solicitada_nota || ""}>✓ Solicitada</span>
                              : <span style={{ color: "var(--tenue)" }}>—</span>
                          )}
                        </td>
                        {puedeEscribir && (
                          <td>
                            <button className="gy-btn gy-btn-contorno !px-2 !py-1 text-sm" onClick={() => setAjuste(p)}>
                              Ajustar
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "movimientos" && (
        movimientos.length === 0 ? (
          <Vacio icono={<SlidersHorizontal size={28} />} titulo="Sin movimientos" descripcion="Aún no hay movimientos de inventario." />
        ) : (
          <div className="gy-table-wrap gy-card">
            <table className="gy-table">
              <thead>
                <tr><th>Fecha</th><th>Prenda</th><th>Tipo</th><th>Cant.</th><th>Stock</th><th>Referencia</th></tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id}>
                    <td>{fechaHora(m.created_at)}</td>
                    <td>{m.prenda_nombre ?? "—"}</td>
                    <td><StatusChip texto={m.tipo} color={colorTipo[m.tipo] ?? "#888"} /></td>
                    <td className="num">{m.cantidad}</td>
                    <td className="num">
                      <span style={{ color: "var(--tenue)" }}>{m.stock_anterior}</span>
                      <ArrowRight size={12} className="mx-1 inline" style={{ color: "var(--tenue)" }} />
                      <b>{m.stock_nuevo}</b>
                    </td>
                    <td>
                      {m.referencia ?? "—"}
                      {m.nota && <div className="text-xs" style={{ color: "var(--tenue)" }}>{m.nota}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Modal ajuste */}
      <Modal abierto={!!ajuste} onClose={() => setAjuste(null)} titulo={`Ajustar stock · ${ajuste?.nombre ?? ""}`}>
        {ajuste && (
          <form onSubmit={onAjustar} className="flex flex-col gap-3">
            <input type="hidden" name="prenda_id" value={ajuste.id} />
            <p className="text-sm" style={{ color: "var(--tenue)" }}>
              Stock actual: <b style={{ color: "var(--color-texto)" }}>{ajuste.stock}</b>
            </p>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Tipo de movimiento
              <select className={inputCls} style={inputStyle} name="tipo" defaultValue="ENTRADA">
                <option value="ENTRADA">Entrada (sumar)</option>
                <option value="SALIDA">Salida (restar)</option>
                <option value="AJUSTE">Ajuste (fijar stock)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Cantidad
              <input className={inputCls} style={inputStyle} name="cantidad" type="number" min="0" required />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Nota (opcional)
              <input className={inputCls} style={inputStyle} name="nota" placeholder="Ej. compra de mercancía, conteo físico…" />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variante="plano" onClick={() => setAjuste(null)}>Cancelar</Button>
              <Button type="submit" disabled={ocupado}>{ocupado ? "Guardando…" : "Aplicar"}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal solicitud de cliente */}
      <Modal abierto={!!solicitud} onClose={() => setSolicitud(null)} titulo={`Solicitud de cliente · ${solicitud?.nombre ?? ""}`}>
        {solicitud && (
          <div className="flex flex-col gap-3">
            <p className="text-sm" style={{ color: "var(--tenue)" }}>
              Marca esta prenda como <b style={{ color: "var(--color-texto)" }}>solicitada por un cliente</b> para tenerla a la vista y saber qué mandar a hacer.
            </p>
            <label className="flex flex-col gap-1 text-sm font-medium">
              ¿Quién la pidió? (opcional)
              <input
                className={inputCls}
                style={inputStyle}
                value={notaSolicitud}
                onChange={(e) => setNotaSolicitud(e.target.value)}
                placeholder="Ej. Laura por WhatsApp · talla M"
                maxLength={300}
              />
            </label>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variante="plano" onClick={() => setSolicitud(null)}>Cancelar</Button>
              {solicitud.solicitada && (
                <Button type="button" variante="contorno" disabled={ocupado} onClick={() => guardarSolicitud(false)}>
                  Quitar solicitud
                </Button>
              )}
              <Button type="button" disabled={ocupado} onClick={() => guardarSolicitud(true)}>
                {ocupado ? "Guardando…" : "Marcar como solicitada"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
