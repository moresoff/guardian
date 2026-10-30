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
    <div>
      <Link href="/productor/proyectos" className="inline-flex min-h-11 items-center text-sm text-tinta-suave hover:text-marca">
        ← Volver a mis proyectos
      </Link>

      <div className="mx-auto mt-3 mb-6 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Publicar un proyecto</h1>
        <p className="mt-1.5 text-tinta-suave">
          Tres pasos cortos. Antes de que se vea, Guardian revisa tus papeles.
        </p>
      </div>

      <WizardPublicacion garantias={garantias} />
    </div>
  );
}
