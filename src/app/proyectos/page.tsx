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
            El encabezado de la grilla no es decorativo: sin él la página saltaba
            de h1 al h3 de cada tarjeta, y de paso dice cuántos resultados dieron
            los filtros.
          */}
          <h2 className="mb-4 text-base font-semibold tracking-tight">
            {proyectos.length}{" "}
            {proyectos.length === 1 ? "proyecto abierto" : "proyectos abiertos"}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {proyectos.map((p) => (
              <ProyectoCard
                key={p.id}
                proyecto={p}
                foto={fotoDelProyecto(p.id)}
                resumida={!conSesion}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
