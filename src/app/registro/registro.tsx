"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Campo, GrupoOpciones, Seleccion } from "@/components/ui/campos";
import { Boton, BotonLink, Progreso } from "@/components/ui/primitivos";
import { abrirSesion } from "@/app/sesion/acciones";
import { PROVINCIAS } from "@/lib/provincias";
import type { Rol } from "@/lib/types";

type Lado = Extract<Rol, "productor" | "colaborador">;

const LADOS: { rol: Lado; titulo: string; descripcion: string }[] = [
  {
    rol: "productor",
    titulo: "Soy productor",
    descripcion:
      "Tengo hacienda y quiero publicar un ciclo de engorde para que otras personas participen, con la documentación del lote.",
  },
  {
    rol: "colaborador",
    titulo: "Soy colaborador",
    descripcion:
      "Quiero participar en ciclos ganaderos y seguir cómo avanza cada uno hasta el cierre.",
  },
];

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const soloDigitos = (v: string) => v.replace(/\D/g, "");

interface Datos {
  nombre: string;
  correo: string;
  telefono: string;
  cuit: string;
  clave: string;
  establecimiento: string;
  provincia: string;
}

const INICIAL: Datos = {
  nombre: "",
  correo: "",
  telefono: "",
  cuit: "",
  clave: "",
  establecimiento: "",
  provincia: "Buenos Aires",
};

type Errores = Partial<Record<keyof Datos, string>>;

/**
 * El alta en tres pasos: de qué lado entrás, quién sos y qué sigue. Se pregunta
 * lo mínimo para abrir la cuenta —lo que hay que probar con papeles se pide
 * después, cuando el productor publica el ciclo o el colaborador va a poner capital—
 * así la puerta de entrada no espanta a nadie.
 *
 * Quien llegó por una de las dos puertas de la portada ya contestó de qué lado
 * entra, así que se arranca en el paso 2 y no se le vuelve a preguntar.
 */
