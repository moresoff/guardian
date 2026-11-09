import { notFound, redirect } from "next/navigation";
import { FaltaIdentidad } from "@/components/falta-identidad";
import { FirmaContrato } from "@/components/firma-contrato";
import { productorDeSesion } from "@/lib/cuentas";
import { getGarantia, getProductor, getProyecto } from "@/lib/data";
import { getFirmaFideicomiso } from "@/lib/firmas";
import { formatFecha } from "@/lib/format";
import { getVerificacion } from "@/lib/identidad";
import { usuarioActual } from "@/lib/sesion";

export const metadata = { title: "Firmar el contrato — Guardian" };

export default async function FirmarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await usuarioActual();
  if (!u) redirect("/ingresar");
  const proyecto = await getProyecto(id);
  if (!proyecto || u.lado !== "productor" || proyecto.productorId !== (await productorDeSesion()))
    notFound();
  const productor = await getProductor(proyecto.productorId);
  if (!productor) notFound();

  const firma = await getFirmaFideicomiso(id);
  const v = await getVerificacion(u.id);
  const garantia = proyecto.garantiaId ? await getGarantia(proyecto.garantiaId) : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm text-tinta-suave">{proyecto.titulo}</p>
      <h1 className="text-2xl font-semibold tracking-tight">Contrato del fideicomiso</h1>
      <div className="mt-5">
        {firma ? (
          <FirmaContrato
            rol="productor"
            proyecto={proyecto}
            productor={productor}
            garantia={garantia}
            firmado={{ ...firma, fecha: formatFecha(firma.fecha) }}
          />
        ) : proyecto.estado !== "en_validacion" ? (
          <section className="rounded-2xl border border-borde bg-superficie p-5">
            <p className="text-base">El contrato se firma mientras el proyecto está en validación.</p>
          </section>
        ) : v?.estado !== "aprobada" ? (
          <FaltaIdentidad volver={`/proyectos/${id}/firmar`} />
        ) : (
          <FirmaContrato rol="productor" proyecto={proyecto} productor={productor} garantia={garantia} />
        )}
      </div>
    </div>
  );
}
