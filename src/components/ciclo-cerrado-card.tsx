import { Badge, Panel } from "@/components/ui/primitivos";
import { formatFecha, formatNum, formatPct } from "@/lib/format";
import type { Proyecto } from "@/lib/types";

/**
 * Un ciclo cerrado: de qué lote se trata arriba y, abajo, las cuatro cifras del
 * romaneo en una grilla de dos por dos. El rendimiento de faena va resaltado
 * porque es el dato que se compara entre ciclos; el DT-e queda al pie, como
 * constancia.
 */
export function CicloCerradoCard({ proyecto: p }: { proyecto: Proyecto }) {
  const r = p.resultado;
  if (!r) return null;

  const cifras = [
    { t: "Cabezas faenadas", v: formatNum(r.cabezasFaena) },
    { t: "Kilos vivos", v: `${formatNum(r.kilosVivos)} kg` },
    { t: "Kilos de carne", v: `${formatNum(r.kgCarne)} kg` },
  ];

  return (
    <Panel className="flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold tracking-tight">{p.titulo}</h3>
          <p className="mt-1 text-sm text-tinta-suave">
            {formatNum(p.cabezas)} {p.categoria} · faenado el {formatFecha(r.fecha)}
          </p>
        </div>
        <Badge tono="ok">Liquidado</Badge>
      </div>

      <dl className="mt-5 grid gap-2.5 min-[30rem]:grid-cols-3">
        <div className="min-[30rem]:col-span-3 rounded-xl bg-marca-suave px-4 py-3.5">
          <dt className="text-sm text-marca">Rendimiento de faena</dt>
          <dd className="codigo mt-0.5 text-2xl font-semibold text-marca">
            {formatPct(r.rendimientoPct)}
          </dd>
        </div>
        {cifras.map((c) => (
          <div key={c.t} className="rounded-xl bg-superficie-2 px-4 py-3">
            <dt className="text-sm text-tinta-suave">{c.t}</dt>
            <dd className="codigo mt-0.5 font-semibold">{c.v}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-auto pt-4 text-sm text-tinta-tenue">
        DT-e de salida <span className="codigo">{r.dteSalida}</span>
      </p>
    </Panel>
  );
}
