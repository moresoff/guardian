import "server-only";
import { randomUUID } from "node:crypto";
import { guardarArchivo, type ArchivoValidado } from "@/lib/almacen";
import { consultar, enTransaccion, hayBaseConfigurada } from "@/lib/db/conexion";
import { colaboradores } from "@/lib/data/seed";

/**
 * La validación de identidad (KYC). El trabajo pide reconocimiento del
 * documento, prueba de vida y comparación facial contra la foto del DNI.
 *
 * Mientras no haya proveedor contratado, esas tres pruebas están simuladas: las
 * fotos se guardan de verdad en el almacenamiento privado y los datos quedan en
 * `verificaciones_identidad`, pero el resultado lo decide esta función y no un
 * servicio externo. El método guardado lo dice, para que nadie lo confunda con
 * una verificación real.
 *
 * Lo que sí es real es lo que se pide declarar: es lo que la normativa de
 * prevención de lavado (UIF) exige conocer de un cliente.
 */

export const METODO_SIMULADO =
  "Simulación: DNI, prueba de vida y comparación facial (sin proveedor)";

export interface DatosIdentidad {
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  sexo: "F" | "M" | "X";
  nacionalidad: string;
  cuit: string;
  domicilio: string;
  localidad: string;
  provincia: string;
  ocupacion: string;
  pep: boolean;
  sujetoObligado: boolean;
  origenFondos: string | null;
  cbu: string | null;
}

export type EstadoVerificacion = "aprobada" | "en_revision" | "rechazada";

export interface Verificacion {
  estado: EstadoVerificacion;
  metodo: string;
  fecha: string;
  nombre: string;
  apellido: string;
  coincidenciaFacial: number;
  /** Lo que declaró, para mostrarlo en «Mis datos» sin volver a pedirlo. */
  dni: string;
  cuit: string;
  domicilio: string;
  cbu: string | null;
}

const global_ = globalThis as unknown as { identidadesGuardian?: Map<string, Verificacion> };
const enMemoria = () => (global_.identidadesGuardian ??= new Map());

export async function getVerificacion(perfilId: string): Promise<Verificacion | null> {
  if (!hayBaseConfigurada()) return enMemoria().get(perfilId) ?? null;
  const filas = await consultar<{
    estado: EstadoVerificacion;
    metodo: string;
    verificada_at: Date;
    nombre: string;
    apellido: string;
    coincidencia_facial: string;
    dni: string;
    cuit: string;
    domicilio: string;
    localidad: string;
    provincia: string;
    cbu: string | null;
  }>(
    `select estado, metodo, verificada_at, nombre, apellido, coincidencia_facial,
            dni, cuit, domicilio, localidad, provincia, cbu
       from verificaciones_identidad where perfil_id = $1
      order by verificada_at desc limit 1`,
    [perfilId],
  );
  const f = filas[0];
  return f
    ? {
        estado: f.estado,
        metodo: f.metodo,
        fecha: f.verificada_at.toISOString().slice(0, 10),
        nombre: f.nombre,
        apellido: f.apellido,
        coincidenciaFacial: Number(f.coincidencia_facial),
        dni: f.dni,
        cuit: f.cuit,
        domicilio: [f.domicilio, f.localidad, f.provincia].filter(Boolean).join(", "),
        cbu: f.cbu,
      }
    : null;
}

/**
 * Guarda la validación. Una persona expuesta políticamente (PEP) no se aprueba
 * sola: la norma pide una debida diligencia reforzada, así que queda en revisión
 * para que la mire una persona.
 */
export async function guardarVerificacion(
  perfilId: string,
  lado: "productor" | "colaborador",
  d: DatosIdentidad,
  fotos: { frente: ArchivoValidado; dorso: ArchivoValidado; selfie: ArchivoValidado },
): Promise<Verificacion> {
  const id = randomUUID();
  const base = `identidad/${perfilId}/${id}`;
  const [frente, dorso, selfie] = await Promise.all([
    guardarArchivo(`${base}-dni-frente.${fotos.frente.extension}`, fotos.frente),
    guardarArchivo(`${base}-dni-dorso.${fotos.dorso.extension}`, fotos.dorso),
    guardarArchivo(`${base}-selfie.${fotos.selfie.extension}`, fotos.selfie),
  ]);

  // El resultado simulado: la prueba de vida pasa y la coincidencia es alta.
  const coincidenciaFacial = 0.97;
  const estado: EstadoVerificacion = d.pep ? "en_revision" : "aprobada";
  const hoy = new Date().toISOString().slice(0, 10);
  const v: Verificacion = {
    estado,
    metodo: METODO_SIMULADO,
    fecha: hoy,
    nombre: d.nombre,
    apellido: d.apellido,
    coincidenciaFacial,
    dni: d.dni,
    cuit: d.cuit,
    domicilio: `${d.domicilio}, ${d.localidad}, ${d.provincia}`,
    cbu: d.cbu,
  };

  if (!hayBaseConfigurada()) {
    enMemoria().set(perfilId, v);
    return v;
  }

  await enTransaccion(async (q) => {
    await q(
      `insert into verificaciones_identidad (id, perfil_id, nombre, apellido, dni,
         fecha_nacimiento, sexo, nacionalidad, cuit, domicilio, localidad, provincia, ocupacion,
         pep, sujeto_obligado, origen_fondos, cbu, dni_frente_ruta, dni_dorso_ruta, selfie_ruta,
         prueba_de_vida, coincidencia_facial, estado, metodo)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
               $19, $20, true, $21, $22, $23)`,
      [
        id, perfilId, d.nombre, d.apellido, d.dni, d.fechaNacimiento, d.sexo, d.nacionalidad,
        d.cuit, d.domicilio, d.localidad, d.provincia, d.ocupacion, d.pep, d.sujetoObligado,
        d.origenFondos, d.cbu, frente, dorso, selfie, coincidenciaFacial, estado, METODO_SIMULADO,
      ],
    );
    // La ficha del colaborador muestra la identidad y la cuenta de devolución.
    if (lado === "colaborador" && estado === "aprobada") {
      await q(
        `update colaboradores
            set identidad_metodo = $2, identidad_fecha = current_date,
                cbu_devolucion = coalesce($3, cbu_devolucion)
          where perfil_id = $1`,
        [perfilId, METODO_SIMULADO, d.cbu],
      );
    }
    await q(
      `insert into auditoria (actor, accion, entidad, entidad_id, cambios)
       values ($1, 'validar_identidad', 'perfil', $1, $2)`,
      [perfilId, JSON.stringify({ estado, metodo: METODO_SIMULADO, verificacion: id })],
    );
  });
  return v;
}

/** En memoria la ficha del colaborador se actualiza aparte: vive en el seed. */
export function marcarColaboradorEnMemoria(colaboradorId: string, cbu: string | null) {
  const c = colaboradores.find((x) => x.id === colaboradorId);
  if (!c) return;
  c.identidad = { metodo: METODO_SIMULADO, fecha: new Date().toISOString().slice(0, 10) };
  if (cbu) c.cbuDevolucion = cbu;
}
