import { Esqueleto, EsqueletoTitulo, Panel } from "@/components/ui/primitivos";

export default function Cargando() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]" role="status" aria-label="Cargando el proyecto">
      <div>
        <EsqueletoTitulo />
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-t border-borde pt-6">
              <Esqueleto className="h-4 w-40" />
              <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((__, j) => (
                  <div key={j}>
                    <Esqueleto className="h-2.5 w-20" />
                    <Esqueleto className="mt-2 h-3.5 w-24" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Panel nivel="elevado" className="h-fit p-5">
        <Esqueleto className="h-3 w-24" />
        <Esqueleto className="mt-3 h-7 w-36" />
        <Esqueleto className="mt-5 h-1.5 w-full rounded-full" />
        <Esqueleto className="mt-6 h-9 w-full rounded-lg" />
      </Panel>
    </div>
  );
}
