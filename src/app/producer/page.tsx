import { GuardianWebsite } from "@/components/GuardianWebsite";
import { usuarioActual } from "@/lib/sesion";
export const metadata = { title: "Mis ciclos | Guardian" };
export default async function Page() {
  // El saludo nombra a quien entró. Sin sesión, la demo saluda al productor en general.
  const usuario = await usuarioActual();
  const nombre = usuario?.nombre.trim().split(/\s+/)[0] ?? null;
  return <GuardianWebsite section="producer" nombre={nombre} />;
}
