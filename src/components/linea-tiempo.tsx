"use client";

import { useId, useRef, useState } from "react";

/**
 * Las etapas de un ciclo, en orden. El detalle aparece al pasar por encima, al
 * tabular o al tocar: en el teléfono no hay hover, así que la etapa también se
 * selecciona con el dedo y el texto se muestra abajo, nunca flotando encima.
 *
 * Es un tablist y no una fila de botones de alternar. Las cinco etapas gobiernan
 * el mismo panel, así que un lector de pantalla tiene que oír "seleccionada, 2
 * de 5" y saber qué cambió abajo; con `aria-pressed` oía "presionado" cinco
 * veces y nada del texto que aparecía. La selección sigue al foco, que es lo
 * que ya hacía con el mouse.
 */
export interface Etapa {
  n: string;
  titulo: string;
  duracion: string;
  detalle: string;
}

export function LineaDeTiempo({ etapas }: { etapas: Etapa[] }) {
  const [activa, setActiva] = useState(0);
  const etapa = etapas[activa];
  const base = useId();
  const botones = useRef<(HTMLButtonElement | null)[]>([]);

  const idEtapa = (i: number) => `${base}-etapa-${i}`;
  const idPanel = `${base}-detalle`;

  const conTeclado = (e: React.KeyboardEvent, i: number) => {
    const salto: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    if (e.key in salto) {
      e.preventDefault();
      botones.current[(i + salto[e.key] + etapas.length) % etapas.length]?.focus();
      return;
    }
    if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      botones.current[e.key === "Home" ? 0 : etapas.length - 1]?.focus();
    }
  };

  return (
    <div>
      <ol
        role="tablist"
        aria-label="Etapas del ciclo"
        className="relative grid gap-y-2 sm:grid-cols-2 lg:grid-cols-5"
      >
        <span
          className="absolute left-0 right-0 top-[0.4375rem] hidden h-px bg-borde lg:block"
          aria-hidden
        />
        {etapas.map((e, i) => {
          const seleccionada = i === activa;
          return (
            // La lista ordenada se queda porque el orden es parte del contenido,
            // pero las etapas tienen que colgar del tablist sin un `li` en el medio.
            <li key={e.n} role="presentation" className="relative">
              <button
                ref={(el) => {
                  botones.current[i] = el;
                }}
                type="button"
                role="tab"
                id={idEtapa(i)}
                aria-selected={seleccionada}
                aria-controls={idPanel}
                // Foco itinerante: las cinco etapas son una sola parada de Tab y
                // adentro se recorren con las flechas.
                tabIndex={seleccionada ? 0 : -1}
                onMouseEnter={() => setActiva(i)}
                onFocus={() => setActiva(i)}
                onClick={() => setActiva(i)}
                onKeyDown={(ev) => conTeclado(ev, i)}
                className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-superficie lg:block lg:px-2 lg:pt-0 lg:text-center"
              >
                <span
                  className={`block size-3.5 shrink-0 rounded-full border-2 bg-papel transition-colors lg:mx-auto lg:mb-3 ${
                    seleccionada
                      ? "border-marca bg-marca"
                      : "border-borde-fuerte group-hover:border-marca-viva"
                  }`}
                  aria-hidden
                />
                <span>
                  <span
                    className={`rotulo block transition-colors ${
                      seleccionada ? "text-marca" : "text-tinta-tenue"
                    }`}
                  >
                    {e.n}
                  </span>
                  <span
                    className={`mt-0.5 block font-medium transition-colors ${
                      seleccionada ? "text-tinta" : "text-tinta-suave"
                    }`}
                  >
                    {e.titulo}
                  </span>
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
        className="mt-6 rounded-xl border border-borde bg-superficie p-6 shadow-[var(--sombra-baja)] sm:min-h-[9rem]"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="rotulo text-marca">{etapa.n}</span>
          <span className="rounded-full bg-marca-suave px-3 py-1 text-sm font-medium text-marca">
            {etapa.duracion}
          </span>
        </div>
        <h3 className="mt-3 text-xl font-semibold tracking-tight">{etapa.titulo}</h3>
        <p className="mt-2 max-w-2xl text-tinta-suave">{etapa.detalle}</p>
      </div>
    </div>
  );
}
