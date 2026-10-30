"use client";

import Link from "next/link";
import { useState } from "react";
import { Campo, CampoLargo, Seleccion } from "@/components/ui/campos";
import { Modal } from "@/components/ui/modal";
import { Aviso, Badge, Boton, Panel, TituloBloque } from "@/components/ui/primitivos";
import {
  ESTADO_GARANTIA_LABEL,
  GARANTIA_DESCRIPCION,
  GARANTIA_LABEL,
  formatFecha,
  formatArs,
} from "@/lib/format";
import type { EstadoGarantia, TipoGarantia } from "@/lib/types";

export interface GarantiaEnPantalla {
  id: string;
  tipo: TipoGarantia;
  identificacion: string;
  descripcion: string;
  valuacionArs: number;
  cupoProyectos: number;
  vigenciaHasta: string;
  estado: EstadoGarantia;
  usadaEn: { id: string; titulo: string }[];
}

const TONO_ESTADO = {
  vigente: "ok",
  sin_verificar: "alerta",
  vencida: "error",
} as const;

/**
 * Las garantías del productor, configuradas una vez y reusadas entre proyectos.
 *
 * Están acá y no dentro del alta porque una hipoteca no se rehace por proyecto:
 * se constituye, se verifica y después se elige de una lista. El cupo es lo que
 * evita que el mismo bien aparezca respaldando diez proyectos a la vez, cada uno
 * creyendo tenerlo entero.
 */
export function Garantias({ garantias }: { garantias: GarantiaEnPantalla[] }) {
  const [configurando, setConfigurando] = useState(false);
  const [aEliminar, setAEliminar] = useState<GarantiaEnPantalla | null>(null);
  /** Las dadas de baja en esta sesión. Sin backend, no sobreviven a la recarga. */
  const [dadasDeBaja, setDadasDeBaja] = useState<string[]>([]);

  const visibles = garantias.filter((g) => !dadasDeBaja.includes(g.id));

  return (
    <section id="garantias" className="scroll-mt-24">
      {/* El botón va en la acción del título y no en una fila propia: alineado al
          pie de la descripción quedaba pegado a la primera tarjeta, como si fuera
          parte de la hipoteca. */}
      <TituloBloque
        descripcion="Lo que se ejecuta si un ciclo no se cumple. No es lo mismo que la documentación del lote: el DT-e y el romaneo muestran qué hay y de quién es, y con eso no se cobra nada."
        accion={<Boton onClick={() => setConfigurando(true)}>Configurar garantía</Boton>}
      >
        Mis garantías
      </TituloBloque>

      {visibles.length === 0 ? (
        <Aviso titulo="Todavía no configuraste ninguna garantía">
          Sin garantía, un proyecto solo puede ofrecer el lote y el resultado del ciclo.
        </Aviso>
      ) : (
        <ul className="space-y-4">
          {visibles.map((g) => {
            const libre = Math.max(0, g.cupoProyectos - g.usadaEn.length);
            return (
              <li key={g.id}>
                <Panel className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight">
                        {GARANTIA_LABEL[g.tipo]}
                      </h3>
                      <p className="codigo mt-1 text-sm text-tinta-suave">
                        {g.identificacion}
                      </p>
                    </div>
                    <Badge tono={TONO_ESTADO[g.estado]}>
                      {ESTADO_GARANTIA_LABEL[g.estado]}
                    </Badge>
                  </div>

                  <p className="mt-3 text-sm text-tinta-suave">{g.descripcion}</p>

                  <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-3">
                    <div>
                      <dt className="rotulo text-tinta-tenue">Valuación</dt>
                      <dd className="tabular mt-1 text-sm font-medium">
                        {formatArs(g.valuacionArs)}
                      </dd>
                    </div>
                    <div>
                      <dt className="rotulo text-tinta-tenue">Vigencia</dt>
                      <dd className="tabular mt-1 text-sm font-medium">
                        Hasta el {formatFecha(g.vigenciaHasta)}
                      </dd>
                    </div>
                    <div>
                      <dt className="rotulo text-tinta-tenue">Cupo</dt>
                      <dd className="tabular mt-1 text-sm font-medium">
                        {g.usadaEn.length} de {g.cupoProyectos} proyectos
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 border-t border-borde pt-4">
                    {g.usadaEn.length === 0 ? (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-tinta-suave">
                          Libre: no está respaldando ningún proyecto vivo.
                        </p>
                        <Boton variante="peligro" onClick={() => setAEliminar(g)}>
                          Dar de baja
                        </Boton>
                      </div>
                    ) : (
                      /* La que está respaldando un proyecto vivo no se da de baja:
                         el botón está pero deshabilitado, con el motivo al lado.
                         Sacarlo de la pantalla obligaría a adivinar por qué esta
                         tarjeta no tiene la acción que tienen las otras. */
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-tinta-suave">
                          Respalda{" "}
                          {g.usadaEn.map((p, i) => (
                            <span key={p.id}>
                              {i > 0 ? " y " : ""}
                              <Link
                                href={`/productor/proyectos/${p.id}`}
                                className="underline underline-offset-2 hover:text-marca"
                              >
                                {p.titulo}
                              </Link>
                            </span>
                          ))}
                          .{" "}
                          {libre === 0
                            ? "Sin cupo: para usarla en otro proyecto tiene que cerrar uno de estos."
                            : `Queda cupo para ${libre} proyecto más.`}
                        </p>
                        <Boton variante="peligro" disabled>
                          Dar de baja
                        </Boton>
                      </div>
                    )}
                  </div>
                </Panel>
              </li>
            );
          })}
        </ul>
      )}

      <FormularioGarantia
        abierto={configurando}
        onCerrar={() => setConfigurando(false)}
      />

      <Modal
        abierto={aEliminar !== null}
        titulo="Dar de baja la garantía"
        onCerrar={() => setAEliminar(null)}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setAEliminar(null)}>
              Cancelar
            </Boton>
            <Boton
              variante="peligro"
              onClick={() => {
                if (aEliminar) setDadasDeBaja((b) => [...b, aEliminar.id]);
                setAEliminar(null);
              }}
            >
              Dar de baja
            </Boton>
          </>
        }
      >
        {aEliminar ? (
          <>
            <p className="text-tinta-suave">
              {GARANTIA_LABEL[aEliminar.tipo]},{" "}
              <span className="codigo">{aEliminar.identificacion}</span>. Deja de estar
              disponible para proyectos nuevos.
            </p>
            <div className="mt-4">
              <Aviso titulo="La baja es de la plataforma, no del registro">
                Sacarla de acá no levanta la hipoteca, la prenda ni el aval: eso se
                cancela donde se constituyó. Los proyectos cerrados que respaldó siguen
                mostrándola en su historial.
              </Aviso>
            </div>
            <p className="mt-4 text-sm text-tinta-suave">
              <Badge tono="alerta">Prototipo</Badge>{" "}
              <span className="ml-1">
                Sin backend, la garantía vuelve a aparecer al recargar.
              </span>
            </p>
          </>
        ) : null}
      </Modal>
    </section>
  );
}

