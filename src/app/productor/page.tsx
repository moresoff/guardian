import { usuarioActual } from "@/lib/sesion";
import { notFound } from "next/navigation";
import { TarjetaProyecto, type ItemProyecto } from "@/components/tarjeta-proyecto";
import { BotonLink, Vacio } from "@/components/ui/primitivos";
import {
  PRODUCTOR_DEMO,
  getDiscrepanciasDeProyecto,
  getDocumentosVigentesDeProyecto,
  getProductor,
  getProyectosDeProductor,
} from "@/lib/data";
import { camposIncompletos } from "@/lib/ficha";
import { fotoDelProyecto } from "@/lib/imagenes";
import { documentosRequeridos } from "@/lib/format";

export const metadata = { title: "Mis proyectos — Guardian" };

/**
 * Mis proyectos responde una sola pregunta: ¿qué tengo que hacer hoy? Arriba va
 * lo que espera algo del productor y abajo el resto, agrupado por quién tiene la
 * pelota. Sin tablero de cifras, sin solapas y sin «Ver más»: antes la cantidad
 * de proyectos aparecía tres veces antes de llegar a los proyectos.
 */
export default async function ResumenProductor() {
  const usuario = await usuarioActual();
  const productor = await getProductor(PRODUCTOR_DEMO);
  if (!productor) notFound();

  const proyectos = await getProyectosDeProductor(PRODUCTOR_DEMO);

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
          sinResolver.length === 1 ? "dato no coincide" : "datos no coinciden"
        } con tus papeles`,
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
              ? `${faltanDatos} ${faltanDatos === 1 ? "dato" : "datos"}`
              : null,
            faltanDocs > 0
              ? `${faltanDocs} ${faltanDocs === 1 ? "papel" : "papeles"}`
              : null,
          ]
            .filter(Boolean)
            .join(" y ")}`,
        );
      }
    }
  }

  const items: ItemProyecto[] = proyectos
    .map((p) => ({
      proyecto: p,
      pendiente: pendientes.get(p.id),
      foto: fotoDelProyecto(p.id),
    }))
    // El más reciente primero: es lo que el productor busca casi siempre.
    .sort((a, b) => b.proyecto.creadoAt.localeCompare(a.proyecto.creadoAt));

  /**
   * Un proyecto va a «Te toca a vos» si le falta algo, esté en el estado que
   * esté: una discrepancia en un proyecto publicado también es trabajo suyo.
   */
  const leToca = (i: ItemProyecto) =>
    Boolean(i.pendiente) || ["borrador", "rechazado"].includes(i.proyecto.estado);

  const grupos = [
    {
      titulo: "Te toca a vos",
      descripcion: "Tocá el proyecto para completar lo que falta.",
      items: items.filter(leToca),
    },
    {
      titulo: "Esperando a Guardian",
      descripcion: "Estamos revisando tus papeles. Te avisamos cuando termine.",
      items: items.filter((i) => !leToca(i) && i.proyecto.estado === "en_validacion"),
    },
    {
      titulo: "En marcha",
      descripcion: "Publicados y con colaboradores. Acá cargás las pesadas.",
      items: items.filter(
        (i) =>
          !leToca(i) && ["abierto", "fondeado", "en_curso"].includes(i.proyecto.estado),
      ),
    },
    {
      titulo: "Terminados",
      descripcion: "Ciclos cerrados con el romaneo del frigorífico.",
      items: items.filter((i) => !leToca(i) && i.proyecto.estado === "cerrado"),
    },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Hola, {(usuario?.nombre ?? productor.responsable).split(" ")[0]}
        </h1>
        <BotonLink href="/productor/proyectos/nuevo">Publicar un proyecto</BotonLink>
      </div>

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
        grupos.map((g, n) => (
          <section
            key={g.titulo}
            className={n > 0 ? "border-t border-borde pt-8" : undefined}
          >
            <h2 className="text-xl font-semibold tracking-tight">
              {g.titulo}{" "}
              <span className="tabular font-medium text-tinta-tenue">{g.items.length}</span>
            </h2>
            <p className="mt-1 text-tinta-suave">{g.descripcion}</p>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {g.items.map((i) => (
                <li key={i.proyecto.id}>
                  <TarjetaProyecto item={i} compacta />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
