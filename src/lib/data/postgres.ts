import type {
  Aporte,
  Colaborador,
  Discrepancia,
  Documento,
  Fideicomiso,
  Garantia,
  Liquidacion,
  MovimientoBancario,
  Productor,
  Proyecto,
  RegistroSeguimiento,
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

/**
 * El repositorio contra Postgres.
 *
 * No depende de un cliente concreto: recibe una función que ejecuta SQL con
 * parámetros. En producción eso es `pg` contra Supabase; en las pruebas es un
 * Postgres en proceso. La misma consulta corre en los dos lados, que es lo que
 * hace que probar el repositorio signifique algo.
 *
 * Dos cuidados que el resto del código da por sentados:
 *
 *   - `numeric` vuelve como string, no como número. Si no se convierte, un
 *     importe se concatena en vez de sumarse y nadie se entera hasta ver un
 *     total absurdo.
 *   - `date` vuelve como Date. El dominio usa "AAAA-MM-DD" en texto porque se
 *     compara y se ordena sin instanciar nada.
 */

/** Ejecuta SQL con parámetros posicionales y devuelve las filas. */
export type Consultar = <T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
) => Promise<T[]>;

type Fila = Record<string, unknown>;

/**
 * `($1, $2, $3)` para usar con `in`, más sus parámetros.
 *
 * Se arma así y no con `= any($1)` pasando un array de JavaScript porque eso
 * depende de que el driver lo convierta a un array de Postgres, y no todos lo
 * hacen. Con marcadores numerados la consulta es la misma en cualquiera, y sigue
 * siendo parametrizada: los valores nunca se pegan dentro del SQL.
 */
function lista(valores: readonly unknown[], desde = 1) {
  return {
    sql: `(${valores.map((_, i) => `$${desde + i}`).join(", ")})`,
    params: [...valores],
  };
}

const num = (v: unknown): number => (v === null || v === undefined ? 0 : Number(v));

const numOpc = (v: unknown): number | null =>
  v === null || v === undefined ? null : Number(v);

/** Una fecha del dominio: "AAAA-MM-DD". */
function fecha(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) {
    // En UTC: una fecha sin hora no tiene por qué correrse un día según el huso
    // del servidor.
    return v.toISOString().slice(0, 10);
  }
  return String(v).slice(0, 10);
}

const fechaOpc = (v: unknown): string | undefined =>
  v === null || v === undefined ? undefined : fecha(v);

const texto = (v: unknown): string => (v === null || v === undefined ? "" : String(v));

const textoOpc = (v: unknown): string | undefined =>
  v === null || v === undefined ? undefined : String(v);

/* ------------------------------------------------------------------ */
/* Armado de proyectos                                                 */
/* ------------------------------------------------------------------ */

const COLUMNAS_PROYECTO = `
  id, productor_id, titulo, modalidad, motivo_revision_modalidad,
  destino_fondos_previo, destino_detalle,
  tipo_posesion, sistema_productivo, cabezas, categoria, raza, peso_entrada_kg,
  peso_salida_objetivo_kg, monto_objetivo_ars, monto_recaudado_ars,
  monto_liberado_ars, monto_retirado_ars, monto_minimo_inicio_ars, plazo_dias,
  plazo_cobro_dias, rendimiento_esperado_pct, garantia_id, tiene_seguro, estado,
  provincia, creado_at, publicado_at, resultado_dte_salida, resultado_cabezas_faena,
  resultado_kilos_vivos, resultado_kg_carne, resultado_rendimiento_pct, resultado_fecha
`;

/**
 * Convierte filas de `proyectos` en proyectos del dominio, con sus hijos.
 *
 * Los hijos se traen en una consulta por tabla y no una por proyecto: con el
 * catálogo abierto eso es la diferencia entre ocho consultas y ciento treinta.
 */
