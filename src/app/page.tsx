import {
  ClipboardList,
  FileCheck,
  Mail,
  Phone,
  ShieldCheck,
  Sprout,
  Split,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LineaDeTiempo, type Etapa } from "@/components/linea-tiempo";
import { BotonLink } from "@/components/ui/primitivos";
import { getProyecto, getProyectosPublicos } from "@/lib/data";
import { buscarImagen, fotoDelProyecto } from "@/lib/imagenes";
import { CasoCerradoCard, ProyectoCard } from "@/components/proyecto-card";
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
const ANTES_DE_PARTICIPAR: { titulo: string; texto: string }[] = [
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

const ICONO_CICLO: Record<string, LucideIcon> = {
  corral: Warehouse,
  mixto: Split,
  pastura: Sprout,
};

const QUE_HACEMOS: { icono: LucideIcon; titulo: string; texto: string }[] = [
  {
    icono: FileCheck,
    titulo: "Publicamos ciclos con respaldo",
    texto:
      "El productor declara el lote y sube la documentación que ya emite. Guardian la lee y cruza cada dato contra lo declarado.",
  },
  {
    icono: ShieldCheck,
    titulo: "Verificamos antes de mostrar",
    texto:
      "Revisamos las discrepancias y comprobamos la autenticidad de los comprobantes por el canal oficial antes de que el proyecto sea visible.",
  },
  {
    icono: ClipboardList,
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
  const abiertos = (await getProyectosPublicos()).filter(
    (p) => p.estado === "abierto",
  );
  const cerrado = await getProyecto("pry-6");
  const destacados = abiertos.slice(0, 2);
  const fotoCaso = cerrado ? fotoDelProyecto(cerrado.id) : null;

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
              Participá en el engorde de un lote concreto, con el activo real a
              la vista: un establecimiento con nombre y RENSPA.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Elegí de qué lado entrás
            </h2>
            {/* /85 y no /80: sobre un cielo quemado, /80 da 4.38:1 y no llega. */}
            <p className="mt-2 text-white/85">
              Son dos problemas distintos. Elegí el tuyo y creás la cuenta ahí
              mismo.
            </p>

            <div className="mt-6 grid gap-4">
              {PUERTAS.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="group flex items-center gap-4 rounded-2xl bg-superficie p-5 shadow-[var(--sombra-alta)] transition-transform hover:-translate-y-0.5 sm:p-6"
                >
                  <span className="flex-1">
                    <span className="block text-xl font-semibold tracking-tight sm:text-2xl">
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
        <h2 className="text-3xl font-semibold tracking-tight">
          Quién es Guardian
        </h2>
        <div className="mt-5 grid gap-x-10 gap-y-4 lg:grid-cols-2">
          <p className="text-tinta-suave">
            Guardian es una plataforma que pone en contacto a productores
            ganaderos con personas que quieren colaborar en un ciclo de engorde.
            No es una fiduciaria ni administra el dinero de nadie: conecta,
            verifica la documentación y deja todo a la vista.
          </p>
          <p className="text-tinta-suave">
            Nació de un problema concreto: al productor que engorda se le
            termina el dinero antes que el ciclo y sale a vender hacienda
            liviana, la peor venta posible. Del otro lado hay gente que quiere
            participar en un ciclo ganadero y no encuentra por dónde entrar sin
            comprar un campo.
          </p>
        </div>
      </Banda>

      {/* 2. Qué hacemos: tres cosas distintas, tres tarjetas distintas */}
      <Banda tono="bg-marca-suave">
        <h2 className="text-3xl font-semibold tracking-tight">Qué hacemos</h2>
        <div className="mt-7 grid gap-4 lg:grid-cols-5">
          <article className="rounded-2xl bg-superficie p-7 shadow-[var(--sombra-baja)] lg:col-span-3 lg:p-9">
            <span className="flex size-12 items-center justify-center rounded-full bg-marca-suave text-marca">
              <FileCheck className="size-6" strokeWidth={1.75} aria-hidden />
            </span>
            <h3 className="mt-5 text-2xl font-semibold tracking-tight">
              {QUE_HACEMOS[0].titulo}
            </h3>
            <p className="mt-3 max-w-prose text-tinta-suave">
              {QUE_HACEMOS[0].texto}
            </p>
          </article>
          <article className="rounded-2xl bg-marca-fuerte p-7 text-white lg:col-span-2 lg:p-9">
            <span className="flex size-12 items-center justify-center rounded-full bg-white/15 text-white">
              <ShieldCheck className="size-6" strokeWidth={1.75} aria-hidden />
            </span>
            <h3 className="mt-5 text-2xl font-semibold tracking-tight">
              {QUE_HACEMOS[1].titulo}
            </h3>
            <p className="mt-3 text-white/85">{QUE_HACEMOS[1].texto}</p>
          </article>
          <article className="rounded-2xl border border-marca/25 bg-papel p-7 lg:col-span-5 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-9">
            <div className="flex items-center gap-4 lg:shrink-0">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-marca-suave text-marca">
                <ClipboardList
                  className="size-6"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </span>
              <h3 className="text-xl font-semibold tracking-tight">
                {QUE_HACEMOS[2].titulo}
              </h3>
            </div>
            <p className="mt-2 max-w-prose text-tinta-suave lg:mt-0">
              {QUE_HACEMOS[2].texto}
            </p>
          </article>
        </div>
      </Banda>

      {/* 3. Tres tipos de ciclo, como un recorrido del corral a la pastura */}
      <Banda tono="bg-superficie">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight">
            Tres tipos de ciclo
          </h2>
          <p className="mt-3 text-tinta-suave">
            Cada proyecto es de uno de estos tres tipos. Van de menos a más
            pastura: del corral de punta a punta, a todo el ciclo sobre el
            campo.
          </p>
        </div>

        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-0">
          {SISTEMAS_EN_ORDEN.map((k) => (
            <li key={k} className="relative md:pr-8">
              {/* El camino: un punto por tipo y una línea que sigue hacia el próximo. */}
              <div className="flex items-center" aria-hidden>
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-marca text-marca-contraste">
                  {(() => {
                    const I = ICONO_CICLO[k];
                    return <I className="size-6" strokeWidth={1.75} />;
                  })()}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">
                {CICLOS[k].nombre}
              </h3>
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
          <h2 className="text-3xl font-semibold tracking-tight">
            Cómo corre un ciclo
          </h2>
          <p className="mt-3 text-tinta-suave">
            Cinco etapas, desde que el productor publica hasta que cierra el
            romaneo. Pasan solas, y podés elegir la que quieras ver.
          </p>
        </div>
        <div className="mt-9">
          <LineaDeTiempo etapas={ETAPAS} />
        </div>
      </Banda>

      {/* 5. Antes de participar */}
      <Banda tono="bg-superficie-2">
        <h2 className="text-3xl font-semibold tracking-tight">
          Antes de participar
        </h2>
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
              Lo que está abierto hoy y un ciclo ya cerrado, con lo que dijo el
              romaneo del frigorífico.
            </p>
          </div>
          <BotonLink href="/proyectos" variante="secundario">
            Ver el catálogo
          </BotonLink>
        </div>

        <ul className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {destacados.map((p) => (
            <li key={p.id}>
              <ProyectoCard
                proyecto={p}
                foto={fotoDelProyecto(p.id)}
                resumida
              />
            </li>
          ))}

          {cerrado?.resultado ? (
            <li>
              <CasoCerradoCard proyecto={cerrado} foto={fotoCaso} />
            </li>
          ) : null}
        </ul>
      </Banda>

      {/* 7. Cierre: crear la cuenta y el contacto, juntos y al final */}
      <section className={`${ANCHO_COMPLETO} bg-marca-fuerte text-white`}>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:py-14 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Empezá con tu cuenta
            </h2>
            <p className="mt-3 max-w-sm text-white/85">
              Con una cuenta ves las condiciones de cada proyecto, el respaldo
              documental completo y seguís el ciclo hasta el cierre.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/registro"
                className="flex min-h-11 items-center rounded-full bg-white px-5 py-2 font-medium text-marca-fuerte transition-colors hover:bg-marca-suave"
              >
                Crear mi cuenta
              </Link>
              <Link
                href="/ingresar"
                className="flex min-h-11 items-center rounded-full border border-white/40 px-5 py-2 font-medium text-white transition-colors hover:bg-white/10"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Contacto</h2>
            <p className="mt-3 max-w-sm text-white/85">
              Consultá por modalidades de participación. Te respondemos por el
              medio que prefieras.
            </p>
            <dl className="mt-6 space-y-3">
              <div>
                <dt className="flex items-center gap-2 text-sm text-white/70">
                  <Mail className="size-4" strokeWidth={1.75} aria-hidden />
                  Correo
                </dt>
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
                <dt className="flex items-center gap-2 text-sm text-white/70">
                  <Phone className="size-4" strokeWidth={1.75} aria-hidden />
                  Teléfono
                </dt>
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
      </section>
      <Banda>
        <p className="mx-auto max-w-2xl text-center text-sm text-tinta-suave">
          Es el prototipo de la plataforma, con datos de prueba. La publicación
          de proyectos, la carga de documentación y su validación se pueden
          recorrer de punta a punta; la participación en proyectos todavía no.
        </p>
      </Banda>
    </div>
  );
}

/**
 * Cada sección es una franja de ancho completo con su propio tono: sin eso las
 * seis se leen como un solo bloque de texto.
 */
function Banda({
  tono = "",
  children,
}: {
  tono?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${ANCHO_COMPLETO} ${tono}`}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-14">{children}</div>
    </section>
  );
}
