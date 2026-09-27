"use client";

import { useState } from "react";
import { Campo } from "@/components/ui/campos";
import { Modal } from "@/components/ui/modal";
import { Aviso, Badge, Boton } from "@/components/ui/primitivos";
import { formatArs } from "@/lib/format";

/**
 * La adhesión de un colaborador a un proyecto.
 *
 * Termina en una orden de suscripción y en las instrucciones para transferir, y
 * ahí se detiene a propósito: Guardian no mueve dinero. El aporte existe cuando
 * el banco lo acredita en la cuenta del fideicomiso y la conciliación lo vincula
 * a esta orden. Por eso no hay ningún botón que parezca ejecutar una
 * transferencia, ni un comprobante que la dé por hecha.
 */
export function Adherir({
  proyectoId,
  titulo,
  contratoVersion,
  habilitado,
  motivoBloqueo,
}: {
  proyectoId: string;
  titulo: string;
  contratoVersion: string;
  habilitado: boolean;
  motivoBloqueo?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [monto, setMonto] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [orden, setOrden] = useState<string | null>(null);
  const [intentado, setIntentado] = useState(false);

  const montoNum = Number(monto) || 0;

  const confirmar = () => {
    if (montoNum <= 0 || !acepta) {
      setIntentado(true);
      if (montoNum <= 0) document.getElementById("adhesion-monto")?.focus();
      return;
    }
    // En la demo el número se arma acá; con backend lo emite el servidor, que es
    // el único que puede garantizar que no se repita.
    setOrden(`GDN-2026-${String(Math.floor(Math.random() * 900000) + 100000)}`);
  };

  const cerrar = () => {
    setAbierto(false);
    setOrden(null);
    setIntentado(false);
  };

  if (!habilitado) {
    return (
      <div>
        <Boton className="w-full" disabled>
          Adhesión no disponible
        </Boton>
        {motivoBloqueo ? (
          <p className="mt-2 text-sm text-tinta-suave">{motivoBloqueo}</p>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <Boton className="w-full" onClick={() => setAbierto(true)}>
        Adherir al proyecto
      </Boton>

      <Modal
        abierto={abierto}
        titulo={orden ? "Orden de suscripción creada" : "Adherir al proyecto"}
        onCerrar={cerrar}
        pie={
          orden ? (
            <Boton onClick={cerrar}>Listo</Boton>
          ) : (
            <>
              <Boton variante="secundario" onClick={cerrar}>
                Cancelar
              </Boton>
              <Boton onClick={confirmar}>Crear la orden</Boton>
            </>
          )
        }
      >
        {orden ? (
          <div className="space-y-5">
            <p className="text-tinta-suave">
              Tu orden por {formatArs(montoNum)} en {titulo} quedó registrada. Transferí el
              importe con el número de orden como referencia.
            </p>

            <div className="rounded-lg border border-borde bg-superficie-2 p-4">
              <p className="rotulo text-tinta-tenue">Número de orden</p>
              <p className="codigo mt-1 text-lg font-medium">{orden}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <Fila etiqueta="Titular" valor="Fideicomiso del proyecto (cuenta de demostración)" />
                <Fila etiqueta="CBU" valor="0000000000000000000000" codigo />
                <Fila etiqueta="Importe" valor={formatArs(montoNum)} />
                <Fila etiqueta="Referencia" valor={orden} codigo />
              </dl>
            </div>

            <Aviso tono="alerta" titulo="Datos bancarios de demostración">
              La cuenta de arriba es ficticia. Cada serie tiene su propia cuenta, separada
              del patrimonio de Guardian.
            </Aviso>

            <Aviso titulo="El aporte queda pendiente hasta que el banco lo acredite">
              Un comprobante no acredita nada: acredita el movimiento en la cuenta. Si el
              importe no coincide, la diferencia sigue pendiente.
            </Aviso>

            <p className="text-sm text-tinta-suave">
              <Badge tono="alerta">Prototipo</Badge>{" "}
              <span className="ml-1">
                Sin backend, la orden no queda guardada al salir de la pantalla.
              </span>
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <Campo
              id="adhesion-monto"
              etiqueta="Cuánto querés aportar"
              ayuda="El aporte y la devolución son en pesos."
              inputMode="numeric"
              className="tabular"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              error={intentado && montoNum <= 0 ? "Falta el importe." : undefined}
            />

            <div className="rounded-lg border border-borde p-4">
              <label className="flex min-h-11 items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 size-5 shrink-0"
                  checked={acepta}
                  onChange={(e) => setAcepta(e.target.checked)}
                />
                <span className="text-sm">
                  Leí y acepto el contrato de adhesión al fideicomiso.
                  <span className="mt-0.5 block text-tinta-suave">
                    {contratoVersion}. Queda registrada la versión y la fecha.
                  </span>
                </span>
              </label>
              {intentado && !acepta ? (
                <p className="mt-2 text-sm font-medium text-error">
                  Hace falta aceptar el contrato para crear la orden.
                </p>
              ) : null}
            </div>

            <Aviso titulo="Qué pasa después">
              Se crea una orden con su número. Transferís con ese número como referencia y
              el aporte figura pendiente hasta que el banco lo acredite.
            </Aviso>

            <p className="text-sm text-tinta-suave">
              Proyecto <span className="codigo">{proyectoId}</span>.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}

function Fila({
  etiqueta,
  valor,
  codigo = false,
}: {
  etiqueta: string;
  valor: string;
  codigo?: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4">
      <dt className="text-tinta-suave">{etiqueta}</dt>
      <dd className={codigo ? "codigo" : "tabular"}>{valor}</dd>
    </div>
  );
}
