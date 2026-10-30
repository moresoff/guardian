import Image from "next/image";
import Link from "next/link";
import { LineaDeTiempo, type Etapa } from "@/components/linea-tiempo";
import { BotonLink, Panel } from "@/components/ui/primitivos";
import { getProyecto, getProyectosPublicos } from "@/lib/data";
import { formatNum, modalidadLabel } from "@/lib/format";
import { buscarImagen } from "@/lib/imagenes";
import { ProyectoCard } from "@/components/proyecto-card";
import { CORREO_CONTACTO, TELEFONO_CONTACTO } from "@/lib/contacto";
import { CICLOS, SISTEMAS_EN_ORDEN } from "@/lib/ciclos";

export const metadata = {
  title: "Guardian — Crecé, ayudando a crecer",
  description:
    "Guardian conecta colaboradores con productores ganaderos para participar en ciclos de engorde, con la documentación del lote a la vista.",
};

/**
 * La portada es la única pantalla que ven los dos lados y el que todavía no es
 * ninguno de los dos. Su trabajo es explicar qué hace Guardian y llevar a la
 * puerta correcta; todo lo demás está adentro de cada área.
 *
 * La portada y el resto de la página se salen del contenedor para ocupar el ancho
 * completo. El alto de la foto está limitado a propósito: la elección de puerta
 * tiene que asomar sin tener que desplazar.
 */
const ANCHO_COMPLETO = "relative left-1/2 w-screen -translate-x-1/2";

const PUERTAS = [
  {
    href: "/registro?lado=productor",
    rotulo: "Productor",
    titulo: "Quiero publicar un ciclo",
    texto:
      "Publicá el ciclo con la documentación que ya emitís y sumá colaboradores, sin armar carpeta.",
    accion: "Entrar como productor",
  },
  {
    href: "/registro?lado=colaborador",
    rotulo: "Colaborador",
    titulo: "Quiero colaborar con un ciclo",
    texto:
      "Conocé un lote concreto, con nombre y RENSPA, y seguí el ciclo hasta la faena.",
    accion: "Entrar como colaborador",
  },
];

/** Lo que conviene saber antes de participar, sin ceremonia. El detalle está en la ficha. */
const ANTES_DE_PARTICIPAR = [
  {
    titulo: "El destino está escrito",
    texto:
      "Cada proyecto dice en qué se usa lo aportado, en qué plazo y cómo se reparte. Salir de ahí es incumplimiento.",
  },
  {
    titulo: "El resultado sale de la venta",
    texto:
      "Guardian conecta y verifica la documentación. El resultado depende de la venta del lote: lo fija el romaneo del frigorífico y puede ser distinto de lo esperado.",
  },
  {
    titulo: "Cada proyecto va por separado",
    texto:
      "Tiene sus propias condiciones, su propia cuenta y su propia rendición. Lo que pasa en un ciclo no se mezcla con otro.",
  },
  {
    titulo: "Rendición de cuentas",
    texto:
      "Cada proyecto rinde cuentas de gastos y pesadas mientras corre, y al cierre con el romaneo.",
  },
];

const QUE_HACEMOS = [
  {
    titulo: "Publicamos ciclos con respaldo",
    texto:
      "El productor declara el lote y sube la documentación que ya emite. Guardian la lee y cruza cada dato contra lo declarado.",
  },
  {
    titulo: "Verificamos antes de mostrar",
    texto:
      "Revisamos las discrepancias y comprobamos la autenticidad de los comprobantes por el canal oficial antes de que el proyecto sea visible.",
  },
  {
    titulo: "Acompañamos hasta el cierre",
    texto:
      "Cada proyecto rinde cuentas mientras corre y cierra con el romaneo del frigorífico, que es la cifra que queda.",
  },
];

