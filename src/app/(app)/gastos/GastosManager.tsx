"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2, Receipt, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Vacio } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { pesos, fecha as fmtFecha, hoyBogota } from "@/lib/format";
import { crearGasto, actualizarGasto, desactivarGasto, subirComprobanteGasto } from "./actions";
import { firmarComprobante } from "../comprobante-actions";

export interface GastoRow {
  id: string;
  fecha: string;
  categoria: string | null;
  descripcion: string | null;
  valor: number;
  metodo: string | null;
  observaciones: string | null;
  comprobantePath: string | null;
}

const inputCls = "rounded-xl border bg-[var(--color-tarjeta)] px-3 py-2 text-sm outline-none";
const inputStyle = { borderColor: "var(--borde-suave)" } as const;

export function GastosManager({
  gastos,
  categorias,
  metodos,
  puedeEscribir,
}: {
  gastos: GastoRow[];
  categorias: string[];
  metodos: string[];
  puedeEscribir: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("");
  const [modal, setModal] = useState<{ abierto: boolean; gasto: GastoRow | null }>({ abierto: false, gasto: null });
  const [subirEn, setSubirEn] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return gastos.filter((g) => {
      if (filtro && g.categoria !== filtro) return false;
      if (!t) return true;
      return [g.descripcion, g.categoria, g.metodo].filter(Boolean).some((x) => String(x).toLowerCase().includes(t));
    });
  }, [gastos, q, filtro]);

  const total = lista.reduce((s, g) => s + g.valor, 0);
  const porCategoria = useMemo(() => {
    const m: Record<string, number> = {};
    for (const g of lista) m[g.categoria ?? "Otros"] = (m[g.categoria ?? "Otros"] ?? 0) + g.valor;
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [lista]);

  async function onGuardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOcupado(true);
    const fd = new FormData(e.currentTarget);
    const res = modal.gasto ? await actualizarGasto(modal.gasto.id, fd) : await crearGasto(fd);
    setOcupado(false);
    if (res.ok) {
      toast(modal.gasto ? "Gasto actualizado" : "Gasto registrado", "exito");
      setModal({ abierto: false, gasto: null });
      router.refresh();
    } else toast(res.error ?? "Error", "error");
  }

  async function onSubir(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!subirEn) return;
    setOcupado(true);
    const res = await subirComprobanteGasto(subirEn, new FormData(e.currentTarget));
    setOcupado(false);
    if (res.ok) { toast("Comprobante subido", "exito"); setSubirEn(null); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }

  async function onVer(path: string) {
    toast("Abriendo comprobante…", "info");
    const { url } = await firmarComprobante(path);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else toast("No se pudo abrir el comprobante", "error");
  }

  async function onBorrar(g: GastoRow) {
    if (!confirm("¿Eliminar este gasto?")) return;
    const res = await desactivarGasto(g.id);
    if (res.ok) { toast("Gasto eliminado", "exito"); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }

  const g = modal.gasto;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="gy-card px-3 py-2">
          <span className="text-xs" style={{ color: "var(--tenue)" }}>Total ({lista.length})</span>{" "}
          <b className="gy-cifra">{pesos(total)}</b>
        </div>
        {porCategoria.map(([c, v]) => (
          <button key={c} className="gy-chip" onClick={() => setFiltro(filtro === c ? "" : c)}
            style={{ cursor: "pointer", background: filtro === c ? "color-mix(in srgb, var(--color-secundario) 16%, transparent)" : "transparent", borderColor: "var(--borde-suave)" }}>
            {c}: {pesos(v)}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative flex min-w-56 flex-1 items-center">
          <Search size={16} className="pointer-events-none absolute left-3" style={{ color: "var(--tenue)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar gasto…"
            className="w-full rounded-full border bg-[var(--color-tarjeta)] py-2 pl-9 pr-3 text-sm outline-none" style={{ borderColor: "var(--borde-suave)" }} />
        </label>
        {puedeEscribir && <Button onClick={() => setModal({ abierto: true, gasto: null })}><Plus size={17} /> Nuevo gasto</Button>}
      </div>

      {lista.length === 0 ? (
        <Vacio icono={<Receipt size={28} />} titulo="Sin gastos" descripcion="Registra el primer gasto del negocio." />
      ) : (
        <div className="gy-table-wrap gy-card">
          <table className="gy-table">
            <thead>
              <tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Método</th><th>Valor</th><th>Comprobante</th>{puedeEscribir && <th></th>}</tr>
            </thead>
            <tbody>
              {lista.map((x) => (
                <tr key={x.id}>
                  <td>{fmtFecha(x.fecha)}</td>
                  <td>{x.categoria ?? "—"}</td>
                  <td>{x.descripcion ?? "—"}</td>
                  <td>{x.metodo ?? "—"}</td>
                  <td className="num font-semibold">{pesos(x.valor)}</td>
                  <td>
                    {x.comprobantePath ? (
                      <button onClick={() => onVer(x.comprobantePath!)} className="inline-flex items-center gap-1" style={{ color: "var(--color-secundario)" }}>
                        <FileText size={15} /> Ver
                      </button>
                    ) : puedeEscribir ? (
                      <button className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--tenue)" }} onClick={() => setSubirEn(x.id)}>
                        <Upload size={14} /> Subir
                      </button>
                    ) : <span style={{ color: "var(--tenue)" }}>—</span>}
                  </td>
                  {puedeEscribir && (
                    <td>
                      <span className="flex justify-end gap-1">
                        <button className="gy-btn gy-btn-plano !p-1.5" onClick={() => setModal({ abierto: true, gasto: x })} aria-label="Editar"><Pencil size={15} /></button>
                        <button className="gy-btn gy-btn-plano !p-1.5" onClick={() => onBorrar(x)} aria-label="Eliminar"><Trash2 size={15} /></button>
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal abierto={modal.abierto} onClose={() => setModal({ abierto: false, gasto: null })} titulo={g ? "Editar gasto" : "Nuevo gasto"}>
        <form onSubmit={onGuardar} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Fecha
              <input className={inputCls} style={inputStyle} name="fecha" type="date" defaultValue={g?.fecha ?? hoyBogota()} required />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Categoría
              <select className={inputCls} style={inputStyle} name="categoria" defaultValue={g?.categoria ?? categorias[0] ?? ""} required>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Descripción
            <input className={inputCls} style={inputStyle} name="descripcion" defaultValue={g?.descripcion ?? ""} required />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Valor
              <input className={inputCls} style={inputStyle} name="valor" type="number" min="1" defaultValue={g?.valor ?? ""} required />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Método
              <select className={inputCls} style={inputStyle} name="metodo" defaultValue={g?.metodo ?? ""}>
                <option value="">—</option>
                {metodos.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Comprobante {g?.comprobantePath && <span style={{ color: "var(--tenue)" }}>(ya tiene uno; subir reemplaza)</span>}
            <input className={inputCls} style={inputStyle} name="comprobante" type="file" accept="image/*,application/pdf" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Observaciones
            <input className={inputCls} style={inputStyle} name="observaciones" defaultValue={g?.observaciones ?? ""} />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variante="plano" onClick={() => setModal({ abierto: false, gasto: null })}>Cancelar</Button>
            <Button type="submit" disabled={ocupado}>{ocupado ? "Guardando…" : g ? "Guardar" : "Registrar"}</Button>
          </div>
        </form>
      </Modal>

      <Modal abierto={!!subirEn} onClose={() => setSubirEn(null)} titulo="Subir comprobante">
        <form onSubmit={onSubir} className="flex flex-col gap-3">
          <input className={inputCls} style={inputStyle} name="comprobante" type="file" accept="image/*,application/pdf" required />
          <div className="flex justify-end gap-2">
            <Button type="button" variante="plano" onClick={() => setSubirEn(null)}>Cancelar</Button>
            <Button type="submit" disabled={ocupado}>{ocupado ? "Subiendo…" : "Subir"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
