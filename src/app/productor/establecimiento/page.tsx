import { notFound } from "next/navigation";
import { CabeceraProductor } from "@/components/cabecera-productor";
import { Pestanas } from "@/components/pestanas";
import {
  Badge,
  Dato,
  Panel,
  Seccion,
  Vacio,
} from "@/components/ui/primitivos";
import {
  PRODUCTOR_DEMO,
  getProductor,
  getProyectosDeProductor,
} from "@/lib/data";
import {
  formatFecha,
  formatNum,
  formatPct,
} from "@/lib/format";
import { AjustesCuenta } from "./ajustes";
import { ConfiguracionPerfil } from "./configuracion";
import { Documentos } from "./documentos";

export const metadata = { title: "Mi establecimiento — Guardian" };

const PESTANAS = [
  { clave: "datos", titulo: "Mis datos" },
  { clave: "documentos", titulo: "Documentos y garantías" },
  { clave: "trayectoria", titulo: "Trayectoria" },
];

/**
 * Mi establecimiento: los datos del campo, los papeles que se reusan y la
 * trayectoria, en una sola pantalla con pestañas. Antes eran dos pantallas
 * (perfil y documentación) que mostraban los mismos documentos permanentes.
 *
 * El perfil es las dos cosas a la vez: donde el productor configura su cuenta y
 * la ficha que el colaborador termina mirando antes de poner capital. Por eso
 * arranca como una ficha —retrato, nombre y trayectoria— y no como un
 * formulario: lo editable viene después, en filas, y los ajustes de la
 * aplicación al final.
 */
export default async function EstablecimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activa = tab === "documentos" || tab === "trayectoria" ? tab : "datos";
  const productor = await getProductor(PRODUCTOR_DEMO);
  if (!productor) notFound();

  const proyectos = await getProyectosDeProductor(PRODUCTOR_DEMO);

  const cerrados = proyectos.filter(
    (p) => p.estado === "cerrado" && p.resultado,
  );
  const rendimientoPromedio = cerrados.length
    ? cerrados.reduce((acc, p) => acc + (p.resultado?.rendimientoPct ?? 0), 0) /
      cerrados.length
    : 0;
  const activos = proyectos.filter((p) =>
    ["abierto", "fondeado", "en_curso"].includes(p.estado),
  );

  return (
    <div className="space-y-8">
      <CabeceraProductor />

      <Pestanas
        pestanas={PESTANAS}
        activa={activa}
        base="/productor/establecimiento"
      />

      {activa === "datos" ? (
        <div className="space-y-12">
          <ConfiguracionPerfil productor={productor} />

          <AjustesCuenta proyectosVivos={activos.length} />
        </div>
      ) : null}

      {activa === "documentos" ? <Documentos /> : null}

      {activa === "trayectoria" ? (
        <div className="space-y-12">
          <Seccion
            titulo="Trayectoria en Guardian"
            descripcion="Sale de los romaneos de los ciclos que ya cerraste, no de lo que declarás de vos."
          >
            <dl className="grid gap-x-6 gap-y-6 sm:grid-cols-3">
              <Dato etiqueta="Proyectos con capital activo">
                {activos.length}
              </Dato>
              <Dato etiqueta="Ciclos cerrados">{cerrados.length}</Dato>
              <Dato
                etiqueta="Rendimiento de faena promedio"
                codigo
                ayuda={
                  cerrados.length > 0
                    ? "Del romaneo de playa del frigorífico."
                    : "Aparece cuando cierres tu primer ciclo."
                }
              >
                {formatPct(rendimientoPromedio)}
              </Dato>
            </dl>
          </Seccion>

          <Seccion
            titulo="Ciclos cerrados"
            descripcion="Cada cierre queda registrado con el romaneo de playa que lo respalda."
          >
            {cerrados.length === 0 ? (
              <Vacio titulo="Todavía no cerraste ningún ciclo">
                Un ciclo se cierra cuando cargás el romaneo de playa del
                frigorífico y se liquida el resultado real.
              </Vacio>
            ) : (
              <ul className="space-y-3">
                {cerrados.map((p) => (
                  <li key={p.id}>
                    <Panel className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{p.titulo}</h3>
                          <p className="mt-1 text-sm text-tinta-suave">
                            {formatNum(p.cabezas)} {p.categoria} · faenado el{" "}
                            {formatFecha(p.resultado!.fecha)} · DT-e de salida{" "}
                            <span className="codigo">
                              {p.resultado!.dteSalida}
                            </span>
                          </p>
                        </div>
                        <Badge tono="ok">Liquidado</Badge>
                      </div>
                      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-borde pt-4 sm:grid-cols-4">
                        <Dato etiqueta="Cabezas faenadas" codigo>
                          {formatNum(p.resultado!.cabezasFaena)}
                        </Dato>
                        <Dato etiqueta="Kilos vivos" codigo>
                          {formatNum(p.resultado!.kilosVivos)} kg
                        </Dato>
                        <Dato etiqueta="Kilos carne" codigo>
                          {formatNum(p.resultado!.kgCarne)} kg
                        </Dato>
                        <Dato etiqueta="Rendimiento de faena" codigo>
                          {formatPct(p.resultado!.rendimientoPct)}
                        </Dato>
                      </dl>
                    </Panel>
                  </li>
                ))}
              </ul>
            )}
          </Seccion>
        </div>
      ) : null}
    </div>
  );
}