const TIPOS: TipoGarantia[] = [
  "hipoteca",
  "prenda_rodeo",
  "aval_establecimiento",
  "cesion_derechos",
  "fianza_personal",
];

function FormularioGarantia({
  abierto,
  onCerrar,
}: {
  abierto: boolean;
  onCerrar: () => void;
}) {
  const [tipo, setTipo] = useState<TipoGarantia>("hipoteca");
  const [identificacion, setIdentificacion] = useState("");
  const [valuacion, setValuacion] = useState("");
  const [vigencia, setVigencia] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cupo, setCupo] = useState("2");

  const completo =
    identificacion.trim() !== "" && valuacion.trim() !== "" && vigencia.trim() !== "";

  return (
    <Modal
      abierto={abierto}
      titulo="Configurar una garantía"
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton disabled={!completo} onClick={onCerrar}>
            Guardar garantía
          </Boton>
        </>
      }
    >
      <div className="space-y-5">
        <Seleccion
          etiqueta="Tipo de garantía"
          ayuda={GARANTIA_DESCRIPCION[tipo]}
          opciones={TIPOS.map((t) => ({ valor: t, label: GARANTIA_LABEL[t] }))}
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoGarantia)}
        />

        <Campo
          etiqueta="Cómo se individualiza el bien"
          ayuda="Matrícula, partida, número de registro prendario o de la cesión. Sin esto, la garantía no se puede ejecutar."
          value={identificacion}
          onChange={(e) => setIdentificacion(e.target.value)}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Campo
            etiqueta="Valuación, en pesos"
            ayuda="Cuánto vale el bien afectado."
            inputMode="numeric"
            className="tabular"
            value={valuacion}
            onChange={(e) => setValuacion(e.target.value)}
          />
          <Campo
            etiqueta="Vigencia hasta"
            type="date"
            className="tabular"
            value={vigencia}
            onChange={(e) => setVigencia(e.target.value)}
          />
        </div>

        <Seleccion
          etiqueta="Cupo de proyectos simultáneos"
          ayuda="Cuántos proyectos vivos puede respaldar a la vez. Un ciclo cerrado libera el cupo."
          opciones={["1", "2", "3"]}
          value={cupo}
          onChange={(e) => setCupo(e.target.value)}
        />

        <CampoLargo
          etiqueta="Qué cubre"
          ayuda="Con tus palabras, para que el colaborador sepa qué está mirando."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />

        <Aviso titulo="Guardian la verifica antes de que respalde un proyecto">
          Se contrasta el instrumento contra el registro que corresponda. Hasta que eso
          pase, la garantía figura como declarada y no como comprobada.
        </Aviso>

        <p className="text-sm text-tinta-suave">
          <Badge tono="alerta">Prototipo</Badge>{" "}
          <span className="ml-1">
            Sin backend, la garantía no queda guardada al cerrar la pantalla.
          </span>
        </p>
      </div>
    </Modal>
  );
}
