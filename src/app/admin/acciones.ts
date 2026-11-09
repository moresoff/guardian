"use server";

import { revalidatePath } from "next/cache";
import { usuarioActual } from "@/lib/sesion";
import {
  acreditarAporte,
  publicarProyecto,
  rechazarDocumento,
  rechazarProyecto,
  resolverDiscrepancia,
  verificarDocumento,
} from "@/lib/validacion";

/**
 * Las acciones de quien valida. En la demo cualquier cuenta puede entrar a la
 * cola (así se decidió); lo que sí queda es quién hizo cada cosa, en `auditoria`.
 */

export type Resultado = { ok: true } | { ok: false; error: string };

async function actor(): Promise<string | null> {
  const u = await usuarioActual();
  return u ? u.id : null;
}

async function hacer(fn: (quien: string) => Promise<void>, rutas: string[] = []): Promise<Resultado> {
  const quien = await actor();
  if (!quien) return { ok: false, error: "Tu sesión se cerró. Volvé a ingresar." };
  try {
    await fn(quien);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo guardar." };
  }
  revalidatePath("/admin");
  for (const r of rutas) revalidatePath(r);
  return { ok: true };
}

const texto = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function accionVerificarDocumento(f: FormData) {
  return hacer((q) => verificarDocumento(q, texto(f, "documentoId")));
}

export async function accionRechazarDocumento(f: FormData) {
  const motivo = texto(f, "motivo");
  if (motivo.length < 5) return { ok: false, error: "Escribí por qué se rechaza." } as Resultado;
  return hacer((q) => rechazarDocumento(q, texto(f, "documentoId"), motivo));
}

export async function accionResolverDiscrepancia(f: FormData) {
  const resolucion = texto(f, "resolucion");
  if (resolucion.length < 5) return { ok: false, error: "Escribí cómo se resolvió." } as Resultado;
  return hacer((q) => resolverDiscrepancia(q, texto(f, "discrepanciaId"), resolucion));
}

export async function accionPublicar(f: FormData) {
  const id = texto(f, "proyectoId");
  return hacer((q) => publicarProyecto(q, id), [`/proyectos/${id}`, "/proyectos", "/productor"]);
}

export async function accionRechazarProyecto(f: FormData) {
  const id = texto(f, "proyectoId");
  const motivo = texto(f, "motivo");
  if (motivo.length < 5) return { ok: false, error: "Escribí el motivo: el productor lo va a leer." } as Resultado;
  return hacer((q) => rechazarProyecto(q, id, motivo), [`/proyectos/${id}`, "/productor"]);
}

export async function accionAcreditar(f: FormData) {
  return hacer((q) => acreditarAporte(q, texto(f, "aporteId")), [
    "/colaborador/cartera",
    "/proyectos",
    `/proyectos/${texto(f, "proyectoId")}`,
  ]);
}
