"use client";

import { useId, useState, useTransition } from "react";
import { Campo } from "@/components/ui/campos";
import { Boton } from "@/components/ui/primitivos";
import type { Resultado } from "./acciones";

type Accion = (f: FormData) => Promise<Resultado>;

/** Un botón que hace una sola cosa en el servidor y dice si salió mal. */
export function BotonAccion({
  accion,
  datos,
  children,
  variante = "primario",
  className = "",
  disabled = false,
}: {
  accion: Accion;
  datos: Record<string, string>;
  children: React.ReactNode;
  variante?: "primario" | "secundario" | "peligro";
  className?: string;
  disabled?: boolean;
}) {
  const [pendiente, empezar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className={className}>
      <Boton
        type="button"
        variante={variante}
        className="w-full"
        disabled={disabled || pendiente}
        onClick={() =>
          empezar(async () => {
            const f = new FormData();
            for (const [k, v] of Object.entries(datos)) f.set(k, v);
            const r = await accion(f);
            setError(r.ok ? null : r.error);
          })
        }
      >
        {pendiente ? "Guardando…" : children}
      </Boton>
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Una acción que necesita un texto: rechazar con su motivo, resolver una
 * diferencia diciendo cómo. El botón abre el campo; nada se guarda sin el texto.
 */
export function AccionConTexto({
  accion,
  datos,
  boton,
  etiqueta,
  confirmar,
  variante = "secundario",
  className = "",
}: {
  accion: Accion;
  datos: Record<string, string>;
  boton: string;
  etiqueta: string;
  confirmar: string;
  variante?: "primario" | "secundario" | "peligro";
  className?: string;
}) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [pendiente, empezar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const campo = datos.discrepanciaId ? "resolucion" : "motivo";

  if (!abierto) {
    return (
      <Boton type="button" variante={variante} className={className} onClick={() => setAbierto(true)}>
        {boton}
      </Boton>
    );
  }
  return (
    <form
      className={`w-full rounded-xl border border-borde bg-superficie-2 p-3 ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        empezar(async () => {
          const f = new FormData();
          for (const [k, v] of Object.entries(datos)) f.set(k, v);
          f.set(campo, texto);
          const r = await accion(f);
          if (r.ok) setAbierto(false);
          setError(r.ok ? null : r.error);
        });
      }}
    >
      <label htmlFor={id} className="text-sm font-medium">
        {etiqueta}
      </label>
      <textarea
        id={id}
        autoFocus
        rows={2}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-1 w-full rounded-lg border border-borde-fuerte bg-superficie p-2 text-base"
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-error">
          {error}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap justify-end gap-2">
        <Boton type="button" variante="secundario" onClick={() => setAbierto(false)}>
          Cancelar
        </Boton>
        <Boton type="submit" variante={variante === "peligro" ? "peligro" : "primario"} disabled={pendiente}>
          {pendiente ? "Guardando…" : confirmar}
        </Boton>
      </div>
    </form>
  );
}

export interface CampoFormulario {
  nombre: string;
  etiqueta: string;
  ayuda?: string;
  numerico?: boolean;
  defecto?: string;
}

/**
 * Un formulario corto que manda varios datos a una acción del servidor: los
 * requisitos de la compra, la venta del ciclo. El error vuelve del servidor y
 * se muestra debajo del botón.
 */
export function FormularioAccion({
  accion,
  datos,
  campos,
  boton,
}: {
  accion: Accion;
  datos: Record<string, string>;
  campos: CampoFormulario[];
  boton: string;
}) {
  const [pendiente, empezar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        for (const [k, v] of Object.entries(datos)) f.set(k, v);
        empezar(async () => {
          const r = await accion(f);
          setError(r.ok ? null : r.error);
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {campos.map((c) => (
          <Campo
            key={c.nombre}
            name={c.nombre}
            etiqueta={c.etiqueta}
            ayuda={c.ayuda}
            defaultValue={c.defecto}
            inputMode={c.numerico ? "decimal" : undefined}
            className={c.numerico ? "tabular" : ""}
            autoComplete="off"
            required
          />
        ))}
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-error">
          {error}
        </p>
      ) : null}
      <Boton type="submit" className="mt-4 w-full sm:w-auto" disabled={pendiente}>
        {pendiente ? "Guardando…" : boton}
      </Boton>
    </form>
  );
}
