"use server";

import { revalidatePath } from "next/cache";
import { validarArchivo } from "@/lib/almacen";
import { colaboradorDeSesion } from "@/lib/cuentas";
import { hayBaseConfigurada } from "@/lib/db/conexion";
import {
  guardarVerificacion,
  marcarColaboradorEnMemoria,
  type DatosIdentidad,
  type EstadoVerificacion,
} from "@/lib/identidad";
import { ORIGENES_FONDOS, cuitCorrespondeADni, edad } from "@/lib/kyc";
import { PROVINCIAS } from "@/lib/provincias";
import { usuarioActual } from "@/lib/sesion";

const texto = (f: FormData, k: string, max = 120) => String(f.get(k) ?? "").trim().slice(0, max);
const digitos = (f: FormData, k: string) => texto(f, k, 40).replace(/\D/g, "");

/**
 * Guarda la validación de identidad: los datos declarados, las fotos del DNI y
 * la selfie. Revisa todo de nuevo: el navegador no es de fiar.
 */
export async function validarIdentidad(
  f: FormData,
): Promise<{ ok: true; estado: EstadoVerificacion } | { ok: false; error: string }> {
  const u = await usuarioActual();
  if (!u) return { ok: false, error: "Tu sesión se cerró. Volvé a ingresar." };

  const sexo = texto(f, "sexo");
  const pep = texto(f, "pep");
  const sujeto = texto(f, "sujetoObligado");
  const d: DatosIdentidad = {
    nombre: texto(f, "nombre"),
    apellido: texto(f, "apellido"),
    dni: digitos(f, "dni"),
    fechaNacimiento: texto(f, "fechaNacimiento", 10),
    sexo: sexo as DatosIdentidad["sexo"],
    nacionalidad: texto(f, "nacionalidad", 60),
    cuit: digitos(f, "cuit"),
    domicilio: texto(f, "domicilio", 200),
    localidad: texto(f, "localidad"),
    provincia: texto(f, "provincia", 60),
    ocupacion: texto(f, "ocupacion"),
    pep: pep === "si",
    sujetoObligado: sujeto === "si",
    origenFondos: texto(f, "origenFondos") || null,
    cbu: digitos(f, "cbu") || null,
  };

  if (!d.nombre || !d.apellido) return { ok: false, error: "Falta tu nombre o tu apellido." };
  if (!/^\d{7,8}$/.test(d.dni)) return { ok: false, error: "El DNI tiene 7 u 8 números." };
  const e = edad(d.fechaNacimiento);
  if (e < 18 || e > 110) return { ok: false, error: "Revisá la fecha de nacimiento: tenés que ser mayor de edad." };
  if (!["F", "M", "X"].includes(d.sexo)) return { ok: false, error: "Elegí el sexo que figura en tu DNI." };
  if (!d.nacionalidad) return { ok: false, error: "Falta la nacionalidad." };
  if (d.cuit.length !== 11) return { ok: false, error: "El CUIT o CUIL tiene 11 números." };
  if (!cuitCorrespondeADni(d.cuit, d.dni))
    return { ok: false, error: "El CUIT o CUIL no corresponde a ese DNI." };
  if (!d.domicilio || !d.localidad) return { ok: false, error: "Falta tu domicilio." };
  if (!PROVINCIAS.includes(d.provincia)) return { ok: false, error: "Elegí la provincia." };
  if (!d.ocupacion) return { ok: false, error: "Contanos a qué te dedicás." };
  if (!["si", "no"].includes(pep) || !["si", "no"].includes(sujeto))
    return { ok: false, error: "Respondé las dos preguntas de la declaración." };
  if (d.origenFondos && !(ORIGENES_FONDOS as readonly string[]).includes(d.origenFondos))
    return { ok: false, error: "Elegí de dónde viene el dinero." };
  if (u.lado === "colaborador" && !d.origenFondos)
    return { ok: false, error: "Contanos de dónde viene el dinero con el que participás." };
  if (!d.cbu || d.cbu.length !== 22) return { ok: false, error: "El CBU tiene 22 números." };
  if (f.get("declaro") !== "si")
    return { ok: false, error: "Falta que confirmes que los datos son verdaderos." };

  const frente = await validarArchivo(f.get("dniFrente"), true);
  if ("error" in frente) return { ok: false, error: `Foto del frente del DNI: ${frente.error}` };
  const dorso = await validarArchivo(f.get("dniDorso"), true);
  if ("error" in dorso) return { ok: false, error: `Foto del dorso del DNI: ${dorso.error}` };
  const selfie = await validarArchivo(f.get("selfie"), true);
  if ("error" in selfie) return { ok: false, error: `Selfie: ${selfie.error}` };

  try {
    const v = await guardarVerificacion(u.id, u.lado, d, { frente, dorso, selfie });
    if (!hayBaseConfigurada() && u.lado === "colaborador" && v.estado === "aprobada")
      marcarColaboradorEnMemoria(await colaboradorDeSesion(), d.cbu);
    // No se refresca /identidad: la pantalla de «listo» es del formulario.
    revalidatePath("/productor");
    revalidatePath("/colaborador/cartera");
    return { ok: true, estado: v.estado };
  } catch (err) {
    console.error("No se pudo guardar la validación de identidad:", err);
    return { ok: false, error: "No pudimos guardar tus datos. Probá de nuevo en un rato." };
  }
}
