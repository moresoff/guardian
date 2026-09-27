import { Aviso, Panel, Vacio } from "@/components/ui/primitivos";
import {
  PRODUCTOR_DEMO,
  getDiscrepanciasDeDocumento,
  getDocumentosDeProductor,
  getGarantiasConUso,
  getProyecto,
} from "@/lib/data";
import type { Discrepancia } from "@/lib/types";
import { Garantias } from "./garantias";
import { Repositorio, type CarpetaRepo } from "./repositorio";

export const metadata = { title: "Documentación — Guardian" };

/** La carpeta de los papeles que no cuelgan de ningún proyecto. */
const GENERALES = "generales";

export default async function DocumentacionPage() {
  const documentos = await getDocumentosDeProductor(PRODUCTOR_DEMO);
  const garantias = (await getGarantiasConUso(PRODUCTOR_DEMO)).map((g) => ({
    ...g.garantia,
    usadaEn: g.usadaEn.map((p) => ({ id: p.id, titulo: p.titulo })),
  }));

  const enriquecidos = await Promise.all(
    documentos.map(async (d) => ({
      documento: d,
      discrepancias: await getDiscrepanciasDeDocumento(d.id),
      proyecto: d.proyectoId ? await getProyecto(d.proyectoId) : undefined,
    })),
  );

  /**
   * Los documentos se agrupan por proyecto acá y no en el cliente: la carpeta
   * necesita el título del proyecto, que vive del otro lado de `getProyecto`.
   */
  const porCarpeta = new Map<string, CarpetaRepo>();
  for (const e of enriquecidos) {
    const id = e.proyecto?.id ?? GENERALES;
    let carpeta = porCarpeta.get(id);
    if (!carpeta) {
      carpeta = {
        id,
        titulo: e.proyecto?.titulo ?? "Documentos generales",
        href: e.proyecto ? `/productor/proyectos/${e.proyecto.id}` : undefined,
        archivos: [],
      };
      porCarpeta.set(id, carpeta);
    }
    carpeta.archivos.push({ documento: e.documento, discrepancias: e.discrepancias });
  }

  // La carpeta general va primera: son los papeles que se reusan entre proyectos.
  const carpetas = [...porCarpeta.values()].sort((a, b) =>
    a.id === GENERALES ? -1 : b.id === GENERALES ? 1 : a.titulo.localeCompare(b.titulo),
  );

  const total = enriquecidos.length;
  const conDiscrepancias = enriquecidos.filter((e) =>
    e.discrepancias.some((x: Discrepancia) => !x.resuelta),
  ).length;
  const verificados = enriquecidos.filter(
    (e) => e.documento.estadoAutenticidad === "verificada",
  ).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Documentación</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-tinta-suave">
          Tus comprobantes y tus garantías en un solo lugar. Los documentos permanentes,
          como el RENSPA, se reusan entre proyectos y no hace falta volver a subirlos; las
          garantías también, con un cupo de proyectos simultáneos.
        </p>
      </div>

      <div className="mb-10">
        <Garantias garantias={garantias} />
      </div>

      <Panel className="mb-6 p-5">
        <dl className="tabular grid grid-cols-3 gap-4 text-center">
          <div>
            <dt className="rotulo text-tinta-tenue">Documentos</dt>
            <dd className="mt-1 text-2xl font-semibold">{total}</dd>
          </div>
          <div>
            <dt className="rotulo text-tinta-tenue">Autenticidad verificada</dt>
            <dd className="mt-1 text-2xl font-semibold text-marca">{verificados}</dd>
          </div>
          <div>
            <dt className="rotulo text-tinta-tenue">Con discrepancias</dt>
            <dd className="mt-1 text-2xl font-semibold text-alerta">{conDiscrepancias}</dd>
          </div>
        </dl>
      </Panel>

      <div className="mb-6">
        <Aviso titulo="Consistencia no es autenticidad">
          Guardian lee el documento, extrae sus datos y verifica que las cifras cierren entre
          sí y con lo que declaraste. Eso no alcanza para afirmar que el documento sea
          auténtico. Esa verificación se hace aparte, contra el organismo que lo emitió.
        </Aviso>
      </div>

      {total === 0 ? (
        <Vacio titulo="Todavía no subiste documentación">
          Los comprobantes se cargan al publicar un proyecto y quedan acá para reusarlos.
        </Vacio>
      ) : (
        <Repositorio carpetas={carpetas} />
      )}
    </div>
  );
}
