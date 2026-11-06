import { notFound } from "next/navigation";
import { PanelProductor } from "@/components/panel-productor";
import { BotonLink } from "@/components/ui/primitivos";
import { PRODUCTOR_DEMO, getProductor } from "@/lib/data";
import { usuarioActual } from "@/lib/sesion";

export const metadata = { title: "Mis proyectos — Guardian" };

export default async function ResumenProductor() {
  const usuario = await usuarioActual();
  const productor = await getProductor(PRODUCTOR_DEMO);
  if (!productor) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bienvenido, {(usuario?.nombre ?? productor.responsable).split(" ")[0]}
        </h1>
        <BotonLink href="/productor/proyectos/nuevo">Publicar un proyecto</BotonLink>
      </div>
      <PanelProductor base="/productor" />
    </div>
  );
}
