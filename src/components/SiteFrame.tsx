"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Nav } from "./nav";
import { RecorridoGuiado } from "./recorrido-guiado";

/** Las páginas abiertas ocupan todo el ancho: sus franjas van de borde a borde. */
const ANCHO_COMPLETO = ["/", "/quienes-somos", "/como-participar"];

/**
 * El marco de todas las pantallas: la misma barra, el mismo pie y los mismos
 * colores adentro y afuera. Lo único que cambia es si el contenido va en una
 * columna o de borde a borde.
 */
export function SiteFrame({
  children,
  conSesion,
  nombre,
  lado,
}: {
  children: ReactNode;
  conSesion: boolean;
  nombre: string | null;
  lado: "productor" | "colaborador" | null;
}) {
  const pathname = usePathname();
  const abierta = ANCHO_COMPLETO.includes(pathname);
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Saltar al contenido
      </a>
      <Nav conSesion={conSesion} nombre={nombre} lado={lado} />
      <main
        id="contenido"
        className={abierta ? "flex-1" : "mx-auto w-full max-w-6xl flex-1 px-4 py-6"}
      >
        {children}
      </main>
      <Pie />
      {/* Solo con sesión: sin ella taparía el ingreso y el registro con su capa. */}
      {abierta || !conSesion ? null : <RecorridoGuiado />}
    </>
  );
}

/** El pie: las páginas abiertas y el único aviso de prototipo que vale para todo. */
function Pie() {
  return (
    <footer className="border-t border-borde bg-superficie">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-5">
        <Link href="/" className="flex min-h-11 items-center gap-2 font-semibold text-marca">
          <Image
            src="/imagenes/marca/logo-guardian-limpio.png"
            alt=""
            width={847}
            height={796}
            className="h-6 w-auto"
          />
          <span translate="no">Guardian</span>
        </Link>
        <nav aria-label="Pie" className="flex flex-wrap gap-x-4 text-sm text-tinta-suave">
          <Link href="/quienes-somos" className="flex min-h-11 items-center hover:text-tinta">
            Quiénes somos
          </Link>
          <Link href="/como-participar" className="flex min-h-11 items-center hover:text-tinta">
            Cómo participar
          </Link>
          <Link href="/simulador" className="flex min-h-11 items-center hover:text-tinta">
            Simulador
          </Link>
        </nav>
        <p className="w-full text-sm text-tinta-suave sm:ml-auto sm:w-auto">
          Prototipo académico · Datos de prueba · No constituye oferta pública
        </p>
      </div>
    </footer>
  );
}
