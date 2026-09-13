export function BrandLogo({
  nombre = "GUAYABO",
  logoUrl,
}: {
  nombre?: string;
  logoUrl?: string | null;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={nombre}
          className="h-9 w-9 rounded-lg object-contain"
          style={{ background: "var(--color-primario)" }}
        />
      ) : (
        <span
          aria-hidden
          className="grid h-8 w-8 place-items-center rounded-full text-sm font-bold"
          style={{ background: "var(--color-secundario)", color: "#fff" }}
        >
          G
        </span>
      )}
      <span className="text-lg font-bold tracking-tight">{nombre}</span>
    </span>
  );
}
