"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, FileText, Upload, Ban, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusChip } from "@/components/ui/StatusChip";
import { Vacio } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { pesos, fecha as fmtFecha, hoyBogota } from "@/lib/format";
import { registrarPago, subirComprobante, anularPago } from "./actions";
import { firmarComprobante } from "../comprobante-actions";

export interface PagoRow {
  id: string;
  fecha: string;
  cliente_nombre: string | null;
  pedido_numero: string | null;
  metodo: string | null;
  tipo_pago: string | null;
  valor: number;
  observaciones: string | null;
  comprobantePath: string | null;
}
export interface PedidoPendiente {
  id: string;
  numero: string | null;
  cliente_nombre: string | null;
  saldo: number;
}

const inputCls = "rounded-xl border bg-[var(--color-tarjeta)] px-3 py-2 text-sm outline-none";
const inputStyle = { borderColor: "var(--borde-suave)" } as const;

const colorMetodo: Record<string, string> = {
  Efectivo: "#3AA76D",
  Transferencia: "#7FB2F0",
  Nequi: "#E8288E",
  Daviplata: "#D33A2C",
  Bancolombia: "#F4B740",
  Tarjeta: "#9B7FF0",
  Otro: "#8A8A8A",
};

export function PagosManager({
  pagos,
  pendientes,
  metodos,
  puedeEscribir,
}: {
  pagos: PagoRow[];
  pendientes: PedidoPendiente[];
  metodos: string[];
  puedeEscribir: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [filtroMetodo, setFiltroMetodo] = useState("");
  const [modalPago, setModalPago] = useState(false);
  const [subirEn, setSubirEn] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return pagos.filter((p) => {
      if (filtroMetodo && p.metodo !== filtroMetodo) return false;
      if (!t) return true;
      return [p.cliente_nombre, p.pedido_numero, p.metodo, p.observaciones]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(t));
    });
  }, [pagos, q, filtroMetodo]);

  const totalFiltrado = lista.reduce((s, p) => s + p.valor, 0);
  const porMetodo = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of lista) m[p.metodo ?? "Otro"] = (m[p.metodo ?? "Otro"] ?? 0) + p.valor;
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [lista]);

  async function onRegistrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOcupado(true);
    const res = await registrarPago(new FormData(e.currentTarget));
    setOcupado(false);
    if (res.ok) {
      toast("Pago registrado", "exito");
      setModalPago(false);
      router.refresh();
    } else {
      toast(res.error ?? "Error", "error");
    }
  }

  async function onSubir(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!subirEn) return;
    setOcupado(true);
    const res = await subirComprobante(subirEn, new FormData(e.currentTarget));
    setOcupado(false);
    if (res.ok) {
      toast("Comprobante subido", "exito");
      setSubirEn(null);
      router.refresh();
    } else {
      toast(res.error ?? "Error", "error");
    }
  }

  async function onVer(path: string) {
    toast("Abriendo comprobante…", "info");
    const { url } = await firmarComprobante(path);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else toast("No se pudo abrir el comprobante", "error");
  }

  async function onAnular(p: PagoRow) {
    if (!confirm(`¿Anular el pago de ${pesos(p.valor)} de ${p.cliente_nombre ?? "—"}? Se recalculará el saldo.`)) return;
    const res = await anularPago(p.id);
    if (res.ok) {
      toast("Pago anulado", "exito");
      router.refresh();
    } else {
      toast(res.error ?? "Error", "error");
    }
  }

  return (
    <>
      {/* Totales por método */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="gy-card px-3 py-2">
          <span className="text-xs" style={{ color: "var(--tenue)" }}>Total ({lista.length})</span>{" "}
          <b className="gy-cifra">{pesos(totalFiltrado)}</b>
        </div>
        {porMetodo.map(([m, v]) => (
          <button
            key={m}
            className="gy-chip"
            onClick={() => setFiltroMetodo(filtroMetodo === m ? "" : m)}
            style={{
              background: filtroMetodo === m ? `color-mix(in srgb, ${colorMetodo[m] ?? "#888"} 22%, transparent)` : "transparent",
              borderColor: `color-mix(in srgb, ${colorMetodo[m] ?? "#888"} 45%, transparent)`,
              cursor: "pointer",
            }}
            title="Filtrar por método"
          >
            <span className="gy-chip-dot" style={{ background: colorMetodo[m] ?? "#888" }} />
            {m}: {pesos(v)}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative flex min-w-56 flex-1 items-center">
          <Search size={16} className="pointer-events-none absolute left-3" style={{ color: "var(--tenue)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por cliente, pedido, método…"
            className="w-full rounded-full border bg-[var(--color-tarjeta)] py-2 pl-9 pr-3 text-sm outline-none"
            style={{ borderColor: "var(--borde-suave)" }}
          />
        </label>
        {puedeEscribir && (
          <Button onClick={() => setModalPago(true)}>
            <Plus size={17} /> Registrar pago
          </Button>
        )}
      </div>

      {lista.length === 0 ? (
        <Vacio icono={<CreditCard size={28} />} titulo="Sin pagos" descripcion="Aún no hay pagos que coincidan." />
      ) : (
        <div className="gy-table-wrap gy-card">
          <table className="gy-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Compra</th>
                <th>Método</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Comprobante</th>
                {puedeEscribir && <th></th>}
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id}>
                  <td>{fmtFecha(p.fecha)}</td>
                  <td>{p.cliente_nombre ?? "—"}</td>
                  <td className="font-semibold">{p.pedido_numero ?? "—"}</td>
                  <td><StatusChip texto={p.metodo ?? "—"} color={colorMetodo[p.metodo ?? ""] ?? "#888"} /></td>
                  <td><span className="text-xs" style={{ color: "var(--tenue)" }}>{p.tipo_pago ?? "—"}</span></td>
                  <td className="num font-semibold">{pesos(p.valor)}</td>
                  <td>
                    {p.comprobantePath ? (
                      <button onClick={() => onVer(p.comprobantePath!)} className="inline-flex items-center gap-1" style={{ color: "var(--color-secundario)" }}>
                        <FileText size={15} /> Ver
                      </button>
                    ) : puedeEscribir ? (
                      <button className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--tenue)" }} onClick={() => setSubirEn(p.id)}>
                        <Upload size={14} /> Subir
                      </button>
                    ) : (
                      <span style={{ color: "var(--tenue)" }}>—</span>
                    )}
                  </td>
                  {puedeEscribir && (
                    <td>
                      <button className="gy-btn gy-btn-plano !p-1.5" onClick={() => onAnular(p)} aria-label="Anular" title="Anular pago">
                        <Ban size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Registrar pago */}
      <Modal abierto={modalPago} onClose={() => setModalPago(false)} titulo="Registrar pago">
        <form onSubmit={onRegistrar} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Compra (con saldo pendiente)
            <select className={inputCls} style={inputStyle} name="pedido_id" required defaultValue="">
              <option value="" disabled>Elige el pedido…</option>
              {pendientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.numero} · {p.cliente_nombre ?? "—"} · saldo {pesos(p.saldo)}
                </option>
              ))}
            </select>
          </label>
          {pendientes.length === 0 && (
            <p className="text-xs" style={{ color: "var(--tenue)" }}>No hay pedidos con saldo pendiente.</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Valor
              <input className={inputCls} style={inputStyle} name="valor" type="number" min="1" required />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Método
              <select className={inputCls} style={inputStyle} name="metodo" required defaultValue={metodos[0] ?? ""}>
                {metodos.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Fecha
            <input className={inputCls} style={inputStyle} name="fecha" type="date" defaultValue={hoyBogota()} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Comprobante (opcional)
            <input className={inputCls} style={inputStyle} name="comprobante" type="file" accept="image/*,application/pdf" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Observaciones
            <input className={inputCls} style={inputStyle} name="observaciones" />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variante="plano" onClick={() => setModalPago(false)}>Cancelar</Button>
            <Button type="submit" disabled={ocupado || pendientes.length === 0}>
              {ocupado ? "Guardando…" : "Registrar pago"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Subir comprobante */}
      <Modal abierto={!!subirEn} onClose={() => setSubirEn(null)} titulo="Subir comprobante">
        <form onSubmit={onSubir} className="flex flex-col gap-3">
          <input ref={fileRef} className={inputCls} style={inputStyle} name="comprobante" type="file" accept="image/*,application/pdf" required />
          <div className="flex justify-end gap-2">
            <Button type="button" variante="plano" onClick={() => setSubirEn(null)}>Cancelar</Button>
            <Button type="submit" disabled={ocupado}>{ocupado ? "Subiendo…" : "Subir"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
