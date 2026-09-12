"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

type Tipo = "exito" | "error" | "info";
interface Toast {
  id: number;
  tipo: Tipo;
  mensaje: string;
}

interface ToastCtx {
  toast: (mensaje: string, tipo?: Tipo) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

const ICONO = {
  exito: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

const COLOR = {
  exito: "#3aa76d",
  error: "#d33a2c",
  info: "var(--color-secundario)",
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((mensaje: string, tipo: Tipo = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, tipo, mensaje }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="gy-toast-host">
        {toasts.map((t) => {
          const Icono = ICONO[t.tipo];
          return (
            <div key={t.id} className="gy-toast" data-tipo={t.tipo} role="status">
              <Icono size={18} style={{ color: COLOR[t.tipo], flex: "0 0 auto" }} />
              <span>{t.mensaje}</span>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
