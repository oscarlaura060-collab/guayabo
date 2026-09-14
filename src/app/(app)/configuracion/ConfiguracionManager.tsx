"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2, Users, Plus, ShieldCheck, ListChecks } from "lucide-react";
import { CatalogosEditor, type ListaRow } from "./CatalogosEditor";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusChip } from "@/components/ui/StatusChip";
import { useToast } from "@/components/ui/Toast";
import { guardarConfig, actualizarPerfil, crearUsuario, subirLogo, subirFotosPortada, subirImagenConfig, guardarConfigUpsert } from "./actions";
import { comprimirImagen } from "@/lib/imagen";

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

// Imágenes de la vitrina que se pueden reemplazar fácilmente.
const ASSETS_VITRINA = [
  { clave: "NOSOTROS_FOTO_URL", etiqueta: "Nosotros · foto del equipo (arriba)", ancho: 1600 },
  { clave: "EQUIPO_MELA_URL", etiqueta: "Nosotros · foto de Mela", ancho: 900 },
  { clave: "EQUIPO_KARINA_URL", etiqueta: "Nosotros · foto de Karina", ancho: 900 },
  { clave: "EQUIPO_OSCAR_URL", etiqueta: "Nosotros · foto de Oscar", ancho: 900 },
  { clave: "EQUIPO_SOMBRERO_URL", etiqueta: "Nosotros · sombrero vueltiao (PNG transparente)", ancho: 900 },
  { clave: "MEMORIA_FONDO_URL", etiqueta: "Memoria · fondo tropical", ancho: 2000 },
  { clave: "MEMORIA_CAYEYE_URL", etiqueta: "Memoria · foto Cayeye", ancho: 800 },
  { clave: "MEMORIA_PATACONES_URL", etiqueta: "Memoria · foto Patacones", ancho: 800 },
  { clave: "MEMORIA_RASPAO_URL", etiqueta: "Memoria · foto Raspao", ancho: 800 },
] as const;

