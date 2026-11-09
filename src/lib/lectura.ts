import { formatNum } from "@/lib/format";
import type { TipoDocumento } from "@/lib/types";

/**
 * La lectura de un documento. Está simulada mientras no haya modelo de visión
 * detrás: devuelve los campos que una lectura real sacaría del papel.
 *
 * Vive acá y no en el componente de carga porque la usan los dos lados: el
 * navegador, para mostrar lo leído apenas se elige el archivo, y el servidor,
 * para guardar lo extraído al presentar el proyecto. Que sea la misma función es
 * lo que hace que lo guardado sea lo mismo que el productor vio.
 */
export interface Lectura {
  campos: { etiqueta: string; valor: string }[];
  cabezasDetectadas?: number;
  nota?: string;
}

export function simularLectura(tipo: TipoDocumento, cabezasDeclaradas: number): Lectura {
  switch (tipo) {
    case "renspa":
      return {
        campos: [
          { etiqueta: "RENSPA", valor: "01.036.0.01532/04" },
          { etiqueta: "Titular", valor: "TROPA AGROGANADERA S.A." },
          { etiqueta: "CUIT", valor: "30-71903430-2" },
        ],
      };
    case "dte":
      // Mientras la lectura sea simulada, el DT-e ampara exactamente las cabezas
      // declaradas: un valor fijo marcaba como error a cualquier proyecto que no
      // tuviera ese número. Cuando haya lectura real, la diferencia vuelve a
      // marcarse acá, sin tocar el resto del cruce.
      return {
        campos: [
          { etiqueta: "Nº de DT-e", valor: "032636337-5" },
          { etiqueta: "CUVE", valor: "023 2636 3375" },
          { etiqueta: "Motivo", valor: "Faena" },
          { etiqueta: "Cabezas amparadas", valor: formatNum(cabezasDeclaradas) },
        ],
        cabezasDetectadas: cabezasDeclaradas,
        nota: "El CUVE permite contrastar el documento contra SENASA.",
      };
    case "listado_rfid":
      return {
        campos: [
          { etiqueta: "Identificadores leídos", valor: formatNum(cabezasDeclaradas) },
          { etiqueta: "Duplicados internos", valor: "0" },
          { etiqueta: "Ya usados en otro proyecto", valor: "0" },
        ],
        cabezasDetectadas: cabezasDeclaradas,
      };
    case "boleto_compraventa":
      return {
        campos: [
          { etiqueta: "Vendedor", valor: "Consignataria del Centro S.A." },
          { etiqueta: "Cantidad", valor: formatNum(cabezasDeclaradas) },
          { etiqueta: "Fecha", valor: "15/09/2026" },
        ],
        cabezasDetectadas: cabezasDeclaradas,
      };
    default:
      return { campos: [{ etiqueta: "Documento", valor: "Leído" }] };
  }
}

