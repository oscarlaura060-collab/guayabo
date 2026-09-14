"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Truck, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Vacio } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { crearCiudadEnvio, actualizarCiudadEnvio, activarCiudadEnvio, eliminarCiudadEnvio, guardarEnvioDefecto } from "./actions";

function norm(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export interface CiudadEnvio {
  id: string;
  ciudad: string;
  precio: number;
  activo: boolean;
}

const inputCls = "rounded-xl border bg-[var(--color-tarjeta)] px-3 py-2 text-sm outline-none";
const inputStyle = { borderColor: "var(--borde-suave)" } as const;

export function EnviosManager({ ciudades, envioDefecto }: { ciudades: CiudadEnvio[]; envioDefecto: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [ocupado, setOcupado] = useState(false);
  const [defecto, setDefecto] = useState(String(envioDefecto || ""));
  const [busqueda, setBusqueda] = useState("");

  const filtradas = useMemo(() => {
    const q = norm(busqueda);
    return q ? ciudades.filter((c) => norm(c.ciudad).includes(q)) : ciudades;
  }, [ciudades, busqueda]);

  async function onCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOcupado(true);
    const res = await crearCiudadEnvio(new FormData(e.currentTarget));
    setOcupado(false);
    if (res.ok) { toast("Ciudad agregada", "exito"); e.currentTarget.reset(); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }
  async function onPrecio(id: string, valor: string) {
    const res = await actualizarCiudadEnvio(id, Number(valor) || 0);
    if (res.ok) { toast("Precio actualizado", "exito"); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }
  async function onBorrar(c: CiudadEnvio) {
    if (!confirm(`¿Eliminar el envío de ${c.ciudad}?`)) return;
    const res = await eliminarCiudadEnvio(c.id);
    if (res.ok) { toast("Ciudad eliminada", "exito"); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }
  async function onActivo(c: CiudadEnvio) {
    const res = await activarCiudadEnvio(c.id, !c.activo);
    if (res.ok) { toast(c.activo ? "Ciudad desactivada" : "Ciudad activada", "exito"); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }
  async function onDefecto() {
    setOcupado(true);
    const res = await guardarEnvioDefecto(Number(defecto) || 0);
    setOcupado(false);
    if (res.ok) toast("Envío por defecto guardado", "exito");
    else toast(res.error ?? "Error", "error");
  }

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      {/* Envío por defecto */}
      <div className="gy-card p-4">
        <div className="mb-1 text-sm font-semibold">Otras ciudades (por defecto)</div>
        <p className="mb-3 text-xs" style={{ color: "var(--tenue)" }}>
          Se usa cuando la ciudad del cliente no está en la lista. Déjalo en 0 para “envío por confirmar”.
        </p>
        <div className="flex items-center gap-2">
          <input className={`${inputCls} w-40`} style={inputStyle} type="number" min="0" value={defecto} onChange={(e) => setDefecto(e.target.value)} placeholder="0" />
          <Button onClick={onDefecto} disabled={ocupado}><Save size={16} /> Guardar</Button>
        </div>
      </div>

      {/* Agregar ciudad */}
      <form onSubmit={onCrear} className="gy-card flex flex-wrap items-end gap-2 p-4">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
          Ciudad
          <input className={inputCls} style={inputStyle} name="ciudad" placeholder="Ej. Santa Marta" required />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Precio del envío
          <input className={`${inputCls} w-36`} style={inputStyle} name="precio" type="number" min="0" placeholder="0" required />
        </label>
        <Button type="submit" disabled={ocupado}><Plus size={16} /> Agregar</Button>
      </form>

      {/* Buscador */}
      {ciudades.length > 3 && (
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
          <input className={`${inputCls} w-full pl-9`} style={inputStyle} placeholder="Buscar ciudad…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
      )}

      {/* Lista */}
      {ciudades.length === 0 ? (
        <Vacio icono={<Truck size={28} />} titulo="Sin ciudades" descripcion="Agrega las ciudades a las que haces envíos y su precio." />
      ) : filtradas.length === 0 ? (
        <p className="px-1 text-sm" style={{ color: "var(--tenue)" }}>Ninguna ciudad coincide con “{busqueda}”.</p>
      ) : (
        <div className="gy-card divide-y" style={{ borderColor: "var(--borde-suave)" }}>
          {filtradas.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 p-3" style={{ borderColor: "var(--borde-suave)", opacity: c.activo ? 1 : 0.55 }}>
              <Truck size={16} style={{ color: "var(--color-secundario)" }} />
              <span className="flex-1 font-medium">
                {c.ciudad}
                {c.precio <= 0 && <span className="ml-2 text-xs" style={{ color: "#b8860b" }}>· sin tarifa</span>}
              </span>
              <input
                className={`${inputCls} w-28`}
                style={inputStyle}
                type="number"
                min="0"
                defaultValue={c.precio}
                onBlur={(e) => { if (Number(e.target.value) !== c.precio) onPrecio(c.id, e.target.value); }}
                aria-label={`Precio de ${c.ciudad}`}
              />
              <button
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: c.activo ? "color-mix(in srgb, #3AA76D 15%, transparent)" : "color-mix(in srgb, var(--color-texto) 8%, transparent)", color: c.activo ? "#2e8b57" : "var(--tenue)" }}
                onClick={() => onActivo(c)}
                aria-label={c.activo ? `Desactivar ${c.ciudad}` : `Activar ${c.ciudad}`}
              >
                {c.activo ? "Activa" : "Inactiva"}
              </button>
              <button className="gy-btn gy-btn-plano !p-1.5" onClick={() => onBorrar(c)} aria-label="Eliminar"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
