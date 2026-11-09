import "server-only";
import { randomUUID } from "node:crypto";
import { consultar, enTransaccion, hayBaseConfigurada } from "@/lib/db/conexion";
import { getAportesDeProyecto, getProyecto, getSeguimientoDeProyecto } from "@/lib/data";
import { aportes, liquidaciones, proyectos, seguimiento } from "@/lib/data/seed";
import { FIDUCIARIO_KG_POR_CABEZA, IMPUESTO_CHEQUE } from "@/lib/simulador";
import type { Aporte, Proyecto } from "@/lib/types";

/**
 * El ciclo después de que el proyecto se publica, como lo describe el trabajo:
 *
 *   1. Se cierra la participación. Con el mínimo (80 %) el ciclo arranca; sin él
 *      queda desierto y se devuelven los aportes. Nunca más de 25 colaboradores.
 *   2. Un único pago del fideicomiso al vendedor, en tres instancias: requisitos
 *      verificados, pago aprobado y pago hecho. Ahí cada colaborador recibe su
 *      constancia de compra.
 *   3. El productor carga las pesadas; el colaborador ve el informe.
 *   4. Con la venta se liquida: se reparte según lo pactado y se paga.
 *
 * Cada paso deja su asiento en `auditoria`. Sin base, escribe en memoria.
 */

export const TOPE_COLABORADORES = 25;

const hoy = () => new Date().toISOString().slice(0, 10);

/** Los colaboradores distintos con un aporte vivo en el proyecto. */
export function colaboradoresDe(aps: Aporte[]): Set<string> {
  return new Set(aps.filter((a) => a.estado !== "devuelto").map((a) => a.colaboradorId));
}

/** Si este colaborador todavía tiene lugar: el tope cuenta personas, no aportes. */
export async function hayLugarPara(proyectoId: string, colaboradorId: string) {
  const ya = colaboradoresDe(await getAportesDeProyecto(proyectoId));
  return ya.has(colaboradorId) || ya.size < TOPE_COLABORADORES;
}

// ---------------------------------------------------------------------------
// 1. Cerrar la participación
// ---------------------------------------------------------------------------

export async function cerrarParticipacion(actor: string, proyectoId: string) {
  const p = await getProyecto(proyectoId);
  if (!p || p.estado !== "abierto") throw new Error("La participación no está abierta.");
  const aps = await getAportesDeProyecto(proyectoId);
  const acreditado = aps.reduce((a, x) => a + x.montoAcreditadoArs, 0);
  const llego = p.montoMinimoInicioArs !== null && acreditado >= p.montoMinimoInicioArs;

  if (!hayBaseConfigurada()) {
    const pm = proyectos.find((x) => x.id === proyectoId)!;
    pm.estado = llego ? "fondeado" : "desierto";
    for (const a of aportes.filter((x) => x.proyectoId === proyectoId)) {
      // Con el mínimo, lo que nunca se transfirió se anula. Sin él, todo vuelve.
      if (!llego || a.montoAcreditadoArs === 0) a.estado = "devuelto";
    }
    return { llego };
  }
  await enTransaccion(async (q) => {
    await q("update proyectos set estado = $2 where id = $1", [
      proyectoId,
      llego ? "fondeado" : "desierto",
    ]);
    await q(
      llego
        ? "update aportes set estado = 'devuelto' where proyecto_id = $1 and monto_acreditado_ars = 0"
        : "update aportes set estado = 'devuelto' where proyecto_id = $1",
      [proyectoId],
    );
    await q(
      `insert into auditoria (actor, accion, entidad, entidad_id, cambios)
       values ($1, 'cerrar_participacion', 'proyecto', $2, $3)`,
      [actor, proyectoId, JSON.stringify({ acreditado, llego })],
    );
  });
  return { llego };
}

// ---------------------------------------------------------------------------
// 2. El pago de la compra
// ---------------------------------------------------------------------------

