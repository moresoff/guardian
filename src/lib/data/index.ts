import { consultar, hayBaseConfigurada } from "@/lib/db/conexion";
import { repositorioEnMemoria } from "./memoria";
import { crearRepositorioPostgres } from "./postgres";
import type { Repositorio } from "./repositorio";

/**
 * Capa de acceso a datos.
 *
 * Todo lo que las pantallas saben de los datos pasa por acá. Hay dos
 * implementaciones detrás de la misma interfaz y se elige por configuración:
 *
 *   - Con `DATABASE_URL`, va contra Postgres.
 *   - Sin esa variable, contra el seed en memoria.
 *
 * El seed no es un resto que haya que sacar: es lo que hace que un clon recién
 * bajado levante y se vea sin pedirle a nadie una base. Las dos implementaciones
 * cumplen el mismo contrato y hay una prueba que compara sus respuestas.
 */

const repo: Repositorio = hayBaseConfigurada()
  ? crearRepositorioPostgres(consultar)
  : repositorioEnMemoria;

/**
 * Productor con el que se entra a la demo. Cuando exista autenticación, sale de
 * la sesión.
 */
export const PRODUCTOR_DEMO = "prod-1";

/**
 * El colaborador con la sesión iniciada, igual que `PRODUCTOR_DEMO`. Es la misma
 * cuenta: en Guardian un productor también puede poner capital, así que esto es
 * una vista y no otro usuario.
 */
export const COLABORADOR_DEMO = "col-1";

export type {
  Cartera,
  FiltrosCatalogo,
  GarantiaConUso,
  PosicionEnProyecto,
  Repositorio,
  Saldos,
} from "./repositorio";

/*
 * Las consultas se reexportan una por una y no con un volcado del repositorio:
 * así el que abre este archivo ve la lista completa de lo que la aplicación le
 * puede pedir a los datos.
 */

export const getProyectosPublicos: Repositorio["getProyectosPublicos"] = (f) =>
  repo.getProyectosPublicos(f);

export const getProyecto: Repositorio["getProyecto"] = (id) => repo.getProyecto(id);

export const getProyectosDeProductor: Repositorio["getProyectosDeProductor"] = (id) =>
  repo.getProyectosDeProductor(id);

export const getProyectosEnValidacion: Repositorio["getProyectosEnValidacion"] = () =>
  repo.getProyectosEnValidacion();

export const getProductor: Repositorio["getProductor"] = (id) => repo.getProductor(id);

export const getColaborador: Repositorio["getColaborador"] = (id) =>
  repo.getColaborador(id);

export const getDocumentosDeProyecto: Repositorio["getDocumentosDeProyecto"] = (id) =>
  repo.getDocumentosDeProyecto(id);

export const getDocumentosDeProductor: Repositorio["getDocumentosDeProductor"] = (id) =>
  repo.getDocumentosDeProductor(id);

export const getDocumentosVigentesDeProyecto: Repositorio["getDocumentosVigentesDeProyecto"] =
  (proyectoId, productorId) =>
    repo.getDocumentosVigentesDeProyecto(proyectoId, productorId);

export const getDocumentosPermanentes: Repositorio["getDocumentosPermanentes"] = (id) =>
  repo.getDocumentosPermanentes(id);

export const getDiscrepanciasDeDocumento: Repositorio["getDiscrepanciasDeDocumento"] = (
  id,
) => repo.getDiscrepanciasDeDocumento(id);

export const getDiscrepanciasDeProyecto: Repositorio["getDiscrepanciasDeProyecto"] = (
  id,
) => repo.getDiscrepanciasDeProyecto(id);

export const getSaldosDeProductor: Repositorio["getSaldosDeProductor"] = (id) =>
  repo.getSaldosDeProductor(id);

export const getGarantia: Repositorio["getGarantia"] = (id) => repo.getGarantia(id);

export const getGarantiasDeProductor: Repositorio["getGarantiasDeProductor"] = (id) =>
  repo.getGarantiasDeProductor(id);

export const getGarantiasConUso: Repositorio["getGarantiasConUso"] = (id) =>
  repo.getGarantiasConUso(id);

export const getSeguimientoDeProyecto: Repositorio["getSeguimientoDeProyecto"] = (id) =>
  repo.getSeguimientoDeProyecto(id);

export const getAportesDeColaborador: Repositorio["getAportesDeColaborador"] = (id) =>
  repo.getAportesDeColaborador(id);

export const getAportesDeProyecto: Repositorio["getAportesDeProyecto"] = (id) =>
  repo.getAportesDeProyecto(id);

export const getLiquidacionesDeColaborador: Repositorio["getLiquidacionesDeColaborador"] =
  (id) => repo.getLiquidacionesDeColaborador(id);

export const getCarteraDeColaborador: Repositorio["getCarteraDeColaborador"] = (id) =>
  repo.getCarteraDeColaborador(id);
