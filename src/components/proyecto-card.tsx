import Image from "next/image";
import Link from "next/link";
import { EstadoProyectoBadge } from "@/components/estados";
import { Progreso } from "@/components/ui/primitivos";
import {
  formatArsCompacto,
  formatNum,
  porcentajeRecaudado,
} from "@/lib/format";
import { retornoCompacto } from "@/lib/proyecto";
import { CICLOS } from "@/lib/ciclos";
import { partesDelTitulo, queCubre, situacionDelLote } from "@/lib/cubre";
import type { Proyecto } from "@/lib/types";

/**
 * Íconos propios, un solo trazo y un solo grosor. Acompañan al dato, nunca lo
 * reemplazan: cada uno va con su valor y su etiqueta escritos.
 */
const ICONOS = {
  cabezas: "M4 7h16M4 12h16M4 17h16",
  categoria: "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5",
  plazo: "M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  reparto: "M12 3v9h9M20.5 15A9 9 0 119 3.5",
  flecha: "M5 12h14M13 6l6 6-6 6",
  faena: "M5 12l4 4 10-10",
} as const;

function Icono({ d, className = "size-4" }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

/** Un dato de la tarjeta: ícono, valor y etiqueta. */
function Dato({ icono, valor, etiqueta }: { icono: string; valor: string; etiqueta: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-marca-suave text-marca">
        <Icono d={icono} />
      </span>
      <span className="min-w-0">
        <span className="tabular block truncate font-semibold leading-tight">{valor}</span>
        <span className="block text-sm leading-tight text-tinta-tenue">{etiqueta}</span>
      </span>
    </div>
  );
}

/** El círculo con la flecha, arriba a la derecha de la foto. La tarjeta entera es el enlace. */
function Flecha() {
  return (
    <span
      className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-white text-marca-fuerte shadow-[var(--sombra-alta)] transition-transform group-hover:translate-x-0.5"
      aria-hidden
    >
      <Icono d={ICONOS.flecha} className="size-[1.125rem]" />
    </span>
  );
}

const CONTENEDOR =
  "group relative flex h-full flex-col rounded-3xl bg-superficie p-3 shadow-[var(--sombra-alta)] ring-1 ring-borde transition-shadow hover:shadow-[0_4px_8px_rgb(23_33_29/0.08),0_16px_32px_rgb(23_33_29/0.1)]";

/**
 * Un proyecto visto desde afuera: la foto del lote, qué es, los datos que se
 * leen de un vistazo y qué cubre. Misma tarjeta en la portada y en el catálogo.
 *
 * Orden de lectura, de arriba hacia abajo: foto con el tipo de ciclo → título y
 * lote → datos → qué cubre → de dónde sale la hacienda (y el avance, con cuenta).
 */
export function ProyectoCard({
  proyecto,
  foto,
  resumida = false,
}: {
  proyecto: Proyecto;
  foto: string | null;
  /**
   * Para quien no tiene cuenta: de qué va el proyecto y nada más. Sin montos,
   * plazos ni reparto, que son condiciones económicas y se ven con sesión.
   */
  resumida?: boolean;
}) {
  const pct = porcentajeRecaudado(proyecto.montoRecaudadoArs, proyecto.montoObjetivoArs);
  const retorno = retornoCompacto(proyecto);
  const partes = partesDelTitulo(proyecto.titulo);
  const cubre = queCubre(proyecto);
  const visibles = cubre.slice(0, 2);
  const resto = cubre.length - visibles.length;

  return (
    <article className={CONTENEDOR}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-marca-suave">
        {foto ? (
          <Image
            src={foto}
            alt=""
            fill
            sizes="(max-width: 40rem) 100vw, 24rem"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-sm font-medium text-marca-fuerte shadow-[var(--sombra-baja)]">
          {CICLOS[proyecto.sistemaProductivo].nombre}
        </span>
        <Flecha />
        <span className="absolute bottom-3 left-3">
          <EstadoProyectoBadge estado={proyecto.estado} />
        </span>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
        <p className="text-sm text-tinta-tenue">{proyecto.provincia}</p>
        <h3 className="mt-0.5 text-xl font-semibold leading-snug tracking-tight">
          <Link
            href={`/proyectos/${proyecto.id}`}
            className="after:absolute after:inset-0 after:rounded-3xl hover:text-marca"
          >
            {partes.principal}
          </Link>
        </h3>
        {partes.lote ? <p className="font-medium text-tinta-suave">{partes.lote}</p> : null}

        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-borde pt-4">
          <Dato icono={ICONOS.cabezas} valor={formatNum(proyecto.cabezas)} etiqueta="Cabezas" />
          <Dato icono={ICONOS.categoria} valor={proyecto.categoria} etiqueta="Categoría" />
          {resumida ? null : (
            <>
              <Dato icono={ICONOS.plazo} valor={`${proyecto.plazoDias} días`} etiqueta="Plazo" />
              <Dato icono={ICONOS.reparto} valor={retorno.valor} etiqueta={retorno.etiqueta} />
            </>
          )}
        </div>

        {visibles.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Qué cubre el proyecto">
            {visibles.map((c) => (
              <li
                key={c}
                className="rounded-full bg-marca-suave px-2.5 py-1 text-sm font-medium text-marca"
              >
                {c}
              </li>
            ))}
            {resto > 0 ? (
              <li className="rounded-full bg-superficie-2 px-2.5 py-1 text-sm font-medium text-tinta-suave">
                +{resto}
              </li>
            ) : null}
          </ul>
        ) : null}

        <p className="mt-4 flex items-start gap-2 text-sm text-tinta-suave">
          <Icono d={ICONOS.faena} className="mt-0.5 size-4 shrink-0 text-marca" />
          {situacionDelLote(proyecto.tipoPosesion)}
        </p>

        {resumida ? null : (
          <div className="tabular mt-auto pt-4">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold">{formatArsCompacto(proyecto.montoRecaudadoArs)}</span>
              <span className="text-tinta-suave">de {formatArsCompacto(proyecto.montoObjetivoArs)}</span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex-1">
                <Progreso valor={pct} label={`Recaudado ${pct} %`} />
              </span>
              <span className="text-sm font-medium">{pct} %</span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * Un ciclo ya cerrado, con la misma estructura que las abiertas para que el
 * caso se lea como un proyecto más y no como otra cosa: lo que dijo el romaneo.
 */
export function CasoCerradoCard({
  proyecto,
  foto,
}: {
  proyecto: Proyecto;
  foto: string | null;
}) {
  const r = proyecto.resultado;
  if (!r) return null;
  const partes = partesDelTitulo(proyecto.titulo);

  return (
    <article className={CONTENEDOR}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-marca-suave">
        {foto ? (
          <Image
            src={foto}
            alt=""
            fill
            sizes="(max-width: 40rem) 100vw, 24rem"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-sm font-medium text-marca-fuerte shadow-[var(--sombra-baja)]">
          {CICLOS[proyecto.sistemaProductivo].nombre}
        </span>
        <Flecha />
        {/* Rotulado como demostrativo: es un ciclo del seed, no una operación real. */}
        <span className="absolute bottom-3 left-3 rounded-full bg-marca px-3 py-1 text-sm font-medium text-marca-contraste">
          Caso cerrado · demostrativo
        </span>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
        <p className="text-sm text-tinta-tenue">{proyecto.provincia}</p>
        <h3 className="mt-0.5 text-xl font-semibold leading-snug tracking-tight">
          <Link
            href={`/proyectos/${proyecto.id}`}
            className="after:absolute after:inset-0 after:rounded-3xl hover:text-marca"
          >
            {partes.principal}
          </Link>
        </h3>
        {partes.lote ? <p className="font-medium text-tinta-suave">{partes.lote}</p> : null}

        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-borde pt-4">
          <Dato icono={ICONOS.cabezas} valor={formatNum(r.cabezasFaena)} etiqueta="Cabezas faenadas" />
          <Dato icono={ICONOS.categoria} valor={`${formatNum(r.kgCarne)} kg`} etiqueta="Kilos de carne" />
        </div>

        <p className="mt-4 flex items-start gap-2 text-sm text-tinta-suave">
          <Icono d={ICONOS.faena} className="mt-0.5 size-4 shrink-0 text-marca" />
          Cifras del romaneo del frigorífico
        </p>
      </div>
    </article>
  );
}
