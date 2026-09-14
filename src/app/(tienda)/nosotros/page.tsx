import { getConfig } from "@/lib/config";
import { PatronTropical } from "@/components/tienda/FondoTropical";

export const metadata = { title: "Nosotros" };

const EQUIPO = [
  { nombre: "Mela", clave: "EQUIPO_MELA_URL" },
  { nombre: "Karina", clave: "EQUIPO_KARINA_URL" },
  { nombre: "Oscar", clave: "EQUIPO_OSCAR_URL" },
];

export default async function NosotrosPage() {
  const config = await getConfig().catch(() => ({}) as Record<string, string>);
  const nombre = config.NOMBRE_MARCA || "GUAYABO";

  return (
    <>
      {/* Creencias */}
      <section className="mx-auto max-w-3xl px-5 py-10">
        <div className="flex flex-col gap-4 text-xl leading-snug" style={{ fontFamily: "var(--font-poppins, sans-serif)" }}>
          <p>
            En <b style={{ color: "var(--color-secundario)", fontStyle: "italic" }}>{nombre}</b> creemos que la vida se disfruta mejor cuando se comparte.
          </p>
          <p>
            Creemos en las mesas grandes donde siempre cabe alguien más, en las conversaciones que empiezan con una <i>risa</i> y terminan cuando cae la noche, en los <b>amigos</b> que se vuelven <b><i>familia</i></b> y en las familias que nunca dejan de reunirse.
          </p>
          <p>
            Creemos en la <b><i>alegría</i></b> como una forma de <b><i>vivir.</i></b>
          </p>
        </div>
      </section>

      {/* Equipo */}
      <section className="relative overflow-hidden py-12" style={{ background: "var(--color-primario)" }}>
        <PatronTropical id="trop-nosotros" color="var(--color-texto)" opacity={0.08} />
        <div className="relative z-10 mx-auto max-w-4xl px-5">
          <div className="flex flex-wrap items-start justify-center gap-8">
            {EQUIPO.map((m) => {
              const url = config[m.clave] || null;
              return (
                <div key={m.nombre} className="flex flex-col items-center gap-3">
                  <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-md">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt={m.nombre} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-4xl font-bold" style={{ background: "color-mix(in srgb, var(--color-primario) 60%, #fff)", fontFamily: "var(--font-fraunces, serif)" }}>
                        {m.nombre.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="rounded-full px-6 py-1.5 text-xl italic text-white" style={{ background: "var(--color-secundario)", fontFamily: "var(--font-fraunces, serif)" }}>{m.nombre}</span>
                </div>
              );
            })}
          </div>

          {/* Historia */}
          <div className="mx-auto mt-10 max-w-2xl rounded-3xl px-6 py-8 text-center italic leading-relaxed" style={{ background: "var(--color-fondo)", fontFamily: "var(--font-fraunces, serif)" }}>
            <p className="mb-3">Somos tres amigos, soñadores y apasionados por nuestra tierra. {nombre} nació del deseo de transformar los sabores, las historias y las expresiones que nos hicieron crecer en prendas que puedan acompañar a otros a donde vayan.</p>
            <p className="mb-3">Creemos que la moda también puede contar de dónde venimos. Por eso diseñamos cada colección con orgullo, convirtiendo nuestra cultura en arte y nuestros recuerdos en piezas llenas de identidad.</p>
            <p>Más que crear ropa, queremos que cada persona que vista {nombre} lleve consigo un pedacito de la Costa Caribe.</p>
          </div>
        </div>
      </section>
    </>
  );
}
