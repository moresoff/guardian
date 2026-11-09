import "server-only";
import { consultar, enTransaccion, hayBaseConfigurada } from "@/lib/db/conexion";
import {
  getDiscrepanciasDeProyecto,
  getDocumentosVigentesDeProyecto,
  getProyecto,
} from "@/lib/data";
import { aportes, colaboradores, discrepancias, documentos, proyectos } from "@/lib/data/seed";
import { getFirmaFideicomiso } from "@/lib/firmas";
import { documentosRequeridos } from "@/lib/format";
import { puedePublicarse } from "@/lib/proyecto";

/**
 * Lo que hace quien valida: revisar cada papel, resolver las diferencias,
 * publicar o rechazar el proyecto, y confirmar las transferencias que informa el
 * banco. Cada acción deja su asiento en `auditoria` con quién la hizo.
 *
 * Sin base configurada se escribe en el seed en memoria, como el resto.
 */

const hoy = () => new Date().toISOString().slice(0, 10);

const memoriaMotivos = globalThis as unknown as { motivosRechazo?: Map<string, string> };
const motivos = () => (memoriaMotivos.motivosRechazo ??= new Map());

export async function verificarDocumento(actor: string, documentoId: string) {
  const doc = documentos.find((d) => d.id === documentoId);
  if (!hayBaseConfigurada()) {
    if (!doc) throw new Error("No existe el documento.");
    if (doc.tipo === "dte" && !doc.cuve) throw new Error("Un DT-e se verifica con su CUVE, y este no lo tiene.");
    doc.estadoAutenticidad = "verificada";
    doc.observacionAdmin = undefined;
    return;
  }
  await enTransaccion(async (q) => {
    const [d] = await q<{ tipo: string; cuve: string | null }>(
      "select tipo, cuve from documentos where id = $1 for update",
      [documentoId],
    );
    if (!d) throw new Error("No existe el documento.");
    if (d.tipo === "dte" && !d.cuve) throw new Error("Un DT-e se verifica con su CUVE, y este no lo tiene.");
    await q(
      "update documentos set estado_autenticidad = 'verificada', observacion_admin = null where id = $1",
      [documentoId],
    );
    await q(
      `insert into auditoria (actor, accion, entidad, entidad_id) values ($1, 'verificar_documento', 'documento', $2)`,
      [actor, documentoId],
    );
  });
}

export async function rechazarDocumento(actor: string, documentoId: string, motivo: string) {
  if (!hayBaseConfigurada()) {
    const doc = documentos.find((d) => d.id === documentoId);
    if (!doc) throw new Error("No existe el documento.");
    doc.estadoAutenticidad = "rechazada";
    doc.observacionAdmin = motivo;
    return;
  }
  await enTransaccion(async (q) => {
    await q(
      "update documentos set estado_autenticidad = 'rechazada', observacion_admin = $2 where id = $1",
      [documentoId, motivo],
    );
    await q(
      `insert into auditoria (actor, accion, entidad, entidad_id, motivo)
       values ($1, 'rechazar_documento', 'documento', $2, $3)`,
      [actor, documentoId, motivo],
    );
  });
}

export async function resolverDiscrepancia(actor: string, discrepanciaId: string, resolucion: string) {
  if (!hayBaseConfigurada()) {
    const d = discrepancias.find((x) => x.id === discrepanciaId);
    if (!d) throw new Error("No existe la diferencia.");
    d.resuelta = true;
    d.resolucion = resolucion;
    return;
  }
  await enTransaccion(async (q) => {
    await q("update discrepancias set resuelta = true, resolucion = $2 where id = $1", [
      discrepanciaId,
      resolucion,
    ]);
    await q(
      `insert into auditoria (actor, accion, entidad, entidad_id, motivo)
       values ($1, 'resolver_discrepancia', 'discrepancia', $2, $3)`,
      [actor, discrepanciaId, resolucion],
    );
  });
}

/**
 * Lo que impide publicar, en palabras. Es la misma regla que muestra el
 * checklist, evaluada otra vez en el servidor: un botón deshabilitado no es un
 * control.
 */
