import { redirect } from "next/navigation";
import { getSesion, rolDe } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { Shell } from "@/components/Shell";
import { ToastProvider } from "@/components/ui/Toast";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sesion = await getSesion();

  // Sin sesión → al login (el middleware ya protege, esto es el respaldo).
  if (!sesion) redirect("/login");

  // Autenticado pero sin perfil activo → mensaje claro y salida.
  const rol = rolDe(sesion);
  if (!sesion.perfil || !sesion.perfil.activo || !rol) {
    redirect("/login?error=sin-perfil");
  }

  const config = await getConfig().catch(() => ({}) as Record<string, string>);
  const usuario = {
    nombre: sesion.perfil.nombre || sesion.email.split("@")[0],
    email: sesion.email,
  };

  return (
    <ToastProvider>
      <Shell nombreMarca={config.NOMBRE_MARCA || "GUAYABO"} rol={rol} usuario={usuario}>
        {children}
      </Shell>
    </ToastProvider>
  );
}
