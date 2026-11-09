import { productorDeSesion } from "@/lib/cuentas";
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
  const productorId = await productorDeSesion();
  const proyectos = await getProyectosDeProductor(productorId);
  const saldos = await getSaldosDeProductor(productorId);

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
  }));

  return (
    <div className="space-y-8">
      <AvisoIdentidad />
      {/* Con o sin proyectos, el tablero es el mismo: una cuenta nueva lo ve en
          cero y sabe qué va a encontrar cuando publique. */}
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
