import { notFound, redirect } from "next/navigation";
import { FaltaIdentidad } from "@/components/falta-identidad";
import { FirmaContrato } from "@/components/firma-contrato";
import { BotonLink } from "@/components/ui/primitivos";
import { getAportesDeProyecto, getProductor, getProyecto } from "@/lib/data";
import { getVerificacion } from "@/lib/identidad";
import { getPreciosHacienda } from "@/lib/precios-hacienda";
import { calcularFondeo, puedeAdherirse } from "@/lib/proyecto";
import { usuarioActual } from "@/lib/sesion";

export const metadata = { title: "Participar — Guardian" };

export default async function ParticiparPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await usuarioActual();
  if (!u) redirect("/ingresar");
  const proyecto = await getProyecto(id);
  if (!proyecto) notFound();
  const productor = await getProductor(proyecto.productorId);
  if (!productor) notFound();

  const fondeo = calcularFondeo(proyecto, await getAportesDeProyecto(id));
  const regla = puedeAdherirse(proyecto, fondeo);
  const lugar = Math.max(
    0,
    proyecto.montoObjetivoArs - fondeo.acreditadoArs - fondeo.comprometidoSinAcreditarArs,
  );
  const [v, mercado] = await Promise.all([getVerificacion(u.id), getPreciosHacienda()]);

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm text-tinta-suave">{proyecto.titulo}</p>
      <h1 className="text-2xl font-semibold tracking-tight">Participar en el proyecto</h1>
      <div className="mt-5">
        {u.lado !== "colaborador" ? (
          <Bloqueo texto="Para participar entrá con una cuenta de colaborador." id={id} />
        ) : !regla.puede || lugar <= 0 ? (
          <Bloqueo texto={regla.motivo ?? "El objetivo ya está cubierto."} id={id} />
        ) : v?.estado !== "aprobada" ? (
          <FaltaIdentidad volver={`/proyectos/${id}/participar`} />
        ) : (
          <FirmaContrato
            rol="colaborador"
            proyecto={proyecto}
            productor={productor}
            lugar={lugar}
            precios={{ compraKg: mercado.compra.valor, ventaKg: mercado.venta.valor }}
          />
        )}
      </div>
    </div>
  );
}

function Bloqueo({ texto, id }: { texto: string; id: string }) {
  return (
    <section className="rounded-2xl border border-borde bg-superficie p-5">
      <p className="text-base">{texto}</p>
      <BotonLink variante="secundario" href={`/proyectos/${id}`} className="mt-4 min-h-12">
        Volver al proyecto
      </BotonLink>
    </section>
  );
}
