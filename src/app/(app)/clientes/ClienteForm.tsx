"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Tables } from "@/types/database.types";

type Cliente = Tables<"clientes">;

const inputCls = "rounded-xl border bg-[var(--color-tarjeta)] px-3 py-2 text-sm outline-none";
const inputStyle = { borderColor: "var(--borde-suave)" } as const;

export function ClienteForm({
  cliente,
  onGuardar,
  onCancelar,
}: {
  cliente: Cliente | null;
  onGuardar: (fd: FormData) => Promise<void>;
  onCancelar: () => void;
}) {
  const [enviando, setEnviando] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    await onGuardar(new FormData(e.currentTarget));
    setEnviando(false);
  }

  const campo = (label: string, name: string, extra?: { type?: string; required?: boolean; defaultValue?: string | null }) => (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      <input
        className={inputCls}
        style={inputStyle}
        name={name}
        type={extra?.type ?? "text"}
        required={extra?.required}
        defaultValue={extra?.defaultValue ?? ""}
      />
    </label>
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {campo("Nombre", "nombre", { required: true, defaultValue: cliente?.nombre })}
      <div className="grid grid-cols-2 gap-3">
        {campo("Documento", "documento", { defaultValue: cliente?.documento })}
        {campo("Ciudad", "ciudad", { defaultValue: cliente?.ciudad })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {campo("Teléfono", "telefono", { defaultValue: cliente?.telefono })}
        {campo("WhatsApp", "whatsapp", { defaultValue: cliente?.whatsapp })}
      </div>
      {campo("Correo", "email", { type: "email", defaultValue: cliente?.email })}
      {campo("Dirección", "direccion", { defaultValue: cliente?.direccion })}
      <label className="flex flex-col gap-1 text-sm font-medium">
        Observaciones
        <textarea className={inputCls} style={inputStyle} name="observaciones" rows={2} defaultValue={cliente?.observaciones ?? ""} />
      </label>

      <div className="flex justify-end gap-2">
        <Button type="button" variante="plano" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : cliente ? "Guardar cambios" : "Crear cliente"}
        </Button>
      </div>
    </form>
  );
}
