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
    <div className="mx-auto max-w-lg">
      <h1 className="text-3xl font-semibold tracking-tight">Creá tu cuenta</h1>
      <p className="mt-2 text-tinta-suave">
        Son tres pasos y no hace falta tener ningún papel a mano todavía.
      </p>
      <div className="mt-8">
        <Registro ladoInicial={ladoInicial} />
      </div>
    </div>
  );
}