export async function bloqueosParaPublicar(proyectoId: string): Promise<string[]> {
  const p = await getProyecto(proyectoId);
  if (!p) return ["El proyecto no existe."];
  if (p.estado !== "en_validacion") return ["El proyecto no está en revisión."];
  const docs = await getDocumentosVigentesDeProyecto(p.id, p.productorId);
  const discs = await getDiscrepanciasDeProyecto(p.id);
  const cargados = new Set(docs.map((d) => d.tipo));
  const faltan = documentosRequeridos(p.tipoPosesion).filter((t) => !cargados.has(t)).length;
  const sinResolver = discs.filter((d) => !d.resuelta).length;
  const sinVerificar = docs.filter((d) => d.estadoAutenticidad !== "verificada").length;
  const firma = await getFirmaFideicomiso(p.id);

  const motivos: string[] = [];
  if (faltan) motivos.push(`Faltan ${faltan} documentos obligatorios.`);
  if (sinResolver) motivos.push(`${sinResolver} diferencias sin resolver.`);
  if (sinVerificar) motivos.push(`${sinVerificar} documentos sin verificar.`);
  if (!firma) motivos.push("El productor todavía no firmó el contrato del fideicomiso.");
  motivos.push(...puedePublicarse(p).motivos);
  return motivos;
}

export async function publicarProyecto(actor: string, proyectoId: string) {
  const bloqueos = await bloqueosParaPublicar(proyectoId);
  if (bloqueos.length) throw new Error(bloqueos[0]);
  if (!hayBaseConfigurada()) {
    const p = proyectos.find((x) => x.id === proyectoId)!;
    p.estado = "abierto";
    p.publicadoAt = hoy();
    return;
  }
  await enTransaccion(async (q) => {
    await q("update proyectos set estado = 'abierto', publicado_at = current_date where id = $1", [proyectoId]);
    await q(
      `insert into auditoria (actor, accion, entidad, entidad_id) values ($1, 'publicar', 'proyecto', $2)`,
      [actor, proyectoId],
    );
  });
}

export async function rechazarProyecto(actor: string, proyectoId: string, motivo: string) {
  if (!hayBaseConfigurada()) {
    const p = proyectos.find((x) => x.id === proyectoId);
    if (!p || p.estado !== "en_validacion") throw new Error("El proyecto no está en revisión.");
    p.estado = "rechazado";
    motivos().set(proyectoId, motivo);
    return;
  }
  await enTransaccion(async (q) => {
    const filas = await q(
      "update proyectos set estado = 'rechazado' where id = $1 and estado = 'en_validacion' returning id",
      [proyectoId],
    );
    if (!filas.length) throw new Error("El proyecto no está en revisión.");
    await q(
      `insert into auditoria (actor, accion, entidad, entidad_id, motivo)
       values ($1, 'rechazar', 'proyecto', $2, $3)`,
      [actor, proyectoId, motivo],
    );
  });
}

/** Por qué se rechazó un proyecto, para mostrárselo al productor. */
export async function getMotivoRechazo(proyectoId: string): Promise<string | null> {
  if (!hayBaseConfigurada()) return motivos().get(proyectoId) ?? null;
  const [f] = await consultar<{ motivo: string | null }>(
    `select motivo from auditoria where entidad = 'proyecto' and entidad_id = $1 and accion = 'rechazar'
      order by ocurrido_at desc limit 1`,
    [proyectoId],
  );
  return f?.motivo ?? null;
}

export interface TransferenciaPendiente {
  aporteId: string;
  orden: string;
  monto: number;
  proyectoId: string;
  proyecto: string;
  colaborador: string;
  fecha: string;
}

