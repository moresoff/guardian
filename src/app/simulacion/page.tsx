import { permanentRedirect } from "next/navigation";

/** «Probá un ciclo» se sacó: quien tenía el enlace va al simulador. */
export default function SimulacionPage() {
  permanentRedirect("/simulador");
}
