"use client";

import { Modal } from "@/components/ui/modal";
import { Badge, Boton, BotonLink } from "@/components/ui/primitivos";
import { formatNum } from "@/lib/format";

/**
 * Qué pasa cuando el proyecto sale del borrador. Existe porque el productor
 * necesita saber en qué quedó lo que acaba de mandar: el botón solo, sin esto,
 * no dice si el proyecto se publicó, si alguien lo va a mirar ni cuándo.
 *
 * Es el mismo aviso en el alta y en la ficha técnica: los dos caminos terminan
 * en el mismo estado, así que tienen que contarlo igual. Y es un modal y no un
 * cartel al pie porque el envío es el final de la pantalla: un banner abajo de
 * todo se lo pierde el que ya dejó de mirar el formulario.
 */
export function EnviadoAValidacion({
  abierto,
  cabezas,
  documentos,
  etiquetaCerrar = "Seguir editando",
  onCerrar,
}: {
  abierto: boolean;
  cabezas: number;
  documentos: number;
  etiquetaCerrar?: string;
  onCerrar: () => void;
}) {
  return (
    <Modal
      abierto={abierto}
      titulo="El proyecto entró en revisión"
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            {etiquetaCerrar}
          </Boton>
          <BotonLink href="/productor/proyectos">Ver mis proyectos</BotonLink>
        </>
      }
    >
      {/* El detalle de cada paso vive en la ficha del proyecto: acá alcanza con
          qué falta y quién lo hace. Un modal que hay que leer entero es un modal
          que se cierra sin leer. */}
      <p className="text-tinta-suave">
        {formatNum(cabezas)} cabezas y {documentos}{" "}
        {documentos === 1 ? "comprobante" : "comprobantes"}: las cifras cierran. El
        proyecto pasa de borrador a{" "}
        <strong className="font-medium text-tinta">En revisión</strong>.
      </p>
      <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-tinta-suave marker:text-tinta-tenue">
        <li>
          <span className="font-medium text-tinta">Consistencia.</span> Ya está.
        </li>
        <li>
          <span className="font-medium text-tinta">Autenticidad.</span> Guardian contrasta
          el DT-e contra SENASA por el CUVE.
        </li>
        <li>
          <span className="font-medium text-tinta">Garantía y fideicomiso.</span> Se
          revisa cupo y vigencia, y se constituye la serie.
        </li>
        <li>
          <span className="font-medium text-tinta">Publicación.</span> Recién ahí sale al
          catálogo. Si algo no cierra, vuelve con la observación escrita.
        </li>
      </ol>
      <p className="mt-5 text-sm text-tinta-suave">
        <Badge tono="alerta">Prototipo</Badge>{" "}
        <span className="ml-1">Sin backend, el proyecto no queda guardado.</span>
      </p>
    </Modal>
  );
}
