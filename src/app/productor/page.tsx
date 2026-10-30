import { usuarioActual } from "@/lib/sesion";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CabeceraProductor } from "@/components/cabecera-productor";
import { SaldosCard } from "@/components/saldos-card";
import type { ItemProyecto } from "@/components/tarjeta-proyecto";
import { BotonLink, Vacio } from "@/components/ui/primitivos";
import {
  PRODUCTOR_DEMO,
  getDiscrepanciasDeProyecto,
  getDocumentosVigentesDeProyecto,
  getProductor,
  getProyectosDeProductor,
  getSaldosDeProductor,
} from "@/lib/data";
import { camposIncompletos } from "@/lib/ficha";
import { fotoDelProyecto } from "@/lib/imagenes";
import { ListaProyectos } from "./lista";
import {
  documentosRequeridos,
} from "@/lib/format";

export const metadata = { title: "Mis proyectos — Guardian" };

/**
 * Mis proyectos: el tablero y la lista en una sola pantalla. Arriba, lo que está
 * esperando algo del productor; abajo, todos sus proyectos agrupados por quién
 * tiene la pelota. Antes eran dos pantallas (un resumen y una lista) que se
 * mandaban de una a la otra.
 */
export default async function ResumenProductor() {
  const usuario = await usuarioActual();
  const productor = await getProductor(PRODUCTOR_DEMO);
  if (!productor) notFound();

  const proyectos = await getProyectosDeProductor(PRODUCTOR_DEMO);
  const saldos = await getSaldosDeProductor(PRODUCTOR_DEMO);

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

  const cuenta = (estados: string[]) =>
    proyectos.filter((p) => estados.includes(p.estado)).length;

  const recuento = [
    { t: "Con aportes activos", solapa: "publicados", v: cuenta(["abierto", "fondeado", "en_curso"]) },
    { t: "En revisión", solapa: "revision", v: cuenta(["en_validacion"]) },
    { t: "Borradores", solapa: "borradores", v: cuenta(["borrador"]) },
    { t: "Completados", solapa: "completados", v: cuenta(["cerrado"]) },
  ];

  const items: ItemProyecto[] = proyectos.map((p) => ({
    proyecto: p,
    pendiente: pendientes.get(p.id),
    foto: fotoDelProyecto(p.id),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hola, {(usuario?.nombre ?? productor.responsable).split(" ")[0]}
          </h1>
        </div>
        <BotonLink href="/productor/proyectos/nuevo">Publicar un proyecto</BotonLink>
      </div>

      <CabeceraProductor />

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SaldosCard saldos={saldos} />
        </div>

        {/* Los cuatro estados en un solo panel y no en cuatro tarjetas iguales:
            cada fila lleva a esa solapa de la lista de abajo. */}
        <div className="flex flex-col rounded-2xl border border-borde bg-superficie p-5 shadow-[var(--sombra-baja)] sm:p-6 lg:col-span-5">
          <h2 className="text-lg font-semibold tracking-tight">Tus proyectos</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            {proyectos.length} en total · tocá uno para verlos abajo.
          </p>
          <ul className="mt-4 flex flex-1 flex-col justify-between gap-2">
            {recuento.map((x) => (
              <li key={x.t}>
                <Link
                  href={`/productor?estado=${x.solapa}#proyectos`}
                  scroll
                  className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-superficie-2"
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-tinta-suave">{x.t}</span>
                    <span className="tabular text-2xl font-semibold leading-none">
                      {x.v}
                    </span>
                  </span>
                  <span
                    className="mt-2 block h-1.5 overflow-hidden rounded-full bg-superficie-2"
                    aria-hidden
                  >
                    <span
                      className="block h-full rounded-full bg-marca"
                      style={{
                        width: `${proyectos.length ? (x.v / proyectos.length) * 100 : 0}%`,
                      }}
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="proyectos" className="scroll-mt-20 border-t border-borde pt-8">
        {items.length === 0 ? (
          <Vacio
            titulo="Todavía no publicaste ningún proyecto"
            accion={
              <BotonLink href="/productor/proyectos/nuevo">Publicar el primero</BotonLink>
            }
          >
            Un proyecto describe un ciclo de engorde y lo que necesitás para llevarlo
            adelante.
          </Vacio>
        ) : (
          // La lista lee la solapa y el orden de la URL: necesita su propio
          // límite de Suspense para que la página siga prerenderizándose.
          <Suspense fallback={null}>
            <ListaProyectos items={items} />
          </Suspense>
        )}
      </section>
    </div>
  );
}
