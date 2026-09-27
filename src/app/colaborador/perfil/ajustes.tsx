"use client";

import { useState } from "react";
import { FilaAjuste } from "@/components/fila-ajuste";
import { Interruptor } from "@/components/ui/campos";
import { Badge, Panel, Seccion } from "@/components/ui/primitivos";

/**
 * Los avisos del colaborador. Dos y no diez: lo único que le pasa a su capital es
 * que un ciclo avanza o que una liquidación se paga.
 */
export function AjustesColaborador() {
  const [avisosCiclo, setAvisosCiclo] = useState(true);
  const [avisosLiquidacion, setAvisosLiquidacion] = useState(true);

  return (
    <Seccion titulo="Avisos">
      <Panel className="p-5 sm:p-6">
        <FilaAjuste
          titulo="Movimientos de un proyecto"
          descripcion="Cuando se completa el fondeo, arranca el ciclo o se cierra."
        >
          <Interruptor
            activo={avisosCiclo}
            onCambio={setAvisosCiclo}
            etiqueta="Avisos de movimientos de un proyecto"
          />
        </FilaAjuste>
        <FilaAjuste
          titulo="Acreditaciones y liquidaciones"
          descripcion="Cuando el banco acredita tu aporte o se paga una liquidación."
        >
          <Interruptor
            activo={avisosLiquidacion}
            onCambio={setAvisosLiquidacion}
            etiqueta="Avisos de acreditaciones y liquidaciones"
          />
        </FilaAjuste>
        <p className="mt-4 text-sm text-tinta-suave">
          <Badge tono="alerta">Prototipo</Badge>{" "}
          <span className="ml-1">Sin backend, la preferencia no se guarda.</span>
        </p>
      </Panel>
    </Seccion>
  );
}
