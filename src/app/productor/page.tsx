import { usuarioActual } from "@/lib/sesion";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Avisos, type Aviso } from "@/components/avisos";
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
  formatNum,
  formatPct,
  porcentajeRecaudado,
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

  const avisos: Aviso[] = [];
  /** Lo que cada proyecto le está pidiendo al productor, para la tarjeta. */
  const pendientes = new Map<string, string>();

  // Los ciclos viejos ya se leyeron: solo el último cierre sigue siendo noticia.
  const ultimoCierre = proyectos.find((p) => p.estado === "cerrado" && p.resultado);

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
      avisos.push({
        id: `disc-${p.id}`,
        titulo: `${sinResolver.length} ${
          sinResolver.length === 1 ? "discrepancia" : "discrepancias"
        } sin resolver`,
        texto: `En ${p.titulo}. Guardian no lo publica hasta que los números cierren con la documentación.`,
        href: `/productor/proyectos/${p.id}`,
        accion: "Revisar",
      });
    }

    if (p.estado === "borrador") {
      const documentos = await getDocumentosVigentesDeProyecto(p.id, p.productorId);
      const cargados = new Set(documentos.map((d) => d.tipo));
      const faltanDocs = documentosRequeridos(p.tipoPosesion).filter(
        (t) => !cargados.has(t),
      ).length;
      const faltanDatos = camposIncompletos(p).length;
      if (faltanDatos > 0 || faltanDocs > 0) {
        if (!pendientes.has(p.id)) {
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
        avisos.push({
          id: `borr-${p.id}`,
          titulo: "Te falta completar una ficha",
          texto: `${p.titulo}: ${[
            faltanDatos > 0
              ? `${faltanDatos} ${faltanDatos === 1 ? "dato" : "datos"}`
              : null,
            faltanDocs > 0
              ? `${faltanDocs} ${faltanDocs === 1 ? "documento" : "documentos"}`
              : null,
          ]
            .filter(Boolean)
            .join(" y ")} para poder enviarlo a revisión.`,
          href: `/productor/proyectos/${p.id}`,
          accion: "Completar",
        });
      }
    }

    if (p.estado === "abierto") {
      const pct = porcentajeRecaudado(p.montoRecaudadoArs, p.montoObjetivoArs);
      avisos.push({
        id: `pub-${p.id}`,
        titulo: "Tu proyecto está publicado",
        texto: `${p.titulo} lleva ${pct} % del capital comprometido por colaboradores.`,
        href: `/proyectos/${p.id}`,
        accion: "Ver la ficha pública",
      });
    }

    if (p.resultado && p.id === ultimoCierre?.id) {
      avisos.push({
        id: `cierre-${p.id}`,
        titulo: "Ciclo cerrado y liquidado",
        texto: `${p.titulo} cerró con un rendimiento de faena de ${formatPct(p.resultado.rendimientoPct)} sobre ${formatNum(
          p.resultado.kilosVivos,
        )} kg vivos, según el romaneo.`,
        href: `/productor/proyectos/${p.id}`,
        accion: "Ver el cierre",
      });
    }
  }

  const cuenta = (estados: string[]) =>
    proyectos.filter((p) => estados.includes(p.estado)).length;

  const recuento = [
    { t: "Con aportes activos", v: cuenta(["abierto", "fondeado", "en_curso"]) },
    { t: "En revisión", v: cuenta(["en_validacion"]) },
    { t: "Borradores", v: cuenta(["borrador"]) },
    { t: "Completados", v: cuenta(["cerrado"]) },
  ];

  const items: ItemProyecto[] = proyectos.map((p) => ({
    proyecto: p,
    pendiente: pendientes.get(p.id),
    foto: fotoDelProyecto(p.id),
  }));

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hola, {(usuario?.nombre ?? productor.responsable).split(" ")[0]}
          </h1>
          <p className="mt-1.5 text-sm text-tinta-suave">
            {productor.establecimiento} · {productor.localidad}, {productor.provincia}
          </p>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <SaldosCard saldos={saldos} />

        <div className="flex flex-col">
          <h2 className="text-lg font-semibold tracking-tight">Tus proyectos</h2>

          {/* Las cuatro tarjetas ocupan lo mismo que la tarjeta de saldos: son
              las dos mitades de un mismo bloque, no dos bloques sueltos. */}
          <dl className="mt-4 grid flex-1 grid-cols-2 gap-3">
            {recuento.map((x) => (
              <div
                key={x.t}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-borde bg-superficie p-5 text-center"
              >
                <dt className="text-sm text-tinta-suave">{x.t}</dt>
                <dd className="tabular text-4xl font-semibold leading-none">{x.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {avisos.length > 0 ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold tracking-tight">
            Para ponerte al día
          </h2>
          <Avisos avisos={avisos} />
        </section>
      ) : null}

      <section className="border-t border-borde pt-8">
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
