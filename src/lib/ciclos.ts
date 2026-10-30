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

export const CICLOS: Record<SistemaProductivo, TipoDeCiclo> = {
  corral: {
    nombre: "Feedlot puro",
    descripcion: "Encierre a corral con ración durante todo el ciclo.",
    plazoDias: 131,
    productorPct: 32.01,
    colaboradoresPct: 67.99,
    rentabilidadAnualProductorPct: 6.59,
  },
  mixto: {
    nombre: "Mixto",
    descripcion: "Una etapa a pastura y la terminación a corral.",
    plazoDias: 180,
    productorPct: 30.55,
    colaboradoresPct: 69.45,
    rentabilidadAnualProductorPct: 7.46,
  },
  pastura: {
    nombre: "Pastura pura",
    descripcion: "Todo el ciclo sobre pastura, sin encierre.",
    plazoDias: 240,
    productorPct: 26.33,
    colaboradoresPct: 73.67,
    rentabilidadAnualProductorPct: 41.35,
  },
};

/** El orden en que se muestran: del ciclo más corto al más largo. */
export const SISTEMAS_EN_ORDEN: SistemaProductivo[] = ["corral", "mixto", "pastura"];
