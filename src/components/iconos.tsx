import type { LucideIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export type Icono = ComponentType<SVGProps<SVGSVGElement>> | LucideIcon;

/**
 * La vaca. Lucide no trae una, así que se dibuja acá con el mismo trazo y la
 * misma grilla de 24 px que el resto: cabeza, cuernos, orejas y hocico.
 */
export function Vaca(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth ?? 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* cuernos */}
      <path d="M7.5 6.5C6 6 4.5 4.5 4.5 3M16.5 6.5C18 6 19.5 4.5 19.5 3" />
      {/* orejas */}
      <path d="M6 9.5L2.5 8.5C2.5 10.5 3.5 11.5 6 11.5M18 9.5l3.5-1c0 2-1 3-3.5 3" />
      {/* cabeza */}
      <path d="M7.5 6.5h9c1 0 1.5.8 1.5 1.8v5C18 17.5 15.5 21 12 21S6 17.5 6 13.3v-5c0-1 .5-1.8 1.5-1.8z" />
      {/* hocico */}
      <path d="M8.5 16.2c.8 1.4 2 2 3.5 2s2.7-.6 3.5-2" />
      {/* ojos */}
      <path d="M9.5 11.5h.01M14.5 11.5h.01" strokeWidth={2.4} />
    </svg>
  );
}
