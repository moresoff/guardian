"use client";

import Link from "next/link";

/**
 * Filtros como links y no como estado local: el filtro queda en la URL, así se
 * puede compartir un recorte del catálogo y el server component ya lo recibe resuelto.
 */
export function FiltrosCatalogo({
  provincias,
  modalidades,
  provinciaActual,
  modalidadActual,
}: {
  provincias: string[];
  modalidades: { valor: string; label: string }[];
  provinciaActual?: string;
  modalidadActual?: string;
}) {
  const href = (cambio: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const provincia = "provincia" in cambio ? cambio.provincia : provinciaActual;
    const modalidad = "modalidad" in cambio ? cambio.modalidad : modalidadActual;
    if (provincia) params.set("provincia", provincia);
    if (modalidad) params.set("modalidad", modalidad);
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

      <Grupo etiqueta="Modalidad">
        <Link href={href({ modalidad: undefined })} className={chip(!modalidadActual)}>
          Todas
        </Link>
        {modalidades.map((m) => (
          <Link
            key={m.valor}
            href={href({ modalidad: m.valor })}
            className={chip(modalidadActual === m.valor)}
          >
            {m.label}
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
