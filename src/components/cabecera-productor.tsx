import { notFound } from "next/navigation";
import { productorDeSesion, productoresDeSesion } from "@/lib/cuentas";
import { PRODUCTOR_DEMO } from "@/lib/data";
import { CabeceraPerfil, type DatoCabecera } from "@/components/cabecera-perfil";
import { Badge, BotonLink } from "@/components/ui/primitivos";
import {
  getDocumentosPermanentes,
  getProductor,
  getProyectosDeProductor,
} from "@/lib/data";
import { SISTEMA_LABEL, formatArsCompacto, formatNum, formatPct } from "@/lib/format";
import { buscarImagen } from "@/lib/imagenes";

/**
 * La ficha del productor —retrato, nombre, sello de RENSPA y trayectoria—. Se
 * muestra igual arriba de «Mis proyectos» y de «Mi establecimiento», así que
 * las cifras se calculan en un solo lugar.
 */
export async function CabeceraProductor() {
  const productorId = await productorDeSesion();
  const productor = await getProductor(productorId);
  if (!productor) notFound();

  const proyectos = (
    await Promise.all((await productoresDeSesion()).map(getProyectosDeProductor))
  ).flat();
  const permanentes = await getDocumentosPermanentes(productorId);

  const cerrados = proyectos.filter((p) => p.estado === "cerrado" && p.resultado);
  const capitalMovilizado = proyectos
    .filter((p) => p.estado !== "borrador" && p.estado !== "rechazado")
    .reduce((acc, p) => acc + p.montoRecaudadoArs, 0);
  const kgFaenados = cerrados.reduce((acc, p) => acc + (p.resultado?.kgCarne ?? 0), 0);
  const rendimientoPromedio = cerrados.length
    ? cerrados.reduce((acc, p) => acc + (p.resultado?.rendimientoPct ?? 0), 0) /
      cerrados.length
    : 0;

  // El sello dice lo que se puede probar y nada más: que la constancia de RENSPA
  // está contrastada contra SENASA. Si el papel no se verificó, no hay sello.
  const renspaVerificado = permanentes.some(
    (d) => d.tipo === "renspa" && d.estadoAutenticidad === "verificada",
  );

  // El retrato de la demo es del productor de ejemplo: una cuenta nueva no tiene
  // foto y va con sus iniciales, en vez de la cara de otro.
  const retrato =
    productorId === PRODUCTOR_DEMO
      ? (buscarImagen("fotos", "ganadero") ?? buscarImagen("fotos", "productor"))
      : null;

  // El primer proyecto publicado sirve para mirarse con los ojos del colaborador.
  const publicado = proyectos.find((p) =>
    ["abierto", "fondeado", "en_curso", "cerrado"].includes(p.estado),
  );

  const datos: DatoCabecera[] = [
    { etiqueta: "Ciclos cerrados", valor: cerrados.length },
    { etiqueta: "Capital movilizado", valor: formatArsCompacto(capitalMovilizado) },
    { etiqueta: "Carne producida", valor: `${formatNum(kgFaenados)} kg`, codigo: true },
    {
      etiqueta: "Rendimiento de faena promedio",
      valor: cerrados.length > 0 ? formatPct(rendimientoPromedio) : "—",
      codigo: true,
    },
  ];

  return (
    <CabeceraPerfil
      titulo={productor.razonSocial}
      subtitulo={`${productor.establecimiento} · ${[productor.localidad, productor.provincia]
        .filter(Boolean)
        .join(", ")} · ${SISTEMA_LABEL[productor.sistemaProductivo]}`}
      sello={renspaVerificado ? <Badge tono="ok">RENSPA verificado</Badge> : undefined}
      foto={retrato}
      datos={datos}
      accion={
        publicado ? (
          <BotonLink variante="secundario" href={`/proyectos/${publicado.id}`}>
            Ver mi perfil público
          </BotonLink>
        ) : undefined
      }
    />
  );
}
