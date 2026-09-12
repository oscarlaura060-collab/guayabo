"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Archive, Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusChip } from "@/components/ui/StatusChip";
import { Vacio, Cargando } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { pesos, fecha as fmtFecha } from "@/lib/format";
import type { Tables } from "@/types/database.types";
import { ClienteForm } from "./ClienteForm";
import {
  crearCliente,
  actualizarCliente,
  desactivarCliente,
  resumenCliente,
  type ResumenCliente,
} from "./actions";

type Cliente = Tables<"clientes">;

function soloDigitos(s: string | null): string | null {
  if (!s) return null;
  const d = s.replace(/\D/g, "");
  return d.length >= 7 ? d : null;
}

export function ClientesManager({
  clientes,
  puedeEscribir,
}: {
  clientes: Cliente[];
  puedeEscribir: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<{ abierto: boolean; cliente: Cliente | null }>({
    abierto: false,
    cliente: null,
  });
  const [ficha, setFicha] = useState<Cliente | null>(null);
  const [resumen, setResumen] = useState<ResumenCliente | null>(null);

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return clientes;
    return clientes.filter((c) =>
      [c.nombre, c.codigo, c.ciudad, c.telefono, c.whatsapp, c.documento, c.email]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(t)),
    );
  }, [clientes, q]);

  async function onGuardar(fd: FormData) {
    const res = modal.cliente
      ? await actualizarCliente(modal.cliente.id, fd)
      : await crearCliente(fd);
    if (res.ok) {
      toast(modal.cliente ? "Cliente actualizado" : "Cliente creado", "exito");
      setModal({ abierto: false, cliente: null });
      router.refresh();
    } else {
      toast(res.error ?? "Ocurrió un error", "error");
    }
  }

  async function onDesactivar(c: Cliente) {
    if (!confirm(`¿Desactivar a "${c.nombre}"? No se borra: deja de aparecer en el listado.`)) return;
    const res = await desactivarCliente(c.id);
    if (res.ok) {
      toast("Cliente desactivado", "exito");
      router.refresh();
    } else {
      toast(res.error ?? "Ocurrió un error", "error");
    }
  }

  async function abrirFicha(c: Cliente) {
    setFicha(c);
    setResumen(null);
    setResumen(await resumenCliente(c.id));
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative flex min-w-56 flex-1 items-center">
          <Search size={16} className="pointer-events-none absolute left-3" style={{ color: "var(--tenue)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, código, ciudad, teléfono…"
            className="w-full rounded-full border bg-[var(--color-tarjeta)] py-2 pl-9 pr-3 text-sm outline-none"
            style={{ borderColor: "var(--borde-suave)" }}
          />
        </label>
        {puedeEscribir && (
          <Button onClick={() => setModal({ abierto: true, cliente: null })}>
            <Plus size={17} /> Nuevo cliente
          </Button>
        )}
      </div>

      {lista.length === 0 ? (
        <Vacio
          icono={<Users size={28} />}
          titulo={q ? "Sin resultados" : "Aún no hay clientes"}
          descripcion={q ? "Prueba con otra búsqueda." : "Agrega tu primer cliente."}
          accion={
            puedeEscribir && !q ? (
              <Button onClick={() => setModal({ abierto: true, cliente: null })}>
                <Plus size={17} /> Nuevo cliente
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="gy-table-wrap gy-card">
          <table className="gy-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Código</th>
                <th>Ciudad</th>
                <th>WhatsApp</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => {
                const wa = soloDigitos(c.whatsapp);
                return (
                  <tr key={c.id}>
                    <td>
                      <button
                        className="font-semibold hover:underline"
                        style={{ color: "var(--color-secundario)" }}
                        onClick={() => abrirFicha(c)}
                      >
                        {c.nombre}
                      </button>
                      {c.email && (
                        <div className="text-xs" style={{ color: "var(--tenue)" }}>{c.email}</div>
                      )}
                    </td>
                    <td>{c.codigo ?? "—"}</td>
                    <td>{c.ciudad ?? "—"}</td>
                    <td>
                      {wa ? (
                        <a
                          href={`https://wa.me/57${wa}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1"
                          style={{ color: "#25D366" }}
                        >
                          <MessageCircle size={15} /> {c.whatsapp}
                        </a>
                      ) : (
                        c.whatsapp || "—"
                      )}
                    </td>
                    <td>
                      {puedeEscribir && (
                        <span className="flex justify-end gap-1">
                          <button
                            className="gy-btn gy-btn-plano !p-1.5"
                            onClick={() => setModal({ abierto: true, cliente: c })}
                            aria-label="Editar"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="gy-btn gy-btn-plano !p-1.5"
                            onClick={() => onDesactivar(c)}
                            aria-label="Desactivar"
                            title="Desactivar"
                          >
                            <Archive size={15} />
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Alta / edición */}
      <Modal
        abierto={modal.abierto}
        onClose={() => setModal({ abierto: false, cliente: null })}
        titulo={modal.cliente ? "Editar cliente" : "Nuevo cliente"}
      >
        <ClienteForm
          cliente={modal.cliente}
          onGuardar={onGuardar}
          onCancelar={() => setModal({ abierto: false, cliente: null })}
        />
      </Modal>

      {/* Ficha */}
      <Modal abierto={!!ficha} onClose={() => setFicha(null)} titulo={ficha?.nombre}>
        {ficha && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Dato etiqueta="Código" valor={ficha.codigo} />
              <Dato etiqueta="Documento" valor={ficha.documento} />
              <Dato etiqueta="Teléfono" valor={ficha.telefono} />
              <Dato etiqueta="WhatsApp" valor={ficha.whatsapp} />
              <Dato etiqueta="Ciudad" valor={ficha.ciudad} />
              <Dato etiqueta="Correo" valor={ficha.email} />
              <div className="col-span-2">
                <Dato etiqueta="Dirección" valor={ficha.direccion} />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="gy-card flex-1 p-3">
                <div className="text-xs" style={{ color: "var(--tenue)" }}>Total comprado</div>
                <div className="gy-cifra text-xl">{resumen ? pesos(resumen.totalComprado) : "…"}</div>
              </div>
              <div className="gy-card flex-1 p-3">
                <div className="text-xs" style={{ color: "var(--tenue)" }}>Saldo pendiente</div>
                <div className="gy-cifra text-xl" style={{ color: resumen && resumen.saldoPendiente > 0 ? "#D33A2C" : undefined }}>
                  {resumen ? pesos(resumen.saldoPendiente) : "…"}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold">Historial</div>
              {!resumen ? (
                <Cargando filas={2} />
              ) : resumen.pedidos.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--tenue)" }}>Sin compras registradas.</p>
              ) : (
                <div className="gy-table-wrap">
                  <table className="gy-table">
                    <thead>
                      <tr><th>Número</th><th>Fecha</th><th>Total</th><th>Pago</th></tr>
                    </thead>
                    <tbody>
                      {resumen.pedidos.map((p) => (
                        <tr key={p.id}>
                          <td>{p.numero}</td>
                          <td>{fmtFecha(p.fecha)}</td>
                          <td className="num">{pesos(p.total)}</td>
                          <td><StatusChip texto={p.est_pago} color={p.est_pago === "Pagado" ? "#3AA76D" : p.est_pago === "Abono" ? "#7FB2F0" : "#F4B740"} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {puedeEscribir && (
              <div className="flex justify-end">
                <Button
                  variante="contorno"
                  onClick={() => {
                    const c = ficha;
                    setFicha(null);
                    setModal({ abierto: true, cliente: c });
                  }}
                >
                  <Pencil size={15} /> Editar
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div>
      <div className="text-xs" style={{ color: "var(--tenue)" }}>{etiqueta}</div>
      <div>{valor || "—"}</div>
    </div>
  );
}
