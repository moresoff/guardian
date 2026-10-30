import { redirect } from "next/navigation";

/** La documentación pasó a una pestaña de «Mi establecimiento». */
export default function DocumentacionRedirect() {
  redirect("/productor/establecimiento?tab=documentos");
}
