import type { SistemaProductivo } from "@/lib/types";

/**
 * El simulador de un ciclo: cuánto pone cada parte, qué cobra Guardian, qué se
 * lleva el fiduciario, qué se va en impuestos y qué queda.
 *
 * Los números salen del análisis económico-financiero del trabajo final
 * («Guardian - Análisis EyF», hojas «FFs - sin IIBB» de cada sistema): terneros
 * de 180 kg comprados a $6.000 el kilo, vendidos a faena a $5.600 el kilo, con
 * 1 % de mortandad. El colaborador pone la compra de la hacienda y el productor
 * todo lo demás; la venta se reparte en esa misma proporción.
 *
 * Es una estimación del modelo, no una promesa: el resultado real depende del
 * precio al vender y puede ser menor, o negativo.
 */

export const SUPUESTOS = {
  pesoEntradaKg: 180,
  precioCompraKg: 6_000,
  precioVentaKg: 5_600,
  /** Cabezas que llegan a la venta por cada una que entra (1 % de mortandad). */
  supervivencia: 0.99,
  /** Para mostrar el equivalente en dólares, como el análisis. */
  dolar: 1_500,
} as const;

/** Lo que cobra Guardian, sobre el valor de la hacienda comprada. */
export const COMISIONES = { productor: 0.035, colaborador: 0.01 } as const;

/** Lo que se lleva el fiduciario: 2 kg de carne por cabeza vendida. */
export const FIDUCIARIO_KG_POR_CABEZA = 2;

/** Impuesto a los débitos y a los créditos bancarios. */
export const IMPUESTO_CHEQUE = 0.006;

export interface ModeloCiclo {
  nombre: string;
  descripcion: string;
  dias: number;
  pesoSalidaKg: number;
  /** La parte de la venta que va a los colaboradores. El resto, al productor. */
  parteColaboradores: number;
  /** Alícuota de ganancias de cada parte, según el análisis. */
  gananciasColaborador: number;
  gananciasProductor: number;
  /** Lo que pone el productor por cabeza, en pesos. */
  costos: {
    alimentacion: number;
    sanidad: number;
    personal: number;
    mantenimiento: number;
    flete: number;
    /** El lugar en el corral o el campo que reserva para el lote. */
    capacidadComprometida: number;
  };
}

export const MODELOS: Record<SistemaProductivo, ModeloCiclo> = {
  corral: {
    nombre: "Feedlot",
    descripcion: "A corral, con ración",
    dias: 90,
    pesoSalidaKg: 320,
    parteColaboradores: 0.6822,
    gananciasColaborador: 0.3,
    gananciasProductor: 0.25,
    costos: {
      alimentacion: 310_244,
      sanidad: 7_588,
      personal: 42_000,
      mantenimiento: 14_553,
      flete: 113_006,
      capacidadComprometida: 3 * 5_300,
    },
  },
  mixto: {
    nombre: "Mixto",
    descripcion: "Pasto y terminación a corral",
    dias: 180,
    pesoSalidaKg: 340,
    parteColaboradores: 0.6945,
    gananciasColaborador: 0.3,
    gananciasProductor: 0.3,
    costos: {
      alimentacion: 260_000,
      sanidad: 8_500,
      personal: 45_000,
      mantenimiento: 15_000,
      flete: 115_000,
      capacidadComprometida: 6 * 5_300,
    },
  },
  pastura: {
    nombre: "Pastura",
    descripcion: "Todo el ciclo a pasto",
    dias: 240,
    pesoSalidaKg: 340,
    parteColaboradores: 0.7367,
    gananciasColaborador: 0.3,
    gananciasProductor: 0.3,
    costos: {
      alimentacion: 156_000,
      sanidad: 9_000,
      personal: 48_000,
      mantenimiento: 16_000,
      flete: 115_000,
      capacidadComprometida: 8 * 5_300,
    },
  },
};

export const SISTEMAS_SIMULADOR: SistemaProductivo[] = ["corral", "mixto", "pastura"];

/** Lo que cuesta comprar un ternero: es lo que pone el colaborador por cabeza. */
export const COMPRA_POR_CABEZA = SUPUESTOS.pesoEntradaKg * SUPUESTOS.precioCompraKg;

export interface Linea {
  concepto: string;
  /** Positivo entra, negativo sale. */
  monto: number;
  detalle?: string;
}

export interface Resultado {
  /** Lo que pone esta parte de su bolsillo. */
  aporte: number;
  /** Lo que recibe al vender, antes de restar nada. */
  venta: number;
  comisionGuardian: number;
  fiduciario: number;
  impuestos: number;
  /** Lo que queda: puede ser negativo. */
  ganancia: number;
  /** Lo que vuelve al final del ciclo: lo que se puso más la ganancia. */
  recibe: number;
  porCiclo: number;
  /** Anualizada con capitalización, como el análisis: (1 + r)^(365/días) − 1. */
  anual: number;
  dias: number;
  lineas: Linea[];
}

const anualizar = (r: number, dias: number) => Math.pow(1 + r, 365 / dias) - 1;
const red = (n: number) => Math.round(n);

/** Kilos que se venden, y cabezas que llegan a la venta, para un lote. */
function venta(m: ModeloCiclo, cabezas: number) {
  const vendidas = cabezas * SUPUESTOS.supervivencia;
  return { vendidas, kilos: vendidas * m.pesoSalidaKg };
}

/**
 * El colaborador: pone la compra de la hacienda y se lleva su parte de la venta.
 * `aporte` en pesos; se traduce en cuántas cabezas compra.
 */
