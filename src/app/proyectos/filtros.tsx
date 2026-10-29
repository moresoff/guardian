"use client";

import Link from "next/link";

/**
 * Filtros como links y no como estado local: el filtro queda en la URL, así se
 * puede compartir un recorte del catálogo y el server component ya lo recibe resuelto.
 */
export function FiltrosCatalogo({
  provincias,
  provinciaActual,
}: {
  provincias: string[];
  provinciaActual?: string;
}) {
  const href = (cambio: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const provincia = "provincia" in cambio ? cambio.provincia : provinciaActual;
    if (provincia) params.set("provincia", provincia);
    const qs = params.toString();
    return qs ? `/proyectos?${qs}` : "/proyectos";
  };

  const chip = (activo: boolean) =>
    `rounded-full border px-3 py-1 text-sm transition-colors ${
      activo
        ? "border-marca/20 bg-marca-suave font-medium text-marca"
        : "border-borde bg-superficie text-tinta-suave hover:bg-superficie-2"
    }`;

  return (
    <div className="mb-6 space-y-3">
      <Grupo etiqueta="Provincia">
        <Link href={href({ provincia: undefined })} className={chip(!provinciaActual)}>
          Todas
        </Link>
        {provincias.map((p) => (
          <Link key={p} href={href({ provincia: p })} className={chip(provinciaActual === p)}>
            {p}
          </Link>
        ))}
      </Grupo>
    </div>
  );
}

function Grupo({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-full rotulo text-tinta-tenue sm:w-auto sm:pr-1">
        {etiqueta}
      </span>
      {children}
    </div>
  );
}
