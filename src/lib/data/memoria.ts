import type {
  Aporte,
  Discrepancia,
  Documento,
  EstadoProyecto,
  Garantia,
  Liquidacion,
  Proyecto,
} from "@/lib/types";
import {
  ESTADOS_PUBLICOS,
  ESTADOS_VIVOS,
  type Cartera,
  type FiltrosCatalogo,
  type GarantiaConUso,
  type PosicionEnProyecto,
  type Repositorio,
  type Saldos,
} from "./repositorio";
import {
  aportes,
  colaboradores,
  discrepancias,
  documentos,
  garantias,
  liquidaciones,
  productores,
  proyectos,
  seguimiento,
} from "./seed";

/**
 * El repositorio contra el seed en memoria.
 *
 * Es el que corre cuando no hay base configurada, y sirve para dos cosas: que la
 * app arranque sin backend —un clon recién bajado levanta y se ve— y que haya
 * contra qué comparar el repositorio de Postgres. Si las dos implementaciones
 * devuelven lo mismo con los mismos datos, la migración no cambió nada.
 */

const publicos = (p: Proyecto) =>
  (ESTADOS_PUBLICOS as readonly EstadoProyecto[]).includes(p.estado);

const vivos = (p: Proyecto) =>
  (ESTADOS_VIVOS as readonly EstadoProyecto[]).includes(p.estado);

/**
 * De la más nueva a la más vieja, y el id desempata.
 *
 * El orden de un array del seed no existe en una base, así que donde antes se
 * devolvía "como estaba escrito" ahora hay un criterio, y es el mismo de los dos
 * lados.
 */
const porSubida = (a: Documento, b: Documento) =>
  b.subidoAt.localeCompare(a.subidoAt) || a.id.localeCompare(b.id);

