import { Aviso, Dato, Panel, TituloBloque } from "@/components/ui/primitivos";
import { formatFecha } from "@/lib/format";
import type { Fideicomiso } from "@/lib/types";

/**
 * Bajo qué contrato existe el proyecto. Va igual en la ficha pública y en la del
 * productor porque es el mismo contrato: las dos partes tienen que leer lo mismo.
 *
 * El contenido sigue el fideicomiso ordinario de administración del Código Civil
 * y Comercial (arts. 1666-1707). Los datos que se muestran no son decorativos:
 * son los que el contrato tiene que tener para ser válido, y el colaborador está
 * poniendo dinero contra ellos.
 */
export function FideicomisoPanel({
  fideicomiso,
  paraColaborador = false,
}: {
  fideicomiso: Fideicomiso;
  paraColaborador?: boolean;
}) {
  const f = fideicomiso;

  return (
    <Panel className="p-5">
      <TituloBloque descripcion="Cada proyecto es una serie de un fideicomiso ordinario de administración, con su propio patrimonio separado. La hacienda y el capital de esta serie no responden por las deudas del productor, ni por las de Guardian, ni por las de otra serie.">
        {f.serie}
      </TituloBloque>

      <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        <Dato etiqueta="Fiduciario" ayuda="Administra el patrimonio separado y rinde cuentas.">
          {f.fiduciario}
        </Dato>
        <Dato etiqueta="Fiduciantes" ayuda="Quiénes aportan al fideicomiso.">
          {f.fiduciantes}
        </Dato>
        <Dato etiqueta="Fideicomisarios" ayuda="Quiénes cobran el resultado.">
          {f.fideicomisarios}
        </Dato>
        <Dato
          etiqueta="Bienes fideicomitidos"
          ayuda="Lo que entra al patrimonio separado, individualizado."
        >
          {f.bienesFideicomitidos}
        </Dato>
        <Dato etiqueta="Objeto">{f.objeto}</Dato>
        <Dato etiqueta="Reparto del resultado">{f.repartoResultado}</Dato>
        <Dato
          etiqueta="Mortandad"
          ayuda="Quién soporta la pérdida de animales durante el ciclo."
        >
          {f.mortandad}
        </Dato>
        <Dato etiqueta="Plazo de la serie" ayuda="El tope legal son 30 años.">
          Del {formatFecha(f.inicioAt)} al {formatFecha(f.extincionAt)}
        </Dato>
        <Dato
          etiqueta="Rendición de cuentas"
          ayuda="No puede ser menos de una vez por año y el fiduciario no puede renunciar a ella."
        >
          {f.rendicionCuentas}
        </Dato>
        <Dato etiqueta="Seguro">{f.seguroResponsabilidadCivil}</Dato>
        <Dato etiqueta="Inscripción del contrato">{f.inscripcion}</Dato>
      </dl>

      <div className="mt-6 space-y-4 border-t border-borde pt-5">
        <Aviso titulo="Qué hace Guardian y qué no">
          Guardian es el fiduciario: administra el patrimonio de la serie, rinde cuentas y
          responde por su gestión. No garantiza el resultado, que sale de la venta del
          lote.
        </Aviso>

        {paraColaborador ? (
          <Aviso tono="alerta" titulo="Si el patrimonio de la serie no alcanza">
            La participación absorbe la ganancia y también la pérdida. Si el patrimonio de
            la serie no alcanza, el fideicomiso no quiebra: se liquida y se reparte lo que
            haya. Ninguna otra serie ni Guardian responden por esta.
          </Aviso>
        ) : null}
      </div>
    </Panel>
  );
}
