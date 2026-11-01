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
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  FileCheck,
  FileText,
  Menu,
  Plus,
  Scale,
  Sprout,
  Tractor,
  X,
} from "lucide-react";
import { Logo } from "./layout/Logo";

type Section = "home" | "about" | "participate" | "producer";
type Project = {
  name: string;
  place: string;
  heads: number;
  system: string;
  category: string;
  possession: string;
  description: string;
  status: "En revisión" | "En ejecución";
  photo: string;
  documentHeads: number | null;
};
const demoProjects: Project[] = [
  {
    name: "Engorde Los Aromos",
    place: "Tandil, Buenos Aires",
    heads: 80,
    system: "A corral",
    category: "Novillito",
    possession: "Animales en el establecimiento",
    description:
      "Ciclo de engorde a corral. Ejemplo ficticio para recorrer la revisión documental.",
    status: "En revisión",
    photo: "/guardian/proyecto.jpg",
    documentHeads: 78,
  },
  {
    name: "Ciclo La Esperanza",
    place: "Rafaela, Santa Fe",
    heads: 120,
    system: "Mixto",
    category: "Vaquillona",
    possession: "Animales en el establecimiento",
    description:
      "Ciclo mixto con seguimiento de pesadas y sanidad. Ejemplo ficticio de un ciclo en ejecución.",
    status: "En ejecución",
    photo: "/imagenes/fotos/proyecto8.webp",
    documentHeads: 120,
  },
];
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

/** La situación del lote en pocas palabras, para que entre en un renglón. */
const SITUACION_CORTA: Record<string, string> = {
  "Animales en el establecimiento": "En el campo",
  "Animales a incorporar": "A incorporar",
  "Lote parcialmente incorporado": "Una parte",
};

