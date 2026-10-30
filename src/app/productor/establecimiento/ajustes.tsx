"use client";

import { useState } from "react";
import { FilaAjuste } from "@/components/fila-ajuste";
import { Interruptor, Seleccion } from "@/components/ui/campos";
import { Modal } from "@/components/ui/modal";
import { Aviso, Badge, Boton, Panel, Seccion } from "@/components/ui/primitivos";

/**
 * Los ajustes de la aplicación, que no son del establecimiento sino de la
 * cuenta: qué se avisa, quién puede entrar y cómo se sale.
 *
 * Están al final del perfil a propósito. Lo que define al productor va arriba;
 * esto se toca una vez y no se vuelve a mirar.
 */
export function AjustesCuenta({ proyectosVivos }: { proyectosVivos: number }) {
  const [avisosProyecto, setAvisosProyecto] = useState(true);
  const [avisosDocumentacion, setAvisosDocumentacion] = useState(true);
  const [resumen, setResumen] = useState(false);
  const [canal, setCanal] = useState("Correo");
  const [soporte, setSoporte] = useState(false);
  const [cerrandoSesiones, setCerrandoSesiones] = useState(false);
  const [dandoBaja, setDandoBaja] = useState(false);

  return (
    <div className="space-y-10">
      <Seccion
        titulo="Avisos"
        descripcion="Guardian te escribe cuando algo pasa con tu capital o con tus papeles. Nada de novedades ni promociones."
      >
        <Panel className="p-5 sm:p-6">
          <FilaAjuste
            titulo="Movimientos de un proyecto"
            descripcion="Cuando se aprueba, se completa el fondeo, se libera capital o se cierra el ciclo."
          >
            <Interruptor
              activo={avisosProyecto}
              onCambio={setAvisosProyecto}
              etiqueta="Avisos de movimientos de un proyecto"
            />
          </FilaAjuste>
          <FilaAjuste
            titulo="Documentación y discrepancias"
            descripcion="Cuando Guardian termina de leer un documento o encuentra una cifra que no cierra."
          >
            <Interruptor
              activo={avisosDocumentacion}
              onCambio={setAvisosDocumentacion}
              etiqueta="Avisos de documentación y discrepancias"
            />
          </FilaAjuste>
          <FilaAjuste
            titulo="Resumen semanal"
            descripcion="Un correo los lunes con el estado de todos tus ciclos abiertos."
          >
            <Interruptor
              activo={resumen}
              onCambio={setResumen}
              etiqueta="Resumen semanal"
            />
          </FilaAjuste>
          <FilaAjuste
            titulo="Por dónde te escribimos"
            descripcion="WhatsApp todavía no está: es lo próximo que se conecta."
          >
            <Seleccion
              etiqueta="Canal de aviso"
              className="min-w-40"
              opciones={[
                "Correo",
                { valor: "WhatsApp", label: "WhatsApp (todavía no)", disabled: true },
              ]}
              value={canal}
              onChange={(e) => setCanal(e.target.value)}
            />
          </FilaAjuste>
        </Panel>
      </Seccion>

      <Seccion
        titulo="Tu cuenta"
        descripcion="Quién puede entrar y desde dónde."
      >
        <Panel className="p-5 sm:p-6">
          <FilaAjuste
            titulo="Acceso del equipo de soporte"
            descripcion={
              soporte
                ? "Habilitado por 7 días. Guardian puede ver tu cuenta como la ves vos, sin poder publicar ni retirar capital."
                : "Si lo activás, Guardian puede ver tu cuenta durante 7 días para ayudarte con un problema. Nunca puede publicar un proyecto ni mover capital."
            }
          >
            <Interruptor
              activo={soporte}
              onCambio={setSoporte}
              etiqueta="Acceso del equipo de soporte"
            />
          </FilaAjuste>
          <FilaAjuste
            titulo="Cerrar sesión en todos los dispositivos"
            descripcion="Cierra las demás sesiones abiertas y deja solo esta."
          >
            <Boton variante="secundario" onClick={() => setCerrandoSesiones(true)}>
              Cerrar las demás
            </Boton>
          </FilaAjuste>
          <FilaAjuste
            titulo="Dar de baja la cuenta"
            descripcion={
              proyectosVivos > 0
                ? `No se puede mientras tengas capital de colaboradores en juego: ${proyectosVivos} ${
                    proyectosVivos === 1 ? "proyecto vivo" : "proyectos vivos"
                  }. Primero hay que cerrar los ciclos y liquidar.`
                : "No tenés ciclos abiertos, así que se puede dar de baja. Los documentos de los ciclos cerrados se conservan por obligación legal."
            }
          >
            <Boton
              variante="peligro"
              disabled={proyectosVivos > 0}
              onClick={() => setDandoBaja(true)}
            >
              Dar de baja
            </Boton>
          </FilaAjuste>
        </Panel>
      </Seccion>

      <Modal
        abierto={cerrandoSesiones}
        titulo="Cerrar las demás sesiones"
        onCerrar={() => setCerrandoSesiones(false)}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setCerrandoSesiones(false)}>
              Cancelar
            </Boton>
            <Boton onClick={() => setCerrandoSesiones(false)}>Cerrar las demás</Boton>
          </>
        }
      >
        <p className="text-tinta-suave">
          Vas a seguir con la sesión de este dispositivo. Cualquier otra —el teléfono, la
          computadora del campo, una que hayas dejado abierta— va a pedir la contraseña de
          nuevo.
        </p>
        <p className="mt-4 text-sm text-tinta-suave">
          <Badge tono="alerta">Prototipo</Badge>{" "}
          <span className="ml-1">Sin backend no hay sesiones que cerrar.</span>
        </p>
      </Modal>

      <Modal
        abierto={dandoBaja}
        titulo="Dar de baja la cuenta"
        onCerrar={() => setDandoBaja(false)}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setDandoBaja(false)}>
              Cancelar
            </Boton>
            <Boton variante="peligro" onClick={() => setDandoBaja(false)}>
              Dar de baja
            </Boton>
          </>
        }
      >
        <p className="text-tinta-suave">
          Se cierra tu acceso y tus proyectos dejan de estar en el catálogo.
        </p>
        <div className="mt-4">
          <Aviso tono="alerta" titulo="Lo que no se borra">
            Los documentos y los resultados de los ciclos que ya cerraste se conservan:
            respaldan lo que se le pagó a cada colaborador y hay plazos legales que cumplir.
          </Aviso>
        </div>
        <p className="mt-4 text-sm text-tinta-suave">
          <Badge tono="alerta">Prototipo</Badge>{" "}
          <span className="ml-1">Sin backend, la baja no se ejecuta.</span>
        </p>
      </Modal>
    </div>
  );
}
