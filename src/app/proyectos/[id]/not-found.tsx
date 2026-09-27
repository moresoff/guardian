import { BotonLink } from "@/components/ui/primitivos";

export const metadata = { title: "Proyecto no disponible — Guardian" };

/**
 * Un proyecto puede existir y no ser público: mientras está en borrador o en
 * validación no se muestra a colaboradores. Decirlo es más honesto que un 404 seco.
 */
export default function ProyectoNoEncontrado() {
  return (
    <div className="mx-auto max-w-xl py-10">
      <p className="rotulo text-tinta-tenue">Proyecto no disponible</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        Este proyecto no está publicado
      </h1>
      <p className="mt-3 text-tinta-suave">
        O nunca lo estuvo, o el productor lo dio de baja. Los proyectos en borrador y
        los que están esperando la validación de Guardian no son visibles hasta que se
        aprueba la documentación.
      </p>
      <div className="mt-7">
        <BotonLink href="/proyectos">Ver los proyectos abiertos</BotonLink>
      </div>
    </div>
  );
}
