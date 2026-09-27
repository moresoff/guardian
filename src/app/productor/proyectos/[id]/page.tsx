import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentoCard } from "@/components/documento-card";
import { EstadoProyectoBadge } from "@/components/estados";
import { FideicomisoPanel } from "@/components/fideicomiso-panel";
import { BloqueGarantia, DatoGarantia } from "@/components/garantia";
import { Seguimiento } from "@/components/seguimiento";
import { FichaTecnica } from "./ficha-tecnica";
import { RegistrarPesada } from "./registrar-pesada";
import { SubirRespaldo } from "./subir-respaldo";
import {
  Aviso,
  Badge,
  Panel,
  Dato,
  TituloBloque,
  Vacio,
} from "@/components/ui/primitivos";
import {
  getDiscrepanciasDeProyecto,
  getDocumentosVigentesDeProyecto,
  getGarantia,
  getGarantiasConUso,
  getProyecto,
  getSeguimientoDeProyecto,
} from "@/lib/data";
import {
  DESTINO_LABEL,
  DOCUMENTO_LABEL,
  modalidadLabel,
  GARANTIA_LABEL,
  POSESION_LABEL,
  documentosRequeridos,
  formatArs,
  formatNum,
  formatPct,
} from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const proyecto = await getProyecto(id);
  return {
    title: proyecto ? `${proyecto.titulo} — Guardian` : "Proyecto no encontrado — Guardian",
  };
}

