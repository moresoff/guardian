import { Aviso, Badge, Dato, Panel, TituloBloque } from "@/components/ui/primitivos";
import {
  ESTADO_GARANTIA_LABEL,
  GARANTIA_DESCRIPCION,
  GARANTIA_LABEL,
  formatFecha,
  formatArs,
} from "@/lib/format";
import type { Garantia } from "@/lib/types";

/**
 * La garantía del proyecto.
 *
 * Es lo que se ejecuta si el ciclo no se cumple, y no hay que confundirla con la
 * documentación del lote: el DT-e y el romaneo dicen qué hay y de quién es, y con
 * eso no se cobra nada. Por eso la garantía se muestra aparte del respaldo
 * documental y con su propia valuación.
 */
export function DatoGarantia({ garantia }: { garantia?: Garantia }) {
  if (!garantia) {
    return (
      <Dato etiqueta="Garantía" ayuda="Todavía sin definir.">
        —
      </Dato>
    );
  }
  return (
    <Dato
      etiqueta="Garantía"
      ayuda={`${garantia.identificacion} · valuada en ${formatArs(garantia.valuacionArs)}`}
    >
      {GARANTIA_LABEL[garantia.tipo]}
    </Dato>
  );
}

const TONO_GARANTIA = {
  vigente: "ok",
  sin_verificar: "alerta",
  vencida: "error",
} as const;

/** El detalle de la garantía, para la ficha que el colaborador lee antes de entrar. */
export function BloqueGarantia({ garantia }: { garantia?: Garantia }) {
  if (!garantia) {
    return (
      <Panel className="p-5">
        <TituloBloque>La garantía</TituloBloque>
        <Aviso tono="alerta" titulo="Este proyecto todavía no declaró garantía">
          Sin garantía constituida, lo único que respalda el capital es el lote y el
          resultado del ciclo.
        </Aviso>
      </Panel>
    );
  }

  return (
    <Panel className="p-5">
      <TituloBloque descripcion="Lo que se ejecuta si el productor no cumple. Es otra cosa que la documentación del lote: los comprobantes muestran qué hay y de quién es, y con eso no se cobra nada.">
        La garantía
      </TituloBloque>

      <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        <Dato etiqueta="Tipo" ayuda={GARANTIA_DESCRIPCION[garantia.tipo]}>
          {GARANTIA_LABEL[garantia.tipo]}
        </Dato>
        <Dato etiqueta="Bien afectado" codigo>
          {garantia.identificacion}
        </Dato>
        <Dato etiqueta="Valuación">{formatArs(garantia.valuacionArs)}</Dato>
        <Dato etiqueta="Vigencia">Hasta el {formatFecha(garantia.vigenciaHasta)}</Dato>
      </dl>

      <p className="mt-5 text-sm text-tinta-suave">{garantia.descripcion}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tono={TONO_GARANTIA[garantia.estado]}>
          {ESTADO_GARANTIA_LABEL[garantia.estado]}
        </Badge>
        <span className="text-sm text-tinta-suave">
          Respalda hasta {garantia.cupoProyectos}{" "}
          {garantia.cupoProyectos === 1 ? "proyecto" : "proyectos"} a la vez.
        </span>
      </div>

      {garantia.estado === "sin_verificar" ? (
        <div className="mt-4">
          <Aviso tono="alerta" titulo="La garantía todavía no fue verificada">
            Guardian no contrastó el instrumento contra el registro. Hasta que lo haga, la
            garantía está declarada pero no comprobada.
          </Aviso>
        </div>
      ) : null}
    </Panel>
  );
}
