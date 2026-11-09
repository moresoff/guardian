import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/sesion";
import { SimuladorCiclo } from "./simulador-ciclo";

export const metadata = { title: "Simulador — Guardian" };

export default async function SimuladorPage() {
  const u = await usuarioActual();
  if (!u) redirect("/ingresar");

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight">Simulador</h1>
      <p className="mt-1 mb-6 text-base text-tinta-suave">
        Elegí de qué lado estás, el ciclo y cuánto. Te mostramos cuánto queda, lo que cobra
        Guardian y de dónde sale cada número.
      </p>
      <SimuladorCiclo ladoInicial={u.lado} />
    </div>
  );
}
