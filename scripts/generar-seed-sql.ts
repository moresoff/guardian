/**
 * Genera `supabase/seed.sql` a partir de `src/lib/data/seed.ts`.
 *
 * Se genera y no se escribe a mano porque si no, a la semana hay dos juegos de
 * datos de demo que dicen cosas distintas: el de la app sin backend y el de la
 * base. Con esto hay uno solo, y el SQL es una traducción.
 *
 *   npx tsx scripts/generar-seed-sql.ts
 */
import { writeFileSync } from "node:fs";
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
} from "@/lib/data/seed";

type Valor = string | number | boolean | null | undefined | object;

/** Un literal SQL. Las comillas simples se duplican, que es como se escapan. */
function lit(v: Valor): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) throw new Error(`número no finito: ${v}`);
    return String(v);
  }
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "object") return `${lit(JSON.stringify(v))}::jsonb`;
  return `'${v.replaceAll("'", "''")}'`;
}

const partes: string[] = [];

function tabla(nombre: string, columnas: string[], filas: Valor[][]) {
  if (filas.length === 0) return;
  partes.push(
    `insert into ${nombre} (${columnas.join(", ")}) values\n` +
      filas.map((f) => `  (${f.map(lit).join(", ")})`).join(",\n") +
      ";\n",
  );
}

partes.push(`-- Datos de demostración de Guardian.
--
-- GENERADO por scripts/generar-seed-sql.ts a partir de src/lib/data/seed.ts.
-- No editar a mano: se pisa en la próxima corrida.
--
-- Las cifras económicas son demostrativas, no salen de ningún contrato firmado.
`);

partes.push(`-- Se vacía antes de cargar, así correrlo dos veces no duplica nada.
truncate table
  auditoria, liquidaciones, movimientos_bancarios, aportes, discrepancias,
  extracciones, documentos, identificadores, seguimiento, fideicomisos,
  restricciones, controles, cronograma_hitos, presupuesto_rubros, contingencias,
  comisiones, condiciones_economicas, proyectos, garantias, colaboradores,
  productores, perfiles
restart identity cascade;
`);

tabla(
  "productores",
  [
    "id", "nombre", "razon_social", "responsable", "correo", "telefono", "cuit",
    "renspa", "marca_registrada", "establecimiento", "localidad", "provincia",
    "sistema_productivo", "capacidad_instalada", "ocupacion_actual", "ciclos_completados",
  ],
  productores.map((p) => [
    p.id, p.nombre, p.razonSocial, p.responsable, p.correo, p.telefono, p.cuit,
    p.renspa, p.marcaRegistrada, p.establecimiento, p.localidad, p.provincia,
    p.sistemaProductivo, p.capacidadInstalada, p.ocupacionActual, p.ciclosCompletados,
  ]),
);

tabla(
  "colaboradores",
  [
    "id", "nombre", "email", "telefono", "cuil", "alta_at",
    "identidad_metodo", "identidad_fecha", "cbu_devolucion", "alias_devolucion",
  ],
  colaboradores.map((c) => [
    c.id, c.nombre, c.email, c.telefono, c.cuil, c.altaAt,
    c.identidad?.metodo ?? null, c.identidad?.fecha ?? null,
    c.cbuDevolucion, c.aliasDevolucion,
  ]),
);

tabla(
  "garantias",
  [
    "id", "productor_id", "tipo", "identificacion", "descripcion", "valuacion_ars",
    "cupo_proyectos", "vigencia_hasta", "estado", "estado_constitucion", "instrumento",
  ],
  garantias.map((g) => [
    g.id, g.productorId, g.tipo, g.identificacion, g.descripcion, g.valuacionArs,
    g.cupoProyectos, g.vigenciaHasta, g.estado, g.estadoConstitucion, g.instrumento ?? null,
  ]),
);

// El documento que constituye cada garantía va después de `documentos`, que es
// cuando la fila a la que apunta ya existe.
const garantiasConDocumento = garantias.filter((g) => g.documentoId);

