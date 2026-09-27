import Link from "next/link";
import { EstadoProyectoBadge } from "@/components/estados";
import { Aviso, Badge, Panel, Vacio } from "@/components/ui/primitivos";
import {
  getDiscrepanciasDeProyecto,
  getDocumentosVigentesDeProyecto,
  getProductor,
  getProyectosEnValidacion,
} from "@/lib/data";
import {
  POSESION_LABEL,
  documentosRequeridos,
  formatArsCompacto,
  formatFecha,
  formatNum,
} from "@/lib/format";

export const metadata = { title: "Cola de validación — Guardian" };

export default async function AdminPage() {
  const proyectos = await getProyectosEnValidacion();

  const filas = await Promise.all(
    proyectos.map(async (p) => {
      const documentos = await getDocumentosVigentesDeProyecto(p.id, p.productorId);
      const discrepancias = await getDiscrepanciasDeProyecto(p.id);
      const requeridos = documentosRequeridos(p.tipoPosesion);
      const cargados = new Set(documentos.map((d) => d.tipo));
      return {
        proyecto: p,
        productor: await getProductor(p.productorId),
        requeridos: requeridos.length,
        cargados: requeridos.filter((t) => cargados.has(t)).length,
        sinResolver: discrepancias.filter((d) => !d.resuelta).length,
        altas: discrepancias.filter((d) => !d.resuelta && d.severidad === "alta").length,
      };
    }),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Cola de validación</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-tinta-suave">
          Proyectos esperando revisión. Ninguno es visible para los colaboradores hasta que la
          documentación obligatoria esté aprobada.
        </p>
      </div>

      <div className="mb-6">
        <Aviso titulo="Hasta dónde llegó la lectura automática">
          Cada documento ya se cruzó contra lo declarado y las discrepancias quedaron
          marcadas. La autenticidad la verifica una persona. En el DT-e se hace con el
          CUVE, contra SENASA.
        </Aviso>
      </div>

      {filas.length === 0 ? (
        <Vacio titulo="No hay proyectos esperando validación">
          Cuando un productor termine de cargar su documentación, el proyecto aparece acá.
        </Vacio>
      ) : (
        <ul className="space-y-3">
          {filas.map(({ proyecto, productor, requeridos, cargados, sinResolver, altas }) => (
            <li key={proyecto.id}>
              <Panel className="relative p-5 transition-shadow hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">
                      <Link
                        href={`/admin/proyectos/${proyecto.id}`}
                        className="hover:text-marca"
                      >
                        <span className="absolute inset-0" aria-hidden />
                        {proyecto.titulo}
                      </Link>
                    </h2>
                    <p className="mt-1 text-sm text-tinta-suave">
                      {productor?.razonSocial} · RENSPA <span className="codigo">{productor?.renspa}</span>
                    </p>
                    <p className="mt-0.5 text-sm text-tinta-tenue">
                      {formatNum(proyecto.cabezas)} cabezas ·{" "}
                      {formatArsCompacto(proyecto.montoObjetivoArs)} ·{" "}
                      {POSESION_LABEL[proyecto.tipoPosesion]} · enviado el{" "}
                      {formatFecha(proyecto.creadoAt)}
                    </p>
                  </div>
                  <EstadoProyectoBadge estado={proyecto.estado} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tono={cargados === requeridos ? "ok" : "alerta"}>
                    {cargados} de {requeridos} documentos obligatorios
                  </Badge>
                  {sinResolver > 0 ? (
                    <Badge tono={altas > 0 ? "error" : "alerta"}>
                      {sinResolver}{" "}
                      {sinResolver === 1 ? "discrepancia" : "discrepancias"}
                      {altas > 0 ? ` · ${altas} de severidad alta` : ""}
                    </Badge>
                  ) : (
                    <Badge tono="ok">Sin discrepancias</Badge>
                  )}
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
