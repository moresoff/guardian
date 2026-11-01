"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
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
    clave: "todos",
    titulo: "Todos",
    descripcion: "",
    estados: [
      "borrador",
      "rechazado",
      "en_validacion",
      "abierto",
      "fondeado",
      "en_curso",
      "cerrado",
    ],
    vacio: "Todavía no tenés proyectos.",
  },
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

/** Cuántos proyectos se ven antes de pedir «Ver más»: dos filas de dos. */
const VISIBLES = 4;

export function ListaProyectos({ items }: { items: ItemProyecto[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const solapa =
    SOLAPAS.find((s) => s.clave === params.get("estado"))?.clave ?? SOLAPAS[0].clave;
  const [verTodos, setVerTodos] = useState(false);

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

  // El más reciente primero: es lo que el productor busca casi siempre.
  const visibles = useMemo(
    () =>
      items
        .filter((i) => actual.estados.includes(i.proyecto.estado))
        .sort((a, b) => b.proyecto.creadoAt.localeCompare(a.proyecto.creadoAt)),
    [items, actual],
  );

  const mostrados = verTodos ? visibles : visibles.slice(0, VISIBLES);

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
                className={`flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors ${
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
      </div>

      {visibles.length === 0 ? (
        <p className="pt-6 text-sm text-tinta-tenue">{actual.vacio}</p>
      ) : (
        <>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {mostrados.map((i) => (
              <li key={i.proyecto.id}>
                <TarjetaProyecto item={i} compacta />
              </li>
            ))}
          </ul>
          {visibles.length > VISIBLES ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => setVerTodos((v) => !v)}
                aria-expanded={verTodos}
                className="flex min-h-11 items-center rounded-full border border-borde-fuerte bg-superficie px-5 text-sm font-medium transition-colors hover:border-marca hover:bg-marca-suave"
              >
                {verTodos
                  ? "Ver menos"
                  : `Ver más (${visibles.length - VISIBLES})`}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
