"use client";

import Link from "next/link";
import { useState } from "react";

export interface Aviso {
  id: string;
  titulo: string;
  texto: string;
  href: string;
  accion: string;
}

/**
 * Lo que espera algo del productor y lo que pasó sin él, en un solo banner que
 * cruza el ancho de la pantalla. No son tarjetas: una tarjeta invita a comparar
 * cuatro cosas a la vez y acá se trata de resolver una y pasar a la siguiente.
 * Se cambia con las flechas —nunca arrastrando una barra— y todos se ven igual,
 * contorno verde sobre blanco, porque la urgencia ya está escrita en el texto.
 */
export function Avisos({ avisos }: { avisos: Aviso[] }) {
  const [i, setI] = useState(0);
  const aviso = avisos[i];
  if (!aviso) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-xl border border-marca bg-superficie px-5 py-4"
      aria-live="polite"
    >
      <div className="min-w-[16rem] flex-1">
        <p className="font-medium">{aviso.titulo}</p>
        <p className="mt-1 text-sm text-tinta-suave">{aviso.texto}</p>
      </div>

      <Link
        href={aviso.href}
        className="flex min-h-11 items-center rounded-lg border border-marca px-4 py-2 text-sm font-medium text-marca transition-colors hover:bg-marca hover:text-marca-contraste"
      >
        {aviso.accion}
      </Link>

      {avisos.length > 1 ? (
        <div className="flex items-center gap-3 border-borde sm:border-l sm:pl-6">
          <p className="tabular text-sm text-tinta-suave">
            {i + 1} de {avisos.length}
          </p>
          <Flecha
            direccion="anterior"
            onClick={() => setI((v) => v - 1)}
            disabled={i === 0}
          />
          <Flecha
            direccion="siguiente"
            onClick={() => setI((v) => v + 1)}
            disabled={i === avisos.length - 1}
          />
        </div>
      ) : null}
    </div>
  );
}

function Flecha({
  direccion,
  onClick,
  disabled,
}: {
  direccion: "anterior" | "siguiente";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direccion === "anterior" ? "Aviso anterior" : "Aviso siguiente"}
      className="grid size-11 place-items-center rounded-full border border-marca/25 bg-marca-suave text-marca transition-colors hover:bg-marca hover:text-marca-contraste disabled:cursor-not-allowed disabled:border-borde disabled:bg-superficie-2 disabled:text-tinta-tenue"
    >
      {direccion === "anterior" ? "←" : "→"}
    </button>
  );
}
