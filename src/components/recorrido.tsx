"use client";

import { useRef, useState, type ReactNode } from "react";
import { Boton } from "@/components/ui/primitivos";

export interface PasoDeRecorrido {
  titulo: string;
  /** Una línea: qué hace la persona en este paso. */
  resumen: string;
  /** Lo que acompaña: un detalle, una tabla, lo que ve en pantalla. */
  contenido?: ReactNode;
}

/**
 * El recorrido de la aplicación, un paso por vez. Quien acaba de abrir la cuenta
 * no sabe qué sigue ni dónde: acá lo ve en orden, de la primera pantalla al
 * cierre del ciclo, y puede saltar a cualquier paso o avanzar de a uno.
 *
 * El anuncio del paso va en una región `aria-live` y el foco pasa al título cuando
 * se cambia de paso, para que un lector de pantalla no se quede en el botón.
 */
export function Recorrido({
  pasos,
  final,
}: {
  pasos: PasoDeRecorrido[];
  /** Lo que aparece en el último paso: los botones para entrar. */
  final: ReactNode;
}) {
  const [i, setI] = useState(0);
  const titulo = useRef<HTMLHeadingElement>(null);
  const paso = pasos[i];
  const ultimo = i === pasos.length - 1;

  const ir = (n: number) => {
    setI(n);
    // Después del render, para que el foco caiga en el título del paso nuevo.
    requestAnimationFrame(() => titulo.current?.focus());
  };

  return (
    <div>
      <ol className="flex flex-wrap gap-2" aria-label="Pasos del recorrido">
        {pasos.map((p, n) => (
          <li key={p.titulo}>
            <button
              type="button"
              onClick={() => ir(n)}
              aria-current={n === i ? "step" : undefined}
              aria-label={`Paso ${n + 1}: ${p.titulo}`}
              className={`grid size-11 place-items-center rounded-full border text-sm font-semibold transition-colors ${
                n === i
                  ? "border-marca bg-marca text-marca-contraste"
                  : n < i
                    ? "border-marca/30 bg-marca-suave text-marca"
                    : "border-borde bg-superficie text-tinta-suave hover:bg-superficie-2"
              }`}
            >
              {n + 1}
            </button>
          </li>
        ))}
      </ol>

      <section
        className="mt-6 rounded-2xl border border-borde bg-superficie p-5 shadow-[var(--sombra-baja)] sm:p-6"
        aria-live="polite"
      >
        <p className="rotulo text-tinta-tenue">
          Paso {i + 1} de {pasos.length}
        </p>
        <h3
          ref={titulo}
          tabIndex={-1}
          className="mt-1 text-xl font-semibold tracking-tight outline-none"
        >
          {paso.titulo}
        </h3>
        <p className="mt-2 text-tinta-suave">{paso.resumen}</p>
        {paso.contenido ? <div className="mt-4">{paso.contenido}</div> : null}
      </section>

      <div className="mt-5 flex flex-wrap gap-3">
        {i > 0 ? (
          <Boton variante="secundario" onClick={() => ir(i - 1)}>
            Anterior
          </Boton>
        ) : null}
        {!ultimo ? <Boton onClick={() => ir(i + 1)}>Siguiente</Boton> : null}
      </div>

      {ultimo ? <div className="mt-6">{final}</div> : null}
    </div>
  );
}