export default async function DetalleProyectoProductor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proyecto = await getProyecto(id);
  if (!proyecto) notFound();

  const documentos = await getDocumentosVigentesDeProyecto(
    proyecto.id,
    proyecto.productorId,
  );
  const discrepancias = await getDiscrepanciasDeProyecto(proyecto.id);
  const garantia = await getGarantia(proyecto.garantiaId);
  const garantias = (await getGarantiasConUso(proyecto.productorId)).map((g) => ({
    id: g.garantia.id,
    label: `${GARANTIA_LABEL[g.garantia.tipo]} — ${g.garantia.identificacion}`,
    // La garantía que ya usa este proyecto sigue disponible para este proyecto,
    // aunque el cupo esté lleno: es el cupo que él mismo ocupa.
    disponible: g.disponible || g.garantia.id === proyecto.garantiaId,
  }));
  const registros = await getSeguimientoDeProyecto(proyecto.id);
  // El seguimiento aparece cuando la hacienda ya está en el corral: antes de eso
  // no hay nada que pesar. Un ciclo cerrado lo conserva como historia.
  const conSeguimiento = ["fondeado", "en_curso", "cerrado"].includes(proyecto.estado);
  const ultima = registros[registros.length - 1];

  const requeridos = documentosRequeridos(proyecto.tipoPosesion);
  const cargados = new Set(documentos.map((d) => d.tipo));
  const faltantes = requeridos.filter((t) => !cargados.has(t));
  const sinResolver = discrepancias.filter((d) => !d.resuelta);

  return (
    <div>
      <Link href="/productor/proyectos" className="inline-flex min-h-11 items-center text-sm text-tinta-suave hover:text-marca">
        ← Volver a mis proyectos
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-tinta-tenue">
            {modalidadLabel(proyecto.modalidad)} ·{" "}
            {POSESION_LABEL[proyecto.tipoPosesion]}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{proyecto.titulo}</h1>
        </div>
        <EstadoProyectoBadge estado={proyecto.estado} />
      </div>

      {sinResolver.length > 0 ? (
        <div className="mt-5">
          <Aviso
            tono="alerta"
            titulo={`${sinResolver.length} ${
              sinResolver.length === 1 ? "discrepancia" : "discrepancias"
            } entre lo que declaraste y lo que dice la documentación`}
          >
            Guardian no publica el proyecto hasta que estén resueltas. Revisá cada una más
            abajo: podés corregir el dato del proyecto o subir el documento que corresponda.
          </Aviso>
        </div>
      ) : null}

      {/* Un proyecto sin modalidad no se puede publicar y conviene decirlo
          arriba de todo: lo que falta no es un dato más, es saber si el colaborador
          participa del resultado o cobra una tasa. */}
      {proyecto.modalidad === null ? (
        <div className="mt-5">
          <Aviso tono="alerta" titulo="Este proyecto quedó sin modalidad">
            {proyecto.motivoRevisionModalidad}
            {proyecto.destinoFondosPrevio ? (
              <p className="mt-2">
                Antes estaba cargado como{" "}
                <span className="font-medium text-tinta">
                  {DESTINO_LABEL[proyecto.destinoFondosPrevio]}
                </span>
                . No se convirtió solo: hay que elegir compra y engorde o capital de
                trabajo antes de poder enviarlo a revisión.
              </p>
            ) : null}
          </Aviso>
        </div>
      ) : null}

      {proyecto.estado === "borrador" ? (
        <div className="mt-8">
          <p className="mb-8 max-w-2xl text-sm text-marca">
            Este proyecto todavía es un borrador: solo lo ves vos. Completá la ficha y
            subí la documentación, y recién ahí lo enviás a revisión.
          </p>
          <FichaTecnica
            proyecto={proyecto}
            garantias={garantias}
            requeridos={requeridos}
            yaCargados={documentos.map((d) => ({
              tipo: d.tipo,
              archivo: d.nombreArchivo,
              campos: d.camposExtraidos.map((c) => ({
                etiqueta: c.etiqueta,
                valor: c.valor,
              })),
            }))}
          />
        </div>
      ) : (
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Panel className="p-5">
            <TituloBloque>Los saldos del proyecto</TituloBloque>
            <dl className="tabular grid gap-x-6 gap-y-5 sm:grid-cols-3">
              <Dato
                etiqueta="Recaudado"
                ayuda="Lo que los colaboradores ya pusieron en este proyecto."
              >
                {formatArs(proyecto.montoRecaudadoArs)}
              </Dato>
              <Dato
                etiqueta="Liquidado"
                ayuda="Lo que Guardian ya liberó a tu favor según el avance del ciclo."
              >
                {formatArs(proyecto.montoLiberadoArs)}
              </Dato>
              <Dato
                etiqueta="A liquidar"
                ayuda="Recaudado menos liquidado: está en el fideicomiso y todavía no salió."
              >
                {formatArs(proyecto.montoRecaudadoArs - proyecto.montoLiberadoArs)}
              </Dato>
            </dl>
          </Panel>

          <Panel className="p-5">
            <TituloBloque>Lo declarado</TituloBloque>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              <Dato etiqueta="Cabezas">{formatNum(proyecto.cabezas)}</Dato>
              <Dato etiqueta="Categoría">{proyecto.categoria}</Dato>
              <Dato etiqueta="Peso de entrada">{proyecto.pesoEntradaKg} kg</Dato>
              <Dato etiqueta="Peso objetivo">{proyecto.pesoSalidaObjetivoKg} kg</Dato>
              <Dato etiqueta="Monto objetivo">{formatArs(proyecto.montoObjetivoArs)}</Dato>
              <Dato etiqueta="Plazo">{proyecto.plazoDias} días</Dato>
              <Dato etiqueta="Rendimiento esperado">
                {formatPct(proyecto.rendimientoEsperadoPct)}
              </Dato>
              <DatoGarantia garantia={garantia} />
              <Dato etiqueta="Seguro">
                {proyecto.tieneSeguro ? "Contratado" : "Sin seguro"}
              </Dato>
              <div className="col-span-2 sm:col-span-3">
                <Dato etiqueta="En qué se gasta el capital">
                  {proyecto.destinoDetalle || "—"}
                </Dato>
              </div>
            </dl>
          </Panel>

          {conSeguimiento ? (
            <div>
              <TituloBloque
                descripcion="Las pesadas del lote y lo que se gastó en el ciclo. Es la misma pantalla que ve el colaborador."
                accion={
                  proyecto.estado === "cerrado" ? undefined : (
                    <RegistrarPesada
                      cabezasVivas={ultima?.cabezas ?? proyecto.cabezas}
                      pesoAnteriorKg={ultima?.pesoPromedioKg ?? proyecto.pesoEntradaKg}
                    />
                  )
                }
              >
                {proyecto.estado === "cerrado"
                  ? "Cómo fue el ciclo"
                  : "Seguimiento del ciclo"}
              </TituloBloque>
              <Seguimiento proyecto={proyecto} registros={registros} />
            </div>
          ) : null}

          <BloqueGarantia garantia={garantia} />

          {proyecto.fideicomiso ? (
            <FideicomisoPanel fideicomiso={proyecto.fideicomiso} />
          ) : null}

          <div>
            <TituloBloque descripcion="Cada documento se lee al subirlo y se compara contra lo que declaraste.">
              Documentación del proyecto
            </TituloBloque>

            {documentos.length === 0 ? (
              <Vacio titulo="Todavía no subiste documentación">
                Sin comprobantes, Guardian no puede validar el lote ni publicar el proyecto.
              </Vacio>
            ) : (
              <div className="space-y-4">
                {documentos.map((d) => (
                  <DocumentoCard
                    key={d.id}
                    documento={d}
                    discrepancias={discrepancias.filter((x) => x.documentoId === d.id)}
                  />
                ))}
              </div>
            )}

            <div className="mt-6 border-t border-borde pt-6">
              <SubirRespaldo faltantes={faltantes} cabezas={proyecto.cabezas} />
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Panel className="p-5">
            <TituloBloque
              descripcion={`Según el proyecto sea de ${POSESION_LABEL[
                proyecto.tipoPosesion
              ].toLowerCase()}.`}
            >
              Documentación exigida
            </TituloBloque>
            <ul className="space-y-2.5">
              {requeridos.map((t) => {
                const listo = cargados.has(t);
                return (
                  <li key={t} className="flex items-center justify-between gap-3 text-sm">
                    <span className={listo ? "" : "text-tinta-suave"}>
                      {DOCUMENTO_LABEL[t]}
                    </span>
                    <Badge tono={listo ? "ok" : "neutro"}>
                      {listo ? "Cargado" : "Falta"}
                    </Badge>
                  </li>
                );
              })}
            </ul>
            {faltantes.length > 0 ? (
              <p className="mt-4 text-sm text-tinta-suave">
                Faltan {faltantes.length} de {requeridos.length} documentos obligatorios.
              </p>
            ) : (
              <p className="mt-4 text-sm text-marca">
                Está la documentación obligatoria completa.
              </p>
            )}
          </Panel>
        </aside>
      </div>
      )}
    </div>
  );
}
