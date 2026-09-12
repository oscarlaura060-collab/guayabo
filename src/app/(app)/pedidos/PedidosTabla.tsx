"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, PackageCheck, AlertTriangle } from "lucide-react";
import { StatusChip } from "@/components/ui/StatusChip";
import { Vacio } from "@/components/ui/States";
import { pesos, fecha as fmtFecha } from "@/lib/format";

export interface PedidoRow {
  id: string;
  numero: string | null;
  fecha: string;
  fecha_entrega: string | null;
  cliente_nombre: string | null;
  total: number;
  saldo: number;
  estado: string;
  est_pago: string;
}

const ESTADOS_FINALES = new Set(["Entregado", "Cancelado"]);

export function PedidosTabla({
  pedidos,
  coloresEstado,
}: {
  pedidos: PedidoRow[];
  coloresEstado: Record<string, string>;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const hoy = new Date().toISOString().slice(0, 10);

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return pedidos;
    return pedidos.filter((p) =>
      [p.numero, p.cliente_nombre, p.estado].filter(Boolean).some((x) => String(x).toLowerCase().includes(t)),
    );
  }, [pedidos, q]);

  if (pedidos.length === 0) {
    return (
      <Vacio
        icono={<PackageCheck size={28} />}
        titulo="Aún no hay pedidos"
        descripcion="Crea un pedido con fecha de entrega estimada."
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
          placeholder="Buscar por número, cliente o estado…"
          className="w-full rounded-full border bg-[var(--color-tarjeta)] py-2 pl-9 pr-3 text-sm outline-none"
          style={{ borderColor: "var(--borde-suave)" }}
        />
      </label>

      <div className="gy-table-wrap gy-card">
        <table className="gy-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Cliente</th>
              <th>Entrega</th>
              <th>Estado</th>
              <th>Total</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => {
              const atrasado =
                p.fecha_entrega && p.fecha_entrega < hoy && !ESTADOS_FINALES.has(p.estado);
              return (
                <tr
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/pedidos/${p.id}`)}
                >
                  <td className="font-semibold" style={{ color: "var(--color-secundario)" }}>{p.numero}</td>
                  <td>{p.cliente_nombre ?? "—"}</td>
                  <td>
                    {p.fecha_entrega ? fmtFecha(p.fecha_entrega) : "—"}
                    {atrasado && (
                      <span className="ml-1 inline-flex items-center gap-0.5 text-xs" style={{ color: "#D33A2C" }}>
                        <AlertTriangle size={12} /> atrasado
                      </span>
                    )}
                  </td>
                  <td><StatusChip texto={p.estado} color={coloresEstado[p.estado]} /></td>
                  <td className="num">{pesos(p.total)}</td>
                  <td className="num" style={{ color: p.saldo > 0 ? "#D33A2C" : undefined }}>{pesos(p.saldo)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
