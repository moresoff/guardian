"use server";

import { cookies } from "next/headers";
import { COOKIE_SESION, crearToken, type LadoSesion } from "@/lib/sesion";
import { crearUsuario, verificarUsuario, type DatosAlta } from "@/lib/usuarios";

const SIETE_DIAS = 7 * 24 * 60 * 60;

async function abrir(id: string, lado: LadoSesion) {
  (await cookies()).set(COOKIE_SESION, crearToken(id, lado), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SIETE_DIAS,
  });
}

/** Crea la cuenta y deja la sesión abierta. Valida de nuevo: el cliente no es de fiar. */
export async function registrar(
  d: DatosAlta,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (d.lado !== "productor" && d.lado !== "colaborador")
    return { ok: false, error: "Elegí de qué lado entrás." };
  if (!d.nombre.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo.trim()) || d.clave.length < 8)
    return { ok: false, error: "Revisá los datos: falta el nombre, el correo o la contraseña." };
  const r = await crearUsuario(d);
  if (!r.ok) return r;
  await abrir(r.usuario.id, d.lado);
  return { ok: true };
}

/** Entra con correo y contraseña; el lado es el de la cuenta. */
export async function ingresar(
  correo: string,
  clave: string,
): Promise<{ ok: true; lado: LadoSesion } | { ok: false; error: string }> {
  const u = await verificarUsuario(correo, clave);
  if (!u) return { ok: false, error: "El correo o la contraseña no coinciden." };
  await abrir(u.id, u.lado);
  return { ok: true, lado: u.lado };
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE_SESION);
}