export interface PagoCompra {
  proyectoId: string;
  vendedor: string;
  vendedorCuit: string;
  renspaReceptor: string;
  cabezas: number;
  kilos: number;
  precioKgArs: number;
  montoArs: number;
  requisitosAt: string;
  aprobadoAt: string | null;
  pagadoAt: string | null;
}

export type DatosCompra = Pick<
  PagoCompra,
  "vendedor" | "vendedorCuit" | "renspaReceptor" | "cabezas" | "kilos" | "precioKgArs"
>;

const memoria = globalThis as unknown as { pagosCompra?: Map<string, PagoCompra> };
const pagosEnMemoria = () => (memoria.pagosCompra ??= new Map());

export async function getPagoCompra(proyectoId: string): Promise<PagoCompra | null> {
  if (!hayBaseConfigurada()) return pagosEnMemoria().get(proyectoId) ?? null;
  const [f] = await consultar<{
    vendedor: string;
    vendedor_cuit: string;
    renspa_receptor: string;
    cabezas: number;
    kilos: string;
    precio_kg_ars: string;
    monto_ars: string;
    requisitos_at: Date;
    aprobado_at: Date | null;
    pagado_at: Date | null;
  }>("select * from pagos_compra where proyecto_id = $1", [proyectoId]);
  if (!f) return null;
  const dia = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
  return {
    proyectoId,
    vendedor: f.vendedor,
    vendedorCuit: f.vendedor_cuit,
    renspaReceptor: f.renspa_receptor,
    cabezas: f.cabezas,
    kilos: Number(f.kilos),
    precioKgArs: Number(f.precio_kg_ars),
    montoArs: Number(f.monto_ars),
    requisitosAt: dia(f.requisitos_at)!,
    aprobadoAt: dia(f.aprobado_at),
    pagadoAt: dia(f.pagado_at),
  };
}

