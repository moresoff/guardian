"use client";

import { useState } from "react";
import Link from "next/link";
import { Campo, GrupoOpciones, Seleccion } from "@/components/ui/campos";
import {
  Aviso,
  Boton,
  BotonLink,
  Dato,
  Panel,
  Progreso,
} from "@/components/ui/primitivos";
import { PROVINCIAS } from "@/lib/provincias";
import type { Rol } from "@/lib/types";

type Lado = Extract<Rol, "productor" | "colaborador">;

const LADOS: { rol: Lado; titulo: string; descripcion: string }[] = [
  {
    rol: "productor",
    titulo: "Soy productor",
    descripcion:
      "Tengo hacienda y necesito capital para el ciclo de engorde. Publico el proyecto con la documentación del lote.",
  },
  {
    rol: "colaborador",
    titulo: "Soy colaborador",
    descripcion:
      "Quiero poner capital en ciclos ganaderos y seguir cómo avanza cada uno hasta el cierre.",
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

  return (
    <div>
      <p className="rotulo text-tinta-tenue">Paso {paso} de 3</p>
      <div className="mt-2">
        <Progreso valor={(paso / 3) * 100} label="Avance del registro" />
      </div>

      {paso === 1 ? (
        <section className="mt-8">
          <h2 className="text-2xl font-semibold tracking-tight">¿De qué lado entrás?</h2>
          <p className="mt-2 text-tinta-suave">
            Elegí uno para seguir. Es lo que define qué vas a ver adentro.
          </p>
          <GrupoOpciones
            etiqueta="¿De qué lado entrás?"
            className="mt-6 space-y-3"
            valor={lado}
            onCambio={setLado}
            opciones={LADOS.map((l) => ({
              valor: l.rol,
              titulo: l.titulo,
              descripcion: l.descripcion,
            }))}
          />
          <div className="mt-7">
            <Boton className="w-full" disabled={lado === null} onClick={() => setPaso(2)}>
              Seguir
            </Boton>
          </div>
        </section>
      ) : null}

      {paso === 2 ? (
        <form
          className="mt-8"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (validar()) setPaso(3);
          }}
        >
          <h2 className="text-2xl font-semibold tracking-tight">Tus datos</h2>
          <p className="mt-2 text-tinta-suave">
            {lado === "productor"
              ? "Con esto abrimos tu cuenta. La documentación del campo y de la hacienda la cargás cuando publiques el primer ciclo."
              : "Con esto abrimos tu cuenta. Los datos para transferir se piden recién cuando decidas participar en un proyecto."}
          </p>

          <div className="mt-6 space-y-5">
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
              ayuda="Con característica, sin el 0 ni el 15."
              className="tabular"
              value={datos.telefono}
              onChange={(e) => set("telefono")(e.target.value)}
              error={errores.telefono}
            />
            <Campo
              etiqueta={lado === "productor" ? "CUIT" : "CUIT o CUIL"}
              inputMode="numeric"
              ayuda={
                lado === "productor"
                  ? "El del titular del RENSPA, para que la documentación cierre con la cuenta."
                  : "Lo pedimos para emitir los comprobantes de tu participación."
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
                  ayuda="Como lo conocen en la zona."
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
              ayuda="Ocho caracteres o más."
              value={datos.clave}
              onChange={(e) => set("clave")(e.target.value)}
              error={errores.clave}
            />
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Boton type="submit" className="flex-1">
              Crear mi cuenta
            </Boton>
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
          </div>
        </form>
      ) : null}

      {paso === 3 ? (
        <section className="mt-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            Listo, {datos.nombre.trim().split(" ")[0]}
          </h2>
          <p className="mt-2 text-tinta-suave">
            Esto es lo que quedó cargado y lo que sigue de tu lado.
          </p>

          <Panel className="mt-6 p-5">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Dato etiqueta="Entrás como">
                {lado === "productor" ? "Productor" : "Colaborador"}
              </Dato>
              <Dato etiqueta="Correo">{datos.correo}</Dato>
              <Dato etiqueta="CUIT">{datos.cuit}</Dato>
              {lado === "productor" ? (
                <Dato etiqueta="Establecimiento">
                  {datos.establecimiento}, {datos.provincia}
                </Dato>
              ) : null}
            </dl>
          </Panel>

          <h3 className="mt-7 text-lg font-semibold tracking-tight">Lo que sigue</h3>
          <ol className="mt-3 space-y-3">
            {(lado === "productor"
              ? [
                  "Cargás el RENSPA del establecimiento: queda guardado y sirve para todos tus ciclos.",
                  "Publicás el primer proyecto con los datos del lote y los documentos de la hacienda.",
                  "Guardian revisa que los papeles cierren entre sí y el proyecto sale al catálogo.",
                ]
              : [
                  "Mirás el catálogo de ciclos abiertos, con el estado de validación de cada uno a la vista.",
                  "Elegís uno y ponés el monto que quieras.",
                  "Seguís el ciclo hasta el cierre y ves el romaneo de playa cuando termina.",
                ]
            ).map((t, i) => (
              <li key={t} className="flex gap-3">
                <span
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-marca-suave text-sm font-semibold text-marca"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span className="text-tinta-suave">{t}</span>
              </li>
            ))}
          </ol>

          <div className="mt-7">
            <Aviso tono="alerta" titulo="La cuenta todavía no se guarda">
              Guardian es un prototipo: las cuentas se conectan en la etapa de backend. Lo
              que cargaste no queda registrado, pero podés entrar igual y recorrer toda la
              plataforma.
            </Aviso>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <BotonLink href={lado === "productor" ? "/productor" : "/proyectos"}>
              Entrar a Guardian
            </BotonLink>
            <Boton variante="secundario" onClick={() => setPaso(2)}>
              Corregir mis datos
            </Boton>
          </div>
        </section>
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
