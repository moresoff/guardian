import { redirect } from "next/navigation";
import { colaboradorDeSesion, productorDeSesion } from "@/lib/cuentas";
import { getColaborador, getProductor } from "@/lib/data";
import { formatFecha } from "@/lib/format";
import { getVerificacion } from "@/lib/identidad";
import { usuarioActual } from "@/lib/sesion";
import { ValidarIdentidad } from "./validar";

export const metadata = { title: "Validá tu identidad — Guardian" };

export default async function IdentidadPage() {
  const u = await usuarioActual();
  if (!u) redirect("/ingresar");

  const v = await getVerificacion(u.id);

  // Lo que ya sabemos de la cuenta, para no pedirlo dos veces.
  let cuit = "";
  let provincia = "Buenos Aires";
  if (u.lado === "productor") {
    const p = await getProductor(await productorDeSesion());
    cuit = p?.cuit ?? "";
    provincia = p?.provincia || provincia;
  } else {
    cuit = (await getColaborador(await colaboradorDeSesion()))?.cuil ?? "";
  }
  if (!/\d/.test(cuit)) cuit = "";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">
        {v ? "Tu identidad" : "Validá tu identidad"}
      </h1>
      {v ? null : (
        <p className="mt-1 text-base text-tinta-suave">
          Lo pide la ley para cualquiera que participe. Te lleva unos minutos: tus datos, una
          foto del DNI y una selfie. Se hace una sola vez.
        </p>
      )}
      <div className="mt-6">
        <ValidarIdentidad
          lado={u.lado}
          inicial={{ nombre: u.nombre, cuit, provincia }}
          ya={v ? { ...v, fecha: formatFecha(v.fecha) } : null}
        />
      </div>
    </div>
  );
}
