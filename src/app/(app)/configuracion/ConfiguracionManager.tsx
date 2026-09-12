"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2, Users, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusChip } from "@/components/ui/StatusChip";
import { useToast } from "@/components/ui/Toast";
import { guardarConfig, actualizarPerfil, crearUsuario } from "./actions";

export interface ConfigRow {
  clave: string;
  valor: string;
  tipo: string | null;
  grupo: string | null;
  descripcion: string | null;
}
export interface PerfilRow {
  id: string;
  email: string;
  nombre: string | null;
  rol: string;
  activo: boolean;
}

const ROLES = ["ADMINISTRADOR", "VENDEDOR", "CONSULTA"] as const;
const ROL_DESC: Record<string, string> = {
  ADMINISTRADOR: "Acceso total, incluida configuración y finanzas.",
  VENDEDOR: "Ventas, pedidos, prendas, clientes y pagos. Sin gastos, utilidades ni configuración.",
  CONSULTA: "Solo lectura de lo operativo.",
};
const colorRol: Record<string, string> = { ADMINISTRADOR: "#E8288E", VENDEDOR: "#3AA76D", CONSULTA: "#7FB2F0" };

const inputCls = "rounded-xl border bg-[var(--color-tarjeta)] px-3 py-2 text-sm outline-none";
const inputStyle = { borderColor: "var(--borde-suave)" } as const;

