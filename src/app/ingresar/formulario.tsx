"use client";

import { useState } from "react";
import { Campo } from "@/components/ui/campos";
import { Aviso, Boton, BotonLink } from "@/components/ui/primitivos";

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * El ingreso todavía no tiene contra qué validar: las cuentas se conectan en la
 * etapa de backend. Hasta entonces el formulario revisa lo que puede revisar
 * —que los datos estén completos— y lo dice con todas las letras en vez de
 * simular una sesión que no existe.
 */
export function FormularioIngreso() {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [errores, setErrores] = useState<{ correo?: string; clave?: string }>({});
  const [enviado, setEnviado] = useState(false);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevos: { correo?: string; clave?: string } = {};
    if (!correo.trim()) nuevos.correo = "Escribí tu correo para poder entrar.";
    else if (!CORREO.test(correo.trim()))
      nuevos.correo = "Falta algo en el correo: fijate que tenga arroba y el punto final.";
    if (!clave) nuevos.clave = "Escribí tu contraseña.";
    setErrores(nuevos);
    setEnviado(Object.keys(nuevos).length === 0);
  };

  return (
    <form onSubmit={enviar} noValidate className="space-y-5">
      <Campo
        etiqueta="Correo electrónico"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={correo}
        onChange={(e) => {
          setCorreo(e.target.value);
          setEnviado(false);
        }}
        error={errores.correo}
      />

      <div>
        <Campo
          etiqueta="Contraseña"
          type={verClave ? "text" : "password"}
          autoComplete="current-password"
          value={clave}
          onChange={(e) => {
            setClave(e.target.value);
            setEnviado(false);
          }}
          error={errores.clave}
        />
        <label className="mt-2 flex min-h-11 items-center gap-2.5 text-sm text-tinta-suave">
          <input
            type="checkbox"
            checked={verClave}
            onChange={(e) => setVerClave(e.target.checked)}
            className="size-4 accent-[var(--marca)]"
          />
          Ver la contraseña mientras la escribo
        </label>
      </div>

      <Boton type="submit" className="w-full">
        Entrar
      </Boton>

      {enviado ? (
        <Aviso tono="alerta" titulo="Todavía no hay cuentas de verdad">
          Guardian es un prototipo: las cuentas y las contraseñas se conectan en la
          próxima etapa. Mientras tanto podés recorrer la plataforma entera desde
          cualquiera de los dos lados.
          <span className="mt-4 flex flex-wrap gap-3">
            <BotonLink href="/productor" variante="secundario">
              Entrar como productor
            </BotonLink>
            <BotonLink href="/proyectos" variante="secundario">
              Entrar como colaborador
            </BotonLink>
          </span>
        </Aviso>
      ) : null}
    </form>
  );
}
