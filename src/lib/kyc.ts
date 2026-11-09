/**
 * Lo que se pregunta en la validación de identidad y cómo se revisa. Lo usan el
 * formulario y la acción del servidor, así los dos piden lo mismo.
 */

/** De dónde viene el dinero con el que se participa. Lo pide la UIF. */
export const ORIGENES_FONDOS = [
  "Sueldo o jubilación",
  "Actividad propia o profesional",
  "Actividad agropecuaria",
  "Ahorros",
  "Venta de un bien",
  "Herencia o donación",
] as const;

export const SEXOS = [
  { valor: "F", label: "Femenino" },
  { valor: "M", label: "Masculino" },
  { valor: "X", label: "X (no binario)" },
] as const;

/** Edad cumplida a hoy, para una fecha AAAA-MM-DD; -1 si la fecha no sirve. */
export function edad(fecha: string): number {
  const n = new Date(`${fecha}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(n.getTime())) return -1;
  const h = new Date();
  let e = h.getUTCFullYear() - n.getUTCFullYear();
  if (
    h.getUTCMonth() < n.getUTCMonth() ||
    (h.getUTCMonth() === n.getUTCMonth() && h.getUTCDate() < n.getUTCDate())
  )
    e -= 1;
  return e;
}

export const soloDigitos = (v: string) => v.replace(/\D/g, "");

/** El CUIT/CUIL lleva el DNI en el medio (con ceros a la izquierda hasta 8). */
export const cuitCorrespondeADni = (cuit: string, dni: string) =>
  soloDigitos(cuit).slice(2, 10) === soloDigitos(dni).padStart(8, "0");
