import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Cuatro tonos y nada más. `ok` usa el verde de marca a propósito: que Guardian
 * apruebe algo y la identidad de Guardian son la misma afirmación.
 */
export type Tono = "neutro" | "marca" | "ok" | "alerta" | "error";

const TONO_BADGE: Record<Tono, string> = {
  neutro: "border-borde bg-superficie-2 text-tinta-suave",
  marca: "border-marca/20 bg-marca-suave text-marca",
  ok: "border-marca/20 bg-marca-suave text-marca",
  alerta: "border-alerta/25 bg-alerta-suave text-alerta",
  error: "border-error/25 bg-error-suave text-error",
};

const TONO_PUNTO: Record<Tono, string> = {
  neutro: "bg-tinta-tenue",
  marca: "bg-marca",
  ok: "bg-marca",
  alerta: "bg-alerta",
  error: "bg-error",
};

export function Badge({
  children,
  tono = "neutro",
  className = "",
}: {
  children: ReactNode;
  tono?: Tono;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-medium ${TONO_BADGE[tono]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Punto({ tono = "neutro" }: { tono?: Tono }) {
  return <span className={`size-1.5 rounded-full ${TONO_PUNTO[tono]}`} aria-hidden />;
}

/**
 * Tres niveles, porque no todo es una tarjeta:
 * - `plano`: agrupa sin separar. Para bloques de contenido dentro de una página.
 * - `contorno`: objeto discreto (un proyecto, un documento).
 * - `elevado`: lo único que la página quiere levantar por encima del resto.
 */
type Nivel = "plano" | "contorno" | "elevado";

const NIVEL: Record<Nivel, string> = {
  plano: "bg-transparent",
  contorno: "rounded-xl border border-borde bg-superficie shadow-[var(--sombra-baja)]",
  elevado: "rounded-xl border border-borde bg-superficie shadow-[var(--sombra-alta)]",
};

export function Panel({
  nivel = "contorno",
  className = "",
  children,
  ...props
}: ComponentProps<"div"> & { nivel?: Nivel }) {
  return (
    <div className={`${NIVEL[nivel]} ${className}`} {...props}>
      {children}
    </div>
  );
}

/** Sección separada por filete, sin caja: el recurso por defecto de la página. */
export function Seccion({
  titulo,
  descripcion,
  accion,
  children,
}: {
  titulo: string;
  descripcion?: ReactNode;
  accion?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-borde pt-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{titulo}</h2>
          {descripcion ? (
            <p className="mt-1 max-w-2xl text-sm text-tinta-suave">{descripcion}</p>
          ) : null}
        </div>
        {accion}
      </div>
      {children}
    </section>
  );
}

export function TituloBloque({
  children,
  descripcion,
  accion,
}: {
  children: ReactNode;
  descripcion?: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{children}</h2>
        {descripcion ? (
          <p className="mt-1 max-w-2xl text-sm text-tinta-suave">{descripcion}</p>
        ) : null}
      </div>
      {accion}
    </div>
  );
}

export function Dato({
  etiqueta,
  children,
  ayuda,
  codigo = false,
}: {
  etiqueta: string;
  children: ReactNode;
  ayuda?: string;
  /** Marca los valores que salen de un documento oficial. */
  codigo?: boolean;
}) {
  return (
    <div>
      <dt className="rotulo text-tinta-tenue">{etiqueta}</dt>
      <dd
        className={`mt-1 text-sm font-medium text-tinta ${codigo ? "codigo" : "tabular"}`}
      >
        {children}
      </dd>
      {ayuda ? <p className="mt-0.5 text-sm text-tinta-tenue">{ayuda}</p> : null}
    </div>
  );
}

const BOTON_VARIANTE = {
  primario: "border-transparent bg-marca text-marca-contraste hover:bg-marca-fuerte",
  // En reposo es neutro; al pasar por encima se tiñe del verde de marca.
  secundario:
    "border-borde-fuerte bg-superficie text-tinta hover:border-marca hover:bg-marca-suave hover:text-marca",
  sutil: "border-transparent bg-transparent text-tinta-suave hover:bg-superficie-2",
  peligro: "border-error/25 bg-error-suave text-error hover:brightness-95",
} as const;

type Variante = keyof typeof BOTON_VARIANTE;

const BOTON_BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-base font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45";

export function Boton({
  variante = "primario",
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: Variante }) {
  return (
    <button className={`${BOTON_BASE} ${BOTON_VARIANTE[variante]} ${className}`} {...props} />
  );
}

export function BotonLink({
  variante = "primario",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante }) {
  return (
    <Link className={`${BOTON_BASE} ${BOTON_VARIANTE[variante]} ${className}`} {...props} />
  );
}

export function Progreso({ valor, label }: { valor: number; label?: string }) {
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-superficie-2"
      role="progressbar"
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progreso de recaudación"}
    >
      {/*
        Se escala en vez de animar el ancho: `width` obliga al navegador a
        recalcular el layout en cada cuadro y `transform` lo resuelve el
        compositor.
      */}
      <div
        className="h-full w-full origin-left rounded-full bg-marca-viva transition-transform"
        style={{ transform: `scaleX(${Math.max(0, Math.min(100, valor)) / 100})` }}
      />
    </div>
  );
}

export function Vacio({
  titulo,
  children,
  accion,
}: {
  titulo: string;
  children?: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-borde-fuerte p-10 text-center">
      <p className="font-medium">{titulo}</p>
      {children ? (
        <p className="mx-auto mt-1.5 max-w-md text-sm text-tinta-suave">{children}</p>
      ) : null}
      {accion ? <div className="mt-5 flex justify-center">{accion}</div> : null}
    </div>
  );
}

/**
 * La severidad se codifica con un rótulo en versalita mono —el mismo recurso
 * tipográfico que el resto de la interfaz— y el fondo tintado. Sin franja lateral
 * de color: es un patrón demasiado visto y acá el sistema de tipos ya lo resuelve.
 */
const AVISO_ETIQUETA: Record<Tono, string | null> = {
  neutro: null,
  marca: null,
  ok: "Verificado",
  alerta: "Atención",
  error: "Problema",
};

export function Aviso({
  tono = "neutro",
  titulo,
  children,
}: {
  tono?: Tono;
  titulo?: string;
  children: ReactNode;
}) {
  const fondo: Record<Tono, string> = {
    neutro: "bg-superficie-2",
    marca: "bg-marca-suave",
    ok: "bg-marca-suave",
    alerta: "bg-alerta-suave",
    error: "bg-error-suave",
  };
  const acento: Record<Tono, string> = {
    neutro: "text-tinta-tenue",
    marca: "text-marca",
    ok: "text-marca",
    alerta: "text-alerta",
    error: "text-error",
  };
  const etiqueta = AVISO_ETIQUETA[tono];

  return (
    <div className={`rounded-lg px-4 py-3.5 text-sm ${fondo[tono]}`}>
      {etiqueta ? (
        <p className={`rotulo mb-1.5 ${acento[tono]}`}>{etiqueta}</p>
      ) : null}
      {titulo ? <p className="font-semibold text-tinta">{titulo}</p> : null}
      <div className={`text-tinta-suave ${titulo || etiqueta ? "mt-1" : ""}`}>
        {children}
      </div>
    </div>
  );
}

/**
 * Placeholder de carga. No es un spinner: dibuja la forma que va a ocupar el
 * contenido, así la página no salta cuando llega. La animación la apaga sola
 * `prefers-reduced-motion` desde globals.css.
 */
export function Esqueleto({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-superficie-2 ${className}`}
      aria-hidden
    />
  );
}

/** Bloque de carga con el encabezado de página y N tarjetas del alto habitual. */
export function EsqueletoLista({ filas = 3 }: { filas?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Cargando">
      {Array.from({ length: filas }).map((_, i) => (
        <Panel key={i} className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="w-full max-w-sm space-y-2.5">
              <Esqueleto className="h-4 w-3/4" />
              <Esqueleto className="h-3 w-full" />
            </div>
            <Esqueleto className="h-5 w-24 rounded-full" />
          </div>
          <Esqueleto className="mt-5 h-1.5 w-full max-w-sm rounded-full" />
        </Panel>
      ))}
    </div>
  );
}

/** Encabezado de página en carga: título y bajada. */
export function EsqueletoTitulo() {
  return (
    <div className="mb-6 space-y-2.5">
      <Esqueleto className="h-7 w-56" />
      <Esqueleto className="h-3.5 w-80 max-w-full" />
    </div>
  );
}
