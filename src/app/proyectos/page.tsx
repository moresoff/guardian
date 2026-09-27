import { ProyectoCard } from "@/components/proyecto-card";
import { Vacio } from "@/components/ui/primitivos";
import { getProyectosPublicos } from "@/lib/data";
import { MODALIDAD_LABEL } from "@/lib/format";
import { listarImagenes } from "@/lib/imagenes";
import { MODALIDADES } from "@/lib/proyecto";
import { FiltrosCatalogo } from "./filtros";

export const metadata = {
  title: "Catálogo de proyectos — Guardian",
};

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ provincia?: string; modalidad?: string }>;
}) {
  const { provincia, modalidad } = await searchParams;
  const proyectos = await getProyectosPublicos({
    provincia,
    modalidad,
  });

  const provincias = ["Buenos Aires", "Córdoba", "Santa Fe", "La Pampa"];
  const modalidades = MODALIDADES.map((m) => ({ valor: m, label: MODALIDAD_LABEL[m] }));
  // Las fotos se reparten en orden y se repiten si hay menos que proyectos.
  const fotos = listarImagenes("fotos", "proyecto");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Proyectos abiertos</h1>
      </div>

      <FiltrosCatalogo
        provincias={provincias}
        modalidades={modalidades}
        provinciaActual={provincia}
        modalidadActual={modalidad}
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
            {proyectos.map((p, i) => (
              <ProyectoCard
                key={p.id}
                proyecto={p}
                foto={fotos.length > 0 ? fotos[i % fotos.length] : null}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
