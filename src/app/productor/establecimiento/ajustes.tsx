"use client";

import { useState } from "react";
import { FilaAjuste } from "@/components/fila-ajuste";
import { Interruptor } from "@/components/ui/campos";
import { Panel, Seccion } from "@/components/ui/primitivos";

/**
 * Los avisos de la cuenta, y nada más. Soporte, sesiones, canal y baja salieron
 * del prototipo: no hacían nada sin backend y eran lo que más alargaba el perfil.
 * «Salir» sigue en la barra de arriba.
 */
export function AjustesCuenta() {
  const [avisosProyecto, setAvisosProyecto] = useState(true);
  const [avisosDocumentacion, setAvisosDocumentacion] = useState(true);

  return (
    <Seccion
      titulo="Avisos"
      descripcion="Guardian te escribe al correo cuando algo pasa con un proyecto o con tus papeles. Nada de promociones."
    >
      <Panel className="p-5 sm:p-6">
        <FilaAjuste
          titulo="Novedades de un proyecto"
          descripcion="Cuando se aprueba, se completa, se libera plata o se cierra el ciclo."
        >
          <Interruptor
            activo={avisosProyecto}
            onCambio={setAvisosProyecto}
            etiqueta="Avisos de novedades de un proyecto"
          />
        </FilaAjuste>
        <FilaAjuste
          titulo="Tus papeles"
          descripcion="Cuando Guardian termina de leer un papel o encuentra un dato que no coincide."
        >
          <Interruptor
            activo={avisosDocumentacion}
            onCambio={setAvisosDocumentacion}
            etiqueta="Avisos de tus papeles"
          />
        </FilaAjuste>
      </Panel>
    </Seccion>
  );
}
