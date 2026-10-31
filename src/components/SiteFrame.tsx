"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { GuardianWebsite } from "./GuardianWebsite";
import { Nav } from "./nav";
import { RecorridoGuiado } from "./recorrido-guiado";
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
  if (pathname === "/")
    return <GuardianWebsite section="home">{children}</GuardianWebsite>;
  if (
    [
      "/quienes-somos",
      "/como-participar",
      "/producer",
      "/como-invertir",
      "/investor",
      "/fiduciary",
      "/comparison",
    ].includes(pathname)
  )
    return children;
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
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-6"
      >
        {children}
      </main>
      <footer className="border-t border-borde px-4 py-6">
        <p className="mx-auto max-w-6xl text-sm text-tinta-suave">
          Guardian — prototipo de la plataforma. Datos de prueba; no constituye
          oferta pública.
        </p>
      </footer>
      <RecorridoGuiado />
    </>
  );
}
