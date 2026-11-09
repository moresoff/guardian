import Link from "next/link";
import { getPreciosHacienda } from "@/lib/precios-hacienda";
import { usuarioActual } from "@/lib/sesion";
import { SimuladorCiclo } from "./simulador-ciclo";

export const metadata = { title: "Simulador — Guardian" };

export default async function SimuladorPage() {
  // Abierto a todos: es una demo y se muestra sin pedir cuenta.
  const [u, mercado] = await Promise.all([usuarioActual(), getPreciosHacienda()]);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-semibold tracking-tight">Simulador de un ciclo</h1>
      <p className="mt-1 mb-6 max-w-2xl text-tinta-suave">
        Con los números del análisis económico o con el precio del kilo de hoy: elegí de qué lado estás, el ciclo y cuánto, y mirá cuánto
        queda, lo que cobra Guardian y de dónde sale cada número.
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
      <SimuladorCiclo ladoInicial={u?.lado === "productor" ? "productor" : "colaborador"} mercado={mercado} />
    </div>
  );
}
