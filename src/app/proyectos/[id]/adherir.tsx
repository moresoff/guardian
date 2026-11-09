import { Boton, BotonLink } from "@/components/ui/primitivos";

/**
 * La entrada a participar en un proyecto. El recorrido (cuánto, quién
 * administra, el contrato y la firma) vive en su propia pantalla: en un cuadro
 * flotante no entraba el contrato, y en el teléfono se leía mal.
 */
export function Adherir({
  proyectoId,
  habilitado,
  motivoBloqueo,
}: {
  proyectoId: string;
  habilitado: boolean;
  motivoBloqueo?: string;
}) {
  if (!habilitado) {
    return (
      <div>
        <Boton className="w-full" disabled>
          Participación no disponible
        </Boton>
        {motivoBloqueo ? <p className="mt-2 text-sm text-tinta-suave">{motivoBloqueo}</p> : null}
      </div>
    );
  }
  return (
    <BotonLink href={`/proyectos/${proyectoId}/participar`} className="min-h-12 w-full">
      Participar en este proyecto
    </BotonLink>
  );
}
