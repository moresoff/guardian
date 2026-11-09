import { productoresDeSesion } from "@/lib/cuentas";
import type { Saldos } from "@/lib/data";
import { Suspense } from "react";
import { AvisoIdentidad } from "@/components/aviso-identidad";
import { CabeceraProductor } from "@/components/cabecera-productor";
import { ListaProyectos } from "@/components/lista-proyectos";
import { SaldosCard } from "@/components/saldos-card";
import type { ItemProyecto } from "@/components/tarjeta-proyecto";
import {
  getDiscrepanciasDeProyecto,
  getDocumentosVigentesDeProyecto,
  getProyectosDeProductor,
  getSaldosDeProductor,
} from "@/lib/data";
import { camposIncompletos } from "@/lib/ficha";
import { documentosRequeridos } from "@/lib/format";
import { fotoDelProyecto } from "@/lib/imagenes";

/**
 * El tablero del productor: su establecimiento, la plata por etapa, cuántos
 * proyectos tiene en cada estado y la lista con solapas. Lo usan la plataforma
 * (/productor).
 */
export async function PanelProductor() {
  // Lo propio y los proyectos de ejemplo de la demo, sumados.
  const ids = await productoresDeSesion();
  const proyectos = (await Promise.all(ids.map(getProyectosDeProductor))).flat();
  const saldos = (await Promise.all(ids.map(getSaldosDeProductor))).reduce<Saldos>(
    (a, s) => ({
      pendienteDeRetiro: a.pendienteDeRetiro + s.pendienteDeRetiro,
      liberadoHistorico: a.liberadoHistorico + s.liberadoHistorico,
      aLiquidar: a.aLiquidar + s.aLiquidar,
      recaudadoHistorico: a.recaudadoHistorico + s.recaudadoHistorico,
      objetivoHistorico: a.objetivoHistorico + s.objetivoHistorico,
    }),
    { pendienteDeRetiro: 0, liberadoHistorico: 0, aLiquidar: 0, recaudadoHistorico: 0, objetivoHistorico: 0 },
  );

  /** Lo que cada proyecto le está pidiendo al productor, para la tarjeta. */
  const pendientes = new Map<string, string>();

  for (const p of proyectos) {
    const sinResolver = (await getDiscrepanciasDeProyecto(p.id)).filter(
      (d) => !d.resuelta,
    );
    if (sinResolver.length > 0) {
      pendientes.set(
        p.id,
        `${sinResolver.length} ${
          sinResolver.length === 1 ? "discrepancia" : "discrepancias"
        } entre lo declarado y la documentación`,
      );
    }

    if (p.estado === "borrador" && !pendientes.has(p.id)) {
      const documentos = await getDocumentosVigentesDeProyecto(p.id, p.productorId);
      const cargados = new Set(documentos.map((d) => d.tipo));
      const faltanDocs = documentosRequeridos(p.tipoPosesion).filter(
        (t) => !cargados.has(t),
      ).length;
      const faltanDatos = camposIncompletos(p).length;
      if (faltanDatos > 0 || faltanDocs > 0) {
        pendientes.set(
          p.id,
          `Faltan ${[
            faltanDatos > 0
              ? `${faltanDatos} ${faltanDatos === 1 ? "dato" : "datos"} de la ficha`
              : null,
            faltanDocs > 0
              ? `${faltanDocs} ${faltanDocs === 1 ? "documento" : "documentos"}`
              : null,
          ]
            .filter(Boolean)
            .join(" y ")}`,
        );
      }
    }
  }

  const items: ItemProyecto[] = proyectos.map((p) => ({
    proyecto: p,
    pendiente: pendientes.get(p.id),
    foto: fotoDelProyecto(p.id),
    ejemplo: ids.length > 1 && p.productorId !== ids[0],
  }));

  return (
    <div className="space-y-8">
      <AvisoIdentidad />
      <CabeceraProductor />
      <SaldosCard saldos={saldos} />

      <section id="proyectos" className="scroll-mt-20 border-t border-borde pt-8">
        {/* La lista lee la solapa de la URL: necesita su propio límite de
            Suspense para que la página siga prerenderizándose. */}
        <Suspense fallback={null}>
          <ListaProyectos items={items} />
        </Suspense>
      </section>
    </div>
  );
}
