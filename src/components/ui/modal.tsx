"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Un aviso que se pone delante de todo y espera. Se usa cuando algo terminó de
 * pasar —se leyó un documento, se guardó la ficha— y el productor no debería
 * enterarse por un cartel que aparece tres pantallas más abajo.
 *
 * Se cierra con la cruz, con Escape o tocando fuera, y devuelve el foco a donde
 * estaba: nadie queda encerrado adentro de una confirmación.
 */
export function Modal({
  abierto,
  titulo,
  onCerrar,
  children,
  pie,
}: {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
  pie?: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const previo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!abierto) return;

    previo.current = document.activeElement as HTMLElement | null;
    panel.current?.focus();

    // El foco no se va del modal mientras esté abierto: con teclado, tabular
    // hasta la página de atrás deja al usuario escribiendo en un formulario que
    // no ve.
    const conTeclado = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCerrar();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;

      const focusables = panel.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];
      if (!primero || !ultimo) return;

      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener("keydown", conTeclado);

    const scrollPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", conTeclado);
      document.body.style.overflow = scrollPrevio;
      previo.current?.focus();
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/40 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className="flex max-h-[85svh] w-full max-w-lg flex-col rounded-2xl border border-borde bg-superficie shadow-[var(--sombra-alta)] outline-none"
      >
        {/* El encabezado y el pie quedan fijos y solo el cuerpo se desplaza: con
            todo el panel en un mismo scroll, los botones se van abajo del corte y
            el productor no ve con qué termina la pantalla. */}
        <div className="flex shrink-0 items-start justify-between gap-4 p-6 pb-4 sm:p-7 sm:pb-4">
          <h2 className="text-lg font-semibold tracking-tight">{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="-m-2 grid size-11 shrink-0 place-items-center rounded-lg text-tinta-suave transition-colors hover:bg-superficie-2 hover:text-tinta"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain px-6 pb-2 sm:px-7">{children}</div>

        {pie ? (
          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-borde p-6 sm:flex-row sm:justify-end sm:p-7">
            {pie}
          </div>
        ) : null}
      </div>
    </div>
  );
}
