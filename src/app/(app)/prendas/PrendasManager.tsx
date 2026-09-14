"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Archive, Shirt, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusChip } from "@/components/ui/StatusChip";
import { Vacio } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { pesos } from "@/lib/format";
import { urlImagenPrenda, estadoStock } from "@/lib/prendas";
import type { CatalogosPrenda } from "@/lib/listas";
import type { Tables } from "@/types/database.types";
import { PrendaForm } from "./PrendaForm";
import { crearPrendaMultitalla, actualizarPrenda, desactivarPrenda } from "./actions";

type Prenda = Tables<"prendas">;

export function PrendasManager({
  prendas,
  catalogos,
  puedeEscribir,
}: {
  prendas: Prenda[];
  catalogos: CatalogosPrenda;
  puedeEscribir: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [stockFiltro, setStockFiltro] = useState<"todas" | "bajo" | "agotado">("todas");
  const [modal, setModal] = useState<{ abierto: boolean; prenda: Prenda | null; esEdicion: boolean }>({
    abierto: false,
    prenda: null,
    esEdicion: false,
  });

  const categorias = useMemo(
    () => [...new Set(prendas.map((p) => p.categoria).filter(Boolean) as string[])].sort(),
    [prendas],
  );

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return prendas.filter((p) => {
      if (cat && p.categoria !== cat) return false;
      if (stockFiltro === "bajo" && !(p.stock > 0 && p.stock <= p.stock_minimo)) return false;
      if (stockFiltro === "agotado" && p.stock > 0) return false;
      if (!t) return true;
      return [p.nombre, p.codigo, p.categoria, p.color, p.talla]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(t));
    });
  }, [prendas, q, cat, stockFiltro]);

  async function onGuardar(fd: FormData) {
    const res = modal.esEdicion && modal.prenda
      ? await actualizarPrenda(modal.prenda.id, fd)
      : await crearPrendaMultitalla(fd);
    if (res.ok) {
      toast(modal.esEdicion ? "Prenda actualizada" : "Prenda(s) creada(s)", "exito");
      setModal({ abierto: false, prenda: null, esEdicion: false });
      router.refresh();
    } else {
      toast(res.error ?? "Ocurrió un error", "error");
    }
  }

  function duplicar(p: Prenda) {
    // Prefill como prenda nueva: conserva datos, sin foto y con stock en 0.
    setModal({
      abierto: true,
      esEdicion: false,
      prenda: { ...p, id: "", stock: 0, imagen_path: null, extra: {} },
    });
  }

  async function onDesactivar(p: Prenda) {
    if (!confirm(`¿Desactivar "${p.nombre}"? No se borra: deja de aparecer en el catálogo.`)) return;
    const res = await desactivarPrenda(p.id);
    if (res.ok) {
      toast("Prenda desactivada", "exito");
      router.refresh();
    } else {
      toast(res.error ?? "Ocurrió un error", "error");
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative flex min-w-56 flex-1 items-center">
          <Search size={16} className="pointer-events-none absolute left-3" style={{ color: "var(--tenue)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, código, categoría…"
            className="w-full rounded-full border bg-[var(--color-tarjeta)] py-2 pl-9 pr-3 text-sm outline-none"
            style={{ borderColor: "var(--borde-suave)" }}
          />
        </label>
        {puedeEscribir && (
          <Button onClick={() => setModal({ abierto: true, prenda: null, esEdicion: false })}>
            <Plus size={17} /> Nueva prenda
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {["todas", "bajo", "agotado"].map((f) => (
          <button
            key={f}
            onClick={() => setStockFiltro(f as typeof stockFiltro)}
            className="rounded-full border px-3 py-1.5 text-sm font-medium transition"
            style={{
              borderColor: stockFiltro === f ? "var(--color-secundario)" : "var(--borde-suave)",
              background: stockFiltro === f ? "color-mix(in srgb, var(--color-secundario) 12%, transparent)" : "transparent",
              color: stockFiltro === f ? "var(--color-secundario)" : "inherit",
            }}
          >
            {f === "todas" ? "Todas" : f === "bajo" ? "Stock bajo" : "Agotadas"}
          </button>
        ))}
        {categorias.length > 0 && <span className="mx-1 h-5 w-px" style={{ background: "var(--borde-suave)" }} />}
        {categorias.map((c) => (
          <button
            key={c}
            onClick={() => setCat(cat === c ? null : c)}
            className="rounded-full border px-3 py-1.5 text-sm font-medium transition"
            style={{
              borderColor: cat === c ? "var(--color-secundario)" : "var(--borde-suave)",
              background: cat === c ? "color-mix(in srgb, var(--color-secundario) 12%, transparent)" : "transparent",
              color: cat === c ? "var(--color-secundario)" : "inherit",
            }}
          >
            {c}
          </button>
        ))}
        <span className="ml-auto text-sm" style={{ color: "var(--tenue)" }}>{lista.length} prenda(s)</span>
      </div>

      {lista.length === 0 ? (
        <Vacio
          icono={<Shirt size={28} />}
          titulo={q ? "Sin resultados" : "Aún no hay prendas"}
          descripcion={q ? "Prueba con otra búsqueda." : "Crea tu primera prenda con su foto y desglose de costos."}
          accion={
            puedeEscribir && !q ? (
              <Button onClick={() => setModal({ abierto: true, prenda: null, esEdicion: false })}>
                <Plus size={17} /> Nueva prenda
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {lista.map((p) => {
            const url = urlImagenPrenda(p);
            const est = estadoStock(p.stock, p.stock_minimo);
            return (
              <div key={p.id} className="gy-card overflow-hidden">
                <div
                  className="relative aspect-square w-full"
                  style={{ background: "var(--color-fondo)" }}
                >
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={p.nombre} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="grid h-full place-items-center" style={{ color: "var(--tenue)" }}>
                      <Shirt size={28} />
                    </div>
                  )}
                  <div className="absolute left-2 top-2">
                    <StatusChip texto={est.etiqueta} color={est.color} />
                  </div>
                </div>
                <div className="flex flex-col gap-1 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold leading-tight">{p.nombre}</span>
                    <span className="gy-cifra shrink-0 text-sm">{pesos(p.precio)}</span>
                  </div>
                  <div className="text-xs" style={{ color: "var(--tenue)" }}>
                    {[p.codigo, p.talla, p.color].filter(Boolean).join(" · ") || "—"}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs" style={{ color: "var(--tenue)" }}>
                    <span>Stock: <b style={{ color: "var(--color-texto)" }}>{p.stock}</b></span>
                    {puedeEscribir && (
                      <span className="flex gap-1">
                        <button
                          className="gy-btn gy-btn-plano !p-1.5"
                          onClick={() => setModal({ abierto: true, prenda: p, esEdicion: true })}
                          aria-label="Editar"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="gy-btn gy-btn-plano !p-1.5"
                          onClick={() => duplicar(p)}
                          aria-label="Duplicar"
                          title="Duplicar"
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          className="gy-btn gy-btn-plano !p-1.5"
                          onClick={() => onDesactivar(p)}
                          aria-label="Desactivar"
                          title="Desactivar"
                        >
                          <Archive size={15} />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        abierto={modal.abierto}
        onClose={() => setModal({ abierto: false, prenda: null, esEdicion: false })}
        titulo={modal.esEdicion ? "Editar prenda" : modal.prenda ? "Duplicar prenda" : "Nueva prenda"}
      >
        <PrendaForm
          prenda={modal.prenda}
          catalogos={catalogos}
          esEdicion={modal.esEdicion}
          onGuardar={onGuardar}
          onCancelar={() => setModal({ abierto: false, prenda: null, esEdicion: false })}
        />
      </Modal>
    </>
  );
}
