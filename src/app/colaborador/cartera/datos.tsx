import Link from "next/link";
import { notFound } from "next/navigation";
import { AvisosFijos } from "@/components/avisos-fijos";
import { FilaDato } from "@/components/fila-ajuste";
import { Badge, BotonLink, Panel, Seccion } from "@/components/ui/primitivos";
import { colaboradorDeSesion } from "@/lib/cuentas";
import { getColaborador, getProyecto } from "@/lib/data";
import { getFirmasDePerfil } from "@/lib/firmas";
import { formatFecha } from "@/lib/format";
import { getVerificacion } from "@/lib/identidad";
import { usuarioActual } from "@/lib/sesion";

/**
 * «Mis datos» del colaborador, en una pantalla: lo que declaró al validar su
 * identidad (no se vuelve a pedir ni se inventa), los contratos que firmó y los
 * avisos que va a recibir.
 */
export async function DatosColaborador() {
  const usuario = await usuarioActual();
  const colaborador = await getColaborador(await colaboradorDeSesion());
  if (!colaborador) notFound();
  const [v, firmas] = usuario
    ? await Promise.all([getVerificacion(usuario.id), getFirmasDePerfil(usuario.id)])
    : [null, []];
  const titulos = new Map(
    await Promise.all(firmas.map(async (f) => [f.proyectoId, (await getProyecto(f.proyectoId))?.titulo ?? f.proyectoId] as const)),
  );

  return (
    <div className="space-y-8">
      <Seccion titulo="Tus datos">
        <Panel className="p-5 sm:p-6">
          <dl>
            <FilaDato etiqueta="Nombre">{v ? `${v.nombre} ${v.apellido}` : usuario?.nombre ?? colaborador.nombre}</FilaDato>
            <FilaDato etiqueta="Correo">{usuario?.correo ?? colaborador.email}</FilaDato>
            <FilaDato etiqueta="CUIL" codigo>
              {v?.cuit ?? colaborador.cuil}
            </FilaDato>
            {v ? (
              <>
                <FilaDato etiqueta="DNI" codigo>
                  {v.dni}
                </FilaDato>
                <FilaDato etiqueta="Domicilio">{v.domicilio}</FilaDato>
                <FilaDato etiqueta="CBU donde te devolvemos" codigo>
                  {v.cbu ?? "Sin cargar"}
                </FilaDato>
              </>
            ) : null}
            <FilaDato etiqueta="Identidad">
              {v?.estado === "aprobada" ? (
                <Badge tono="ok">Validada el {formatFecha(v.fecha)}</Badge>
              ) : v?.estado === "en_revision" ? (
                <Badge tono="alerta">En revisión</Badge>
              ) : (
                <Badge tono="alerta">Sin validar</Badge>
              )}
            </FilaDato>
          </dl>
          {!v ? (
            <BotonLink href="/identidad?volver=/colaborador/cartera?tab=datos" className="mt-4">
              Validar mi identidad
            </BotonLink>
          ) : null}
        </Panel>
      </Seccion>

      <Seccion titulo="Contratos que firmaste">
        <Panel className="p-5 sm:p-6">
          {firmas.length === 0 ? (
            <p className="text-tinta-suave">Todavía no firmaste ninguno.</p>
          ) : (
            <ul className="divide-y divide-borde">
              {firmas.map((f) => (
                <li key={`${f.proyectoId}-${f.hash}`} className="py-3 first:pt-0 last:pb-0">
                  <Link href={`/proyectos/${f.proyectoId}`} className="font-medium hover:text-marca">
                    {titulos.get(f.proyectoId)}
                  </Link>
                  <p className="text-sm text-tinta-suave">
                    {f.version} · firmado el {formatFecha(f.fecha)} · administra {f.fiduciario}
                  </p>
                  <p className="codigo mt-0.5 truncate text-sm text-tinta-tenue" title={f.hash}>
                    Huella {f.hash}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </Seccion>

      <AvisosFijos lado="colaborador" />
    </div>
  );
}
