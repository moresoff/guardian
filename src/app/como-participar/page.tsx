import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Contacto,
  Franja,
  PortadaInterna,
  Rotulo,
  TituloFranja,
} from "@/components/pagina-publica";

export const metadata = { title: "Cómo participar | Guardian" };

/** Los mismos pasos, con los mismos nombres, que se recorren adentro. */
const PASOS = [
  {
    titulo: "Creá tu cuenta",
    texto: "Elegí si querés colaborar con un ciclo o publicar el tuyo, y completá tus datos.",
  },
  {
    titulo: "Validá tu identidad",
    texto: "Tu DNI, una foto de tu cara y la cuenta bancaria a tu nombre. Sin este paso no se firma nada.",
  },
  {
    titulo: "Elegí un proyecto",
    texto:
      "Cada uno muestra al productor, el establecimiento con su RENSPA, el lote y la documentación ya revisada.",
  },
  {
    titulo: "Firmá el contrato",
    texto:
      "Antes de firmar ves quién administra el proyecto y cada cláusula, en palabras simples. Firmás con un código.",
  },
  {
    titulo: "Seguí el ciclo",
    texto: "Pesadas, sanidad y movimientos del lote, hasta el romaneo del frigorífico al cierre.",
  },
];

/** Lo que conviene saber antes, sin ceremonia. El detalle está en la ficha. */
const ANTES = [
  {
    titulo: "El destino está escrito",
    texto:
      "Cada proyecto dice en qué se usa lo aportado y cómo se reparte. Salir de ahí es incumplimiento.",
  },
  {
    titulo: "El resultado sale de la venta",
    texto:
      "Lo fija el romaneo del frigorífico y puede ser distinto de lo esperado. Guardian conecta y verifica la documentación.",
  },
  {
    titulo: "Cada proyecto va por separado",
    texto: "Tiene sus propias condiciones, su propia cuenta y su propia rendición.",
  },
  {
    titulo: "Rendición de cuentas",
    texto: "Gastos y pesadas mientras corre, y al cierre con el romaneo.",
  },
];

const PREGUNTAS = [
  {
    pregunta: "¿Qué papeles acompañan al lote?",
    respuesta:
      "Según el ciclo y la situación de los animales: RENSPA, DT-e, listado de caravanas, boleto de compra-venta y romaneo al cierre.",
  },
  {
    pregunta: "¿Qué significa que los datos coincidan?",
    respuesta:
      "Que no se encontró una diferencia en los campos comparados. Confirmar que el comprobante es auténtico requiere un control aparte por el canal oficial.",
  },
  {
    pregunta: "¿Qué puedo hacer en esta demostración?",
    respuesta:
      "Crear una cuenta de cualquiera de los dos lados y recorrer el circuito completo con datos de ejemplo. Las firmas y la validación de identidad son simuladas y no tienen efecto legal.",
  },
];

export default function ComoParticiparPage() {
  return (
    <>
      <PortadaInterna
        foto="/guardian/proyecto.jpg"
        rotulo="Cómo participar"
        titulo={
          <>
            Conocé el lote. <em className="font-medium">Seguí su historia.</em>
          </>
        }
        texto="Un productor, un establecimiento y un lote concreto. Estos son los pasos, de la cuenta al cierre."
        accion={{ href: "/registro", label: "Crear mi cuenta" }}
      />

      <Franja id="pasos">
        <Rotulo>El recorrido</Rotulo>
        <TituloFranja>Cinco pasos, de la cuenta al cierre</TituloFranja>
        <ol className="mt-6 grid gap-3 md:grid-cols-5">
          {PASOS.map((p, i) => (
            <li
              key={p.titulo}
              className="flex gap-3 rounded-2xl border border-borde bg-superficie p-4 shadow-[var(--sombra-baja)] md:block md:p-5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-marca text-sm font-semibold text-marca-contraste">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold tracking-tight md:mt-3">{p.titulo}</h3>
                <p className="mt-1 text-sm text-tinta-suave">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link
          href="/registro"
          className="mt-6 inline-flex min-h-11 items-center gap-2 font-medium text-marca underline underline-offset-4"
        >
          Empezar por la cuenta
          <ArrowRight className="size-5" strokeWidth={1.75} aria-hidden />
        </Link>
      </Franja>

      <Franja tono="bg-superficie-2">
        <TituloFranja>Antes de participar</TituloFranja>
        <dl className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {ANTES.map((c) => (
            <div key={c.titulo} className="border-t border-borde-fuerte pt-3">
              <dt className="font-semibold tracking-tight">{c.titulo}</dt>
              <dd className="mt-1 text-tinta-suave">{c.texto}</dd>
            </div>
          ))}
        </dl>
      </Franja>

      <Franja>
        <Rotulo>Preguntas frecuentes</Rotulo>
        <TituloFranja>Lo que conviene saber</TituloFranja>
        <div className="mt-4 max-w-3xl divide-y divide-borde">
          {PREGUNTAS.map((q) => (
            <details key={q.pregunta} className="group py-1">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-2 font-semibold tracking-tight">
                {q.pregunta}
                <span className="text-xl text-marca transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="pb-3 text-tinta-suave">{q.respuesta}</p>
            </details>
          ))}
        </div>
      </Franja>

      <Contacto />
    </>
  );
}
