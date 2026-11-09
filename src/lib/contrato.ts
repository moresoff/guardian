import { formatArs, formatNum, formatPct } from "@/lib/format";
import { COMISIONES } from "@/lib/simulador";
import type { Garantia, Productor, Proyecto } from "@/lib/types";

/**
 * El contrato que firma cada parte, armado desde los datos del proyecto.
 *
 * Lo usan la pantalla, para mostrarlo, y el servidor, para calcular la huella
 * de lo firmado. El servidor lo vuelve a armar con sus propios datos: no firma
 * un texto que mande el navegador.
 *
 * Es un resumen en palabras simples de lo que dice el contrato. El texto legal
 * completo lo redacta el estudio jurídico; esta versión es de demostración.
 */

export const VERSION_ADHESION = "Contrato de adhesión v4 — 2026-11-09";
export const VERSION_FIDEICOMISO = "Contrato de fideicomiso v1 — 2026-11-09";

/** El fiduciario de las series. Dato de demostración: se reemplaza por el real. */
export const FIDUCIARIO = {
  nombre: "Fiduciaria Independiente S.A.",
  descripcion:
    "Una empresa independiente de Guardian que administra el dinero y los animales de cada proyecto, separados de los suyos y de los de Guardian.",
  hace: [
    "Abre una cuenta bancaria propia para cada proyecto. El dinero entra y sale solo por ahí.",
    "Paga la compra de la hacienda y los gastos aprobados, contra factura.",
    "Rinde cuentas cada tres meses y al cierre del ciclo.",
    "Al vender el lote, reparte el resultado entre las partes, según el contrato.",
  ],
  noHace: "No garantiza el resultado: depende de la venta del lote.",
  cobra: "2 kg de carne por cabeza vendida, repartidos entre las partes.",
} as const;

export interface Clausula {
  titulo: string;
  texto: string;
}

export interface Contrato {
  version: string;
  titulo: string;
  fiduciario: string;
  clausulas: Clausula[];
}

const fiduciarioDe = (p: Proyecto) =>
  p.fideicomiso?.fiduciario.split(",")[0]?.trim() || FIDUCIARIO.nombre;

const reparto = (p: Proyecto) => {
  const pr = p.condiciones.participacion;
  return pr && pr.colaboradoresPct !== null && pr.productorPct !== null
    ? { colaboradores: pr.colaboradoresPct, productor: pr.productorPct }
    : null;
};

const plazo = (p: Proyecto) =>
  `El ciclo dura unos ${formatNum(p.plazoDias)} días.${
    p.plazoCobroDias ? ` Después de vender, el frigorífico paga en unos ${p.plazoCobroDias} días.` : ""
  }`;

const mortandad = (p: Proyecto) =>
  p.fideicomiso?.mortandad ??
  "Hasta el 2 % del lote la absorbe el proyecto; por encima de ese piso responde el productor, salvo caso fortuito acreditado.";

const lote = (p: Proyecto) =>
  `${formatNum(p.cabezas)} ${p.categoria.toLowerCase()}s ${p.raza}, de ${p.pesoEntradaKg} kg de entrada`;

