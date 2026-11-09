"use client";

import { Check, FileText, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CICLOS } from "@/lib/ciclos";
import { CORREO_CONTACTO, TELEFONO_CONTACTO } from "@/lib/contacto";
import {
  CABEZAS_DEL_LOTE,
  ETAPAS_CUMPLIDAS,
  ETAPAS_DESPUES,
  PAPELES_DE_EJEMPLO,
  SISTEMAS,
  correrControles,
  leerPapelesDeEjemplo,
  listoParaRevision,
  type Lecturas,
} from "@/lib/simulacion";
import type { SistemaProductivo } from "@/lib/types";

/**
 * Un recorrido de ejemplo para el productor: elige cómo engorda, ve sus papeles
 * ya cargados, la lectura, los controles y cómo sigue el proyecto. Un solo paso
 * por pantalla y un solo botón principal por paso.
 *
 * No guarda nada ni pide cuenta. Hacia afuera no promete nada: describe el
 * recorrido, y las condiciones se consultan por el canal de contacto.
 */

const PASOS = ["Tu ciclo", "Tus papeles", "Revisión", "Cómo sigue"] as const;

const BOTON =
  "inline-flex min-h-12 items-center justify-center rounded-full px-6 text-base font-medium transition-colors";
const BOTON_PRIMARIO = `${BOTON} bg-marca text-marca-contraste hover:bg-marca-fuerte`;
const BOTON_SECUNDARIO = `${BOTON} border border-borde-fuerte text-tinta hover:bg-superficie-2`;

