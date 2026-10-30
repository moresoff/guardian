import Link from "next/link";
import { EstadoProyectoBadge } from "@/components/estados";
import { Aviso, Badge, Panel, Vacio } from "@/components/ui/primitivos";
import { RevisionProyecto } from "./revision";
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

/**
 * La cola y la revisión en una sola pantalla: elegir un proyecto lo abre debajo
 * (`?proyecto=`), con la cola reducida a una fila para pasar de uno a otro.
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ proyecto?: string }>;
}) {
  const { proyecto: elegido } = await searchParams;
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

  if (elegido) {
    return (
      <div>
        <nav aria-label="Cola de validación" className="mb-6 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-sm text-tinta-suave">Cola de validación</span>
          {filas.map(({ proyecto }) => (
            <Link
              key={proyecto.id}
              href={`/admin?proyecto=${proyecto.id}`}
              aria-current={proyecto.id === elegido ? "page" : undefined}
              scroll={false}
              className={`flex min-h-11 max-w-full items-center truncate rounded-full px-4 text-sm font-medium transition-colors ${
                proyecto.id === elegido
                  ? "bg-marca text-marca-contraste"
                  : "bg-superficie-2 text-tinta-suave hover:bg-borde hover:text-tinta"
              }`}
            >
              {proyecto.titulo}
            </Link>
          ))}
          <Link
            href="/admin"
            className="flex min-h-11 items-center rounded-full px-3 text-sm text-tinta-suave hover:text-marca"
          >
            Ver la cola completa
          </Link>
        </nav>
        <RevisionProyecto id={elegido} />
      </div>
    );
  }

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
                        href={`/admin?proyecto=${proyecto.id}`}
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