async function armarProyectos(consultar: Consultar, filas: Fila[]): Promise<Proyecto[]> {
  if (filas.length === 0) return [];

  const ids = lista(filas.map((f) => String(f.id)));
  const de = (sql: string) => consultar<Fila>(sql, ids.params);

  const [
    condiciones,
    comisiones,
    contingencias,
    presupuesto,
    cronograma,
    controles,
    restricciones,
    fideicomisos,
  ] = await Promise.all([
    // La vigente es la de versión más alta: corregir una condición no pisa la
    // que estaba cuando alguien adhirió.
    de(`select distinct on (proyecto_id) * from condiciones_economicas
        where proyecto_id in ${ids.sql} order by proyecto_id, version desc`),
    de(`select * from comisiones where proyecto_id in ${ids.sql} order by proyecto_id, orden`),
    de(`select * from contingencias where proyecto_id in ${ids.sql} order by proyecto_id, orden`),
    de(`select * from presupuesto_rubros where proyecto_id in ${ids.sql} order by proyecto_id, orden`),
    de(`select * from cronograma_hitos where proyecto_id in ${ids.sql} order by proyecto_id, orden`),
    de(`select * from controles where proyecto_id in ${ids.sql} order by proyecto_id, orden`),
    de(`select * from restricciones where proyecto_id in ${ids.sql} and hasta is null
        order by proyecto_id, desde`),
    de(`select * from fideicomisos where proyecto_id in ${ids.sql}`),
  ]);

  const porProyecto = <T>(fs: Fila[], map: (f: Fila) => T) => {
    const m = new Map<string, T[]>();
    for (const f of fs) {
      const k = String(f.proyecto_id);
      const lista = m.get(k) ?? [];
      lista.push(map(f));
      m.set(k, lista);
    }
    return m;
  };

  const cond = new Map(condiciones.map((f) => [String(f.proyecto_id), f]));
  const fid = new Map(fideicomisos.map((f) => [String(f.proyecto_id), f]));

  const coms = porProyecto(comisiones, (f) => ({
    concepto: texto(f.concepto),
    base: texto(f.base),
    porcentaje: numOpc(f.porcentaje),
    aCargoDe: f.a_cargo_de as "colaborador" | "productor" | "fideicomiso",
    momento: texto(f.momento),
    fuente: f.fuente as "contrato" | "demostrativo",
  }));
  const cont = porProyecto(contingencias, (f) => ({
    caso: f.caso as Proyecto["condiciones"]["contingencias"][number]["caso"],
    queDice: texto(f.que_dice),
    aCargoDe: texto(f.a_cargo_de),
    fuente: f.fuente as "contrato" | "demostrativo",
  }));
  const pres = porProyecto(presupuesto, (f) => ({
    rubro: texto(f.rubro),
    concepto: texto(f.concepto),
    proveedor: textoOpc(f.proveedor),
    montoArs: num(f.monto_ars),
    periodo: texto(f.periodo),
  }));
  const cron = porProyecto(cronograma, (f) => ({
    hito: texto(f.hito),
    momento: texto(f.momento),
    montoArs: num(f.monto_ars),
    condicion: texto(f.condicion),
  }));
  const ctrl = porProyecto(controles, (f) => ({
    control: texto(f.control),
    fecha: fecha(f.fecha),
    alcance: texto(f.alcance),
    metodo: texto(f.metodo),
    responsable: texto(f.responsable),
  }));
  const restr = porProyecto(restricciones, (f) => ({
    alcance: f.alcance as "adhesiones" | "desembolsos",
    motivo: texto(f.motivo),
    responsable: texto(f.responsable),
    desde: fecha(f.desde),
  }));

  return filas.map((p) => {
    const id = String(p.id);
    const c = cond.get(id);
    const f = fid.get(id);
    const rs = restr.get(id);

    const fideicomiso: Fideicomiso | undefined = f
      ? {
          serie: texto(f.serie),
          fiduciario: texto(f.fiduciario),
          fiduciantes: texto(f.fiduciantes),
          fideicomisarios: texto(f.fideicomisarios),
          bienesFideicomitidos: texto(f.bienes_fideicomitidos),
          objeto: texto(f.objeto),
          repartoResultado: texto(f.reparto_resultado),
          mortandad: texto(f.mortandad),
          inicioAt: fecha(f.inicio_at),
          extincionAt: fecha(f.extincion_at),
          rendicionCuentas: texto(f.rendicion_cuentas),
          seguroResponsabilidadCivil: texto(f.seguro_responsabilidad_civil),
          inscripcion: texto(f.inscripcion),
        }
      : undefined;

    return {
      id,
      productorId: texto(p.productor_id),
      titulo: texto(p.titulo),
      modalidad: (p.modalidad as Proyecto["modalidad"]) ?? null,
      motivoRevisionModalidad: textoOpc(p.motivo_revision_modalidad),
      destinoFondosPrevio: (p.destino_fondos_previo as Proyecto["destinoFondosPrevio"]) ?? undefined,
      condiciones: {
        monedaAporte: "ARS",
        monedaDevolucion: "ARS",
        // Participación y tasa se guardan en la misma fila y son excluyentes por
        // modalidad: se arma la que tenga datos, no las dos.
        participacion:
          c && c.participacion_base !== null && c.participacion_base !== undefined
            ? {
                colaboradoresPct: numOpc(c.participacion_colaboradores_pct),
                productorPct: numOpc(c.participacion_productor_pct),
                base: texto(c.participacion_base),
                fuente: c.participacion_fuente as "contrato" | "demostrativo",
              }
            : undefined,
        tasa:
          c && c.tasa_calculo !== null && c.tasa_calculo !== undefined
            ? {
                tasaPct: numOpc(c.tasa_pct),
                base: (c.tasa_base as "anual" | "mensual" | "ciclo" | null) ?? null,
                calculo: texto(c.tasa_calculo),
                vencimientos: texto(c.tasa_vencimientos),
                fuente: c.tasa_fuente as "contrato" | "demostrativo",
              }
            : undefined,
        proyeccion:
          c && c.proyeccion_fecha !== null && c.proyeccion_fecha !== undefined
            ? {
                fecha: fecha(c.proyeccion_fecha),
                supuestos: (c.proyeccion_supuestos as string[]) ?? [],
                ingresosEstimadosArs: num(c.proyeccion_ingresos_estimados_ars),
                costosEstimadosArs: num(c.proyeccion_costos_estimados_ars),
                comisionesEstimadasArs: numOpc(c.proyeccion_comisiones_estimadas_ars),
              }
            : undefined,
        comisiones: coms.get(id) ?? [],
        contingencias: cont.get(id) ?? [],
      },
      montoMinimoInicioArs: numOpc(p.monto_minimo_inicio_ars),
      restricciones: rs && rs.length > 0 ? rs : undefined,
      destinoDetalle: texto(p.destino_detalle),
      tipoPosesion: p.tipo_posesion as Proyecto["tipoPosesion"],
      sistemaProductivo: p.sistema_productivo as Proyecto["sistemaProductivo"],
      cabezas: num(p.cabezas),
      categoria: texto(p.categoria),
      raza: texto(p.raza),
      pesoEntradaKg: num(p.peso_entrada_kg),
      pesoSalidaObjetivoKg: num(p.peso_salida_objetivo_kg),
      montoObjetivoArs: num(p.monto_objetivo_ars),
      montoRecaudadoArs: num(p.monto_recaudado_ars),
      montoLiberadoArs: num(p.monto_liberado_ars),
      montoRetiradoArs: num(p.monto_retirado_ars),
      plazoDias: num(p.plazo_dias),
      plazoCobroDias: numOpc(p.plazo_cobro_dias),
      presupuesto: pres.get(id) ?? [],
      cronograma: cron.get(id) ?? [],
      controles: ctrl.get(id) ?? [],
      rendimientoEsperadoPct: num(p.rendimiento_esperado_pct),
      garantiaId: texto(p.garantia_id),
      tieneSeguro: Boolean(p.tiene_seguro),
      estado: p.estado as Proyecto["estado"],
      provincia: texto(p.provincia),
      creadoAt: fecha(p.creado_at),
      publicadoAt: fechaOpc(p.publicado_at),
      fideicomiso,
      resultado: p.resultado_dte_salida
        ? {
            dteSalida: texto(p.resultado_dte_salida),
            cabezasFaena: num(p.resultado_cabezas_faena),
            kilosVivos: num(p.resultado_kilos_vivos),
            kgCarne: num(p.resultado_kg_carne),
            rendimientoPct: num(p.resultado_rendimiento_pct),
            fecha: fecha(p.resultado_fecha),
          }
        : undefined,
    } satisfies Proyecto;
  });
}

