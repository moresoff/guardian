"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

type Lado = "productor" | "colaborador";

interface Paso {
  titulo: string;
  texto: string;
  /** La pantalla donde está lo que se señala. */
  href: string;
  /**
   * Qué se ilumina en esa pantalla. Por defecto, el encabezado de la página
   * (el padre del `h1`). Si no se encuentra, el paso se muestra igual, sin
   * iluminar nada, en vez de trabarse.
   */
  objetivo?: string;
}

/**
 * Qué hay que cargar y dónde, en el orden en que conviene hacerlo. Cada paso
 * ilumina la parte real de la pantalla real: el recorrido no reemplaza la
 * aplicación, la señala.
 */
const PASOS: Record<Lado, Paso[]> = {
  productor: [
    {
      titulo: "Tu panel",
      texto: "Acá aparecen tus proyectos y en qué estado está cada uno: borrador, en revisión, abierto o en curso.",
      href: "/productor",
    },
    {
      titulo: "Cargá tu establecimiento",
      texto: "RENSPA, CUIT del titular, provincia y sistema productivo. Se carga una vez y sirve para todos tus ciclos.",
      href: "/productor/establecimiento",
    },
    {
      titulo: "Subí la documentación",
      texto: "RENSPA, DT-e, listado de caravanas y boleto de compra-venta. Guardian los cruza con lo que declarás y te avisa si algo no cierra.",
      href: "/productor/establecimiento?tab=documentos",
    },
    {
      titulo: "Armá tu proyecto",
      texto: "Elegís el tipo de ciclo —feedlot puro, mixto o pastura pura— y cargás el lote: cabezas, categoría, peso de entrada, y qué necesitás para el ciclo.",
      href: "/productor/proyectos/nuevo",
    },
    {
      titulo: "Validación y seguimiento",
      texto: "Guardian revisa en 24 a 72 horas. Con el ciclo en marcha cargás pesadas y gastos; al cierre, el romaneo define el resultado. Todo eso lo seguís desde Mis proyectos.",
      href: "/productor",
      objetivo: 'nav[aria-label="Secciones"]',
    },
  ],
  colaborador: [
    {
      titulo: "Elegí un proyecto",
      texto: "Cada uno es un lote concreto, con su establecimiento, su RENSPA y el estado de validación a la vista.",
      href: "/proyectos",
    },
    {
      titulo: "Entendé el tipo de ciclo",
      texto: "Feedlot puro, mixto o pastura pura. Cada tipo tiene su propio plazo y su propio reparto, que se detallan en la ficha de cada proyecto.",
      href: "/proyectos",
      objetivo: "main article > div:first-child",
    },
    {
      titulo: "Leé la ficha y participá",
      texto: "Presupuesto, cronograma y quién soporta la mortandad. Si querés sumarte, aceptás las condiciones y hacés tu aporte: cuenta cuando el banco lo acredita.",
      href: "/proyectos/pry-2",
      objetivo: "main header",
    },
    {
      titulo: "Seguí tu participación",
      texto: "En tu cartera ves tus aportes, lo pendiente y el avance de cada ciclo hasta la faena.",
      href: "/colaborador/cartera",
    },
    {
      titulo: "Completá tu perfil",
      texto: "La cuenta donde querés recibir lo que te corresponda y tus datos de contacto.",
      href: "/colaborador/cartera?tab=datos",
    },
  ],
};

const CLAVE = "guardian:recorrido";

interface Estado {
  lado: Lado;
  paso: number;
}

const oyentes = new Set<() => void>();

/** La guía vive en localStorage; useSyncExternalStore la lee sin efectos de más. */
const crudo = (): string | null => {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
};

const suscribir = (aviso: () => void) => {
  oyentes.add(aviso);
  window.addEventListener("storage", aviso);
  return () => {
    oyentes.delete(aviso);
    window.removeEventListener("storage", aviso);
  };
};

const sinGuia = () => null;

const interpretar = (v: string | null): Estado | null => {
  try {
    const e = JSON.parse(v ?? "null");
    return e && (e.lado === "productor" || e.lado === "colaborador") ? e : null;
  } catch {
    return null;
  }
};

const guardar = (e: Estado | null) => {
  try {
    if (e) localStorage.setItem(CLAVE, JSON.stringify(e));
    else localStorage.removeItem(CLAVE);
  } catch {
    // Sin almacenamiento el recorrido no se acuerda, pero la app sigue andando.
  }
  oyentes.forEach((aviso) => aviso());
};

/** Evento para volver a abrir el recorrido desde cualquier botón. */
export const ABRIR_RECORRIDO = "guardian:abrir-recorrido";

