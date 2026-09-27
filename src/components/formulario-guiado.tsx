import type { ReactNode } from "react";

/**
 * El armazón de las pantallas de carga: a la izquierda cuánto llevás y qué
 * tramos tiene el formulario, en el medio el formulario, y a la derecha lo que
 * conviene tener a la vista mientras lo completás. Quien carga datos largos
 * necesita saber siempre dónde está parado y cuánto falta.
 */
export interface PasoGuiado {
  clave: string;
  titulo: string;
  detalle: string;
  estado: "hecho" | "actual" | "pendiente";
  /** Ancla de la sección a la que salta. */
  href?: string;
}

export function FormularioGuiado({
  progreso,
  leyenda = "completo",
  pasos,
  aside,
  children,
}: {
  progreso: number;
  leyenda?: string;
  pasos: PasoGuiado[];
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[13.5rem_minmax(0,1fr)] xl:grid-cols-[13.5rem_minmax(0,1fr)_15rem]">
      <aside className="lg:sticky lg:top-24">
        <p className="inline-flex items-baseline gap-2 rounded-full bg-marca-suave px-4 py-2">
          <span className="tabular text-xl font-semibold text-marca">{progreso}%</span>
          <span className="text-sm font-medium text-marca">{leyenda}</span>
        </p>

        <ol className="mt-4 space-y-3">
          {pasos.map((p) => {
            const contenido = (
              <>
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full text-sm ${
                    p.estado === "hecho"
                      ? "bg-marca text-marca-contraste"
                      : p.estado === "actual"
                        ? "bg-marca-viva text-marca-contraste"
                        : "bg-superficie-2 text-tinta-tenue"
                  }`}
                  aria-hidden
                >
                  {p.estado === "hecho" ? "✓" : "•"}
                </span>
                <span>
                  <span className="block font-medium">{p.titulo}</span>
                  <span className="mt-1 block text-sm text-tinta-suave">{p.detalle}</span>
                </span>
              </>
            );

            const clases = `flex gap-2.5 rounded-xl border p-4 ${
              p.estado === "actual"
                ? "border-marca bg-marca-suave"
                : "border-borde bg-superficie"
            }`;

            return (
              <li key={p.clave}>
                {p.href ? (
                  <a
                    href={p.href}
                    className={`${clases} transition-colors hover:border-marca`}
                  >
                    {contenido}
                  </a>
                ) : (
                  <div className={clases}>{contenido}</div>
                )}
              </li>
            );
          })}
        </ol>
      </aside>

      <div>{children}</div>

      {aside ? <aside className="hidden xl:sticky xl:top-24 xl:block">{aside}</aside> : null}
    </div>
  );
}

/** Una sección del formulario, con su rótulo y su bajada. */
export function SeccionFormulario({
  id,
  titulo,
  descripcion,
  children,
}: {
  id: string;
  titulo: string;
  descripcion: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-borde pt-7 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-semibold tracking-tight">{titulo}</h2>
      <p className="mt-1 max-w-xl text-sm text-tinta-suave">{descripcion}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}
