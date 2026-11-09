import { GuardianWebsite } from "@/components/GuardianWebsite";
import { Simulador } from "@/components/simulador";

export const metadata = {
  title: "Probá un ciclo de ejemplo | Guardian",
  description:
    "Recorré un ciclo con papeles de ejemplo ya cargados: la lectura, los controles y cómo sigue el proyecto. Sin cuenta.",
};

export default function SimulacionPage() {
  return (
    <GuardianWebsite section="simulation">
      <Simulador />
    </GuardianWebsite>
  );
}
