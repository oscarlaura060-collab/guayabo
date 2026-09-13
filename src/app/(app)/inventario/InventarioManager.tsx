"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, AlertTriangle, Boxes, SlidersHorizontal, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusChip } from "@/components/ui/StatusChip";
import { Vacio } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { fechaHora, pesos } from "@/lib/format";
import { estadoStock } from "@/lib/prendas";
import { ajustarStock } from "./actions";

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
  const [ajuste, setAjuste] = useState<PrendaStock | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const bajos = prendas.filter((p) => p.stock <= p.stock_minimo);
  const unidades = prendas.reduce((s, p) => s + p.stock, 0);
  const valorVenta = prendas.reduce((s, p) => s + p.stock * p.precio, 0);
  const valorCosto = prendas.reduce((s, p) => s + p.stock * p.costo, 0);
  const margenPot = valorVenta - valorCosto;

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    let r = prendas;
    if (soloBajo) r = r.filter((p) => p.stock <= p.stock_minimo);
    if (t) {
      r = r.filter((p) =>
        [p.nombre, p.codigo, p.talla, p.color].filter(Boolean).some((x) => String(x).toLowerCase().includes(t)),
      );
    }
    return [...r].sort((a, b) => a.stock - b.stock);
  }, [prendas, q, soloBajo]);

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
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={soloBajo} onChange={(e) => setSoloBajo(e.target.checked)} /> Solo stock bajo
            </label>
          </div>

          {lista.length === 0 ? (
            <Vacio icono={<Boxes size={28} />} titulo="Sin prendas" descripcion="No hay prendas que coincidan." />
          ) : (
            <div className="gy-table-wrap gy-card">
              <table className="gy-table">
                <thead>
                  <tr>
                    <th>Prenda</th><th>Stock</th><th>Mínimo</th><th>Estado</th><th>Vendidas</th>
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
                        <td className="num font-semibold">{p.stock}</td>
                        <td className="num">{p.stock_minimo}</td>
                        <td><StatusChip texto={est.etiqueta} color={est.color} /></td>
                        <td className="num">{p.vendidas}</td>
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
    </>
  );
}
