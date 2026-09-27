import type { Aporte, Modalidad, Proyecto } from "@/lib/types";

/**
 * Las reglas de un proyecto, en un solo lugar.
 *
 * Están acá y no en cada pantalla porque son las que deciden si algo se publica,
 * si se puede liquidar y qué se le muestra al colaborador. Repetidas en la ficha, en
 * el catálogo y en el alta terminan diciendo cosas distintas.
 *
 * Ninguna inventa un parámetro que no esté pactado: cuando falta, lo dice y
 * frena, que es lo contrario de completar con un supuesto.
 */

/** Qué le falta a un proyecto para tener condiciones económicas calculables. */
export function condicionesPendientes(proyecto: Proyecto): string[] {
  const faltan: string[] = [];

  if (proyecto.modalidad === null) {
    faltan.push(
      "La modalidad no está determinada: sin eso no se sabe si el colaborador participa del resultado o cobra una tasa",
    );
    return faltan;
  }

  if (proyecto.modalidad === "compra_engorde") {
    const p = proyecto.condiciones.participacion;
    if (!p) faltan.push("Falta el reparto del resultado entre colaboradores y productor");
    else if (p.colaboradoresPct === null || p.productorPct === null) {
      faltan.push("El reparto del resultado todavía no está pactado");
    }
  }

  if (proyecto.modalidad === "capital_trabajo") {
    const t = proyecto.condiciones.tasa;
    if (!t) faltan.push("Falta la tasa pactada y su calendario");
    else {
      if (t.tasaPct === null) faltan.push("La tasa todavía no está pactada");
      // Una tasa sin base temporal no se puede calcular ni comparar contra otra.
      if (t.base === null) faltan.push("Falta la base de la tasa: anual, mensual o del ciclo");
    }
  }

  return faltan;
}

export interface Publicabilidad {
  puede: boolean;
  motivos: string[];
}

/**
 * Si el proyecto puede salir al catálogo. Publicar no es un trámite de
 * presentación: mientras falte algo de esto, el colaborador estaría decidiendo con
 * información que todavía no existe.
 */
export function puedePublicarse(proyecto: Proyecto): Publicabilidad {
  const motivos = [...condicionesPendientes(proyecto)];

  if (proyecto.montoObjetivoArs <= 0) {
    motivos.push("Falta el monto objetivo");
  }
  if (proyecto.montoMinimoInicioArs === null) {
    motivos.push("Falta el mínimo con el que el ciclo puede arrancar");
  } else if (proyecto.montoMinimoInicioArs > proyecto.montoObjetivoArs) {
    motivos.push("El mínimo de inicio no puede ser mayor que el objetivo");
  }

  return { puede: motivos.length === 0, motivos };
}

/** Lo que el colaborador recibe, dicho como corresponde a cada modalidad. */
export function retornoDelProyecto(proyecto: Proyecto): {
  etiqueta: string;
  valor: string;
  /** Si el número es una estimación y no una obligación contractual. */
  esProyeccion: boolean;
} {
  if (proyecto.modalidad === "capital_trabajo") {
    const t = proyecto.condiciones.tasa;
    const base =
      t?.base === "anual"
        ? "anual"
        : t?.base === "mensual"
          ? "mensual"
          : t?.base === "ciclo"
            ? "del ciclo"
            : null;
    return {
      etiqueta: "Tasa contractual",
      valor:
        t?.tasaPct !== null && t?.tasaPct !== undefined && base !== null
          ? `${t.tasaPct} % ${base}`
          : "Pendiente de definición",
      esProyeccion: false,
    };
  }

  if (proyecto.modalidad === "compra_engorde") {
    const p = proyecto.condiciones.participacion;
    return {
      etiqueta: "Participación en el resultado",
      valor:
        p?.colaboradoresPct !== null && p?.colaboradoresPct !== undefined
          ? `${p.colaboradoresPct} % del resultado`
          : "Pendiente de definición",
      esProyeccion: true,
    };
  }

  return {
    etiqueta: "Condiciones",
    valor: "Pendientes de definición",
    esProyeccion: true,
  };
}

export type EstadoFondeo = "pendiente" | "parcial" | "minimo_alcanzado" | "objetivo_alcanzado";

export interface Fondeo {
  /** Lo que el banco acreditó, que es lo único que cuenta como recaudado. */
  acreditadoArs: number;
  /** Lo adherido y todavía no acreditado. Se muestra aparte, nunca sumado. */
  comprometidoSinAcreditarArs: number;
  estado: EstadoFondeo;
  porcentaje: number;
}

/**
 * El fondeo de un proyecto a partir de los aportes.
 *
 * El porcentaje recaudado sale de lo acreditado y no de lo prometido: una
 * adhesión sin transferencia es una intención, y mostrarla como capital haría
 * que el proyecto parezca más fondeado de lo que está.
 */
