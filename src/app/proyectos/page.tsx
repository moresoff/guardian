import { ProyectoCard } from "@/components/proyecto-card";
import { Vacio } from "@/components/ui/primitivos";
import { getProyectosPublicos } from "@/lib/data";
import { fotoDelProyecto } from "@/lib/imagenes";
import { ConsultaModalidades } from "@/components/consulta-modalidades";
import { haySesion } from "@/lib/sesion";
import { BotonLink } from "@/components/ui/primitivos";
import { FiltrosCatalogo } from "./filtros";

export const metadata = {
  title: "Catálogo de proyectos — Guardian",
};

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ provincia?: string }>;
}) {
  const { provincia } = await searchParams;
  const conSesion = await haySesion();
  const proyectos = await getProyectosPublicos({
    provincia,
  });

  const provincias = ["Buenos Aires", "Córdoba", "Santa Fe", "La Pampa"];
  const abiertos = proyectos.filter((p) => p.estado === "abierto");
  const otros = proyectos.filter((p) => p.estado !== "abierto");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Proyectos abiertos</h1>
        {conSesion ? null : (
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <p className="max-w-xl text-sm text-tinta-suave">
              Acá ves de qué va cada proyecto. Las condiciones de cada uno se ven con una
              cuenta.
            </p>
            <BotonLink href="/registro?lado=colaborador">Crear mi cuenta</BotonLink>
            <ConsultaModalidades />
          </div>
        )}
      </div>

      <FiltrosCatalogo
        provincias={provincias}
        provinciaActual={provincia}
      />

      {proyectos.length === 0 ? (
        <Vacio titulo="No hay proyectos con esos filtros">
          Probá quitando algún filtro para ver el resto del catálogo.
        </Vacio>
      ) : (
        <>
          {/*
            Primero los que se pueden sumar, que es para lo que se entra. Los
            ciclos en marcha y cerrados sirven de antecedente y van plegados:
            antes ocupaban seis pantallas de teléfono y el título decía
            «abiertos» aunque la mayoría no lo estaba.
          */}
          <h2 className="mb-4 text-base font-semibold tracking-tight">
            {abiertos.length === 0
              ? "Ahora no hay proyectos abiertos"
              : `${abiertos.length} ${abiertos.length === 1 ? "proyecto abierto" : "proyectos abiertos"}`}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {abiertos.map((p) => (
              <ProyectoCard key={p.id} proyecto={p} foto={fotoDelProyecto(p.id)} resumida={!conSesion} />
            ))}
          </div>
          {otros.length > 0 ? (
            <details className="group mt-8 border-t border-borde pt-4">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-base font-semibold">
                <span>
                  Ciclos en marcha y cerrados ({otros.length})
                  <span className="block text-sm font-normal text-tinta-suave">
                    Para ver cómo les fue a otros proyectos.
                  </span>
                </span>
                <span aria-hidden="true" className="text-tinta-suave transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {otros.map((p) => (
                  <ProyectoCard key={p.id} proyecto={p} foto={fotoDelProyecto(p.id)} resumida={!conSesion} />
                ))}
              </div>
            </details>
          ) : null}
        </>
      )}
    </div>
  );
}
