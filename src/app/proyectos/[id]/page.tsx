import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AutenticidadBadge,
  ConsistenciaBadge,
  EstadoProyectoBadge,
} from "@/components/estados";
import { FideicomisoPanel } from "@/components/fideicomiso-panel";
import { BloqueGarantia, DatoGarantia } from "@/components/garantia";
import { Seguimiento } from "@/components/seguimiento";
import {
  Aviso,
  Badge,
  Panel,
  Dato,
  Progreso,
  TituloBloque,
} from "@/components/ui/primitivos";
import {
  getDocumentosVigentesDeProyecto,
  getGarantia,
  getProductor,
  getProyecto,
  getAportesDeProyecto,
  getSeguimientoDeProyecto,
} from "@/lib/data";
import {
  A_CARGO_LABEL,
  CONTINGENCIA_LABEL,
  DOCUMENTO_LABEL,
  formatArs,
  formatFecha,
  formatNum,
  formatPct,
  MODALIDAD_DESCRIPCION,
  MODALIDAD_RETORNO,
  modalidadLabel,
  MONEDA_LABEL,
  POSESION_DESCRIPCION,
  POSESION_LABEL,
  SISTEMA_LABEL,
} from "@/lib/format";
import { Adherir } from "./adherir";
import {
  FONDEO_LABEL,
  calcularFondeo,
  comisionesSobreCapital,
  condicionesPendientes,
  puedeAdherirse,
  puedeLiquidarse,
  retornoDelProyecto,
} from "@/lib/proyecto";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const proyecto = await getProyecto(id);
  if (!proyecto) return { title: "Proyecto no encontrado — Guardian" };
  return {
    title: `${proyecto.titulo} — Guardian`,
    description: `${formatNum(proyecto.cabezas)} cabezas en ${proyecto.provincia}, a ${
      proyecto.plazoDias
    } días. ${modalidadLabel(proyecto.modalidad)}.`,
  };
}