/* ------------------------------------------------------------------ */
/* Armado del resto                                                    */
/* ------------------------------------------------------------------ */

const aProductor = (f: Fila): Productor => ({
  id: texto(f.id),
  nombre: texto(f.nombre),
  razonSocial: texto(f.razon_social),
  responsable: texto(f.responsable),
  correo: texto(f.correo),
  telefono: texto(f.telefono),
  cuit: texto(f.cuit),
  renspa: texto(f.renspa),
  marcaRegistrada: texto(f.marca_registrada),
  establecimiento: texto(f.establecimiento),
  localidad: texto(f.localidad),
  provincia: texto(f.provincia),
  sistemaProductivo: f.sistema_productivo as Productor["sistemaProductivo"],
  capacidadInstalada: num(f.capacidad_instalada),
  ocupacionActual: num(f.ocupacion_actual),
  ciclosCompletados: num(f.ciclos_completados),
});

const aColaborador = (f: Fila): Colaborador => ({
  id: texto(f.id),
  nombre: texto(f.nombre),
  email: texto(f.email),
  telefono: texto(f.telefono),
  cuil: texto(f.cuil),
  altaAt: fecha(f.alta_at),
  identidad: f.identidad_metodo
    ? { metodo: texto(f.identidad_metodo), fecha: fecha(f.identidad_fecha) }
    : null,
  cbuDevolucion: texto(f.cbu_devolucion),
  aliasDevolucion: texto(f.alias_devolucion),
});

