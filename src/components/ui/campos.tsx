"use client";

import { useId, useRef } from "react";
import type { ComponentProps, ReactNode } from "react";

/**
 * Un campo de formulario para gente que puede estar cargando esto desde el
 * teléfono, en el campo y con sol de frente: etiqueta siempre visible (nunca
 * dentro del campo), texto grande, área de toque alta y el error escrito con
 * palabras, no con un borde rojo solamente.
 */
export function Campo({
  etiqueta,
  ayuda,
  error,
  className = "",
  id: idPropio,
  ...props
}: ComponentProps<"input"> & {
  etiqueta: string;
  ayuda?: ReactNode;
  error?: string;
}) {
  const idAuto = useId();
  const id = idPropio ?? idAuto;
  const ayudaId = `${id}-ayuda`;
  const errorId = `${id}-error`;
  const describe = [ayuda ? ayudaId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={id} className="block font-medium">
        {etiqueta}
      </label>
      {ayuda ? (
        <p id={ayudaId} className="mt-0.5 text-sm text-tinta-suave">
          {ayuda}
        </p>
      ) : null}
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe || undefined}
        className={`mt-1.5 block min-h-11 w-full rounded-lg border bg-superficie px-3.5 py-2.5 text-base text-tinta placeholder:text-tinta-tenue ${
          error ? "border-error" : "border-borde-fuerte"
        } ${className}`}
        {...props}
      />
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm font-medium text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Lo mismo que `Campo` pero para un texto de varios renglones. Existe porque hay
 * datos que no entran en una línea —en qué se gasta el capital, por ejemplo— y
 * meterlos en un input obliga a escribir a ciegas.
 */
export function CampoLargo({
  etiqueta,
  ayuda,
  error,
  className = "",
  id: idPropio,
  ...props
}: ComponentProps<"textarea"> & {
  etiqueta: string;
  ayuda?: ReactNode;
  error?: string;
}) {
  const idAuto = useId();
  const id = idPropio ?? idAuto;
  const ayudaId = `${id}-ayuda`;
  const errorId = `${id}-error`;
  const describe = [ayuda ? ayudaId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={id} className="block font-medium">
        {etiqueta}
      </label>
      {ayuda ? (
        <p id={ayudaId} className="mt-0.5 text-sm text-tinta-suave">
          {ayuda}
        </p>
      ) : null}
      <textarea
        id={id}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe || undefined}
        className={`mt-1.5 block w-full rounded-lg border bg-superficie px-3.5 py-2.5 text-base text-tinta placeholder:text-tinta-tenue ${
          error ? "border-error" : "border-borde-fuerte"
        } ${className}`}
        {...props}
      />
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm font-medium text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface OpcionUnica<T extends string> {
  valor: T;
  titulo: string;
  descripcion?: string;
}

/**
 * Una elección excluyente: opciones grandes y clickeables de punta a punta,
 * porque elegir no debería ser puntería.
 *
 * Es un radiogroup y no una fila de botones de alternar. La diferencia se nota
 * con lector de pantalla —"seleccionado, 2 de 3" en vez de "presionado"— y con
 * teclado: se entra al grupo con Tab una sola vez y se elige con las flechas,
 * que es como funciona cualquier grupo de opciones del sistema.
 */
export function GrupoOpciones<T extends string>({
  etiqueta,
  opciones,
  valor,
  onCambio,
  className = "space-y-3",
}: {
  etiqueta: string;
  opciones: OpcionUnica<T>[];
  valor: T | null;
  onCambio: (valor: T) => void;
  className?: string;
}) {
  const botones = useRef<(HTMLButtonElement | null)[]>([]);

  const mover = (desde: number, paso: number) => {
    const i = (desde + paso + opciones.length) % opciones.length;
    onCambio(opciones[i].valor);
    botones.current[i]?.focus();
  };

  const conTeclado = (e: React.KeyboardEvent, i: number) => {
    const salto: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    if (e.key in salto) {
      e.preventDefault();
      mover(i, salto[e.key]);
      return;
    }
    if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const i2 = e.key === "Home" ? 0 : opciones.length - 1;
      onCambio(opciones[i2].valor);
      botones.current[i2]?.focus();
    }
  };

  return (
    <div role="radiogroup" aria-label={etiqueta} className={className}>
      {opciones.map((o, i) => {
        const activa = valor === o.valor;
        return (
          <button
            key={o.valor}
            ref={(el) => {
              botones.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={activa}
            // Foco itinerante: el grupo entero ocupa una sola parada de Tab.
            tabIndex={activa || (valor === null && i === 0) ? 0 : -1}
            onClick={() => onCambio(o.valor)}
            onKeyDown={(e) => conTeclado(e, i)}
            className={`w-full rounded-xl border p-5 text-left transition-colors ${
              activa
                ? "border-marca bg-marca-suave"
                : "border-borde bg-superficie hover:border-marca hover:bg-marca-suave"
            }`}
          >
            <span className={`block text-lg font-semibold ${activa ? "text-marca" : ""}`}>
              {o.titulo}
            </span>
            {o.descripcion ? (
              <span className="mt-1 block text-sm text-tinta-suave">{o.descripcion}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Misma caja que `Campo`, para las listas cerradas. Una opción puede ser un texto
 * suelto, cuando lo que se guarda es lo que se lee, o un objeto cuando no: la
 * garantía se guarda por id y se muestra por nombre.
 */
export type OpcionSeleccion = string | { valor: string; label: string; disabled?: boolean };

export function Seleccion({
  etiqueta,
  ayuda,
  error,
  opciones,
  className = "",
  id: idPropio,
  ...props
}: ComponentProps<"select"> & {
  etiqueta: string;
  ayuda?: ReactNode;
  error?: string;
  opciones: OpcionSeleccion[];
}) {
  const idAuto = useId();
  const id = idPropio ?? idAuto;
  const ayudaId = `${id}-ayuda`;
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block font-medium">
        {etiqueta}
      </label>
      {ayuda ? (
        <p id={ayudaId} className="mt-0.5 text-sm text-tinta-suave">
          {ayuda}
        </p>
      ) : null}
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [ayuda ? ayudaId : null, error ? errorId : null].filter(Boolean).join(" ") ||
          undefined
        }
        className={`mt-1.5 block min-h-11 w-full rounded-lg border bg-superficie px-3.5 py-2.5 text-base text-tinta ${
          error ? "border-error" : "border-borde-fuerte"
        } ${className}`}
        {...props}
      >
        {opciones.map((o) => {
          const op = typeof o === "string" ? { valor: o, label: o } : o;
          return (
            <option key={op.valor} value={op.valor} disabled={op.disabled}>
              {op.label}
            </option>
          );
        })}
      </select>
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm font-medium text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Un interruptor de encendido y apagado, para los ajustes que se aplican en el
 * momento y no necesitan un botón de guardar.
 *
 * Es un `button` con `role="switch"` y no una casilla disfrazada: el lector de
 * pantalla tiene que oír "activado" o "desactivado", no "casilla marcada". La
 * etiqueta viene de afuera, de la fila que lo contiene, así que se pasa por
 * `aria-label` o por `aria-labelledby`.
 */
export function Interruptor({
  activo,
  onCambio,
  etiqueta,
  etiquetadoPor,
}: {
  activo: boolean;
  onCambio: (v: boolean) => void;
  etiqueta?: string;
  etiquetadoPor?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      aria-labelledby={etiquetadoPor}
      onClick={() => onCambio(!activo)}
      // El área táctil es de 44px aunque la pista dibujada sea más baja.
      className="grid h-11 w-14 shrink-0 place-items-center rounded-lg"
    >
      <span
        className={`flex h-7 w-12 items-center rounded-full border transition-colors ${
          activo ? "border-marca bg-marca" : "border-borde-fuerte bg-superficie-2"
        }`}
      >
        <span
          className={`size-5 rounded-full bg-papel shadow-[var(--sombra-baja)] transition-transform ${
            activo ? "translate-x-[1.4rem]" : "translate-x-[0.16rem]"
          }`}
        />
      </span>
    </button>
  );
}
