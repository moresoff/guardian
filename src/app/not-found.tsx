import { BotonLink } from "@/components/ui/primitivos";

export const metadata = { title: "No encontrado — Guardian" };

export default function NoEncontrado() {
  return (
    <div className="mx-auto max-w-xl py-10">
      <p className="rotulo text-tinta-tenue">404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        Esta página no existe
      </h1>
      <p className="mt-3 text-tinta-suave">
        Puede que el proyecto se haya dado de baja, que el enlace esté incompleto o
        que estés entrando a una sección de la otra vista.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <BotonLink href="/">Elegir de qué lado entrar</BotonLink>
        <BotonLink href="/proyectos" variante="secundario">
          Ver el catálogo
        </BotonLink>
      </div>
    </div>
  );
}
