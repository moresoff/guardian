import { notFound } from "next/navigation";
import { CabeceraPerfil } from "@/components/cabecera-perfil";
import { FilaDato } from "@/components/fila-ajuste";
import { Badge, Panel, Seccion } from "@/components/ui/primitivos";
import {
  COLABORADOR_DEMO,
  getAportesDeColaborador,
  getColaborador,
} from "@/lib/data";
import { formatFecha, formatNum } from "@/lib/format";
import { AjustesColaborador } from "./ajustes";

export const metadata = { title: "Mi perfil — Guardian" };

/**
 * El perfil del colaborador. Es corto a propósito: no tiene establecimiento, ni
 * RENSPA, ni documentación que subir. Lo único operativo es la cuenta donde se
 * le devuelve el capital, y los contratos que firmó.
 */
export default async function PerfilColaborador() {
  const colaborador = await getColaborador(COLABORADOR_DEMO);
  if (!colaborador) notFound();

  const aportes = await getAportesDeColaborador(colaborador.id);
  // Una versión de contrato por proyecto al que se adhirió. Se muestran todas: es
  // lo que firmó, y cada aporte se rige por la versión de su fecha.
  const contratos = [...new Set(aportes.map((a) => a.contratoVersion))];

  return (
    <div className="space-y-10">
      <CabeceraPerfil
        titulo={colaborador.nombre}
        subtitulo={`Colaborador desde ${formatFecha(colaborador.altaAt)}`}
        sello={
          colaborador.identidad ? (
            <Badge tono="ok">Identidad verificada</Badge>
          ) : (
            <Badge tono="alerta">Identidad sin verificar</Badge>
          )
        }
        foto={null}
        datos={[
          { etiqueta: "Proyectos", valor: formatNum(aportes.length) },
          { etiqueta: "CUIL", valor: colaborador.cuil, codigo: true },
        ]}
      />

      <Seccion titulo="Tus datos">
        <Panel className="p-5 sm:p-6">
          <dl>
            <FilaDato etiqueta="Correo">{colaborador.email}</FilaDato>
            <FilaDato etiqueta="Teléfono">{colaborador.telefono}</FilaDato>
            <FilaDato etiqueta="CUIL" codigo>
              {colaborador.cuil}
            </FilaDato>
            <FilaDato
              etiqueta="Identidad"
              ayuda={
                colaborador.identidad
                  ? `${colaborador.identidad.metodo}, el ${formatFecha(colaborador.identidad.fecha)}`
                  : "Hace falta para adherirse a un proyecto."
              }
            >
              {colaborador.identidad ? "Verificada" : "Sin verificar"}
            </FilaDato>
          </dl>
        </Panel>
      </Seccion>

      <Seccion
        titulo="Dónde se te devuelve"
        descripcion="La cuenta donde se acreditan las liquidaciones. Tiene que estar a tu nombre."
      >
        <Panel className="p-5 sm:p-6">
          <dl>
            <FilaDato etiqueta="CBU" codigo>
              {colaborador.cbuDevolucion}
            </FilaDato>
            <FilaDato etiqueta="Alias" codigo>
              {colaborador.aliasDevolucion}
            </FilaDato>
          </dl>
          <p className="mt-4 text-sm text-tinta-suave">
            <Badge tono="alerta">Prototipo</Badge>{" "}
            <span className="ml-1">El CBU es de demostración y no existe.</span>
          </p>
        </Panel>
      </Seccion>

      {contratos.length > 0 ? (
        <Seccion titulo="Contratos que aceptaste">
          <Panel className="p-5 sm:p-6">
            <dl>
              {contratos.map((c) => (
                <FilaDato key={c} etiqueta={c}>
                  Aceptado
                </FilaDato>
              ))}
            </dl>
          </Panel>
        </Seccion>
      ) : null}

      <AjustesColaborador />
    </div>
  );
}
