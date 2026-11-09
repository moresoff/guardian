import { Bell } from "lucide-react";
import { Panel, Seccion } from "@/components/ui/primitivos";

/**
 * Los avisos que manda Guardian. El trabajo los fija en tres momentos y no
 * se eligen: son la información que cada parte necesita sobre su lote.
 */
const AVISOS = {
  colaborador: [
    ["La compra de la hacienda", "Cuando el fiduciario le paga al vendedor, con la constancia de en qué se usó tu aporte."],
    ["El informe del mes", "El peso del lote, con lo que se desvió de lo proyectado."],
    ["La liquidación", "Al cierre: lo que se vendió, los gastos, las comisiones y lo que te toca."],
  ],
  productor: [
    ["La revisión de tu proyecto", "Cuando Guardian lo publica, o si lo rechaza, con el motivo."],
    ["La compra de la hacienda", "Cuando el fiduciario le paga al vendedor y empieza el ciclo."],
    ["La liquidación", "Al cierre: lo que se vendió, los gastos, las comisiones y lo que te toca."],
  ],
} as const;

export function AvisosFijos({ lado }: { lado: "productor" | "colaborador" }) {
  return (
    <Seccion titulo="Te avisamos" descripcion="En tres momentos del ciclo, por la app y por correo.">
      <Panel className="p-5 sm:p-6">
        <ul className="space-y-4">
          {AVISOS[lado].map(([t, d]) => (
            <li key={t} className="flex gap-3">
              <Bell className="mt-0.5 size-5 shrink-0 text-marca" strokeWidth={1.75} aria-hidden />
              <span>
                <span className="block font-medium">{t}</span>
                <span className="block text-sm text-tinta-suave">{d}</span>
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </Seccion>
  );
}
