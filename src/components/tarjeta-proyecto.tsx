import Image from "next/image";
import Link from "next/link";
import { EstadoProyectoBadge } from "@/components/estados";
import { Panel, Progreso } from "@/components/ui/primitivos";
import {
  formatArsCompacto,
  formatFecha,
  modalidadLabel,
  formatNum,
  porcentajeRecaudado,
} from "@/lib/format";
import type { Proyecto } from "@/lib/types";

export interface ItemProyecto {
  proyecto: Proyecto;
  /** Lo que ese proyecto le está pidiendo al productor, en una línea. */
  pendiente?: string;
  foto: string | null;
}

/**
 * La tarjeta con la que el productor ve un proyecto suyo, igual en el resumen de
 * la cuenta y en el listado completo: la misma cosa no debería cambiar de forma
 * según la pantalla donde aparece.
 */
export function TarjetaProyecto({ item }: { item: ItemProyecto }) {
  const p = item.proyecto;
  const pct = porcentajeRecaudado(p.montoRecaudadoArs, p.montoObjetivoArs);
  const conMonto = p.estado !== "borrador" && p.estado !== "en_validacion";

  return (
    <Panel className="relative flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/9] bg-marca-suave">
        {item.foto ? (
          <Image
            src={item.foto}
            alt=""
            fill
            sizes="(max-width: 40rem) 100vw, 28rem"
            className="object-cover"
          />
        ) : null}
        <span className="absolute left-3 top-3">
          <EstadoProyectoBadge estado={p.estado} />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm text-tinta-tenue">
          {modalidadLabel(p.modalidad)} · creado el {formatFecha(p.creadoAt)}
        </p>
        <h3 className="mt-1.5 text-lg font-semibold tracking-tight">
          <Link href={`/productor/proyectos/${p.id}`} className="hover:text-marca">
            <span className="absolute inset-0" aria-hidden />
            {p.titulo}
          </Link>
        </h3>
        <p className="mt-2 text-sm text-tinta-suave">
          {formatNum(p.cabezas)} cabezas · {p.plazoDias} días
        </p>

        {item.pendiente ? (
          <p className="mt-3 text-sm font-medium text-alerta">{item.pendiente}</p>
        ) : null}

        {conMonto ? (
          <div className="tabular mt-auto pt-5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">
                {formatArsCompacto(p.montoRecaudadoArs)}
              </span>
              <span className="text-tinta-suave">
                de {formatArsCompacto(p.montoObjetivoArs)}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex-1">
                <Progreso valor={pct} label={`Recaudado ${pct} %`} />
              </span>
              <span className="text-sm font-medium">{pct} %</span>
            </div>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
