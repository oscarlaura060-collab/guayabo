"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, Trash2, ChevronDown } from "lucide-react";
import { StatusChip } from "@/components/ui/StatusChip";
import { Vacio } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { pesos, fecha as fmtFecha } from "@/lib/format";
import { eliminarVenta } from "./actions";

export interface LineaVenta {
  nombre: string | null;
  talla: string | null;
  color: string | null;
  cantidad: number;
  precio: number;
  total: number;
}

export interface VentaRow {
  id: string;
  numero: string | null;
  fecha: string;
  fecha_entrega: string | null;
  cliente_nombre: string | null;
  total: number;
  saldo: number;
  est_pago: string;
  estado: string;
  canal: string | null;
  canal_usuario: string | null;
  prendas?: string;
  items?: LineaVenta[];
}

const colorCanal: Record<string, string> = {
  Instagram: "#E8288E", WhatsApp: "#25D366", TikTok: "#191914",
  Facebook: "#1877F2", Presencial: "#3AA76D", "Tienda web": "#7FB2F0", Otro: "#8A8A8A",
};

const colorPago: Record<string, string> = {
  Pagado: "#3AA76D",
  Abono: "#7FB2F0",
  Pendiente: "#F4B740",
  Reembolsado: "#C4C4C4",
};

export function VentasTabla({
  ventas,
  coloresEstado,
  esAdmin = false,
}: {
  ventas: VentaRow[];
  coloresEstado: Record<string, string>;
  esAdmin?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [borrando, setBorrando] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setAbierta((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Número de columnas (para el colSpan de la fila desplegada).
  const totalCols = 8 + (esAdmin ? 1 : 0);

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return ventas;
    return ventas.filter((v) =>
      [v.numero, v.cliente_nombre, v.estado, v.canal, v.canal_usuario, v.prendas].filter(Boolean).some((x) => String(x).toLowerCase().includes(t)),
    );
  }, [ventas, q]);

  async function onEliminar(v: VentaRow) {
    if (!confirm(`¿Eliminar la venta ${v.numero ?? ""}? Devuelve el stock (reestock) y borra la venta con sus pagos. No se puede deshacer.`)) return;
    setBorrando(v.id);
    const res = await eliminarVenta(v.id);
    setBorrando(null);
    if (res.ok) {
      toast("Venta eliminada y stock devuelto", "exito");
      router.refresh();
    } else {
      toast(res.error ?? "Error", "error");
    }
  }

  if (ventas.length === 0) {
    return (
      <Vacio
        icono={<ShoppingBag size={28} />}
        titulo="Aún no hay ventas"
        descripcion="Registra tu primera venta con el flujo rápido."
      />
    );
  }

  return (
    <>
      <label className="mb-4 relative flex max-w-md items-center">
        <Search size={16} className="pointer-events-none absolute left-3" style={{ color: "var(--tenue)" }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por número, cliente, estado, canal o @usuario…"
          className="w-full rounded-full border bg-[var(--color-tarjeta)] py-2 pl-9 pr-3 text-sm outline-none"
          style={{ borderColor: "var(--borde-suave)" }}
        />
      </label>

      <div className="gy-table-wrap gy-card">
        <table className="gy-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Prendas</th>
              <th>Estado</th>
              <th>Total</th>
              <th>Saldo</th>
              <th>Pago</th>
              {esAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {lista.map((v) => {
              const items = v.items ?? [];
              const open = abierta.has(v.id);
              return (
                <Fragment key={v.id}>
                  <tr className="cursor-pointer" onClick={() => router.push(`/ventas/${v.id}`)}>
                    <td className="font-semibold" style={{ color: "var(--color-secundario)" }}>{v.numero}</td>
                    <td>{fmtFecha(v.fecha)}</td>
                    <td>
                      {v.cliente_nombre ?? "—"}
                      {(v.canal || v.canal_usuario) && (
                        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs" style={{ color: "var(--tenue)" }}>
                          {v.canal && (
                            <span className="inline-flex items-center gap-1">
                              <span className="inline-block h-2 w-2 rounded-full" style={{ background: colorCanal[v.canal] ?? "#8A8A8A" }} />
                              {v.canal}
                            </span>
                          )}
                          {v.canal_usuario && <span>· {v.canal_usuario}</span>}
                        </div>
                      )}
                    </td>
                    <td className="max-w-[18rem]" onClick={(e) => { if (items.length) { e.stopPropagation(); toggle(v.id); } }}>
                      {items.length > 0 ? (
                        <button
                          type="button"
                          className="flex max-w-full items-center gap-1 text-left text-sm"
                          style={{ color: "var(--color-secundario)" }}
                          title="Ver qué compró"
                          aria-expanded={open}
                        >
                          <ChevronDown size={14} className="shrink-0 transition-transform" style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }} />
                          <span className="truncate">{v.prendas || "—"}</span>
                        </button>
                      ) : <span style={{ color: "var(--tenue)" }}>—</span>}
                    </td>
                    <td><StatusChip texto={v.estado} color={coloresEstado[v.estado]} /></td>
                    <td className="num">{pesos(v.total)}</td>
                    <td className="num" style={{ color: v.saldo > 0 ? "#D33A2C" : undefined }}>{pesos(v.saldo)}</td>
                    <td><StatusChip texto={v.est_pago} color={colorPago[v.est_pago]} /></td>
                    {esAdmin && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className="gy-btn gy-btn-plano !p-1.5"
                          style={{ color: "#D33A2C" }}
                          onClick={() => onEliminar(v)}
                          disabled={borrando === v.id}
                          aria-label="Eliminar venta"
                          title="Eliminar venta (devuelve el stock)"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                  {open && items.length > 0 && (
                    <tr>
                      <td colSpan={totalCols} style={{ background: "color-mix(in srgb, var(--color-primario) 14%, transparent)" }}>
                        <div className="flex flex-col gap-1 px-2 py-2">
                          <div className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>
                            Qué compró {v.cliente_nombre ? `— ${v.cliente_nombre}` : ""}
                          </div>
                          {items.map((it, i) => (
                            <div key={i} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                              <span>
                                <b>{it.cantidad}×</b> {it.nombre ?? "—"}
                                {(it.talla || it.color) && (
                                  <span style={{ color: "var(--tenue)" }}> · {[it.talla, it.color].filter(Boolean).join(" · ")}</span>
                                )}
                              </span>
                              <span className="tabular-nums" style={{ color: "var(--tenue)" }}>
                                {pesos(it.precio)} c/u · <b style={{ color: "var(--color-texto)" }}>{pesos(it.total)}</b>
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