export function ConfiguracionManager({
  config,
  perfiles,
  currentUserId,
}: {
  config: ConfigRow[];
  perfiles: PerfilRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<"general" | "cuentas">("general");

  // ---- Config editable ----
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(config.map((c) => [c.clave, c.valor])),
  );
  const [guardando, setGuardando] = useState(false);

  const grupos = useMemo(() => {
    const m = new Map<string, ConfigRow[]>();
    for (const c of config) {
      const g = c.grupo || "OTROS";
      if (!m.has(g)) m.set(g, []);
      m.get(g)!.push(c);
    }
    return [...m.entries()];
  }, [config]);

  const cambios = useMemo(
    () => config.filter((c) => valores[c.clave] !== c.valor).map((c) => c.clave),
    [config, valores],
  );

  async function onGuardar() {
    if (cambios.length === 0) {
      toast("No hay cambios por guardar", "info");
      return;
    }
    setGuardando(true);
    const dirty = Object.fromEntries(cambios.map((k) => [k, valores[k]]));
    const res = await guardarConfig(dirty);
    setGuardando(false);
    if (res.ok) {
      toast("Configuración guardada", "exito");
      router.refresh();
    } else {
      toast(res.error ?? "Error", "error");
    }
  }

  function campo(c: ConfigRow) {
    const v = valores[c.clave] ?? "";
    const set = (nv: string) => setValores((s) => ({ ...s, [c.clave]: nv }));
    const tipo = c.tipo ?? "texto";

    if (tipo === "color") {
      return (
        <div className="flex items-center gap-2">
          <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(v) ? v : "#000000"} onChange={(e) => set(e.target.value)} className="h-9 w-10 rounded-md border" style={inputStyle} />
          <input className={`${inputCls} w-32`} style={inputStyle} value={v} onChange={(e) => set(e.target.value)} />
        </div>
      );
    }
    if (tipo === "booleano") {
      return (
        <select className={inputCls} style={inputStyle} value={v} onChange={(e) => set(e.target.value)}>
          <option value="TRUE">Sí</option>
          <option value="FALSE">No</option>
        </select>
      );
    }
    if (tipo.startsWith("lista:")) {
      const opts = tipo.slice(6).split(",").map((s) => s.trim());
      return (
        <select className={inputCls} style={inputStyle} value={v} onChange={(e) => set(e.target.value)}>
          {opts.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (tipo === "numero") {
      return <input type="number" className={`${inputCls} w-32`} style={inputStyle} value={v} onChange={(e) => set(e.target.value)} />;
    }
    if (v.length > 60) {
      return <textarea className={`${inputCls} w-full`} style={inputStyle} rows={2} value={v} onChange={(e) => set(e.target.value)} />;
    }
    return <input className={`${inputCls} w-full max-w-xs`} style={inputStyle} value={v} onChange={(e) => set(e.target.value)} />;
  }

  // ---- Cuentas ----
  const [modalCuenta, setModalCuenta] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  async function onRol(p: PerfilRow, rol: string) {
    const res = await actualizarPerfil(p.id, { rol });
    if (res.ok) { toast(`${p.email}: ${rol}`, "exito"); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }
  async function onActivo(p: PerfilRow, activo: boolean) {
    const res = await actualizarPerfil(p.id, { activo });
    if (res.ok) { toast(`${p.email} ${activo ? "activado" : "desactivado"}`, "exito"); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }
  async function onCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOcupado(true);
    const res = await crearUsuario(new FormData(e.currentTarget));
    setOcupado(false);
    if (res.ok) { toast("Cuenta creada", "exito"); setModalCuenta(false); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }

  return (
    <>
      <div className="mb-4 flex gap-2">
        <button className="gy-pill" data-activo={tab === "general"} onClick={() => setTab("general")}>
          <Settings2 size={16} /> General
        </button>
        <button className="gy-pill" data-activo={tab === "cuentas"} onClick={() => setTab("cuentas")}>
          <Users size={16} /> Cuentas
        </button>
      </div>

      {tab === "general" && (
        <>
          <div className="mb-3 flex items-center justify-end gap-3">
            {cambios.length > 0 && (
              <span className="text-sm" style={{ color: "var(--tenue)" }}>{cambios.length} cambio(s) sin guardar</span>
            )}
            <Button onClick={onGuardar} disabled={guardando || cambios.length === 0}>
              {guardando ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {grupos.map(([grupo, filas]) => (
              <div key={grupo} className="gy-card p-4">
                <div className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>{grupo}</div>
                <div className="flex flex-col gap-3">
                  {filas.map((c) => (
                    <div key={c.clave} className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-sm" htmlFor={c.clave}>
                        {c.descripcion || c.clave}
                      </label>
                      <div id={c.clave}>{campo(c)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "cuentas" && (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm" style={{ color: "var(--tenue)" }}>
              Da acceso por rol. Cambia el rol o activa/desactiva a cada persona.
            </p>
            <Button onClick={() => setModalCuenta(true)}>
              <Plus size={17} /> Nueva cuenta
            </Button>
          </div>

          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            {ROLES.map((r) => (
              <div key={r} className="gy-card p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck size={15} style={{ color: colorRol[r] }} /> {r}
                </div>
                <p className="mt-1 text-xs" style={{ color: "var(--tenue)" }}>{ROL_DESC[r]}</p>
              </div>
            ))}
          </div>

          <div className="gy-table-wrap gy-card">
            <table className="gy-table">
              <thead>
                <tr><th>Cuenta</th><th>Rol</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {perfiles.map((p) => {
                  const esYo = p.id === currentUserId;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="font-medium">{p.nombre || p.email.split("@")[0]}</div>
                        <div className="text-xs" style={{ color: "var(--tenue)" }}>
                          {p.email}{esYo && " · tú"}
                        </div>
                      </td>
                      <td>
                        <select
                          className={inputCls}
                          style={inputStyle}
                          value={p.rol}
                          disabled={esYo}
                          onChange={(e) => onRol(p, e.target.value)}
                          title={esYo ? "No puedes cambiar tu propio rol" : undefined}
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td>
                        {esYo ? (
                          <StatusChip texto="Activo" color="#3AA76D" />
                        ) : (
                          <button
                            className="gy-btn gy-btn-plano !px-2 !py-1"
                            onClick={() => onActivo(p, !p.activo)}
                          >
                            <StatusChip texto={p.activo ? "Activo" : "Inactivo"} color={p.activo ? "#3AA76D" : "#C4C4C4"} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Modal abierto={modalCuenta} onClose={() => setModalCuenta(false)} titulo="Nueva cuenta">
            <form onSubmit={onCrear} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium">
                Nombre
                <input className={inputCls} style={inputStyle} name="nombre" required />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium">
                Correo
                <input className={inputCls} style={inputStyle} name="email" type="email" required />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm font-medium">
                  Rol
                  <select className={inputCls} style={inputStyle} name="rol" defaultValue="VENDEDOR">
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium">
                  Contraseña inicial
                  <input className={inputCls} style={inputStyle} name="password" type="text" minLength={8} required />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="activo" defaultChecked /> Activa de inmediato
              </label>
              <p className="text-xs" style={{ color: "var(--tenue)" }}>
                Comparte la contraseña con la persona; podrá cambiarla luego. Requiere tener configurada la clave service_role.
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" variante="plano" onClick={() => setModalCuenta(false)}>Cancelar</Button>
                <Button type="submit" disabled={ocupado}>{ocupado ? "Creando…" : "Crear cuenta"}</Button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </>
  );
}
