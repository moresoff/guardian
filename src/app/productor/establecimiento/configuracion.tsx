"use client";

import { useState } from "react";
import { FilaDato } from "@/components/fila-ajuste";
import { Campo, Seleccion } from "@/components/ui/campos";
import { Modal } from "@/components/ui/modal";
import { Aviso, Badge, Boton, Panel, Seccion } from "@/components/ui/primitivos";
import { SISTEMA_LABEL, formatNum } from "@/lib/format";
import { PROVINCIAS } from "@/lib/provincias";
import type { Productor, SistemaProductivo } from "@/lib/types";

const SISTEMAS = Object.keys(SISTEMA_LABEL) as SistemaProductivo[];

type Clave =
  | "responsable"
  | "razonSocial"
  | "cuit"
  | "correo"
  | "telefono"
  | "establecimiento"
  | "localidad"
  | "provincia"
  | "sistemaProductivo"
  | "capacidadInstalada"
  | "ocupacionActual";

type Datos = Record<Clave, string>;

/**
 * Los datos del productor, en filas que se leen y un modal que los edita.
 *
 * Antes eran dos grillas de once campos abiertos: el perfil parecía un trámite y
 * no la ficha de un establecimiento. Acá lo primero es lo que el perfil dice;
 * editar es una decisión aparte y se abre solo el bloque que se quiere tocar.
 *
 * El RENSPA y la marca no entran en ningún modal: son los que Guardian muestra
 * como verificados y solo cambian subiendo la constancia que los prueba.
 */
