import { ProyectoCard } from "@/components/proyecto-card";
import { Vacio } from "@/components/ui/primitivos";
import { getProyectosPublicos } from "@/lib/data";
import { listarImagenes } from "@/lib/imagenes";
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
  const proyectos = await getProyectosPublicos({
    provincia,
  });

  const provincias = ["Buenos Aires", "Córdoba", "Santa Fe", "La Pampa"];
  // Las fotos se reparten en orden y se repiten si hay menos que proyectos.
  const fotos = listarImagenes("fotos", "proyecto");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Proyectos abiertos</h1>
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