const aGarantia = (f: Fila): Garantia => ({
  id: texto(f.id),
  productorId: texto(f.productor_id),
  tipo: f.tipo as Garantia["tipo"],
  identificacion: texto(f.identificacion),
  descripcion: texto(f.descripcion),
  valuacionArs: num(f.valuacion_ars),
  cupoProyectos: num(f.cupo_proyectos),
  vigenciaHasta: fecha(f.vigencia_hasta),
  estado: f.estado as Garantia["estado"],
  estadoConstitucion: f.estado_constitucion as Garantia["estadoConstitucion"],
  instrumento: textoOpc(f.instrumento),
  documentoId: f.documento_id === null ? null : texto(f.documento_id),
});

const aDiscrepancia = (f: Fila): Discrepancia => ({
  id: texto(f.id),
  documentoId: texto(f.documento_id),
  campo: texto(f.campo),
  etiqueta: texto(f.etiqueta),
  valorDeclarado: texto(f.valor_declarado),
  valorExtraido: texto(f.valor_extraido),
  severidad: f.severidad as Discrepancia["severidad"],
  detalle: texto(f.detalle),
  resuelta: Boolean(f.resuelta),
  resolucion: textoOpc(f.resolucion),
});

const aSeguimiento = (f: Fila): RegistroSeguimiento => ({
  id: texto(f.id),
  proyectoId: texto(f.proyecto_id),
  fecha: fecha(f.fecha),
  cabezas: num(f.cabezas),
  pesoPromedioKg: num(f.peso_promedio_kg),
  mortandad: num(f.mortandad),
  gastoArs: num(f.gasto_ars),
  conceptoGasto: texto(f.concepto_gasto),
  nota: textoOpc(f.nota),
});

const aLiquidacion = (f: Fila): Liquidacion => ({
  id: texto(f.id),
  proyectoId: texto(f.proyecto_id),
  colaboradorId: texto(f.colaborador_id),
  concepto: texto(f.concepto),
  capitalArs: num(f.capital_ars),
  resultadoArs: num(f.resultado_ars),
  estado: f.estado as Liquidacion["estado"],
  fecha: fecha(f.fecha),
  pagadaAt: fechaOpc(f.pagada_at),
});