export function ConfiguracionManager({
  config,
  perfiles,
  listas,
  currentUserId,
}: {
  config: ConfigRow[];
  perfiles: PerfilRow[];
  listas: ListaRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<"general" | "catalogos" | "cuentas">("general");

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

  const [subiendoLogo, setSubiendoLogo] = useState(false);
  async function onLogo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubiendoLogo(true);
    const res = await subirLogo(new FormData(e.currentTarget));
    setSubiendoLogo(false);
    if (res.ok) { toast("Logo actualizado", "exito"); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }

  // Fotos de portada (inicio)
  const portadaActual: string[] = (() => {
    try {
      const arr = JSON.parse(valores.HERO_IMAGENES ?? "[]");
      return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  })();
  const [subiendoPortada, setSubiendoPortada] = useState(false);
  const [estadoPortada, setEstadoPortada] = useState("");
  async function onPortada(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.querySelector<HTMLInputElement>('input[name="portada"]');
    const archivos = Array.from(input?.files ?? []);
    if (archivos.length === 0) { toast("Elige al menos una imagen.", "error"); return; }
    const form = e.currentTarget;

    setSubiendoPortada(true);
    setEstadoPortada("Optimizando imagen…");
    try {
      // Optimización del lado del cliente (banners grandes → WebP ~2000px).
      const fd = new FormData();
      fd.set("conservar", JSON.stringify(portadaActual));
      for (const f of archivos) fd.append("portada", await comprimirImagen(f, { maxLado: 2000 }));

      setEstadoPortada("Subiendo…");
      const res = await subirFotosPortada(fd);
      if (res.ok) {
        setEstadoPortada("Imagen lista para publicar.");
        toast("Fotos de portada actualizadas", "exito");
        form.reset();
        router.refresh();
      } else {
        setEstadoPortada("");
        toast(res.error ?? "Esta imagen no pudo procesarse. Intenta nuevamente.", "error");
      }
    } catch {
      setEstadoPortada("");
      toast("Esta imagen no pudo procesarse. Intenta nuevamente.", "error");
    } finally {
      setSubiendoPortada(false);
    }
  }
  async function quitarPortada(url: string) {
    const fd = new FormData();
    fd.set("conservar", JSON.stringify(portadaActual.filter((u) => u !== url)));
    setSubiendoPortada(true);
    const res = await subirFotosPortada(fd);
    setSubiendoPortada(false);
    if (res.ok) { toast("Foto quitada", "exito"); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }

  // Un uploader por imagen de la vitrina.
  function SubirAsset({ clave, etiqueta, ancho }: { clave: string; etiqueta: string; ancho: number }) {
    const [subiendo, setSubiendo] = useState(false);
    const actual = valores[clave];
    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const input = e.currentTarget.querySelector<HTMLInputElement>('input[type="file"]');
      const file = input?.files?.[0];
      if (!file) { toast("Elige una imagen.", "error"); return; }
      const form = e.currentTarget;
      setSubiendo(true);
      try {
        const comp = await comprimirImagen(file, { maxLado: ancho });
        const fd = new FormData();
        fd.set("archivo", comp);
        const res = await subirImagenConfig(clave, fd);
        if (res.ok) { toast("Imagen actualizada", "exito"); form.reset(); router.refresh(); }
        else toast(res.error ?? "Error", "error");
      } catch {
        toast("Esta imagen no pudo procesarse. Intenta nuevamente.", "error");
      } finally {
        setSubiendo(false);
      }
    }
    return (
      <div className="flex items-center gap-3 rounded-xl border p-2" style={{ borderColor: "var(--borde-suave)" }}>
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg" style={{ background: "var(--color-primario)" }}>
          {actual ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={actual} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs" style={{ color: "var(--color-secundario)" }}>—</span>
          )}
        </div>
        <form onSubmit={onSubmit} className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-xs font-medium">{etiqueta}</span>
          <div className="flex flex-wrap items-center gap-2">
            <input className={`${inputCls} min-w-0 flex-1`} style={inputStyle} type="file" accept="image/*" required />
            <Button type="submit" disabled={subiendo}>{subiendo ? "Subiendo…" : "Subir"}</Button>
          </div>
        </form>
      </div>
    );
  }

  // Enlaces sociales (se crean si no existen).
  const [tiktok, setTiktok] = useState(valores.TIKTOK_URL ?? "");
  const [playlist, setPlaylist] = useState(valores.PLAYLIST_URL ?? "");
  const [guardandoEnlaces, setGuardandoEnlaces] = useState(false);
  async function onGuardarEnlaces() {
    setGuardandoEnlaces(true);
    const res = await guardarConfigUpsert({ TIKTOK_URL: tiktok.trim(), PLAYLIST_URL: playlist.trim() });
    setGuardandoEnlaces(false);
    if (res.ok) { toast("Enlaces guardados", "exito"); router.refresh(); }
    else toast(res.error ?? "Error", "error");
  }

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
        <button className="gy-pill" data-activo={tab === "catalogos"} onClick={() => setTab("catalogos")}>
          <ListChecks size={16} /> Catálogos
        </button>
        <button className="gy-pill" data-activo={tab === "cuentas"} onClick={() => setTab("cuentas")}>
          <Users size={16} /> Cuentas
        </button>
      </div>

      {tab === "catalogos" && <CatalogosEditor listas={listas} />}

      {tab === "general" && (
        <>
          {/* Logo de la marca */}
          <div className="gy-card mb-4 p-4">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>Logo de la marca</div>
            <div className="flex flex-wrap items-center gap-4">
              {valores.LOGO_URL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={valores.LOGO_URL} alt="Logo" className="h-16 w-16 rounded-xl object-contain" style={{ background: "var(--color-primario)" }} />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-xl text-xl font-bold" style={{ background: "var(--color-secundario)", color: "#fff" }}>G</div>
              )}
              <form onSubmit={onLogo} className="flex flex-wrap items-center gap-2">
                <input className={inputCls} style={inputStyle} name="logo" type="file" accept="image/*" required />
                <Button type="submit" disabled={subiendoLogo}>{subiendoLogo ? "Subiendo…" : "Subir logo"}</Button>
              </form>
            </div>
            <p className="mt-2 text-xs" style={{ color: "var(--tenue)" }}>Aparece en el menú y en la pantalla de entrada. Usa un PNG o JPG cuadrado.</p>
          </div>

          {/* Fotos de portada (inicio) */}
          <div className="gy-card mb-4 p-4">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>Fotos de portada (inicio)</div>
            {portadaActual.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {portadaActual.map((url) => (
                  <div key={url} className="relative h-24 w-20 overflow-hidden rounded-xl border" style={{ borderColor: "var(--borde-suave)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Portada" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => quitarPortada(url)} disabled={subiendoPortada} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full text-xs text-white" style={{ background: "#D33A2C" }} aria-label="Quitar">×</button>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={onPortada} className="flex flex-wrap items-center gap-2">
              <input className={inputCls} style={inputStyle} name="portada" type="file" accept="image/*" multiple required />
              <Button type="submit" disabled={subiendoPortada}>{subiendoPortada ? (estadoPortada || "Subiendo…") : "Agregar fotos"}</Button>
              {estadoPortada && !subiendoPortada && (
                <span className="text-xs font-medium" style={{ color: "#3AA76D" }}>{estadoPortada}</span>
              )}
            </form>
            <p className="mt-2 text-xs" style={{ color: "var(--tenue)" }}>Se optimizan automáticamente (WebP). Se muestran en el carrusel del inicio; si no subes ninguna, se usan las fotos de tus productos.</p>
          </div>

          {/* Imágenes de la vitrina (Nosotros y Memoria) */}
          <div className="gy-card mb-4 p-4">
            <div className="mb-1 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>Imágenes de la vitrina</div>
            <p className="mb-3 text-xs" style={{ color: "var(--tenue)" }}>Fotos del equipo (Nosotros) y de los platos (Memoria Colectiva). Se optimizan a WebP al subir. Para el sombrero usa un PNG con fondo transparente.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ASSETS_VITRINA.map((a) => (
                <SubirAsset key={a.clave} clave={a.clave} etiqueta={a.etiqueta} ancho={a.ancho} />
              ))}
            </div>
          </div>

          {/* Enlaces del inicio (botones) */}
          <div className="gy-card mb-4 p-4">
            <div className="mb-1 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--tenue)" }}>Enlaces del inicio</div>
            <p className="mb-3 text-xs" style={{ color: "var(--tenue)" }}>Activan los botones de TikTok y de la playlist en la página de inicio. Pega el enlace completo (https://…).</p>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium">
                TikTok
                <input className={`${inputCls} w-full`} style={inputStyle} value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="https://www.tiktok.com/@guayabo" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium">
                Playlist (Spotify, YouTube…)
                <input className={`${inputCls} w-full`} style={inputStyle} value={playlist} onChange={(e) => setPlaylist(e.target.value)} placeholder="https://open.spotify.com/playlist/…" />
              </label>
              <div className="flex justify-end">
                <Button onClick={onGuardarEnlaces} disabled={guardandoEnlaces}>{guardandoEnlaces ? "Guardando…" : "Guardar enlaces"}</Button>
              </div>
            </div>
          </div>

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