export function ConfiguracionPerfil({ productor }: { productor: Productor }) {
  const [datos, setDatos] = useState<Datos>({
    responsable: productor.responsable,
    razonSocial: productor.razonSocial,
    cuit: productor.cuit,
    correo: productor.correo,
    telefono: productor.telefono,
    establecimiento: productor.establecimiento,
    localidad: productor.localidad,
    provincia: productor.provincia,
    sistemaProductivo: SISTEMA_LABEL[productor.sistemaProductivo],
    capacidadInstalada: String(productor.capacidadInstalada),
    ocupacionActual: String(productor.ocupacionActual),
  });
  const [editando, setEditando] = useState<"datos" | "campo" | null>(null);
  const [guardado, setGuardado] = useState(false);

  /** El borrador del modal: cancelar no tiene que dejar rastro. */
  const [borrador, setBorrador] = useState<Datos>(datos);

  const abrir = (bloque: "datos" | "campo") => {
    setBorrador(datos);
    setEditando(bloque);
  };

  const guardar = () => {
    setDatos(borrador);
    setEditando(null);
    setGuardado(true);
  };

  const set = (clave: Clave) => (v: string) =>
    setBorrador((b) => ({ ...b, [clave]: v }));

  const libre =
    (Number(datos.capacidadInstalada) || 0) - (Number(datos.ocupacionActual) || 0);

  return (
    <div className="space-y-10">
      {guardado ? (
        <Aviso tono="marca" titulo="Datos actualizados">
          <span className="text-sm">
            <Badge tono="alerta">Prototipo</Badge>{" "}
            <span className="ml-1">
              El cambio se ve en esta pantalla, pero todavía no se guarda: falta el
              backend.
            </span>
          </span>
        </Aviso>
      ) : null}

      <Seccion
        titulo="Tus datos"
        descripcion="Quién sos y por dónde ubicarte. El correo y el teléfono no se publican: son para que Guardian te avise cuando un proyecto avanza."
        accion={
          <Boton variante="secundario" onClick={() => abrir("datos")}>
            Editar
          </Boton>
        }
      >
        <Panel className="p-5 sm:p-6">
          <dl>
            <FilaDato etiqueta="Responsable">{datos.responsable}</FilaDato>
            <FilaDato etiqueta="Razón social">{datos.razonSocial}</FilaDato>
            <FilaDato etiqueta="CUIT" codigo>
              {datos.cuit}
            </FilaDato>
            <FilaDato etiqueta="Correo">{datos.correo}</FilaDato>
            <FilaDato etiqueta="Teléfono">{datos.telefono}</FilaDato>
          </dl>
        </Panel>
      </Seccion>

      <Seccion
        titulo="El campo"
        descripcion="Los datos productivos, que viajan con cada proyecto que publicás."
        accion={
          <Boton variante="secundario" onClick={() => abrir("campo")}>
            Editar
          </Boton>
        }
      >
        <Panel className="p-5 sm:p-6">
          <dl>
            <FilaDato etiqueta="Establecimiento">{datos.establecimiento}</FilaDato>
            <FilaDato etiqueta="Dónde queda">
              {datos.localidad}, {datos.provincia}
            </FilaDato>
            <FilaDato etiqueta="Sistema productivo">{datos.sistemaProductivo}</FilaDato>
            <FilaDato etiqueta="Capacidad instalada">
              {formatNum(Number(datos.capacidadInstalada) || 0)} cabezas
            </FilaDato>
            <FilaDato
              etiqueta="Ocupación actual"
              ayuda={`Corral sin llenar: ${formatNum(Math.max(libre, 0))} cabezas`}
            >
              {formatNum(Number(datos.ocupacionActual) || 0)} cabezas
            </FilaDato>
          </dl>
        </Panel>
      </Seccion>

      <Seccion
        titulo="Identidad verificable"
        descripcion="Estos dos no se escriben a mano: Guardian los muestra como verificados, así que solo cambian subiendo la constancia que los prueba."
      >
        <Panel className="p-5 sm:p-6">
          <dl>
            <FilaDato
              etiqueta="RENSPA"
              ayuda="Registro Nacional Sanitario de Productores Agropecuarios"
              codigo
            >
              {productor.renspa}
            </FilaDato>
            <FilaDato etiqueta="Marca registrada" codigo>
              {productor.marcaRegistrada}
            </FilaDato>
          </dl>
          <div className="mt-5">
            <Aviso tono="neutro">
              Para corregir cualquiera de los dos hace falta volver a subir la constancia.
              Guardian no edita a mano un dato que después muestra como verificado.
            </Aviso>
          </div>
        </Panel>
      </Seccion>

      <Modal
        abierto={editando === "datos"}
        titulo="Editar tus datos"
        onCerrar={() => setEditando(null)}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setEditando(null)}>
              Cancelar
            </Boton>
            <Boton onClick={guardar}>Guardar cambios</Boton>
          </>
        }
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo
            etiqueta="Responsable"
            ayuda="La persona que atiende el teléfono."
            autoComplete="name"
            value={borrador.responsable}
            onChange={(e) => set("responsable")(e.target.value)}
          />
          <Campo
            etiqueta="Razón social"
            value={borrador.razonSocial}
            onChange={(e) => set("razonSocial")(e.target.value)}
          />
          <Campo
            etiqueta="CUIT"
            inputMode="numeric"
            className="tabular"
            value={borrador.cuit}
            onChange={(e) => set("cuit")(e.target.value)}
          />
          <Campo
            etiqueta="Correo"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={borrador.correo}
            onChange={(e) => set("correo")(e.target.value)}
          />
          <Campo
            etiqueta="Teléfono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="tabular"
            value={borrador.telefono}
            onChange={(e) => set("telefono")(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        abierto={editando === "campo"}
        titulo="Editar los datos del campo"
        onCerrar={() => setEditando(null)}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setEditando(null)}>
              Cancelar
            </Boton>
            <Boton onClick={guardar}>Guardar cambios</Boton>
          </>
        }
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo
            etiqueta="Establecimiento"
            ayuda="Como lo conocen en la zona."
            value={borrador.establecimiento}
            onChange={(e) => set("establecimiento")(e.target.value)}
          />
          <Campo
            etiqueta="Localidad"
            value={borrador.localidad}
            onChange={(e) => set("localidad")(e.target.value)}
          />
          <Seleccion
            etiqueta="Provincia"
            opciones={PROVINCIAS}
            value={borrador.provincia}
            onChange={(e) => set("provincia")(e.target.value)}
          />
          <Seleccion
            etiqueta="Sistema productivo"
            opciones={SISTEMAS.map((s) => SISTEMA_LABEL[s])}
            value={borrador.sistemaProductivo}
            onChange={(e) => set("sistemaProductivo")(e.target.value)}
          />
          <Campo
            etiqueta="Capacidad instalada (cabezas)"
            ayuda="Cuántos animales podés tener a la vez."
            inputMode="numeric"
            className="tabular"
            value={borrador.capacidadInstalada}
            onChange={(e) => set("capacidadInstalada")(e.target.value)}
          />
          <Campo
            etiqueta="Ocupación actual (cabezas)"
            ayuda="Cuántos tenés hoy."
            inputMode="numeric"
            className="tabular"
            value={borrador.ocupacionActual}
            onChange={(e) => set("ocupacionActual")(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
