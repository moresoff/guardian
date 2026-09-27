import Image from "next/image";
import Link from "next/link";
import { LineaDeTiempo, type Etapa } from "@/components/linea-tiempo";
import { ProyectoCard } from "@/components/proyecto-card";
import { Resenas, type Resena } from "@/components/resenas";
import { BotonLink, Panel } from "@/components/ui/primitivos";
import { getProyecto, getProyectosPublicos } from "@/lib/data";
import { formatNum, formatPct, modalidadLabel } from "@/lib/format";
import { buscarImagen } from "@/lib/imagenes";

export const metadata = {
  title: "Guardian — Crecé, ayudando a crecer",
  description:
    "Guardian conecta colaboradores con productores ganaderos que necesitan capital de trabajo para el ciclo de engorde, con la documentación del lote a la vista.",
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
    titulo: "Necesito capital para un ciclo",
    texto:
      "Publicá el ciclo con la documentación que ya emitís y conseguí el capital, sin carpeta de crédito.",
    accion: "Entrar como productor",
  },
  {
    href: "/registro?lado=colaborador",
    rotulo: "Colaborador",
    titulo: "Quiero participar en un ciclo",
    texto:
      "Financiá un lote concreto, con nombre y RENSPA, y seguí el ciclo hasta la faena.",
    accion: "Entrar como colaborador",
  },
];

/** Lo que el contrato asegura, en cuatro titulares. El detalle está en la ficha. */
const CONTRATO = [
  {
    n: "01",
    titulo: "Patrimonio separado",
    texto:
      "La hacienda y el capital de la serie no son del productor ni de Guardian. Un ciclo que sale mal no alcanza a los otros.",
  },
  {
    n: "02",
    titulo: "Guardian es el fiduciario",
    texto:
      "Administra la serie y responde por su gestión. Eso no es garantizar el resultado: el resultado sale de la venta.",
  },
  {
    n: "03",
    titulo: "El destino está escrito",
    texto:
      "El contrato dice qué compra el capital, en qué plazo y cómo se reparte. Salir de ahí es incumplimiento.",
  },
  {
    n: "04",
    titulo: "Rendición de cuentas",
    texto:
      "Guardian rinde cuentas y no puede renunciar a esa obligación. El resultado sale del romaneo.",
  },
];

const ETAPAS: Etapa[] = [
  {
    n: "Etapa 01",
    titulo: "Publicación",
    duracion: "Minutos",
    detalle:
      "El productor declara el ciclo: cuántas cabezas, de qué categoría, con qué peso entran y con cuál salen, cuánto capital necesita y en cuántos días lo devuelve.",
  },
  {
    n: "Etapa 02",
    titulo: "Documentación",
    duracion: "El mismo día",
    detalle:
      "Sube los papeles que ya tiene —RENSPA, DT-e, listado de caravanas, boleto de compra-venta—. Guardian los lee y cruza cada dato contra lo declarado. Si el DT-e ampara 34 animales y el proyecto dice 200, aparece antes de publicarse.",
  },
  {
    n: "Etapa 03",
    titulo: "Validación",
    duracion: "24 a 72 horas",
    detalle:
      "Guardian revisa las discrepancias y verifica la autenticidad de los comprobantes por el canal oficial. Que los datos cierren entre sí no prueba que el papel sea auténtico. Son dos controles distintos y los dos tienen que pasar.",
  },
  {
    n: "Etapa 04",
    titulo: "Fondeo",
    duracion: "Hasta completar el monto",
    detalle:
      "El proyecto queda visible en el catálogo y los colaboradores comprometen capital. Cuando se completa el monto, los fondos se liberan según el estado de la hacienda: de una vez si el lote ya existe, por tramos si todavía hay que comprarlo.",
  },
  {
    n: "Etapa 05",
    titulo: "Ciclo y liquidación",
    duracion: "90 a 180 días",
    detalle:
      "Corre el engorde. Al cerrar, el romaneo de playa del frigorífico dice cuántas cabezas se faenaron, cuántos kilos vivos entraron y cuántos kilos de carne salieron. El romaneo determina lo que cobra cada uno.",
  },
];

