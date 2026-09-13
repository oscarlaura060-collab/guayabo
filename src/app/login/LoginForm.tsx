"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

/** Cuenta compartida de la app: el usuario solo escribe la clave de acceso. */
const CUENTA_COMPARTIDA = "acceso@guayabo.app";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";

  const [clave, setClave] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const supabase = createClient();

    const { error: errAuth } = await supabase.auth.signInWithPassword({
      email: CUENTA_COMPARTIDA,
      password: clave,
    });

    if (errAuth) {
      setError("Clave incorrecta.");
      setCargando(false);
      return;
    }

    router.push(redirect);
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
          autoComplete="current-password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          className="rounded-xl border bg-[var(--color-tarjeta)] px-3 py-2.5 text-center text-lg tracking-widest outline-none"
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

      <Button type="submit" disabled={cargando} className="mt-1 w-full">
        {cargando ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
