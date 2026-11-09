import type { Lectura } from "@/components/subir-documento";
import { simularLectura } from "@/components/subir-documento";
import type { SistemaProductivo, TipoDocumento } from "@/lib/types";

/**
 * La simulación del recorrido de un ciclo: papeles de ejemplo ya cargados, la
 * misma lectura que usa la carga real y los controles que hacen falta para que
 * Guardian lo revise. No guarda nada y no pide cuenta.
 *
 * Los controles son una función pura sobre lo leído, y no texto escrito a mano en
 * la pantalla: si cambia la lectura, cambia el resultado, igual que en el alta.
 */

/** Un lote es de 100 cabezas, el mismo número en todos los papeles de ejemplo. */
export const CABEZAS_DEL_LOTE = 100;

export interface PapelDeEjemplo {
  tipo: TipoDocumento;
  /** Cómo lo llama el productor, no el sistema. */
  nombre: string;
  archivo: string;
}

export const PAPELES_DE_EJEMPLO: PapelDeEjemplo[] = [
  { tipo: "renspa", nombre: "Constancia de RENSPA", archivo: "renspa-establecimiento.pdf" },
  { tipo: "dte", nombre: "DT-e del traslado", archivo: "dte-traslado.pdf" },
  { tipo: "listado_rfid", nombre: "Listado de caravanas", archivo: "caravanas-lote.pdf" },
  { tipo: "boleto_compraventa", nombre: "Boleto de compra-venta", archivo: "boleto-compra.pdf" },
];

export type Lecturas = Partial<Record<TipoDocumento, Lectura>>;

export function leerPapelesDeEjemplo(): Lecturas {
  const lecturas: Lecturas = {};
  for (const p of PAPELES_DE_EJEMPLO) {
    lecturas[p.tipo] = simularLectura(p.tipo, CABEZAS_DEL_LOTE);
  }
  return lecturas;
}

export interface Control {
  id: string;
  texto: string;
  ok: boolean;
}

/**
 * Lo que se cruza antes de que Guardian lo revise: que estén todos los papeles y
 * que las cabezas que dice cada uno coincidan con las del lote.
 */
export function correrControles(
  lecturas: Lecturas,
  cabezasDelLote: number = CABEZAS_DEL_LOTE,
): Control[] {
  const cabezasDe = (tipo: TipoDocumento) => lecturas[tipo]?.cabezasDetectadas;
  const cuenta = (tipo: TipoDocumento, texto: string): Control => ({
    id: `cabezas-${tipo}`,
    texto: `${texto}: ${cabezasDe(tipo) ?? "—"} cabezas, el lote tiene ${cabezasDelLote}`,
    ok: cabezasDe(tipo) === cabezasDelLote,
  });

  return [
    {
      id: "papeles",
      texto: "Están los cuatro papeles del lote",
      ok: PAPELES_DE_EJEMPLO.every((p) => lecturas[p.tipo] !== undefined),
    },
    {
      id: "renspa",
      texto: "El RENSPA se leyó del papel",
      ok: lecturas.renspa?.campos.some((c) => c.etiqueta === "RENSPA") === true,
    },
    cuenta("dte", "El DT-e ampara"),
    cuenta("listado_rfid", "El listado de caravanas trae"),
    cuenta("boleto_compraventa", "El boleto de compra-venta dice"),
  ];
}

export function listoParaRevision(controles: Control[]): boolean {
  return controles.every((c) => c.ok);
}

/** Etapas de un proyecto después de presentarlo, en el orden en que pasan. */
export const ETAPAS_DESPUES = [
  { nombre: "Presentado", detalle: "Cargaste el lote y los papeles." },
  { nombre: "En revisión", detalle: "Guardian compara los papeles con lo que declaraste." },
  { nombre: "Publicado", detalle: "Los colaboradores ven el proyecto y la documentación." },
  { nombre: "Ciclo en curso", detalle: "Pesadas, sanidad y movimientos quedan asociados al lote." },
  { nombre: "Cierre", detalle: "Se documenta la venta con el romaneo del frigorífico." },
] as const;

/** Cuántas etapas ya pasaron cuando el recorrido de ejemplo termina. */
export const ETAPAS_CUMPLIDAS = 2;

export const SISTEMAS: SistemaProductivo[] = ["corral", "mixto", "pastura"];
