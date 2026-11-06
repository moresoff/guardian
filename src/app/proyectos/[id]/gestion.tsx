import Link from "next/link";
import { CICLOS } from "@/lib/ciclos";
import type { ReactNode } from "react";
import type { Proyecto } from "@/lib/types";
import { DocumentoCard } from "@/components/documento-card";
import { EstadoProyectoBadge } from "@/components/estados";
import { DatoGarantia } from "@/components/garantia";
import { Seguimiento } from "@/components/seguimiento";
import { FichaTecnica } from "./ficha-tecnica";
import { RegistrarPesada } from "./registrar-pesada";
import { SubirRespaldo } from "./subir-respaldo";
import {
  Aviso,
  Badge,
  Dato,
  Progreso,
  TituloBloque,
} from "@/components/ui/primitivos";
import {
  getDiscrepanciasDeProyecto,
  getDocumentosVigentesDeProyecto,
  getGarantia,
  getGarantiasConUso,
  getSeguimientoDeProyecto,
} from "@/lib/data";
import {
  DOCUMENTO_LABEL,
  modalidadLabel,
  GARANTIA_LABEL,
  POSESION_LABEL,
  documentosRequeridos,
  formatArs,
  formatNum,
  formatPct,
  porcentajeRecaudado,
} from "@/lib/format";

/**
 * Lo que ve el productor cuando abre su propio proyecto: la ficha técnica si
 * todavía es un borrador, y después, en una sola columna y en este orden, la
 * plata, cómo viene el ciclo, los papeles y lo que declaró. La garantía y las
 * condiciones de participación quedan en «Cómo lo ve el colaborador». Vive en la misma dirección que la ficha del catálogo; las
 * pestañas (que llegan por `pestanas`) alternan entre las dos miradas.
 */
export async function GestionProyecto({
  proyecto,
  pestanas,
}: {
  proyecto: Proyecto;
  pestanas?: ReactNode;
}) {

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
      <Link href="/productor" className="inline-flex min-h-11 items-center text-sm text-tinta-suave hover:text-marca">
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

      {pestanas ? <div className="mt-4">{pestanas}</div> : null}

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
      <div className="mt-8 max-w-3xl space-y-10">
        {proyecto.estado !== "en_validacion" ? (
          <section>
            <TituloBloque>La plata del proyecto</TituloBloque>
            <p className="tabular text-lg">
              <span className="font-semibold">{formatArs(proyecto.montoRecaudadoArs)}</span>
              <span className="text-tinta-suave">
                {" "}
                juntados de {formatArs(proyecto.montoObjetivoArs)}
              </span>
            </p>
            <div className="mt-3">
              <Progreso
                valor={porcentajeRecaudado(
                  proyecto.montoRecaudadoArs,
                  proyecto.montoObjetivoArs,
                )}
                label={`Juntado: ${formatArs(proyecto.montoRecaudadoArs)} de ${formatArs(proyecto.montoObjetivoArs)}`}
              />
            </div>
            <p className="tabular mt-3 text-tinta-suave">
              Ya liberado a tu favor: {formatArs(proyecto.montoLiberadoArs)}. El resto
              queda en la cuenta del proyecto y sale contra los papeles de cada etapa.
            </p>
          </section>
        ) : null}

        {conSeguimiento ? (
          <section className="border-t border-borde pt-8">
            <TituloBloque
              descripcion="Las pesadas del lote. El colaborador ve exactamente lo mismo."
              accion={
                proyecto.estado === "cerrado" ? undefined : (
                  <RegistrarPesada
                    cabezasVivas={ultima?.cabezas ?? proyecto.cabezas}
                    pesoAnteriorKg={ultima?.pesoPromedioKg ?? proyecto.pesoEntradaKg}
                  />
                )
              }
            >
              {proyecto.estado === "cerrado" ? "Cómo fue el ciclo" : "Cómo viene el ciclo"}
            </TituloBloque>
            <Seguimiento proyecto={proyecto} registros={registros} />
          </section>
        ) : null}

        <section className="border-t border-borde pt-8">
          <TituloBloque descripcion="Guardian lee cada papel al subirlo y lo compara con lo que cargaste.">
            Tus papeles
          </TituloBloque>

          <ul className="mb-6 space-y-2.5">
            {requeridos.map((t) => {
              const listo = cargados.has(t);
              return (
                <li key={t} className="flex items-center justify-between gap-3">
                  <span className={listo ? "" : "text-tinta-suave"}>
                    {DOCUMENTO_LABEL[t]}
                  </span>
                  <Badge tono={listo ? "ok" : "neutro"}>
                    {listo ? "Subido" : "Falta"}
                  </Badge>
                </li>
              );
            })}
          </ul>

          {documentos.length > 0 ? (
            <div className="space-y-4">
              {documentos.map((d) => (
                <DocumentoCard
                  key={d.id}
                  documento={d}
                  discrepancias={discrepancias.filter((x) => x.documentoId === d.id)}
                />
              ))}
            </div>
          ) : null}

          <div className={documentos.length > 0 ? "mt-6 border-t border-borde pt-6" : ""}>
            <SubirRespaldo faltantes={faltantes} cabezas={proyecto.cabezas} />
          </div>
        </section>

        <section className="border-t border-borde pt-8">
          <TituloBloque>Lo que cargaste al publicar</TituloBloque>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
            <Dato etiqueta="Cabezas">{formatNum(proyecto.cabezas)}</Dato>
            <Dato etiqueta="Categoría">{proyecto.categoria}</Dato>
            <Dato etiqueta="Plazo">{proyecto.plazoDias} días</Dato>
            <Dato etiqueta="Peso de entrada">{proyecto.pesoEntradaKg} kg</Dato>
            <Dato etiqueta="Peso objetivo">{proyecto.pesoSalidaObjetivoKg} kg</Dato>
            <Dato
              etiqueta="Rentabilidad anual estimada"
              ayuda="Estimación del modelo para este tipo de ciclo. No es un compromiso."
            >
              {formatPct(CICLOS[proyecto.sistemaProductivo].rentabilidadAnualProductorPct)}
            </Dato>
            <DatoGarantia garantia={garantia} />
            <Dato etiqueta="Seguro">
              {proyecto.tieneSeguro ? "Contratado" : "Sin seguro"}
            </Dato>
            {proyecto.destinoDetalle ? (
              <div className="col-span-2 sm:col-span-3">
                <Dato etiqueta="En qué se usa">{proyecto.destinoDetalle}</Dato>
              </div>
            ) : null}
          </dl>
        </section>
      </div>
      )}
    </div>
  );
}
