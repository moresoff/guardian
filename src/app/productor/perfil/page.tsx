import { redirect } from "next/navigation";

/** «Mi establecimiento» absorbió esta pantalla; el enlace viejo sigue andando. */
export default function PerfilRedirect() {
  redirect("/productor/establecimiento");
}
