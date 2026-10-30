/**
 * El canal de contacto genérico de Guardian. Es un correo, sin montos ni
 * condiciones: quien consulta por modalidades de participación escribe acá.
 *
 * Sale de `NEXT_PUBLIC_CORREO_CONTACTO` y no está escrito en el código: la
 * dirección es un dato de la organización, y mientras no esté definida la
 * interfaz no muestra ningún enlace en vez de inventar uno.
 */
export const CORREO_CONTACTO = process.env.NEXT_PUBLIC_CORREO_CONTACTO ?? "";
