import { EsqueletoLista, EsqueletoTitulo, Esqueleto, Panel } from "@/components/ui/primitivos";

export default function Cargando() {
  return (
    <div>
      <EsqueletoTitulo />
      <Panel className="mb-6 p-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Esqueleto className="h-2.5 w-24" />
              <Esqueleto className="mt-2 h-3.5 w-20" />
            </div>
          ))}
        </div>
      </Panel>
      <EsqueletoLista filas={3} />
    </div>
  );
}
