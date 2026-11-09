"use server";

import { revalidatePath } from "next/cache";
import { validarArchivo } from "@/lib/almacen";
import { colaboradorDeSesion, puedeManejar } from "@/lib/cuentas";
import { contratoDeAdhesion, contratoDeFideicomiso } from "@/lib/contrato";
import { getAportesDeProyecto, getGarantia, getProductor, getProyecto } from "@/lib/data";
import { firmarAdhesion, firmarFideicomiso, getFirmaFideicomiso } from "@/lib/firmas";
import { formatArs } from "@/lib/format";
import { getVerificacion } from "@/lib/identidad";
import { calcularFondeo, puedeAdherirse } from "@/lib/proyecto";
import { agregarDocumento } from "@/lib/escrituras";
import { TOPE_COLABORADORES, hayLugarPara, registrarPesada } from "@/lib/ciclo";
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

  const proyecto = await getProyecto(proyectoId);
  if (!proyecto || !(await puedeManejar(proyecto)))
    return { ok: false, error: "Solo el productor del proyecto puede subir papeles." };

  try {
    const r = await agregarDocumento(
      usuario.id,
      proyecto.productorId,
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

/** Lo que tiene que estar antes de firmar cualquier contrato. */
async function antesDeFirmar(f: FormData) {
  const usuario = await usuarioActual();
  if (!usuario) return { error: "Tu sesión se cerró. Volvé a ingresar." } as const;
  const v = await getVerificacion(usuario.id);
  if (v?.estado !== "aprobada")
    return { error: "Primero tenés que validar tu identidad." } as const;
  if (f.get("leido") !== "si") return { error: "Falta que confirmes que leíste el contrato." } as const;
  if (!/^\d{6}$/.test(String(f.get("codigo") ?? "")))
    return { error: "El código tiene 6 números." } as const;
  const proyecto = await getProyecto(String(f.get("proyectoId") ?? ""));
  if (!proyecto) return { error: "No encontramos el proyecto." } as const;
  const productor = await getProductor(proyecto.productorId);
  if (!productor) return { error: "No encontramos el productor del proyecto." } as const;
  return { usuario, proyecto, productor } as const;
}

/**
 * El colaborador firma la adhesión: queda la firma y una orden de suscripción.
 * El contrato se arma acá, con los datos del servidor, no con lo que mandó el
 * navegador.
 */
export async function participar(
  f: FormData,
): Promise<{ ok: true; orden: string; monto: number } | { ok: false; error: string }> {
  const a = await antesDeFirmar(f);
  if ("error" in a) return { ok: false, error: a.error! };
  const { usuario, proyecto, productor } = a;
  if (usuario.lado !== "colaborador")
    return { ok: false, error: "Para participar entrá como colaborador." };

  const monto = Number(String(f.get("monto") ?? "").replace(/\D/g, ""));
  if (!monto || monto < 100_000) return { ok: false, error: "El aporte mínimo de la demo es $ 100.000." };

  const fondeo = calcularFondeo(proyecto, await getAportesDeProyecto(proyecto.id));
  const regla = puedeAdherirse(proyecto, fondeo);
  if (!regla.puede) return { ok: false, error: regla.motivo ?? "El proyecto no admite participación." };
  const lugar = proyecto.montoObjetivoArs - fondeo.acreditadoArs - fondeo.comprometidoSinAcreditarArs;
  if (monto > lugar) return { ok: false, error: `Quedan ${formatArs(Math.max(0, lugar))} por cubrir.` };

  const colaboradorId = await colaboradorDeSesion();
  if (!(await hayLugarPara(proyecto.id, colaboradorId)))
    return { ok: false, error: `El proyecto ya tiene ${TOPE_COLABORADORES} colaboradores, que es el tope.` };

  try {
    const { orden } = await firmarAdhesion(
      usuario.id,
      colaboradorId,
      proyecto.id,
      monto,
      contratoDeAdhesion(proyecto, productor, monto),
    );
    revalidatePath(`/proyectos/${proyecto.id}`);
    revalidatePath("/colaborador/cartera");
    return { ok: true, orden, monto };
  } catch (e) {
    console.error("No se pudo firmar la adhesión:", e);
    return { ok: false, error: "No pudimos guardar la firma. Probá de nuevo." };
  }
}

/** El productor firma el fideicomiso de su proyecto, mientras está en revisión. */
export async function firmarFideicomisoDelProyecto(
  f: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const a = await antesDeFirmar(f);
  if ("error" in a) return { ok: false, error: a.error! };
  const { usuario, proyecto, productor } = a;
  if (usuario.lado !== "productor" || !(await puedeManejar(proyecto)))
    return { ok: false, error: "Solo el productor del proyecto puede firmarlo." };
  if (proyecto.estado !== "en_validacion")
    return { ok: false, error: "El contrato se firma mientras el proyecto está en validación." };
  if (await getFirmaFideicomiso(proyecto.id)) return { ok: false, error: "Ya lo firmaste." };

  const garantia = proyecto.garantiaId ? await getGarantia(proyecto.garantiaId) : undefined;
  try {
    await firmarFideicomiso(usuario.id, proyecto.id, contratoDeFideicomiso(proyecto, productor, garantia));
    revalidatePath(`/proyectos/${proyecto.id}`);
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    console.error("No se pudo firmar el fideicomiso:", e);
    return { ok: false, error: "No pudimos guardar la firma. Probá de nuevo." };
  }
}

/** El productor carga una pesada del lote. Queda guardada y la ve el colaborador. */
export async function guardarPesada(
  f: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const usuario = await usuarioActual();
  if (!usuario || usuario.lado !== "productor")
    return { ok: false, error: "Tu sesión se cerró. Volvé a ingresar." };
  const proyecto = await getProyecto(String(f.get("proyectoId") ?? ""));
  if (!proyecto || !(await puedeManejar(proyecto)))
    return { ok: false, error: "Solo el productor del proyecto puede cargar pesadas." };

  const n = (k: string) => Number(String(f.get(k) ?? "").replace(/\./g, "").replace(",", ".")) || 0;
  const fecha = String(f.get("fecha") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { ok: false, error: "Falta la fecha." };
  if (fecha > new Date().toISOString().slice(0, 10))
    return { ok: false, error: "La fecha no puede ser futura." };
  const d = {
    fecha,
    cabezas: n("cabezas"),
    pesoPromedioKg: n("peso"),
    gastoArs: n("gasto"),
    conceptoGasto: String(f.get("concepto") ?? ""),
    nota: String(f.get("nota") ?? "").trim() || undefined,
  };
  if (d.pesoPromedioKg <= 0 || d.cabezas <= 0)
    return { ok: false, error: "Faltan el peso y las cabezas." };
  try {
    await registrarPesada(usuario.id, proyecto.id, d);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo guardar." };
  }
  revalidatePath(`/proyectos/${proyecto.id}`);
  revalidatePath("/colaborador/cartera");
  return { ok: true };
}
