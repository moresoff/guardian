"use client";

import { Modal } from "@/components/ui/modal";
import { Boton, BotonLink } from "@/components/ui/primitivos";
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
  proyectoId,
  onCerrar,
}: {
  abierto: boolean;
  cabezas: number;
  documentos: number;
  etiquetaCerrar?: string;
  /** Si viene, el proyecto quedó guardado y se puede abrir. */
  proyectoId?: string;
  onCerrar: () => void;
}) {
  const guardado = Boolean(proyectoId);
  return (
    <Modal
      abierto={abierto}
      titulo={guardado ? "Tu proyecto quedó presentado" : "El proyecto entró en revisión"}
      onCerrar={onCerrar}
      pie={
        <>
          {guardado ? (
            <BotonLink variante="secundario" href={`/proyectos/${proyectoId}`}>
              Ver el proyecto
            </BotonLink>
          ) : (
            <Boton variante="secundario" onClick={onCerrar}>
              {etiquetaCerrar}
            </Boton>
          )}
          <BotonLink href="/productor">Ver mis proyectos</BotonLink>
        </>
      }
    >
      {/* El detalle de cada paso vive en la ficha del proyecto: acá alcanza con
          qué falta y quién lo hace. Un modal que hay que leer entero es un modal
          que se cierra sin leer. */}
      <p className="text-tinta-suave">
        {documentos === 0
          ? `${formatNum(cabezas)} cabezas, todavía sin comprobantes: los podés subir desde el proyecto.`
          : `${formatNum(cabezas)} cabezas y ${documentos} ${
              documentos === 1 ? "comprobante" : "comprobantes"
            }: las cifras cierran.`}{" "}
        Quedó en{" "}
        <strong className="font-medium text-tinta">Pendiente de validación</strong>.
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
          <span className="font-medium text-tinta">Garantía.</span> Se
          revisa cupo y vigencia.
        </li>
        <li>
          <span className="font-medium text-tinta">Publicación.</span> Recién ahí sale al
          catálogo. Si algo no cierra, vuelve con la observación escrita.
        </li>
      </ol>
      {guardado ? (
        <p className="mt-5 text-sm text-tinta-suave">
          Quedó guardado con tus papeles. Lo seguís desde Mis proyectos mientras lo revisamos.
        </p>
      ) : (
        <p className="mt-5 text-sm text-tinta-suave">
          Este cambio todavía no queda guardado.
        </p>
      )}
    </Modal>
  );
}
