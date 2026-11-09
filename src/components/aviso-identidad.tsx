import { Aviso, BotonLink } from "@/components/ui/primitivos";
import { getVerificacion } from "@/lib/identidad";
import { usuarioActual } from "@/lib/sesion";

/**
 * Pide validar la identidad mientras falte. Desaparece cuando ya está: no tiene
 * sentido recordarle a nadie algo que ya hizo.
 */
export async function AvisoIdentidad() {
  const u = await usuarioActual();
  if (!u || (await getVerificacion(u.id))) return null;
  return (
    <Aviso tono="alerta" titulo="Falta validar tu identidad">
      <span className="block">
        {u.lado === "productor"
          ? "Es parte de la revisión de tu proyecto."
          : "Hace falta antes de participar en un proyecto."}{" "}
        Te lleva unos minutos: tus datos, una foto del DNI y una selfie.
      </span>
      <BotonLink href="/identidad" className="mt-3 min-h-12">
        Validar mi identidad
      </BotonLink>
    </Aviso>
  );
}
