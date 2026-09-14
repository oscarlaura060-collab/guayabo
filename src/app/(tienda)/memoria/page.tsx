export const metadata = { title: "Memoria Colectiva" };

interface Articulo {
  titulo: string;
  subtitulo?: string;
  parrafos: string[];
}

const ARTICULOS: Articulo[] = [
  {
    titulo: "Cayeye o Mote de guineo",
    subtitulo: "el desayuno que sostuvo familias por generaciones",
    parrafos: [
      "Dicen que uno nunca olvida el sabor de su infancia. Y si creciste en la costa Caribe colombiana, seguramente ese sabor tiene algo de guineo verde, queso costeño y mantequilla derretida. Un plato tan cotidiano que muchas veces damos por sentado, sin imaginar que detrás de él hay una historia de trabajo, ingenio y tradición.",
      "Durante años, el cayeye fue mucho más que un desayuno. Fue el primer plato del día para campesinos que salían antes del amanecer a trabajar la tierra, para pescadores que regresaban después de largas jornadas en el mar y para familias que encontraban en el guineo un alimento económico, abundante y lleno de energía. No nació como un plato de lujo ni como una receta pensada para restaurantes; nació de la necesidad de alimentar a quienes construían el caribe con sus manos.",
      "El ingrediente principal, el guineo verde, llegó a América durante la época colonial y encontró en el caribe colombiano un clima perfecto para crecer. Con el tiempo, las familias descubrieron que, al cocinarlo y triturarlo, obtenían una preparación suave y rendidora. Luego aparecieron el queso costeño rallado, la mantequilla y, en muchos hogares, el suero o el hogao, hasta formar el cayeye que conocemos hoy.",
      "Pero más allá de la receta, el cayeye representa algo muy nuestro: la capacidad de transformar ingredientes sencillos en una comida que reúne a toda la familia. En muchas casas, el día comenzaba con un gran plato de cayeye compartido entre la familia.",
      "Con el paso de los años, el cayeye salió de las cocinas familiares para conquistar restaurantes, hoteles y festivales gastronómicos. Hoy es uno de los platos más representativos de Santa Marta y del Caribe colombiano, pero sigue conservando la misma esencia con la que nació: recordar que las mejores recetas no siempre son las más sofisticadas, sino las que cuentan una historia.",
    ],
  },
  {
    titulo: "Patacones",
    parrafos: [
      "Mucho antes de que los patacones aparecieran en las cartas de restaurantes o acompañaran hamburguesas gourmet, ya estaban presentes en las esquinas de los barrios, en las playas, en los estadios, en los mercados y en las plazas. Eran preparados por mujeres y hombres que, con una estufa, una paila y mucho esfuerzo, convertían un racimo de guineos en el sustento diario de sus hogares.",
      "El guineo siempre ha sido uno de los cultivos más generosos del Caribe. Crece con facilidad, se consigue durante gran parte del año y permite alimentar a muchas personas con pocos recursos.",
      "Hoy el patacón de guineo sigue evolucionando. Lo encontramos en restaurantes elegantes, en festivales gastronómicos y en propuestas innovadoras de chefs que reinterpretan la cocina Caribe. Sin embargo, su verdadero valor sigue estando en las manos de quienes lo preparan con la misma dedicación de hace décadas. Ellos nos recuerdan que la gastronomía también puede ser una historia de esfuerzo, de emprendimiento y de esperanza.",
    ],
  },
  {
    titulo: "Raspao",
    subtitulo: "el sabor de la infancia que sobrevivió al calor",
    parrafos: [
      "Aunque hoy podamos encontrar postres de todo tipo, hay algo especial en esa montaña de hielo bañada con jarabes de colores que ha acompañado generaciones enteras.",
      "El raspao parece sencillo: hielo, sabores y un poco de dulce. Pero si lo miramos con más atención, descubrimos que detrás de cada vaso hay una historia de creatividad, trabajo y adaptación. Una historia que habla de cómo las comunidades del Caribe encontraron una manera de combatir el calor, crear un negocio y regalar momentos de felicidad con algo tan básico como el hielo.",
      "Durante décadas, muchas familias encontraron en el raspao una oportunidad de trabajo. Personas que salían con sus carritos por los barrios, las playas, los parques y las escuelas convirtiendo un producto sencillo en el sustento de sus hogares. Algunos empezaban con pocos recursos: una máquina de raspar hielo, algunos sabores preparados en casa y las ganas de salir adelante.",
      "Estaban quienes recorrían las calles bajo el sol buscando clientes. Y estaban los niños que esperaban escuchar ese sonido que significaba que había llegado un pequeño momento de felicidad. Porque el raspao también es la salida del colegio, la tarde jugando en la calle, el paseo familiar, la visita a la playa. Es recordar que muchas veces la felicidad no estaba en algo costoso, sino en un vaso lleno de hielo y sabor compartido con alguien querido.",
    ],
  },
];

export default function MemoriaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold sm:text-5xl" style={{ fontFamily: "var(--font-fraunces, serif)" }}>Memoria Colectiva</h1>
        <p className="mt-3 opacity-70">Las historias, sabores y recuerdos que inspiran cada prenda de la Costa Caribe.</p>
      </header>

      <div className="flex flex-col gap-8">
        {ARTICULOS.map((a) => (
          <article key={a.titulo} className="overflow-hidden rounded-3xl" style={{ background: "var(--color-tarjeta, #fff)", boxShadow: "0 8px 30px rgba(0,0,0,.06)" }}>
            <div className="px-6 py-5 text-center" style={{ background: "var(--color-primario)" }}>
              <h2 className="text-2xl font-bold italic" style={{ fontFamily: "var(--font-fraunces, serif)" }}>{a.titulo}</h2>
              {a.subtitulo && <p className="mt-1 text-sm italic opacity-75">{a.subtitulo}</p>}
            </div>
            <div className="flex flex-col gap-4 px-6 py-6 text-[15px] leading-relaxed">
              {a.parrafos.map((p, i) => (
                <p key={i} className="opacity-90">{p}</p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