const RESENAS: Resena[] = [
  {
    texto:
      "Lo que más me sirvió fue no tener que armar carpeta. Subí el RENSPA y los DT-e que ya emito todos los meses y con eso alcanzó.",
    nombre: "Productor de Exaltación de la Cruz",
    rol: "Corral de 1.200 cabezas",
  },
  {
    texto:
      "Antes terminaba vendiendo liviano en marzo porque se me acababa el dinero. Este año el corral llegó completo a la terminación.",
    nombre: "Productor de Marcos Juárez",
    rol: "Mixto, 800 cabezas",
  },
  {
    texto:
      "Antes de poner capital en el siguiente miro el romaneo del ciclo anterior. El último me dio 57,8 % de rendimiento y con ese número hice la cuenta.",
    nombre: "Colaboradora de Buenos Aires",
    rol: "Tres ciclos financiados",
  },
  {
    texto:
      "Me mostró una discrepancia entre lo que había cargado y el DT-e antes de publicar. Era un error mío de tipeo y me lo marcó solo.",
    nombre: "Productor de Venado Tuerto",
    rol: "Pastura, 600 cabezas",
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
        className={`${ANCHO_COMPLETO} flex min-h-[calc(100svh-6.9rem)] sm:min-h-[calc(100svh-4.31rem)] items-center overflow-hidden bg-marca-fuerte`}
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

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-8 sm:py-12 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div>
            <Image
              src="/imagenes/marca/logo-guardian-blanco.png"
              alt=""
              width={847}
              height={796}
              priority
              className="h-10 w-auto sm:h-14"
            />
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:mt-4 sm:text-6xl">
              Guardian
            </h1>
            <p className="mt-2 text-xl italic text-white/90 sm:text-3xl">
              Crecé, ayudando a crecer
            </p>
            <p className="mt-5 hidden max-w-md text-white/85 sm:block">
              Capital de trabajo para el ciclo de engorde, con el activo real a la vista:
              un lote concreto, en un establecimiento con nombre y RENSPA.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Elegí de qué lado entrás
            </h2>
            {/* /85 y no /80: sobre un cielo quemado, /80 da 4.38:1 y no llega. */}
            <p className="mt-2 text-white/85">
              Son dos problemas distintos. Elegí el tuyo y creás la cuenta ahí mismo.
            </p>

            <div className="mt-6 grid gap-4">
              {PUERTAS.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="group flex items-center gap-4 rounded-2xl bg-superficie p-5 shadow-[var(--sombra-alta)] transition-transform hover:-translate-y-0.5 sm:p-6"
                >
                  <span className="flex-1">
                    <span className="rotulo block text-marca">{p.rotulo}</span>
                    <span className="mt-1.5 block text-xl font-semibold tracking-tight sm:text-2xl">
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

      {/* Debajo de la foto, la página vuelve al ancho del contenedor. */}
      <div>
        <div className="space-y-16 py-14">
          {/* 2. Qué se financia y cómo corre un ciclo */}
          <section>
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight">
                Qué financia Guardian
              </h2>
              <p className="mt-3 text-tinta-suave">
                Dos modalidades, y la diferencia es si el capital compra hacienda. Los
                plazos son los del animal: entre 90 y 180 días.
              </p>
            </div>

            <dl className="mt-9 grid gap-5 sm:grid-cols-2">
              {[
                {
                  t: "Compra y engorde",
                  costo: "Participación en el resultado",
                  d: "El capital compra la hacienda y la termina, y puede pagar los gastos de ese ciclo. El colaborador participa del resultado de la venta.",
                  verifica: "Se verifica: la compra, la recepción y las caravanas",
                },
                {
                  t: "Capital de trabajo",
                  costo: "Capital más tasa pactada",
                  d: "El lote ya es del productor. El capital paga ración, sanidad, corral y flete, contra el presupuesto aprobado.",
                  verifica: "Se verifica: que el lote exista y sea del productor",
                },
              ].map((x) => (
                <div
                  key={x.t}
                  className="flex flex-col rounded-xl border border-borde bg-superficie p-6 shadow-[var(--sombra-baja)]"
                >
                  <dt className="text-lg font-semibold tracking-tight">{x.t}</dt>
                  <dd className="rotulo mt-1 text-tinta-tenue">{x.costo}</dd>
                  <dd className="mt-3 flex-1 text-sm text-tinta-suave">{x.d}</dd>
                  <dd className="mt-5 border-t border-borde pt-3 text-sm font-medium text-marca">
                    {x.verifica}
                  </dd>
                </div>
              ))}
            </dl>

            {/*
              El contrato va en la portada y no solo en la ficha: el colaborador decide
              si entra antes de abrir un proyecto, y lo que compra es una
              participación en un fideicomiso, no un préstamo al productor.

              Cuatro tarjetas y una línea cada una. Antes eran cuatro párrafos y
              nadie los leía: lo que el colaborador necesita de esta sección es el
              titular, y el detalle lo tiene la ficha de cada proyecto.
            */}
            <div className="mt-14">
              <h3 className="text-2xl font-semibold tracking-tight">
                Bajo qué contrato entra el dinero
              </h3>
              <p className="mt-2 max-w-2xl text-tinta-suave">
                Cada proyecto es una serie de un fideicomiso ordinario.
              </p>

              <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {CONTRATO.map((c, i) => (
                  <li
                    key={c.titulo}
                    className="aparece"
                    style={{ animationDelay: `${i * 90}ms` }}
                  >
                    <div className="group h-full rounded-xl border border-borde bg-superficie p-5 shadow-[var(--sombra-baja)] transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:border-marca/30 hover:shadow-[var(--sombra-alta)]">
                      <span className="codigo text-sm text-marca">{c.n}</span>
                      <p className="mt-3 font-semibold tracking-tight transition-colors group-hover:text-marca">
                        {c.titulo}
                      </p>
                      <p className="mt-2 text-sm text-tinta-suave">{c.texto}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-sm text-tinta-suave">
                Cada proyecto publicado muestra su serie: fiduciario, plazos, reparto y
                quién soporta la mortandad.
              </p>
            </div>

            <div className="mt-16">
              <div className="max-w-2xl">
                <h3 className="text-3xl font-semibold tracking-tight">
                  Cómo corre un ciclo
                </h3>
                <p className="mt-3 text-tinta-suave">
                  Pasá por encima de cada etapa (o tocala) para ver qué pasa en cada una.
                </p>
              </div>
              <div className="mt-8">
                <LineaDeTiempo etapas={ETAPAS} />
              </div>
            </div>
          </section>

          {/* 3. Proyectos y casos */}
          <section className="border-t border-borde pt-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold tracking-tight">
                  Proyectos y casos cerrados
                </h2>
                <p className="mt-3 text-tinta-suave">
                  Lo que está abierto hoy y un ciclo ya liquidado, con las cifras que
                  salieron del romaneo del frigorífico.
                </p>
              </div>
              <BotonLink href="/proyectos" variante="secundario">
                Ver el catálogo
              </BotonLink>
            </div>

            <ul className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {destacados.map((p, i) => (
                <li key={p.id}>
                  {/* La misma tarjeta que el catálogo: un proyecto no cambia de
                      forma según la pantalla donde aparece. */}
                  <ProyectoCard
                    proyecto={p}
                    foto={buscarImagen("fotos", `proyecto-${i + 1}`)}
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
                        <div className="flex items-baseline justify-between gap-3">
                          <dt className="text-tinta-suave">Rendimiento</dt>
                          <dd className="codigo font-semibold text-marca">
                            {formatPct(cerrado.resultado.rendimientoPct)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </Panel>
                </li>
              ) : null}
            </ul>
          </section>

          {/* 4. Quiénes somos */}
          <section className="border-t border-borde pt-14">
            <h2 className="text-3xl font-semibold tracking-tight">Quiénes somos</h2>
            <div className="mt-6 grid gap-x-10 gap-y-4 lg:grid-cols-2">
              <p className="text-tinta-suave">
                Al productor que engorda se le termina el capital antes que el ciclo.
                Sale a vender hacienda liviana, que es la peor venta posible: el animal
                todavía estaba sumando los kilos más baratos del engorde.
              </p>
              <p className="text-tinta-suave">
                Del otro lado hay gente que quiere participar en un ciclo ganadero y no encuentra por
                dónde entrar sin comprar un campo. Guardian pone las dos puntas en contacto
                sobre un activo que existe y se puede señalar, con la documentación
                sanitaria a la vista y el romaneo del frigorífico como cifra de cierre.
              </p>
            </div>
            <div className="mt-9 flex justify-center">
              <BotonLink href="/registro">Crear mi cuenta</BotonLink>
            </div>
          </section>

          {/* 5. Reseñas */}
          <section className="border-t border-borde pt-14">
            <h2 className="text-3xl font-semibold tracking-tight">
              Lo que dicen del otro lado
            </h2>
            <p className="mt-2 text-sm text-tinta-tenue">
              Testimonios de ejemplo: Guardian está en etapa de prototipo y todavía no
              tiene ciclos con productores reales.
            </p>
            <div className="mt-7">
              <Resenas resenas={RESENAS} />
            </div>
          </section>

          <section className="border-t border-borde pt-8">
            <p className="text-sm text-tinta-suave">
              Es el prototipo de la plataforma, con datos de prueba. La publicación de
              proyectos, la carga de documentación y su validación se pueden recorrer de
              punta a punta; la suscripción de capital todavía no.
            </p>
            <Link
              href="/admin"
              className="mt-3 inline-block text-sm text-tinta-tenue underline underline-offset-4 transition-colors hover:text-marca"
            >
              Ver la cola de validación de Guardian
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
