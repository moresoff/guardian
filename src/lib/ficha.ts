import type { Proyecto } from "@/lib/types";

/**
 * La ficha técnica del proyecto: los datos que el productor declara y contra los
 * que después se contrasta la documentación. Está acá, y no dentro de una
 * pantalla, porque la lista de proyectos necesita saber cuántos huecos quedan y
 * la ficha necesita saber cuáles son. Un cero o una cadena vacía no son un dato
 * cargado: son el hueco.
 *
 * Es también la única lista: el alta de un proyecto nuevo pide exactamente estos
 * campos, con estas etiquetas y estas opciones. Antes cada pantalla tenía la
 * suya y dos proyectos terminaban declarando cosas distintas —la garantía, sin
 * ir más lejos, ofrecía cuatro opciones en el alta y otras cuatro en la ficha—,
 * y comparar proyectos entre sí dejaba de tener sentido.
 */
export type ClaveFicha =
  | "cabezas"
  | "categoria"
  | "raza"
  | "pesoEntradaKg"
  | "pesoSalidaObjetivoKg"
  | "destinoDetalle"
  | "montoObjetivoArs"
  | "plazoDias"
  | "plazoCobroDias"
  | "rendimientoEsperadoPct"
  | "garantiaId";

export interface CampoFicha {
  clave: ClaveFicha;
  etiqueta: string;
  grupo: "El lote" | "Condiciones";
  tipo: "numero" | "texto" | "parrafo" | "moneda" | "porcentaje" | "garantia";
  sufijo?: string;
  ayuda?: string;
  opciones?: string[];
}

export const CAMPOS_FICHA: CampoFicha[] = [
  {
    clave: "cabezas",
    etiqueta: "Cabezas",
    grupo: "El lote",
    tipo: "numero",
    ayuda: "Tiene que coincidir con lo que amparen los documentos que subas.",
  },
  {
    clave: "raza",
    etiqueta: "Raza",
    grupo: "El lote",
    tipo: "texto",
    opciones: [
      "Angus",
      "Angus colorado",
      "Hereford",
      "Braford",
      "Brangus",
      "Cruza británica",
      "Cruza índica",
      "Holando",
    ],
  },
  {
    clave: "categoria",
    etiqueta: "Categoría",
    grupo: "El lote",
    tipo: "texto",
    opciones: [
      "Ternero",
      "Ternera",
      "Novillito",
      "Novillo",
      "Vaquillona",
      "Vaquillona / Novillito",
      "Vaca",
    ],
  },
  {
    clave: "pesoEntradaKg",
    etiqueta: "Peso de entrada",
    grupo: "El lote",
    tipo: "numero",
    sufijo: "kg",
    ayuda: "Promedio por cabeza al arrancar el ciclo.",
  },
  {
    clave: "pesoSalidaObjetivoKg",
    etiqueta: "Peso objetivo",
    grupo: "El lote",
    tipo: "numero",
    sufijo: "kg",
    ayuda: "Promedio por cabeza al que esperás llegar.",
  },
  {
    clave: "destinoDetalle",
    etiqueta: "En qué se gasta el capital",
    grupo: "Condiciones",
    tipo: "parrafo",
    ayuda:
      "Con tus palabras: ración, sanidad, mano de obra, compra de animales. El colaborador lee esto antes de poner el dinero.",
  },
  {
    clave: "montoObjetivoArs",
    etiqueta: "Capital que necesitás",
    grupo: "Condiciones",
    tipo: "moneda",
    sufijo: "en pesos",
  },
  {
    clave: "plazoDias",
    etiqueta: "Plazo del ciclo",
    grupo: "Condiciones",
    tipo: "numero",
    sufijo: "días",
  },
  {
    clave: "plazoCobroDias",
    etiqueta: "Plazo de cobro",
    grupo: "Condiciones",
    tipo: "numero",
    sufijo: "días",
    ayuda: "Desde la venta hasta que el dinero entra. No es el plazo del ciclo.",
  },
  {
    clave: "rendimientoEsperadoPct",
    etiqueta: "Rendimiento esperado",
    grupo: "Condiciones",
    tipo: "porcentaje",
    sufijo: "%",
    ayuda: "Lo que esperás devolverle al colaborador sobre el capital puesto.",
  },
  {
    clave: "garantiaId",
    etiqueta: "Garantía",
    grupo: "Condiciones",
    tipo: "garantia",
    ayuda:
      "Se elige entre las garantías que tengas configuradas en Mi documentación. Las que ya no tienen cupo figuran en gris.",
  },
];

/**
 * Las garantías que el productor puede elegir, ya resueltas por quien dibuja el
 * formulario. La lista no puede vivir acá porque cambia por productor y por cupo,
 * a diferencia del resto de las opciones, que son las mismas para todos.
 */
export interface OpcionGarantia {
  id: string;
  label: string;
  disponible: boolean;
}

/** Un valor cargado es un número mayor que cero o un texto que dice algo. */
export function estaCompleto(valor: number | string | null): boolean {
  if (valor === null) return false;
  return typeof valor === "number" ? valor > 0 : valor.trim() !== "";
}

export function camposIncompletos(p: Proyecto): CampoFicha[] {
  return CAMPOS_FICHA.filter((c) => !estaCompleto(p[c.clave]));
}
