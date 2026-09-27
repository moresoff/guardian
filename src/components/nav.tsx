"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * La navegación es distinta según de qué lado de la plataforma estés.
 * El productor y el colaborador no comparten menú. El productor entra a su
 * tablero; el colaborador, al catálogo, que es su pantalla de trabajo.
 */
const MENUS = {
  productor: {
    inicio: "/productor",
    etiqueta: "Productor",
    items: [
      { href: "/productor/proyectos", label: "Mis proyectos" },
      { href: "/productor/documentacion", label: "Documentación" },
      { href: "/productor/perfil", label: "Mi establecimiento" },
    ],
  },
  colaborador: {
    inicio: "/proyectos",
    etiqueta: "Colaborador",
    items: [
      { href: "/proyectos", label: "Catálogo" },
      { href: "/colaborador/cartera", label: "Mi cartera" },
      { href: "/colaborador/perfil", label: "Mi perfil" },
    ],
  },
  admin: {
    inicio: "/admin",
    etiqueta: "Validación",
    items: [{ href: "/admin", label: "Cola de validación" }],
  },
} as const;

type Area = keyof typeof MENUS | null;

function areaDe(pathname: string): Area {
  if (pathname.startsWith("/productor")) return "productor";
  if (pathname.startsWith("/colaborador") || pathname.startsWith("/proyectos"))
    return "colaborador";
  if (pathname.startsWith("/admin")) return "admin";
  return null;
}

/**
 * Las dos vistas son de la misma cuenta: quien engorda hacienda también puede
 * poner capital en el ciclo de otro. Cambiar de vista no es cambiar de usuario.
 */
const VISTAS = [
  {
    href: "/productor",
    titulo: "Productor",
    texto: "Publicar un ciclo y conseguir el capital",
  },
  {
    href: "/proyectos",
    titulo: "Colaborador",
    texto: "Ver proyectos y participar en un ciclo",
  },
] as const;

/** Selector de vista: decir a dónde vas es la mitad del trabajo del enlace. */
function CambiarVista({ area }: { area: Area }) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fueraDelMenu = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    const conEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", fueraDelMenu);
    document.addEventListener("keydown", conEscape);
    return () => {
      document.removeEventListener("mousedown", fueraDelMenu);
      document.removeEventListener("keydown", conEscape);
    };
  }, [abierto]);

  return (
    <div className="relative" ref={contenedor}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="flex min-h-11 items-center gap-2 rounded-lg border border-borde px-3.5 py-2 text-sm font-medium text-tinta-suave transition-colors hover:bg-superficie-2 hover:text-tinta"
      >
        {area ? MENUS[area].etiqueta : "Cambiar de vista"}
        <span
          className={`text-[0.7em] transition-transform ${abierto ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▼
        </span>
      </button>

      {abierto ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-72 overflow-hidden rounded-xl border border-borde bg-superficie shadow-[var(--sombra-alta)]"
        >
          <p className="border-b border-borde px-4 py-3 text-sm text-tinta-tenue">
            Las dos vistas son de la misma cuenta.
          </p>
          {VISTAS.map((v) => (
            <Link
              key={v.href}
              href={v.href}
              role="menuitem"
              onClick={() => setAbierto(false)}
              className="block px-4 py-3.5 transition-colors hover:bg-marca-suave"
            >
              <span className="font-semibold">{v.titulo}</span>
              <span className="mt-0.5 block text-sm text-tinta-suave">{v.texto}</span>
            </Link>
          ))}
          <Link
            href="/"
            role="menuitem"
            onClick={() => setAbierto(false)}
            className="block border-t border-borde px-4 py-3 text-sm text-tinta-suave transition-colors hover:bg-superficie-2"
          >
            Volver a la portada
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function Nav() {
  const pathname = usePathname();
  const area = areaDe(pathname);
  const menu = area ? MENUS[area] : null;

  return (
    <header className="sticky top-0 z-20 border-b border-borde bg-papel/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link href={menu?.inicio ?? "/"} className="flex items-center gap-2.5">
          <Image
            src="/imagenes/marca/logo-guardian-limpio.png"
            alt=""
            width={847}
            height={796}
            priority
            className="h-8 w-auto"
          />
          <span className="text-lg font-semibold tracking-tight text-marca">
            Guardian
          </span>
        </Link>

        {menu ? (
          <nav className="flex flex-wrap items-center gap-1" aria-label="Secciones">
            {menu.items.map((s) => {
              const activa = pathname.startsWith(s.href);
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  aria-current={activa ? "page" : undefined}
                  className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                    activa
                      ? "bg-marca-suave font-medium text-marca"
                      : "text-tinta-suave hover:bg-superficie-2"
                  }`}
                >
                  {s.label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        {/*
          Dos encabezados según de qué lado del ingreso estés. Afuera: entrar y
          registrarse. Adentro: cambiar de vista, que se hace con la misma cuenta
          —un productor también puede invertir—. El selector no tiene sentido
          antes de entrar: la sesión ya sabe a qué lado va cada uno.
        */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {area ? (
            <CambiarVista area={area} />
          ) : (
            <>
              <Link
                href="/ingresar"
                className="flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium text-tinta-suave transition-colors hover:bg-superficie-2 hover:text-tinta"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="flex min-h-11 items-center rounded-lg bg-marca px-4 py-2 text-sm font-medium text-marca-contraste transition-colors hover:bg-marca-fuerte"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
