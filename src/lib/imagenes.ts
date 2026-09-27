import fs from "node:fs";
import path from "node:path";

/**
 * Las imágenes del proyecto las va cargando la gente de Guardian en
 * `public/imagenes/`, y no todas están desde el día uno. En vez de dejar una
 * imagen rota, cada pantalla pregunta si el archivo existe y dibuja un fondo de
 * marca cuando todavía no está. Corre en el servidor, al renderizar.
 */
const EXTENSIONES = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

export function buscarImagen(carpeta: string, base: string): string | null {
  for (const ext of EXTENSIONES) {
    const relativa = `/imagenes/${carpeta}/${base}${ext}`;
    if (fs.existsSync(path.join(process.cwd(), "public", relativa))) return relativa;
  }
  return null;
}

/**
 * Las fotos de una carpeta, ordenadas por número. Se lee la carpeta en vez de
 * listar nombres a mano porque el equipo va sumando fotos sueltas y no siempre
 * con el mismo formato de nombre: alcanza con dejarlas ahí.
 *
 * El prefijo existe porque en la misma carpeta conviven fotos de distinto uso.
 * Las tarjetas de proyecto piden `proyecto` y así nunca les toca el retrato del
 * productor ni ninguna otra foto que se sume después.
 */
export function listarImagenes(carpeta: string, prefijo?: string): string[] {
  const directorio = path.join(process.cwd(), "public", "imagenes", carpeta);
  if (!fs.existsSync(directorio)) return [];

  return fs
    .readdirSync(directorio)
    .filter((n) => EXTENSIONES.includes(path.extname(n).toLowerCase()))
    .filter((n) => !prefijo || n.toLowerCase().startsWith(prefijo))
    .sort((a, b) => a.localeCompare(b, "es", { numeric: true }))
    .map((n) => `/imagenes/${carpeta}/${n}`);
}
