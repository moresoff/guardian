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
  /*
   * Direcciones viejas que pueden estar guardadas o compartidas. Antes cada una
   * era una página que solo redirigía; acá están todas juntas.
   */
  async redirects() {
    return [
      { source: "/admin/proyectos/:id", destination: "/admin?proyecto=:id", permanent: false },
      { source: "/colaborador/perfil", destination: "/colaborador/cartera?tab=datos", permanent: false },
      { source: "/productor/documentacion", destination: "/productor/establecimiento?tab=documentos", permanent: false },
      { source: "/productor/perfil", destination: "/productor/establecimiento", permanent: false },
      { source: "/productor/proyectos", destination: "/productor", permanent: false },
      { source: "/productor/proyectos/:id((?!nuevo$).+)", destination: "/proyectos/:id", permanent: false },
      { source: "/como-invertir", destination: "/como-participar", permanent: true },
      { source: "/investor", destination: "/como-participar", permanent: true },
      { source: "/simulacion", destination: "/simulador", permanent: true },
      { source: "/comparison", destination: "/", permanent: false },
      { source: "/fiduciary", destination: "/", permanent: false },
    ];
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "45mb",
    },
  },
};

export default nextConfig;
