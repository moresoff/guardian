import {
  Contacto,
  FotoConFrase,
  Franja,
  PortadaInterna,
  Rotulo,
  TituloFranja,
} from "@/components/pagina-publica";

export const metadata = { title: "Quiénes somos | Guardian" };

const ROLES = [
  {
    titulo: "El productor",
    texto:
      "Presenta el lote y el establecimiento, reúne los comprobantes e informa pesadas, sanidad y movimientos.",
  },
  {
    titulo: "El colaborador",
    texto:
      "Conoce el proyecto, con el productor y el lote identificados, y sigue el ciclo hasta el cierre.",
  },
  {
    titulo: "Guardian",
    texto:
      "Organiza la documentación, compara lo declarado con los comprobantes y coordina la revisión. Que los datos coincidan y que un papel sea auténtico se controlan por separado.",
  },
];

export default function QuienesSomosPage() {
  return (
    <>
      <PortadaInterna
        foto="/guardian/cierre.jpg"
        rotulo="Quiénes somos"
        titulo={
          <>
            Personas que conectan. <em className="font-medium">Proyectos que crecen.</em>
          </>
        }
        texto="Guardian conecta colaboradores con productores ganaderos y reúne la documentación de cada ciclo."
      />

      <Franja>
        <Rotulo>Quién es Guardian</Rotulo>
        <TituloFranja>Una plataforma que conecta productores y colaboradores</TituloFranja>
        <div className="mt-5 grid max-w-5xl gap-4 text-tinta-suave md:grid-cols-2 md:gap-10">
          <p>
            Nació de un problema concreto: al productor que engorda se le termina el dinero
            antes que el ciclo y sale a vender hacienda liviana, la peor venta posible. Del otro
            lado hay gente que quiere participar en un ciclo ganadero y no encuentra por dónde
            entrar sin comprar un campo.
          </p>
          <p>
            Guardian los pone en contacto alrededor de un lote identificable: revisa lo
            declarado contra los documentos del campo y de los animales, señala las diferencias
            y deja a la vista cada etapa del engorde hasta el cierre. Es un proyecto de tesis.
          </p>
        </div>
      </Franja>

      <FotoConFrase foto="/imagenes/fotos/proyecto8.webp" alt="Una vaca con su ternero en el campo">
        Cada parte tiene un rol. Cada lote, su historia.
      </FotoConFrase>

      <Franja tono="bg-superficie-2">
        <ul className="grid gap-6 md:grid-cols-3 md:gap-10">
          {ROLES.map((r) => (
            <li key={r.titulo} className="border-t-2 border-marca pt-4">
              <h3 className="text-lg font-semibold tracking-tight">{r.titulo}</h3>
              <p className="mt-2 text-tinta-suave">{r.texto}</p>
            </li>
          ))}
        </ul>
      </Franja>

      <Contacto />
    </>
  );
}
