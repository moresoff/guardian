import { Esqueleto, EsqueletoTitulo, Panel } from "@/components/ui/primitivos";

export default function Cargando() {
  return (
    <div role="status" aria-label="Cargando el establecimiento">
      <EsqueletoTitulo />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Panel className="p-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i}>
                <Esqueleto className="h-2.5 w-20" />
                <Esqueleto className="mt-2 h-3.5 w-24" />
              </div>
            ))}
          </div>
        </Panel>
        <Panel nivel="elevado" className="p-6">
          <Esqueleto className="h-2.5 w-28" />
          <div className="mt-5 space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-baseline justify-between gap-4">
                <Esqueleto className="h-3 w-32" />
                <Esqueleto className="h-4 w-14" />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