/** Primera instancia: el vendedor, el precio y el campo que recibe, verificados. */
export async function verificarRequisitosCompra(actor: string, proyectoId: string, d: DatosCompra) {
  const p = await getProyecto(proyectoId);
  if (!p || p.estado !== "fondeado") throw new Error("El proyecto no está esperando la compra.");
  if (await getPagoCompra(proyectoId)) throw new Error("Los requisitos ya estaban verificados.");
  const montoArs = Math.round(d.kilos * d.precioKgArs);
  if (montoArs > p.montoRecaudadoArs)
    throw new Error("La compra supera lo que hay en la cuenta del proyecto.");

  if (!hayBaseConfigurada()) {
    pagosEnMemoria().set(proyectoId, {
      proyectoId,
      ...d,
      montoArs,
      requisitosAt: hoy(),
      aprobadoAt: null,
      pagadoAt: null,
    });
    return;
  }
  await enTransaccion(async (q) => {
    await q(
      `insert into pagos_compra (proyecto_id, vendedor, vendedor_cuit, renspa_receptor, cabezas,
         kilos, precio_kg_ars, monto_ars, requisitos_por)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [proyectoId, d.vendedor, d.vendedorCuit, d.renspaReceptor, d.cabezas, d.kilos, d.precioKgArs, montoArs, actor],
    );
    await q(
      `insert into auditoria (actor, accion, entidad, entidad_id, cambios)
       values ($1, 'verificar_requisitos_compra', 'proyecto', $2, $3)`,
      [actor, proyectoId, JSON.stringify({ ...d, montoArs })],
    );
  });
}

/** Segunda instancia: alguien distinto de la carga aprueba el pago. */
export async function aprobarPagoCompra(actor: string, proyectoId: string) {
  const pago = await getPagoCompra(proyectoId);
  if (!pago) throw new Error("Primero hay que verificar los requisitos.");
  if (pago.aprobadoAt) throw new Error("El pago ya estaba aprobado.");
  if (!hayBaseConfigurada()) {
    pago.aprobadoAt = hoy();
    return;
  }
  await enTransaccion(async (q) => {
    await q("update pagos_compra set aprobado_at = now(), aprobado_por = $2 where proyecto_id = $1", [
      proyectoId,
      actor,
    ]);
    await q(
      `insert into auditoria (actor, accion, entidad, entidad_id) values ($1, 'aprobar_pago_compra', 'proyecto', $2)`,
      [actor, proyectoId],
    );
  });
}

/**
 * Tercera instancia: el fiduciario le paga al vendedor. Es el único pago del
 * ciclo; con él el ciclo arranca y cada colaborador tiene su constancia.
 */
export async function pagarCompra(actor: string, proyectoId: string) {
  const pago = await getPagoCompra(proyectoId);
  if (!pago?.aprobadoAt) throw new Error("El pago todavía no está aprobado.");
  if (pago.pagadoAt) throw new Error("La compra ya estaba pagada.");
  if (!hayBaseConfigurada()) {
    pago.pagadoAt = hoy();
    const p = proyectos.find((x) => x.id === proyectoId)!;
    p.estado = "en_curso";
    p.montoLiberadoArs = pago.montoArs;
    return;
  }
  await enTransaccion(async (q) => {
    await q("update pagos_compra set pagado_at = now(), pagado_por = $2 where proyecto_id = $1", [
      proyectoId,
      actor,
    ]);
    await q("update proyectos set estado = 'en_curso', monto_liberado_ars = $2 where id = $1", [
      proyectoId,
      pago.montoArs,
    ]);
    await q(
      `insert into auditoria (actor, accion, entidad, entidad_id, cambios)
       values ($1, 'pagar_compra', 'proyecto', $2, $3)`,
      [actor, proyectoId, JSON.stringify({ monto: pago.montoArs, vendedor: pago.vendedor })],
    );
  });
}

// ---------------------------------------------------------------------------
// 3. El seguimiento
// ---------------------------------------------------------------------------

export interface DatosPesada {
  fecha: string;
  cabezas: number;
  pesoPromedioKg: number;
  gastoArs: number;
  conceptoGasto: string;
  nota?: string;
}

/** Guarda una pesada del lote. */
export async function registrarPesada(actor: string, proyectoId: string, d: DatosPesada) {
  const p = await getProyecto(proyectoId);
  if (!p || p.estado !== "en_curso") throw new Error("Las pesadas se cargan con el ciclo en curso.");
  const previas = await getSeguimientoDeProyecto(proyectoId);
  if (previas.some((r) => r.fecha === d.fecha)) throw new Error("Ya hay una pesada cargada ese día.");
  const concepto = d.conceptoGasto.trim() || "Sin gastos en el período";

  if (!hayBaseConfigurada()) {
    seguimiento.push({ id: randomUUID(), proyectoId, ...d, conceptoGasto: concepto, mortandad: 0 });
    seguimiento.sort((a, b) => a.fecha.localeCompare(b.fecha));
    return;
  }
  await enTransaccion(async (q) => {
    await q(
      `insert into seguimiento (proyecto_id, fecha, cabezas, peso_promedio_kg, gasto_ars,
         concepto_gasto, nota)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [proyectoId, d.fecha, d.cabezas, d.pesoPromedioKg, d.gastoArs, concepto, d.nota || null],
    );
    await q(
      `insert into auditoria (actor, accion, entidad, entidad_id, cambios)
       values ($1, 'registrar_pesada', 'proyecto', $2, $3)`,
      [actor, proyectoId, JSON.stringify(d)],
    );
  });
}

/**
 * Lo que se esperaba pesar ese día: una recta del peso de entrada al objetivo a
 * lo largo del plazo. Es la vara del informe mensual, no una promesa.
 */
export function pesoEsperado(p: Proyecto, inicio: string, fecha: string): number {
  const dias = Math.max(0, (new Date(fecha).getTime() - new Date(inicio).getTime()) / 86_400_000);
  const avance = Math.min(1, dias / p.plazoDias);
  return Math.round(p.pesoEntradaKg + (p.pesoSalidaObjetivoKg - p.pesoEntradaKg) * avance);
}