/** Documentos con sus campos extraídos, en dos consultas y no en una por documento. */
async function armarDocumentos(consultar: Consultar, filas: Fila[]): Promise<Documento[]> {
  if (filas.length === 0) return [];

  const ids = lista(filas.map((f) => String(f.id)));
  const campos = await consultar<Fila>(
    `select * from extracciones where documento_id in ${ids.sql}
     order by documento_id, orden`,
    ids.params,
  );

  const porDocumento = new Map<string, Documento["camposExtraidos"]>();
  for (const c of campos) {
    const k = String(c.documento_id);
    const lista = porDocumento.get(k) ?? [];
    lista.push({
      campo: texto(c.campo),
      etiqueta: texto(c.etiqueta),
      valor: texto(c.valor),
      confianza: num(c.confianza),
    });
    porDocumento.set(k, lista);
  }

  return filas.map((d) => ({
    id: texto(d.id),
    proyectoId: d.proyecto_id === null ? null : texto(d.proyecto_id),
    productorId: texto(d.productor_id),
    tipo: d.tipo as Documento["tipo"],
    nombreArchivo: texto(d.nombre_archivo),
    tieneCapaTexto: Boolean(d.tiene_capa_texto),
    subidoAt: fecha(d.subido_at),
    estadoExtraccion: d.estado_extraccion as Documento["estadoExtraccion"],
    estadoConsistencia: d.estado_consistencia as Documento["estadoConsistencia"],
    estadoAutenticidad: d.estado_autenticidad as Documento["estadoAutenticidad"],
    cuve: textoOpc(d.cuve),
    camposExtraidos: porDocumento.get(texto(d.id)) ?? [],
    // La columna nunca es nula, pero una lista vacía en el dominio es "este
    // documento no trae totales impresos", y eso se escribe ausente.
    controlesAritmeticos:
      Array.isArray(d.controles_aritmeticos) && d.controles_aritmeticos.length > 0
        ? (d.controles_aritmeticos as Documento["controlesAritmeticos"])
        : undefined,
    observacionAdmin: textoOpc(d.observacion_admin),
  }));
}

/** Aportes con sus movimientos bancarios. */
async function armarAportes(consultar: Consultar, filas: Fila[]): Promise<Aporte[]> {
  if (filas.length === 0) return [];

  const ids = lista(filas.map((f) => String(f.id)));
  const movimientos = await consultar<Fila>(
    `select * from movimientos_bancarios where aporte_id in ${ids.sql}
     order by aporte_id, fecha`,
    ids.params,
  );

  const porAporte = new Map<string, MovimientoBancario[]>();
  for (const m of movimientos) {
    const k = String(m.aporte_id);
    const lista = porAporte.get(k) ?? [];
    lista.push({
      id: texto(m.id),
      referenciaExterna: texto(m.referencia_externa),
      importeArs: num(m.importe_ars),
      fecha: fecha(m.fecha),
      estadoConciliacion: m.estado_conciliacion as MovimientoBancario["estadoConciliacion"],
      observacion: textoOpc(m.observacion),
    });
    porAporte.set(k, lista);
  }

  return filas.map((a) => ({
    id: texto(a.id),
    proyectoId: texto(a.proyecto_id),
    colaboradorId: texto(a.colaborador_id),
    ordenSuscripcion: texto(a.orden_suscripcion),
    montoComprometidoArs: num(a.monto_comprometido_ars),
    montoAcreditadoArs: num(a.monto_acreditado_ars),
    moneda: "ARS",
    estado: a.estado as Aporte["estado"],
    adhesionAt: fecha(a.adhesion_at),
    contratoVersion: texto(a.contrato_version),
    movimientos: porAporte.get(texto(a.id)) ?? [],
  }));
}

/* ------------------------------------------------------------------ */
/* El repositorio                                                      */
/* ------------------------------------------------------------------ */

