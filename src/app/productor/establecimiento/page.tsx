import { notFound } from "next/navigation";
import { CabeceraProductor } from "@/components/cabecera-productor";
import { Pestanas } from "@/components/pestanas";
import { PRODUCTOR_DEMO, getProductor } from "@/lib/data";
import { AjustesCuenta } from "./ajustes";
import { ConfiguracionPerfil } from "./configuracion";
import { Documentos } from "./documentos";

export const metadata = { title: "Mi establecimiento — Guardian" };

const PESTANAS = [
  { clave: "datos", titulo: "Mis datos" },
  { clave: "documentos", titulo: "Mis papeles" },
];

/**
 * Mi establecimiento: los datos del campo y los papeles que se reusan, en dos
 * pestañas. La trayectoria ya no tiene pestaña propia: la ficha de arriba dice
 * los ciclos cerrados y lo que salió de sus romaneos, y cada ciclo cerrado está
 * en «Terminados», en Mis proyectos.
 *
 * El perfil es las dos cosas a la vez: donde el productor configura su cuenta y
 * la ficha que el colaborador termina mirando antes de participar. Por eso
 * arranca como una ficha y lo editable viene después, en filas.
 */
export default async function EstablecimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activa = tab === "documentos" ? tab : "datos";
  const productor = await getProductor(PRODUCTOR_DEMO);
  if (!productor) notFound();

  return (
    <div className="space-y-8">
      <CabeceraProductor />

      <Pestanas
        pestanas={PESTANAS}
        activa={activa}
        base="/productor/establecimiento"
      />

      {activa === "datos" ? (
        <div className="space-y-12">
          <ConfiguracionPerfil productor={productor} />

          <AjustesCuenta />
        </div>
      ) : null}

      {activa === "documentos" ? <Documentos /> : null}
    </div>
  );
}