/** El contrato de adhesión del colaborador, por el monto que aporta. */
export function contratoDeAdhesion(p: Proyecto, productor: Productor, monto: number): Contrato {
  const r = reparto(p);
  const fiduciario = fiduciarioDe(p);
  return {
    version: VERSION_ADHESION,
    titulo: `Adhesión a «${p.titulo}»`,
    fiduciario,
    clausulas: [
      {
        titulo: "Quiénes participan",
        texto: `Vos, que aportás dinero; ${productor.razonSocial}, que pone la hacienda, el campo y el trabajo; y ${fiduciario}, que administra el proyecto.`,
      },
      {
        titulo: "Qué aportás",
        texto: `${formatArs(monto)}, que se usan para el lote: ${lote(p)}.`,
      },
      { titulo: "Para qué", texto: p.fideicomiso?.objeto ?? "Engordar el lote, venderlo a faena y repartir lo que se obtenga." },
      {
        titulo: "Cómo se reparte",
        texto: r
          ? `De la venta, el ${formatPct(r.colaboradores)} es de los colaboradores, en proporción a lo que aportó cada uno, y el ${formatPct(r.productor)} del productor.`
          : "El reparto todavía no está pactado: sin eso no se puede participar.",
      },
      { titulo: "Si se mueren animales", texto: mortandad(p) },
      { titulo: "Cuánto dura", texto: plazo(p) },
      {
        titulo: "Lo que se cobra",
        texto: `Guardian cobra el ${formatPct(COMISIONES.colaborador * 100)} de tu aporte, una sola vez. El fiduciario cobra ${FIDUCIARIO.cobra.toLowerCase()}`,
      },
      {
        titulo: "El riesgo",
        texto:
          "Lo que recibís depende del precio al vender el lote. Puede ser menor al esperado, y puede ser una pérdida. Ni Guardian ni otro proyecto responden por este.",
      },
      {
        titulo: "Cómo te enterás",
        texto: `${p.fideicomiso?.rendicionCuentas ?? "Rendición trimestral y al cierre del ciclo"}. Ves las pesadas del lote en tu cartera.`,
      },
      {
        titulo: "Dónde cobrás",
        texto: "Al cierre, en el CBU a tu nombre que cargaste al validar tu identidad.",
      },
    ],
  };
}

/** El contrato del fideicomiso que firma el productor al presentar su proyecto. */
export function contratoDeFideicomiso(
  p: Proyecto,
  productor: Productor,
  garantia: Garantia | undefined,
): Contrato {
  const r = reparto(p);
  const fiduciario = fiduciarioDe(p);
  return {
    version: VERSION_FIDEICOMISO,
    titulo: `Fideicomiso de «${p.titulo}»`,
    fiduciario,
    clausulas: [
      {
        titulo: "Quiénes participan",
        texto: `${productor.razonSocial}, que pone la hacienda, el campo y el trabajo; los colaboradores, que ponen el dinero; y ${fiduciario}, que administra el proyecto.`,
      },
      {
        titulo: "Qué ponés",
        texto: `El cuidado y la alimentación del lote (${lote(p)}) en ${productor.establecimiento}${
          productor.renspa ? `, RENSPA ${productor.renspa}` : ""
        }.`,
      },
      {
        titulo: "Qué ponen los colaboradores",
        texto: `Hasta ${formatArs(p.montoObjetivoArs)}. El fiduciario lo paga directo a quien corresponda, contra factura.`,
      },
      {
        titulo: "Cómo se reparte",
        texto: r
          ? `De la venta, el ${formatPct(r.productor)} es tuyo y el ${formatPct(r.colaboradores)} de los colaboradores.`
          : "El reparto se pacta antes de publicar.",
      },
      { titulo: "Si se mueren animales", texto: mortandad(p) },
      { titulo: "Cuánto dura", texto: plazo(p) },
      {
        titulo: "Lo que te toca hacer",
        texto:
          "Cargar las pesadas del lote, avisar dentro de las 48 horas cualquier problema sanitario y rendir cada gasto con su factura.",
      },
      {
        titulo: "Garantía",
        texto: garantia
          ? `${garantia.identificacion}. Se ejecuta solo si no cumplís el contrato.`
          : "Este proyecto no tiene garantía constituida: el reclamo por incumplimiento es contra vos.",
      },
      {
        titulo: "Lo que se cobra",
        texto: `Guardian cobra el ${formatPct(COMISIONES.productor * 100)} del valor de la hacienda, una sola vez. El fiduciario cobra ${FIDUCIARIO.cobra.toLowerCase()}`,
      },
      {
        titulo: "El riesgo",
        texto: "El resultado depende del precio al vender. Puede ser menor al esperado.",
      },
    ],
  };
}

/** El texto canónico, para calcular la huella de lo firmado. */
export const textoParaFirmar = (c: Contrato) =>
  [c.version, c.titulo, c.fiduciario, ...c.clausulas.map((x) => `${x.titulo}: ${x.texto}`)].join("\n");
