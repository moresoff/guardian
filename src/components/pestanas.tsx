import Link from "next/link";

export interface Pestana {
  clave: string;
  titulo: string;
}

/**
 * Pestañas que viven en la URL (`?tab=` por defecto): se pueden compartir, funcionan con el
 * botón atrás y no necesitan JavaScript. Son enlaces y no botones porque
 * cambian de lugar, no de estado.
 */
export function Pestanas({
  pestanas,
  activa,
  base,
  param = "tab",
}: {
  pestanas: Pestana[];
  activa: string;
  /** La ruta sobre la que se arman los enlaces. La primera pestaña va sin parámetro. */
  base: string;
  /** El parámetro de la URL; «tab» salvo que la página ya lo use para otra cosa. */
  param?: string;
}) {
  return (
    <nav aria-label="Secciones de la página" className="flex flex-wrap gap-1.5">
      {pestanas.map((p, i) => {
        const esActiva = p.clave === activa;
        return (
          <Link
            key={p.clave}
            href={i === 0 ? base : `${base}${base.includes("?") ? "&" : "?"}${param}=${p.clave}`}
            aria-current={esActiva ? "page" : undefined}
            scroll={false}
            className={`flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors ${
              esActiva
                ? "bg-marca text-marca-contraste"
                : "bg-superficie-2 text-tinta-suave hover:bg-borde hover:text-tinta"
            }`}
          >
            {p.titulo}
          </Link>
        );
      })}
    </nav>
  );
}
