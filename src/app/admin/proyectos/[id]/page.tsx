import { redirect } from "next/navigation";

/** La revisión ahora se abre dentro de la cola. */
export default async function Redireccion({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin?proyecto=${id}`);
}
