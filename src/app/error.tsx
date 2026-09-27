"use client";

import { useEffect } from "react";
import { Aviso, Boton, BotonLink } from "@/components/ui/primitivos";

/**
 * Error inesperado en cualquier pantalla. No se disfraza de "algo salió mal":
 * el productor está por publicar un ciclo con dinero de por medio y necesita
 * saber si lo que cargó se perdió o no.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-10">
      <p className="rotulo text-error">Error</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        No pudimos cargar esta pantalla
      </h1>
      <p className="mt-3 text-tinta-suave">
        Es una falla nuestra, no de lo que cargaste. Nada de lo que hayas guardado
        antes se perdió: los proyectos y la documentación siguen donde estaban.
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <Boton onClick={reset}>Reintentar</Boton>
        <BotonLink href="/" variante="secundario">
          Volver al inicio
        </BotonLink>
      </div>

      {error.digest ? (
        <div className="mt-8">
          <Aviso tono="neutro">
            Si vuelve a pasar, este es el código del error:{" "}
            <span className="codigo">{error.digest}</span>
          </Aviso>
        </div>
      ) : null}
    </div>
  );
}
