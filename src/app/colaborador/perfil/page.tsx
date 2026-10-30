import { redirect } from "next/navigation";

/** Los datos del colaborador pasaron a una pestaña de «Mi cartera». */
export default function PerfilColaboradorRedirect() {
  redirect("/colaborador/cartera?tab=datos");
}
