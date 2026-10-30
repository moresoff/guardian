"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ingresar } from "@/app/sesion/acciones";
import { Campo } from "@/components/ui/campos";
import { Boton } from "@/components/ui/primitivos";

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** El ingreso: correo y contraseña contra las cuentas guardadas. */
export function FormularioIngreso() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [errores, setErrores] = useState<{ correo?: string; clave?: string }>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const nuevos: { correo?: string; clave?: string } = {};
    if (!correo.trim()) nuevos.correo = "Escribí tu correo para poder entrar.";
    else if (!CORREO.test(correo.trim()))
      nuevos.correo = "Falta algo en el correo: fijate que tenga arroba y el punto final.";
    if (!clave) nuevos.clave = "Escribí tu contraseña.";
    setErrores(nuevos);
    setErrorGeneral(null);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    const r = await ingresar(correo, clave);
    if (!r.ok) {
      setEnviando(false);
      setErrorGeneral(r.error);
      return;
    }
    router.push(r.lado === "productor" ? "/productor" : "/proyectos");
    router.refresh();
  };

  return (
    <form onSubmit={enviar} noValidate className="space-y-5">
      <Campo
        etiqueta="Correo electrónico"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        error={errores.correo}
      />

      <div>
        <Campo
          etiqueta="Contraseña"
          type={verClave ? "text" : "password"}
          autoComplete="current-password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
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

      {errorGeneral ? (
        <p role="alert" className="text-sm font-medium text-error">
          {errorGeneral}{" "}
          <Link href="/registro" className="underline">
            Crear una cuenta
          </Link>
          .
        </p>
      ) : null}

      <Boton type="submit" className="w-full" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </Boton>
    </form>
  );
}
