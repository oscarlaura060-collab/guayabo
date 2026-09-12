"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, Trash2, X, ShoppingBag, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { pesos } from "@/lib/format";
import { crearVenta } from "../actions";

export interface ClienteOpt {
  id: string;
  nombre: string;
  codigo: string | null;
}
export interface PrendaOpt {
  id: string;
  nombre: string;
  codigo: string | null;
  talla: string | null;
  color: string | null;
  precio: number;
  costo: number;
  stock: number;
}
interface CartItem {
  prenda_id: string;
  nombre: string;
  talla: string | null;
  color: string | null;
  precio: number;
  cantidad: number;
  costo_unit: number;
  stock: number;
}

const inputCls = "rounded-xl border bg-[var(--color-tarjeta)] px-3 py-2 text-sm outline-none";
const inputStyle = { borderColor: "var(--borde-suave)" } as const;

export function NuevaVentaFlujo({
  clientes,
  prendas,
  metodos,
  ventaBajoPedido,
  permitirStockNegativo,
}: {
  clientes: ClienteOpt[];
  prendas: PrendaOpt[];
  metodos: string[];
  ventaBajoPedido: boolean;
  permitirStockNegativo: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [clienteId, setClienteId] = useState<string | null>(null);
  const [clienteQuery, setClienteQuery] = useState("");
  const [mostrarClientes, setMostrarClientes] = useState(false);

  const [prendaQuery, setPrendaQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const [descuento, setDescuento] = useState("0");
  const [envio, setEnvio] = useState("0");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [metodo, setMetodo] = useState(metodos[0] ?? "Efectivo");
  const [valorPago, setValorPago] = useState("");
  const [enviando, setEnviando] = useState(false);

  const clientesFiltrados = useMemo(() => {
    const t = clienteQuery.trim().toLowerCase();
    if (!t) return clientes.slice(0, 8);
    return clientes
      .filter((c) => [c.nombre, c.codigo].filter(Boolean).some((x) => String(x).toLowerCase().includes(t)))
      .slice(0, 8);
  }, [clientes, clienteQuery]);

  const prendasFiltradas = useMemo(() => {
    const t = prendaQuery.trim().toLowerCase();
    if (!t) return [];
    return prendas
      .filter((p) => [p.nombre, p.codigo, p.talla, p.color].filter(Boolean).some((x) => String(x).toLowerCase().includes(t)))
      .slice(0, 8);
  }, [prendas, prendaQuery]);

  const subtotal = cart.reduce((s, it) => s + it.precio * it.cantidad, 0);
  const total = Math.max(subtotal - (Number(descuento) || 0) + (Number(envio) || 0), 0);
  const pago = Number(valorPago) || 0;
  const saldo = Math.max(total - pago, 0);

  function agregarPrenda(p: PrendaOpt) {
    setCart((cs) => {
      const i = cs.findIndex((x) => x.prenda_id === p.id);
      if (i >= 0) return cs.map((x, idx) => (idx === i ? { ...x, cantidad: x.cantidad + 1 } : x));
      return [...cs, { prenda_id: p.id, nombre: p.nombre, talla: p.talla, color: p.color, precio: p.precio, cantidad: 1, costo_unit: p.costo, stock: p.stock }];
    });
    setPrendaQuery("");
  }
  function setCantidad(i: number, delta: number) {
    setCart((cs) => cs.map((x, idx) => (idx === i ? { ...x, cantidad: Math.max(1, x.cantidad + delta) } : x)));
  }
  function setPrecio(i: number, valor: string) {
    setCart((cs) => cs.map((x, idx) => (idx === i ? { ...x, precio: Number(valor) || 0 } : x)));
  }

  const sinStock = cart.some((x) => x.cantidad > x.stock) && !ventaBajoPedido && !permitirStockNegativo;

  async function guardar(cobrarTotal: boolean) {
    if (cart.length === 0) {
      toast("Agrega al menos una prenda", "error");
      return;
    }
    const valor = cobrarTotal ? total : pago;
    if (valor > total && !confirm("El pago supera el total. ¿Continuar de todos modos?")) return;

    setEnviando(true);
    const res = await crearVenta({
      cliente_id: clienteId,
      // Guardamos también el nombre (elegido de la lista o escrito) para mostrarlo en los listados.
      cliente_nombre: clienteQuery.trim() || null,
      fecha_entrega: fechaEntrega || null,
      descuento: Number(descuento) || 0,
      envio: Number(envio) || 0,
      items: cart.map((it) => ({
        prenda_id: it.prenda_id,
        nombre: it.nombre,
        talla: it.talla,
        color: it.color,
        cantidad: it.cantidad,
        precio: it.precio,
        descuento: 0,
        costo_unit: it.costo_unit,
      })),
      pago: valor > 0 ? { valor, metodo } : null,
    });
    setEnviando(false);

    if (res.ok) {
      toast(`Venta ${res.numero ?? ""} registrada`, "exito");
      router.push(res.id ? `/ventas/${res.id}` : "/ventas");
      router.refresh();
    } else {
      toast(res.error ?? "No se pudo registrar la venta", "error");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-4">
        {/* Cliente */}
        <div className="gy-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <UserRound size={16} style={{ color: "var(--color-secundario)" }} /> Cliente
          </div>
          <div className="relative">
            <label className="relative flex items-center">
              <Search size={16} className="pointer-events-none absolute left-3" style={{ color: "var(--tenue)" }} />
              <input
                className={`${inputCls} w-full pl-9`}
                style={inputStyle}
                placeholder="Buscar cliente o escribir un nombre…"
                value={clienteQuery}
                onChange={(e) => { setClienteQuery(e.target.value); setClienteId(null); setMostrarClientes(true); }}
                onFocus={() => setMostrarClientes(true)}
              />
              {clienteQuery && (
                <button type="button" className="absolute right-2" onClick={() => { setClienteQuery(""); setClienteId(null); }} aria-label="Limpiar">
                  <X size={16} style={{ color: "var(--tenue)" }} />
                </button>
              )}
            </label>
            {mostrarClientes && clientesFiltrados.length > 0 && !clienteId && (
              <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border bg-[var(--color-tarjeta)] shadow-lg" style={{ borderColor: "var(--borde-suave)" }}>
                {clientesFiltrados.map((c) => (
                  <button key={c.id} type="button" className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-fondo)]"
                    onClick={() => { setClienteId(c.id); setClienteQuery(c.nombre); setMostrarClientes(false); }}>
                    <span>{c.nombre}</span>
                    <span className="text-xs" style={{ color: "var(--tenue)" }}>{c.codigo}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {!clienteId && clienteQuery && (
            <p className="mt-2 text-xs" style={{ color: "var(--tenue)" }}>Se registrará como “{clienteQuery}” sin ficha de cliente.</p>
          )}
        </div>

        {/* Prendas */}
        <div className="gy-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <ShoppingBag size={16} style={{ color: "var(--color-secundario)" }} /> Prendas
          </div>
          <div className="relative">
            <label className="relative flex items-center">
              <Search size={16} className="pointer-events-none absolute left-3" style={{ color: "var(--tenue)" }} />
              <input className={`${inputCls} w-full pl-9`} style={inputStyle} placeholder="Buscar prenda por nombre o código…" value={prendaQuery} onChange={(e) => setPrendaQuery(e.target.value)} />
            </label>
            {prendasFiltradas.length > 0 && (
              <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border bg-[var(--color-tarjeta)] shadow-lg" style={{ borderColor: "var(--borde-suave)" }}>
                {prendasFiltradas.map((p) => (
                  <button key={p.id} type="button" className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-fondo)]" onClick={() => agregarPrenda(p)}>
                    <span>
                      {p.nombre}
                      <span className="ml-1 text-xs" style={{ color: "var(--tenue)" }}>{[p.talla, p.color].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="text-xs" style={{ color: "var(--tenue)" }}>{pesos(p.precio)} · stock {p.stock}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {cart.length === 0 && <p className="py-4 text-center text-sm" style={{ color: "var(--tenue)" }}>Busca y agrega prendas a la venta.</p>}
            {cart.map((it, i) => {
              const excede = it.cantidad > it.stock;
              return (
                <div key={it.prenda_id} className="flex flex-wrap items-center gap-2 rounded-xl border p-2" style={{ borderColor: "var(--borde-suave)" }}>
                  <div className="min-w-32 flex-1">
                    <div className="text-sm font-medium">{it.nombre}</div>
                    <div className="text-xs" style={{ color: "var(--tenue)" }}>
                      {[it.talla, it.color].filter(Boolean).join(" · ") || "—"}
                      {excede && <span style={{ color: "#D33A2C" }}> · supera stock ({it.stock})</span>}
                    </div>
                  </div>
                  <input className={`${inputCls} w-24`} style={inputStyle} type="number" min="0" value={it.precio} onChange={(e) => setPrecio(i, e.target.value)} aria-label="Precio" />
                  <div className="flex items-center gap-1">
                    <button type="button" className="gy-btn gy-btn-plano !p-1.5" onClick={() => setCantidad(i, -1)} aria-label="Menos"><Minus size={14} /></button>
                    <span className="w-6 text-center text-sm tabular-nums">{it.cantidad}</span>
                    <button type="button" className="gy-btn gy-btn-plano !p-1.5" onClick={() => setCantidad(i, 1)} aria-label="Más"><Plus size={14} /></button>
                  </div>
                  <div className="w-20 text-right text-sm font-semibold tabular-nums">{pesos(it.precio * it.cantidad)}</div>
                  <button type="button" className="gy-btn gy-btn-plano !p-1.5" onClick={() => setCart((cs) => cs.filter((_, idx) => idx !== i))} aria-label="Quitar"><Trash2 size={15} /></button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Resumen + cobro */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
        <div className="gy-card p-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Fecha de entrega <span style={{ color: "var(--tenue)" }}>(opcional)</span>
            <input className={inputCls} style={inputStyle} type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
          </label>
        </div>

        <div className="gy-card p-4">
          <div className="mb-3 text-sm font-semibold">Resumen</div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between"><span style={{ color: "var(--tenue)" }}>Subtotal</span><span className="tabular-nums">{pesos(subtotal)}</span></div>
            <label className="flex items-center justify-between gap-2">
              <span style={{ color: "var(--tenue)" }}>Descuento</span>
              <input className={`${inputCls} w-28 text-right`} style={inputStyle} type="number" min="0" value={descuento} onChange={(e) => setDescuento(e.target.value)} />
            </label>
            <label className="flex items-center justify-between gap-2">
              <span style={{ color: "var(--tenue)" }}>Envío</span>
              <input className={`${inputCls} w-28 text-right`} style={inputStyle} type="number" min="0" value={envio} onChange={(e) => setEnvio(e.target.value)} />
            </label>
            <div className="mt-1 flex items-center justify-between border-t pt-2" style={{ borderColor: "var(--borde-suave)" }}>
              <span className="font-semibold">Total</span>
              <span className="gy-cifra text-xl">{pesos(total)}</span>
            </div>
          </div>
        </div>

        <div className="gy-card p-4">
          <div className="mb-3 text-sm font-semibold">Cobro</div>
          <label className="mb-2 flex flex-col gap-1 text-sm font-medium">
            Método
            <select className={inputCls} style={inputStyle} value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              {metodos.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Valor recibido
            <input className={inputCls} style={inputStyle} type="number" min="0" placeholder={String(total)} value={valorPago} onChange={(e) => setValorPago(e.target.value)} />
          </label>
          {pago > 0 && saldo > 0 && <p className="mt-2 text-xs" style={{ color: "#9a6f0a" }}>Queda un saldo de {pesos(saldo)} (abono).</p>}
          {pago > total && <p className="mt-2 text-xs" style={{ color: "#D33A2C" }}>El pago supera el total.</p>}
          {sinStock && <p className="mt-2 text-xs" style={{ color: "#D33A2C" }}>Hay prendas sin stock suficiente. Actívalo en Configuración (venta bajo pedido) o ajusta la cantidad.</p>}

          <div className="mt-4 flex flex-col gap-2">
            <Button onClick={() => guardar(true)} disabled={enviando || cart.length === 0} className="w-full">
              {enviando ? "Registrando…" : `Cobrar ${pesos(total)}`}
            </Button>
            <Button variante="contorno" onClick={() => guardar(false)} disabled={enviando || cart.length === 0} className="w-full">
              Guardar con abono / sin pago
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
