import { Ayuda } from "@/components/ui/ayuda";
import type { Saldos } from "@/lib/data";
import { formatArs, formatArsCompacto } from "@/lib/format";

/**
 * Los tres momentos del dinero de un productor, del más cercano al más lejano.
 *
 * No es una billetera y el texto lo dice: en Guardian no hay un saldo que se
 * pueda mover. El dinero está en la cuenta del fideicomiso de cada proyecto y
 * sale como desembolso autorizado, contra documentación y por decisión del
 * fiduciario. El acumulado histórico va último a propósito: es el número más
 * grande y arriba se confundiría con dinero disponible.
 */
export function SaldosCard({ saldos }: { saldos: Saldos }) {
  const filas = [
    {
      titulo: "Desembolsos aprobados",
      valor: saldos.pendienteDeRetiro,
      total: saldos.liberadoHistorico,
      ayuda:
        "Desembolsos ya aprobados a tu favor que el fiduciario todavía no pagó. No es un saldo que puedas mover: se paga según el contrato.",
    },
    {
      titulo: "En el fideicomiso",
      valor: saldos.aLiquidar,
      total: saldos.recaudadoHistorico,
      ayuda:
        "Capital acreditado en la cuenta del fideicomiso de tus proyectos, sin desembolso aprobado. Sale contra la documentación del hito que corresponda.",
    },
    {
      titulo: "Recaudado histórico",
      valor: saldos.recaudadoHistorico,
      total: saldos.objetivoHistorico,
      ayuda:
        "Todo el capital que se acreditó en tus proyectos desde el primero, sobre el total que pediste. Es tu historial, no dinero disponible.",
    },
  ];

  return (
    <div className="rounded-2xl bg-marca-fuerte p-5 text-marca-contraste sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight">Tu dinero en Guardian</h2>

      <ul className="mt-5 space-y-3">
        {filas.map((f) => {
          const pct = f.total > 0 ? Math.min(100, (f.valor / f.total) * 100) : 0;
          return (
            <li key={f.titulo} className="rounded-xl bg-white/8 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="flex items-center gap-2 font-medium">
                  {f.titulo}
                  <Ayuda etiqueta={f.titulo.toLowerCase()}>{f.ayuda}</Ayuda>
                </span>
                <span className="tabular">
                  <span className="font-semibold">{formatArsCompacto(f.valor)}</span>
                  <span className="text-marca-contraste/60"> / {formatArsCompacto(f.total)}</span>
                </span>
              </div>

              <div
                className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/20"
                role="progressbar"
                aria-valuenow={Math.round(pct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${f.titulo}: ${formatArs(f.valor)} de ${formatArs(f.total)}`}
              >
                <div
                  className="h-full rounded-full bg-marca-viva"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
