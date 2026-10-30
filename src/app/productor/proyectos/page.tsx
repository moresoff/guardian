import { redirect } from "next/navigation";

/** «Mis proyectos» vive en `/productor`: la lista y el tablero son una sola pantalla. */
export default function MisProyectosRedirect() {
  redirect("/productor");
}