/** Las adhesiones firmadas cuya transferencia todavía no informó el banco. */
export async function getTransferenciasPendientes(): Promise<TransferenciaPendiente[]> {
  if (!hayBaseConfigurada()) {
    return aportes
      .filter((a) => a.estado === "pendiente_acreditacion")
      .map((a) => ({
        aporteId: a.id,
        orden: a.ordenSuscripcion,
        monto: a.montoComprometidoArs,
        proyectoId: a.proyectoId,
        proyecto: proyectos.find((p) => p.id === a.proyectoId)?.titulo ?? a.proyectoId,
        colaborador: colaboradores.find((c) => c.id === a.colaboradorId)?.nombre ?? a.colaboradorId,
        fecha: a.adhesionAt,
      }));
  }
  const filas = await consultar<{
    id: string;
    orden_suscripcion: string;
    monto_comprometido_ars: string;
    proyecto_id: string;
    titulo: string;
    nombre: string;
    adhesion_at: Date;
  }>(
    `select a.id, a.orden_suscripcion, a.monto_comprometido_ars, a.proyecto_id, p.titulo,
            c.nombre, a.adhesion_at
       from aportes a
       join proyectos p on p.id = a.proyecto_id
       join colaboradores c on c.id = a.colaborador_id
      where a.estado = 'pendiente_acreditacion'
      order by a.adhesion_at, a.orden_suscripcion`,
  );
  return filas.map((f) => ({
    aporteId: f.id,
    orden: f.orden_suscripcion,
    monto: Number(f.monto_comprometido_ars),
    proyectoId: f.proyecto_id,
    proyecto: f.titulo,
    colaborador: f.nombre,
    fecha: f.adhesion_at.toISOString().slice(0, 10),
  }));
}

/**
 * El banco informó la transferencia: se registra el movimiento, el aporte pasa a
 * acreditado y suma a lo recaudado. La referencia del movimiento es la orden de
 * suscripción, así que confirmar dos veces no duplica nada.
 */
export async function acreditarAporte(actor: string, aporteId: string) {
  if (!hayBaseConfigurada()) {
    const a = aportes.find((x) => x.id === aporteId);
    if (!a || a.estado !== "pendiente_acreditacion") throw new Error("La transferencia ya estaba confirmada.");
    a.estado = "acreditado";
    a.montoAcreditadoArs = a.montoComprometidoArs;
    a.movimientos.push({
      id: `mov-${a.ordenSuscripcion}`,
      referenciaExterna: `BCO-${a.ordenSuscripcion}`,
      importeArs: a.montoComprometidoArs,
      fecha: hoy(),
      estadoConciliacion: "conciliado",
    });
    const p = proyectos.find((x) => x.id === a.proyectoId);
    if (p) {
      p.montoRecaudadoArs += a.montoComprometidoArs;
      if (p.estado === "abierto" && p.montoRecaudadoArs >= p.montoObjetivoArs) p.estado = "fondeado";
    }
    return;
  }
  await enTransaccion(async (q) => {
    const [a] = await q<{ proyecto_id: string; monto: string; orden: string }>(
      `update aportes set estado = 'acreditado', monto_acreditado_ars = monto_comprometido_ars
        where id = $1 and estado = 'pendiente_acreditacion'
        returning proyecto_id, monto_comprometido_ars as monto, orden_suscripcion as orden`,
      [aporteId],
    );
    if (!a) throw new Error("La transferencia ya estaba confirmada.");
    await q(
      `insert into movimientos_bancarios (aporte_id, referencia_externa, importe_ars, fecha, estado_conciliacion)
       values ($1, $2, $3, current_date, 'conciliado')`,
      [aporteId, `BCO-${a.orden}`, a.monto],
    );
    await q(
      `update proyectos set monto_recaudado_ars = monto_recaudado_ars + $2,
              estado = case when estado = 'abierto' and monto_recaudado_ars + $2 >= monto_objetivo_ars
                            then 'fondeado'::estado_proyecto else estado end
        where id = $1`,
      [a.proyecto_id, a.monto],
    );
    await q(
      `insert into auditoria (actor, accion, entidad, entidad_id, cambios)
       values ($1, 'acreditar_aporte', 'aporte', $2, $3)`,
      [actor, aporteId, JSON.stringify({ orden: a.orden, importe: Number(a.monto) })],
    );
  });
}
