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
};

export default nextConfig;
