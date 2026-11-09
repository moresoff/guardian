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
import {
  aprobarPagoCompra,
  avanzarLiquidaciones,
  cerrarParticipacion,
  liquidarCiclo,
  pagarCompra,
  verificarRequisitosCompra,
} from "@/lib/ciclo";

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

// --- El ciclo después de publicar -------------------------------------------

const numero = (f: FormData, k: string) => Number(texto(f, k).replace(/\./g, "").replace(",", "."));
const rutasCiclo = (id: string) => [`/admin/ciclo/${id}`, `/proyectos/${id}`, "/proyectos", "/productor", "/colaborador/cartera"];

export async function accionCerrarParticipacion(f: FormData) {
  const id = texto(f, "proyectoId");
  return hacer(async (q) => void (await cerrarParticipacion(q, id)), rutasCiclo(id));
}

export async function accionRequisitosCompra(f: FormData) {
  const id = texto(f, "proyectoId");
  const d = {
    vendedor: texto(f, "vendedor"),
    vendedorCuit: texto(f, "vendedorCuit"),
    renspaReceptor: texto(f, "renspaReceptor"),
    cabezas: numero(f, "cabezas"),
    kilos: numero(f, "kilos"),
    precioKgArs: numero(f, "precioKgArs"),
  };
  if (d.vendedor.length < 3) return { ok: false, error: "Falta el vendedor." } as Resultado;
  if (d.vendedorCuit.replace(/\D/g, "").length !== 11)
    return { ok: false, error: "El CUIT del vendedor tiene 11 números." } as Resultado;
  if (d.renspaReceptor.length < 5) return { ok: false, error: "Falta el RENSPA del campo que recibe." } as Resultado;
  if (!(d.cabezas > 0 && d.kilos > 0 && d.precioKgArs > 0))
    return { ok: false, error: "Cabezas, kilos y precio tienen que ser mayores que cero." } as Resultado;
  return hacer((q) => verificarRequisitosCompra(q, id, d), rutasCiclo(id));
}

export async function accionAprobarPago(f: FormData) {
  const id = texto(f, "proyectoId");
  return hacer((q) => aprobarPagoCompra(q, id), rutasCiclo(id));
}

export async function accionPagarCompra(f: FormData) {
  const id = texto(f, "proyectoId");
  return hacer((q) => pagarCompra(q, id), rutasCiclo(id));
}

export async function accionLiquidar(f: FormData) {
  const id = texto(f, "proyectoId");
  const v = {
    dteSalida: texto(f, "dteSalida"),
    cabezas: numero(f, "cabezas"),
    kilosVivos: numero(f, "kilosVivos"),
    kgCarne: numero(f, "kgCarne"),
    precioKgArs: numero(f, "precioKgArs"),
  };
  if (v.dteSalida.length < 5) return { ok: false, error: "Falta el DT-e de salida." } as Resultado;
  if (!(v.cabezas > 0 && v.kilosVivos > 0 && v.kgCarne > 0 && v.precioKgArs > 0))
    return { ok: false, error: "Cabezas, kilos y precio tienen que ser mayores que cero." } as Resultado;
  if (v.kgCarne > v.kilosVivos) return { ok: false, error: "Los kilos de carne no pueden superar los kilos vivos." } as Resultado;
  return hacer(async (q) => void (await liquidarCiclo(q, id, v)), rutasCiclo(id));
}

export async function accionAvanzarLiquidaciones(f: FormData) {
  const id = texto(f, "proyectoId");
  const a = texto(f, "a") === "pagada" ? "pagada" : "aprobada";
  return hacer((q) => avanzarLiquidaciones(q, id, a), rutasCiclo(id));
}
