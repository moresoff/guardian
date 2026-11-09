import Link from "next/link";
import { usuarioActual } from "@/lib/sesion";
import { SimuladorCiclo } from "./simulador-ciclo";

export const metadata = { title: "Simulador — Guardian" };

export default async function SimuladorPage() {
  // Abierto a todos: es una demo y se muestra sin pedir cuenta.
  const u = await usuarioActual();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight">Simulador</h1>
      <p className="mt-1 mb-6 text-base text-tinta-suave">
        Elegí de qué lado estás, el ciclo y cuánto. Te mostramos cuánto queda, lo que cobra
        Guardian y de dónde sale cada número.
        {u ? null : (
          <>
            {" "}
            <Link href="/registro" className="font-medium text-marca underline underline-offset-4">
              Creá tu cuenta
            </Link>{" "}
            para participar o publicar un proyecto.
          </>
        )}
      </p>
      <SimuladorCiclo ladoInicial={u?.lado === "productor" ? "productor" : "colaborador"} />
    </div>
  );
}
