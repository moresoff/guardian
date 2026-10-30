import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * La sesión del prototipo: una cookie que dice de qué lado se entró. No hay
 * contraseñas ni usuarios detrás —las cuentas se conectan en la etapa de
 * backend—, así que esto NO es seguridad: alcanza para separar lo que se ve sin
 * cuenta de lo que se ve con ella, y para que el resto de la interfaz se escriba
 * contra la pregunta correcta ("¿hay sesión?") desde ahora.
 */
export const COOKIE_SESION = "guardian_sesion";

export type LadoSesion = "productor" | "colaborador";

export async function ladoDeSesion(): Promise<LadoSesion | null> {
  const v = (await cookies()).get(COOKIE_SESION)?.value;
  return v === "productor" || v === "colaborador" ? v : null;
}

export async function haySesion(): Promise<boolean> {
  return (await ladoDeSesion()) !== null;
}

/** Corta una pantalla privada: sin sesión se va a ingresar. */
export async function exigirSesion(): Promise<LadoSesion> {
  const lado = await ladoDeSesion();
  if (!lado) redirect("/ingresar");
  return lado;
}
