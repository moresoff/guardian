import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EstadoProyectoBadge } from "@/components/estados";
import { CICLOS } from "@/lib/ciclos";
import { partesDelTitulo } from "@/lib/cubre";
import { fotoDelProyecto } from "@/lib/imagenes";
import type { Proyecto } from "@/lib/types";

/**
 * El encabezado de la ficha: la foto del lote en un panel de esquinas
 * redondeadas, con el título encima. Es la misma foto que muestra la tarjeta del
 * catálogo, así el proyecto se reconoce al abrirlo.
 */
export function PortadaProyecto({
  proyecto,
  productor,
}: {
  proyecto: Proyecto;
  productor?: string;
}) {
  const foto = fotoDelProyecto(proyecto.id);
  const partes = partesDelTitulo(proyecto.titulo);

  return (
    <div>
      <Link
        href="/proyectos"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-tinta-suave hover:text-marca"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Volver al catálogo
      </Link>

      <header className="relative mt-2 flex min-h-64 items-end overflow-hidden rounded-3xl bg-marca-fuerte sm:min-h-80">
        {foto ? (
          <Image
            src={foto}
            alt=""
            fill
            priority
            sizes="(max-width: 72rem) 100vw, 72rem"
            className="object-cover"
          />
        ) : null}
        <span
          className="absolute inset-0 bg-gradient-to-t from-[#052c22]/90 via-[#052c22]/45 to-transparent"
          aria-hidden
        />
        <div className="relative w-full p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-marca-fuerte">
              {CICLOS[proyecto.sistemaProductivo].nombre}
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
              {proyecto.provincia}
              {productor ? ` · ${productor}` : ""}
            </span>
            <EstadoProyectoBadge estado={proyecto.estado} />
          </div>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {partes.principal}
          </h1>
          {partes.lote ? (
            <p className="mt-1 text-lg font-medium text-white/90">{partes.lote}</p>
          ) : null}
        </div>
      </header>
    </div>
  );
}
