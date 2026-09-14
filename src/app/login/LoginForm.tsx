"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { adminHref } from "@/lib/adminPath";
import { Button } from "@/components/ui/Button";

/** Cuenta compartida de la app: el usuario solo escribe la clave de acceso. */
const CUENTA_COMPARTIDA = "acceso@guayabo.app";

/** Seguridad: tras 3 intentos fallidos se bloquea el ingreso por un rato. */
const MAX_INTENTOS = 3;
const BLOQUEO_MIN = 15;
const CLAVE_INTENTOS = "guayabo_login_intentos";
const CLAVE_BLOQUEO = "guayabo_login_bloqueo";

function leerNum(clave: string): number {
  try {
    return Number(localStorage.getItem(clave)) || 0;
  } catch {
    return 0;
  }
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";

  const [clave, setClave] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Recupera un bloqueo vigente al montar (SSR-safe: leerNum devuelve 0 sin window).
  const [bloqueadoHasta, setBloqueadoHasta] = useState<number>(() => leerNum(CLAVE_BLOQUEO));
  const [ahora, setAhora] = useState<number>(() => Date.now());

  // Cuenta regresiva mientras esté bloqueado.
  useEffect(() => {
    if (bloqueadoHasta <= Date.now()) return;
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [bloqueadoHasta]);

  const bloqueado = bloqueadoHasta > ahora;
  const minutosRestantes = Math.ceil((bloqueadoHasta - ahora) / 60000);

  function registrarFallo() {
    const intentos = leerNum(CLAVE_INTENTOS) + 1;
    try {
      localStorage.setItem(CLAVE_INTENTOS, String(intentos));
    } catch {}
    if (intentos >= MAX_INTENTOS) {
      const hasta = Date.now() + BLOQUEO_MIN * 60000;
      try {
        localStorage.setItem(CLAVE_BLOQUEO, String(hasta));
      } catch {}
      setBloqueadoHasta(hasta);
      setError(`Demasiados intentos. Ingreso bloqueado por ${BLOQUEO_MIN} minutos.`);
    } else {
      setError(`Clave incorrecta. Te quedan ${MAX_INTENTOS - intentos} intento(s).`);
    }
  }

  function limpiarIntentos() {
    try {
      localStorage.removeItem(CLAVE_INTENTOS);
      localStorage.removeItem(CLAVE_BLOQUEO);
    } catch {}
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (bloqueado) return;
    setError(null);
    setCargando(true);
    const supabase = createClient();

    const { error: errAuth } = await supabase.auth.signInWithPassword({
      email: CUENTA_COMPARTIDA,
      password: clave,
    });

    if (errAuth) {
      registrarFallo();
      setClave("");
      setCargando(false);
      return;
    }

    limpiarIntentos();
    router.push(adminHref(redirect));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Clave de acceso
        <input
          type="password"
          required
          autoFocus
          disabled={bloqueado}
          autoComplete="current-password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          className="rounded-xl border bg-[var(--color-tarjeta)] px-3 py-2.5 text-center text-lg tracking-widest outline-none disabled:opacity-50"
          style={{ borderColor: "var(--borde-suave)" }}
        />
      </label>

      {error && (
        <p
          className="rounded-xl px-3 py-2 text-sm"
          style={{ background: "color-mix(in srgb, #d33a2c 10%, transparent)", color: "#b02a1f" }}
          role="alert"
        >
          {error}
        </p>
      )}

      {bloqueado ? (
        <p className="rounded-xl px-3 py-2 text-center text-sm" style={{ background: "color-mix(in srgb, #d33a2c 12%, transparent)", color: "#b02a1f" }}>
          Ingreso bloqueado. Intenta de nuevo en {minutosRestantes} minuto(s).
        </p>
      ) : (
        <Button type="submit" disabled={cargando} className="mt-1 w-full">
          {cargando ? "Entrando…" : "Entrar"}
        </Button>
      )}
    </form>
  );
}
