"use client";

import { useMemo, useState } from "react";
import { Trash2, Plus, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { pesos } from "@/lib/format";
import { urlImagenPrenda, desgloseCostos } from "@/lib/prendas";
import { comprimirImagen } from "@/lib/imagen";
import type { CatalogosPrenda } from "@/lib/listas";
import type { Tables } from "@/types/database.types";

type Prenda = Tables<"prendas">;
interface CostoRow {
  nombre: string;
  valor: string;
}

const inputCls =
  "rounded-xl border bg-[var(--color-tarjeta)] px-3 py-2 text-sm outline-none";
const inputStyle = { borderColor: "var(--borde-suave)" } as const;

export function PrendaForm({
  prenda,
  catalogos,
  esEdicion = false,
  onGuardar,
  onCancelar,
}: {
  prenda: Prenda | null;
  catalogos: CatalogosPrenda;
  esEdicion?: boolean;
  onGuardar: (fd: FormData) => Promise<void>;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(prenda?.nombre ?? "");
  const [categoria, setCategoria] = useState(prenda?.categoria ?? "");
  const [talla, setTalla] = useState(prenda?.talla ?? "");
  const [color, setColor] = useState(prenda?.color ?? "");
  const [precio, setPrecio] = useState(String(prenda?.precio ?? ""));
  const [stock, setStock] = useState(String(prenda?.stock ?? "0"));
  const [stockMin, setStockMin] = useState(String(prenda?.stock_minimo ?? "5"));
  const [descripcion] = useState(prenda?.descripcion ?? "");
  const [observaciones, setObservaciones] = useState(prenda?.observaciones ?? "");
  const [costos, setCostos] = useState<CostoRow[]>(
    prenda ? desgloseCostos(prenda.costos).map((c) => ({ nombre: c.nombre, valor: String(c.valor) })) : [],
  );
  const [imagen, setImagen] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(prenda ? urlImagenPrenda(prenda) : null);
  const [destacado, setDestacado] = useState(prenda?.destacado ?? false);
  const [enviando, setEnviando] = useState(false);

  // Galería de fotos adicionales (se guardan en extra.imagenes).
  const imagenesIniciales = useMemo(() => {
    const e = (prenda?.extra ?? {}) as Record<string, unknown>;
    return Array.isArray(e.imagenes) ? (e.imagenes as unknown[]).filter((x): x is string => typeof x === "string") : [];
  }, [prenda]);
  const [galeria, setGaleria] = useState<string[]>(imagenesIniciales);
  const [nuevasFotos, setNuevasFotos] = useState<File[]>([]);
  const BASE_STORAGE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/prendas/`;

  const costoTotal = useMemo(
    () => costos.reduce((s, c) => s + (Number(c.valor) || 0), 0),
    [costos],
  );
  const margen = (Number(precio) || 0) - costoTotal;

  function setCosto(i: number, campo: keyof CostoRow, valor: string) {
    setCostos((cs) => cs.map((c, idx) => (idx === i ? { ...c, [campo]: valor } : c)));
  }

  function onImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setImagen(f);
    if (f) setPreviewUrl(URL.createObjectURL(f));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const fd = new FormData();
    fd.set("nombre", nombre);
    fd.set("categoria", categoria);
    fd.set("talla", talla);
    fd.set("color", color);
    fd.set("precio", precio || "0");
    fd.set("stock", stock || "0");
    fd.set("stock_minimo", stockMin || "0");
    fd.set("descripcion", descripcion);
    fd.set("observaciones", observaciones);
    fd.set("destacado", destacado ? "on" : "");
    fd.set(
      "costos",
      JSON.stringify(
        costos
          .filter((c) => c.nombre && Number(c.valor) > 0)
          .map((c) => ({ nombre: c.nombre, valor: Number(c.valor) })),
      ),
    );
    if (imagen) fd.set("imagen", await comprimirImagen(imagen));
    // Galería: qué fotos existentes se conservan + las nuevas (comprimidas).
    fd.set("imagenes_conservar", JSON.stringify(galeria));
    for (const f of nuevasFotos) fd.append("imagenes", await comprimirImagen(f));
    await onGuardar(fd);
    setEnviando(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Imagen */}
        <label
          className="grid h-32 w-32 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl border text-center"
          style={{ borderColor: "var(--borde-suave)", background: "var(--color-fondo)" }}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Prenda" className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-xs" style={{ color: "var(--tenue)" }}>
              <ImagePlus size={22} />
              Foto
            </span>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={onImagen} />
        </label>

        <div className="flex flex-1 flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Nombre
            <input className={inputCls} style={inputStyle} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Categoría
              <select className={inputCls} style={inputStyle} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="">—</option>
                {catalogos.categorias.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Precio
              <input className={inputCls} style={inputStyle} type="number" min="0" value={precio} onChange={(e) => setPrecio(e.target.value)} />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Talla
          <select className={inputCls} style={inputStyle} value={talla} onChange={(e) => setTalla(e.target.value)}>
            <option value="">—</option>
            {catalogos.tallas.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Color
          <select className={inputCls} style={inputStyle} value={color} onChange={(e) => setColor(e.target.value)}>
            <option value="">—</option>
            {catalogos.colores.map((c) => (
              <option key={c.nombre} value={c.nombre}>{c.nombre}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Stock
          <input className={inputCls} style={inputStyle} type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Stock mínimo
          <input className={inputCls} style={inputStyle} type="number" min="0" value={stockMin} onChange={(e) => setStockMin(e.target.value)} />
        </label>
      </div>

      {/* Desglose de costos */}
      <div className="rounded-2xl border p-3" style={{ borderColor: "var(--borde-suave)" }}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold">Desglose de costos</span>
          <button
            type="button"
            className="gy-btn gy-btn-plano !px-2 !py-1 text-sm"
            onClick={() => setCostos((cs) => [...cs, { nombre: "", valor: "" }])}
          >
            <Plus size={15} /> Agregar
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {costos.length === 0 && (
            <p className="text-xs" style={{ color: "var(--tenue)" }}>
              Sin componentes. Agrega Tela, Confección, etc. El costo es la suma.
            </p>
          )}
          {costos.map((c, i) => (
            <div key={i} className="flex gap-2">
              <select
                className={`${inputCls} flex-1`}
                style={inputStyle}
                value={c.nombre}
                onChange={(e) => setCosto(i, "nombre", e.target.value)}
              >
                <option value="">Componente…</option>
                {catalogos.componentes.map((comp) => (
                  <option key={comp} value={comp}>{comp}</option>
                ))}
              </select>
              <input
                className={`${inputCls} w-32`}
                style={inputStyle}
                type="number"
                min="0"
                placeholder="Valor"
                value={c.valor}
                onChange={(e) => setCosto(i, "valor", e.target.value)}
              />
              <button
                type="button"
                className="gy-btn gy-btn-plano !px-2"
                onClick={() => setCostos((cs) => cs.filter((_, idx) => idx !== i))}
                aria-label="Quitar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap justify-end gap-x-6 gap-y-1 text-sm">
          <span style={{ color: "var(--tenue)" }}>
            Costo: <b style={{ color: "var(--color-texto)" }}>{pesos(costoTotal)}</b>
          </span>
          <span style={{ color: "var(--tenue)" }}>
            Margen:{" "}
            <b style={{ color: margen >= 0 ? "#3AA76D" : "#D33A2C" }}>{pesos(margen)}</b>
          </span>
        </div>
      </div>

      {/* Fotos adicionales (galería para la vitrina) */}
      <div className="rounded-2xl border p-3" style={{ borderColor: "var(--borde-suave)" }}>
        <div className="mb-2 text-sm font-semibold">Fotos adicionales <span className="font-normal" style={{ color: "var(--tenue)" }}>(se ven en la tienda)</span></div>
        <div className="flex flex-wrap gap-2">
          {galeria.map((path) => (
            <div key={path} className="relative h-20 w-16 overflow-hidden rounded-xl border" style={{ borderColor: "var(--borde-suave)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${BASE_STORAGE}${path}`} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => setGaleria((g) => g.filter((x) => x !== path))} className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full text-white" style={{ background: "#D33A2C" }} aria-label="Quitar">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          {nuevasFotos.map((f, i) => (
            <div key={i} className="relative h-20 w-16 overflow-hidden rounded-xl border" style={{ borderColor: "var(--color-secundario)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => setNuevasFotos((n) => n.filter((_, idx) => idx !== i))} className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full text-white" style={{ background: "#D33A2C" }} aria-label="Quitar">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          <label className="grid h-20 w-16 cursor-pointer place-items-center rounded-xl border text-center" style={{ borderColor: "var(--borde-suave)", background: "var(--color-fondo)", color: "var(--tenue)" }}>
            <span className="flex flex-col items-center gap-0.5 text-[11px]"><ImagePlus size={18} /> Agregar</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { setNuevasFotos((n) => [...n, ...Array.from(e.target.files ?? [])]); e.target.value = ""; }} />
          </label>
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Observaciones
        <textarea className={inputCls} style={inputStyle} rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={destacado} onChange={(e) => setDestacado(e.target.checked)} />
        Destacar en la tienda (aparece en “Destacados” de la vitrina)
      </label>

      <div className="flex justify-end gap-2">
        <Button type="button" variante="plano" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear prenda"}
        </Button>
      </div>
    </form>
  );
}
