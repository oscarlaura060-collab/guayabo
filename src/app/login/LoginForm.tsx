"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

const MSJ_SIN_PERFIL =
  "Tu cuenta no tiene un perfil activo. Pide a un administrador que te active antes de entrar.";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "sin-perfil" ? MSJ_SIN_PERFIL : null,
  );

  // Si llegamos aquí por "sin perfil activo", cerramos la sesión que quedó abierta.
  useEffect(() => {
    if (params.get("error") === "sin-perfil") {
      createClient().auth.signOut();
    }
  }, [params]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const supabase = createClient();

    const { data, error: errAuth } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (errAuth || !data.user) {
      setError("Correo o contraseña incorrectos.");
      setCargando(false);
      return;
    }

    // Verifica que el perfil exista y esté activo; si no, salida con mensaje claro.
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("activo")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!perfil || !perfil.activo) {
      await supabase.auth.signOut();
      setError(MSJ_SIN_PERFIL);
      setCargando(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Correo
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border bg-[var(--color-tarjeta)] px-3 py-2.5 outline-none"
          style={{ borderColor: "var(--borde-suave)" }}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Contraseña
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border bg-[var(--color-tarjeta)] px-3 py-2.5 outline-none"
          style={{ borderColor: "var(--borde-suave)" }}
        />
      </label>

      {error && (
        <p
          className="rounded-xl px-3 py-2 text-sm"
          style={{
            background: "color-mix(in srgb, #d33a2c 10%, transparent)",
            color: "#b02a1f",
          }}
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
