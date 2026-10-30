import { ArrowRight, CalendarDays, Check, ChartPie, Scale, Tag } from "lucide-react";
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
import { ICONO_RUBRO, Vaca, type Icono as TipoIcono } from "@/components/iconos";
import { CICLOS } from "@/lib/ciclos";
import { partesDelTitulo, queCubre, situacionDelLote } from "@/lib/cubre";
import type { Proyecto } from "@/lib/types";

/** Un dato de la tarjeta: ícono, valor y etiqueta. */
function Dato({ icono: Icono, valor, etiqueta }: { icono: TipoIcono; valor: string; etiqueta: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-marca-suave text-marca">
        <Icono className="size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="tabular block truncate font-semibold leading-tight">{valor}</span>
        <span className="block text-sm leading-tight text-tinta-tenue">{etiqueta}</span>
      </span>
    </div>
  );
}

function RubroIcono({ rubro }: { rubro: string }) {
  const I = ICONO_RUBRO[rubro];
  return I ? <I className="size-3.5" strokeWidth={1.75} aria-hidden /> : null;
}

/** El círculo con la flecha, arriba a la derecha de la foto. La tarjeta entera es el enlace. */
function Flecha() {
  return (
    <span
      className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-white text-marca-fuerte shadow-[var(--sombra-alta)] transition-transform group-hover:translate-x-0.5"
      aria-hidden
    >
      <ArrowRight className="size-[1.125rem]" strokeWidth={1.75} aria-hidden />
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
          <Dato icono={Vaca} valor={formatNum(proyecto.cabezas)} etiqueta="Cabezas" />
          <Dato icono={Tag} valor={proyecto.categoria} etiqueta="Categoría" />
          {resumida ? null : (
            <>
              <Dato icono={CalendarDays} valor={`${proyecto.plazoDias} días`} etiqueta="Plazo" />
              <Dato icono={ChartPie} valor={retorno.valor} etiqueta={retorno.etiqueta} />
            </>
          )}
        </div>

        {visibles.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Qué cubre el proyecto">
            {visibles.map((c) => (
              <li
                key={c}
                className="flex items-center gap-1.5 rounded-full bg-marca-suave px-2.5 py-1 text-sm font-medium text-marca"
              >
                <RubroIcono rubro={c} />
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
          <Check className="mt-0.5 size-4 shrink-0 text-marca" strokeWidth={2} aria-hidden />
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
          <Dato icono={Vaca} valor={formatNum(r.cabezasFaena)} etiqueta="Cabezas faenadas" />
          <Dato icono={Scale} valor={`${formatNum(r.kgCarne)} kg`} etiqueta="Kilos de carne" />
        </div>

        <p className="mt-4 flex items-start gap-2 text-sm text-tinta-suave">
          <Check className="mt-0.5 size-4 shrink-0 text-marca" strokeWidth={2} aria-hidden />
          Cifras del romaneo del frigorífico
        </p>
      </div>
    </article>
  );
}