export function Simulador() {
  const [paso, setPaso] = useState(0);
  const [sistema, setSistema] = useState<SistemaProductivo | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [lecturas, setLecturas] = useState<Lecturas | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const pasoAnterior = useRef(paso);
  const seguir = useRef<HTMLButtonElement>(null);

  // Al cambiar de paso el foco va al título: con teclado o lector de pantalla se
  // sigue el recorrido sin tener que volver a buscarlo.
  useEffect(() => {
    if (pasoAnterior.current === paso) return;
    pasoAnterior.current = paso;
    titulo.current?.focus();
  }, [paso]);

  useEffect(() => {
    if (!leyendo) return;
    const t = setTimeout(() => {
      setLecturas(leerPapelesDeEjemplo());
      setLeyendo(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [leyendo]);

  // Cuando termina la lectura, el foco pasa al botón que sigue: el que estaba
  // apretado se transformó y, sin esto, el foco se perdía.
  useEffect(() => {
    if (lecturas) seguir.current?.focus();
  }, [lecturas]);

  const reiniciar = () => {
    setPaso(0);
    setSistema(null);
    setLecturas(null);
    setLeyendo(false);
  };

  const controles = lecturas ? correrControles(lecturas) : [];
  const listo = listoParaRevision(controles);

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <p className="text-base font-semibold uppercase tracking-[0.09em] text-tinta-tenue">Ejemplo, sin cuenta</p>
      <ol className="mt-3 grid grid-cols-4 gap-2" aria-label="Pasos del recorrido">
        {PASOS.map((nombre, i) => (
          <li key={nombre} aria-current={i === paso ? "step" : undefined}>
            <div
              className={`h-1.5 rounded-full ${i <= paso ? "bg-marca" : "bg-superficie-2"}`}
              aria-hidden
            />
            <span className="sr-only">
              Paso {i + 1}: {nombre}
              {i < paso ? " (hecho)" : ""}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-base font-medium text-tinta" aria-hidden>
        Paso {paso + 1} de {PASOS.length} · {PASOS[paso]}
      </p>

      <div className="mt-6 rounded-2xl border border-borde bg-superficie p-5 shadow-[var(--sombra-baja)] sm:p-8">
        {paso === 0 ? (
          <section aria-labelledby="t-paso">
            <h1 id="t-paso" ref={titulo} tabIndex={-1} className="text-3xl font-semibold text-tinta text-balance outline-none">
              ¿Cómo engordás?
            </h1>
            <p className="mt-2 text-lg text-tinta-suave">
              Elegí uno. Es un ejemplo: con papeles ya cargados, sin cuenta y sin subir nada.
            </p>
            <div className="mt-6 grid gap-3">
              {SISTEMAS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSistema(s);
                    setPaso(1);
                  }}
                  className="min-h-16 rounded-2xl border border-borde-fuerte p-4 text-left transition-colors hover:border-marca hover:bg-marca-suave"
                >
                  <span className="block text-xl font-semibold text-tinta">{CICLOS[s].nombre}</span>
                  <span className="mt-1 block text-base text-tinta-suave">{CICLOS[s].descripcion}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {paso === 1 ? (
          <section aria-labelledby="t-paso">
            <h1 id="t-paso" ref={titulo} tabIndex={-1} className="text-3xl font-semibold text-tinta text-balance outline-none">
              Tus papeles ya están cargados
            </h1>
            <p className="mt-2 text-lg text-tinta-suave">
              Un lote de {CABEZAS_DEL_LOTE} cabezas, {sistema ? CICLOS[sistema].nombre.toLowerCase() : ""}. Guardian lee
              cada papel y te muestra qué entendió.
            </p>

            <ul className="mt-6 divide-y divide-borde border-y border-borde">
              {PAPELES_DE_EJEMPLO.map((p) => {
                const lectura = lecturas?.[p.tipo];
                return (
                  <li key={p.tipo} className="py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText aria-hidden strokeWidth={1.75} size={24} className="shrink-0 text-marca" />
                        <div className="min-w-0">
                          <p className="text-lg font-medium text-tinta">{p.nombre}</p>
                          <p className="truncate text-base text-tinta-suave">{p.archivo}</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-borde-fuerte px-3 py-1 text-base font-medium text-tinta">
                        {lectura ? "Leído" : leyendo ? "Leyendo…" : "Cargado"}
                      </span>
                    </div>
                    {lectura ? (
                      <dl className="mt-3 grid gap-x-6 gap-y-2 rounded-xl bg-marca-suave p-4 sm:grid-cols-2">
                        {lectura.campos.map((c) => (
                          <div key={c.etiqueta} className="min-w-0">
                            <dt className="text-base text-tinta-suave">{c.etiqueta}</dt>
                            <dd className="codigo break-words text-base font-medium text-tinta">{c.valor}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <p className="mt-4 text-base text-tinta-tenue" role="status" aria-live="polite">
              {leyendo
                ? "Leyendo los papeles…"
                : lecturas
                  ? "Listo. Los valores en letra de máquina salieron del papel, no de un formulario."
                  : "Son papeles de ejemplo."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {lecturas ? (
                <button ref={seguir} type="button" className={BOTON_PRIMARIO} onClick={() => setPaso(2)}>
                  Revisar que cierre
                </button>
              ) : (
                <button
                  type="button"
                  className={BOTON_PRIMARIO}
                  aria-disabled={leyendo}
                  onClick={() => {
                    if (!leyendo) setLeyendo(true);
                  }}
                >
                  {leyendo ? "Leyendo…" : "Leer los papeles"}
                </button>
              )}
              <button type="button" className={BOTON_SECUNDARIO} onClick={() => setPaso(0)}>
                Cambiar de ciclo
              </button>
            </div>
          </section>
        ) : null}

        {paso === 2 ? (
          <section aria-labelledby="t-paso">
            <h1 id="t-paso" ref={titulo} tabIndex={-1} className="text-3xl font-semibold text-tinta text-balance outline-none">
              {listo ? "Todo cierra" : "Hay algo para revisar"}
            </h1>
            <p className="mt-2 text-lg text-tinta-suave">
              Guardian cruza lo que dice cada papel con tu lote antes de que lo revise una persona.
            </p>
            <ul className="mt-6 space-y-3">
              {controles.map((c) => (
                <li key={c.id} className="flex items-start gap-3 text-lg text-tinta">
                  <span
                    aria-hidden
                    className={`mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full ${c.ok ? "bg-marca text-marca-contraste" : "bg-alerta-suave text-alerta"}`}
                  >
                    <Check strokeWidth={2} size={16} />
                  </span>
                  <span>
                    <span className="sr-only">{c.ok ? "Cierra: " : "Revisar: "}</span>
                    {c.texto}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-xl bg-superficie-2 p-4 text-base text-tinta-suave">
              Que los datos cierren no prueba que el papel sea auténtico. Eso lo comprueba Guardian
              aparte, contra el organismo que lo emitió.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className={BOTON_PRIMARIO} onClick={() => setPaso(3)}>
                Ver cómo sigue
              </button>
              <button type="button" className={BOTON_SECUNDARIO} onClick={() => setPaso(1)}>
                Volver a los papeles
              </button>
            </div>
          </section>
        ) : null}

        {paso === 3 ? (
          <section aria-labelledby="t-paso">
            <h1 id="t-paso" ref={titulo} tabIndex={-1} className="text-3xl font-semibold text-tinta text-balance outline-none">
              Tu ciclo quedó presentado
            </h1>
            <p className="mt-2 text-lg text-tinta-suave">
              Así sigue, etapa por etapa. En este ejemplo vas por la segunda.
            </p>
            <ol className="mt-6 space-y-4">
              {ETAPAS_DESPUES.map((e, i) => {
                const cumplida = i < ETAPAS_CUMPLIDAS;
                const actual = i === ETAPAS_CUMPLIDAS - 1;
                return (
                  <li key={e.nombre} className="flex gap-3" aria-current={actual ? "step" : undefined}>
                    <span
                      aria-hidden
                      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full text-base font-medium ${cumplida ? "bg-marca text-marca-contraste" : "border border-borde-fuerte text-tinta-suave"}`}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-lg font-medium text-tinta">
                        {e.nombre}
                        {cumplida ? <span className="sr-only"> (hecho)</span> : null}
                        {actual ? <span className="ml-2 text-base font-normal text-marca">estás acá</span> : null}
                      </p>
                      <p className="text-base text-tinta-suave">{e.detalle}</p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-8 border-t border-borde pt-6">
              <p className="text-lg font-medium text-tinta">¿Querés hacerlo con tu lote?</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link href="/registro?lado=productor" className={BOTON_PRIMARIO}>
                  Crear mi cuenta
                </Link>
                <button type="button" className={BOTON_SECUNDARIO} onClick={reiniciar}>
                  Probar otro ciclo
                </button>
              </div>
              <p className="mt-5 text-base text-tinta-suave">
                Consultá por modalidades de participación. Te respondemos por el medio que prefieras.
              </p>
              <p className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-base">
                <a className="inline-flex min-h-11 items-center gap-2 font-medium text-marca underline" href={`mailto:${CORREO_CONTACTO}`}>
                  <Mail aria-hidden strokeWidth={1.75} size={20} />
                  {CORREO_CONTACTO}
                </a>
                <a className="inline-flex min-h-11 items-center gap-2 font-medium text-marca underline" href={`tel:${TELEFONO_CONTACTO.replace(/\s/g, "")}`}>
                  <Phone aria-hidden strokeWidth={1.75} size={20} />
                  {TELEFONO_CONTACTO}
                </a>
              </p>
            </div>
          </section>
        ) : null}
      </div>

      <p className="mt-4 text-base text-tinta-tenue">
        Prototipo académico. Papeles y datos de ejemplo; no constituye oferta pública.
      </p>
    </div>
  );
}
