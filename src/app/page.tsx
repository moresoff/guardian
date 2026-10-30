import Image from "next/image";
import Link from "next/link";
import { LineaDeTiempo, type Etapa } from "@/components/linea-tiempo";
import { BotonLink, Panel } from "@/components/ui/primitivos";
import { getProyecto, getProyectosPublicos } from "@/lib/data";
import { formatNum, modalidadLabel } from "@/lib/format";
import { buscarImagen } from "@/lib/imagenes";
import { ProyectoCard } from "@/components/proyecto-card";
import { ConsultaModalidades } from "@/components/consulta-modalidades";
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
    n: "Etapa 01",
    titulo: "Publicación",
    duracion: "Minutos",
    detalle:
      "El productor declara el ciclo: cuántas cabezas, de qué categoría, con qué peso entran y con cuál salen, qué tipo de ciclo es y qué necesita para llevarlo adelante.",
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
    titulo: "Colaboración",
    duracion: "Mientras el proyecto está abierto",
    detalle:
      "El proyecto queda visible y los colaboradores se suman. Cuando está completo, lo necesario para el ciclo se libera según el estado de la hacienda: de una vez si el lote ya existe, por tramos si todavía hay que comprarlo.",
  },
  {
    n: "Etapa 05",
    titulo: "Ciclo y liquidación",
    duracion: "Según el tipo de ciclo",
    detalle:
      "Corre el engorde. Al cerrar, el romaneo de playa del frigorífico dice cuántas cabezas se faenaron, cuántos kilos vivos entraron y cuántos kilos de carne salieron. El romaneo determina el resultado de cada participante.",
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

      {/* Debajo de la foto, la página vuelve al ancho del contenedor. */}
      <div>
        <div className="space-y-16 py-14">
          {/* 1. Quién es Guardian */}
          <section>
            <h2 className="text-3xl font-semibold tracking-tight">Quién es Guardian</h2>
            <div className="mt-5 grid gap-x-10 gap-y-4 lg:grid-cols-2">
              <p className="text-tinta-suave">
                Guardian es una plataforma que pone en contacto a productores ganaderos con
                personas que quieren colaborar en un ciclo de engorde. No es una
                fiduciaria ni administra el dinero de nadie: conecta, verifica la
                documentación y deja todo a la vista.
              </p>
              <p className="text-tinta-suave">
                Nació de un problema concreto: al productor que engorda se le termina el
                dinero antes que el ciclo y sale a vender hacienda liviana, la peor venta
                posible. Del otro lado hay gente que quiere participar en un ciclo
                ganadero y no encuentra por dónde entrar sin comprar un campo.
              </p>
            </div>
          </section>

          {/* 2. Qué hacemos */}
          <section className="border-t border-borde pt-14">
            <h2 className="text-3xl font-semibold tracking-tight">Qué hacemos</h2>
            <dl className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-3">
              {QUE_HACEMOS.map((c) => (
                <div key={c.titulo} className="border-t border-borde-fuerte pt-3">
                  <dt className="text-lg font-semibold tracking-tight">{c.titulo}</dt>
                  <dd className="mt-1 text-sm text-tinta-suave">{c.texto}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8">
              <BotonLink href="/registro">Crear mi cuenta</BotonLink>
            </div>
          </section>

          {/* 3. Tres tipos de ciclo */}
          <section className="border-t border-borde pt-14">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight">
                Tres tipos de ciclo
              </h2>
              <p className="mt-3 text-tinta-suave">
                Cada proyecto es de uno de estos tres tipos, y cada tipo tiene su propia
                forma de llevar el animal hasta la faena.
              </p>
            </div>

            <dl className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-3">
              {SISTEMAS_EN_ORDEN.map((k) => (
                <div key={k} className="border-t border-borde-fuerte pt-3">
                  <dt className="text-lg font-semibold tracking-tight">{CICLOS[k].nombre}</dt>
                  <dd className="mt-1 text-sm text-tinta-suave">{CICLOS[k].descripcion}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-sm text-tinta-suave">
              Cada proyecto detalla sus condiciones para quienes tienen una cuenta.
            </p>
            <ConsultaModalidades className="mt-1" />
          </section>

          {/* 4. Cómo corre un ciclo */}
          <section className="border-t border-borde pt-14">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight">Cómo corre un ciclo</h2>
              <p className="mt-3 text-tinta-suave">
                Pasá por encima de cada etapa (o tocala) para ver qué pasa en cada una.
              </p>
            </div>
            <div className="mt-8">
              <LineaDeTiempo etapas={ETAPAS} />
            </div>
          </section>

          {/* 5. Antes de participar */}
          <section className="border-t border-borde pt-14">
            <h2 className="text-3xl font-semibold tracking-tight">Antes de participar</h2>
            <dl className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2">
              {ANTES_DE_PARTICIPAR.map((c) => (
                <div key={c.titulo} className="border-t border-borde pt-3">
                  <dt className="font-semibold tracking-tight">{c.titulo}</dt>
                  <dd className="mt-1 text-sm text-tinta-suave">{c.texto}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* 6. Proyectos y casos */}
          <section className="border-t border-borde pt-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold tracking-tight">
                  Proyectos y casos cerrados
                </h2>
                <p className="mt-3 text-tinta-suave">
                  Lo que está abierto hoy y un ciclo ya cerrado, con lo que dijo el
                  romaneo del frigorífico.
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
          </section>

          <section className="border-t border-borde pt-8">
            <p className="text-sm text-tinta-suave">
              Es el prototipo de la plataforma, con datos de prueba. La publicación de
              proyectos, la carga de documentación y su validación se pueden recorrer de
              punta a punta; la participación en proyectos todavía no.
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
