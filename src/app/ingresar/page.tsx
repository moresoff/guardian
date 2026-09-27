import type { Metadata } from "next";
import Link from "next/link";
import { FormularioIngreso } from "./formulario";

export const metadata: Metadata = {
  title: "Entrar a Guardian",
  description: "Ingresá a tu cuenta de productor o de colaborador.",
};

export default function IngresarPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-semibold tracking-tight">Entrá a tu cuenta</h1>
      <p className="mt-2 text-tinta-suave">
        Con el mismo correo entrás seas productor o colaborador: Guardian te lleva a tu
        lado de la plataforma.
      </p>

      <div className="mt-8">
        <FormularioIngreso />
      </div>

      <p className="mt-8 border-t border-borde pt-6 text-tinta-suave">
        ¿Todavía no tenés cuenta?{" "}
        <Link href="/registro" className="font-medium text-marca underline">
          Creá una acá
        </Link>
        .
      </p>
    </div>
  );
}
