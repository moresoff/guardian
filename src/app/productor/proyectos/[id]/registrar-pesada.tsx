"use client";

import { useState } from "react";
import { Campo, CampoLargo } from "@/components/ui/campos";
import { Modal } from "@/components/ui/modal";
import { Aviso, Badge, Boton } from "@/components/ui/primitivos";
import { formatNum } from "@/lib/format";

/**
 * Cargar una pesada del lote.
 *
 * Pide poco a propósito: peso promedio, cabezas y lo gastado desde la anterior.
 * Es un formulario que alguien va a completar parado en el corral, con el
 * teléfono en una mano, y cada campo de más es una pesada que no se carga.
 *
 * El peso es el promedio de la tropa, que es como sale de la balanza: nadie pesa
 * ciento veinte novillos de a uno.
 */
export function RegistrarPesada({
  cabezasVivas,
  pesoAnteriorKg,
}: {
  cabezasVivas: number;
  pesoAnteriorKg: number;
}) {
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState("");
  const [peso, setPeso] = useState("");
  const [cabezas, setCabezas] = useState(String(cabezasVivas));
  const [gasto, setGasto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [nota, setNota] = useState("");
  const [guardada, setGuardada] = useState(false);
  /** Si ya se intentó guardar. Hasta entonces, ningún campo se pinta de rojo. */
  const [intentado, setIntentado] = useState(false);

  const pesoNum = Number(peso) || 0;
  const cabezasNum = Number(cabezas) || 0;

  /** Un lote que adelgaza no es imposible, pero casi siempre es un dato mal tipeado. */
  const bajoDePeso = pesoNum > 0 && pesoNum < pesoAnteriorKg;
  const masCabezas = cabezasNum > cabezasVivas;

  const huecos = [
    fecha === "" ? "pesada-fecha" : null,
    pesoNum <= 0 ? "pesada-peso" : null,
    cabezasNum <= 0 ? "pesada-cabezas" : null,
  ].filter((x): x is string => x !== null);

  /**
   * Guardar siempre se puede apretar. Si falta algo, el campo lo dice y el foco
   * cae ahí: un botón gris obliga a adivinar cuál de los seis campos es.
   */
  const intentarGuardar = () => {
    if (huecos.length === 0) {
      setGuardada(true);
      return;
    }
    setIntentado(true);
    document.getElementById(huecos[0])?.focus();
  };

  const cerrar = () => {
    setAbierto(false);
    setGuardada(false);
    setIntentado(false);
  };

  return (
    <>
      <Boton variante="secundario" onClick={() => setAbierto(true)}>
        Registrar pesada
      </Boton>

      <Modal
        abierto={abierto}
        titulo={guardada ? "Pesada registrada" : "Registrar una pesada"}
        onCerrar={cerrar}
        pie={
          guardada ? (
            <Boton onClick={cerrar}>Listo</Boton>
          ) : (
            <>
              <Boton variante="secundario" onClick={cerrar}>
                Cancelar
              </Boton>
              <Boton onClick={intentarGuardar}>Guardar pesada</Boton>
            </>
          )
        }
      >
        {guardada ? (
          <>
            <p className="text-tinta-suave">
              Queda en el seguimiento del proyecto y el colaborador la ve enseguida: es la
              misma pantalla para los dos.
            </p>
            <p className="mt-4 text-sm text-tinta-suave">
              <Badge tono="alerta">Prototipo</Badge>{" "}
              <span className="ml-1">
                Sin backend, la pesada no queda guardada al salir de la pantalla.
              </span>
            </p>
          </>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Campo
                id="pesada-fecha"
                etiqueta="Fecha de la pesada"
                type="date"
                className="tabular"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                error={intentado && fecha === "" ? "Falta la fecha." : undefined}
              />
              <Campo
                id="pesada-peso"
                etiqueta="Peso promedio (kg)"
                ayuda={`El promedio de la tropa. En la anterior fue ${formatNum(
                  pesoAnteriorKg,
                )} kg.`}
                inputMode="decimal"
                className="tabular"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                error={
                  bajoDePeso
                    ? "Menos que la pesada anterior. Revisá el número."
                    : intentado && pesoNum <= 0
                      ? "Falta el peso promedio del lote."
                      : undefined
                }
              />
              <Campo
                id="pesada-cabezas"
                etiqueta="Cabezas vivas"
                ayuda="Cuántas quedan hoy en el lote."
                inputMode="numeric"
                className="tabular"
                value={cabezas}
                onChange={(e) => setCabezas(e.target.value)}
                error={
                  masCabezas
                    ? `El lote tenía ${formatNum(
                        cabezasVivas,
                      )}. Un lote no suma cabezas en el ciclo.`
                    : intentado && cabezasNum <= 0
                      ? "Falta cuántas cabezas quedan."
                      : undefined
                }
              />
              <Campo
                etiqueta="Gasto del período, en pesos"
                ayuda="Lo que se gastó desde la pesada anterior."
                inputMode="numeric"
                className="tabular"
                value={gasto}
                onChange={(e) => setGasto(e.target.value)}
              />
            </div>

            <Campo
              etiqueta="En qué se gastó"
              ayuda="Ración, sanidad, mano de obra, flete."
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
            />

            <CampoLargo
              etiqueta="Alguna observación"
              ayuda="Opcional. Si hubo bajas, clima o un cambio de ración, escribilo acá: es lo que después explica un número raro."
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />

            <Aviso titulo="Esto lo ve el colaborador">
              El seguimiento es la misma pantalla para los dos. Cargá lo que pasó, incluso
              cuando no sea la mejor noticia: una baja avisada a tiempo es parte del
              trato, una baja que aparece recién en el romaneo es un problema.
            </Aviso>
          </div>
        )}
      </Modal>
    </>
  );
}
