import type { Proyecto } from "@/lib/types";

/**
 * Lo que cubre un proyecto, en palabras sueltas para una tarjeta. El texto
 * completo vive en `destinoDetalle` y se lee en la ficha; acá se extraen los
 * rubros para que se vean de un vistazo en vez de leerse en un párrafo.
 */
const RUBROS: [RegExp, string][] = [
  [/raci[oó]n|alimento|insumos/i, "Ración"],
  [/suplementaci[oó]n/i, "Suplementación"],
  [/sanidad|sanitario/i, "Sanidad"],
  [/sales minerales/i, "Sales minerales"],
  [/mano de obra/i, "Mano de obra"],
  [/flete/i, "Flete a faena"],
];

export function queCubre(p: Pick<Proyecto, "destinoDetalle" | "tipoPosesion">): string[] {
  const rubros = RUBROS.filter(([re]) => re.test(p.destinoDetalle)).map(([, n]) => n);
  if (/compra de/i.test(p.destinoDetalle)) rubros.unshift("Compra de hacienda");
  return rubros;
}

/** De dónde sale la hacienda, para que se lea sin abrir la ficha. */
export function situacionDelLote(tipoPosesion: Proyecto["tipoPosesion"]): string {
  switch (tipoPosesion) {
    case "existencia_comprobada":
      return "La hacienda ya está en el establecimiento";
    case "hibrido":
      return "Parte de la hacienda ya está; el resto se compra";
    default:
      return "La hacienda se compra con el proyecto";
  }
}

/** "Engorde a corral — 180 novillitos" → ciclo y lote por separado. */
export function partesDelTitulo(titulo: string): { principal: string; lote: string | null } {
  const [principal, ...resto] = titulo.split(" — ");
  return { principal, lote: resto.length ? resto.join(" — ") : null };
}
