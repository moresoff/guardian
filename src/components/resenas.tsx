"use client";

import { useRef } from "react";

export interface Resena {
  texto: string;
  nombre: string;
  rol: string;
}

/**
 * Carrusel de reseñas. El scroll horizontal nativo hace el trabajo —con snap y
 * teclado incluidos— y los botones son un atajo, no el único modo de moverse.
 */
export function Resenas({ resenas }: { resenas: Resena[] }) {
  const pista = useRef<HTMLUListElement>(null);

  const mover = (direccion: 1 | -1) => {
    const el = pista.current;
    if (!el) return;
    const paso = el.firstElementChild?.clientWidth ?? 320;
    el.scrollBy({ left: direccion * (paso + 16), behavior: "smooth" });
  };

  return (
    <div>
      <ul
        ref={pista}
        tabIndex={0}
        aria-label="Reseñas"
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
      >
        {resenas.map((r) => (
          <li
            key={r.nombre}
            className="relative flex w-[19rem] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-borde bg-superficie p-6 shadow-[var(--sombra-baja)]"
          >
            <span
              className="pointer-events-none absolute -top-3 right-4 text-6xl font-semibold text-marca-viva/35"
              aria-hidden
            >
              &rdquo;
            </span>
            <p className="relative flex-1 text-tinta-suave">{r.texto}</p>
            <div className="mt-5 flex items-center gap-3 border-t border-borde pt-4">
              <span
                className="grid size-10 shrink-0 place-items-center rounded-full bg-marca-suave font-semibold text-marca"
                aria-hidden
              >
                {r.nombre.charAt(0)}
              </span>
              <span>
                <span className="block font-medium">{r.nombre}</span>
                <span className="block text-sm text-tinta-tenue">{r.rol}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => mover(-1)}
          aria-label="Reseñas anteriores"
          className="grid size-11 place-items-center rounded-full border border-marca/25 bg-marca-suave text-marca transition-colors hover:bg-marca hover:text-marca-contraste"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => mover(1)}
          aria-label="Reseñas siguientes"
          className="grid size-11 place-items-center rounded-full border border-marca/25 bg-marca-suave text-marca transition-colors hover:bg-marca hover:text-marca-contraste"
        >
          →
        </button>
      </div>
    </div>
  );
}
