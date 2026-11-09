import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Las pantallas le preguntan al disco qué fotos hay (`src/lib/imagenes.ts`)
   * en vez de tener la lista escrita, así el equipo suma una foto dejándola en
   * la carpeta. Eso funciona local, donde está el proyecto entero.
   *
   * En producción cada pantalla corre en una función aparte que solo lleva los
   * archivos que Next detecta que usa. Como la carpeta se lee en tiempo de
   * ejecución y no con un import, no los detecta: la función se despliega sin
   * las imágenes, `readdirSync` devuelve vacío y las tarjetas quedan sin foto,
   * sin un solo error en los registros. Por eso van declaradas acá.
   */
  outputFileTracingIncludes: {
    "/**": ["./public/imagenes/**"],
  },

  /*
   * Los papeles del proyecto y las fotos del DNI viajan en el cuerpo de una
   * acción del servidor. El tope por defecto es 1 MB, menos que una foto de
   * celular. Cada archivo puede pesar hasta 10 MB (`src/lib/archivos.ts`) y se
   * suben hasta cuatro juntos, más el margen del formulario.
   */
  experimental: {
    serverActions: {
      bodySizeLimit: "45mb",
    },
  },
};

export default nextConfig;
