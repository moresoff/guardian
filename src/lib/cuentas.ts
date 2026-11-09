import "server-only";
import { randomUUID } from "node:crypto";
import { consultar, hayBaseConfigurada } from "@/lib/db/conexion";
import { COLABORADOR_DEMO, PRODUCTOR_DEMO } from "@/lib/data";
import { colaboradores, productores } from "@/lib/data/seed";
import { usuarioActual } from "@/lib/sesion";
import type { Usuario } from "@/lib/usuarios";

/**
 * El vínculo entre una cuenta (`perfiles`) y su ficha de productor o de
 * colaborador. Al crear la cuenta se crea la ficha, así lo que esa persona
 * presenta queda a su nombre y no al del productor de la demo.
 *
 * Una sesión sin ficha (por ejemplo, una cuenta creada antes de este cambio)
 * cae en el productor o colaborador de la demo, que es lo que pasaba antes.
 */

const soloDigitos = (v: string) => v.replace(/\D/g, "");
const conGuiones = (cuit: string) => {
  const d = soloDigitos(cuit);
  return d.length === 11 ? `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}` : cuit.trim();
};

const global_ = globalThis as unknown as {
  fichasGuardian?: Map<string, { productorId?: string; colaboradorId?: string }>;
};
const fichasEnMemoria = () => (global_.fichasGuardian ??= new Map());

export interface DatosFicha {
  telefono: string;
  cuit: string;
  establecimiento?: string;
  provincia?: string;
}

export async function crearFicha(u: Usuario, d: DatosFicha): Promise<void> {
  const cuit = conGuiones(d.cuit);

  if (u.lado === "productor") {
    const establecimiento = d.establecimiento?.trim() || u.nombre;
    const provincia = d.provincia?.trim() || "Buenos Aires";
    if (hayBaseConfigurada()) {
      // RENSPA y marca quedan vacíos: se completan desde el establecimiento.
      // La capacidad arranca en 1 porque la base exige que sea positiva; al
      // presentar un proyecto sube hasta las cabezas del lote.
      await consultar(
        `insert into productores (perfil_id, nombre, razon_social, responsable, correo, telefono,
           cuit, renspa, marca_registrada, establecimiento, localidad, provincia,
           sistema_productivo, capacidad_instalada)
         values ($1, $2, $3, $3, $4, $5, $6, '', '', $2, '', $7, 'corral', 1)
         on conflict do nothing`,
        [u.id, establecimiento, u.nombre, u.correo, d.telefono.trim(), cuit, provincia],
      );
      return;
    }
    const id = `prod-${randomUUID().slice(0, 8)}`;
    productores.push({
      id,
      nombre: establecimiento,
      razonSocial: u.nombre,
      responsable: u.nombre,
      correo: u.correo,
      telefono: d.telefono.trim(),
      cuit,
      renspa: "",
      marcaRegistrada: "",
      establecimiento,
      localidad: "",
      provincia,
      sistemaProductivo: "corral",
      capacidadInstalada: 1,
      ocupacionActual: 0,
      ciclosCompletados: 0,
    });
    fichasEnMemoria().set(u.id, { productorId: id });
    return;
  }

  if (hayBaseConfigurada()) {
    await consultar(
      `insert into colaboradores (perfil_id, nombre, email, telefono, cuil)
       values ($1, $2, $3, $4, $5) on conflict do nothing`,
      [u.id, u.nombre, u.correo, d.telefono.trim(), cuit],
    );
    return;
  }
  const id = `col-${randomUUID().slice(0, 8)}`;
  colaboradores.push({
    id,
    nombre: u.nombre,
    email: u.correo,
    telefono: d.telefono.trim(),
    cuil: cuit,
    altaAt: new Date().toISOString().slice(0, 10),
    identidad: null,
    cbuDevolucion: "",
    aliasDevolucion: "",
  });
  fichasEnMemoria().set(u.id, { colaboradorId: id });
}

async function fichaDe(perfilId: string, tabla: "productores" | "colaboradores") {
  if (hayBaseConfigurada()) {
    const filas = await consultar<{ id: string }>(
      `select id from ${tabla} where perfil_id = $1`,
      [perfilId],
    );
    return filas[0]?.id ?? null;
  }
  const f = fichasEnMemoria().get(perfilId);
  return (tabla === "productores" ? f?.productorId : f?.colaboradorId) ?? null;
}

/** El productor de la sesión. Sin ficha propia, el de la demo. */
export async function productorDeSesion(): Promise<string> {
  const u = await usuarioActual();
  return (u && (await fichaDe(u.id, "productores"))) ?? PRODUCTOR_DEMO;
}

/** El colaborador de la sesión. Sin ficha propia, el de la demo. */
export async function colaboradorDeSesion(): Promise<string> {
  const u = await usuarioActual();
  return (u && (await fichaDe(u.id, "colaboradores"))) ?? COLABORADOR_DEMO;
}
