"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface ItemCarrito {
  prendaId: string;
  nombre: string;
  talla: string | null;
  color: string | null;
  precio: number;
  cantidad: number;
  imagen: string | null;
}

interface CarritoCtx {
  items: ItemCarrito[];
  cantidadTotal: number;
  total: number;
  agregar: (item: ItemCarrito) => void;
  quitar: (prendaId: string) => void;
  setCantidad: (prendaId: string, cantidad: number) => void;
  limpiar: () => void;
}

const Ctx = createContext<CarritoCtx | null>(null);
const CLAVE = "guayabo_carrito";

function cargar(): ItemCarrito[] {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>(() => cargar());

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(items));
    } catch {}
  }, [items]);

  function agregar(item: ItemCarrito) {
    setItems((cs) => {
      const i = cs.findIndex((x) => x.prendaId === item.prendaId);
      if (i >= 0) return cs.map((x, idx) => (idx === i ? { ...x, cantidad: x.cantidad + item.cantidad } : x));
      return [...cs, item];
    });
  }
  function quitar(prendaId: string) {
    setItems((cs) => cs.filter((x) => x.prendaId !== prendaId));
  }
  function setCantidad(prendaId: string, cantidad: number) {
    setItems((cs) => cs.map((x) => (x.prendaId === prendaId ? { ...x, cantidad: Math.max(1, cantidad) } : x)));
  }
  function limpiar() {
    setItems([]);
  }

  const cantidadTotal = items.reduce((s, x) => s + x.cantidad, 0);
  const total = items.reduce((s, x) => s + x.precio * x.cantidad, 0);

  return (
    <Ctx.Provider value={{ items, cantidadTotal, total, agregar, quitar, setCantidad, limpiar }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCarrito(): CarritoCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de CarritoProvider");
  return ctx;
}