const ETAPAS: Etapa[] = [
  {
    n: "1",
    titulo: "Publicación",
    duracion: "Unos minutos",
    detalle:
      "El productor cuenta qué lote tiene: cuántos animales, de qué tipo, cuánto pesan hoy y cuánto tienen que pesar al salir. También elige cómo se va a engordar: a corral, a pastura o mezclando las dos.",
  },
  {
    n: "2",
    titulo: "Documentación",
    duracion: "El mismo día",
    detalle:
      "Sube los papeles que ya tiene del campo y de los animales: el registro sanitario, las guías de traslado y la lista de caravanas. Guardian los lee y los compara con lo que el productor contó. Si dice 200 animales y las guías muestran 34, aparece la diferencia antes de publicar.",
  },
  {
    n: "3",
    titulo: "Validación",
    duracion: "De 1 a 3 días",
    detalle:
      "Una persona de Guardian revisa las diferencias y confirma con los organismos oficiales que los papeles sean auténticos. Que los números coincidan no alcanza: también hace falta que el papel sea verdadero. Hacen falta las dos cosas.",
  },
  {
    n: "4",
    titulo: "Colaboración",
    duracion: "Mientras el proyecto está abierto",
    detalle:
      "El proyecto se hace visible y los colaboradores se suman. Cuando está completo, el productor recibe lo necesario para el ciclo: todo junto si los animales ya están en el campo, o por partes si todavía hay que comprarlos.",
  },
  {
    n: "5",
    titulo: "Engorde y cierre",
    duracion: "Según el tipo de ciclo",
    detalle:
      "Los animales engordan hasta el peso de venta. Al final, el frigorífico informa cuántos animales faenó y cuántos kilos de carne salieron. Con ese informe se calcula lo que le toca a cada participante.",
  },
];

