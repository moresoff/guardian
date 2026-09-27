import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentoCard } from "@/components/documento-card";
import { EstadoProyectoBadge } from "@/components/estados";
import { DatoGarantia } from "@/components/garantia";
import {
  Aviso,
  Badge,
  Boton,
  Panel,
  Dato,
  TituloBloque,
} from "@/components/ui/primitivos";
import {
  getDiscrepanciasDeProyecto,
  getDocumentosVigentesDeProyecto,
  getGarantia,
  getProductor,
  getProyecto,
} from "@/lib/data";
import {
  DOCUMENTO_LABEL,
  POSESION_LABEL,
  modalidadLabel,
  documentosRequeridos,
  formatArs,
  formatNum,
  formatPct,
} from "@/lib/format";
import { puedePublicarse } from "@/lib/proyecto";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const proyecto = await getProyecto(id);
  return {
    title: proyecto
      ? `Validar: ${proyecto.titulo} — Guardian`
      : "Proyecto no encontrado — Guardian",
  };
}

export default async function ValidacionProyecto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proyecto = await getProyecto(id);
  if (!proyecto) notFound();

  const productor = await getProductor(proyecto.productorId);
  const garantia = await getGarantia(proyecto.garantiaId);
  const documentos = await getDocumentosVigentesDeProyecto(
    proyecto.id,
    proyecto.productorId,
  );
  const discrepancias = await getDiscrepanciasDeProyecto(proyecto.id);
  const requeridos = documentosRequeridos(proyecto.tipoPosesion);
  const cargados = new Set(documentos.map((d) => d.tipo));
  const faltantes = requeridos.filter((t) => !cargados.has(t));
  const sinResolver = discrepancias.filter((d) => !d.resuelta);
  const sinVerificar = documentos.filter(
    (d) => d.estadoAutenticidad === "sin_verificar",
  );

  const bloqueantes = faltantes.length + sinResolver.length + sinVerificar.length;
  const publicabilidad = puedePublicarse(proyecto);

  return (
    <div>
      <Link href="/admin" className="inline-flex min-h-11 items-center text-sm text-tinta-suave hover:text-marca">
        ← Volver a la cola
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-tinta-tenue">
            {productor?.razonSocial} · RENSPA <span className="codigo">{productor?.renspa}</span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{proyecto.titulo}</h1>
        </div>
        <EstadoProyectoBadge estado={proyecto.estado} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Panel className="p-5">
            <TituloBloque descripcion="Lo que el productor declaró al publicar. Es contra esto que se comparan los documentos.">
              Declarado por el productor
            </TituloBloque>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              <Dato etiqueta="Cabezas">{formatNum(proyecto.cabezas)}</Dato>
              <Dato etiqueta="Categoría">{proyecto.categoria}</Dato>
              <Dato etiqueta="Modalidad">{modalidadLabel(proyecto.modalidad)}</Dato>
              <Dato etiqueta="Posesión">{POSESION_LABEL[proyecto.tipoPosesion]}</Dato>
              <Dato etiqueta="Monto">{formatArs(proyecto.montoObjetivoArs)}</Dato>
              <Dato etiqueta="Plazo">{proyecto.plazoDias} días</Dato>
              <Dato etiqueta="Rendimiento esperado">
                {formatPct(proyecto.rendimientoEsperadoPct)}
              </Dato>
              <DatoGarantia garantia={garantia} />
              <Dato etiqueta="Seguro">
                {proyecto.tieneSeguro ? "Contratado" : "Sin seguro"}
              </Dato>
            </dl>
          </Panel>

          <div>
            <TituloBloque descripcion="Cada documento con lo que la lectura automática extrajo y los cruces que ya corrieron.">
              Documentación presentada
            </TituloBloque>
            <div className="space-y-4">
              {documentos.map((d) => (
                <div key={d.id}>
                  <DocumentoCard
                    documento={d}
                    discrepancias={discrepancias.filter((x) => x.documentoId === d.id)}
                  />
                  <div className="mt-2 flex flex-wrap justify-end gap-2">
                    <Boton variante="secundario">Verificar autenticidad</Boton>
                    <Boton variante="peligro">Rechazar documento</Boton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Panel className="p-5">
            <TituloBloque>Checklist de publicación</TituloBloque>

            <ul className="space-y-2.5 text-sm">
              <Item
                ok={faltantes.length === 0}
                texto={
                  faltantes.length === 0
                    ? "Documentación obligatoria completa"
                    : `Faltan ${faltantes.length} documentos obligatorios`
                }
              />
              <Item
                ok={sinResolver.length === 0}
                texto={
                  sinResolver.length === 0
                    ? "Sin discrepancias abiertas"
                    : `${sinResolver.length} discrepancias sin resolver`
                }
              />
              <Item
                ok={sinVerificar.length === 0}
                texto={
                  sinVerificar.length === 0
                    ? "Autenticidad verificada en todos los documentos"
                    : `${sinVerificar.length} documentos sin verificar autenticidad`
                }
              />
            </ul>

            {faltantes.length > 0 ? (
              <div className="mt-4 border-t border-borde pt-4">
                <p className="mb-2 rotulo text-tinta-tenue">
                  Documentos faltantes
                </p>
                <ul className="space-y-1.5">
                  {faltantes.map((t) => (
                    <li key={t} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-tinta-suave">{DOCUMENTO_LABEL[t]}</span>
                      <Badge>Falta</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Publicar no depende solo de los documentos: si falta el reparto,
                la tasa o la modalidad, el colaborador estaría decidiendo sobre
                condiciones que todavía no existen. */}
            {!publicabilidad.puede ? (
              <div className="mt-4 border-t border-borde pt-4">
                <p className="mb-2 rotulo text-tinta-tenue">Condiciones sin definir</p>
                <ul className="space-y-1.5 text-sm text-tinta-suave">
                  {publicabilidad.motivos.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-5 space-y-2 border-t border-borde pt-4">
              <Boton className="w-full" disabled={bloqueantes > 0 || !publicabilidad.puede}>
                Publicar proyecto
              </Boton>
              <Boton variante="peligro" className="w-full">
                Rechazar proyecto
              </Boton>
            </div>

            {bloqueantes > 0 ? (
              <p className="mt-3 text-sm text-tinta-tenue">
                Quedan {bloqueantes} puntos por resolver antes de poder publicar.
              </p>
            ) : null}
            {!publicabilidad.puede ? (
              <p className="mt-2 text-sm text-tinta-tenue">
                Y las condiciones económicas del proyecto tienen que quedar definidas.
              </p>
            ) : null}
          </Panel>

          <Aviso tono="alerta" titulo="Lo que la lectura automática no resuelve">
            Que los datos de un documento cierren entre sí no prueba que haya sido emitido por
            el organismo. La autenticidad del DT-e se confirma con el CUVE ante SENASA, y esa
            confirmación es responsabilidad de quien valida.
          </Aviso>
        </aside>
      </div>
    </div>
  );
}

function Item({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-sm font-semibold ${
          ok ? "bg-marca-suave text-marca" : "bg-alerta-suave text-alerta"
        }`}
        aria-hidden
      >
        {ok ? "✓" : "!"}
      </span>
      <span className={ok ? "text-tinta-suave" : "font-medium"}>{texto}</span>
    </li>
  );
}
