import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variante = "solido" | "contorno" | "plano";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

const clase: Record<Variante, string> = {
  solido: "gy-btn gy-btn-solido",
  contorno: "gy-btn gy-btn-contorno",
  plano: "gy-btn gy-btn-plano",
};

/** Botón de la marca: sólido, contorno o plano. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variante = "solido", className = "", ...props },
  ref,
) {
  return <button ref={ref} className={`${clase[variante]} ${className}`.trim()} {...props} />;
});
