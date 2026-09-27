import { Badge, Punto, type Tono } from "@/components/ui/primitivos";
import { ESTADO_LABEL } from "@/lib/format";
import type {
  EstadoAutenticidad,
  EstadoConsistencia,
  EstadoExtraccion,
  EstadoProyecto,
  Severidad,
} from "@/lib/types";

/**
 * Cuatro tonos alcanzan porque las categorías reales son cuatro: algo pide
 * atención, algo está mal, algo está vivo, o algo está inerte. Un color por
 * estado sería decoración, no información.
 */
const TONO_ESTADO: Record<EstadoProyecto, Tono> = {
  borrador: "neutro",
  en_validacion: "alerta",
  abierto: "marca",
  fondeado: "marca",
  en_curso: "marca",
  cerrado: "neutro",
  rechazado: "error",
};

export function EstadoProyectoBadge({ estado }: { estado: EstadoProyecto }) {
  const tono = TONO_ESTADO[estado];
  return (
    <Badge tono={tono}>
      <Punto tono={tono} />
      {ESTADO_LABEL[estado]}
    </Badge>
  );
}

export function ExtraccionBadge({ estado }: { estado: EstadoExtraccion }) {
  switch (estado) {
    case "pendiente":
      return <Badge tono="neutro">En cola</Badge>;
    case "procesando":
      return <Badge tono="neutro">Procesando</Badge>;
    case "ok":
      return <Badge tono="neutro">Datos extraídos</Badge>;
    case "error":
      return <Badge tono="error">Error de lectura</Badge>;
  }
}

/**
 * Consistencia y autenticidad son dos afirmaciones distintas y se muestran por
 * separado a propósito: que los datos cierren entre sí no prueba que el papel
 * sea auténtico. Un solo tilde verde para las dos le mentiría al colaborador.
 *
 * `breve` es para cuando la insignia cuelga de un rótulo que ya dice de qué
 * habla; sin eso queda "Autenticidad · Autenticidad sin verificar" y hay que
 * leer dos veces lo mismo. Suelta, la insignia nombra siempre su dimensión.
 */
export function ConsistenciaBadge({
  estado,
  breve = false,
}: {
  estado: EstadoConsistencia;
  breve?: boolean;
}) {
  switch (estado) {
    case "sin_revisar":
      return (
        <Badge tono="neutro">{breve ? "Sin revisar" : "Consistencia sin revisar"}</Badge>
      );
    case "consistente":
      return <Badge tono="ok">Datos consistentes</Badge>;
    case "con_discrepancias":
      return <Badge tono="alerta">Con discrepancias</Badge>;
  }
}

export function AutenticidadBadge({
  estado,
  breve = false,
}: {
  estado: EstadoAutenticidad;
  breve?: boolean;
}) {
  switch (estado) {
    case "sin_verificar":
      return (
        <Badge tono="neutro">{breve ? "Sin verificar" : "Autenticidad sin verificar"}</Badge>
      );
    case "verificada":
      return <Badge tono="ok">{breve ? "Verificada" : "Autenticidad verificada"}</Badge>;
    case "rechazada":
      return <Badge tono="error">{breve ? "Rechazada" : "Autenticidad rechazada"}</Badge>;
  }
}

export function SeveridadBadge({ severidad }: { severidad: Severidad }) {
  const tono = severidad === "alta" ? "error" : severidad === "media" ? "alerta" : "neutro";
  const label = severidad === "alta" ? "Alta" : severidad === "media" ? "Media" : "Baja";
  return (
    <Badge tono={tono}>
      <Punto tono={tono} />
      {label}
    </Badge>
  );
}