export function crearRepositorioPostgres(consultar: Consultar): Repositorio {
  const proyectosPorSql = async (sql: string, params: unknown[] = []) =>
    armarProyectos(consultar, await consultar<Fila>(sql, params));

  return {
    async getProyectosPublicos(filtros: FiltrosCatalogo = {}) {
      // Los filtros van como parámetros y nunca interpolados: un nombre de
      // provincia viene de la query string y no se pega dentro del SQL.
      const estados = lista(ESTADOS_PUBLICOS);
      const n = estados.params.length;
      return proyectosPorSql(
        `select ${COLUMNAS_PROYECTO} from proyectos
         where estado::text in ${estados.sql}
           and ($${n + 1}::text is null or provincia = $${n + 1})
           and ($${n + 2}::text is null or modalidad::text = $${n + 2})
           and ($${n + 3}::numeric is null or monto_objetivo_ars <= $${n + 3})
         order by publicado_at desc nulls last, id`,
        [
          ...estados.params,
          filtros.provincia ?? null,
          filtros.modalidad ?? null,
          filtros.montoMaximo ?? null,
        ],
      );
    },

    async getProyecto(id) {
      const [p] = await proyectosPorSql(
        `select ${COLUMNAS_PROYECTO} from proyectos where id = $1`,
        [id],
      );
      return p;
    },

    async getProyectosDeProductor(productorId) {
      return proyectosPorSql(
        `select ${COLUMNAS_PROYECTO} from proyectos where productor_id = $1
         order by creado_at desc, id`,
        [productorId],
      );
    },

    async getProyectosEnValidacion() {
      return proyectosPorSql(
        `select ${COLUMNAS_PROYECTO} from proyectos where estado = 'en_validacion'
         order by creado_at asc, id`,
      );
    },

    async getProductor(id) {
      const [f] = await consultar<Fila>(`select * from productores where id = $1`, [id]);
      return f ? aProductor(f) : undefined;
    },

    async getColaborador(id) {
      const [f] = await consultar<Fila>(`select * from colaboradores where id = $1`, [id]);
      return f ? aColaborador(f) : undefined;
    },

    async getDocumentosDeProyecto(proyectoId) {
      return armarDocumentos(
        consultar,
        await consultar<Fila>(
          `select * from documentos where proyecto_id = $1 order by subido_at desc, id`,
          [proyectoId],
        ),
      );
    },

    async getDocumentosDeProductor(productorId) {
      return armarDocumentos(
        consultar,
        await consultar<Fila>(
          `select * from documentos where productor_id = $1 order by subido_at desc, id`,
          [productorId],
        ),
      );
    },

    async getDocumentosVigentesDeProyecto(proyectoId, productorId) {
      return armarDocumentos(
        consultar,
        await consultar<Fila>(
          `select * from documentos
           where proyecto_id = $1 or (proyecto_id is null and productor_id = $2)
           order by subido_at desc, id`,
          [proyectoId, productorId],
        ),
      );
    },

    async getDocumentosPermanentes(productorId) {
      return armarDocumentos(
        consultar,
        await consultar<Fila>(
          `select * from documentos where productor_id = $1 and proyecto_id is null
           order by subido_at desc, id`,
          [productorId],
        ),
      );
    },

    async getDiscrepanciasDeDocumento(documentoId) {
      const fs = await consultar<Fila>(
        `select * from discrepancias where documento_id = $1 order by id`,
        [documentoId],
      );
      return fs.map(aDiscrepancia);
    },

    async getDiscrepanciasDeProyecto(proyectoId) {
      const fs = await consultar<Fila>(
        `select d.* from discrepancias d
         join documentos doc on doc.id = d.documento_id
         where doc.proyecto_id = $1
         order by d.id`,
        [proyectoId],
      );
      return fs.map(aDiscrepancia);
    },

    async getSaldosDeProductor(productorId): Promise<Saldos> {
      // Un borrador todavía no recaudó nada y un rechazado no va a recaudar: los
      // saldos se cuentan sobre lo que existe como operación.
      const [f] = await consultar<Fila>(
        `select
           coalesce(sum(monto_liberado_ars), 0) liberado,
           coalesce(sum(monto_retirado_ars), 0) retirado,
           coalesce(sum(monto_recaudado_ars), 0) recaudado,
           coalesce(sum(monto_objetivo_ars), 0) objetivo
         from proyectos
         where productor_id = $1 and estado not in ('borrador', 'rechazado')`,
        [productorId],
      );

      const liberadoHistorico = num(f?.liberado);
      const recaudadoHistorico = num(f?.recaudado);

      return {
        pendienteDeRetiro: liberadoHistorico - num(f?.retirado),
        liberadoHistorico,
        aLiquidar: recaudadoHistorico - liberadoHistorico,
        recaudadoHistorico,
        objetivoHistorico: num(f?.objetivo),
      };
    },

    async getGarantia(id) {
      const [f] = await consultar<Fila>(`select * from garantias where id = $1`, [id]);
      return f ? aGarantia(f) : undefined;
    },

    async getGarantiasDeProductor(productorId) {
      const fs = await consultar<Fila>(
        `select * from garantias where productor_id = $1 order by id`,
        [productorId],
      );
      return fs.map(aGarantia);
    },

    async getGarantiasConUso(productorId): Promise<GarantiaConUso[]> {
      const fs = await consultar<Fila>(
        `select * from garantias where productor_id = $1 order by id`,
        [productorId],
      );
      if (fs.length === 0) return [];

      const ids = lista(fs.map((f) => String(f.id)));
      const estados = lista(ESTADOS_VIVOS, ids.params.length + 1);
      const usos = await proyectosPorSql(
        `select ${COLUMNAS_PROYECTO} from proyectos
         where garantia_id in ${ids.sql} and estado::text in ${estados.sql}
         order by creado_at desc, id`,
        [...ids.params, ...estados.params],
      );

      return fs.map((f) => {
        const garantia = aGarantia(f);
        const usadaEn = usos.filter((p) => p.garantiaId === garantia.id);
        const cupoLibre = Math.max(0, garantia.cupoProyectos - usadaEn.length);
        return {
          garantia,
          usadaEn,
          cupoLibre,
          disponible: cupoLibre > 0 && garantia.estado !== "vencida",
        };
      });
    },

    async getSeguimientoDeProyecto(proyectoId) {
      const fs = await consultar<Fila>(
        `select * from seguimiento where proyecto_id = $1 order by fecha asc`,
        [proyectoId],
      );
      return fs.map(aSeguimiento);
    },

    async getAportesDeColaborador(colaboradorId) {
      return armarAportes(
        consultar,
        await consultar<Fila>(
          `select * from aportes where colaborador_id = $1 order by adhesion_at desc, id`,
          [colaboradorId],
        ),
      );
    },

    async getAportesDeProyecto(proyectoId) {
      return armarAportes(
        consultar,
        await consultar<Fila>(
          `select * from aportes where proyecto_id = $1 order by id`,
          [proyectoId],
        ),
      );
    },

    async getLiquidacionesDeColaborador(colaboradorId) {
      const fs = await consultar<Fila>(
        `select * from liquidaciones where colaborador_id = $1 order by fecha desc, id`,
        [colaboradorId],
      );
      return fs.map(aLiquidacion);
    },

    async getCarteraDeColaborador(colaboradorId): Promise<Cartera> {
      const aportesSuyos = await this.getAportesDeColaborador(colaboradorId);
      const liquidaciones = await this.getLiquidacionesDeColaborador(colaboradorId);

      const posiciones: PosicionEnProyecto[] = [];
      if (aportesSuyos.length > 0) {
        const ids = lista([...new Set(aportesSuyos.map((a) => a.proyectoId))]);
        const proyectosSuyos = await proyectosPorSql(
          `select ${COLUMNAS_PROYECTO} from proyectos where id in ${ids.sql}`,
          ids.params,
        );
        const porId = new Map(proyectosSuyos.map((p) => [p.id, p]));
        for (const aporte of aportesSuyos) {
          const proyecto = porId.get(aporte.proyectoId);
          if (proyecto) posiciones.push({ proyecto, aporte });
        }
      }

      return {
        posiciones,
        liquidaciones,
        comprometidoArs: aportesSuyos.reduce((a, x) => a + x.montoComprometidoArs, 0),
        acreditadoArs: aportesSuyos.reduce((a, x) => a + x.montoAcreditadoArs, 0),
        pendienteDeAcreditarArs: aportesSuyos.reduce(
          (a, x) => a + Math.max(0, x.montoComprometidoArs - x.montoAcreditadoArs),
          0,
        ),
        liquidadoPagadoArs: liquidaciones
          .filter((l) => l.estado === "pagada")
          .reduce((a, l) => a + l.capitalArs + l.resultadoArs, 0),
        liquidadoPendienteArs: liquidaciones
          .filter((l) => l.estado !== "pagada")
          .reduce((a, l) => a + l.capitalArs + l.resultadoArs, 0),
      };
    },
  };
}
