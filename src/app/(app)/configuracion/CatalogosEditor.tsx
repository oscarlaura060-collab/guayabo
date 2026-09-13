"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { crearLista, actualizarLista, eliminarLista } from "./actions";

export interface ListaRow {
  id: string;
  tipo: string;
  nombre: string;
  hex: string | null;
  ambito: string | null;
  activo: boolean;
  orden: number;
}

const TIPOS: { tipo: string; label: string; color: boolean; ambito: boolean }[] = [
  { tipo: "CATEGORIA", label: "Categorías de prenda", color: false, ambito: false },
  { tipo: "TALLA", label: "Tallas", color: false, ambito: false },
  { tipo: "COLOR", label: "Colores de prenda", color: true, ambito: false },
  { tipo: "METODO_PAGO", label: "Métodos de pago", color: false, ambito: false },
  { tipo: "CATEGORIA_GASTO", label: "Categorías de gasto", color: false, ambito: false },
  { tipo: "COMPONENTE_COSTO", label: "Componentes de costo", color: false, ambito: false },
  { tipo: "ESTADO", label: "Estados", color: true, ambito: true },
];
const AMBITOS = ["PEDIDO", "APARTADO", "PAGO"];

const inputCls = "rounded-xl border bg-[var(--color-tarjeta)] px-3 py-2 text-sm outline-none";
const inputStyle = { borderColor: "var(--borde-suave)" } as const;

export function CatalogosEditor({ listas }: { listas: ListaRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [tipoSel, setTipoSel] = useState("CATEGORIA");
  const conf = TIPOS.find((t) => t.tipo === tipoSel)!;

  const items = useMemo(
    () => listas.filter((l) => l.tipo === tipoSel).sort((a, b) => a.orden - b.orden),
    [listas, tipoSel],
  );

  // Formulario "agregar"
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoHex, setNuevoHex] = useState("#D2DE52");
  const [nuevoAmbito, setNuevoAmbito] = useState("PEDIDO");
  const [ocupado, setOcupado] = useState(false);

  async function agregar() {
    if (!nuevoNombre.trim()) { toast("Escribe un nombre", "error"); return; }
    setOcupado(true);
    const res = await crearLista({
      tipo: tipoSel,
      nombre: nuevoNombre,
      hex: conf.color ? nuevoHex : null,
      ambito: conf.ambito ? nuevoAmbito : null,
    });
    setOcupado(false);
    if (res.ok) { toast("Agregado", "exito"); setNuevoNombre(""); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {TIPOS.map((t) => (
          <button key={t.tipo} className="gy-pill" data-activo={t.tipo === tipoSel} onClick={() => setTipoSel(t.tipo)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Agregar */}
      <div className="gy-card p-4">
        <div className="mb-2 text-sm font-semibold">Agregar a “{conf.label}”</div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span style={{ color: "var(--tenue)" }}>Nombre</span>
            <input className={`${inputCls} min-w-40`} style={inputStyle} value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Ej. Vestidos" />
          </label>
          {conf.color && (
            <label className="flex flex-col gap-1 text-sm">
              <span style={{ color: "var(--tenue)" }}>Color</span>
              <input type="color" value={nuevoHex} onChange={(e) => setNuevoHex(e.target.value)} className="h-9 w-12 rounded-md border" style={inputStyle} />
            </label>
          )}
          {conf.ambito && (
            <label className="flex flex-col gap-1 text-sm">
              <span style={{ color: "var(--tenue)" }}>Ámbito</span>
              <select className={inputCls} style={inputStyle} value={nuevoAmbito} onChange={(e) => setNuevoAmbito(e.target.value)}>
                {AMBITOS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
          )}
          <Button onClick={agregar} disabled={ocupado}><Plus size={16} /> Agregar</Button>
        </div>
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--tenue)" }}>Sin elementos todavía.</p>
        ) : (
          items.map((item) => <Fila key={item.id} item={item} conf={conf} />)
        )}
      </div>
    </div>
  );
}

function Fila({
  item,
  conf,
}: {
  item: ListaRow;
  conf: { color: boolean; ambito: boolean };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [nombre, setNombre] = useState(item.nombre);
  const [hex, setHex] = useState(item.hex ?? "#D2DE52");
  const [ambito, setAmbito] = useState(item.ambito ?? "PEDIDO");
  const [activo, setActivo] = useState(item.activo);
  const [ocupado, setOcupado] = useState(false);

  const cambiado =
    nombre !== item.nombre ||
    (conf.color && hex !== (item.hex ?? "#D2DE52")) ||
    (conf.ambito && ambito !== (item.ambito ?? "PEDIDO")) ||
    activo !== item.activo;

  async function guardar() {
    setOcupado(true);
    const res = await actualizarLista(item.id, {
      nombre,
      hex: conf.color ? hex : undefined,
      ambito: conf.ambito ? ambito : undefined,
      activo,
    });
    setOcupado(false);
    if (res.ok) { toast("Guardado", "exito"); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }
  async function borrar() {
    if (!confirm(`¿Eliminar “${item.nombre}”? Dejará de aparecer en las listas.`)) return;
    setOcupado(true);
    const res = await eliminarLista(item.id);
    setOcupado(false);
    if (res.ok) { toast("Eliminado", "exito"); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border p-2" style={{ borderColor: "var(--borde-suave)", opacity: activo ? 1 : 0.6 }}>
      {conf.color && (
        <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="h-8 w-9 rounded-md border" style={inputStyle} aria-label="Color" />
      )}
      <input className={`${inputCls} min-w-40 flex-1`} style={inputStyle} value={nombre} onChange={(e) => setNombre(e.target.value)} />
      {conf.ambito && (
        <select className={inputCls} style={inputStyle} value={ambito} onChange={(e) => setAmbito(e.target.value)}>
          {AMBITOS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      )}
      <label className="flex items-center gap-1 text-xs" style={{ color: "var(--tenue)" }}>
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} /> Activo
      </label>
      <button className="gy-btn gy-btn-contorno !px-2 !py-1 text-sm" onClick={guardar} disabled={ocupado || !cambiado} title="Guardar"><Check size={15} /></button>
      <button className="gy-btn gy-btn-plano !p-1.5" style={{ color: "#D33A2C" }} onClick={borrar} disabled={ocupado} aria-label="Eliminar"><Trash2 size={15} /></button>
    </div>
  );
}
