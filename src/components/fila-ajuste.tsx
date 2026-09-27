import type { ReactNode } from "react";

/**
 * Una fila de ajuste: a la izquierda qué es y qué implica, a la derecha el
 * control o el valor.
 *
 * Es el patrón que reemplaza al formulario en el perfil. Una grilla de campos
 * vacíos obliga a leer diez etiquetas para encontrar la que se quiere cambiar;
 * una lista de filas se recorre de un vistazo y cada renglón explica qué pasa si
 * se toca.
 */
export function FilaAjuste({
  titulo,
  descripcion,
  children,
}: {
  titulo: ReactNode;
  descripcion?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-borde py-4 first:border-t-0 first:pt-0">
      <div className="max-w-xl">
        <p className="font-medium">{titulo}</p>
        {descripcion ? (
          <p className="mt-0.5 text-sm text-tinta-suave">{descripcion}</p>
        ) : null}
      </div>
      {children ? <div className="flex items-center gap-3">{children}</div> : null}
    </div>
  );
}

/** Lo mismo, para un dato que se lee y no se toca. */
export function FilaDato({
  etiqueta,
  children,
  ayuda,
  codigo = false,
}: {
  etiqueta: string;
  children: ReactNode;
  ayuda?: ReactNode;
  codigo?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-borde py-3.5 first:border-t-0 first:pt-0">
      <dt className="text-sm text-tinta-suave">
        {etiqueta}
        {ayuda ? (
          <span className="mt-0.5 block text-sm text-tinta-tenue">{ayuda}</span>
        ) : null}
      </dt>
      <dd className={`font-medium ${codigo ? "codigo" : "tabular"}`}>{children}</dd>
    </div>
  );
}
