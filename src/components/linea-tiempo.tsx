/**
 * Las etapas de un ciclo, en orden y todas a la vista. Antes el detalle aparecía
 * al pasar el mouse; en el teléfono no hay hover y quien recién llega no sabe
 * que tiene que tocar, así que se lee de corrido, de arriba hacia abajo. El
 * número sí lleva información: la secuencia es el contenido.
 */
export interface Etapa {
  n: string;
  titulo: string;
  duracion: string;
  detalle: string;
}

export function LineaDeTiempo({ etapas }: { etapas: Etapa[] }) {
  return (
    <ol className="relative">
      {etapas.map((e, i) => (
        <li key={e.n} className="relative grid grid-cols-[2.5rem_1fr] gap-x-4 pb-8 last:pb-0 md:grid-cols-[2.5rem_14rem_1fr] md:gap-x-6">
          {i < etapas.length - 1 ? (
            <span
              className="absolute left-5 top-10 bottom-0 w-px -translate-x-1/2 bg-borde-fuerte"
              aria-hidden
            />
          ) : null}
          <span className="relative z-10 flex size-10 items-center justify-center rounded-full bg-marca font-semibold text-marca-contraste">
            {e.n}
          </span>
          <div className="pt-1.5">
            <h3 className="text-lg font-semibold tracking-tight">{e.titulo}</h3>
            <p className="mt-1 inline-block rounded-full bg-marca-suave px-3 py-0.5 text-sm font-medium text-marca">
              {e.duracion}
            </p>
          </div>
          <p className="col-start-2 mt-2 max-w-prose text-tinta-suave md:col-start-3 md:mt-1.5 md:pt-1.5">
            {e.detalle}
          </p>
        </li>
      ))}
    </ol>
  );
}
