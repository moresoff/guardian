import { CORREO_CONTACTO } from "@/lib/contacto";

/**
 * El cierre de toda pantalla abierta: no se dan condiciones, se invita a
 * consultar. Con correo definido lo enlaza; sin él, solo dice la frase.
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
      .
    </p>
  );
}