interface Caja {
  top: number;
  left: number;
  width: number;
  height: number;
}

const MARGEN = 16;
const AIRE = 8;

function buscarObjetivo(paso: Paso): HTMLElement | null {
  if (paso.objetivo) return document.querySelector<HTMLElement>(paso.objetivo);
  const h1 = document.querySelector<HTMLElement>("main h1");
  return h1?.parentElement && h1.parentElement.tagName !== "MAIN" ? h1.parentElement : h1;
}

function Guia() {
  const pathname = usePathname();
  const router = useRouter();
  const parametros = useSearchParams();
  const estado = interpretar(useSyncExternalStore(suscribir, crudo, sinGuia));
  const tarjeta = useRef<HTMLDivElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const [caja, setCaja] = useState<Caja | null>(null);
  const [alto, setAlto] = useState(0);
  const [ventana, setVentana] = useState({ w: 0, h: 0 });

  // Arranca con el aviso del registro (?recorrido=lado); si no, sigue donde quedó.
  const aviso = parametros.get("recorrido");
  useEffect(() => {
    if (aviso === "productor" || aviso === "colaborador") guardar({ lado: aviso, paso: 0 });
  }, [aviso]);

  useEffect(() => {
    const abrir = () => {
      const lado: Lado = pathname.startsWith("/productor") ? "productor" : "colaborador";
      guardar({ lado, paso: 0 });
    };
    window.addEventListener(ABRIR_RECORRIDO, abrir);
    return () => window.removeEventListener(ABRIR_RECORRIDO, abrir);
  }, [pathname]);

  const cerrar = useCallback(() => guardar(null), []);

  const pasos = estado ? PASOS[estado.lado] : [];
  const indice = estado ? Math.min(estado.paso, pasos.length - 1) : 0;
  const paso: Paso | undefined = pasos[indice];
  const tab = parametros.get("tab");
  /** ¿Es esta la pantalla del paso? Las pestañas cuentan: son pantallas distintas. */
  const coincide = (p: Paso) => {
    const [ruta, consulta] = p.href.split("?");
    if (pathname !== ruta) return false;
    return consulta ? consulta === `tab=${tab}` : !tab || tab === "datos" || tab === "aportes";
  };
  const enSuPantalla = paso ? coincide(paso) : false;

  const ir = (n: number) => {
    if (!estado) return;
    guardar({ ...estado, paso: n });
    const destino = PASOS[estado.lado][n];
    if (destino && !coincide(destino)) router.push(destino.href);
  };

  // Ubica el resaltado: busca el objetivo, lo trae a la vista y sigue sus cambios
  // de posición (scroll, tamaño de ventana, contenido que carga después).
  useLayoutEffect(() => {
    if (!paso || !enSuPantalla) return;
    let vivo = true;
    let intentos = 0;
    let observador: ResizeObserver | null = null;

    const medir = () => {
      const el = buscarObjetivo(paso);
      if (!vivo) return;
      setVentana({ w: window.innerWidth, h: window.innerHeight });
      if (!el) {
        setCaja(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setCaja({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    const iniciar = () => {
      const el = buscarObjetivo(paso);
      if (!el && intentos++ < 20) {
        setTimeout(iniciar, 100);
        return;
      }
      if (el) {
        const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const r = el.getBoundingClientRect();
        // Se trae al tercio de arriba, debajo del menú fijo, para que quede
        // lugar para la explicación abajo.
        if (r.top < 100 || r.top > window.innerHeight * 0.4) {
          window.scrollBy({ top: r.top - 110, behavior: reducido ? "auto" : "smooth" });
        }
        observador = new ResizeObserver(medir);
        observador.observe(el);
      }
      medir();
    };

    iniciar();
    const repetir = () => medir();
    window.addEventListener("scroll", repetir, true);
    window.addEventListener("resize", repetir);
    return () => {
      vivo = false;
      observador?.disconnect();
      window.removeEventListener("scroll", repetir, true);
      window.removeEventListener("resize", repetir);
    };
  }, [paso, enSuPantalla, pathname]);

  useLayoutEffect(() => {
    if (tarjeta.current) setAlto(tarjeta.current.offsetHeight);
  }, [indice, caja, enSuPantalla, ventana.w]);

  // Al cambiar de paso el foco va al título; Escape cierra y Tab no se escapa
  // de la tarjeta (el resto de la página queda detrás de la capa).
  useEffect(() => {
    if (!estado) return;
    requestAnimationFrame(() => titulo.current?.focus());
  }, [estado?.paso, estado === null]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!estado) return;
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
      if (e.key === "Tab" && tarjeta.current) {
        const foco = tarjeta.current.querySelectorAll<HTMLElement>("button, a[href]");
        if (foco.length === 0) return;
        const primero = foco[0];
        const ultimo = foco[foco.length - 1];
        const activo = document.activeElement;
        if (e.shiftKey && (activo === primero || activo === titulo.current)) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && activo === ultimo) {
          e.preventDefault();
          primero.focus();
        } else if (!tarjeta.current.contains(activo)) {
          e.preventDefault();
          primero.focus();
        }
      }
    };
    window.addEventListener("keydown", alTeclado);
    return () => window.removeEventListener("keydown", alTeclado);
  }, [estado, cerrar]);

  if (!estado || !paso) return null;

  const ultimo = indice >= pasos.length - 1;
  const iluminar = enSuPantalla && caja !== null;

  // Dónde va la tarjeta: debajo de lo iluminado; si no entra, pegada abajo; sin
  // objetivo, centrada.
  const ancho = Math.min(448, (ventana.w || 448) - 2 * MARGEN);
  let top: number;
  let left: number;
  if (iluminar && caja) {
    left = Math.max(MARGEN, Math.min(caja.left, ventana.w - ancho - MARGEN));
    top = caja.top + caja.height + AIRE + MARGEN;
    if (top + alto > ventana.h - MARGEN) top = Math.max(MARGEN, ventana.h - alto - MARGEN);
  } else {
    left = Math.max(MARGEN, (ventana.w - ancho) / 2);
    top = Math.max(MARGEN, (ventana.h - alto) / 2);
  }

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      {/* La capa: oscurece la pantalla y deja ver, con un borde de marca, lo que se explica. */}
      {iluminar && caja ? (
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-2xl outline outline-[3px] outline-marca-viva"
          style={{
            top: caja.top - AIRE,
            left: caja.left - AIRE,
            width: caja.width + 2 * AIRE,
            height: caja.height + 2 * AIRE,
            boxShadow: "0 0 0 100vmax rgb(8 28 22 / 0.58)",
          }}
        />
      ) : (
        <span aria-hidden className="absolute inset-0 bg-[rgb(8_28_22/0.58)]" />
      )}

      <div
        ref={tarjeta}
        role="dialog"
        aria-modal="true"
        aria-label="Recorrido por Guardian"
        className="recorrido absolute rounded-3xl bg-superficie p-6 shadow-[var(--sombra-alta)]"
        style={{ top, left, width: ancho }}
      >
        <div className="flex gap-1.5" aria-hidden>
          {pasos.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= indice ? "bg-marca-viva" : "bg-borde"}`}
            />
          ))}
        </div>
        <p className="tabular mt-4 text-sm text-tinta-tenue" aria-live="polite">
          Paso {indice + 1} de {pasos.length}
        </p>
        <h2
          ref={titulo}
          tabIndex={-1}
          className="mt-1 text-2xl font-semibold tracking-tight outline-none"
        >
          {paso.titulo}
        </h2>
        <p className="mt-2 text-tinta-suave">{paso.texto}</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={cerrar}
            className="min-h-11 rounded-full px-4 text-sm font-semibold text-tinta-suave hover:text-tinta"
          >
            {ultimo ? "Cerrar" : "Saltar"}
          </button>
          <div className="flex items-center gap-2">
            {indice > 0 ? (
              <button
                type="button"
                onClick={() => ir(indice - 1)}
                className="min-h-11 rounded-full px-4 text-sm font-semibold text-tinta-suave hover:text-tinta"
              >
                Anterior
              </button>
            ) : null}
            {enSuPantalla ? (
              <button
                type="button"
                onClick={() => (ultimo ? cerrar() : ir(indice + 1))}
                className="min-h-11 rounded-full bg-marca px-6 text-sm font-semibold text-marca-contraste hover:bg-marca-fuerte"
              >
                {ultimo ? "Terminar" : "Siguiente"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push(paso.href)}
                className="min-h-11 rounded-full bg-marca px-6 text-sm font-semibold text-marca-contraste hover:bg-marca-fuerte"
              >
                Ir a esta pantalla
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Se monta una vez en el layout: la guía sobrevive a la navegación. */
export function RecorridoGuiado() {
  return (
    <Suspense fallback={null}>
      <Guia />
    </Suspense>
  );
}

/** Para volver a ver el recorrido cuando ya se cerró. */
export function BotonRecorrido({
  className = "",
  alAbrir,
}: {
  className?: string;
  alAbrir?: () => void;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        alAbrir?.();
        window.dispatchEvent(new Event(ABRIR_RECORRIDO));
      }}
    >
      Ver recorrido
    </button>
  );
}
