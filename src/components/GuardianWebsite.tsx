"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Menu,
  Sprout,
  Tractor,
  X,
} from "lucide-react";
import { Logo } from "./layout/Logo";

type Section = "home" | "about" | "participate";
const nav = [
  ["home", "/", "Inicio"],
  ["about", "/quienes-somos", "Quiénes somos"],
  ["participate", "/como-participar", "Cómo participar"],
  ["contact", "/#consultas", "Contacto"],
];
const contactEmail =
  process.env.NEXT_PUBLIC_CORREO_CONTACTO || "guardian@gmail.com";
const cycleSteps = [
  [
    "01",
    "El productor presenta el lote",
    "Cuenta dónde está el establecimiento, cuántas cabezas tiene, de qué categoría y cómo será el engorde.",
  ],
  [
    "02",
    "Se revisa la documentación",
    "Se comparan los datos declarados con el RENSPA, el DT-e y el listado de caravanas. Las diferencias se revisan antes de continuar.",
  ],
  [
    "03",
    "El ciclo se sigue hasta el cierre",
    "Pesadas, sanidad y movimientos quedan asociados al lote. El cierre se documenta con el romaneo de playa.",
  ],
];
const participationSteps = [
  [
    "01",
    "Consultá por Guardian",
    "Escribinos para conocer el proyecto y consultar por modalidades de participación.",
  ],
  [
    "02",
    "Conocé el ciclo",
    "Identificá al productor, el establecimiento, el tipo de engorde y la documentación del lote.",
  ],
  [
    "03",
    "Revisión antes de continuar",
    "El equipo revisa la documentación y las diferencias entre lo declarado y los comprobantes. La coincidencia de datos no prueba por sí sola que un documento sea auténtico.",
  ],
  [
    "04",
    "Información en un ámbito privado",
    "La documentación de cada proyecto se comparte con las personas habilitadas para acceder a ella. Esta portada no permite incorporarse a un ciclo.",
  ],
  [
    "05",
    "Seguimiento del lote",
    "El recorrido contempla pesadas, movimientos, sanidad y cierre con el romaneo de playa. En este prototipo se usan ejemplos ficticios.",
  ],
];
const questions = [
  [
    "¿Qué hace Guardian?",
    "Conecta colaboradores con productores ganaderos y reúne la información del ciclo, desde la presentación del lote hasta su cierre documental.",
  ],
  [
    "¿Qué papeles acompañan al lote?",
    "Según el ciclo y la situación de los animales: RENSPA, DT-e, listado de caravanas RFID, boleto de compra-venta y romaneo de playa al cierre.",
  ],
  [
    "¿Qué significa que los datos coincidan?",
    "Que no se encontró una diferencia en los campos comparados. Confirmar la autenticidad del comprobante requiere un control adicional por el canal oficial. Son verificaciones distintas.",
  ],
  [
    "¿Qué puedo hacer en esta demostración?",
    "Recorrer el espacio productor, presentar un ciclo ficticio y comparar datos de ejemplo. La demo no carga documentos reales ni formaliza participaciones.",
  ],
];