tabla(
  "proyectos",
  [
    "id", "productor_id", "titulo", "modalidad", "motivo_revision_modalidad",
    "destino_detalle", "tipo_posesion", "sistema_productivo", "cabezas", "categoria",
    "destino_fondos_previo", "raza", "peso_entrada_kg", "peso_salida_objetivo_kg",
    "monto_objetivo_ars",
    "monto_recaudado_ars", "monto_liberado_ars", "monto_retirado_ars",
    "monto_minimo_inicio_ars", "plazo_dias", "plazo_cobro_dias",
    "rendimiento_esperado_pct", "garantia_id", "tiene_seguro", "estado", "provincia",
    "creado_at", "publicado_at", "resultado_dte_salida", "resultado_cabezas_faena",
    "resultado_kilos_vivos", "resultado_kg_carne", "resultado_rendimiento_pct",
    "resultado_fecha",
  ],
  proyectos.map((p) => [
    p.id, p.productorId, p.titulo, p.modalidad, p.motivoRevisionModalidad ?? null,
    p.destinoDetalle, p.tipoPosesion, p.sistemaProductivo, p.cabezas, p.categoria,
    p.destinoFondosPrevio ?? null, p.raza, p.pesoEntradaKg, p.pesoSalidaObjetivoKg,
    p.montoObjetivoArs,
    p.montoRecaudadoArs, p.montoLiberadoArs, p.montoRetiradoArs,
    p.montoMinimoInicioArs, p.plazoDias, p.plazoCobroDias,
    p.rendimientoEsperadoPct, p.garantiaId || null, p.tieneSeguro, p.estado, p.provincia,
    p.creadoAt, p.publicadoAt ?? null, p.resultado?.dteSalida ?? null,
    p.resultado?.cabezasFaena ?? null, p.resultado?.kilosVivos ?? null,
    p.resultado?.kgCarne ?? null, p.resultado?.rendimientoPct ?? null,
    p.resultado?.fecha ?? null,
  ]),
);

tabla(
  "condiciones_economicas",
  [
    "proyecto_id", "version",
    "participacion_colaboradores_pct", "participacion_productor_pct",
    "participacion_base", "participacion_fuente",
    "tasa_pct", "tasa_base", "tasa_calculo", "tasa_vencimientos", "tasa_fuente",
    "proyeccion_fecha", "proyeccion_supuestos", "proyeccion_ingresos_estimados_ars",
    "proyeccion_costos_estimados_ars", "proyeccion_comisiones_estimadas_ars",
  ],
  proyectos.map((p) => {
    const c = p.condiciones;
    return [
      p.id, 1,
      c.participacion?.colaboradoresPct ?? null, c.participacion?.productorPct ?? null,
      c.participacion?.base ?? null, c.participacion?.fuente ?? null,
      c.tasa?.tasaPct ?? null, c.tasa?.base ?? null, c.tasa?.calculo ?? null,
      c.tasa?.vencimientos ?? null, c.tasa?.fuente ?? null,
      c.proyeccion?.fecha ?? null, c.proyeccion?.supuestos ?? [],
      c.proyeccion?.ingresosEstimadosArs ?? null,
      c.proyeccion?.costosEstimadosArs ?? null,
      c.proyeccion?.comisionesEstimadasArs ?? null,
    ];
  }),
);

tabla(
  "comisiones",
  ["proyecto_id", "concepto", "base", "porcentaje", "a_cargo_de", "momento", "fuente", "orden"],
  proyectos.flatMap((p) =>
    p.condiciones.comisiones.map((c, i) => [
      p.id, c.concepto, c.base, c.porcentaje, c.aCargoDe, c.momento, c.fuente, i,
    ]),
  ),
);

tabla(
  "contingencias",
  ["proyecto_id", "caso", "que_dice", "a_cargo_de", "fuente", "orden"],
  proyectos.flatMap((p) =>
    p.condiciones.contingencias.map((c, i) => [
      p.id, c.caso, c.queDice, c.aCargoDe, c.fuente, i,
    ]),
  ),
);

tabla(
  "presupuesto_rubros",
  ["proyecto_id", "rubro", "concepto", "proveedor", "monto_ars", "periodo", "orden"],
  proyectos.flatMap((p) =>
    p.presupuesto.map((r, i) => [
      p.id, r.rubro, r.concepto, r.proveedor ?? null, r.montoArs, r.periodo, i,
    ]),
  ),
);

tabla(
  "cronograma_hitos",
  ["proyecto_id", "hito", "momento", "monto_ars", "condicion", "orden"],
  proyectos.flatMap((p) =>
    p.cronograma.map((h, i) => [p.id, h.hito, h.momento, h.montoArs, h.condicion, i]),
  ),
);

tabla(
  "controles",
  ["proyecto_id", "control", "fecha", "alcance", "metodo", "responsable", "orden"],
  proyectos.flatMap((p) =>
    p.controles.map((c, i) => [
      p.id, c.control, c.fecha, c.alcance, c.metodo, c.responsable, i,
    ]),
  ),
);

tabla(
  "restricciones",
  ["proyecto_id", "alcance", "motivo", "responsable", "desde"],
  proyectos.flatMap((p) =>
    (p.restricciones ?? []).map((r) => [p.id, r.alcance, r.motivo, r.responsable, r.desde]),
  ),
);

