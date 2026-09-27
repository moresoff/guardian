"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { TarjetaProyecto, type ItemProyecto } from "@/components/tarjeta-proyecto";
import type { EstadoProyecto } from "@/lib/types";

/**
 * Los proyectos se agrupan por quién tiene la pelota, no por fecha: el borrador
 * espera algo del productor, el que está en revisión espera a Guardian, el
 * publicado ya está en la calle y el cerrado es historia. Un proyecto rechazado
 * vuelve a la primera solapa, porque otra vez le toca mover a él.
 */
const SOLAPAS: {
  clave: string;
  titulo: string;
  descripcion: string;
  estados: EstadoProyecto[];
  vacio: string;
}[] = [
  {
    clave: "borradores",
    titulo: "Borradores",
    descripcion:
      "Sin enviar todavía (solo los ves vos) y los que volvieron rechazados para corregir.",
    estados: ["borrador", "rechazado"],
    vacio: "No tenés ningún borrador a medio hacer.",
  },
  {
    clave: "revision",
    titulo: "En revisión",
    descripcion: "Guardian está revisando la documentación.",
    estados: ["en_validacion"],
    vacio: "No tenés proyectos esperando revisión.",
  },
  {
    clave: "publicados",
    titulo: "Publicados",
    descripcion: "Visibles para los colaboradores, juntando o con el capital ya puesto.",
    estados: ["abierto", "fondeado", "en_curso"],
    vacio: "Todavía no tenés proyectos publicados.",
  },
  {
    clave: "completados",
    titulo: "Completados",
    descripcion: "Ciclos cerrados con el romaneo del frigorífico y liquidados.",
    estados: ["cerrado"],
    vacio: "Cuando cierres tu primer ciclo va a aparecer acá.",
  },
];

/**
 * Filtro de fecha sin calendario: nadie se acuerda del día exacto en que cargó
 * un proyecto, pero sí de si fue hace poco o el año pasado.
 */
const FECHAS = [
  { clave: "reciente", label: "Más reciente primero" },
  { clave: "viejo", label: "Más viejo primero" },
  { clave: "anio", label: "Del último año" },
  { clave: "mes", label: "Del último mes" },
] as const;

type ClaveFecha = (typeof FECHAS)[number]["clave"];

function desde(meses: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - meses);
  return d.toISOString().slice(0, 10);
}

export function ListaProyectos({ items }: { items: ItemProyecto[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const solapa =
    SOLAPAS.find((s) => s.clave === params.get("estado"))?.clave ?? SOLAPAS[0].clave;
  const fecha = (FECHAS.find((f) => f.clave === params.get("desde"))?.clave ??
    "reciente") as ClaveFecha;

  /**
   * Se reemplaza la entrada del historial en vez de apilar una nueva: cambiar de
   * solapa no es navegar, y con `push` el botón de atrás tendría que deshacer
   * cada click antes de salir de la pantalla.
   */
  const cambiar = (clave: string, valor: string, porDefecto: string) => {
    const siguientes = new URLSearchParams(params.toString());
    if (valor === porDefecto) siguientes.delete(clave);
    else siguientes.set(clave, valor);
    const query = siguientes.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const setSolapa = (v: string) => cambiar("estado", v, SOLAPAS[0].clave);
  const setFecha = (v: string) => cambiar("desde", v, "reciente");

  const cuentas = useMemo(
    () =>
      new Map(
        SOLAPAS.map((s) => [
          s.clave,
          items.filter((i) => s.estados.includes(i.proyecto.estado)).length,
        ]),
      ),
    [items],
  );

  const actual = SOLAPAS.find((s) => s.clave === solapa) ?? SOLAPAS[0];

  const visibles = useMemo(() => {
    const corte =
      fecha === "mes" ? desde(1) : fecha === "anio" ? desde(12) : null;
    return items
      .filter((i) => actual.estados.includes(i.proyecto.estado))
      .filter((i) => (corte ? i.proyecto.creadoAt >= corte : true))
      .sort((a, b) =>
        fecha === "viejo"
          ? a.proyecto.creadoAt.localeCompare(b.proyecto.creadoAt)
          : b.proyecto.creadoAt.localeCompare(a.proyecto.creadoAt),
      );
  }, [items, actual, fecha]);

  const recortados = cuentas.get(actual.clave) ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Estado">
          {SOLAPAS.map((s) => {
            const activa = s.clave === solapa;
            return (
              <button
                key={s.clave}
                type="button"
                onClick={() => setSolapa(s.clave)}
                aria-pressed={activa}
                className={`flex min-h-11 items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
                  activa
                    ? "border-marca bg-marca-suave font-medium text-marca"
                    : "border-borde text-tinta-suave hover:bg-superficie-2 hover:text-tinta"
                }`}
              >
                {s.titulo}
                <span className="tabular text-tinta-tenue">
                  {cuentas.get(s.clave) ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="filtro-fecha" className="text-sm text-tinta-suave">
            Fecha
          </label>
          <select
            id="filtro-fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value as ClaveFecha)}
            className="min-h-11 rounded-lg border border-borde-fuerte bg-superficie px-3.5 py-2.5 text-sm text-tinta"
          >
            {FECHAS.map((f) => (
              <option key={f.clave} value={f.clave}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-4 border-t border-borde pt-4 text-sm text-tinta-suave">
        {actual.descripcion}
      </p>

      {visibles.length === 0 ? (
        <p className="pt-6 text-sm text-tinta-tenue">
          {recortados === 0
            ? actual.vacio
            : `Ninguno de los ${recortados} de esta solapa entra en el período elegido.`}
        </p>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2">
          {visibles.map((i) => (
            <li key={i.proyecto.id}>
              <TarjetaProyecto item={i} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

