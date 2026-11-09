"use server";

import { revalidatePath } from "next/cache";
import { validarArchivo } from "@/lib/almacen";
import { productorDeSesion } from "@/lib/cuentas";
import { agregarDocumento } from "@/lib/escrituras";
import type { Lectura } from "@/lib/lectura";
import { usuarioActual } from "@/lib/sesion";
import type { TipoDocumento } from "@/lib/types";

const TIPOS: TipoDocumento[] = [
  "renspa",
  "dte",
  "romaneo",
  "boleto_compraventa",
  "listado_rfid",
  "poliza_seguro",
  "otro",
];

/**
 * Sube un papel a un proyecto ya presentado. Queda en el almacenamiento privado
 * y en la base, con lo leído. Solo el dueño del proyecto.
 */
export async function subirDocumento(
  f: FormData,
): Promise<{ ok: true; lectura: Lectura } | { ok: false; error: string }> {
  const usuario = await usuarioActual();
  if (!usuario || usuario.lado !== "productor")
    return { ok: false, error: "Tu sesión se cerró. Volvé a ingresar." };

  const proyectoId = String(f.get("proyectoId") ?? "");
  const tipo = String(f.get("tipo") ?? "") as TipoDocumento;
  if (!TIPOS.includes(tipo)) return { ok: false, error: "Tipo de documento desconocido." };

  const archivo = await validarArchivo(f.get("archivo"));
  if ("error" in archivo) return { ok: false, error: archivo.error };

  try {
    const r = await agregarDocumento(
      usuario.id,
      await productorDeSesion(),
      proyectoId,
      tipo,
      archivo,
    );
    revalidatePath(`/proyectos/${proyectoId}`);
    return { ok: true, lectura: r.lectura };
  } catch (e) {
    console.error("No se pudo subir el documento:", e);
    return { ok: false, error: "No pudimos guardar el archivo. Probá de nuevo." };
  }
}
