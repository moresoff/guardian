import {
  AutenticidadBadge,
  ConsistenciaBadge,
  ExtraccionBadge,
  SeveridadBadge,
} from "@/components/estados";
import { Aviso, Badge, Panel } from "@/components/ui/primitivos";
import { DOCUMENTO_LABEL, formatFecha } from "@/lib/format";
import type { Discrepancia, Documento } from "@/lib/types";

/**
 * La tarjeta de un comprobante subido: qué documento es, qué se leyó de él y en
 * qué estado quedó.
 *
 * Los tres estados van juntos al pie y siempre los tres, en el mismo orden. Antes
 * colgaban del encabezado, y como cada documento mostraba una combinación
 * distinta, una lista de comprobantes se leía despareja. Abajo y rotulados se
 * leen como una tabla: el mismo renglón en todas las tarjetas.
 */
export function DocumentoCard({
  documento,
  discrepancias = [],
  /** Adentro del repositorio el tipo ya lo dice el título del modal. */
  conTitulo = true,
}: {
  documento: Documento;
  discrepancias?: Discrepancia[];
  conTitulo?: boolean;
}) {
  const sinResolver = discrepancias.filter((d) => !d.resuelta);

  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-borde p-5">
        {conTitulo ? (
          <h3 className="text-lg font-semibold tracking-tight">
            {DOCUMENTO_LABEL[documento.tipo]}
          </h3>
        ) : null}
        <p className={`text-sm text-tinta-suave ${conTitulo ? "mt-1" : ""}`}>
          <span className="codigo">{documento.nombreArchivo}</span> · subido el{" "}
          {formatFecha(documento.subidoAt)}
        </p>
        {!documento.tieneCapaTexto ? (
          <p className="mt-2 text-sm text-tinta-tenue">
            Escaneado sin capa de texto, así que se leyó con visión.
          </p>
        ) : null}
      </div>

      {documento.estadoExtraccion === "procesando" ? (
        <div className="p-5">
          <p className="text-sm text-tinta-suave">
            Leyendo el documento. Al ser un escaneo sin capa de texto, se procesa con visión
            y demora un poco más.
          </p>
        </div>
      ) : null}

      {documento.camposExtraidos.length > 0 ? (
        <div className="p-5">
          <p className="mb-4 rotulo text-tinta-tenue">Datos leídos del documento</p>
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {documento.camposExtraidos.map((c) => (
              <div key={c.campo}>
                <dt className="text-sm text-tinta-suave">{c.etiqueta}</dt>
                <dd className="codigo mt-1 font-medium">{c.valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {documento.controlesAritmeticos?.length ? (
        <div className="border-t border-borde bg-superficie-2 p-5">
          <p className="mb-1 rotulo text-tinta-tenue">Controles aritméticos</p>
          <p className="mb-3 text-sm text-tinta-suave">
            El documento imprime sus propios totales. Se recalculan y se comparan contra lo
            impreso: si no coinciden, algo se leyó mal o el documento está adulterado.
          </p>
          <ul className="space-y-2">
            {documento.controlesAritmeticos.map((c) => (
              <li
                key={c.etiqueta}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="text-tinta-suave">{c.etiqueta}</span>
                <span className="tabular flex items-center gap-2">
                  <span className="font-medium">{c.calculado}</span>
                  <span className="text-tinta-tenue">vs. {c.impreso}</span>
                  <Badge tono={c.coincide ? "ok" : "error"}>
                    {c.coincide ? "Coincide" : "No coincide"}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {sinResolver.length > 0 ? (
        <div className="border-t border-borde p-5">
          <p className="mb-3 rotulo text-tinta-tenue">Discrepancias con lo declarado</p>
          <ul className="space-y-3">
            {sinResolver.map((d) => (
              <li key={d.id} className="rounded-lg border border-borde p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{d.etiqueta}</p>
                  <SeveridadBadge severidad={d.severidad} />
                </div>
                <div className="tabular mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <span>
                    <span className="text-tinta-tenue">Declarado: </span>
                    <span className="font-medium">{d.valorDeclarado}</span>
                  </span>
                  <span>
                    <span className="text-tinta-tenue">En el documento: </span>
                    <span className="font-medium">{d.valorExtraido}</span>
                  </span>
                </div>
                <p className="mt-2 text-sm text-tinta-suave">{d.detalle}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {documento.cuve ? (
        <div className="border-t border-borde p-5">
          <Aviso
            tono={documento.estadoAutenticidad === "verificada" ? "ok" : "neutro"}
            titulo={`CUVE ${documento.cuve}`}
          >
            {documento.estadoAutenticidad === "verificada"
              ? "El código fue contrastado contra SENASA y el documento es auténtico."
              : "El Código Único de Validación Electrónica permite contrastar el documento contra SENASA, en senasa.gob.ar/vdc o al 0800-999-7362. Todavía sin verificar."}
          </Aviso>
        </div>
      ) : null}

      <div className="grid gap-4 border-t border-borde bg-superficie-2 p-5 sm:grid-cols-3">
        <EstadoDelDocumento etiqueta="Lectura">
          <ExtraccionBadge estado={documento.estadoExtraccion} />
        </EstadoDelDocumento>
        <EstadoDelDocumento etiqueta="Consistencia">
          <ConsistenciaBadge estado={documento.estadoConsistencia} breve />
        </EstadoDelDocumento>
        <EstadoDelDocumento etiqueta="Autenticidad">
          <AutenticidadBadge estado={documento.estadoAutenticidad} breve />
        </EstadoDelDocumento>
      </div>
    </Panel>
  );
}

function EstadoDelDocumento({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="rotulo mb-1.5 text-tinta-tenue">{etiqueta}</p>
      {children}
    </div>
  );
}
