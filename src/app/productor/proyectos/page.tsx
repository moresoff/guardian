import { Suspense } from "react";
import { BotonLink, Vacio } from "@/components/ui/primitivos";
import {
  PRODUCTOR_DEMO,
  getDiscrepanciasDeProyecto,
  getDocumentosVigentesDeProyecto,
  getProductor,
  getProyectosDeProductor,
} from "@/lib/data";
import { camposIncompletos } from "@/lib/ficha";
import { documentosRequeridos } from "@/lib/format";
import { listarImagenes } from "@/lib/imagenes";
import type { ItemProyecto } from "@/components/tarjeta-proyecto";
import { ListaProyectos } from "./lista";

// La lista lee la solapa y el orden de la URL, así que necesita su propio límite
// de Suspense: sin eso, la página entera dejaría de prerenderizarse.

export const metadata = { title: "Mis proyectos — Guardian" };

export default async function ProductorPage() {
  const productor = await getProductor(PRODUCTOR_DEMO);
  const proyectos = await getProyectosDeProductor(PRODUCTOR_DEMO);

  // Las fotos las carga el equipo en `public/imagenes/fotos` y se reparten en
  // orden; si hay menos fotos que proyectos se repiten, y si no hay ninguna la
  // tarjeta queda con el fondo de marca en vez de una imagen rota.
  const fotos = listarImagenes("fotos", "proyecto");

  const items: ItemProyecto[] = [];

  for (const [i, p] of proyectos.entries()) {
    let pendiente: string | undefined;

    const sinResolver = (await getDiscrepanciasDeProyecto(p.id)).filter(
      (d) => !d.resuelta,
    ).length;

    if (sinResolver > 0) {
      pendiente = `${sinResolver} ${
        sinResolver === 1 ? "discrepancia" : "discrepancias"
      } entre lo declarado y la documentación`;
    } else if (p.estado === "borrador") {
      const documentos = await getDocumentosVigentesDeProyecto(p.id, p.productorId);
      const cargados = new Set(documentos.map((d) => d.tipo));
      const faltanDocs = documentosRequeridos(p.tipoPosesion).filter(
        (t) => !cargados.has(t),
      ).length;
      const faltanDatos = camposIncompletos(p).length;
      const partes = [
        faltanDatos > 0
          ? `${faltanDatos} ${faltanDatos === 1 ? "dato" : "datos"} de la ficha`
          : null,
        faltanDocs > 0
          ? `${faltanDocs} ${faltanDocs === 1 ? "documento" : "documentos"}`
          : null,
      ].filter(Boolean);
      if (partes.length > 0) pendiente = `Faltan ${partes.join(" y ")}`;
    }

    items.push({
      proyecto: p,
      pendiente,
      foto: fotos.length > 0 ? fotos[i % fotos.length] : null,
    });
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mis proyectos</h1>
          <p className="mt-1.5 text-sm text-tinta-suave">
            {productor?.razonSocial} · RENSPA{" "}
            <span className="codigo">{productor?.renspa}</span>
          </p>
        </div>
        <BotonLink href="/productor/proyectos/nuevo">Publicar un proyecto</BotonLink>
      </div>

      {items.length === 0 ? (
        <Vacio
          titulo="Todavía no publicaste ningún proyecto"
          accion={
            <BotonLink href="/productor/proyectos/nuevo">Publicar el primero</BotonLink>
          }
        >
          Un proyecto describe un ciclo de engorde y el capital que necesitás para
          llevarlo adelante.
        </Vacio>
      ) : (
        <Suspense fallback={null}>
          <ListaProyectos items={items} />
        </Suspense>
      )}
    </div>
  );
}
