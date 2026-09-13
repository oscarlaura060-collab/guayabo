import { Suspense } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { getConfig } from "@/lib/config";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  const config = await getConfig().catch(() => ({}) as Record<string, string>);
  const nombre = config.NOMBRE_MARCA || "GUAYABO";
  const lema = config.LEMA || "";

  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <BrandLogo nombre={nombre} logoUrl={config.LOGO_URL || null} />
          {lema && (
            <p className="text-sm italic" style={{ color: "var(--tenue)" }}>
              {lema}
            </p>
          )}
        </div>
        <div className="gy-card p-6">
          <h1 className="mb-1 text-xl font-semibold">Entrar</h1>
          <p className="mb-5 text-sm" style={{ color: "var(--tenue)" }}>
            Ingresa la clave de acceso del equipo.
          </p>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
