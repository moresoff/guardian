import { notFound } from "next/navigation";
import { CabeceraPerfil, type DatoCabecera } from "@/components/cabecera-perfil";
import { AutenticidadBadge } from "@/components/estados";
import { Badge, BotonLink, Dato, Panel, Seccion, Vacio } from "@/components/ui/primitivos";
import {
  PRODUCTOR_DEMO,
  getDocumentosPermanentes,
  getProductor,
  getProyectosDeProductor,
} from "@/lib/data";
import {
  DOCUMENTO_LABEL,
  SISTEMA_LABEL,
  formatArsCompacto,
  formatFecha,
  formatNum,
  formatPct,
} from "@/lib/format";
import { buscarImagen } from "@/lib/imagenes";
import { AjustesCuenta } from "./ajustes";
import { ConfiguracionPerfil } from "./configuracion";

export const metadata = { title: "Mi establecimiento — Guardian" };

/**
 * El perfil es las dos cosas a la vez: donde el productor configura su cuenta y
 * la ficha que el colaborador termina mirando antes de poner capital. Por eso
 * arranca como una ficha —retrato, nombre y trayectoria— y no como un
 * formulario: lo editable viene después, en filas, y los ajustes de la
 * aplicación al final.
 */
export default async function PerfilPage() {
  const productor = await getProductor(PRODUCTOR_DEMO);
  if (!productor) notFound();

  const proyectos = await getProyectosDeProductor(PRODUCTOR_DEMO);
  const permanentes = await getDocumentosPermanentes(PRODUCTOR_DEMO);

  const cerrados = proyectos.filter((p) => p.estado === "cerrado" && p.resultado);
  const activos = proyectos.filter((p) =>
    ["abierto", "fondeado", "en_curso"].includes(p.estado),
  );
  const capitalMovilizado = proyectos
    .filter((p) => p.estado !== "borrador" && p.estado !== "rechazado")
    .reduce((acc, p) => acc + p.montoRecaudadoArs, 0);

  const kgFaenados = cerrados.reduce((acc, p) => acc + (p.resultado?.kgCarne ?? 0), 0);
  const rendimientoPromedio = cerrados.length
    ? cerrados.reduce((acc, p) => acc + (p.resultado?.rendimientoPct ?? 0), 0) /
      cerrados.length
    : 0;

  /**
   * El sello de verificado dice lo que se puede probar y nada más: que la
   * constancia de RENSPA está contrastada contra SENASA. Si el papel todavía no
   * se verificó, no hay sello.
   */
  const renspaVerificado = permanentes.some(
    (d) => d.tipo === "renspa" && d.estadoAutenticidad === "verificada",
  );

  // Las fotos las carga el equipo en `public/imagenes/fotos`. Si todavía no
  // están, la cabecera dibuja el fondo de marca y las iniciales.
  const retrato = buscarImagen("fotos", "ganadero") ?? buscarImagen("fotos", "productor");

  // El primer proyecto publicado sirve para mirarse con los ojos del colaborador.
  const publicado = proyectos.find((p) =>
    ["abierto", "fondeado", "en_curso", "cerrado"].includes(p.estado),
  );

  const datosCabecera: DatoCabecera[] = [
    { etiqueta: "Ciclos cerrados", valor: cerrados.length },
    { etiqueta: "Capital movilizado", valor: formatArsCompacto(capitalMovilizado) },
    { etiqueta: "Carne producida", valor: `${formatNum(kgFaenados)} kg`, codigo: true },
    {
      etiqueta: "Rendimiento promedio",
      valor: cerrados.length > 0 ? formatPct(rendimientoPromedio) : "—",
      codigo: true,
    },
  ];

  return (
    <div className="space-y-12">
      <CabeceraPerfil
        titulo={productor.razonSocial}
        subtitulo={`${productor.establecimiento} · ${productor.localidad}, ${
          productor.provincia
        } · ${SISTEMA_LABEL[productor.sistemaProductivo]}`}
        sello={renspaVerificado ? <Badge tono="ok">RENSPA verificado</Badge> : undefined}
        foto={retrato}
        datos={datosCabecera}
        accion={
          publicado ? (
            <BotonLink variante="secundario" href={`/proyectos/${publicado.id}`}>
              Ver mi perfil público
            </BotonLink>
          ) : undefined
        }
      />

      <ConfiguracionPerfil productor={productor} />

      <Seccion
        titulo="Trayectoria en Guardian"
        descripcion="Sale de los romaneos de los ciclos que ya cerraste, no de lo que declarás de vos."
      >
        <dl className="grid gap-x-6 gap-y-6 sm:grid-cols-3">
          <Dato etiqueta="Proyectos con capital activo">{activos.length}</Dato>
          <Dato etiqueta="Ciclos cerrados">{cerrados.length}</Dato>
          <Dato
            etiqueta="Rendimiento promedio"
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
            Un ciclo se cierra cuando cargás el romaneo de playa del frigorífico y se
            liquida el resultado real.
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
                        <span className="codigo">{p.resultado!.dteSalida}</span>
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
                    <Dato etiqueta="Rendimiento" codigo>
                      {formatPct(p.resultado!.rendimientoPct)}
                    </Dato>
                  </dl>
                </Panel>
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      <Seccion
        titulo="Documentación del establecimiento"
        descripcion="Los papeles que no dependen de un proyecto y se reusan en todos los que publiques."
      >
        {permanentes.length === 0 ? (
          <Vacio titulo="No tenés documentación permanente cargada">
            La constancia de RENSPA es la que más conviene tener cargada: se pide en todos
            los proyectos, tengas la hacienda o la tengas que comprar.
          </Vacio>
        ) : (
          <ul className="divide-y divide-borde border-y border-borde">
            {permanentes.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3.5"
              >
                <div>
                  <p className="font-medium">{DOCUMENTO_LABEL[d.tipo]}</p>
                  <p className="mt-0.5 text-sm text-tinta-tenue">
                    <span className="codigo">{d.nombreArchivo}</span> · subido el{" "}
                    {formatFecha(d.subidoAt)}
                  </p>
                </div>
                <AutenticidadBadge estado={d.estadoAutenticidad} />
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      <AjustesCuenta proyectosVivos={activos.length} />
    </div>
  );
}
