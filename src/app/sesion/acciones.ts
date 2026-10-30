"use server";

import { cookies } from "next/headers";
import { COOKIE_SESION, type LadoSesion } from "@/lib/sesion";

const SIETE_DIAS = 7 * 24 * 60 * 60;

export async function abrirSesion(lado: LadoSesion) {
  if (lado !== "productor" && lado !== "colaborador") return;
  (await cookies()).set(COOKIE_SESION, lado, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SIETE_DIAS,
  });
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE_SESION);
}