tabla(
  "fideicomisos",
  [
    "proyecto_id", "serie", "fiduciario", "fiduciantes", "fideicomisarios",
    "bienes_fideicomitidos", "objeto", "reparto_resultado", "mortandad",
    "inicio_at", "extincion_at", "rendicion_cuentas",
    "seguro_responsabilidad_civil", "inscripcion",
  ],
  proyectos
    .filter((p) => p.fideicomiso)
    .map((p) => {
      const f = p.fideicomiso!;
      return [
        p.id, f.serie, f.fiduciario, f.fiduciantes, f.fideicomisarios,
        f.bienesFideicomitidos, f.objeto, f.repartoResultado, f.mortandad,
        f.inicioAt, f.extincionAt, f.rendicionCuentas,
        f.seguroResponsabilidadCivil, f.inscripcion,
      ];
    }),
);

tabla(
  "seguimiento",
  [
    "id", "proyecto_id", "fecha", "cabezas", "peso_promedio_kg", "mortandad",
    "gasto_ars", "concepto_gasto", "nota",
  ],
  seguimiento.map((s) => [
    s.id, s.proyectoId, s.fecha, s.cabezas, s.pesoPromedioKg, s.mortandad,
    s.gastoArs, s.conceptoGasto, s.nota ?? null,
  ]),
);

tabla(
  "documentos",
  [
    "id", "proyecto_id", "productor_id", "tipo", "nombre_archivo", "tiene_capa_texto",
    "subido_at", "estado_extraccion", "estado_consistencia", "estado_autenticidad",
    "cuve", "controles_aritmeticos", "observacion_admin",
  ],
  documentos.map((d) => [
    d.id, d.proyectoId, d.productorId, d.tipo, d.nombreArchivo, d.tieneCapaTexto,
    d.subidoAt, d.estadoExtraccion, d.estadoConsistencia, d.estadoAutenticidad,
    d.cuve ?? null, d.controlesAritmeticos ?? [], d.observacionAdmin ?? null,
  ]),
);

tabla(
  "extracciones",
  ["documento_id", "campo", "etiqueta", "valor", "confianza", "orden"],
  documentos.flatMap((d) =>
    d.camposExtraidos.map((c, i) => [d.id, c.campo, c.etiqueta, c.valor, c.confianza, i]),
  ),
);

tabla(
  "discrepancias",
  [
    "id", "documento_id", "campo", "etiqueta", "valor_declarado", "valor_extraido",
    "severidad", "detalle", "resuelta", "resolucion",
  ],
  discrepancias.map((d) => [
    d.id, d.documentoId, d.campo, d.etiqueta, d.valorDeclarado, d.valorExtraido,
    d.severidad, d.detalle, d.resuelta, d.resolucion ?? null,
  ]),
);

if (garantiasConDocumento.length > 0) {
  partes.push(
    garantiasConDocumento
      .map(
        (g) =>
          `update garantias set documento_id = ${lit(g.documentoId)} where id = ${lit(g.id)};`,
      )
      .join("\n") + "\n",
  );
}

tabla(
  "aportes",
  [
    "id", "proyecto_id", "colaborador_id", "orden_suscripcion",
    "monto_comprometido_ars", "monto_acreditado_ars", "estado", "adhesion_at",
    "contrato_version",
  ],
  aportes.map((a) => [
    a.id, a.proyectoId, a.colaboradorId, a.ordenSuscripcion,
    a.montoComprometidoArs, a.montoAcreditadoArs, a.estado, a.adhesionAt,
    a.contratoVersion,
  ]),
);

tabla(
  "movimientos_bancarios",
  ["id", "aporte_id", "referencia_externa", "importe_ars", "fecha", "estado_conciliacion", "observacion"],
  aportes.flatMap((a) =>
    a.movimientos.map((m) => [
      m.id, a.id, m.referenciaExterna, m.importeArs, m.fecha, m.estadoConciliacion,
      m.observacion ?? null,
    ]),
  ),
);

tabla(
  "liquidaciones",
  [
    "id", "proyecto_id", "colaborador_id", "concepto", "capital_ars",
    "resultado_ars", "estado", "fecha", "pagada_at",
  ],
  liquidaciones.map((l) => [
    l.id, l.proyectoId, l.colaboradorId, l.concepto, l.capitalArs,
    l.resultadoArs, l.estado, l.fecha, l.pagadaAt ?? null,
  ]),
);

const destino = "supabase/seed.sql";
writeFileSync(destino, partes.join("\n"));

console.log(`${destino} generado`);
console.log(
  `  ${productores.length} productores · ${colaboradores.length} colaboradores · ` +
    `${proyectos.length} proyectos · ${documentos.length} documentos · ` +
    `${aportes.length} aportes · ${seguimiento.length} pesadas`,
);
