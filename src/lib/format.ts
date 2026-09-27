import type {
  CasoContingencia,
  Comision,
  DestinoFondos,
  Modalidad,
  EstadoGarantia,
  TipoGarantia,
  EstadoProyecto,
  SistemaProductivo,
  TipoDocumento,
  TipoPosesion,
} from "@/lib/types";

/**
 * Un solo signo en toda la plataforma: el peso. Los montos de un ciclo tienen
 * ocho dígitos, así que el formato no lleva decimales y las tarjetas usan la
 * versión compacta.
 */
const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const numero = new Intl.NumberFormat("es-AR");

export const formatArs = (v: number) => pesos.format(v);
export const formatNum = (v: number) => numero.format(v);
export const formatPct = (v: number) =>
  `${numero.format(Number(v.toFixed(2)))} %`;

/**
 * Kilos con decimales, para la ganancia diaria de un lote. Va con coma y no con
 * punto: escrito `1.357 kg` acá se lee mil trescientos cincuenta y siete.
 */
export const formatKg = (v: number, decimales = 2) =>
  new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(v);

/**
 * Un ciclo entero son ocho dígitos, y ocho dígitos repetidos en una grilla de
 * tarjetas no se leen: ahí va la versión abreviada. Donde el número importa —la
 * ficha, la cartera, una liquidación— se escribe entero.
 */
export function formatArsCompacto(v: number) {
  if (v >= 1_000_000) {
    return `$ ${numero.format(Number((v / 1_000_000).toFixed(1)))} M`;
  }
  return pesos.format(v);
}

export function formatFecha(iso: string) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

export const ESTADO_LABEL: Record<EstadoProyecto, string> = {
  borrador: "Borrador",
  en_validacion: "En validación",
  abierto: "Abierto a participación",
  fondeado: "Fondeado",
  en_curso: "Ciclo en curso",
  cerrado: "Cerrado",
  rechazado: "Rechazado",
};

/**
 * El modelo guarda el código ISO porque es lo que va a viajar al backend y a un
 * extracto bancario; la pantalla no lo escribe así.
 */
export const MONEDA_LABEL: Record<"ARS", string> = {
  ARS: "Pesos",
};

export const MODALIDAD_LABEL: Record<Modalidad, string> = {
  compra_engorde: "Compra y engorde",
  capital_trabajo: "Capital de trabajo",
};

/**
 * Qué financia cada modalidad. Son dos y no tres: un proyecto que compra
 * hacienda y además paga la ración sigue siendo compra y engorde, porque lo que
 * define la modalidad es si el capital adquiere el animal.
 *
 * Lo que un gasto tenga de fijo o de variable depende del contrato y del rubro,
 * no de la modalidad, así que no se afirma acá.
 */
export const MODALIDAD_DESCRIPCION: Record<Modalidad, string> = {
  compra_engorde:
    "El capital compra la hacienda y la termina, y puede pagar los gastos de ese ciclo. Los fondos salen contra la compra y después contra la existencia del lote.",
  capital_trabajo:
    "El capital no compra ni una cabeza: paga los gastos del ciclo sobre un lote que ya es del productor, contra el presupuesto aprobado.",
};

/** Qué recibe el colaborador en cada modalidad. No es lo mismo y no se mezcla. */
export const MODALIDAD_RETORNO: Record<Modalidad, string> = {
  compra_engorde:
    "Participación en el resultado efectivo de la venta. Si el ciclo va mal, el resultado puede ser menor al proyectado o negativo.",
  capital_trabajo:
    "Capital más la tasa pactada en el contrato. No depende del precio de la hacienda: el riesgo es que el productor no cumpla.",
};

/** El rótulo de una modalidad que todavía no se determinó. */
export const modalidadLabel = (m: Modalidad | null) =>
  m === null ? "Modalidad sin determinar" : MODALIDAD_LABEL[m];

/** Solo para trazabilidad: cómo estaba clasificado un proyecto antes. */
export const DESTINO_LABEL: Record<DestinoFondos, string> = {
  capital_trabajo: "Capital de trabajo",
  ciclo_engorde: "Ciclo de engorde",
  mixto: "Las dos cosas",
};