export function simularColaborador(sistema: SistemaProductivo, aporte: number): Resultado {
  const m = MODELOS[sistema];
  const cabezas = Math.max(0, aporte) / COMPRA_POR_CABEZA;
  const { vendidas, kilos } = venta(m, cabezas);
  const s = m.parteColaboradores;

  const compra = cabezas * COMPRA_POR_CABEZA;
  const comision = compra * COMISIONES.colaborador;
  const ingreso = kilos * s * SUPUESTOS.precioVentaKg;
  const fiduciario = vendidas * FIDUCIARIO_KG_POR_CABEZA * SUPUESTOS.precioVentaKg * s;
  const debitos = (compra + comision) * IMPUESTO_CHEQUE;
  const creditos = ingreso * IMPUESTO_CHEQUE;
  const antesDeGanancias = ingreso - compra - comision - fiduciario - debitos - creditos;
  const ganancias = Math.max(0, antesDeGanancias) * m.gananciasColaborador;
  const neta = antesDeGanancias - ganancias;
  const r = compra > 0 ? neta / compra : 0;

  return {
    aporte: red(compra + comision + debitos),
    venta: red(ingreso),
    comisionGuardian: red(comision),
    fiduciario: red(fiduciario),
    impuestos: red(debitos + creditos + ganancias),
    ganancia: red(neta),
    recibe: red(compra + comision + debitos) + red(neta),
    porCiclo: r,
    anual: anualizar(r, m.dias),
    dias: m.dias,
    lineas: [
      { concepto: "Tu parte de la venta", monto: red(ingreso), detalle: `${pct(s)} de los kilos vendidos` },
      { concepto: "Compra de la hacienda", monto: -red(compra), detalle: "Lo que aportás" },
      { concepto: "Comisión de Guardian", monto: -red(comision), detalle: `${pct(COMISIONES.colaborador)} de la compra` },
      { concepto: "Fiduciario", monto: -red(fiduciario), detalle: "2 kg por cabeza vendida, en tu proporción" },
      { concepto: "Impuesto a los débitos y créditos", monto: -red(debitos + creditos), detalle: "0,6 % al pagar y al cobrar" },
      { concepto: "Impuesto a las ganancias", monto: -red(ganancias), detalle: `${pct(m.gananciasColaborador)} de lo que se gana` },
    ],
  };
}

/** El productor: pone la alimentación, el cuidado y el campo, y se lleva su parte. */
export function simularProductor(sistema: SistemaProductivo, cabezas: number): Resultado {
  const m = MODELOS[sistema];
  const n = Math.max(0, cabezas);
  const { vendidas, kilos } = venta(m, n);
  const s = 1 - m.parteColaboradores;
  const c = m.costos;

  const compra = n * COMPRA_POR_CABEZA;
  const comision = compra * COMISIONES.productor;
  const crianza = n * (c.alimentacion + c.sanidad + c.personal + c.mantenimiento);
  const flete = n * c.flete;
  const capacidad = n * c.capacidadComprometida;
  const ingreso = kilos * s * SUPUESTOS.precioVentaKg;
  const fiduciario = vendidas * FIDUCIARIO_KG_POR_CABEZA * SUPUESTOS.precioVentaKg * s;
  const debitos = (comision + crianza + flete) * IMPUESTO_CHEQUE;
  const creditos = ingreso * IMPUESTO_CHEQUE;
  const antesDeGanancias =
    ingreso - comision - crianza - flete - capacidad - fiduciario - debitos - creditos;
  const ganancias = Math.max(0, antesDeGanancias) * m.gananciasProductor;
  const neta = antesDeGanancias - ganancias;
  // Como en el análisis: lo que pone el productor, sin contar la comisión.
  const puesto = crianza + flete + capacidad;
  const r = puesto > 0 ? neta / puesto : 0;

  return {
    aporte: red(puesto + comision + debitos),
    venta: red(ingreso),
    comisionGuardian: red(comision),
    fiduciario: red(fiduciario),
    impuestos: red(debitos + creditos + ganancias),
    ganancia: red(neta),
    recibe: red(puesto + comision + debitos) + red(neta),
    porCiclo: r,
    anual: anualizar(r, m.dias),
    dias: m.dias,
    lineas: [
      { concepto: "Tu parte de la venta", monto: red(ingreso), detalle: `${pct(s)} de los kilos vendidos` },
      { concepto: "Alimentación, sanidad y personal", monto: -red(crianza), detalle: "Incluye mantenimiento del campo" },
      { concepto: "Flete y gastos de venta", monto: -red(flete) },
      { concepto: "Lugar reservado para el lote", monto: -red(capacidad), detalle: "Capacidad del campo que queda comprometida" },
      { concepto: "Comisión de Guardian", monto: -red(comision), detalle: `${pct(COMISIONES.productor)} del valor de la hacienda` },
      { concepto: "Fiduciario", monto: -red(fiduciario), detalle: "2 kg por cabeza vendida, en tu proporción" },
      { concepto: "Impuesto a los débitos y créditos", monto: -red(debitos + creditos), detalle: "0,6 % al pagar y al cobrar" },
      { concepto: "Impuesto a las ganancias", monto: -red(ganancias), detalle: `${pct(m.gananciasProductor)} de lo que se gana` },
    ],
  };
}

function pct(x: number) {
  return `${(x * 100).toLocaleString("es-AR", { maximumFractionDigits: 2 })} %`;
}
