import { BotonLink } from "@/components/ui/primitivos";

/** Lo que se ve en vez de un contrato cuando todavía falta validar la identidad. */
export function FaltaIdentidad({ volver }: { volver: string }) {
  return (
    <section className="rounded-2xl border border-borde bg-superficie p-5 sm:p-6">
      <h2 className="text-xl font-semibold tracking-tight">Primero, validá tu identidad</h2>
      <p className="mt-2 text-base text-tinta-suave">
        Para firmar un contrato necesitamos saber que sos vos. Te lleva unos minutos: tus datos,
        una foto del DNI y una selfie.
      </p>
      <BotonLink href={`/identidad?volver=${encodeURIComponent(volver)}`} className="mt-5 min-h-12 w-full sm:w-auto">
        Validar mi identidad
      </BotonLink>
    </section>
  );
}
