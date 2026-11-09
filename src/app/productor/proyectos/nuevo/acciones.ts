"use server";

import { revalidatePath } from "next/cache";
import { validarArchivo, type ArchivoValidado } from "@/lib/almacen";
import { CAMPOS_FICHA } from "@/lib/ficha";
import { productorDeSesion } from "@/lib/cuentas";
import { garantiaEsDelProductor, presentarProyecto } from "@/lib/escrituras";
import { documentosRequeridos } from "@/lib/format";
import { usuarioActual } from "@/lib/sesion";
import type { SistemaProductivo, TipoDocumento, TipoPosesion } from "@/lib/types";

const POSESIONES: TipoPosesion[] = ["existencia_comprobada", "promesa_inversion", "hibrido"];
const SISTEMAS: SistemaProductivo[] = ["corral", "mixto", "pastura"];
const USOS = new Set([
  "Compra de hacienda",
  "Ración",
  "Sanidad",
  "Mano de obra",
  "Sales minerales",
  "Flete a faena",
]);

const opcionesDe = (clave: string) => CAMPOS_FICHA.find((c) => c.clave === clave)?.opciones ?? [];
const texto = (f: FormData, k: string, max = 500) => String(f.get(k) ?? "").trim().slice(0, max);
const entero = (f: FormData, k: string) => {
  const v = Number(String(f.get(k) ?? "").replace(/\D/g, ""));
  return Number.isFinite(v) ? v : 0;
};

export type ResultadoPresentar =
  | { ok: true; id: string; documentos: number }
  | { ok: false; error: string };

/**
 * Presenta el proyecto: queda guardado en «Pendiente de validación» con sus
 * papeles. Valida todo de nuevo, porque lo que manda el navegador se puede
 * armar a mano: los números, las opciones, que los papeles sean los que pide la
 * tenencia elegida y que cada archivo sea de verdad un PDF o una foto.
 */
export async function presentar(f: FormData): Promise<ResultadoPresentar> {
  const usuario = await usuarioActual();
  if (!usuario) return { ok: false, error: "Tu sesión se cerró. Volvé a ingresar." };
  if (usuario.lado !== "productor")
    return { ok: false, error: "Solo un productor puede presentar un proyecto." };

  const cabezas = entero(f, "cabezas");
  const pesoEntradaKg = entero(f, "pesoEntradaKg");
  const montoObjetivoArs = entero(f, "montoObjetivoArs");
  const categoria = texto(f, "categoria", 60);
  const raza = texto(f, "raza", 60);
  const tipoPosesion = texto(f, "tipoPosesion") as TipoPosesion;
  const sistemaProductivo = texto(f, "sistemaProductivo") as SistemaProductivo;

  if (cabezas < 1 || cabezas > 100_000) return { ok: false, error: "Revisá las cabezas." };
  if (pesoEntradaKg < 50 || pesoEntradaKg > 900)
    return { ok: false, error: "El peso de entrada tiene que estar entre 50 y 900 kg." };
  if (montoObjetivoArs < 1 || montoObjetivoArs > 1e12)
    return { ok: false, error: "Revisá el monto que necesitás." };
  if (!opcionesDe("categoria").includes(categoria))
    return { ok: false, error: "Elegí la categoría de los animales." };
  if (!opcionesDe("raza").includes(raza)) return { ok: false, error: "Elegí la raza." };
  if (!POSESIONES.includes(tipoPosesion))
    return { ok: false, error: "Contanos si los animales ya son tuyos." };
  if (!SISTEMAS.includes(sistemaProductivo))
    return { ok: false, error: "Elegí cómo los vas a engordar." };

  const productorId = await productorDeSesion();
  const garantiaId = texto(f, "garantiaId", 80) || null;
  if (garantiaId && !(await garantiaEsDelProductor(garantiaId, productorId)))
    return { ok: false, error: "La garantía elegida no es tuya." };

  // Los papeles: solo los que pide la tenencia, uno por tipo, cada uno revisado.
  const requeridos = documentosRequeridos(tipoPosesion);
  const archivos: { tipo: TipoDocumento; archivo: ArchivoValidado }[] = [];
  for (const tipo of requeridos) {
    const valor = f.get(`doc_${tipo}`);
    if (!valor) continue;
    const r = await validarArchivo(valor);
    if ("error" in r) return { ok: false, error: r.error };
    archivos.push({ tipo, archivo: r });
  }

  try {
    const { id } = await presentarProyecto(
      usuario.id,
      productorId,
      {
        cabezas,
        categoria,
        raza,
        pesoEntradaKg,
        montoObjetivoArs,
        tipoPosesion,
        sistemaProductivo,
        usos: f.getAll("usos").map(String).filter((u) => USOS.has(u)),
        destinoDetalle: texto(f, "destinoDetalle", 2000),
        garantiaId,
        tieneSeguro: f.get("tieneSeguro") === "si",
        vendedor: texto(f, "vendedor", 200),
        establecimientoReceptor: texto(f, "establecimientoReceptor", 200),
        proveedores: texto(f, "proveedores", 200),
      },
      archivos,
    );
    revalidatePath("/productor");
    revalidatePath("/admin");
    return { ok: true, id, documentos: archivos.length };
  } catch (e) {
    console.error("No se pudo presentar el proyecto:", e);
    return {
      ok: false,
      error: "No pudimos guardar el proyecto. Probá de nuevo en un rato; no se perdió nada de lo que cargaste.",
    };
  }
}
