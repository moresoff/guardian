import { CORREO_CONTACTO, TELEFONO_CONTACTO } from "@/lib/contacto";

/**
 * El cierre de toda pantalla abierta: no se dan condiciones, se invita a
 * consultar. Enlaza el correo y el teléfono de contacto.
 */
export function ConsultaModalidades({ className = "" }: { className?: string }) {
  return (
    <p className={`text-sm text-tinta-suave ${className}`}>
      Consultá por modalidades de participación
      {CORREO_CONTACTO ? (
        <>
          {": "}
          <a
            href={`mailto:${CORREO_CONTACTO}`}
            className="font-medium text-marca underline underline-offset-2"
          >
            {CORREO_CONTACTO}
          </a>
        </>
      ) : null}
      {TELEFONO_CONTACTO ? (
        <>
          {" o al "}
          <a
            href={`tel:+54${TELEFONO_CONTACTO.replace(/\D/g, "")}`}
            className="font-medium text-marca underline underline-offset-2"
          >
            {TELEFONO_CONTACTO}
          </a>
        </>
      ) : null}
      .
    </p>
  );
}
