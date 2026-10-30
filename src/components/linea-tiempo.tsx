"use client";

import { Pause, Play } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

/**
 * Las etapas de un ciclo. Pasan solas, una cada pocos segundos, para que quien
 * llega las vea en orden sin tener que hacer nada; y cada una se puede elegir
 * (con el mouse, el dedo o el teclado) para quedarse en esa.
 *
 * El avance automático cumple lo que pide la accesibilidad: se pausa mientras el
 * mouse está encima, tiene un botón para pausar y reanudar, y no
 * corre si la persona pidió menos movimiento. Elegir una etapa lo pausa: quien
 * eligió una quiere leerla, no que se le vaya.
 *
 * Es un tablist: las cinco etapas gobiernan el mismo panel y un lector de
 * pantalla oye "seleccionada, 2 de 5".
 */
export interface Etapa {
  n: string;
  titulo: string;
  duracion: string;
  detalle: string;
}

const SEGUNDOS = 7;

const sinMovimiento = {
  suscribir: (cb: () => void) => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    m.addEventListener("change", cb);
    return () => m.removeEventListener("change", cb);
  },
  actual: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  servidor: () => false,
};

export function LineaDeTiempo({ etapas }: { etapas: Etapa[] }) {
  const [activa, setActiva] = useState(0);
  const [pausadoPorUsuario, setPausadoPorUsuario] = useState(false);
  const [encima, setEncima] = useState(false);
  const reducido = useSyncExternalStore(
    sinMovimiento.suscribir,
    sinMovimiento.actual,
    sinMovimiento.servidor,
  );
  const base = useId();
  const botones = useRef<(HTMLButtonElement | null)[]>([]);

  const corriendo = !pausadoPorUsuario && !encima && !reducido;

  useEffect(() => {
    if (!corriendo) return;
    const t = setTimeout(
      () => setActiva((a) => (a + 1) % etapas.length),
      SEGUNDOS * 1000,
    );
    return () => clearTimeout(t);
  }, [corriendo, activa, etapas.length]);

  const elegir = (i: number) => {
    setActiva(i);
    setPausadoPorUsuario(true);
  };

  const idEtapa = (i: number) => `${base}-etapa-${i}`;
  const idPanel = `${base}-detalle`;
  const etapa = etapas[activa];

  const conTeclado = (e: React.KeyboardEvent, i: number) => {
    const salto: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    if (e.key in salto) {
      e.preventDefault();
      const j = (i + salto[e.key] + etapas.length) % etapas.length;
      botones.current[j]?.focus();
      elegir(j);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const j = e.key === "Home" ? 0 : etapas.length - 1;
      botones.current[j]?.focus();
      elegir(j);
    }
  };

  return (
    <div>
      {/* Con el mouse encima de las etapas o del texto el recorrido espera; el botón de pausa queda afuera para que "Reanudar" reanude. */}
      <div
        onMouseEnter={() => setEncima(true)}
        onMouseLeave={() => setEncima(false)}
      >
        <ol
          role="tablist"
          aria-label="Etapas del ciclo"
          className="grid gap-2 sm:grid-cols-5"
        >
          {etapas.map((e, i) => {
            const seleccionada = i === activa;
            return (
              <li key={e.n} role="presentation">
                <button
                  ref={(el) => {
                    botones.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={idEtapa(i)}
                  aria-selected={seleccionada}
                  aria-controls={idPanel}
                  tabIndex={seleccionada ? 0 : -1}
                  onClick={() => elegir(i)}
                  onKeyDown={(ev) => conTeclado(ev, i)}
                  className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors sm:block ${
                    seleccionada
                      ? "bg-superficie shadow-[var(--sombra-baja)]"
                      : "hover:bg-superficie/60"
                  }`}
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      seleccionada
                        ? "bg-marca text-marca-contraste"
                        : "bg-superficie-2 text-tinta-suave"
                    }`}
                  >
                    {e.n}
                  </span>
                  <span
                    className={`block font-medium transition-colors sm:mt-3 ${
                      seleccionada ? "text-tinta" : "text-tinta-suave"
                    }`}
                  >
                    {e.titulo}
                  </span>
                  <span
                    className="ml-auto block h-1 w-12 overflow-hidden rounded-full bg-borde sm:mt-3 sm:w-full"
                    aria-hidden
                  >
                    {seleccionada ? (
                      <span
                        key={`${activa}-${corriendo}`}
                        className="etapa-progreso block h-full rounded-full bg-marca"
                        style={
                          {
                            "--etapa-duracion": `${SEGUNDOS}s`,
                            animationPlayState: corriendo
                              ? "running"
                              : "paused",
                            // En pausa la barra queda llena: ya se sabe cuál es la elegida.
                            ...(corriendo
                              ? {}
                              : { animation: "none", transform: "scaleX(1)" }),
                          } as React.CSSProperties
                        }
                      />
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div
          role="tabpanel"
          id={idPanel}
          aria-labelledby={idEtapa(activa)}
          tabIndex={0}
          className="mt-4 rounded-3xl bg-superficie p-6 shadow-[var(--sombra-baja)] sm:min-h-44 sm:p-8"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold tracking-tight">
              {etapa.titulo}
            </h3>
            <span className="rounded-full bg-marca-suave px-3 py-1 text-sm font-medium text-marca">
              {etapa.duracion}
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-tinta-suave">{etapa.detalle}</p>
        </div>
      </div>

      {reducido ? null : (
        <button
          type="button"
          onClick={() => setPausadoPorUsuario((p) => !p)}
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-tinta-suave transition-colors hover:bg-superficie hover:text-tinta"
        >
          {pausadoPorUsuario ? (
            <Play className="size-4" strokeWidth={1.75} aria-hidden />
          ) : (
            <Pause className="size-4" strokeWidth={1.75} aria-hidden />
          )}
          {pausadoPorUsuario ? "Reanudar el recorrido" : "Pausar el recorrido"}
        </button>
      )}
    </div>
  );
}
