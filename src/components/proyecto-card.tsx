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
}: {
  proyecto: Proyecto;
  foto: string | null;
}) {
  const pct = porcentajeRecaudado(proyecto.montoRecaudadoArs, proyecto.montoObjetivoArs);
  const retorno = retornoCompacto(proyecto);

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
        <p className="text-sm text-tinta-tenue">
          {proyecto.provincia} · {modalidadLabel(proyecto.modalidad)}
        </p>
        <h3 className="mt-1.5 text-lg font-semibold leading-snug tracking-tight">
          <Link href={`/proyectos/${proyecto.id}`} className="hover:text-marca">
            <span className="absolute inset-0" aria-hidden />
            {proyecto.titulo}
          </Link>
        </h3>

        <p className="mt-2 text-sm text-tinta-suave">{proyecto.destinoDetalle}</p>

        <dl className="tabular mt-4 grid grid-cols-3 gap-3 border-y border-borde py-3">
          <div>
            <dt className="text-sm text-tinta-tenue">Cabezas</dt>
            <dd className="text-sm font-medium">{formatNum(proyecto.cabezas)}</dd>
          </div>
          <div>
            <dt className="text-sm text-tinta-tenue">Plazo</dt>
            <dd className="text-sm font-medium">{proyecto.plazoDias} días</dd>
          </div>
          <div>
            <dt className="text-sm text-tinta-tenue">{retorno.etiqueta}</dt>
            <dd className="text-sm font-medium">{retorno.valor}</dd>
          </div>
        </dl>

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
      </div>
    </Panel>
  );
}
