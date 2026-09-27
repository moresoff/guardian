import type { Proyecto, RegistroSeguimiento } from "@/lib/types";

/**
 * Lo que se puede afirmar de un ciclo a partir de sus pesadas.
 *
 * Todo lo de acá sale de lo que el productor cargó y del proyecto: no hay
 * estimaciones ni proyecciones. Si falta una pesada, falta el dato; el resultado
 * real del ciclo sigue saliendo del romaneo de playa y de ningún otro lado.
 */
export interface TramoSeguimiento {
  registro: RegistroSeguimiento;
  /** Días desde la pesada anterior, o desde el arranque para la primera. */
  dias: number;
  /** Kilos que ganó cada animal en el tramo. */
  kilosGanados: number;
  /** Kilos por día y por cabeza: la medida con la que se mira un corral. */
  gananciaDiariaKg: number;
}

export interface ResumenSeguimiento {
  ultima: RegistroSeguimiento;
  tramos: TramoSeguimiento[];
  diasEnCiclo: number;
  /** Kilos ganados por cabeza desde el peso de entrada. */
  kilosGanadosPorCabeza: number;
  /** Los mismos kilos, por todo el lote vivo. */
  kilosGanadosLote: number;
  gananciaDiariaPromedioKg: number;
  /** Cuánto del objetivo de peso ya se recorrió, de 0 a 100. */
  avancePct: number;
  gastoAcumuladoArs: number;
  /** Cuánto costó cada kilo puesto sobre el lote. */
  costoPorKiloArs: number;
  mortandadTotal: number;
  mortandadPct: number;
}

const DIA = 86_400_000;

const diasEntre = (desde: string, hasta: string) =>
  Math.max(1, Math.round((new Date(hasta).getTime() - new Date(desde).getTime()) / DIA));

export function resumirSeguimiento(
  proyecto: Proyecto,
  registros: RegistroSeguimiento[],
): ResumenSeguimiento | null {
  if (registros.length === 0) return null;

  const inicio = proyecto.publicadoAt ?? proyecto.creadoAt;
  const tramos: TramoSeguimiento[] = registros.map((registro, i) => {
    const previo = registros[i - 1];
    const dias = diasEntre(previo?.fecha ?? inicio, registro.fecha);
    const kilosGanados =
      registro.pesoPromedioKg - (previo?.pesoPromedioKg ?? proyecto.pesoEntradaKg);
    return {
      registro,
      dias,
      kilosGanados,
      gananciaDiariaKg: kilosGanados / dias,
    };
  });

  const ultima = registros[registros.length - 1];
  const diasEnCiclo = diasEntre(inicio, ultima.fecha);
  const kilosGanadosPorCabeza = ultima.pesoPromedioKg - proyecto.pesoEntradaKg;
  const gastoAcumuladoArs = registros.reduce((acc, r) => acc + r.gastoArs, 0);
  const kilosGanadosLote = kilosGanadosPorCabeza * ultima.cabezas;
  const objetivo = proyecto.pesoSalidaObjetivoKg - proyecto.pesoEntradaKg;

  return {
    ultima,
    tramos,
    diasEnCiclo,
    kilosGanadosPorCabeza,
    kilosGanadosLote,
    gananciaDiariaPromedioKg: kilosGanadosPorCabeza / diasEnCiclo,
    avancePct:
      objetivo > 0
        ? Math.max(0, Math.min(100, (kilosGanadosPorCabeza / objetivo) * 100))
        : 0,
    gastoAcumuladoArs,
    costoPorKiloArs: kilosGanadosLote > 0 ? gastoAcumuladoArs / kilosGanadosLote : 0,
    mortandadTotal: registros.reduce((acc, r) => acc + r.mortandad, 0),
    mortandadPct:
      proyecto.cabezas > 0
        ? (registros.reduce((acc, r) => acc + r.mortandad, 0) / proyecto.cabezas) * 100
        : 0,
  };
}
