import { Aviso, Dato, Panel, TituloBloque } from "@/components/ui/primitivos";
import { formatFecha } from "@/lib/format";
import type { Fideicomiso } from "@/lib/types";

/**
 * Las condiciones del proyecto: lo esencial de cómo se participa, para quien tiene
 * cuenta. Es un resumen y lo dice: el detalle completo vive en el contrato, que se
 * entrega al participar. No repite cada cláusula ni nombra la estructura jurídica
 * por encima de lo que el contrato dice.
 *
 * Va igual en la ficha del colaborador y en la del productor porque son las mismas
 * condiciones: las dos partes tienen que leer lo mismo.
 */
export function CondicionesPanel({
  fideicomiso,
  paraColaborador = false,
}: {
  fideicomiso: Fideicomiso;
  paraColaborador?: boolean;
}) {
  const f = fideicomiso;

  return (
    <Panel className="p-5">
      <TituloBloque descripcion="Lo esencial de cómo se participa en este proyecto. El detalle completo está en el contrato, que se entrega al participar.">
        Condiciones del proyecto
      </TituloBloque>

      <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        <Dato etiqueta="Quiénes participan">{f.fiduciantes}</Dato>
        <Dato etiqueta="Qué se aporta" ayuda="Lo que entra al proyecto, individualizado.">
          {f.bienesFideicomitidos}
        </Dato>
        <Dato etiqueta="Para qué">{f.objeto}</Dato>
        <Dato etiqueta="Reparto del resultado">{f.repartoResultado}</Dato>
        <Dato etiqueta="Mortandad" ayuda="Quién soporta la pérdida de animales durante el ciclo.">
          {f.mortandad}
        </Dato>
        <Dato etiqueta="Duración del proyecto">
          Del {formatFecha(f.inicioAt)} al {formatFecha(f.extincionAt)}
        </Dato>
        <Dato
          etiqueta="Rendición de cuentas"
          ayuda="La administración está a cargo de un tercero independiente de Guardian."
        >
          {f.rendicionCuentas}
        </Dato>
      </dl>

      <div className="mt-6 space-y-4 border-t border-borde pt-5">
        <Aviso titulo="Qué hace Guardian y qué no">
          Guardian conecta y verifica la documentación del lote. La administración del
          proyecto está a cargo de un tercero independiente. El resultado depende de la
          venta del lote y puede ser distinto de lo esperado.
        </Aviso>

        {paraColaborador ? (
          <Aviso tono="alerta" titulo="Si lo reunido no alcanza">
            La participación recibe el resultado de la venta, sea mayor o menor al
            esperado. Si lo reunido no alcanza para cubrir lo comprometido, se reparte lo
            que haya: ningún otro proyecto ni Guardian responden por este.
          </Aviso>
        ) : null}
      </div>
    </Panel>
  );
}
