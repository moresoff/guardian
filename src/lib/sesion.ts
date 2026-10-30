import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUsuario, type Usuario } from "@/lib/usuarios";

/**
 * La sesión: una cookie httpOnly con el id del usuario, el lado por el que
 * entró y una firma HMAC, para que no se pueda armar a mano. Se firma con
 * `SESION_SECRETO`; sin esa variable se usa una clave de desarrollo, que sirve
 * para probar y NO para producción.
 */
export const COOKIE_SESION = "guardian_sesion";

export type LadoSesion = "productor" | "colaborador";

const secreto = () => process.env.SESION_SECRETO ?? "guardian-desarrollo-no-usar-en-produccion";
const firmar = (cuerpo: string) => createHmac("sha256", secreto()).update(cuerpo).digest("hex");

export function crearToken(id: string, lado: LadoSesion): string {
  const cuerpo = `${lado}.${id}`;
  return `${cuerpo}.${firmar(cuerpo)}`;
}

function leerToken(token: string | undefined): { id: string; lado: LadoSesion } | null {
  if (!token) return null;
  const partes = token.split(".");
  if (partes.length < 3) return null;
  const firma = partes.pop()!;
  const cuerpo = partes.join(".");
  const esperada = firmar(cuerpo);
  if (
    firma.length !== esperada.length ||
    !timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))
  )
    return null;
  const [lado, ...resto] = cuerpo.split(".");
  if (lado !== "productor" && lado !== "colaborador") return null;
  return { id: resto.join("."), lado };
}

/** El usuario de la sesión, con el lado por el que entró; null si no hay sesión. */
export async function usuarioActual(): Promise<(Usuario & { lado: LadoSesion }) | null> {
  const t = leerToken((await cookies()).get(COOKIE_SESION)?.value);
  if (!t) return null;
  const u = await getUsuario(t.id);
  return u ? { ...u, lado: t.lado } : null;
}

export async function ladoDeSesion(): Promise<LadoSesion | null> {
  return (await usuarioActual())?.lado ?? null;
}

export async function haySesion(): Promise<boolean> {
  return (await usuarioActual()) !== null;
}

/** Corta una pantalla privada: sin sesión se va a ingresar. */
export async function exigirSesion(): Promise<LadoSesion> {
  const lado = await ladoDeSesion();
  if (!lado) redirect("/ingresar");
  return lado;
}
