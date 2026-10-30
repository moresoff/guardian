import Image from "next/image";
import Link from "next/link";
import { EstadoProyectoBadge } from "@/components/estados";
import { Panel, Progreso } from "@/components/ui/primitivos";
import {
  formatArsCompacto,
  formatNum,
  modalidadLabel,
  porcentajeRecaudado,
} from "@/lib/format";
import { retornoCompacto } from "@/lib/proyecto";
import { CICLOS } from "@/lib/ciclos";
import { partesDelTitulo, queCubre, situacionDelLote } from "@/lib/cubre";
import type { Proyecto } from "@/lib/types";

/**
 * Un proyecto visto desde afuera: la foto del lote, en qué se gasta el capital y
 * cuánto falta para completar el fondeo.
 *
 * Es la misma tarjeta en la portada y en el catálogo. Antes eran dos y la del
 * catálogo no tenía foto, así que el mismo proyecto se veía distinto según por
 * dónde hubieras llegado.
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

  return (
    <Panel className="relative flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/10] bg-marca-suave">
        {foto ? (
          <Image
            src={foto}
            alt=""
            fill
            sizes="(max-width: 40rem) 100vw, 24rem"
            className="object-cover"
          />
        ) : null}
        <span className="absolute left-3 top-3">
          <EstadoProyectoBadge estado={proyecto.estado} />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="rotulo text-marca">
          {resumida ? CICLOS[proyecto.sistemaProductivo].nombre : modalidadLabel(proyecto.modalidad)}
          <span className="text-tinta-tenue"> · {proyecto.provincia}</span>
        </p>
        <h3 className="mt-2 text-xl font-semibold leading-snug tracking-tight">
          <Link href={`/proyectos/${proyecto.id}`} className="hover:text-marca">
            <span className="absolute inset-0" aria-hidden />
            {partes.principal}
          </Link>
        </h3>
        {partes.lote ? (
          <p className="mt-0.5 font-medium text-tinta-suave">{partes.lote}</p>
        ) : null}

        <dl className="tabular mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-borde pt-4">
          <div>
            <dt className="text-sm text-tinta-tenue">Cabezas</dt>
            <dd className="font-semibold">{formatNum(proyecto.cabezas)}</dd>
          </div>
          <div>
            <dt className="text-sm text-tinta-tenue">Categoría</dt>
            <dd className="font-semibold">{proyecto.categoria}</dd>
          </div>
          {resumida ? null : (
            <>
              <div>
                <dt className="text-sm text-tinta-tenue">Plazo</dt>
                <dd className="font-semibold">{proyecto.plazoDias} días</dd>
              </div>
              <div>
                <dt className="text-sm text-tinta-tenue">{retorno.etiqueta}</dt>
                <dd className="font-semibold">{retorno.valor}</dd>
              </div>
            </>
          )}
        </dl>

        {cubre.length > 0 ? (
          <div className="mt-4">
            <p className="text-sm text-tinta-tenue">Qué cubre</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {cubre.map((c) => (
                <li
                  key={c}
                  className="rounded-full bg-marca-suave px-2.5 py-1 text-sm font-medium text-marca"
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-4 text-sm text-tinta-suave">
          {situacionDelLote(proyecto.tipoPosesion)}
        </p>

        {resumida ? null : (
          <div className="tabular mt-auto pt-4">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold">
                {formatArsCompacto(proyecto.montoRecaudadoArs)}
              </span>
              <span className="text-tinta-suave">
                de {formatArsCompacto(proyecto.montoObjetivoArs)}
              </span>
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
    </Panel>
  );
}
