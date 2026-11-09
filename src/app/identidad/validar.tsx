"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Campo, Seleccion } from "@/components/ui/campos";
import { Aviso, Badge, Boton, BotonLink } from "@/components/ui/primitivos";
import { ACCEPT_IMAGEN, revisarArchivo } from "@/lib/archivos";
import { ORIGENES_FONDOS, SEXOS, cuitCorrespondeADni, edad, soloDigitos } from "@/lib/kyc";
import { PROVINCIAS } from "@/lib/provincias";
import { validarIdentidad } from "./acciones";

type Lado = "productor" | "colaborador";

interface Datos {
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  sexo: string;
  nacionalidad: string;
  cuit: string;
  domicilio: string;
  localidad: string;
  provincia: string;
  ocupacion: string;
  pep: string;
  sujetoObligado: string;
  origenFondos: string;
  cbu: string;
  declaro: boolean;
}

type Errores = Partial<Record<keyof Datos | "dniFrente" | "dniDorso" | "selfie", string>>;

/**
 * Una foto, con la cámara del teléfono si hay. Se ve lo que se sacó, así se
 * puede repetir si salió movida.
 */
function Foto({
  etiqueta,
  ayuda,
  camara,
  archivo,
  error,
  onArchivo,
}: {
  etiqueta: string;
  ayuda: string;
  camara: "user" | "environment";
  archivo: File | null;
  error?: string;
  onArchivo: (f: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const vista = useMemo(() => (archivo ? URL.createObjectURL(archivo) : null), [archivo]);
  useEffect(() => () => {
    if (vista) URL.revokeObjectURL(vista);
  }, [vista]);

  return (
    <div
      className={`rounded-xl border p-4 ${error ? "border-error bg-alerta-suave" : "border-borde"}`}
    >
      <p className="font-medium">{etiqueta}</p>
      <p className="mt-0.5 text-sm text-tinta-suave">{ayuda}</p>
      {vista ? (
        // eslint-disable-next-line @next/next/no-img-element -- vista previa local, sin optimizar
        <img
          src={vista}
          alt={`Vista previa: ${etiqueta}`}
          className="mt-3 max-h-48 rounded-lg border border-borde object-contain"
        />
      ) : null}
      <input
        ref={input}
        type="file"
        accept={ACCEPT_IMAGEN}
        capture={camara}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onArchivo(f);
          e.target.value = "";
        }}
      />
      <Boton
        variante={archivo ? "secundario" : "primario"}
        className="mt-3 min-h-12 w-full sm:w-auto"
        onClick={() => input.current?.click()}
      >
        {archivo ? "Sacar otra" : "Sacar la foto"}
      </Boton>
      {error ? (
        <p className="mt-2 text-sm font-medium text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SiNo({
  pregunta,
  ayuda,
  valor,
  error,
  onCambio,
}: {
  pregunta: string;
  ayuda: string;
  valor: string;
  error?: string;
  onCambio: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="font-medium">{pregunta}</legend>
      <p className="mt-0.5 text-sm text-tinta-suave">{ayuda}</p>
      <div className="mt-2 flex gap-2">
        {[
          ["no", "No"],
          ["si", "Sí"],
        ].map(([v, t]) => (
          <button
            key={v}
            type="button"
            aria-pressed={valor === v}
            onClick={() => onCambio(v)}
            className={`min-h-12 flex-1 rounded-xl border px-4 text-base font-medium transition-colors sm:flex-none sm:px-8 ${
              valor === v
                ? "border-marca bg-marca text-marca-contraste"
                : "border-borde-fuerte bg-superficie hover:border-marca"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {error ? <p className="mt-1.5 text-sm font-medium text-error">{error}</p> : null}
    </fieldset>
  );
}

/** Un bloque del formulario, con su número para orientarse al bajar. */
function Bloque({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-borde pt-6 first:border-t-0 first:pt-0">
      <h2 className="flex items-center gap-3 text-lg font-semibold tracking-tight">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-marca text-sm font-semibold text-marca-contraste">
          {n}
        </span>
        {titulo}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/**
 * La validación de identidad, en una sola pantalla: los datos del DNI, la foto
 * del DNI, una selfie y las preguntas que pide la norma. La lectura del DNI,
 * la prueba de vida y la comparación facial están simuladas; las fotos y los
 * datos se guardan de verdad.
 */
export function ValidarIdentidad({
  lado,
  inicial,
  ya,
  volver,
}: {
  /** A dónde se sigue al terminar. */
  volver: string;
  lado: Lado;
  inicial: { nombre: string; cuit: string; provincia: string };
  /** La validación que ya existe, si la hay. */
  ya: {
    estado: "aprobada" | "en_revision" | "rechazada";
    nombre: string;
    apellido: string;
    fecha: string;
    metodo: string;
  } | null;
}) {
  const [d, setD] = useState<Datos>(() => {
    const [nombre, ...resto] = inicial.nombre.trim().split(/\s+/);
    return {
      nombre: nombre ?? "",
      apellido: resto.join(" "),
      dni: soloDigitos(inicial.cuit).slice(2, 10).replace(/^0+/, ""),
      fechaNacimiento: "",
      sexo: "",
      nacionalidad: "Argentina",
      cuit: inicial.cuit,
      domicilio: "",
      localidad: "",
      provincia: inicial.provincia,
      ocupacion: lado === "productor" ? "Productor agropecuario" : "",
      pep: "",
      sujetoObligado: "",
      origenFondos: lado === "productor" ? "Actividad agropecuaria" : "",
      cbu: "",
      declaro: false,
    };
  });
  const [fotos, setFotos] = useState<{ dniFrente: File | null; dniDorso: File | null; selfie: File | null }>(
    { dniFrente: null, dniDorso: null, selfie: null },
  );
  const [errores, setErrores] = useState<Errores>({});
  const [leyendo, setLeyendo] = useState<"dni" | "selfie" | null>(null);
  const [leido, setLeido] = useState({ dni: false, selfie: false });
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [resultado, setResultado] = useState<"aprobada" | "en_revision" | "rechazada" | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!resultado) return;
    titulo.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [resultado]);

  const set = <K extends keyof Datos>(k: K) => (v: Datos[K]) => {
    setD((x) => ({ ...x, [k]: v }));
    setErrores((e) => ({ ...e, [k]: undefined }));
  };

  const ponerFoto = (k: keyof typeof fotos) => (f: File) => {
    const motivo = revisarArchivo(f, true);
    setErrores((e) => ({ ...e, [k]: motivo ?? undefined }));
    if (motivo) return;
    const nuevas = { ...fotos, [k]: f };
    setFotos(nuevas);
    // La revisión arranca sola cuando están las fotos: no hay un botón más que tocar.
    if (k === "selfie") leer("selfie");
    else if (nuevas.dniFrente && nuevas.dniDorso) leer("dni");
    else setLeido((l) => ({ ...l, dni: false }));
  };

  const validar = (): boolean => {
    const e: Errores = {};
    {
      if (!d.nombre.trim()) e.nombre = "Escribí tu nombre como figura en el DNI.";
      if (!d.apellido.trim()) e.apellido = "Escribí tu apellido.";
      if (!/^\d{7,8}$/.test(soloDigitos(d.dni))) e.dni = "El DNI tiene 7 u 8 números, sin puntos.";
      const anios = edad(d.fechaNacimiento);
      if (!d.fechaNacimiento) e.fechaNacimiento = "Escribí tu fecha de nacimiento.";
      else if (anios < 18 || anios > 110) e.fechaNacimiento = "Tenés que ser mayor de edad.";
      if (!d.sexo) e.sexo = "Elegí el que figura en tu DNI.";
      if (!d.nacionalidad.trim()) e.nacionalidad = "Escribí tu nacionalidad.";
      if (soloDigitos(d.cuit).length !== 11) e.cuit = "El CUIT o CUIL tiene 11 números.";
      else if (!e.dni && !cuitCorrespondeADni(d.cuit, d.dni))
        e.cuit = "Este CUIT o CUIL no corresponde a ese DNI. Revisá los dos.";
      if (!d.domicilio.trim()) e.domicilio = "Escribí la calle y el número.";
      if (!d.localidad.trim()) e.localidad = "Escribí la localidad.";
      if (!d.ocupacion.trim()) e.ocupacion = "Contanos a qué te dedicás.";
    }
    {
      if (!fotos.dniFrente) e.dniFrente = "Falta la foto del frente.";
      if (!fotos.dniDorso) e.dniDorso = "Falta la foto del dorso.";
    }
    if (!fotos.selfie) e.selfie = "Falta la selfie.";
    {
      if (!d.pep) e.pep = "Elegí sí o no.";
      if (!d.sujetoObligado) e.sujetoObligado = "Elegí sí o no.";
      if (lado === "colaborador" && !d.origenFondos) e.origenFondos = "Elegí una opción.";
      if (soloDigitos(d.cbu).length !== 22) e.cbu = "El CBU tiene 22 números.";
      if (!d.declaro) e.declaro = "Falta que lo confirmes.";
    }
    setErrores(e);
    const primero = Object.keys(e)[0];
    if (primero) document.getElementById(`kyc-${primero}`)?.focus();
    return !primero;
  };

  /** La lectura simulada: un momento de espera, como tendría una real. */
  function leer(que: "dni" | "selfie") {
    setLeyendo(que);
    setLeido((l) => ({ ...l, [que]: false }));
    setTimeout(() => {
      setLeyendo((x) => (x === que ? null : x));
      setLeido((l) => ({ ...l, [que]: true }));
    }, 1400);
  }

  const enviar = async () => {
    if (!validar() || enviando || leyendo) return;
    const f = new FormData();
    for (const [k, v] of Object.entries(d)) f.set(k, k === "declaro" ? (v ? "si" : "no") : String(v));
    f.set("dniFrente", fotos.dniFrente!);
    f.set("dniDorso", fotos.dniDorso!);
    f.set("selfie", fotos.selfie!);
    setEnviando(true);
    setErrorGeneral(null);
    const r = await validarIdentidad(f).catch(() => null);
    setEnviando(false);
    if (!r || !r.ok) {
      setErrorGeneral(r?.error ?? "No pudimos guardar tus datos. Revisá tu conexión y probá de nuevo.");
      return;
    }
    setResultado(r.estado);
  };


  // Ya validada antes de entrar a esta pantalla: se muestra el resultado, no el
  // formulario. Si se acaba de validar, manda la pantalla de «listo» de abajo,
  // aunque el servidor ya sepa que está validada.
  if (ya && !resultado) {
    return (
      <div className="rounded-2xl border border-borde bg-superficie p-5 sm:p-7">
        <Badge tono={ya.estado === "aprobada" ? "ok" : "alerta"}>
          {ya.estado === "aprobada" ? "Validada" : ya.estado === "en_revision" ? "En revisión" : "Rechazada"}
        </Badge>
        <p className="mt-3 text-base">
          {ya.nombre} {ya.apellido}, el {ya.fecha}.
        </p>
        <p className="mt-1 text-sm text-tinta-suave">{ya.metodo}</p>
        <BotonLink href={volver} className="mt-6 min-h-12">
          Volver
        </BotonLink>
      </div>
    );
  }

  if (resultado) {
    const aprobada = resultado === "aprobada";
    return (
      <section className="rounded-2xl border border-borde bg-superficie p-5 shadow-[var(--sombra-baja)] sm:p-7">
        <h2 ref={titulo} tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none">
          {aprobada ? "Tu identidad quedó validada" : "Tus datos quedaron en revisión"}
        </h2>
        <p className="mt-2 text-base text-tinta-suave">
          {aprobada
            ? "Ya podés seguir. No te lo vamos a volver a pedir."
            : "Como sos persona expuesta políticamente, la norma pide que una persona del equipo revise tus datos antes de aprobarlos. Te avisamos cuando esté."}
        </p>
        <div className="mt-6">
          <BotonLink
            href={volver}
            className="min-h-12 w-full sm:w-auto"
          >
            Seguir
          </BotonLink>
        </div>
      </section>
    );
  }

  return (
    <div>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
        className="space-y-6 rounded-2xl border border-borde bg-superficie p-5 shadow-[var(--sombra-baja)] sm:p-7"
      >
        <Bloque n={1} titulo="Tus datos, como figuran en el DNI">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="kyc-nombre" etiqueta="Nombre" autoComplete="given-name" value={d.nombre} error={errores.nombre} onChange={(e) => set("nombre")(e.target.value)} />
            <Campo id="kyc-apellido" etiqueta="Apellido" autoComplete="family-name" value={d.apellido} error={errores.apellido} onChange={(e) => set("apellido")(e.target.value)} />
            <Campo id="kyc-dni" etiqueta="Número de DNI" inputMode="numeric" className="tabular" placeholder="Ej.: 30123456…" value={d.dni} error={errores.dni} onChange={(e) => set("dni")(e.target.value)} />
            <Campo id="kyc-fechaNacimiento" etiqueta="Fecha de nacimiento" type="date" autoComplete="bday" value={d.fechaNacimiento} error={errores.fechaNacimiento} onChange={(e) => set("fechaNacimiento")(e.target.value)} />
            <Seleccion
              id="kyc-sexo"
              etiqueta="Sexo, como figura en el DNI"
              opciones={[{ valor: "", label: "Elegí uno" }, ...SEXOS]}
              value={d.sexo}
              error={errores.sexo}
              onChange={(e) => set("sexo")(e.target.value)}
            />
            <Campo id="kyc-nacionalidad" etiqueta="Nacionalidad" value={d.nacionalidad} error={errores.nacionalidad} onChange={(e) => set("nacionalidad")(e.target.value)} />
            <Campo id="kyc-cuit" etiqueta="CUIT o CUIL" inputMode="numeric" className="tabular" value={d.cuit} error={errores.cuit} onChange={(e) => set("cuit")(e.target.value)} />
            <Campo id="kyc-ocupacion" etiqueta="¿A qué te dedicás?" value={d.ocupacion} error={errores.ocupacion} onChange={(e) => set("ocupacion")(e.target.value)} />
            <div className="sm:col-span-2">
              <Campo id="kyc-domicilio" etiqueta="Domicilio (calle y número)" autoComplete="street-address" value={d.domicilio} error={errores.domicilio} onChange={(e) => set("domicilio")(e.target.value)} />
            </div>
            <Campo id="kyc-localidad" etiqueta="Localidad" autoComplete="address-level2" value={d.localidad} error={errores.localidad} onChange={(e) => set("localidad")(e.target.value)} />
            <Seleccion id="kyc-provincia" etiqueta="Provincia" opciones={[...PROVINCIAS]} value={d.provincia} onChange={(e) => set("provincia")(e.target.value)} />
          </div>
        </Bloque>

        <Bloque n={2} titulo="Fotos del DNI">
          <div className="space-y-4">
            <p className="text-base text-tinta-suave">
              Con buena luz y sin reflejos. Que se lean bien los números.
            </p>
<div className="grid gap-3 sm:grid-cols-2">
            <div id="kyc-dniFrente" tabIndex={-1}>
              <Foto etiqueta="Frente del DNI" ayuda="El lado de la foto." camara="environment" archivo={fotos.dniFrente} error={errores.dniFrente} onArchivo={ponerFoto("dniFrente")} />
            </div>
            <div id="kyc-dniDorso" tabIndex={-1}>
              <Foto etiqueta="Dorso del DNI" ayuda="El lado del código de barras." camara="environment" archivo={fotos.dniDorso} error={errores.dniDorso} onArchivo={ponerFoto("dniDorso")} />
            </div>
            </div>
            <div aria-live="polite">
              {leyendo === "dni" ? <Aviso>Leyendo tu DNI…</Aviso> : null}
              {leido.dni ? (
                <Aviso tono="ok" titulo="Leímos tu DNI y coincide con lo que cargaste">
                  {d.nombre} {d.apellido} · DNI <span className="codigo">{soloDigitos(d.dni)}</span>
                </Aviso>
              ) : null}
            </div>
          </div>
        </Bloque>

        <Bloque n={3} titulo="Una selfie">
          <div className="space-y-4">
            <p className="text-base text-tinta-suave">
              Mirá a la cámara, sin anteojos de sol ni gorra. La comparamos con la foto de tu
              DNI para saber que sos vos.
            </p>
            <div id="kyc-selfie" tabIndex={-1}>
              <Foto etiqueta="Tu cara" ayuda="Con la cámara de adelante." camara="user" archivo={fotos.selfie} error={errores.selfie} onArchivo={ponerFoto("selfie")} />
            </div>
            <div aria-live="polite">
              {leyendo === "selfie" ? <Aviso>Comprobando que sos vos…</Aviso> : null}
              {leido.selfie ? (
                <Aviso tono="ok" titulo="Listo, sos vos">
                  La prueba de vida salió bien y tu cara coincide con la del DNI.
                </Aviso>
              ) : null}
            </div>
          </div>
        </Bloque>

        <Bloque n={4} titulo="Últimas preguntas">
          <div className="space-y-6">
            <div id="kyc-pep" tabIndex={-1}>
              <SiNo
                pregunta="¿Sos persona expuesta políticamente?"
                ayuda="Por ejemplo, si tenés o tuviste en los últimos años un cargo público, o sos familiar directo de alguien que lo tiene."
                valor={d.pep}
                error={errores.pep}
                onCambio={set("pep")}
              />
            </div>
            <div id="kyc-sujetoObligado" tabIndex={-1}>
              <SiNo
                pregunta="¿Sos sujeto obligado ante la UIF?"
                ayuda="Por ejemplo, si sos escribano, contador que certifica balances o trabajás en una entidad financiera."
                valor={d.sujetoObligado}
                error={errores.sujetoObligado}
                onCambio={set("sujetoObligado")}
              />
            </div>
            <Seleccion
              id="kyc-origenFondos"
              etiqueta={lado === "colaborador" ? "¿De dónde viene el dinero con el que participás?" : "¿De dónde vienen tus ingresos?"}
              opciones={[{ valor: "", label: "Elegí una opción" }, ...ORIGENES_FONDOS]}
              value={d.origenFondos}
              error={errores.origenFondos}
              onChange={(e) => set("origenFondos")(e.target.value)}
            />
            <Campo
              id="kyc-cbu"
              etiqueta={lado === "colaborador" ? "CBU donde te devolvemos" : "CBU donde recibís los desembolsos"}
              ayuda="Tiene que estar a tu nombre. Son 22 números."
              inputMode="numeric"
              className="tabular"
              value={d.cbu}
              error={errores.cbu}
              onChange={(e) => set("cbu")(e.target.value)}
            />
            <div>
              <label className="flex min-h-12 items-start gap-3">
                <input
                  id="kyc-declaro"
                  type="checkbox"
                  checked={d.declaro}
                  onChange={(e) => set("declaro")(e.target.checked)}
                  className="mt-1 size-5 shrink-0 accent-[var(--marca)]"
                />
                <span className="text-base">
                  Declaro que los datos son verdaderos y que el dinero no viene de actividades
                  ilícitas.
                </span>
              </label>
              {errores.declaro ? <p className="mt-1 text-sm font-medium text-error">{errores.declaro}</p> : null}
            </div>
          </div>
        </Bloque>

        <p className="min-h-5 text-sm font-medium text-error" role="alert">
          {errorGeneral ?? (Object.values(errores).some(Boolean) ? "Revisá los datos marcados." : "")}
        </p>

        <div className="border-t border-borde pt-5">
          <Boton type="submit" className="min-h-12 w-full sm:w-auto" aria-disabled={enviando || leyendo !== null}>
            {enviando ? "Guardando…" : leyendo ? "Revisando las fotos…" : "Validar mi identidad"}
          </Boton>
        </div>
      </form>

      <p className="mt-4 text-sm text-tinta-suave">
        Prototipo: la lectura del DNI, la prueba de vida y la comparación facial están simuladas.
        Tus fotos y tus datos se guardan en un almacenamiento privado.
      </p>
    </div>
  );
}