export function GuardianWebsite({
  section = "home",
  children,
  nombre = null,
  panel,
}: {
  section?: Section;
  children?: ReactNode;
  /** El nombre de pila de quien entró, para el saludo del productor. */
  nombre?: string | null;
  /** El tablero real del productor, armado en el servidor. */
  panel?: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [producerTab, setProducerTab] = useState<"projects" | "publish">(
    "projects",
  );
  const [projects, setProjects] = useState<Project[]>(demoProjects);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const profileButton = useRef<HTMLButtonElement>(null);
  const producer = section === "producer";
  useEffect(() => {
    if (
      producer &&
      new URLSearchParams(window.location.search).get("vista") === "nuevo"
    )
      setProducerTab("publish");
  }, [producer]);
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
  // Al abrir un legajo se lo lleva a la vista y recibe el foco: antes aparecía
  // debajo de las tarjetas y había que ir a buscarlo.
  useEffect(() => {
    if (selectedProject === null) return;
    const legajo = document.getElementById("project-legajo");
    if (!legajo) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    legajo.scrollIntoView({ block: "start", behavior: quieto ? "auto" : "smooth" });
    legajo.focus({ preventScroll: true });
  }, [selectedProject]);
  function changeTab(tab: "projects" | "publish") {
    if (!mayLeave()) return;
    setProducerTab(tab);
    setMessage("");
    setSelectedProject(null);
    window.history.replaceState(
      null,
      "",
      tab === "publish" ? "/producer?vista=nuevo" : "/producer",
    );
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
  const selected = selectedProject === null ? null : projects[selectedProject];
  useEffect(() => {
    if (selectedProject !== null) {
      document.getElementById("project-legajo")?.focus();
    }
  }, [selectedProject]);
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
                <Link href="/producer" onClick={mayLeave}>
                  <Tractor aria-hidden strokeWidth={1.75} size={20} />
                  <div>
                    <strong>Soy productor</strong>
                    <small>Mis ciclos y nueva propuesta</small>
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
        ) : producer && panel ? (
          <>
            <section className="producer-hero">
              <Image
                src="/imagenes/fotos/campo.webp"
                alt=""
                fill
                priority
                sizes="100vw"
              />
              <div className="producer-hero-overlay" />
              <div className="producer-hero-content">
                <span className="site-hero-eyebrow">Tu espacio</span>
                <h1>{nombre ? `Bienvenido, ${nombre}` : "Bienvenido, productor"}</h1>
                <p>
                  Presentá el lote y reuní su documentación en un solo lugar.
                </p>
                <Link
                  href="/productor/proyectos/nuevo"
                  className="site-button site-button-light"
                >
                  <Plus aria-hidden strokeWidth={1.75} size={20} />
                  Publicar un proyecto
                </Link>
              </div>
            </section>
            <section className="producer-panel">{panel}</section>
          </>
        ) : producer ? (
          <>
            <div className="producer-demo-bar">
              Espacio productor de demostración · Sin sesión real · Usá solo
              datos ficticios
            </div>
            {/* La portada del productor: una foto y la bienvenida. En la
                pestaña de publicar se esconde para que el formulario entre
                entero en la pantalla. */}
            <section
              className="producer-hero"
              hidden={producerTab === "publish"}
            >
              <Image
                src="/imagenes/fotos/campo.webp"
                alt=""
                fill
                priority
                sizes="100vw"
              />
              <div className="producer-hero-overlay" />
              <div className="producer-hero-content">
                <span className="site-hero-eyebrow">Tu espacio</span>
                <h1>{nombre ? `Bienvenido, ${nombre}` : "Bienvenido, productor"}</h1>
                <p>
                  Presentá el lote y reuní su documentación en un solo lugar.
                </p>
                <button
                  className="site-button site-button-light"
                  onClick={() => changeTab("publish")}
                >
                  <Plus aria-hidden strokeWidth={1.75} size={20} />
                  Publicar proyecto
                </button>
              </div>
            </section>
            <section className="producer-workspace">
              <nav
                className="producer-tabs"
                aria-label="Secciones del productor"
              >
                <button
                  aria-current={producerTab === "projects" ? "page" : undefined}
                  onClick={() => changeTab("projects")}
                >
                  Mis proyectos <span>{projects.length}</span>
                </button>
                <button
                  aria-current={producerTab === "publish" ? "page" : undefined}
                  onClick={() => changeTab("publish")}
                >
                  Publicar proyecto
                </button>
              </nav>
              <p className="producer-status" role="status">
                {message}
              </p>
              {producerTab === "projects" ? (
                <>
                  <div className="producer-projects">
                    {projects.map((project, index) => (
                      <article key={index}>
                        <div className="project-photo">
                          <Image
                            src={project.photo}
                            alt={`Hacienda ilustrativa de ${project.name}`}
                            fill
                            sizes="(max-width: 760px) 100vw, 550px"
                          />
                          <span>Imagen ilustrativa</span>
                        </div>
                        <div className="project-card-top">
                          <span>
                            Proyecto {String(index + 1).padStart(2, "0")}
                          </span>
                          <strong
                            className={
                              project.status === "En ejecución"
                                ? "project-status-active"
                                : undefined
                            }
                          >
                            {project.status} · Demo
                          </strong>
                        </div>
                        <h2>{project.name}</h2>
                        <p>
                          {project.place} · {project.system}
                        </p>
                        <dl>
                          <div>
                            <dt>Cabezas declaradas</dt>
                            <dd>{project.heads}</dd>
                          </div>
                          <div>
                            <dt>Categoría</dt>
                            <dd>{project.category}</dd>
                          </div>
                          <div>
                            <dt>Situación del lote</dt>
                            <dd>{SITUACION_CORTA[project.possession] ?? project.possession}</dd>
                          </div>
                        </dl>
                        <div className="project-review-note">
                          <FileText aria-hidden strokeWidth={1.75} size={20} />
                          <p>
                            {project.documentHeads === null
                              ? "Legajo pendiente. El ciclo requiere documentación y revisión antes de publicarse."
                              : project.heads !== project.documentHeads
                                ? "Hay una diferencia entre las cabezas declaradas y el DT-e de ejemplo. Falta revisión."
                                : "Las cabezas coinciden en el ejemplo. La autenticidad documental requiere un control separado."}
                          </p>
                        </div>
                        <button
                          className="site-button project-open"
                          aria-expanded={selectedProject === index}
                          aria-controls="project-legajo"
                          onClick={() => setSelectedProject(index)}
                        >
                          Ver legajo del ciclo
                          <ArrowRight
                            aria-hidden
                            strokeWidth={1.75}
                            size={20}
                          />
                        </button>
                      </article>
                    ))}
                  </div>
                  {selected && (
                    <section
                      className="project-legajo legajo"
                      id="project-legajo"
                      tabIndex={-1}
                      aria-label={`Legajo de ${selected.name}`}
                    >
                      <header className="legajo-head">
                        <div>
                          <span className="site-eyebrow">Legajo del ciclo</span>
                          <h2>{selected.name}</h2>
                          <p>
                            {selected.place} · {selected.system} ·{" "}
                            {selected.status}
                          </p>
                        </div>
                        <button
                          className="legajo-close"
                          onClick={() => setSelectedProject(null)}
                        >
                          <X aria-hidden strokeWidth={1.75} size={18} />
                          Cerrar
                        </button>
                      </header>

                      {/* Tres tarjetas, una por pregunta: ¿coinciden las
                          cabezas?, ¿están los papeles?, ¿cómo sigue el ciclo? */}
                      <div className="legajo-cards">
                        <article className="legajo-card">
                          <h3>
                            <Scale aria-hidden strokeWidth={1.75} size={20} />
                            Las cabezas
                          </h3>
                          <dl className="legajo-numbers">
                            <div>
                              <dt>Declaraste</dt>
                              <dd>{selected.heads}</dd>
                            </div>
                            <div>
                              <dt>Dice el DT-e</dt>
                              <dd
                                className={
                                  selected.documentHeads === null
                                    ? "legajo-empty"
                                    : "codigo"
                                }
                              >
                                {selected.documentHeads ?? "—"}
                              </dd>
                            </div>
                          </dl>
                          {selected.documentHeads === null ? (
                            <p className="legajo-chip legajo-chip-neutral">
                              Falta subir el DT-e para comparar
                            </p>
                          ) : selected.heads !== selected.documentHeads ? (
                            <p className="legajo-chip legajo-chip-alert">
                              {Math.abs(selected.heads - selected.documentHeads)}{" "}
                              cabezas de diferencia: hay que revisar
                            </p>
                          ) : (
                            <p className="legajo-chip legajo-chip-ok">
                              Coinciden
                            </p>
                          )}
                        </article>

                        <article className="legajo-card">
                          <h3>
                            <FileCheck aria-hidden strokeWidth={1.75} size={20} />
                            Papeles del lote
                          </h3>
                          <ul className="legajo-list">
                            <li>
                              <span>RENSPA</span>
                              <span className="legajo-chip legajo-chip-alert">
                                Falta control oficial
                              </span>
                            </li>
                            <li>
                              <span>DT-e y caravanas RFID</span>
                              {selected.documentHeads === null ? (
                                <span className="legajo-chip legajo-chip-alert">
                                  Falta subir
                                </span>
                              ) : (
                                <span className="legajo-chip legajo-chip-neutral">
                                  Leído, sin autenticar
                                </span>
                              )}
                            </li>
                          </ul>
                        </article>

                        <article className="legajo-card">
                          <h3>
                            <CalendarClock
                              aria-hidden
                              strokeWidth={1.75}
                              size={20}
                            />
                            Durante el ciclo
                          </h3>
                          <ul className="legajo-list">
                            <li>
                              <span>Pesadas y sanidad</span>
                              {selected.status === "En ejecución" ? (
                                <span className="legajo-chip legajo-chip-ok">
                                  En curso
                                </span>
                              ) : (
                                <span className="legajo-chip legajo-chip-neutral">
                                  Cuando arranque
                                </span>
                              )}
                            </li>
                            <li>
                              <span>Romaneo de playa</span>
                              <span className="legajo-chip legajo-chip-neutral">
                                Al cierre
                              </span>
                            </li>
                          </ul>
                        </article>
                      </div>

                      <p className="legajo-note">
                        Datos ficticios: no se leyó ningún documento real ni se
                        consultó a SENASA. Que los datos coincidan no prueba
                        que el papel sea auténtico; eso se controla aparte.
                      </p>
                    </section>
                  )}
                  <p className="producer-local-note">
                    Los dos ciclos son ficticios. Las propuestas nuevas se
                    conservan solo mientras permanecés en esta página; al
                    recargar o salir se restablecen los ejemplos.
                  </p>
                </>
              ) : (
                <div className="publish-layout">
                  <form
                    className="publish-form"
                    onChange={() => setDirty(true)}
                    onSubmit={(event) => {
                      event.preventDefault();
                      const data = new FormData(event.currentTarget);
                      setProjects((previous) => [
                        ...previous,
                        {
                          name: String(data.get("name")).trim(),
                          place: String(data.get("place")).trim(),
                          heads: Number(data.get("heads")),
                          system: String(data.get("system")),
                          category: String(data.get("category")),
                          possession: String(data.get("possession")),
                          description: String(data.get("description")).trim(),
                          status: "En revisión",
                          photo: "/guardian/engorde.jpg",
                          documentHeads: null,
                        },
                      ]);
                      setDirty(false);
                      setMessage(
                        "Ciclo de prueba registrado como En revisión. No se publicó ni se envió a ningún tercero.",
                      );
                      setProducerTab("projects");
                      window.history.replaceState(null, "", "/producer");
                    }}
                  >
                    <span className="site-eyebrow">Nuevo ciclo</span>
                    <h2>Contanos sobre el lote.</h2>
                    <p>
                      Primero los datos del ciclo; después, la documentación.
                    </p>
                    <div className="publish-fields">
                    <label>
                      Nombre del proyecto
                      <input
                        name="name"
                        autoComplete="off"
                        required
                        maxLength={100}
                        placeholder="Ej.: Engorde Los Aromos…"
                      />
                    </label>
                    <label>
                      Establecimiento y ubicación
                      <input
                        name="place"
                        autoComplete="off"
                        required
                        maxLength={150}
                        placeholder="Ej.: Los Aromos, Tandil…"
                      />
                    </label>
                    </div>
                    <div className="publish-fields publish-fields-4">
                      <label>
                        Sistema de engorde
                        <select name="system">
                          <option>A corral</option>
                          <option>Mixto</option>
                          <option>A pastura</option>
                        </select>
                      </label>
                      <label>
                        Cabezas declaradas
                        <input
                          name="heads"
                          inputMode="numeric"
                          type="number"
                          min={1}
                          max={1000}
                          step={1}
                          required
                          placeholder="Ej.: 80…"
                        />
                      </label>
                      <label>
                        Categoría
                        <select name="category">
                          <option>Novillito</option>
                          <option>Vaquillona</option>
                          <option>Ternero</option>
                          <option>Ternera</option>
                          <option>Novillo</option>
                        </select>
                      </label>
                      <label>
                        Situación del lote
                        <select name="possession">
                          <option value="Animales en el establecimiento">En el campo</option>
                          <option value="Animales a incorporar">A incorporar</option>
                          <option value="Lote parcialmente incorporado">Una parte</option>
                        </select>
                      </label>
                    </div>
                    <label>
                      Descripción del ciclo
                      <textarea
                        name="description"
                        required
                        maxLength={1000}
                        placeholder="Contá cómo será el manejo, la alimentación y la sanidad…"
                      />
                    </label>
                    <button className="site-button" type="submit">
                      Enviar a revisión · Demo
                      <ArrowRight aria-hidden strokeWidth={1.75} size={20} />
                    </button>
                  </form>
                  <aside className="publish-checklist">
                    <span className="site-eyebrow">Vas a necesitar</span>
                    {[
                      "RENSPA y documentación del establecimiento.",
                      "DT-e y listado de caravanas RFID, según la situación del lote.",
                      "Boleto de compra-venta cuando corresponda.",
                      "Plan de alimentación, sanidad y manejo.",
                      "Pesadas durante el ciclo y romaneo de playa al cierre.",
                    ].map((text) => (
                      <p key={text}>
                        <FileText aria-hidden strokeWidth={1.75} size={20} />
                        {text}
                      </p>
                    ))}
                    <div className="publish-destination">
                      <CheckCircle2 aria-hidden strokeWidth={1.75} size={22} />
                      <p>
                        Lo que cargás es declarado: todavía no se comparó con
                        documentación. No uses datos personales ni comprobantes
                        reales en esta demo.
                      </p>
                    </div>
                  </aside>
                </div>
              )}
            </section>
          </>
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
                  <Link href="/producer" className="site-button">
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
          <Link href="/producer" onClick={mayLeave}>
            Espacio productor
          </Link>
        </div>
        <p>
          Prototipo académico · Datos de prueba · No constituye oferta pública.
        </p>
      </footer>
    </div>
  );
}
