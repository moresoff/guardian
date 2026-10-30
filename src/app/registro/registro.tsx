"use client";

import { useState } from "react";
import Link from "next/link";
import { Campo, GrupoOpciones, Seleccion } from "@/components/ui/campos";
import { Recorrido, type PasoDeRecorrido } from "@/components/recorrido";
import { Aviso, Boton, BotonLink, Progreso } from "@/components/ui/primitivos";
import { CICLOS, SISTEMAS_EN_ORDEN } from "@/lib/ciclos";
import { formatPct } from "@/lib/format";
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

/** Los tres tipos de ciclo, con lo que le toca a cada parte. */
function TiposDeCiclo({ paraProductor }: { paraProductor: boolean }) {
  return (
    <ul className="grid gap-3">
      {SISTEMAS_EN_ORDEN.map((k) => {
        const c = CICLOS[k];
        return (
          <li key={k} className="rounded-xl border border-borde bg-superficie-2 p-4">
            <p className="font-semibold tracking-tight">
              {c.nombre} <span className="font-normal text-tinta-suave">· {c.plazoDias} días</span>
            </p>
            <p className="mt-1 text-sm text-tinta-suave">{c.descripcion}</p>
            <p className="mt-2 text-sm">
              {paraProductor ? (
                <>
                  Vos te quedás con el{" "}
                  <strong className="font-semibold">{formatPct(c.productorPct)}</strong> y los
                  colaboradores con el{" "}
                  <strong className="font-semibold">{formatPct(c.colaboradoresPct)}</strong>.
                  Rentabilidad anual estimada para el productor:{" "}
                  <strong className="font-semibold">
                    {formatPct(c.rentabilidadAnualProductorPct)}
                  </strong>
                  .
                </>
              ) : (
                <>
                  Los colaboradores se reparten el{" "}
                  <strong className="font-semibold">{formatPct(c.colaboradoresPct)}</strong> del
                  resultado y el productor se queda con el{" "}
                  <strong className="font-semibold">{formatPct(c.productorPct)}</strong>.
                </>
              )}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

const PASOS_PRODUCTOR: PasoDeRecorrido[] = [
  {
    titulo: "Cargás tu establecimiento",
    resumen:
      "En tu panel cargás el RENSPA del campo una sola vez: queda guardado y sirve para todos tus ciclos.",
  },
  {
    titulo: "Elegís el tipo de ciclo",
    resumen:
      "Hay tres. Cada uno tiene su plazo y su reparto del resultado, y eso define qué te toca a vos y qué les toca a los colaboradores.",
    contenido: <TiposDeCiclo paraProductor />,
  },
  {
    titulo: "Publicás el proyecto",
    resumen:
      "Contás cuántas cabezas, de qué categoría, con qué peso entran y con cuál salen, cuánto capital necesitás y qué garantía ofrecés. Si todavía hay que comprar la hacienda, también a quién.",
  },
  {
    titulo: "Subís la documentación",
    resumen:
      "RENSPA, DT-e, listado de caravanas y boleto de compra-venta. Guardian cruza cada dato contra lo que declaraste y te avisa si algo no cierra, antes de publicar.",
  },
  {
    titulo: "Guardian valida y sale al catálogo",
    resumen:
      "En 24 a 72 horas se revisan las discrepancias y se verifica el DT-e contra SENASA. Si todo cierra, el proyecto queda visible para los colaboradores.",
  },
  {
    titulo: "Fondeo y desembolsos",
    resumen:
      "Los colaboradores ponen el capital en la cuenta del fideicomiso. Se libera por tramos contra la documentación de cada etapa, no todo junto.",
  },
  {
    titulo: "Seguimiento y cierre",
    resumen:
      "Durante el ciclo cargás las pesadas y los gastos. Al cerrar, el romaneo del frigorífico dice cuántos kilos salieron y con eso se liquida el reparto del resultado.",
  },
];

const PASOS_COLABORADOR: PasoDeRecorrido[] = [
  {
    titulo: "Mirás el catálogo",
    resumen:
      "Cada proyecto es un lote concreto, con su establecimiento, su RENSPA y el estado de validación a la vista.",
  },
  {
    titulo: "Entendés el tipo de ciclo",
    resumen:
      "Hay tres tipos de ciclo y cada uno tiene su plazo y su reparto del resultado. Es lo primero que conviene mirar de un proyecto.",
    contenido: <TiposDeCiclo paraProductor={false} />,
  },
  {
    titulo: "Leés la ficha y el contrato",
    resumen:
      "Ahí están el presupuesto, el cronograma de desembolsos, la garantía, quién soporta la mortandad y quién es el fiduciario. El resultado proyectado es una estimación: puede ser menor, o negativo.",
  },
  {
    titulo: "Adherís y transferís",
    resumen:
      "Elegís el monto y aceptás el contrato de adhesión. Después transferís a la cuenta del fideicomiso: el capital cuenta recién cuando el banco lo acredita.",
  },
  {
    titulo: "Seguís el ciclo",
    resumen:
      "Ves las pesadas, los gastos y el avance del lote hasta el cierre, en tu cartera.",
  },
  {
    titulo: "Cierre y liquidación",
    resumen:
      "Cuando el lote se faena, el romaneo de playa fija el resultado. De ahí sale lo que cobrás, en la cuenta que dejaste.",
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
            Listo, {datos.nombre.trim().split(" ")[0]}. Así funciona Guardian
          </h2>
          <p className="mt-2 text-tinta-suave">
            Este es el recorrido completo, de la primera pantalla al cierre del ciclo.
            Mirá cada paso o saltá directo al que te interese.
          </p>

          <div className="mt-6">
            <Recorrido
              pasos={lado === "productor" ? PASOS_PRODUCTOR : PASOS_COLABORADOR}
              final={
                <div className="space-y-5">
                  <Aviso tono="alerta" titulo="La cuenta todavía no se guarda">
                    Guardian es un prototipo: las cuentas se conectan en la etapa de
                    backend. Lo que cargaste no queda registrado, pero podés entrar igual
                    y recorrer toda la plataforma.
                  </Aviso>
                  <div className="flex flex-wrap gap-3">
                    <BotonLink href={lado === "productor" ? "/productor" : "/proyectos"}>
                      Entrar a Guardian
                    </BotonLink>
                    <Boton variante="secundario" onClick={() => setPaso(2)}>
                      Corregir mis datos
                    </Boton>
                  </div>
                </div>
              }
            />
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
