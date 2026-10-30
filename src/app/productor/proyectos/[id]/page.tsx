import { redirect } from "next/navigation";

/** La ficha del productor ahora vive en la dirección del proyecto. */
export default async function Redireccion({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/proyectos/${id}`);
}
