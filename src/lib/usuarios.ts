import "server-only";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { consultar, hayBaseConfigurada } from "@/lib/db/conexion";
import type { LadoSesion } from "@/lib/sesion";

const scrypt = promisify(scryptCb) as (p: string, s: Buffer, n: number) => Promise<Buffer>;

/**
 * Las cuentas. Con `DATABASE_URL` se guardan en `perfiles` (Supabase); sin ella
 * viven en memoria, igual que el resto de los datos de demostración: alcanzan
 * para probar el alta y el ingreso sin pedirle a nadie una base, y se pierden al
 * reiniciar el servidor.
 */

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  lado: LadoSesion;
}

export interface DatosAlta {
  lado: LadoSesion;
  nombre: string;
  correo: string;
  telefono: string;
  cuit: string;
  clave: string;
}

interface Guardado extends Usuario {
  claveHash: string;
}

const global_ = globalThis as unknown as { usuariosGuardian?: Map<string, Guardado> };
const enMemoria = () => (global_.usuariosGuardian ??= new Map());

async function hashear(clave: string): Promise<string> {
  const sal = randomBytes(16);
  const h = await scrypt(clave, sal, 64);
  return `${sal.toString("hex")}:${h.toString("hex")}`;
}

async function coincide(clave: string, guardado: string): Promise<boolean> {
  const [sal, h] = guardado.split(":");
  if (!sal || !h) return false;
  const calculado = await scrypt(clave, Buffer.from(sal, "hex"), 64);
  const esperado = Buffer.from(h, "hex");
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

const normalizar = (correo: string) => correo.trim().toLowerCase();

export async function crearUsuario(
  d: DatosAlta,
): Promise<{ ok: true; usuario: Usuario } | { ok: false; error: string }> {
  const correo = normalizar(d.correo);
  const claveHash = await hashear(d.clave);
  const usuario: Usuario = {
    id: "",
    nombre: d.nombre.trim(),
    correo,
    lado: d.lado,
  };

  if (hayBaseConfigurada()) {
    const filas = await consultar<{ id: string }>(
      `insert into perfiles (nombre, correo, telefono, cuit, rol, clave_hash)
       values ($1, $2, $3, $4, $5::rol, $6)
       on conflict do nothing
       returning id`,
      [usuario.nombre, correo, d.telefono.trim(), d.cuit.trim(), d.lado, claveHash],
    );
    if (filas.length === 0) return { ok: false, error: "Ya hay una cuenta con ese correo." };
    return { ok: true, usuario: { ...usuario, id: filas[0].id } };
  }

  const todos = enMemoria();
  if ([...todos.values()].some((u) => u.correo === correo))
    return { ok: false, error: "Ya hay una cuenta con ese correo." };
  usuario.id = `usr-${randomBytes(6).toString("hex")}`;
  todos.set(usuario.id, { ...usuario, claveHash });
  return { ok: true, usuario };
}

export async function verificarUsuario(
  correo: string,
  clave: string,
): Promise<Usuario | null> {
  const c = normalizar(correo);
  let hallado: Guardado | null = null;

  if (hayBaseConfigurada()) {
    const filas = await consultar<{
      id: string;
      nombre: string;
      correo: string;
      rol: LadoSesion;
      clave_hash: string | null;
    }>(
      `select id, nombre, correo, rol::text as rol, clave_hash
         from perfiles where lower(correo) = $1 and rol in ('productor', 'colaborador')`,
      [c],
    );
    const f = filas[0];
    if (f?.clave_hash)
      hallado = { id: f.id, nombre: f.nombre, correo: f.correo, lado: f.rol, claveHash: f.clave_hash };
  } else {
    hallado = [...enMemoria().values()].find((u) => u.correo === c) ?? null;
  }

  if (!hallado || !(await coincide(clave, hallado.claveHash))) return null;
  const { claveHash: _omitido, ...usuario } = hallado;
  void _omitido;
  return usuario;
}

export async function getUsuario(id: string): Promise<Usuario | null> {
  if (hayBaseConfigurada()) {
    const filas = await consultar<{ id: string; nombre: string; correo: string; rol: LadoSesion }>(
      `select id, nombre, correo, rol::text as rol from perfiles where id = $1`,
      [id],
    );
    const f = filas[0];
    return f ? { id: f.id, nombre: f.nombre, correo: f.correo, lado: f.rol } : null;
  }
  const g = enMemoria().get(id);
  return g ? { id: g.id, nombre: g.nombre, correo: g.correo, lado: g.lado } : null;
}