export function Registro({ ladoInicial }: { ladoInicial?: Lado }) {
  const router = useRouter();
  const [paso, setPaso] = useState(ladoInicial ? 2 : 1);
  const [lado, setLado] = useState<Lado | null>(ladoInicial ?? null);
  const [datos, setDatos] = useState<Datos>(INICIAL);
  const [errores, setErrores] = useState<Errores>({});

  const set = (campo: keyof Datos) => (v: string) =>
    setDatos((d) => ({ ...d, [campo]: v }));

  const validar = (): boolean => {
    const e: Errores = {};
    if (!datos.nombre.trim()) e.nombre = "Escribí tu nombre y apellido.";
    if (!datos.correo.trim())
      e.correo = "Necesitamos un correo para avisarte las novedades.";
    else if (!CORREO.test(datos.correo.trim()))
      e.correo = "Falta algo en el correo: fijate que tenga arroba y el punto final.";
    if (soloDigitos(datos.telefono).length < 8)
      e.telefono = "Escribí el teléfono con característica, sin el 0 ni el 15.";
    if (soloDigitos(datos.cuit).length !== 11)
      e.cuit = "El CUIT tiene 11 números. Podés escribirlo con guiones o sin ellos.";
    if (datos.clave.length < 8) e.clave = "La contraseña necesita 8 caracteres o más.";
    if (lado === "productor" && !datos.establecimiento.trim())
      e.establecimiento = "Escribí cómo se llama el campo.";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  // Quien entra por la portada ya eligió el lado y completa un solo paso: no hay
  // contador que mostrar. Desde el menú son dos: lado y datos.
  const total = ladoInicial ? 1 : 2;
  const actual = ladoInicial ? 1 : paso;

  return (
    <div>
      {total > 1 ? (
        <>
          <p className="rotulo text-tinta-tenue">
            Paso {actual} de {total}
          </p>
          <div className="mt-1.5">
            <Progreso valor={(actual / total) * 100} label="Avance del registro" />
          </div>
        </>
      ) : null}

      {paso === 1 ? (
        <section className="mt-5">
          <h2 className="text-xl font-semibold tracking-tight">¿De qué lado entrás?</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            Elegí uno para seguir. Es lo que define qué vas a ver adentro.
          </p>
          <GrupoOpciones
            etiqueta="¿De qué lado entrás?"
            className="mt-4 space-y-2"
            valor={lado}
            onCambio={setLado}
            opciones={LADOS.map((l) => ({
              valor: l.rol,
              titulo: l.titulo,
              descripcion: l.descripcion,
            }))}
          />
          <div className="mt-5">
            <Boton className="w-full" disabled={lado === null} onClick={() => setPaso(2)}>
              Seguir
            </Boton>
          </div>
        </section>
      ) : null}

      {paso === 2 ? (
        <form
          className="mt-5"
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            if (!validar() || !lado) return;
            await abrirSesion(lado);
            // La cuenta se abre y se entra directo a la aplicación: el recorrido
            // explica cada pantalla ahí, donde se ve lo que hay que cargar.
            router.push(
              lado === "productor" ? "/productor?recorrido=productor" : "/proyectos?recorrido=colaborador",
            );
          }}
        >
          <h2 className="text-xl font-semibold tracking-tight">Tus datos</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            {lado === "productor"
              ? "La documentación del campo y de la hacienda la cargás al publicar el primer ciclo."
              : "Los datos para transferir se piden cuando decidas participar en un proyecto."}
          </p>

          <div className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-2">
            <Campo
              etiqueta="Nombre y apellido"
              autoComplete="name"
              value={datos.nombre}
              onChange={(e) => set("nombre")(e.target.value)}
              error={errores.nombre}
            />
            <Campo
              etiqueta="Correo electrónico"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={datos.correo}
              onChange={(e) => set("correo")(e.target.value)}
              error={errores.correo}
            />
            <Campo
              etiqueta="Teléfono"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Con característica, sin 0 ni 15…"
              className="tabular"
              value={datos.telefono}
              onChange={(e) => set("telefono")(e.target.value)}
              error={errores.telefono}
            />
            <Campo
              etiqueta={lado === "productor" ? "CUIT" : "CUIT o CUIL"}
              inputMode="numeric"
              placeholder={
                lado === "productor" ? "Del titular del RENSPA…" : "Para tus comprobantes…"
              }
              className="tabular"
              value={datos.cuit}
              onChange={(e) => set("cuit")(e.target.value)}
              error={errores.cuit}
            />

            {lado === "productor" ? (
              <>
                <Campo
                  etiqueta="Nombre del establecimiento"
                  placeholder="Como lo conocen en la zona…"
                  value={datos.establecimiento}
                  onChange={(e) => set("establecimiento")(e.target.value)}
                  error={errores.establecimiento}
                />
                <Seleccion
                  etiqueta="Provincia"
                  opciones={PROVINCIAS}
                  value={datos.provincia}
                  onChange={(e) => set("provincia")(e.target.value)}
                />
              </>
            ) : null}

            <Campo
              etiqueta="Contraseña"
              type="password"
              autoComplete="new-password"
              placeholder="Ocho caracteres o más…"
              value={datos.clave}
              onChange={(e) => set("clave")(e.target.value)}
              error={errores.clave}
            />

            <div className="flex items-end gap-3">
              <Boton type="submit" className="flex-1">
                Crear mi cuenta
              </Boton>
              {ladoInicial ? (
                <BotonLink href="/" variante="secundario">
                  Volver
                </BotonLink>
              ) : (
                <Boton
                  type="button"
                  variante="secundario"
                  onClick={() => {
                    setErrores({});
                    setPaso(1);
                  }}
                >
                  Volver
                </Boton>
              )}
            </div>
          </div>
        </form>
      ) : null}

      {paso === 1 ? (
        <p className="mt-8 border-t border-borde pt-6 text-tinta-suave">
          ¿Ya tenés cuenta?{" "}
          <Link href="/ingresar" className="font-medium text-marca underline">
            Entrá por acá
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
