import { Esqueleto, EsqueletoTitulo, Panel } from "@/components/ui/primitivos";

export default function Cargando() {
  return (
    <div>
      <EsqueletoTitulo />
      <Esqueleto className="mb-6 h-9 w-full max-w-lg rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Cargando proyectos">
        {Array.from({ length: 6 }).map((_, i) => (
          <Panel key={i} className="p-5">
            <Esqueleto className="h-5 w-24 rounded-full" />
            <Esqueleto className="mt-4 h-4 w-11/12" />
            <Esqueleto className="mt-2 h-3 w-2/3" />
            <Esqueleto className="mt-6 h-1.5 w-full rounded-full" />
            <Esqueleto className="mt-4 h-3 w-1/2" />
          </Panel>
        ))}
      </div>
    </div>
  );
}