// ---------------------------------------------------------------------------
// 4. Cierre y liquidación
// ---------------------------------------------------------------------------

export interface DatosVenta {
  dteSalida: string;
  cabezas: number;
  kilosVivos: number;
  kgCarne: number;
  precioKgArs: number;
}

export interface Reparto {
  venta: number;
  parteColaboradores: number;
  fiduciario: number;
  impuesto: number;
  /** Lo que queda en la cuenta del proyecto sin usar en la compra: vuelve también. */
  sobrante: number;
  netoColaboradores: number;
  parteProductor: number;
  comisionExito: number;
  porColaborador: { colaboradorId: string; capital: number; recibe: number }[];
}

/**
 * La cascada del trabajo, con los números reales de la venta. La parte de los
 * colaboradores paga al fiduciario (2 kg por cabeza vendida) y el impuesto al
 * cobrar; lo que queda se reparte en proporción a lo que cada uno acreditó.
 */
export function calcularReparto(p: Proyecto, aps: Aporte[], montoCompra: number, v: DatosVenta): Reparto {
  const pct = (p.condiciones.participacion?.colaboradoresPct ?? 0) / 100;
  const venta = v.kilosVivos * v.precioKgArs;
  const parte = venta * pct;
  const fiduciario = v.cabezas * FIDUCIARIO_KG_POR_CABEZA * v.precioKgArs * pct;
  const impuesto = parte * IMPUESTO_CHEQUE;
  const vivos = aps.filter((a) => a.estado !== "devuelto" && a.montoAcreditadoArs > 0);
  const capitalTotal = vivos.reduce((a, x) => a + x.montoAcreditadoArs, 0);
  const sobrante = Math.max(0, capitalTotal - montoCompra);
  const neto = parte - fiduciario - impuesto + sobrante;
  const parteProductor = venta - parte;

  const porId = new Map<string, number>();
  for (const a of vivos) porId.set(a.colaboradorId, (porId.get(a.colaboradorId) ?? 0) + a.montoAcreditadoArs);

  return {
    venta,
    parteColaboradores: parte,
    fiduciario,
    impuesto,
    sobrante,
    netoColaboradores: neto,
    parteProductor,
    comisionExito: parteProductor * 0.015,
    porColaborador: [...porId].map(([colaboradorId, capital]) => ({
      colaboradorId,
      capital,
      recibe: Math.round(capitalTotal > 0 ? (neto * capital) / capitalTotal : 0),
    })),
  };
}

