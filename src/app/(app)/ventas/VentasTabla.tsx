"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag } from "lucide-react";
import { StatusChip } from "@/components/ui/StatusChip";
import { Vacio } from "@/components/ui/States";
import { pesos, fecha as fmtFecha } from "@/lib/format";

export interface VentaRow {
  id: string;
  numero: string | null;
  fecha: string;
  fecha_entrega: string | null;
  cliente_nombre: string | null;
  total: number;
  saldo: number;
  est_pago: string;
  estado: string;
}

const colorPago: Record<string, string> = {
  Pagado: "#3AA76D",
  Abono: "#7FB2F0",
  Pendiente: "#F4B740",
  Reembolsado: "#C4C4C4",
};

export function VentasTabla({
  ventas,
  coloresEstado,
}: {
  ventas: VentaRow[];
  coloresEstado: Record<string, string>;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return ventas;
    return ventas.filter((v) =>
      [v.numero, v.cliente_nombre, v.estado].filter(Boolean).some((x) => String(x).toLowerCase().includes(t)),
    );
  }, [ventas, q]);

  if (ventas.length === 0) {
    return (
      <Vacio
        icono={<ShoppingBag size={28} />}
        titulo="Aún no hay ventas"
        descripcion="Registra tu primera venta con el flujo rápido."
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
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Total</th>
              <th>Saldo</th>
              <th>Pago</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((v) => (
              <tr key={v.id} className="cursor-pointer" onClick={() => router.push(`/ventas/${v.id}`)}>
                <td className="font-semibold" style={{ color: "var(--color-secundario)" }}>{v.numero}</td>
                <td>{fmtFecha(v.fecha)}</td>
                <td>{v.cliente_nombre ?? "—"}</td>
                <td><StatusChip texto={v.estado} color={coloresEstado[v.estado]} /></td>
                <td className="num">{pesos(v.total)}</td>
                <td className="num" style={{ color: v.saldo > 0 ? "#D33A2C" : undefined }}>{pesos(v.saldo)}</td>
                <td><StatusChip texto={v.est_pago} color={colorPago[v.est_pago]} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
