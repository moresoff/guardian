import { Vacio } from "@/components/ui/primitivos";
import {
  PRODUCTOR_DEMO,
  getDiscrepanciasDeDocumento,
  getDocumentosDeProductor,
  getGarantiasConUso,
  getProyecto,
} from "@/lib/data";
import { Garantias } from "./garantias";
import { Repositorio, type CarpetaRepo } from "./repositorio";

/** La carpeta de los papeles que no cuelgan de ningún proyecto. */
const GENERALES = "generales";

/** La pestaña de documentos y garantías: los papeles que se reusan entre proyectos. */
export async function Documentos() {
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
        href: e.proyecto ? `/proyectos/${e.proyecto.id}` : undefined,
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

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm text-tinta-suave">
        Lo que subís una vez, como el RENSPA, sirve para todos tus proyectos: no hace
        falta volver a subirlo.
      </p>

      <div id="garantias" className="mb-10 scroll-mt-24">
        <Garantias garantias={garantias} />
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
