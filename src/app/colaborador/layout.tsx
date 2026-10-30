import { exigirSesion } from "@/lib/sesion";

/** Estas pantallas son de quien tiene cuenta: sin sesión se pide ingresar. */
export default async function Layout({ children }: { children: React.ReactNode }) {
  await exigirSesion();
  return children;
}
