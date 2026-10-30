import type { Metadata } from "next";
import { Registro } from "./registro";

export const metadata: Metadata = {
  title: "Crear una cuenta en Guardian",
  description: "Abrí tu cuenta de productor o de colaborador en tres pasos.",
};

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ lado?: string }>;
}) {
  const { lado } = await searchParams;
  // La portada manda de qué lado entra. Cualquier otro valor se ignora y se
  // vuelve a preguntar, que es lo que pasa cuando alguien entra por el menú.
  const ladoInicial =
    lado === "productor" || lado === "colaborador" ? lado : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Creá tu cuenta</h1>
      <div className="mt-4">
        <Registro ladoInicial={ladoInicial} />
      </div>
    </div>
  );
}