export function GuardianWebsite({
  section = "home",
  children,
}: {
  section?: Section;
  children?: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const profileButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function mayLeave(event?: MouseEvent<HTMLAnchorElement>) {
    if (
      dirty &&
      !window.confirm(
        "Tenés un ciclo sin enviar. Si salís, se pierde lo que cargaste. ¿Querés salir?",
      )
    ) {
      event?.preventDefault();
      return false;
    }
    setDirty(false);
    setProfileOpen(false);
    setMenuOpen(false);
    return true;
  }
  const title =
    section === "about" ? (
      <>
        Personas que conectan.
        <br />
        <em>Proyectos que crecen.</em>
      </>
    ) : section === "participate" ? (
      <>
        Conocé el lote.
        <br />
        <em>Seguí su historia.</em>
      </>
    ) : (
      <>
        Crecé,
        <br />
        <em>ayudando a crecer.</em>
      </>
    );
  return (
    <div className="guardian-site">
      <a className="site-skip" href="#contenido">
        Saltar al contenido
      </a>
      <header
        className="site-header"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setProfileOpen(false);
            setMenuOpen(false);
            profileButton.current?.focus();
          }
        }}
      >
        <Link
          href="/"
          className="site-brand"
          aria-label="Guardian, inicio"
          onClick={mayLeave}
        >
          <Logo size={40} />
          <span translate="no">Guardian</span>
        </Link>
        <button
          className="site-menu-toggle"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X aria-hidden strokeWidth={1.75} size={23} />
          ) : (
            <Menu aria-hidden strokeWidth={1.75} size={23} />
          )}
        </button>
        <nav
          id="main-navigation"
          className={menuOpen ? "site-nav is-open" : "site-nav"}
          aria-label="Navegación principal"
        >
          {nav.map(([id, href, label]) => (
            <Link
              key={id}
              href={href}
              aria-current={section === id ? "page" : undefined}
              onClick={mayLeave}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="site-profile">
          <button
            ref={profileButton}
            className="profile-trigger"
            aria-expanded={profileOpen}
            aria-controls="profile-options"
            onClick={() => setProfileOpen((open) => !open)}
          >
            <Sprout aria-hidden strokeWidth={1.75} size={17} />
            Cambiar perfil
            <ChevronDown aria-hidden strokeWidth={1.75} size={14} />
          </button>
          {profileOpen && (
            <>
              <button
                className="profile-backdrop"
                aria-label="Cerrar selección de perfil"
                onClick={() => setProfileOpen(false)}
              />
              <div className="profile-options" id="profile-options">
                <span>Elegí tu recorrido</span>
                <Link href="/como-participar" onClick={mayLeave}>
                  <Sprout aria-hidden strokeWidth={1.75} size={20} />
                  <div>
                    <strong>Quiero colaborar</strong>
                    <small>Conocé cómo funciona Guardian</small>
                  </div>
                </Link>
                <Link href="/registro?lado=productor" onClick={mayLeave}>
                  <Tractor aria-hidden strokeWidth={1.75} size={20} />
                  <div>
                    <strong>Soy productor</strong>
                    <small>Publicá tu ciclo con respaldo</small>
                  </div>
                </Link>
              </div>
            </>
          )}
        </div>
      </header>
      <main id="contenido">
        {children ? (
          <div className="more-home-content">{children}</div>
        ) : (
          <>
            <section
              id="inicio"
              className={`site-hero ${section !== "home" ? "site-inner-hero" : ""}`}
            >
              <div className="site-hero-image">
                <Image
                  src={
                    section === "about"
                      ? "/guardian/cierre.jpg"
                      : section === "participate"
                        ? "/guardian/proyecto.jpg"
                        : "/guardian/fondo.jpg"
                  }
                  alt="Producción ganadera argentina"
                  fill
                  priority
                  sizes="100vw"
                />
              </div>
              <div className="site-hero-overlay" />
              <div className="site-hero-content">
                <span className="site-hero-eyebrow">
                  {section === "about"
                    ? "Quiénes somos"
                    : section === "participate"
                      ? "Cómo participar"
                      : "Ciclos ganaderos"}
                </span>
                <h1>{title}</h1>
                <p>
                  {section === "about"
                    ? "Guardian conecta colaboradores con productores ganaderos y reúne la documentación de cada ciclo."
                    : section === "participate"
                      ? "Un productor, un establecimiento y un lote concreto. Conocé el recorrido y consultá por modalidades de participación."
                      : "Conectamos colaboradores con productores ganaderos para participar en ciclos de engorde, con la documentación del lote a la vista."}
                </p>
                {/* Quiénes somos presenta a Guardian y no manda a otra página. */}
                {section !== "about" && (
                  <Link
                    href={
                      section === "participate" ? "#pasos" : "/como-participar"
                    }
                    className="site-button site-button-light"
                  >
                    {section === "participate"
                      ? "Conocer el recorrido"
                      : "Conocé cómo participar"}
                    <ArrowRight aria-hidden strokeWidth={1.75} size={20} />
                  </Link>
                )}
              </div>
              <span className="site-hero-demo">
                Prototipo académico · Datos de prueba · No constituye oferta
                pública
              </span>
            </section>
            {section === "home" && (
              <>
                <section className="site-section site-introduction">
                  <span className="site-eyebrow">El proyecto</span>
                  <h2>
                    Un lote concreto.
                    <br />
                    Su documentación a la vista.
                  </h2>
                  <p>
                    El productor presenta el ciclo y los papeles que ya emite.
                    Guardian propone reunirlos, comparar los datos y acompañar
                    el seguimiento hasta el cierre. Quien quiere colaborar puede
                    conocer el proyecto y consultar por modalidades de
                    participación.
                  </p>
                  <Link href="/quienes-somos" className="site-text-link">
                    Conocé quiénes somos
                    <ArrowUpRight aria-hidden strokeWidth={1.75} size={20} />
                  </Link>
                </section>
                <section className="site-photo-band">
                  <Image
                    src="/guardian/proyecto.jpg"
                    alt="Lote de hacienda en engorde"
                    fill
                    sizes="100vw"
                  />
                  <div />
                  <h2>
                    Un lote.
                    <br />
                    Una historia que podés seguir.
                  </h2>
                </section>
                <section className="site-section">
                  <span className="site-eyebrow">Cómo funciona</span>
                  <h2>
                    Del lote al romaneo,
                    <br />
                    con la información clara.
                  </h2>
                  <div className="site-three-steps">
                    {cycleSteps.map(([n, title, body]) => (
                      <article key={n}>
                        <span>{n}</span>
                        <h3>{title}</h3>
                        <p>{body}</p>
                      </article>
                    ))}
                  </div>
                  <Link href="/como-participar" className="site-text-link">
                    Conocé el recorrido
                    <ArrowRight aria-hidden strokeWidth={1.75} size={20} />
                  </Link>
                </section>
                <section className="site-producer-banner">
                  <div>
                    <span className="site-eyebrow">Para productores</span>
                    <h2>
                      Tu próximo ciclo
                      <br />
                      también empieza acá.
                    </h2>
                    <p>
                      Presentá el establecimiento, el lote y el sistema de
                      engorde. Reuní la documentación y seguí su revisión.
                    </p>
                  </div>
                  <Link href="/registro?lado=productor" className="site-button">
                    Soy productor
                    <ArrowRight aria-hidden strokeWidth={1.75} size={20} />
                  </Link>
                </section>
              </>
            )}
            {section === "about" && (
              <>
                <section className="site-section site-introduction">
                  <span className="site-eyebrow">Quién es Guardian</span>
                  <h2>
                    Una plataforma que conecta
                    <br />
                    productores y colaboradores.
                  </h2>
                  <p>
                    Guardian pone en contacto a productores ganaderos con
                    personas que quieren colaborar en un ciclo de engorde.
                    Conecta, organiza la revisión documental y deja la
                    información del lote a la vista.
                  </p>
                  <p>
                    Nació de un problema concreto: al productor que engorda se
                    le termina el dinero antes que el ciclo y sale a vender
                    hacienda liviana, la peor venta posible. Del otro lado hay
                    gente que quiere participar en un ciclo ganadero y no
                    encuentra por dónde entrar sin comprar un campo.
                  </p>
                </section>
                <div className="site-band-soft">
                <section className="site-section site-introduction">
                  <span className="site-eyebrow">Nuestro propósito</span>
                  <h2>
                    Conectar personas.
                    <br />
                    Ordenar la información del ciclo.
                  </h2>
                  <p>
                    Guardian es el proyecto de tesis que conecta colaboradores
                    con productores ganaderos. El trabajo original parte de un
                    lote identificable y de los documentos del campo y los
                    animales. Propone revisar lo declarado, señalar diferencias
                    y seguir las etapas del engorde hasta el cierre.
                  </p>
                  <p className="site-honest-note">
                    Esta web conserva ese recorrido en un prototipo visual. Los
                    ejemplos son ficticios y no acreditan operaciones,
                    autorizaciones ni comprobaciones oficiales.
                  </p>
                </section>
                </div>
                <section className="site-photo-band">
                  <Image
                    src="/imagenes/fotos/proyecto8.webp"
                    alt="Una vaca con su ternero en el campo"
                    fill
                    sizes="100vw"
                  />
                  <div />
                  <h2>
                    Cada parte tiene un rol.
                    <br />
                    Cada lote, su historia.
                  </h2>
                </section>
                <section className="site-section">
                  <div className="site-three-steps site-roles">
                    {[
                      [
                        "El productor",
                        "Presenta el lote y el establecimiento, reúne los comprobantes e informa pesadas, sanidad y movimientos.",
                      ],
                      [
                        "El colaborador",
                        "Conoce el proyecto y consulta por las modalidades de participación a través del canal de contacto.",
                      ],
                      [
                        "Guardian",
                        "Organiza el legajo, compara lo declarado con los comprobantes y coordina la revisión. La coincidencia de datos y la autenticidad se controlan por separado.",
                      ],
                    ].map(([title, body]) => (
                      <article key={title}>
                        <h3>{title}</h3>
                        <p>{body}</p>
                      </article>
                    ))}
                  </div>
                </section>
              </>
            )}
            {section === "participate" && (
              <>
                <section className="site-section" id="pasos">
                  <span className="site-eyebrow">El recorrido</span>
                  <h2>
                    Conocer, consultar
                    <br />y seguir el ciclo.
                  </h2>
                  <div className="participation-steps">
                    {participationSteps.map(([n, title, body]) => (
                      <article key={n}>
                        <span>{n}</span>
                        <div>
                          <h3>{title}</h3>
                          <p>{body}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
                <section className="site-photo-band">
                  <Image
                    src="/guardian/fondo.jpg"
                    alt="Hacienda de engorde al atardecer"
                    fill
                    sizes="100vw"
                  />
                  <div />
                  <h2>
                    Información del lote.
                    <br />
                    Documentos con contexto.
                  </h2>
                </section>
                <section className="site-section site-participation-faq">
                  <span className="site-eyebrow">Preguntas frecuentes</span>
                  <h2>Lo que conviene saber.</h2>
                  {questions.map(([question, answer]) => (
                    <article className="public-question" key={question}>
                      <h3>{question}</h3>
                      <p>{answer}</p>
                    </article>
                  ))}
                </section>
              </>
            )}
            <section className="site-section site-consultations" id="consultas">
              <div>
                <span className="site-eyebrow">Contacto</span>
                <h2>
                  Conversemos
                  <br />
                  sobre Guardian.
                </h2>
                <p>
                  Consultá por modalidades de participación o por la
                  presentación de un ciclo. El correo es el canal de contacto
                  indicado en el proyecto original.
                </p>
              </div>
              <a href={`mailto:${contactEmail}`} className="site-button">
                Escribinos
                <ArrowRight aria-hidden strokeWidth={1.75} size={20} />
              </a>
              <p className="site-consultation-note">
                El enlace abre tu correo. Esta demo no envía mensajes ni
                recopila datos de contacto.
              </p>
            </section>
          </>
        )}
      </main>
      <footer className="site-footer">
        <Link href="/" className="site-brand" onClick={mayLeave}>
          <Logo size={30} />
          <span translate="no">Guardian</span>
        </Link>
        <div>
          <Link href="/quienes-somos" onClick={mayLeave}>
            Quiénes somos
          </Link>
          <Link href="/como-participar" onClick={mayLeave}>
            Cómo participar
          </Link>
          <Link href="/registro?lado=productor" onClick={mayLeave}>
            Soy productor
          </Link>
        </div>
        <p>
          Prototipo académico · Datos de prueba · No constituye oferta pública.
        </p>
      </footer>
    </div>
  );
}
