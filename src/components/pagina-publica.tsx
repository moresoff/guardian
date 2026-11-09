import { ArrowRight, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CORREO_CONTACTO } from "@/lib/contacto";

/**
 * Las piezas de las páginas abiertas (quiénes somos, cómo participar), con los
 * mismos colores y tipografía que la app. La portada usa las mismas franjas.
 */

/** La foto de arriba con el título. El aviso de prototipo va acá y en el pie. */
export function PortadaInterna({
  foto,
  rotulo,
  titulo,
  texto,
  accion,
}: {
  foto: string;
  rotulo: string;
  titulo: ReactNode;
  texto: string;
  accion?: { href: string; label: string };
}) {
  return (
    <section className="relative isolate overflow-hidden bg-marca-fuerte text-white">
      <Image src={foto} alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
      <span className="absolute inset-0 -z-10 bg-[#052c22]/65" aria-hidden />
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:pb-14 sm:pt-20">
        <p className="text-sm font-medium tracking-wide text-white/85">{rotulo}</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          {titulo}
        </h1>
        <p className="mt-4 max-w-xl text-white/90 sm:text-lg">{texto}</p>
        {accion ? (
          <Link
            href={accion.href}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-2 font-medium text-marca-fuerte transition-colors hover:bg-marca-suave"
          >
            {accion.label}
            <ArrowRight className="size-5" strokeWidth={1.75} aria-hidden />
          </Link>
        ) : null}
        <p className="mt-8 text-sm text-white/80">
          Prototipo académico · Datos de prueba · No constituye oferta pública
        </p>
      </div>
    </section>
  );
}

/** Una franja de ancho completo con su propio tono. */
export function Franja({
  tono = "",
  id,
  children,
}: {
  tono?: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-28 ${tono}`}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">{children}</div>
    </section>
  );
}

export function Rotulo({ children }: { children: ReactNode }) {
  return <p className="text-sm font-medium text-marca">{children}</p>;
}

export function TituloFranja({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
      {children}
    </h2>
  );
}

/** Una foto con una frase encima, para cortar entre bloques de texto. */
export function FotoConFrase({ foto, alt, children }: { foto: string; alt: string; children: ReactNode }) {
  return (
    <section className="relative isolate flex h-56 items-end overflow-hidden bg-marca-fuerte sm:h-80">
      <Image src={foto} alt={alt} fill sizes="100vw" className="-z-10 object-cover" />
      <span className="absolute inset-0 -z-10 bg-gradient-to-t from-[#052c22]/80 to-transparent" aria-hidden />
      <p className="mx-auto w-full max-w-6xl px-4 pb-6 text-2xl font-semibold tracking-tight text-white text-balance sm:pb-10 sm:text-3xl">
        {children}
      </p>
    </section>
  );
}

/** El contacto, al final de cada página abierta. */
export function Contacto() {
  return (
    <Franja tono="bg-marca-fuerte text-white" id="consultas">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">Contacto</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Conversemos sobre Guardian
          </h2>
          <p className="mt-3 max-w-lg text-white/85">
            Consultá por modalidades de participación o por cómo presentar un ciclo.
          </p>
        </div>
        <a
          href={`mailto:${CORREO_CONTACTO}`}
          className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-white px-5 py-2 font-medium text-marca-fuerte transition-colors hover:bg-marca-suave sm:self-auto"
        >
          <Mail className="size-5" strokeWidth={1.75} aria-hidden />
          Escribinos
        </a>
      </div>
    </Franja>
  );
}
