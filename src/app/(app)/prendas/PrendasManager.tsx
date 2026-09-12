"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Archive, Shirt } from "lucide-react";
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
import { crearPrenda, actualizarPrenda, desactivarPrenda } from "./actions";

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
  const [modal, setModal] = useState<{ abierto: boolean; prenda: Prenda | null }>({
    abierto: false,
    prenda: null,
  });

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return prendas;
    return prendas.filter((p) =>
      [p.nombre, p.codigo, p.categoria, p.color, p.talla]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(t)),
    );
  }, [prendas, q]);

  async function onGuardar(fd: FormData) {
    const res = modal.prenda
      ? await actualizarPrenda(modal.prenda.id, fd)
      : await crearPrenda(fd);
    if (res.ok) {
      toast(modal.prenda ? "Prenda actualizada" : "Prenda creada", "exito");
      setModal({ abierto: false, prenda: null });
      router.refresh();
    } else {
      toast(res.error ?? "Ocurrió un error", "error");
    }
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
          <Button onClick={() => setModal({ abierto: true, prenda: null })}>
            <Plus size={17} /> Nueva prenda
          </Button>
        )}
      </div>

      {lista.length === 0 ? (
        <Vacio
          icono={<Shirt size={28} />}
          titulo={q ? "Sin resultados" : "Aún no hay prendas"}
          descripcion={q ? "Prueba con otra búsqueda." : "Crea tu primera prenda con su foto y desglose de costos."}
          accion={
            puedeEscribir && !q ? (
              <Button onClick={() => setModal({ abierto: true, prenda: null })}>
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
                          onClick={() => setModal({ abierto: true, prenda: p })}
                          aria-label="Editar"
                          title="Editar"
                        >
                          <Pencil size={15} />
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
        onClose={() => setModal({ abierto: false, prenda: null })}
        titulo={modal.prenda ? "Editar prenda" : "Nueva prenda"}
      >
        <PrendaForm
          prenda={modal.prenda}
          catalogos={catalogos}
          onGuardar={onGuardar}
          onCancelar={() => setModal({ abierto: false, prenda: null })}
        />
      </Modal>
    </>
  );
}