export const repositorioEnMemoria: Repositorio = {
  async getProyectosPublicos(filtros: FiltrosCatalogo = {}) {
    return proyectos
      .filter(publicos)
      .filter((p) => !filtros.provincia || p.provincia === filtros.provincia)
      .filter((p) => !filtros.modalidad || p.modalidad === filtros.modalidad)
      .filter((p) => !filtros.montoMaximo || p.montoObjetivoArs <= filtros.montoMaximo)
      .sort((a, b) => (b.publicadoAt ?? "").localeCompare(a.publicadoAt ?? ""));
  },

  async getProyecto(id) {
    return proyectos.find((p) => p.id === id);
  },

  async getProyectosDeProductor(productorId) {
    return proyectos
      .filter((p) => p.productorId === productorId)
      .sort((a, b) => b.creadoAt.localeCompare(a.creadoAt));
  },

  async getProyectosEnValidacion() {
    return proyectos
      .filter((p) => p.estado === "en_validacion")
      .sort((a, b) => a.creadoAt.localeCompare(b.creadoAt));
  },

  async getProductor(id) {
    return productores.find((p) => p.id === id);
  },

  async getColaborador(id) {
    return colaboradores.find((c) => c.id === id);
  },

  async getDocumentosDeProyecto(proyectoId) {
    return documentos
      .filter((d) => d.proyectoId === proyectoId)
      .sort(porSubida);
  },

  async getDocumentosDeProductor(productorId) {
    return documentos.filter((d) => d.productorId === productorId).sort(porSubida);
  },

  /**
   * La que respalda a un proyecto: la del ciclo más la permanente del
   * establecimiento. El RENSPA no se vuelve a pedir en cada publicación —es del
   * establecimiento, no del lote— y sin embargo cuenta como requisito cumplido.
   */
  async getDocumentosVigentesDeProyecto(proyectoId, productorId) {
    return documentos
      .filter(
        (d) =>
          d.proyectoId === proyectoId ||
          (d.proyectoId === null && d.productorId === productorId),
      )
      .sort(porSubida);
  },

  async getDocumentosPermanentes(productorId) {
    return documentos
      .filter((d) => d.productorId === productorId && d.proyectoId === null)
      .sort(porSubida);
  },

  async getDiscrepanciasDeDocumento(documentoId) {
    return discrepancias
      .filter((d) => d.documentoId === documentoId)
      .sort((a, b) => a.id.localeCompare(b.id));
  },

  async getDiscrepanciasDeProyecto(proyectoId) {
    const ids = documentos.filter((d) => d.proyectoId === proyectoId).map((d) => d.id);
    return discrepancias
      .filter((d) => ids.includes(d.documentoId))
      .sort((a, b) => a.id.localeCompare(b.id));
  },

  async getSaldosDeProductor(productorId): Promise<Saldos> {
    const suyos = proyectos.filter(
      (p) =>
        p.productorId === productorId &&
        p.estado !== "borrador" &&
        p.estado !== "rechazado",
    );
    const sumar = (f: (p: Proyecto) => number) => suyos.reduce((acc, p) => acc + f(p), 0);

    const liberadoHistorico = sumar((p) => p.montoLiberadoArs);
    const recaudadoHistorico = sumar((p) => p.montoRecaudadoArs);

    return {
      pendienteDeRetiro: liberadoHistorico - sumar((p) => p.montoRetiradoArs),
      liberadoHistorico,
      aLiquidar: recaudadoHistorico - liberadoHistorico,
      recaudadoHistorico,
      objetivoHistorico: sumar((p) => p.montoObjetivoArs),
    };
  },

  async getGarantia(id) {
    return garantias.find((g) => g.id === id);
  },

  async getGarantiasDeProductor(productorId) {
    return garantias.filter((g) => g.productorId === productorId);
  },

  /**
   * El cupo se cuenta sobre los proyectos vivos y no sobre todos: una hipoteca
   * que respaldó tres ciclos ya liquidados está libre, aunque figure en el
   * historial de los tres.
   */
  async getGarantiasConUso(productorId): Promise<GarantiaConUso[]> {
    return garantias
      .filter((g: Garantia) => g.productorId === productorId)
      .map((garantia) => {
        const usadaEn = proyectos
          .filter((p) => p.garantiaId === garantia.id && vivos(p))
          .sort(
            (a, b) => b.creadoAt.localeCompare(a.creadoAt) || a.id.localeCompare(b.id),
          );
        const cupoLibre = Math.max(0, garantia.cupoProyectos - usadaEn.length);
        return {
          garantia,
          usadaEn,
          cupoLibre,
          disponible: cupoLibre > 0 && garantia.estado !== "vencida",
        };
      });
  },

  /**
   * De la más vieja a la más nueva. El orden importa: la ganancia diaria de un
   * tramo se calcula contra el registro anterior.
   */
  async getSeguimientoDeProyecto(proyectoId) {
    return seguimiento
      .filter((r) => r.proyectoId === proyectoId)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  },

  async getAportesDeColaborador(colaboradorId) {
    return aportes
      .filter((a) => a.colaboradorId === colaboradorId)
      .sort((a, b) => b.adhesionAt.localeCompare(a.adhesionAt));
  },

  async getAportesDeProyecto(proyectoId) {
    return aportes
      .filter((a) => a.proyectoId === proyectoId)
      .sort((a, b) => a.id.localeCompare(b.id));
  },

  async getLiquidacionesDeColaborador(colaboradorId) {
    return liquidaciones
      .filter((l) => l.colaboradorId === colaboradorId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  },

  async getCarteraDeColaborador(colaboradorId): Promise<Cartera> {
    const suyos: Aporte[] = await this.getAportesDeColaborador(colaboradorId);
    const posiciones: PosicionEnProyecto[] = [];

    for (const aporte of suyos) {
      const proyecto = proyectos.find((p) => p.id === aporte.proyectoId);
      if (proyecto) posiciones.push({ proyecto, aporte });
    }

    const liquidacionesDelColaborador: Liquidacion[] =
      await this.getLiquidacionesDeColaborador(colaboradorId);

    return {
      posiciones,
      liquidaciones: liquidacionesDelColaborador,
      comprometidoArs: suyos.reduce((a, x) => a + x.montoComprometidoArs, 0),
      acreditadoArs: suyos.reduce((a, x) => a + x.montoAcreditadoArs, 0),
      pendienteDeAcreditarArs: suyos.reduce(
        (a, x) => a + Math.max(0, x.montoComprometidoArs - x.montoAcreditadoArs),
        0,
      ),
      liquidadoPagadoArs: liquidacionesDelColaborador
        .filter((l) => l.estado === "pagada")
        .reduce((a, l) => a + l.capitalArs + l.resultadoArs, 0),
      liquidadoPendienteArs: liquidacionesDelColaborador
        .filter((l) => l.estado !== "pagada")
        .reduce((a, l) => a + l.capitalArs + l.resultadoArs, 0),
    };
  },
};

/** Tipos que el resto del módulo vuelve a exportar. */
export type { Discrepancia, Documento, Liquidacion };