export const GARANTIA_LABEL: Record<TipoGarantia, string> = {
  hipoteca: "Hipoteca",
  prenda_rodeo: "Prenda sobre el rodeo",
  aval_establecimiento: "Aval del establecimiento",
  cesion_derechos: "Cesión de derechos de cobro",
  fianza_personal: "Fianza personal",
};

export const GARANTIA_DESCRIPCION: Record<TipoGarantia, string> = {
  hipoteca:
    "Un inmueble del productor queda gravado a favor del fideicomiso. Es la garantía más fuerte y la que más tarda en ejecutarse.",
  prenda_rodeo:
    "Se prendan cabezas identificadas por caravana. Sigue al animal, así que se pierde con el animal.",
  aval_establecimiento:
    "Otra sociedad del grupo responde con su patrimonio si el productor no cumple.",
  cesion_derechos:
    "Lo que el frigorífico le va a pagar por el lote se cobra directo en el fideicomiso, antes de pasar por el productor.",
  fianza_personal:
    "Una persona responde con sus bienes. Vale lo que valga el patrimonio de esa persona.",
};

export const ESTADO_GARANTIA_LABEL: Record<EstadoGarantia, string> = {
  vigente: "Vigente",
  sin_verificar: "Sin verificar",
  vencida: "Vencida",
};

export const POSESION_LABEL: Record<TipoPosesion, string> = {
  promesa_inversion: "Hacienda por comprar",
  existencia_comprobada: "Existencia comprobada",
  hibrido: "Híbrido",
};

export const POSESION_DESCRIPCION: Record<TipoPosesion, string> = {
  promesa_inversion:
    "El productor todavía debe comprar la hacienda. Los fondos se liberarían por tramos contra el boleto de compra-venta y, después, contra el comprobante de los animales ya adquiridos.",
  existencia_comprobada:
    "El productor ya tiene los animales. Se valida la existencia del lote; tenerlo no habilita entregar todo el capital, que sale por rubro y período.",
  hibrido:
    "Parte del lote ya existe y parte se comprará. Combina las dos formas de liberación en la proporción declarada.",
};

export const SISTEMA_LABEL: Record<SistemaProductivo, string> = {
  corral: "Corral",
  pastura: "Pastura",
  mixto: "Mixto",
};

export const DOCUMENTO_LABEL: Record<TipoDocumento, string> = {
  renspa: "Constancia de RENSPA",
  dte: "DT-e",
  romaneo: "Romaneo de playa",
  boleto_compraventa: "Boleto de compra-venta",
  listado_rfid: "Listado de caravanas RFID",
  poliza_seguro: "Póliza de seguro",
  otro: "Otro",
};

/**
 * Qué documentación es obligatoria depende del estado de posesión de los animales,
 * no del destino de los fondos. Es la regla de negocio central de la publicación.
 */
export function documentosRequeridos(posesion: TipoPosesion): TipoDocumento[] {
  const base: TipoDocumento[] = ["renspa"];
  switch (posesion) {
    case "promesa_inversion":
      return [...base, "boleto_compraventa"];
    case "existencia_comprobada":
      return [...base, "dte", "listado_rfid"];
    case "hibrido":
      return [...base, "boleto_compraventa", "dte", "listado_rfid"];
  }
}

export const porcentajeRecaudado = (recaudado: number, objetivo: number) =>
  objetivo === 0 ? 0 : Math.min(100, Math.round((recaudado / objetivo) * 100));

export const CONTINGENCIA_LABEL: Record<CasoContingencia, string> = {
  mortandad: "Si se muere un animal",
  sanitaria: "Si hay un problema sanitario",
  demora: "Si el ciclo se atrasa",
  incumplimiento: "Si el productor no cumple",
  precio: "Si el precio cae",
};

export const A_CARGO_LABEL: Record<Comision["aCargoDe"], string> = {
  colaborador: "La paga el colaborador",
  productor: "La paga el productor",
  fideicomiso: "Sale del fideicomiso",
};