export default async function Home() {
  const fondo = buscarImagen("marca", "fondo");
  const abiertos = (await getProyectosPublicos()).filter((p) => p.estado === "abierto");
  const cerrado = await getProyecto("pry-6");
  const destacados = abiertos.slice(0, 2);
  const fotoCaso = buscarImagen("fotos", "proyecto-3");

  return (
    <div className="-mb-10 -mt-10">
      {/*
        Portada y elección de puerta comparten pantalla: quien entra tiene que
        poder elegir sin desplazar. El alto se mide en `svh` —la unidad que
        descuenta la barra del navegador del teléfono— y es mínimo, no fijo: si el
        contenido no entra, la sección crece en vez de recortarse.
      */}
      <section
        className={`${ANCHO_COMPLETO} flex items-center overflow-hidden bg-marca-fuerte`}
      >
        {fondo ? (
          <>
            <Image
              src={fondo}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <span className="absolute inset-0 bg-[#052c22]/70" aria-hidden />
          </>
        ) : null}

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-6 px-4 py-8 sm:py-10 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
          <div>
            <Image
              src="/imagenes/marca/logo-guardian-blanco.png"
              alt=""
              width={847}
              height={796}
              priority
              className="h-9 w-auto sm:h-11"
            />
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:mt-3 sm:text-5xl">
              Guardian
            </h1>
            <p className="mt-2 text-lg italic text-white/90 sm:text-2xl">
              Crecé, ayudando a crecer
            </p>
            <p className="mt-4 hidden max-w-md text-white/85 sm:block">
              Participá en el engorde de un lote concreto, con el activo real a la
              vista: un establecimiento con nombre y RENSPA.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Elegí de qué lado entrás
            </h2>
            {/* /85 y no /80: sobre un cielo quemado, /80 da 4.38:1 y no llega. */}
            <p className="mt-2 text-white/85">
              Son dos problemas distintos. Elegí el tuyo y creás la cuenta ahí mismo.
            </p>

            <div className="mt-5 grid gap-3">
              {PUERTAS.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="group flex items-center gap-4 rounded-2xl bg-superficie p-4 shadow-[var(--sombra-alta)] transition-transform hover:-translate-y-0.5 sm:p-5"
                >
                  <span className="flex-1">
                    <span className="rotulo block text-marca">{p.rotulo}</span>
                    <span className="mt-1 block text-lg font-semibold tracking-tight sm:text-xl">
                      {p.titulo}
                    </span>
                    <span className="mt-1.5 block text-sm text-tinta-suave">
                      {p.texto}
                    </span>
                  </span>
                  <span
                    className="text-2xl text-marca transition-transform group-hover:translate-x-1"
                    aria-hidden
                  >
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 1. Quién es Guardian */}
      <Banda>
        <h2 className="text-3xl font-semibold tracking-tight">Quién es Guardian</h2>
        <div className="mt-5 grid gap-x-10 gap-y-4 lg:grid-cols-2">
          <p className="text-tinta-suave">
            Guardian es una plataforma que pone en contacto a productores ganaderos con
            personas que quieren colaborar en un ciclo de engorde. No es una fiduciaria ni
            administra el dinero de nadie: conecta, verifica la documentación y deja todo a
            la vista.
          </p>
          <p className="text-tinta-suave">
            Nació de un problema concreto: al productor que engorda se le termina el dinero
            antes que el ciclo y sale a vender hacienda liviana, la peor venta posible. Del
            otro lado hay gente que quiere participar en un ciclo ganadero y no encuentra
            por dónde entrar sin comprar un campo.
          </p>
        </div>
      </Banda>

      {/* 2. Qué hacemos: tres cosas distintas, tres tarjetas distintas */}
      <Banda tono="bg-marca-suave">
        <h2 className="text-3xl font-semibold tracking-tight">Qué hacemos</h2>
        <div className="mt-7 grid gap-4 lg:grid-cols-5">
          <article className="rounded-2xl bg-superficie p-7 shadow-[var(--sombra-baja)] lg:col-span-3 lg:p-9">
            <h3 className="text-2xl font-semibold tracking-tight">{QUE_HACEMOS[0].titulo}</h3>
            <p className="mt-3 max-w-prose text-tinta-suave">{QUE_HACEMOS[0].texto}</p>
          </article>
          <article className="rounded-2xl bg-marca-fuerte p-7 text-white lg:col-span-2 lg:p-9">
            <h3 className="text-2xl font-semibold tracking-tight">{QUE_HACEMOS[1].titulo}</h3>
            <p className="mt-3 text-white/85">{QUE_HACEMOS[1].texto}</p>
          </article>
          <article className="rounded-2xl border border-marca/25 bg-papel p-7 lg:col-span-5 lg:flex lg:items-baseline lg:justify-between lg:gap-10 lg:px-9">
            <h3 className="text-xl font-semibold tracking-tight lg:shrink-0">
              {QUE_HACEMOS[2].titulo}
            </h3>
            <p className="mt-2 max-w-prose text-tinta-suave lg:mt-0">{QUE_HACEMOS[2].texto}</p>
          </article>
        </div>
      </Banda>

      {/* 3. Tres tipos de ciclo, como un recorrido del corral a la pastura */}
      <Banda tono="bg-superficie">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight">Tres tipos de ciclo</h2>
          <p className="mt-3 text-tinta-suave">
            Cada proyecto es de uno de estos tres tipos. Van de menos a más pastura: del
            corral de punta a punta, a todo el ciclo sobre el campo.
          </p>
        </div>

        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-0">
          {SISTEMAS_EN_ORDEN.map((k, i) => (
            <li key={k} className="relative md:pr-8">
              {/* El camino: un punto por tipo y una línea que sigue hacia el próximo. */}
              <div className="flex items-center" aria-hidden>
                <span className="size-4 shrink-0 rounded-full bg-marca ring-4 ring-marca-suave" />
                {i < SISTEMAS_EN_ORDEN.length - 1 ? (
                  <span className="relative ml-1 hidden h-px flex-1 bg-marca/40 md:block">
                    <svg
                      viewBox="0 0 8 12"
                      className="absolute -right-0.5 top-1/2 h-3 w-2 -translate-y-1/2 text-marca/60"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M1 1l5 5-5 5" />
                    </svg>
                  </span>
                ) : null}
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">{CICLOS[k].nombre}</h3>
              <p className="mt-1.5 text-tinta-suave">{CICLOS[k].descripcion}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-sm text-tinta-suave">
          Cada proyecto detalla sus condiciones para quienes tienen una cuenta.
        </p>
      </Banda>

      {/* 4. Cómo corre un ciclo */}
      <Banda>
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight">Cómo corre un ciclo</h2>
          <p className="mt-3 text-tinta-suave">
            Cinco etapas, de que el productor publica hasta que cierra el romaneo.
          </p>
        </div>
        <div className="mt-9">
          <LineaDeTiempo etapas={ETAPAS} />
        </div>
      </Banda>

      {/* 5. Antes de participar */}
      <Banda tono="bg-superficie-2">
        <h2 className="text-3xl font-semibold tracking-tight">Antes de participar</h2>
        <dl className="mt-7 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {ANTES_DE_PARTICIPAR.map((c) => (
            <div key={c.titulo} className="border-t border-borde-fuerte pt-3">
              <dt className="font-semibold tracking-tight">{c.titulo}</dt>
              <dd className="mt-1 text-tinta-suave">{c.texto}</dd>
            </div>
          ))}
        </dl>
      </Banda>

      {/* 6. Proyectos y casos */}
      <Banda>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight">
              Proyectos y casos cerrados
            </h2>
            <p className="mt-3 text-tinta-suave">
              Lo que está abierto hoy y un ciclo ya cerrado, con lo que dijo el romaneo del
              frigorífico.
            </p>
          </div>
          <BotonLink href="/proyectos" variante="secundario">
            Ver el catálogo
          </BotonLink>
        </div>

        <ul className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {destacados.map((p, i) => (
            <li key={p.id}>
              <ProyectoCard
                proyecto={p}
                foto={buscarImagen("fotos", `proyecto-${i + 1}`)}
                resumida
              />
            </li>
          ))}

              {cerrado?.resultado ? (
                <li>
                  <Panel className="flex h-full flex-col overflow-hidden">
                    <div className="relative aspect-[16/10] bg-marca-suave">
                      {fotoCaso ? (
                        <Image
                          src={fotoCaso}
                          alt=""
                          fill
                          sizes="(max-width: 40rem) 100vw, 22rem"
                          className="object-cover"
                        />
                      ) : null}
                      {/* Rotulado como demostrativo: es un ciclo del seed, no
                          una operación real de Guardian. */}
                      <span className="absolute left-3 top-3 rounded-full bg-marca px-3 py-1 text-sm font-medium text-marca-contraste">
                        Caso cerrado · demostrativo
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-sm text-tinta-tenue">
                        {cerrado.provincia} · {modalidadLabel(cerrado.modalidad)}
                      </p>
                      <h3 className="mt-1.5 font-semibold">
                        <Link
                          href={`/proyectos/${cerrado.id}`}
                          className="hover:text-marca"
                        >
                          {cerrado.titulo}
                        </Link>
                      </h3>
                      <dl className="mt-4 space-y-2 border-t border-borde pt-4 text-sm">
                        <div className="flex items-baseline justify-between gap-3">
                          <dt className="text-tinta-suave">Cabezas faenadas</dt>
                          <dd className="codigo font-medium">
                            {formatNum(cerrado.resultado.cabezasFaena)}
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3">
                          <dt className="text-tinta-suave">Kilos de carne</dt>
                          <dd className="codigo font-medium">
                            {formatNum(cerrado.resultado.kgCarne)} kg
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </Panel>
                </li>
              ) : null}
        </ul>
      </Banda>

      {/* 7. Cierre: crear la cuenta y el contacto, juntos y al final */}
      <section className={`${ANCHO_COMPLETO} bg-marca-fuerte text-white`}>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Empezá con tu cuenta</h2>
            <p className="mt-3 max-w-md text-white/85">
              Con una cuenta ves las condiciones de cada proyecto, el respaldo documental
              completo y seguís el ciclo hasta el cierre.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/registro"
                className="flex min-h-11 items-center rounded-lg bg-white px-5 py-2 font-medium text-marca-fuerte transition-colors hover:bg-marca-suave"
              >
                Crear mi cuenta
              </Link>
              <Link
                href="/ingresar"
                className="flex min-h-11 items-center rounded-lg border border-white/40 px-5 py-2 font-medium text-white transition-colors hover:bg-white/10"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Contacto</h2>
            <p className="mt-3 max-w-md text-white/85">
              Consultá por modalidades de participación. Te respondemos por el medio que
              prefieras.
            </p>
            <dl className="mt-6 space-y-3">
              <div>
                <dt className="text-sm text-white/70">Correo</dt>
                <dd>
                  <a
                    href={`mailto:${CORREO_CONTACTO}`}
                    className="inline-flex min-h-11 items-center text-xl font-medium underline underline-offset-4 hover:text-marca-suave"
                  >
                    {CORREO_CONTACTO}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-white/70">Teléfono</dt>
                <dd>
                  <a
                    href={`tel:+54${TELEFONO_CONTACTO.replace(/\D/g, "")}`}
                    className="tabular inline-flex min-h-11 items-center text-xl font-medium underline underline-offset-4 hover:text-marca-suave"
                  >
                    {TELEFONO_CONTACTO}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mx-auto max-w-6xl border-t border-white/15 px-4 py-5">
          <p className="max-w-3xl text-sm text-white/75">
            Es el prototipo de la plataforma, con datos de prueba. La publicación de
            proyectos, la carga de documentación y su validación se pueden recorrer de punta
            a punta; la participación en proyectos todavía no.{" "}
            <Link href="/admin" className="underline underline-offset-4 hover:text-white">
              Ver la cola de validación de Guardian
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

/**
 * Cada sección es una franja de ancho completo con su propio tono: sin eso las
 * seis se leen como un solo bloque de texto.
 */
function Banda({ tono = "", children }: { tono?: string; children: React.ReactNode }) {
  return (
    <section className={`${ANCHO_COMPLETO} ${tono}`}>
      <div className="mx-auto max-w-6xl px-4 py-14">{children}</div>
    </section>
  );
}
