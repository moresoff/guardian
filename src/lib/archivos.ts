/**
 * Qué archivos se aceptan. Lo usan los dos lados: el navegador avisa antes de
 * subir, y el servidor vuelve a mirar porque el navegador no es de fiar. El
 * servidor además lee los primeros bytes: la extensión y el tipo que declara el
 * navegador se pueden cambiar con renombrar el archivo, el contenido no.
 */

export const TAMANO_MAXIMO = 10 * 1024 * 1024;

export const TIPOS_ACEPTADOS = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type TipoAceptado = keyof typeof TIPOS_ACEPTADOS;

/** Para el `accept` de los campos de archivo. */
export const ACCEPT = Object.keys(TIPOS_ACEPTADOS).join(",");

export const ACCEPT_IMAGEN = "image/jpeg,image/png,image/webp";

const esAceptado = (t: string): t is TipoAceptado => t in TIPOS_ACEPTADOS;

/**
 * El motivo por el que un archivo no sirve, en palabras de quien lo sube, o
 * `null` si se puede subir. Mira lo que dice el navegador: nombre, tipo y peso.
 */
export function revisarArchivo(
  f: { name: string; type: string; size: number },
  soloImagen = false,
): string | null {
  if (f.size === 0) return "El archivo está vacío. Probá elegirlo de nuevo.";
  if (f.size > TAMANO_MAXIMO)
    return "El archivo pesa más de 10 MB. Probá con una foto o un PDF más liviano.";
  if (soloImagen && !f.type.startsWith("image/"))
    return "Tiene que ser una foto (JPG, PNG o WEBP).";
  if (!esAceptado(f.type)) return "Solo se aceptan PDF o fotos (JPG, PNG o WEBP).";
  return null;
}

/** El tipo real, mirando los primeros bytes. `null` si no es ninguno de los aceptados. */
export function tipoPorContenido(b: Uint8Array): TipoAceptado | null {
  const empieza = (...bytes: number[]) => bytes.every((x, i) => b[i] === x);
  if (empieza(0x25, 0x50, 0x44, 0x46)) return "application/pdf"; // %PDF
  if (empieza(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (empieza(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (
    empieza(0x52, 0x49, 0x46, 0x46) && // RIFF
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 // WEBP
  )
    return "image/webp";
  return null;
}
