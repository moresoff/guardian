import { MODELOS, simularProductor } from "@/lib/simulador";
import type { SistemaProductivo } from "@/lib/types";

/**
 * Los tres tipos de ciclo en los que se participa. Cada uno tiene su plazo y su
 * reparto del resultado: el modelo es el mismo y los números cambian según cuánto
 * dura el animal en el sistema y cuánto aporta cada parte.
 *
 * La clave es el sistema productivo del proyecto, así el tipo de ciclo no es un
 * dato aparte que pueda contradecirlo: `corral` es feedlot puro, `pastura` es
 * pastura pura y `mixto` combina las dos etapas.
 *
 * La rentabilidad anual es una estimación del modelo para el productor, no un
 * compromiso, y por eso se muestra solo del lado del productor.
 */
export interface TipoDeCiclo {
  nombre: string;
  descripcion: string;
  plazoDias: number;
  /** Lo que se queda el productor del resultado. */
  productorPct: number;
  /** Lo que se reparten los colaboradores. Con el del productor suma 100. */
  colaboradoresPct: number;
  /** Rentabilidad anual estimada para el productor, según el modelo. */
  rentabilidadAnualProductorPct: number;
}

const DESCRIPCION: Record<SistemaProductivo, { nombre: string; descripcion: string }> = {
  corral: { nombre: "Feedlot puro", descripcion: "Encierre a corral con ración durante todo el ciclo." },
  mixto: { nombre: "Mixto", descripcion: "Una etapa a pastura y la terminación a corral." },
  pastura: { nombre: "Pastura pura", descripcion: "Todo el ciclo sobre pastura, sin encierre." },
};

const redondear = (n: number) => Math.round(n * 100) / 100;

/**
 * Plazo, reparto y rentabilidad salen del mismo modelo que el simulador
 * (`src/lib/simulador.ts`), que sigue el análisis económico del trabajo final:
 * feedlot de 90 días con reparto 31,78 / 68,22, mixto de 180 y pastura de 240.
 * Así la ficha, el alta, el contrato y el simulador no pueden decir cosas
 * distintas.
 */
export const CICLOS: Record<SistemaProductivo, TipoDeCiclo> = Object.fromEntries(
  (["corral", "mixto", "pastura"] as const).map((k) => {
    const m = MODELOS[k];
    const colaboradoresPct = redondear(m.parteColaboradores * 100);
    return [
      k,
      {
        ...DESCRIPCION[k],
        plazoDias: m.dias,
        colaboradoresPct,
        productorPct: redondear(100 - colaboradoresPct),
        rentabilidadAnualProductorPct: redondear(simularProductor(k, 100).anual * 100),
      },
    ];
  }),
) as Record<SistemaProductivo, TipoDeCiclo>;

/** El orden en que se muestran: del ciclo más corto al más largo. */
export const SISTEMAS_EN_ORDEN: SistemaProductivo[] = ["corral", "mixto", "pastura"];
