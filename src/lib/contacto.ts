/**
 * El canal de contacto genérico de Guardian: un correo y un teléfono, sin
 * montos ni condiciones. Quien consulta por modalidades de participación
 * escribe o llama acá. Pueden pisarse con variables de entorno al desplegar.
 *
 * El teléfono es provisorio (formato de ejemplo) hasta tener el número real.
 */
export const CORREO_CONTACTO =
  process.env.NEXT_PUBLIC_CORREO_CONTACTO || "guardian@gmail.com";
export const TELEFONO_CONTACTO = process.env.NEXT_PUBLIC_TELEFONO_CONTACTO || "11 1234 5678";
