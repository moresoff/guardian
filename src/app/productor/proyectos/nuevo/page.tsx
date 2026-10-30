import Link from "next/link";
import { PRODUCTOR_DEMO, getGarantiasConUso } from "@/lib/data";
import { GARANTIA_LABEL, formatArs } from "@/lib/format";
import { WizardPublicacion } from "./wizard";

export const metadata = { title: "Publicar un proyecto — Guardian" };

export default async function NuevoProyectoPage() {
  // La garantía no es una opción fija: son las del productor, y las que ya no
  // tienen cupo se ofrecen igual pero deshabilitadas, para que se vea por qué no
  // se pueden elegir.
  const garantias = (await getGarantiasConUso(PRODUCTOR_DEMO)).map((g) => ({
    id: g.garantia.id,
    label: `${GARANTIA_LABEL[g.garantia.tipo]} — ${g.garantia.identificacion} (${formatArs(
      g.garantia.valuacionArs,
    )})`,
    disponible: g.disponible,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Publicar un proyecto</h1>
        <Link
          href="/productor"
          className="inline-flex min-h-11 items-center text-sm text-tinta-suave hover:text-marca"
        >
          ← Volver a mis proyectos
        </Link>
      </div>

      <WizardPublicacion garantias={garantias} />
    </div>
  );
}
