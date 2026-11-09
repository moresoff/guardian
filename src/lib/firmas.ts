import "server-only";
import { createHash, randomInt, randomUUID } from "node:crypto";
import { textoParaFirmar, type Contrato } from "@/lib/contrato";
import { consultar, enTransaccion, hayBaseConfigurada } from "@/lib/db/conexion";
import { aportes } from "@/lib/data/seed";

/**
 * Las firmas de los contratos. La firma electrónica está simulada: un código de
 * un solo uso que la pantalla muestra en vez de mandarlo por SMS o correo. Lo que
 * sí es real es lo que queda registrado: quién firmó, qué versión, la huella del
 * texto que tuvo delante y cuándo.
 */

export const METODO_FIRMA = "Firma electrónica con código de un solo uso (simulada)";

export interface Firma {
  version: string;
  hash: string;
  fecha: string;
  fiduciario: string;
}

const huella = (c: Contrato) => createHash("sha256").update(textoParaFirmar(c)).digest("hex");
const hoy = () => new Date().toISOString().slice(0, 10);

const global_ = globalThis as unknown as { firmasGuardian?: Map<string, Firma> };
const enMemoria = () => (global_.firmasGuardian ??= new Map());

/** La firma del productor sobre el fideicomiso de su proyecto, si existe. */
export async function getFirmaFideicomiso(proyectoId: string): Promise<Firma | null> {
  if (!hayBaseConfigurada()) return enMemoria().get(`fid:${proyectoId}`) ?? null;
  const filas = await consultar<{
    contrato_version: string;
    contrato_hash: string;
    firmado_at: Date;
    fiduciario: string;
  }>(
    `select contrato_version, contrato_hash, firmado_at, fiduciario from firmas
      where proyecto_id = $1 and documento = 'fideicomiso'`,
    [proyectoId],
  );
  const f = filas[0];
  return f
    ? {
        version: f.contrato_version,
        hash: f.contrato_hash,
        fecha: f.firmado_at.toISOString().slice(0, 10),
        fiduciario: f.fiduciario,
      }
    : null;
}

export async function firmarFideicomiso(
  perfilId: string,
  proyectoId: string,
  contrato: Contrato,
): Promise<Firma> {
  const firma: Firma = {
    version: contrato.version,
    hash: huella(contrato),
    fecha: hoy(),
    fiduciario: contrato.fiduciario,
  };
  if (!hayBaseConfigurada()) {
    enMemoria().set(`fid:${proyectoId}`, firma);
    return firma;
  }
  await enTransaccion(async (q) => {
    await q(
      `insert into firmas (perfil_id, proyecto_id, rol, documento, contrato_version,
         contrato_hash, fiduciario, metodo)
       values ($1, $2, 'productor', 'fideicomiso', $3, $4, $5, $6)`,
      [perfilId, proyectoId, firma.version, firma.hash, firma.fiduciario, METODO_FIRMA],
    );
    await q(
      `insert into auditoria (actor, accion, entidad, entidad_id, cambios)
       values ($1, 'firmar_fideicomiso', 'proyecto', $2, $3)`,
      [perfilId, proyectoId, JSON.stringify({ version: firma.version, hash: firma.hash })],
    );
  });
  return firma;
}

/** Un número de orden que no se repite: lo emite el servidor, no el navegador. */
const nuevaOrden = () =>
  `GDN-${new Date().getFullYear()}-${String(randomInt(100_000, 1_000_000))}`;

/**
 * La adhesión del colaborador: firma el contrato y queda una orden de
 * suscripción. El aporte nace pendiente: existe cuando el banco lo acredita.
 */
export async function firmarAdhesion(
  perfilId: string,
  colaboradorId: string,
  proyectoId: string,
  monto: number,
  contrato: Contrato,
): Promise<{ orden: string; firma: Firma }> {
  const firma: Firma = {
    version: contrato.version,
    hash: huella(contrato),
    fecha: hoy(),
    fiduciario: contrato.fiduciario,
  };

  if (!hayBaseConfigurada()) {
    const orden = nuevaOrden();
    aportes.push({
      id: randomUUID(),
      proyectoId,
      colaboradorId,
      ordenSuscripcion: orden,
      montoComprometidoArs: monto,
      montoAcreditadoArs: 0,
      moneda: "ARS",
      estado: "pendiente_acreditacion",
      adhesionAt: hoy(),
      contratoVersion: contrato.version,
      movimientos: [],
    });
    return { orden, firma };
  }

  // Si la orden choca con una existente, se prueba con otra: la columna es única.
  for (let intento = 0; intento < 5; intento++) {
    const orden = nuevaOrden();
    try {
      await enTransaccion(async (q) => {
        const [aporte] = await q<{ id: string }>(
          `insert into aportes (proyecto_id, colaborador_id, orden_suscripcion,
             monto_comprometido_ars, contrato_version)
           values ($1, $2, $3, $4, $5) returning id`,
          [proyectoId, colaboradorId, orden, monto, contrato.version],
        );
        await q(
          `insert into firmas (perfil_id, proyecto_id, rol, documento, contrato_version,
             contrato_hash, fiduciario, metodo, aporte_id)
           values ($1, $2, 'colaborador', 'adhesion', $3, $4, $5, $6, $7)`,
          [perfilId, proyectoId, firma.version, firma.hash, firma.fiduciario, METODO_FIRMA, aporte.id],
        );
        await q(
          `insert into auditoria (actor, accion, entidad, entidad_id, cambios)
           values ($1, 'firmar_adhesion', 'aporte', $2, $3)`,
          [perfilId, aporte.id, JSON.stringify({ proyecto: proyectoId, monto, orden, hash: firma.hash })],
        );
      });
      return { orden, firma };
    } catch (e) {
      if ((e as { code?: string }).code !== "23505") throw e;
    }
  }
  throw new Error("No se pudo emitir un número de orden.");
}
