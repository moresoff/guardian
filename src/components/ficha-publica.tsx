import { PortadaProyecto } from "@/components/portada-proyecto";
import { ConsultaModalidades } from "@/components/consulta-modalidades";
import {
  BotonLink,
  Dato,
  Panel,
  TituloBloque,
} from "@/components/ui/primitivos";
import { CICLOS } from "@/lib/ciclos";
import { DOCUMENTO_LABEL, POSESION_LABEL, formatNum } from "@/lib/format";
import type { Documento, Proyecto } from "@/lib/types";

/**
 * La ficha de un proyecto vista sin cuenta: de qué va y con qué respaldo, y nada
 * de lo económico. Los montos, los plazos, el reparto y las condiciones se ven con
 * una cuenta; acá se invita a crearla o a consultar por modalidades.
 *
 * Es una pantalla pensada para una comunicación abierta, no una ficha recortada
 * a las apuradas: por eso nombra lo que hay detrás de la cuenta y no lo oculta.
 */
export function FichaPublica({
  proyecto,
  productor,
  documentos,
}: {
  proyecto: Proyecto;
  productor: string | undefined;
  documentos: Documento[];
}) {
  const ciclo = CICLOS[proyecto.sistemaProductivo];
  const tipos = [...new Set(documentos.map((d) => d.tipo))];

  return (
    <div className="mx-auto max-w-4xl">
      <PortadaProyecto proyecto={proyecto} productor={productor} />

      <p className="mt-4 text-tinta-suave">{`Ciclo de engorde con ${formatNum(proyecto.cabezas)} cabezas de categoría ${proyecto.categoria.toLocaleLowerCase("es-AR")}. ${ciclo.descripcion}`}</p>

      <section className="mt-8">
        <TituloBloque descripcion="Lo que el productor declara al publicar el proyecto.">
          El lote
        </TituloBloque>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
          <Dato etiqueta="Cabezas">{formatNum(proyecto.cabezas)}</Dato>
          <Dato etiqueta="Categoría">{proyecto.categoria}</Dato>
          <Dato etiqueta="Raza">{proyecto.raza || "—"}</Dato>
          <Dato etiqueta="Tipo de ciclo" ayuda={ciclo.descripcion}>
            {ciclo.nombre}
          </Dato>
          <Dato etiqueta="Peso de entrada">{proyecto.pesoEntradaKg} kg</Dato>
          <Dato etiqueta="Peso objetivo">
            {proyecto.pesoSalidaObjetivoKg} kg
          </Dato>
          <Dato etiqueta="Hacienda">
            {POSESION_LABEL[proyecto.tipoPosesion]}
          </Dato>
        </dl>
      </section>

      {tipos.length > 0 ? (
        <section className="mt-8 border-t border-borde pt-7">
          <TituloBloque descripcion="Guardian cruza cada dato declarado contra estos documentos antes de publicar.">
            Respaldo documental
          </TituloBloque>
          <ul className="flex flex-wrap gap-2">
            {tipos.map((t) => (
              <li
                key={t}
                className="rounded-full border border-borde bg-superficie px-3 py-1 text-sm"
              >
                {DOCUMENTO_LABEL[t]}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Panel className="mt-10 p-5">
        <h2 className="text-lg font-semibold tracking-tight">
          Condiciones del proyecto
        </h2>
        <p className="mt-1 text-sm text-tinta-suave">
          El presupuesto, los plazos, el reparto y las condiciones de
          participación se ven con una cuenta.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <BotonLink href="/registro?lado=colaborador">
            Crear mi cuenta
          </BotonLink>
          <BotonLink href="/ingresar" variante="secundario">
            Ya tengo cuenta
          </BotonLink>
        </div>
        <ConsultaModalidades className="mt-4" />
      </Panel>
    </div>
  );
}