/** Carga la venta, cierra el ciclo y deja calculada la liquidación de cada colaborador. */
export async function liquidarCiclo(actor: string, proyectoId: string, v: DatosVenta) {
  const p = await getProyecto(proyectoId);
  if (!p || p.estado !== "en_curso") throw new Error("El ciclo no está en curso.");
  const pago = await getPagoCompra(proyectoId);
  const compra = pago?.montoArs ?? p.montoLiberadoArs;
  const aps = await getAportesDeProyecto(proyectoId);
  const r = calcularReparto(p, aps, compra, v);
  const rendimiento = v.kilosVivos > 0 ? (v.kgCarne / v.kilosVivos) * 100 : 0;
  const concepto = `Liquidación del ciclo — ${p.titulo}`;

  if (!hayBaseConfigurada()) {
    const pm = proyectos.find((x) => x.id === proyectoId)!;
    pm.estado = "cerrado";
    pm.resultado = {
      dteSalida: v.dteSalida,
      cabezasFaena: v.cabezas,
      kilosVivos: v.kilosVivos,
      kgCarne: v.kgCarne,
      rendimientoPct: Math.round(rendimiento * 100) / 100,
      fecha: hoy(),
    };
    for (const c of r.porColaborador) {
      liquidaciones.push({
        id: randomUUID(),
        proyectoId,
        colaboradorId: c.colaboradorId,
        concepto,
        capitalArs: c.capital,
        resultadoArs: c.recibe - c.capital,
        estado: "calculada",
        fecha: hoy(),
      });
    }
    return r;
  }
  await enTransaccion(async (q) => {
    await q(
      `update proyectos set estado = 'cerrado', resultado_dte_salida = $2, resultado_cabezas_faena = $3,
              resultado_kilos_vivos = $4, resultado_kg_carne = $5, resultado_rendimiento_pct = $6,
              resultado_fecha = current_date
        where id = $1`,
      [proyectoId, v.dteSalida, v.cabezas, v.kilosVivos, v.kgCarne, rendimiento.toFixed(2)],
    );
    for (const c of r.porColaborador) {
      await q(
        `insert into liquidaciones (proyecto_id, colaborador_id, concepto, capital_ars, resultado_ars, fecha)
         values ($1, $2, $3, $4, $5, current_date)`,
        [proyectoId, c.colaboradorId, concepto, c.capital, c.recibe - c.capital],
      );
    }
    await q(
      `insert into auditoria (actor, accion, entidad, entidad_id, cambios)
       values ($1, 'liquidar_ciclo', 'proyecto', $2, $3)`,
      [actor, proyectoId, JSON.stringify({ venta: v, reparto: { ...r, porColaborador: undefined } })],
    );
  });
  return r;
}

export interface LiquidacionDeProyecto {
  id: string;
  colaboradorId: string;
  capitalArs: number;
  resultadoArs: number;
  estado: "calculada" | "aprobada" | "pagada";
}

export async function getLiquidacionesDeProyecto(proyectoId: string): Promise<LiquidacionDeProyecto[]> {
  if (!hayBaseConfigurada()) return liquidaciones.filter((l) => l.proyectoId === proyectoId);
  const fs = await consultar<{
    id: string;
    colaborador_id: string;
    capital_ars: string;
    resultado_ars: string;
    estado: LiquidacionDeProyecto["estado"];
  }>("select id, colaborador_id, capital_ars, resultado_ars, estado from liquidaciones where proyecto_id = $1", [
    proyectoId,
  ]);
  return fs.map((f) => ({
    id: f.id,
    colaboradorId: f.colaborador_id,
    capitalArs: Number(f.capital_ars),
    resultadoArs: Number(f.resultado_ars),
    estado: f.estado,
  }));
}

/** Calculada → aprobada → pagada, todas las del proyecto juntas. */
export async function avanzarLiquidaciones(actor: string, proyectoId: string, a: "aprobada" | "pagada") {
  const desde = a === "aprobada" ? "calculada" : "aprobada";
  const ls = (await getLiquidacionesDeProyecto(proyectoId)).filter((l) => l.estado === desde);
  if (!ls.length) throw new Error(a === "aprobada" ? "No hay liquidaciones por aprobar." : "No hay liquidaciones aprobadas.");
  if (!hayBaseConfigurada()) {
    for (const l of liquidaciones.filter((x) => x.proyectoId === proyectoId && x.estado === desde)) {
      l.estado = a;
      if (a === "pagada") l.pagadaAt = hoy();
    }
    return;
  }
  await enTransaccion(async (q) => {
    await q(
      a === "pagada"
        ? "update liquidaciones set estado = 'pagada', pagada_at = current_date where proyecto_id = $1 and estado = 'aprobada'"
        : "update liquidaciones set estado = 'aprobada' where proyecto_id = $1 and estado = 'calculada'",
      [proyectoId],
    );
    await q(
      `insert into auditoria (actor, accion, entidad, entidad_id) values ($1, $2, 'proyecto', $3)`,
      [actor, a === "pagada" ? "pagar_liquidaciones" : "aprobar_liquidaciones", proyectoId],
    );
  });
}
