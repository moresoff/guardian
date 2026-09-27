import Image from "next/image";
import type { ReactNode } from "react";

/**
 * La cabecera de un perfil: el retrato, el nombre y las cifras que definen al
 * productor.
 *
 * Existe porque el perfil no es una pantalla de configuración con cara de
 * formulario: es la ficha que el colaborador mira antes de poner capital. Lo
 * primero tiene que ser quién es y qué hizo; lo editable viene después.
 *
 * Si todavía no hay retrato cargado en `public/imagenes/`, no se rompe nada: en
 * su lugar van las iniciales.
 */
export interface DatoCabecera {
  etiqueta: string;
  valor: ReactNode;
  /** Valores leídos de un documento, en monoespaciada. */
  codigo?: boolean;
}

export function CabeceraPerfil({
  titulo,
  subtitulo,
  sello,
  foto,
  datos,
  accion,
}: {
  titulo: string;
  subtitulo?: string;
  /** Lo que acredita al titular, por ejemplo el RENSPA verificado. */
  sello?: ReactNode;
  foto: string | null;
  datos: DatoCabecera[];
  accion?: ReactNode;
}) {
  const iniciales = titulo
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <section className="rounded-2xl border border-borde bg-superficie p-5 shadow-[var(--sombra-baja)] sm:p-7">
      {/* El retrato al lado del nombre y sin portada detrás: montado sobre una
          foto de fondo se pisaban, y la foto no aportaba nada que el nombre no
          dijera. */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="size-20 shrink-0 overflow-hidden rounded-full bg-marca-suave sm:size-24">
            {foto ? (
              <Image
                src={foto}
                alt=""
                width={192}
                height={192}
                priority
                className="size-full object-cover"
              />
            ) : (
              <span className="grid size-full place-items-center text-2xl font-semibold text-marca">
                {iniciales}
              </span>
            )}
          </div>

          <div>
            <h1 className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-2xl font-semibold tracking-tight">
              {titulo}
              {sello}
            </h1>
            {subtitulo ? (
              <p className="mt-1 text-sm text-tinta-suave">{subtitulo}</p>
            ) : null}
          </div>
        </div>
        {accion}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-borde pt-5 sm:grid-cols-4 sm:divide-x sm:divide-borde">
        {datos.map((d, i) => (
          <div key={d.etiqueta} className={i > 0 ? "sm:pl-6" : undefined}>
            <dt className="text-sm text-tinta-suave">{d.etiqueta}</dt>
            <dd
              className={`mt-1 text-xl font-semibold tracking-tight ${
                d.codigo ? "codigo" : "tabular"
              }`}
            >
              {d.valor}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
