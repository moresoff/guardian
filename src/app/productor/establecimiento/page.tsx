import { notFound } from "next/navigation";
import { productorDeSesion } from "@/lib/cuentas";
import { Pestanas } from "@/components/pestanas";
import { getProductor } from "@/lib/data";
import { AvisosFijos } from "@/components/avisos-fijos";
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
  const productorId = await productorDeSesion();
  const productor = await getProductor(productorId);
  if (!productor) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mi establecimiento</h1>
        <p className="mt-1 text-base text-tinta-suave">
          {[productor.establecimiento, productor.localidad, productor.provincia].filter(Boolean).join(" · ")}
        </p>
      </div>
      <Pestanas
        pestanas={PESTANAS}
        activa={activa}
        base="/productor/establecimiento"
      />

      {activa === "datos" ? (
        <div className="space-y-12">
          <ConfiguracionPerfil productor={productor} />

          <AvisosFijos lado="productor" />
        </div>
      ) : null}

      {activa === "documentos" ? <Documentos /> : null}
    </div>
  );
}
