import type { Rol } from "@/lib/auth";
import {
  LayoutDashboard,
  ShoppingBag,
  PackageCheck,
  BookmarkCheck,
  Shirt,
  Boxes,
  Users,
  CreditCard,
  Receipt,
  TrendingUp,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface Seccion {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Roles que pueden ver la sección. */
  roles: Rol[];
}

const TODOS: Rol[] = ["ADMINISTRADOR", "VENDEDOR", "CONSULTA"];
const SOLO_ADMIN: Rol[] = ["ADMINISTRADOR"];

/**
 * Menú lateral. Reglas:
 *  - VENDEDOR no ve Gastos, Utilidades ni Configuración.
 *  - CONSULTA solo ve lo de lectura (tampoco Gastos, Utilidades ni Configuración).
 */
export const SECCIONES: Seccion[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: TODOS },
  { href: "/ventas", label: "Ventas", icon: ShoppingBag, roles: TODOS },
  { href: "/pedidos", label: "Pedidos", icon: PackageCheck, roles: TODOS },
  { href: "/apartados", label: "Apartados", icon: BookmarkCheck, roles: TODOS },
  { href: "/prendas", label: "Prendas", icon: Shirt, roles: TODOS },
  { href: "/inventario", label: "Inventario", icon: Boxes, roles: TODOS },
  { href: "/clientes", label: "Clientes", icon: Users, roles: TODOS },
  { href: "/pagos", label: "Pagos", icon: CreditCard, roles: TODOS },
  { href: "/gastos", label: "Gastos", icon: Receipt, roles: SOLO_ADMIN },
  { href: "/utilidades", label: "Utilidades", icon: TrendingUp, roles: SOLO_ADMIN },
  { href: "/reportes", label: "Reportes", icon: BarChart3, roles: TODOS },
  { href: "/configuracion", label: "Configuración", icon: Settings, roles: SOLO_ADMIN },
];

export function seccionesVisibles(rol: Rol | null): Seccion[] {
  if (!rol) return [];
  return SECCIONES.filter((s) => s.roles.includes(rol));
}

export function puedeVer(href: string, rol: Rol | null): boolean {
  if (!rol) return false;
  const s = SECCIONES.find((x) => href === x.href || href.startsWith(x.href + "/"));
  return s ? s.roles.includes(rol) : false;
}
