import { GuardianWebsite } from "@/components/GuardianWebsite";
import { PanelProductor } from "@/components/panel-productor";
import { usuarioActual } from "@/lib/sesion";

export const metadata = { title: "Mis ciclos | Guardian" };

export default async function Page() {
  const usuario = await usuarioActual();
  const nombre = usuario?.nombre.trim().split(/\s+/)[0] ?? null;
  return (
    <GuardianWebsite
      section="producer"
      nombre={nombre}
      panel={<PanelProductor base="/producer" />}
    />
  );
}
