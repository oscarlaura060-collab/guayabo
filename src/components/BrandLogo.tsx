export function BrandLogo({ nombre = "GUAYABO" }: { nombre?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-full text-sm font-bold"
        style={{ background: "var(--color-secundario)", color: "#fff" }}
      >
        G
      </span>
      <span className="text-lg font-bold tracking-tight">{nombre}</span>
    </span>
  );
}
