import { getConfig } from "@/lib/config";
import { PalmeraGrande } from "@/components/tienda/FondoTropical";

export const metadata = { title: "Memoria Colectiva" };

interface Articulo {
  titulo: string;
  subtitulo?: string;
  imgClave: string;
  parrafos: string[];
}

const ARTICULOS: Articulo[] = [
  {
    titulo: "Cayeye o Mote de guineo",
    subtitulo: "el desayuno que sostuvo familias por generaciones",
    imgClave: "MEMORIA_CAYEYE_URL",
    parrafos: [
      "Dicen que uno nunca olvida el sabor de su infancia. Y si creciste en la costa Caribe colombiana, seguramente ese sabor tiene algo de guineo verde, queso costeño y mantequilla derretida. Un plato tan cotidiano que muchas veces damos por sentado, sin imaginar que detrás de él hay una **historia de trabajo, ingenio y tradición**.",
      "Durante años, el cayeye fue mucho más que un desayuno. Fue el primer plato del día para campesinos que salían antes del amanecer a trabajar la tierra, para pescadores que regresaban después de largas jornadas en el mar y para **familias** que encontraban en el guineo un alimento económico, abundante y lleno de energía. No nació como un plato de lujo ni como una receta pensada para restaurantes; nació de la necesidad de alimentar a quienes **construían** el caribe con sus **manos**.",
      "El ingrediente principal, el guineo verde, llegó a América durante la época colonial y encontró en el caribe colombiano un clima perfecto para **crecer**. Con el tiempo, las familias descubrieron que, al cocinarlo y triturarlo, obtenían una preparación suave y rendidora. Luego aparecieron el queso costeño rallado, la mantequilla y, en muchos hogares, el suero o el hogao, hasta formar el cayeye que conocemos hoy.",
      "Pero más allá de la receta, el cayeye representa algo muy nuestro: la capacidad de transformar ingredientes sencillos en una comida que **reúne** a toda la familia. En muchas casas, el día comenzaba con un gran plato de cayeye **compartido** entre la familia.",
      "Con el paso de los años, el cayeye salió de las cocinas familiares para conquistar restaurantes, hoteles y festivales gastronómicos. Hoy es uno de los platos más representativos de **Santa Marta y del Caribe** colombiano, pero sigue conservando la misma esencia con la que nació: recordar que las mejores recetas no siempre son las más sofisticadas, sino las que cuentan una **historia**.",
    ],
  },
  {
    titulo: "Patacones",
    imgClave: "MEMORIA_PATACONES_URL",
    parrafos: [
      "Mucho antes de que los patacones aparecieran en las cartas de restaurantes o acompañaran hamburguesas gourmet, ya estaban presentes en las esquinas de los barrios, en las playas, en los estadios, en los mercados y en las plazas. Eran preparados por mujeres y hombres que, con una estufa, una paila y mucho esfuerzo, convertían un racimo de guineos en el sustento diario de sus hogares.",
      "El guineo siempre ha sido uno de los cultivos más generosos del Caribe. Crece con facilidad, se consigue durante gran parte del año y permite alimentar a muchas personas con pocos recursos.",
      "Hoy el patacón de guineo sigue evolucionando. Lo encontramos en restaurantes elegantes, en festivales gastronómicos y en propuestas innovadoras de chefs que reinterpretan la cocina Caribe. Sin embargo, su verdadero valor sigue estando en las manos de quienes lo preparan con la misma dedicación de hace décadas. Ellos nos recuerdan que la gastronomía también puede ser una historia de esfuerzo, de emprendimiento y de esperanza.",
    ],
  },
  {
    titulo: "Raspao",
    subtitulo: "el sabor de la infancia que sobrevivió al calor",
    imgClave: "MEMORIA_RASPAO_URL",
    parrafos: [
      "Aunque hoy podamos encontrar postres de todo tipo, hay algo especial en esa montaña de hielo bañada con jarabes de colores que ha acompañado generaciones enteras.",
      "El raspao parece sencillo: hielo, sabores y un poco de dulce. Pero si lo miramos con más atención, descubrimos que detrás de cada vaso hay una historia de creatividad, trabajo y adaptación. Una historia que habla de cómo las comunidades del Caribe encontraron una manera de combatir el calor, crear un negocio y regalar momentos de felicidad con algo tan básico como el hielo.",
      "Durante décadas, muchas familias encontraron en el raspao una oportunidad de trabajo. Personas que salían con sus carritos por los barrios, las playas, los parques y las escuelas convirtiendo un producto sencillo en el sustento de sus hogares. Algunos empezaban con pocos recursos: una máquina de raspar hielo, algunos sabores preparados en casa y las ganas de salir adelante.",
      "Estaban quienes recorrían las calles bajo el sol buscando clientes. Y estaban los niños que esperaban escuchar ese sonido que significaba que había llegado un pequeño momento de felicidad. Porque el raspao también es la salida del colegio, la tarde jugando en la calle, el paseo familiar, la visita a la playa. Es recordar que muchas veces la felicidad no estaba en algo costoso, sino en un vaso lleno de hielo y sabor compartido con alguien querido.",
    ],
  },
];

/** Renderiza **negritas** dentro de un párrafo. */
function conNegritas(texto: string) {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((seg, i) =>
    seg.startsWith("**") && seg.endsWith("**") ? <b key={i}>{seg.slice(2, -2)}</b> : <span key={i}>{seg}</span>,
  );
}

export default async function MemoriaPage() {
  const config = await getConfig().catch(() => ({}) as Record<string, string>);
  const fondo = config.MEMORIA_FONDO_URL || null;

  return (
    <div className="relative overflow-hidden" style={{ background: "#14261a" }}>
      {/* Fondo tropical */}
      {fondo ? (
        <div className="pointer-events-none absolute inset-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: `url(${fondo})` }} />
      ) : (
        <div className="pointer-events-none absolute inset-0">
          <PalmeraGrande className="-left-8 top-20 h-[36rem] w-64" color="#ffffff" opacity={0.06} />
          <PalmeraGrande className="-right-12 top-[45%] h-[38rem] w-72" color="#ffffff" opacity={0.05} />
        </div>
      )}
      {/* Velo oscuro para legibilidad */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,20,12,.72), rgba(10,20,12,.82))" }} />

      <div className="relative z-10 mx-auto max-w-2xl px-6 py-14 text-center text-white" style={{ fontFamily: "var(--font-fraunces, serif)" }}>
        {ARTICULOS.map((a, idx) => {
          const img = config[a.imgClave] || null;
          return (
            <article key={a.titulo} className={idx > 0 ? "mt-20" : ""}>
              {/* Foto del plato */}
              <div className="mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full border-[3px] border-white/80 shadow-xl">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={a.titulo} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-3xl italic" style={{ background: "color-mix(in srgb, var(--color-primario) 30%, #14261a)" }}>{a.titulo.charAt(0)}</div>
                )}
              </div>

              <h2 className="text-3xl font-bold italic sm:text-4xl" style={{ color: "var(--color-fondo)" }}>{a.titulo}</h2>
              {a.subtitulo && <p className="mt-1 text-base italic opacity-90">{a.subtitulo}</p>}

              <div className="mt-4 flex flex-col gap-4 text-justify text-[15px] italic leading-relaxed text-white/95 sm:text-base">
                {a.parrafos.map((p, i) => (
                  <p key={i}>{conNegritas(p)}</p>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
