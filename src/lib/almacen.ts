import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import { TAMANO_MAXIMO, TIPOS_ACEPTADOS, tipoPorContenido, type TipoAceptado } from "@/lib/archivos";

/**
 * Dónde quedan los archivos que se suben: los papeles del proyecto y las fotos
 * de la validación de identidad.
 *
 *   - Con `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SECRET_KEY`, en el bucket
 *     privado `documentos` de Supabase Storage. El bucket no tiene políticas:
 *     solo el servidor, con la clave secreta, lee o escribe.
 *   - Sin ellas, en la carpeta `.almacen/` del proyecto, para que la demo
 *     funcione sin configurar nada. Esa carpeta no se sube al repositorio.
 *
 * La base guarda la ruta, no el archivo.
 */

const BUCKET = "documentos";
const CARPETA_LOCAL = join(process.cwd(), ".almacen", BUCKET);

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SECRET_KEY;
  return url && clave ? { url: url.replace(/\/$/, ""), clave } : null;
}

export const destinoDeArchivos = () => (supabase() ? "supabase" : "disco");

export type ArchivoValidado = {
  bytes: Uint8Array;
  tipo: TipoAceptado;
  extension: string;
  nombre: string;
  tamano: number;
};

/**
 * Valida un archivo que llegó en un formulario. Devuelve el motivo si no sirve.
 * No confía en el tipo que manda el navegador: lo decide el contenido.
 */
export async function validarArchivo(
  valor: FormDataEntryValue | null,
  soloImagen = false,
): Promise<ArchivoValidado | { error: string }> {
  if (!valor || typeof valor === "string") return { error: "Falta el archivo." };
  if (valor.size === 0) return { error: `«${valor.name}» está vacío.` };
  if (valor.size > TAMANO_MAXIMO) return { error: `«${valor.name}» pesa más de 10 MB.` };
  const bytes = new Uint8Array(await valor.arrayBuffer());
  const tipo = tipoPorContenido(bytes);
  if (!tipo) return { error: `«${valor.name}» no es un PDF ni una foto.` };
  if (soloImagen && tipo === "application/pdf")
    return { error: `«${valor.name}» tiene que ser una foto.` };
  return {
    bytes,
    tipo,
    extension: TIPOS_ACEPTADOS[tipo],
    nombre: valor.name.slice(0, 200),
    tamano: valor.size,
  };
}

/** Una ruta dentro del bucket, sin `..` ni barras al principio. */
function rutaSegura(ruta: string): string {
  const limpia = normalize(ruta).replace(/^([/\\])+/, "");
  if (limpia.startsWith("..") || limpia.includes("\0")) throw new Error("Ruta de archivo inválida.");
  return limpia.replace(/\\/g, "/");
}

export async function guardarArchivo(
  ruta: string,
  archivo: Pick<ArchivoValidado, "bytes" | "tipo">,
): Promise<string> {
  const r = rutaSegura(ruta);
  const sb = supabase();

  if (sb) {
    const res = await fetch(`${sb.url}/storage/v1/object/${BUCKET}/${encodeURI(r)}`, {
      method: "POST",
      headers: {
        apikey: sb.clave,
        Authorization: `Bearer ${sb.clave}`,
        "Content-Type": archivo.tipo,
        "x-upsert": "false",
      },
      body: Buffer.from(archivo.bytes),
    });
    if (!res.ok) {
      // El cuerpo de la respuesta puede traer detalles del proyecto: al log, no
      // a la pantalla.
      console.error(`Storage respondió ${res.status} al guardar ${r}: ${await res.text()}`);
      throw new Error("No se pudo guardar el archivo.");
    }
    return r;
  }

  const destino = join(CARPETA_LOCAL, r);
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, archivo.bytes);
  return r;
}

/** El archivo guardado, para mostrarlo. `null` si no está. */
export async function leerArchivoGuardado(
  ruta: string,
): Promise<{ bytes: Uint8Array; tipo: string } | null> {
  const r = rutaSegura(ruta);
  const sb = supabase();

  if (sb) {
    const res = await fetch(`${sb.url}/storage/v1/object/authenticated/${BUCKET}/${encodeURI(r)}`, {
      headers: { apikey: sb.clave, Authorization: `Bearer ${sb.clave}` },
    });
    if (!res.ok) return null;
    return {
      bytes: new Uint8Array(await res.arrayBuffer()),
      tipo: res.headers.get("content-type") ?? "application/octet-stream",
    };
  }

  try {
    const bytes = new Uint8Array(await readFile(join(CARPETA_LOCAL, r)));
    return { bytes, tipo: tipoPorContenido(bytes) ?? "application/octet-stream" };
  } catch {
    return null;
  }
}