export function calcularFondeo(proyecto: Proyecto, aportes: Aporte[]): Fondeo {
  const acreditadoArs = aportes.reduce((a, x) => a + x.montoAcreditadoArs, 0);
  const comprometidoSinAcreditarArs = aportes.reduce(
    (a, x) => a + Math.max(0, x.montoComprometidoArs - x.montoAcreditadoArs),
    0,
  );

  const objetivo = proyecto.montoObjetivoArs;
  const minimo = proyecto.montoMinimoInicioArs;

  let estado: EstadoFondeo = "pendiente";
  if (objetivo > 0 && acreditadoArs >= objetivo) estado = "objetivo_alcanzado";
  else if (minimo !== null && acreditadoArs >= minimo) estado = "minimo_alcanzado";
  else if (acreditadoArs > 0) estado = "parcial";

  return {
    acreditadoArs,
    comprometidoSinAcreditarArs,
    estado,
    porcentaje: objetivo > 0 ? Math.min(100, (acreditadoArs / objetivo) * 100) : 0,
  };
}

export const FONDEO_LABEL: Record<EstadoFondeo, string> = {
  pendiente: "Sin aportes acreditados",
  parcial: "Fondeo parcial",
  minimo_alcanzado: "Mínimo alcanzado",
  objetivo_alcanzado: "Objetivo alcanzado",
};

/** Si una operación está frenada, y por qué. */
export function restriccionDe(
  proyecto: Proyecto,
  alcance: "adhesiones" | "desembolsos",
) {
  return proyecto.restricciones?.find((r) => r.alcance === alcance);
}

/**
 * Si el colaborador puede adherir hoy. Alcanzar el objetivo también cierra la
 * puerta: de ahí en más el capital que entre no tiene dónde aplicarse.
 */
export function puedeAdherirse(
  proyecto: Proyecto,
  fondeo: Fondeo,
): { puede: boolean; motivo?: string } {
  const frenado = restriccionDe(proyecto, "adhesiones");
  if (frenado) return { puede: false, motivo: frenado.motivo };
  if (proyecto.estado !== "abierto") {
    return { puede: false, motivo: "El proyecto no está abierto a participación." };
  }
  if (fondeo.estado === "objetivo_alcanzado") {
    return { puede: false, motivo: "El objetivo ya está cubierto." };
  }
  const pendientes = condicionesPendientes(proyecto);
  if (pendientes.length > 0) {
    return { puede: false, motivo: "El proyecto tiene condiciones pendientes de definición." };
  }
  return { puede: true };
}

/** Las modalidades, en el orden en que se muestran en los filtros. */
export const MODALIDADES: Modalidad[] = ["compra_engorde", "capital_trabajo"];

/** Las comisiones que todavía no tienen porcentaje: sin eso no se liquida. */
export function comisionesPendientes(proyecto: Proyecto): string[] {
  return proyecto.condiciones.comisiones
    .filter((c) => c.porcentaje === null)
    .map((c) => `${c.concepto}: falta el porcentaje y la base`);
}

/**
 * Si el ciclo se puede liquidar. Es una etapa distinta de la publicación: un
 * proyecto puede salir al catálogo con el reparto pactado y recién al cierre
 * descubrirse que nadie definió qué cobra Guardian. Mejor que aparezca acá y no
 * en el momento de repartir.
 */
export function puedeLiquidarse(proyecto: Proyecto): Publicabilidad {
  const motivos = [...condicionesPendientes(proyecto), ...comisionesPendientes(proyecto)];
  if (proyecto.condiciones.comisiones.length === 0) {
    motivos.push("No hay comisiones definidas para este proyecto");
  }
  return { puede: motivos.length === 0, motivos };
}

/**
 * Lo que las comisiones se llevan, en pesos, sobre el capital del proyecto.
 *
 * Las que se calculan sobre el resultado quedan afuera: el resultado no existe
 * hasta que el ciclo cierra, y sumarlas acá sería inventar el número que
 * justamente todavía no se sabe.
 */
export function comisionesSobreCapital(proyecto: Proyecto): number | null {
  const sobreCapital = proyecto.condiciones.comisiones.filter(
    (c) => !c.base.toLowerCase().includes("resultado"),
  );
  if (sobreCapital.some((c) => c.porcentaje === null)) return null;
  const pct = sobreCapital.reduce((a, c) => a + (c.porcentaje ?? 0), 0);
  return Math.round((proyecto.montoObjetivoArs * pct) / 100);
}

/**
 * El mismo retorno que la ficha, en dos palabras, para una tarjeta del catálogo.
 * Sale de `retornoDelProyecto` y no de las condiciones directamente: la regla de
 * qué retorno corresponde a cada modalidad vive en un solo lugar.
 */
export function retornoCompacto(proyecto: Proyecto): {
  etiqueta: string;
  valor: string;
} {
  const r = retornoDelProyecto(proyecto);

  if (proyecto.modalidad === null) {
    return { etiqueta: "Condiciones", valor: "Sin definir" };
  }

  return {
    etiqueta: proyecto.modalidad === "capital_trabajo" ? "Tasa" : "Participación",
    valor: r.valor.replace(" del resultado", "").replace("Pendiente de definición", "—"),
  };
}
