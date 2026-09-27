import type {
  Aporte,
  Colaborador,
  Discrepancia,
  Documento,
  Garantia,
  Liquidacion,
  Productor,
  Proyecto,
  RegistroSeguimiento,
} from "@/lib/types";

/**
 * El contrato de la capa de datos.
 *
 * Existe para que haya dos implementaciones intercambiables —el seed en memoria
 * y Postgres— y una sola lista de lo que las pantallas pueden pedir. Si alguien
 * agrega una consulta a una de las dos y no a la otra, TypeScript lo dice acá y
 * no en producción.
 *
 * Todo es de lectura. Las escrituras (publicar, adherir, conciliar, desembolsar)
 * no van a vivir en este contrato: necesitan transacción, actor y asiento de
 * auditoría, y eso es otra capa.
 */

export interface FiltrosCatalogo {
  provincia?: string;
  modalidad?: string;
  montoMaximo?: number;
}

/**
 * Los tres saldos del productor. Son tres momentos distintos del mismo dinero:
 * primero un colaborador lo pone (recaudado), después Guardian aprueba que salga
 * hacia el campo (liberado) y recién al final el productor lo retira.
 */
export interface Saldos {
  /** Liberado que el productor todavía no retiró. */
  pendienteDeRetiro: number;
  liberadoHistorico: number;
  /** Recaudado cuya salida de fondos todavía no se aprobó. */
  aLiquidar: number;
  recaudadoHistorico: number;
  objetivoHistorico: number;
}

export interface GarantiaConUso {
  garantia: Garantia;
  /** Los proyectos vivos que la están usando. */
  usadaEn: Proyecto[];
  /** Cuántos proyectos más puede respaldar antes de quedar sin cupo. */
  cupoLibre: number;
  /** Si hoy se puede elegir para un proyecto nuevo. */
  disponible: boolean;
}

export interface PosicionEnProyecto {
  proyecto: Proyecto;
  aporte: Aporte;
}

/**
 * La cartera del colaborador. Los montos van separados porque son cosas
 * distintas: lo que comprometió, lo que el banco acreditó y lo que ya le
 * liquidaron. Sumarlos en un número sería un saldo de billetera, y acá no hay
 * billetera.
 */
export interface Cartera {
  posiciones: PosicionEnProyecto[];
  liquidaciones: Liquidacion[];
  comprometidoArs: number;
  acreditadoArs: number;
  pendienteDeAcreditarArs: number;
  liquidadoPagadoArs: number;
  liquidadoPendienteArs: number;
}

export interface Repositorio {
  getProyectosPublicos(filtros?: FiltrosCatalogo): Promise<Proyecto[]>;
  getProyecto(id: string): Promise<Proyecto | undefined>;
  getProyectosDeProductor(productorId: string): Promise<Proyecto[]>;
  getProyectosEnValidacion(): Promise<Proyecto[]>;

  getProductor(id: string): Promise<Productor | undefined>;
  getColaborador(id: string): Promise<Colaborador | undefined>;

  getDocumentosDeProyecto(proyectoId: string): Promise<Documento[]>;
  getDocumentosDeProductor(productorId: string): Promise<Documento[]>;
  getDocumentosVigentesDeProyecto(
    proyectoId: string,
    productorId: string,
  ): Promise<Documento[]>;
  getDocumentosPermanentes(productorId: string): Promise<Documento[]>;

  getDiscrepanciasDeDocumento(documentoId: string): Promise<Discrepancia[]>;
  getDiscrepanciasDeProyecto(proyectoId: string): Promise<Discrepancia[]>;

  getSaldosDeProductor(productorId: string): Promise<Saldos>;

  getGarantia(id: string): Promise<Garantia | undefined>;
  getGarantiasDeProductor(productorId: string): Promise<Garantia[]>;
  getGarantiasConUso(productorId: string): Promise<GarantiaConUso[]>;

  getSeguimientoDeProyecto(proyectoId: string): Promise<RegistroSeguimiento[]>;

  getAportesDeColaborador(colaboradorId: string): Promise<Aporte[]>;
  getAportesDeProyecto(proyectoId: string): Promise<Aporte[]>;
  getLiquidacionesDeColaborador(colaboradorId: string): Promise<Liquidacion[]>;
  getCarteraDeColaborador(colaboradorId: string): Promise<Cartera>;
}

/** Estados en los que un proyecto es visible para un colaborador. */
export const ESTADOS_PUBLICOS = [
  "abierto",
  "fondeado",
  "en_curso",
  "cerrado",
] as const;

/** Un proyecto vivo ocupa cupo de garantía. Uno cerrado o rechazado la libera. */
export const ESTADOS_VIVOS = [
  "en_validacion",
  "abierto",
  "fondeado",
  "en_curso",
] as const;
