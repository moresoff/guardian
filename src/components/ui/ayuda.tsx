"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";

/**
 * El signo de pregunta que explica un término al pasar por encima. Abre también
 * al tabular y al tocar, porque en el teléfono no hay hover, y cierra con Escape.
 * El círculo se ve chico pero el área de toque es de 44px: el recuadro visible
 * queda centrado adentro gracias al margen negativo.
 */
export function Ayuda({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const id = useId();

  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={`Qué es ${etiqueta}`}
        aria-expanded={abierto}
        aria-describedby={abierto ? id : undefined}
        onMouseEnter={() => setAbierto(true)}
        onMouseLeave={() => setAbierto(false)}
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        onClick={() => setAbierto((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setAbierto(false);
        }}
        className="-m-3 grid size-11 place-items-center"
      >
        <span
          className="grid size-5 place-items-center rounded-full border border-current text-sm font-semibold leading-none opacity-70 transition-opacity hover:opacity-100"
          aria-hidden
        >
          ?
        </span>
      </button>

      {abierto ? (
        <span
          role="tooltip"
          id={id}
          className="absolute left-1/2 top-[calc(100%+0.75rem)] z-30 w-64 -translate-x-1/2 rounded-lg border border-borde bg-superficie p-3.5 text-sm font-normal normal-case tracking-normal text-tinta shadow-[var(--sombra-alta)]"
        >
          {children}
        </span>
      ) : null}
    </span>
  );
}