export default async function FichaProyecto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proyecto = await getProyecto(id);
  if (!proyecto) notFound();

  const productor = await getProductor(proyecto.productorId);
  const garantia = await getGarantia(proyecto.garantiaId);
  // Los vigentes y no solo los del proyecto: la constancia de RENSPA es permanente
  // del establecimiento y se reusa entre ciclos. Pedir solo los del proyecto dejaba
  // la ficha pública mostrando un respaldo incompleto de un lote que sí lo tiene.
  const documentos = await getDocumentosVigentesDeProyecto(
    proyecto.id,
    proyecto.productorId,
  );
  const registros = await getSeguimientoDeProyecto(proyecto.id);

  /**
   * El fondeo sale de los aportes acreditados y no del monto declarado en el
   * proyecto: lo que todavía no acreditó el banco no es capital, es una
   * intención, y se muestra aparte.
   */
  const fondeo = calcularFondeo(proyecto, await getAportesDeProyecto(proyecto.id));
  const pct = fondeo.porcentaje;
  const retorno = retornoDelProyecto(proyecto);
  const pendientes = condicionesPendientes(proyecto);
  const adhesion = puedeAdherirse(proyecto, fondeo);
  const liquidacion = puedeLiquidarse(proyecto);
  const comisionesCapital = comisionesSobreCapital(proyecto);
  const demostrativo =
    proyecto.condiciones.participacion?.fuente === "demostrativo" ||
    proyecto.condiciones.tasa?.fuente === "demostrativo";
  const avisoDemostrativo = demostrativo
    ? "Condición de demostración: no sale de un contrato firmado."
    : undefined;
  const gananciaPesoKg = proyecto.pesoSalidaObjetivoKg - proyecto.pesoEntradaKg;

  return (
    <div>
      <Link href="/proyectos" className="inline-flex min-h-11 items-center text-sm text-tinta-suave hover:text-marca">
        ← Volver al catálogo
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-tinta-tenue">
            {proyecto.provincia} · {SISTEMA_LABEL[proyecto.sistemaProductivo]} ·{" "}
            {productor?.nombre}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{proyecto.titulo}</h1>
        </div>
        <EstadoProyectoBadge estado={proyecto.estado} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          <section>
            <TituloBloque descripcion="Lo que el productor declara al publicar el proyecto.">
              El lote
            </TituloBloque>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              <Dato etiqueta="Cabezas">{formatNum(proyecto.cabezas)}</Dato>
              <Dato etiqueta="Categoría">{proyecto.categoria}</Dato>
              <Dato etiqueta="Raza">{proyecto.raza || "—"}</Dato>
              <Dato etiqueta="Sistema">{SISTEMA_LABEL[proyecto.sistemaProductivo]}</Dato>
              <Dato etiqueta="Peso de entrada">{proyecto.pesoEntradaKg} kg</Dato>
              <Dato etiqueta="Peso objetivo">{proyecto.pesoSalidaObjetivoKg} kg</Dato>
              <Dato
                etiqueta="Ganancia de peso"
                ayuda={`${(gananciaPesoKg / proyecto.plazoDias).toFixed(2)} kg/día`}
              >
                {gananciaPesoKg} kg
              </Dato>
            </dl>
          </section>

          <section className="border-t border-borde pt-7">
            <TituloBloque>
              Condiciones
            </TituloBloque>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              <Dato
                etiqueta="Modalidad"
                ayuda={
                  proyecto.modalidad
                    ? MODALIDAD_DESCRIPCION[proyecto.modalidad]
                    : "Sin determinar."
                }
              >
                {modalidadLabel(proyecto.modalidad)}
              </Dato>
              {/* La tasa de capital de trabajo y la participación de compra y
                  engorde no son lo mismo y no comparten etiqueta: una es una
                  obligación del productor y la otra depende de cómo salga el
                  ciclo. */}
              <Dato etiqueta={retorno.etiqueta} ayuda={avisoDemostrativo}>
                {retorno.valor}
              </Dato>
              <Dato etiqueta="Plazo del ciclo">{proyecto.plazoDias} días</Dato>
              <Dato
                etiqueta="Plazo de cobro"
                ayuda="El frigorífico no paga contra entrega."
              >
                {proyecto.plazoCobroDias === null
                  ? "Pendiente de definición"
                  : `${proyecto.plazoCobroDias} días`}
              </Dato>
              <Dato
                etiqueta="Moneda de aporte y devolución"
                ayuda="Se aporta y se devuelve en pesos."
              >
                {MONEDA_LABEL[proyecto.condiciones.monedaAporte]}
              </Dato>
              <Dato
                etiqueta="Mínimo para iniciar"
                ayuda="No arranca el ciclo por sí solo: falta el presupuesto aprobado."
              >
                {proyecto.montoMinimoInicioArs === null
                  ? "Pendiente de definición"
                  : formatArs(proyecto.montoMinimoInicioArs)}
              </Dato>
              <DatoGarantia garantia={garantia} />
              <Dato etiqueta="Seguro">
                {proyecto.tieneSeguro ? "Contratado" : "Sin seguro"}
              </Dato>
              <Dato etiqueta="Publicado">
                {proyecto.publicadoAt ? formatFecha(proyecto.publicadoAt) : "—"}
              </Dato>
            </dl>

            <div className="mt-5 rounded-lg border border-borde bg-superficie-2 p-4">
              <p className="text-sm font-medium">Qué recibe el colaborador</p>
              <p className="mt-1 text-sm text-tinta-suave">
                {proyecto.modalidad
                  ? MODALIDAD_RETORNO[proyecto.modalidad]
                  : "Hasta que no se determine la modalidad no se puede decir qué recibe el colaborador."}
              </p>
            </div>

            {pendientes.length > 0 ? (
              <div className="mt-4">
                <Aviso tono="alerta" titulo="Condiciones pendientes de definición">
                  <ul className="mt-1 space-y-1">
                    {pendientes.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </Aviso>
              </div>
            ) : null}

            {proyecto.condiciones.proyeccion ? (
              <div className="mt-4 rounded-lg border border-borde bg-superficie-2 p-4">
                <p className="text-sm font-medium">
                  Resultado proyectado por el productor ·{" "}
                  {formatFecha(proyecto.condiciones.proyeccion.fecha)}
                </p>
                <dl className="tabular mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                  <Dato etiqueta="Ingresos estimados">
                    {formatArs(proyecto.condiciones.proyeccion.ingresosEstimadosArs)}
                  </Dato>
                  <Dato etiqueta="Costos estimados">
                    {formatArs(proyecto.condiciones.proyeccion.costosEstimadosArs)}
                  </Dato>
                  <Dato
                    etiqueta="Comisiones sobre el capital"
                    ayuda="Sin la comisión de éxito, que se calcula al cierre."
                  >
                    {comisionesCapital === null
                      ? "Pendientes de definición"
                      : formatArs(comisionesCapital)}
                  </Dato>
                </dl>
                <p className="mt-3 text-sm font-medium">Sobre qué supuestos</p>
                <ul className="mt-1 space-y-1 text-sm text-tinta-suave">
                  {proyecto.condiciones.proyeccion.supuestos.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {proyecto.destinoDetalle ? (
              <div className="mt-5 rounded-lg border border-borde bg-superficie-2 p-4">
                <p className="text-sm font-medium">En qué se gasta el capital</p>
                <p className="mt-1 text-sm text-tinta-suave">{proyecto.destinoDetalle}</p>
              </div>
            ) : null}

            <div className="mt-4 rounded-lg border border-borde bg-superficie-2 p-4">
              <p className="text-sm font-medium">
                {POSESION_LABEL[proyecto.tipoPosesion]}
              </p>
              <p className="mt-1 text-sm text-tinta-suave">
                {POSESION_DESCRIPCION[proyecto.tipoPosesion]}
              </p>
            </div>

            <div className="mt-4">
              {proyecto.modalidad === "capital_trabajo" ? (
                <Aviso tono="alerta" titulo="La tasa es contractual, no un rendimiento asegurado">
                  El productor se obliga a devolverla, y eso no elimina el riesgo de que no
                  cumpla. Si no cumple, se ejecuta la garantía constituida.
                </Aviso>
              ) : (
                <Aviso tono="alerta" titulo="El resultado proyectado no está garantizado">
                  Es una estimación del productor. El resultado sale de la venta cobrada y
                  puede ser menor, o negativo.
                </Aviso>
              )}
            </div>
          </section>

          {proyecto.presupuesto.length > 0 ? (
            <section className="border-t border-borde pt-7">
              <TituloBloque descripcion="Cada tramo se paga contra la documentación que pide la condición.">
                Presupuesto y desembolsos
              </TituloBloque>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-borde text-left">
                      <th scope="col" className="rotulo pb-2 font-medium text-tinta-tenue">
                        Rubro
                      </th>
                      <th scope="col" className="rotulo pb-2 font-medium text-tinta-tenue">
                        Concepto
                      </th>
                      <th scope="col" className="rotulo pb-2 font-medium text-tinta-tenue">
                        Período
                      </th>
                      <th
                        scope="col"
                        className="rotulo pb-2 text-right font-medium text-tinta-tenue"
                      >
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {proyecto.presupuesto.map((r) => (
                      <tr key={r.rubro} className="border-b border-borde">
                        <td className="py-3 font-medium">{r.rubro}</td>
                        <td className="py-3 text-tinta-suave">{r.concepto}</td>
                        <td className="py-3 text-tinta-suave">{r.periodo}</td>
                        <td className="tabular py-3 text-right">{formatArs(r.montoArs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ol className="mt-6 space-y-3">
                {proyecto.cronograma.map((h, i) => (
                  <li
                    key={h.hito}
                    className="rounded-lg border border-borde bg-superficie-2 p-4"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="font-medium">
                        <span className="codigo text-marca">
                          {String(i + 1).padStart(2, "0")}
                        </span>{" "}
                        {h.hito}
                      </p>
                      <p className="tabular text-sm font-medium">{formatArs(h.montoArs)}</p>
                    </div>
                    <p className="mt-1 text-sm text-tinta-suave">{h.momento}</p>
                    <p className="mt-1 text-sm text-tinta-tenue">{h.condicion}</p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <section className="border-t border-borde pt-7">
            <TituloBloque descripcion="Sobre qué se calcula cada una y quién la paga.">
              Gastos y comisiones
            </TituloBloque>

            <ul className="divide-y divide-borde border-y border-borde">
              {proyecto.condiciones.comisiones.map((c) => (
                <li key={c.concepto} className="py-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="font-medium">{c.concepto}</p>
                    <p className="tabular font-medium">
                      {c.porcentaje === null ? (
                        <span className="text-alerta">Pendiente de definición</span>
                      ) : (
                        formatPct(c.porcentaje)
                      )}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-tinta-suave">{c.base}</p>
                  <p className="mt-0.5 text-sm text-tinta-tenue">
                    {A_CARGO_LABEL[c.aCargoDe]} · {c.momento}
                  </p>
                </li>
              ))}
            </ul>

            {comisionesCapital !== null ? (
              <p className="mt-4 text-sm text-tinta-suave">
                Sobre el capital del proyecto son{" "}
                <span className="tabular font-medium text-tinta">
                  {formatArs(comisionesCapital)}
                </span>
                . Lo que se calcula sobre el resultado se conoce al cierre.
              </p>
            ) : null}

            {!liquidacion.puede ? (
              <div className="mt-4">
                <Aviso tono="alerta" titulo="El ciclo no se puede liquidar así">
                  <ul className="mt-1 space-y-1">
                    {liquidacion.motivos.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </Aviso>
              </div>
            ) : null}
          </section>

          {proyecto.condiciones.contingencias.length > 0 ? (
            <section className="border-t border-borde pt-7">
              <TituloBloque descripcion="Quién lo soporta, según el contrato.">
                Qué pasa si algo sale mal
              </TituloBloque>
              {/* Es la pregunta que el colaborador se hace antes de poner el dinero,
                  y hasta ahora solo estaba contestada para la mortandad, adentro
                  del bloque del fideicomiso. */}
              <ul className="grid gap-4 sm:grid-cols-2">
                {proyecto.condiciones.contingencias.map((c) => (
                  <li
                    key={c.caso}
                    className="rounded-xl border border-borde bg-superficie p-5 shadow-[var(--sombra-baja)]"
                  >
                    <p className="font-semibold tracking-tight">
                      {CONTINGENCIA_LABEL[c.caso]}
                    </p>
                    <p className="mt-2 text-sm text-tinta-suave">{c.queDice}</p>
                    <p className="mt-3 border-t border-borde pt-2 text-sm text-tinta-tenue">
                      {c.aCargoDe}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {proyecto.controles.length > 0 ? (
            <section className="border-t border-borde pt-7">
              <TituloBloque descripcion="Qué se revisó, cuándo y con qué método.">
                Controles realizados
              </TituloBloque>
              <ul className="divide-y divide-borde border-y border-borde">
                {proyecto.controles.map((c) => (
                  <li key={c.control} className="py-3.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="font-medium">{c.control}</p>
                      <p className="tabular text-sm text-tinta-tenue">
                        {formatFecha(c.fecha)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-tinta-suave">{c.alcance}</p>
                    <p className="mt-0.5 text-sm text-tinta-tenue">
                      {c.metodo} · {c.responsable}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {registros.length > 0 ? (
            <section className="border-t border-borde pt-7">
              <TituloBloque descripcion="Las pesadas que carga el productor durante el encierre.">
                {proyecto.estado === "cerrado" ? "Cómo fue el ciclo" : "Cómo viene el ciclo"}
              </TituloBloque>
              <Seguimiento proyecto={proyecto} registros={registros} />
            </section>
          ) : null}

          <BloqueGarantia garantia={garantia} />

          {proyecto.fideicomiso ? (
            <FideicomisoPanel fideicomiso={proyecto.fideicomiso} paraColaborador />
          ) : null}

          {proyecto.resultado ? (
            <Panel className="p-5">
              <TituloBloque descripcion="Del romaneo de playa del frigorífico. Es el resultado, no la proyección.">
                Resultado del ciclo
              </TituloBloque>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                <Dato etiqueta="Cabezas faenadas">
                  {formatNum(proyecto.resultado.cabezasFaena)}
                </Dato>
                <Dato etiqueta="Kilos vivos">
                  {formatNum(proyecto.resultado.kilosVivos)} kg
                </Dato>
                <Dato
                  etiqueta="Promedio por cabeza"
                  ayuda="Kilos vivos ÷ cabezas faenadas"
                >
                  {formatNum(
                    Math.round(
                      proyecto.resultado.kilosVivos / proyecto.resultado.cabezasFaena,
                    ),
                  )}{" "}
                  kg
                </Dato>
                <Dato etiqueta="Kg de carne">
                  {formatNum(proyecto.resultado.kgCarne)} kg
                </Dato>
                <Dato etiqueta="Rendimiento">
                  {formatPct(proyecto.resultado.rendimientoPct)}
                </Dato>
                <Dato etiqueta="DT-e de salida" codigo>{proyecto.resultado.dteSalida}</Dato>
              </dl>
            </Panel>
          ) : null}

          <Panel className="p-5">
            <TituloBloque descripcion="Qué respalda el lote y qué fue verificado.">
              Respaldo documental
            </TituloBloque>

            {documentos.length === 0 ? (
              <p className="text-sm text-tinta-suave">
                Todavía no hay documentación cargada para este proyecto.
              </p>
            ) : (
              <ul className="divide-y divide-borde">
                {documentos.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="text-sm font-medium">{DOCUMENTO_LABEL[d.tipo]}</span>
                    {d.cuve ? (
                      <span className="text-sm text-tinta-tenue">
                        CUVE <span className="codigo">{d.cuve}</span>
                      </span>
                    ) : null}
                    <span className="ml-auto flex flex-wrap gap-1.5">
                      <ConsistenciaBadge estado={d.estadoConsistencia} />
                      <AutenticidadBadge estado={d.estadoAutenticidad} />
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4">
              <Aviso titulo="Qué significa cada sello">
                <strong className="font-medium text-tinta">Datos consistentes</strong>: las
                cifras del documento cierran entre sí y con lo declarado.{" "}
                <strong className="font-medium text-tinta">Autenticidad verificada</strong>:
                el documento fue contrastado contra el organismo emisor, y en el DT-e eso se
                hace con el CUVE ante SENASA. Un documento puede ser consistente sin estar
                verificado.
              </Aviso>
            </div>
          </Panel>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Panel nivel="elevado" className="p-5">
            <p className="tabular text-2xl font-semibold tracking-tight">
              {formatArs(fondeo.acreditadoArs)}
            </p>
            <p className="tabular mt-0.5 text-sm text-tinta-suave">
              acreditados de {formatArs(proyecto.montoObjetivoArs)} objetivo
            </p>
            <div className="mt-3">
              <Progreso valor={pct} label={`Acreditado ${formatPct(pct)}`} />
            </div>
            <p className="tabular mt-1.5 text-sm text-tinta-tenue">
              {formatPct(pct)} acreditado · {FONDEO_LABEL[fondeo.estado]}
            </p>

            {/* Lo comprometido y sin acreditar va aparte y nunca sumado: una
                adhesión sin transferencia no es capital del proyecto. */}
            {fondeo.comprometidoSinAcreditarArs > 0 ? (
              <p className="mt-3 border-t border-borde pt-3 text-sm text-tinta-suave">
                Hay {formatArs(fondeo.comprometidoSinAcreditarArs)} adheridos que el banco
                todavía no acreditó. No cuentan como recaudado.
              </p>
            ) : null}

            {proyecto.montoMinimoInicioArs !== null ? (
              <p className="mt-3 text-sm text-tinta-suave">
                El ciclo puede arrancar desde {formatArs(proyecto.montoMinimoInicioArs)},
                con el presupuesto aprobado.
              </p>
            ) : null}

            <div className="mt-5 border-t border-borde pt-4">
              <Adherir
                proyectoId={proyecto.id}
                titulo={proyecto.titulo}
                contratoVersion="Contrato de adhesión v3 — 2026-08-01"
                habilitado={adhesion.puede}
                motivoBloqueo={adhesion.motivo}
              />
            </div>
          </Panel>

          {productor ? (
            <Panel className="p-5">
              <TituloBloque>El productor</TituloBloque>
              <dl className="space-y-4">
                <Dato etiqueta="Razón social">{productor.razonSocial}</Dato>
                <Dato etiqueta="RENSPA" codigo>{productor.renspa}</Dato>
                <Dato etiqueta="Establecimiento">
                  {productor.establecimiento}
                </Dato>
                <Dato etiqueta="Ubicación">
                  {productor.localidad}, {productor.provincia}
                </Dato>
                <Dato
                  etiqueta="Ocupación"
                  ayuda={`${formatNum(productor.ocupacionActual)} de ${formatNum(
                    productor.capacidadInstalada,
                  )} cabezas de capacidad`}
                >
                  {Math.round(
                    (productor.ocupacionActual / productor.capacidadInstalada) * 100,
                  )}{" "}
                  %
                </Dato>
                <Dato etiqueta="Ciclos completados en Guardian">
                  {productor.ciclosCompletados}
                </Dato>
              </dl>
              {/* El sello dice qué se verificó y con qué alcance. "Productor
                  verificado" a secas dejaba pensar que Guardian garantiza la
                  propiedad de los animales, y no es eso lo que se revisó. */}
              <div className="mt-4 rounded-lg border border-borde bg-superficie-2 p-3">
                <p className="text-sm font-medium">Qué revisó Guardian</p>
                <p className="mt-1 text-sm text-tinta-suave">
                  El legajo del productor y del establecimiento: identidad, constancia de
                  RENSPA y disponibilidad del predio. No acredita la propiedad de los
                  animales ni del inmueble.
                </p>
              </div>
            </Panel>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
