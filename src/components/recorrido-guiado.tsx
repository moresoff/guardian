"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useSyncExternalStore } from "react";

type Lado = "productor" | "colaborador";

interface Paso {
  titulo: string;
  texto: string;
  /** La pantalla donde se hace lo que dice el paso. */
  href: string;
  accion: string;
}

/**
 * Qué hay que cargar y dónde, en el orden en que conviene hacerlo. Cada paso
 * lleva a la pantalla real: el recorrido no reemplaza la aplicación, la señala.
 */
const PASOS: Record<Lado, Paso[]> = {
  productor: [
    {
      titulo: "Tu panel",
      texto: "Acá aparecen tus proyectos y en qué estado está cada uno: borrador, en revisión, abierto o en curso.",
      href: "/productor",
      accion: "Ver mi panel",
    },
    {
      titulo: "Cargá tu establecimiento",
      texto: "RENSPA, CUIT del titular, provincia y sistema productivo. Se carga una vez y sirve para todos tus ciclos.",
      href: "/productor/perfil",
      accion: "Ir a mi establecimiento",
    },
    {
      titulo: "Subí la documentación",
      texto: "RENSPA, DT-e, listado de caravanas y boleto de compra-venta. Guardian los cruza con lo que declarás y te avisa si algo no cierra.",
      href: "/productor/documentacion",
      accion: "Ir a documentación",
    },
    {
      titulo: "Armá tu proyecto",
      texto: "Elegís el tipo de ciclo —feedlot puro, mixto o pastura pura— y cargás el lote: cabezas, categoría, pesos de entrada y de salida, y qué necesitás para el ciclo.",
      href: "/productor/proyectos/nuevo",
      accion: "Publicar un proyecto",
    },
    {
      titulo: "Validación y seguimiento",
      texto: "Guardian revisa en 24 a 72 horas. Con el ciclo en marcha cargás pesadas y gastos; al cierre, el romaneo define el resultado.",
      href: "/productor",
      accion: "Volver a mi panel",
    },
  ],
  colaborador: [
    {
      titulo: "Elegí un proyecto",
      texto: "Cada uno es un lote concreto, con su establecimiento, su RENSPA y el estado de validación a la vista.",
      href: "/proyectos",
      accion: "Ver el catálogo",
    },
    {
      titulo: "Entendé el tipo de ciclo",
      texto: "Feedlot puro, mixto o pastura pura. Cada tipo tiene su propio plazo y su propio reparto, que se detallan en la ficha de cada proyecto.",
      href: "/proyectos",
      accion: "Comparar proyectos",
    },
    {
      titulo: "Leé la ficha y participá",
      texto: "Presupuesto, cronograma y quién soporta la mortandad. Si querés sumarte, aceptás las condiciones y hacés tu aporte: cuenta cuando el banco lo acredita.",
      href: "/proyectos/pry-2",
      accion: "Abrir un proyecto de ejemplo",
    },
    {
      titulo: "Seguí tu participación",
      texto: "En tu cartera ves tus aportes, lo pendiente y el avance de cada ciclo hasta la faena.",
      href: "/colaborador/cartera",
      accion: "Ir a mi cartera",
    },
    {
      titulo: "Completá tu perfil",
      texto: "La cuenta donde querés recibir lo que te corresponda y tus datos de contacto.",
      href: "/colaborador/perfil",
      accion: "Ir a mi perfil",
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

function Guia() {
  const pathname = usePathname();
  const parametros = useSearchParams();
  const estado = interpretar(useSyncExternalStore(suscribir, crudo, sinGuia));
  const titulo = useRef<HTMLHeadingElement>(null);

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

  const ir = (paso: number) => {
    if (!estado) return;
    guardar({ ...estado, paso });
    requestAnimationFrame(() => titulo.current?.focus());
  };

  // Mientras la guía está abierta, lo que queda detrás de ella no se tapa al
  // navegar con teclado.
  useEffect(() => {
    document.documentElement.classList.toggle("recorrido-abierto", estado !== null);
    return () => document.documentElement.classList.remove("recorrido-abierto");
  }, [estado]);

  useEffect(() => {
    if (!estado) return;
    const alEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    window.addEventListener("keydown", alEscape);
    return () => window.removeEventListener("keydown", alEscape);
  }, [estado, cerrar]);

  if (!estado) return null;

  const pasos = PASOS[estado.lado];
  const paso = pasos[Math.min(estado.paso, pasos.length - 1)];
  const ultimo = estado.paso >= pasos.length - 1;
  const estaAhi = pathname === paso.href.split("?")[0];

  return (
    <aside
      aria-label="Recorrido por Guardian"
      className="recorrido fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md rounded-2xl border border-borde-fuerte bg-superficie p-4 shadow-[var(--sombra-alta)] sm:right-4 sm:left-auto sm:mx-0"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          ref={titulo}
          tabIndex={-1}
          className="text-base font-semibold tracking-tight outline-none"
        >
          {paso.titulo}
        </h2>
        <p className="tabular shrink-0 pt-0.5 text-sm text-tinta-tenue" aria-live="polite">
          {estado.paso + 1} de {pasos.length}
        </p>
      </div>
      <p className="mt-1.5 text-sm text-tinta-suave">{paso.texto}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {estaAhi ? null : (
          <Link
            href={paso.href}
            className="inline-flex min-h-11 items-center rounded-xl bg-marca px-4 text-sm font-medium text-marca-contraste hover:bg-marca-fuerte"
          >
            {paso.accion}
          </Link>
        )}
        {ultimo ? (
          <button
            type="button"
            onClick={cerrar}
            className="min-h-11 rounded-xl border border-borde-fuerte px-4 text-sm font-medium hover:bg-superficie-2"
          >
            Terminar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => ir(estado.paso + 1)}
            className={`min-h-11 rounded-xl px-4 text-sm font-medium ${
              estaAhi
                ? "bg-marca text-marca-contraste hover:bg-marca-fuerte"
                : "border border-borde-fuerte hover:bg-superficie-2"
            }`}
          >
            Siguiente
          </button>
        )}
        {estado.paso > 0 ? (
          <button
            type="button"
            onClick={() => ir(estado.paso - 1)}
            className="min-h-11 px-2 text-sm font-medium text-tinta-suave hover:text-tinta"
          >
            Anterior
          </button>
        ) : null}
        <button
          type="button"
          onClick={cerrar}
          className="ml-auto min-h-11 px-2 text-sm text-tinta-suave underline underline-offset-2 hover:text-tinta"
        >
          Salir
        </button>
      </div>
    </aside>
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
export function BotonRecorrido({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(ABRIR_RECORRIDO))}
    >
      Ver el recorrido
    </button>
  );
}
