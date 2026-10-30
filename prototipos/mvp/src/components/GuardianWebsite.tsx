"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  Menu,
  Plus,
  Sprout,
  Tractor,
  X,
} from "lucide-react";
import { Logo } from "./layout/Logo";

type Section = "home" | "about" | "invest" | "producer";
type Project = {
  name: string;
  place: string;
  heads: number;
  amount: number;
  system: string;
  months: number;
  status: "En evaluación" | "En ejecución";
  photo: string;
};
const demoProjects: Project[] = [
  {
    name: "Engorde Los Aromos",
    place: "Tandil, Buenos Aires",
    heads: 80,
    amount: 48000000,
    system: "A corral",
    months: 8,
    status: "En evaluación",
    photo: "/guardian/proyecto.jpg",
  },
  {
    name: "Ciclo La Esperanza",
    place: "Rafaela, Santa Fe",
    heads: 120,
    amount: 72000000,
    system: "Mixto",
    months: 10,
    status: "En ejecución",
    photo: "/guardian/cierre.jpg",
  },
];
const nav = [
  ["home", "/", "Inicio"],
  ["about", "/quienes-somos", "Quiénes somos"],
  ["invest", "/como-invertir", "Cómo invertir"],
  ["contact", "/#consultas", "Consultas"],
];
const currency = (amount: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);

export function GuardianWebsite({ section = "home" }: { section?: Section }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [producerTab, setProducerTab] = useState<"projects" | "publish">(
    "projects",
  );
  const [projects, setProjects] = useState<Project[]>(demoProjects);
  const [message, setMessage] = useState("");
  const producer = section === "producer";
  const title =
    section === "about" ? (
      <>
        Personas que conectan.
        <br />
        <em>Proyectos que crecen.</em>
      </>
    ) : section === "invest" ? (
      <>
        Entendé el proyecto.
        <br />
        <em>Decidí con información.</em>
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
      <header className="site-header">
        <Link href="/" className="site-brand" aria-label="Guardian, inicio">
          <Logo size={40} />
          <span>Guardian</span>
        </Link>
        <button
          className="site-menu-toggle"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
        <nav
          className={menuOpen ? "site-nav is-open" : "site-nav"}
          aria-label="Navegación principal"
        >
          {nav.map(([id, href, label]) => (
            <Link
              key={id}
              href={href}
              aria-current={section === id ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="site-profile">
          <button
            className="profile-trigger"
            aria-expanded={profileOpen}
            aria-controls="profile-options"
            onClick={() => setProfileOpen((open) => !open)}
          >
            {producer ? <Tractor size={15} /> : <Sprout size={15} />}
            <span>Cambiar perfil</span>
            <ChevronDown size={14} />
          </button>
          {profileOpen && (
            <>
              <button
                className="profile-backdrop"
                aria-label="Cerrar selección de perfil"
                onClick={() => setProfileOpen(false)}
              />
              <div id="profile-options" className="profile-options">
                <span>¿CÓMO QUERÉS RECORRER GUARDIAN?</span>
                <Link
                  href="/como-invertir"
                  onClick={() => setProfileOpen(false)}
                >
                  <Sprout size={20} />
                  <div>
                    <strong>Quiero conocer cómo invertir</strong>
                    <small>Información y funcionamiento del fideicomiso</small>
                  </div>
                </Link>
                <Link href="/producer" onClick={() => setProfileOpen(false)}>
                  <Tractor size={20} />
                  <div>
                    <strong>Soy productor</strong>
                    <small>Mis proyectos y nueva propuesta</small>
                  </div>
                </Link>
              </div>
            </>
          )}
        </div>
      </header>

      <main id="contenido">
        {producer ? (
          <>
            <div className="producer-demo-bar">
              Espacio de productor · Demo académica · No se publican proyectos
              ni se envían datos reales
            </div>
            <section className="producer-workspace">
              <div className="producer-heading">
                <div>
                  <span className="site-eyebrow">TU ESPACIO EN GUARDIAN</span>
                  <h1>
                    Hagamos crecer
                    <br />
                    tu próximo proyecto.
                  </h1>
                  <p>
                    Reuní la información del ciclo y presentá tu propuesta para
                    evaluación.
                  </p>
                </div>
                <button
                  className="site-button"
                  onClick={() => {
                    setProducerTab("publish");
                    setMessage("");
                  }}
                >
                  <Plus size={17} /> Publicar proyecto
                </button>
              </div>
              <nav
                className="producer-tabs"
                aria-label="Secciones del productor"
              >
                <button
                  aria-current={producerTab === "projects" ? "page" : undefined}
                  onClick={() => setProducerTab("projects")}
                >
                  Mis proyectos <span>{projects.length}</span>
                </button>
                <button
                  aria-current={producerTab === "publish" ? "page" : undefined}
                  onClick={() => setProducerTab("publish")}
                >
                  Publicar proyecto
                </button>
              </nav>
              <p className="producer-status" role="status">
                {message}
              </p>
              {producerTab === "projects" ? (
                <>
                  {projects.length === 0 ? (
                    <div className="producer-empty">
                      <span>
                        <Tractor size={32} />
                      </span>
                      <h2>Tu próximo ciclo empieza acá.</h2>
                      <p>
                        Presentá el lote, el destino de los fondos y las
                        condiciones del engorde. Guardian revisa la propuesta
                        antes de habilitar su publicación.
                      </p>
                      <button
                        className="site-button"
                        onClick={() => setProducerTab("publish")}
                      >
                        Crear mi primer proyecto <ArrowRight size={17} />
                      </button>
                      <small>
                        Usá datos ficticios para recorrer esta demostración.
                      </small>
                    </div>
                  ) : (
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
                              GRD-DEMO-{String(index + 1).padStart(3, "0")}
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
                              <dt>
                                {project.status === "En ejecución"
                                  ? "Hacienda del proyecto"
                                  : "Hacienda a comprar"}
                              </dt>
                              <dd>{project.heads} cabezas</dd>
                            </div>
                            <div>
                              <dt>
                                {project.status === "En ejecución"
                                  ? "Aporte del proyecto"
                                  : "Monto solicitado"}
                              </dt>
                              <dd>{currency(project.amount)}</dd>
                            </div>
                            <div>
                              <dt>Plazo propuesto</dt>
                              <dd>{project.months} meses</dd>
                            </div>
                          </dl>
                          <div className="project-review-note">
                            <FileText size={18} />
                            <p>
                              {project.status === "En ejecución"
                                ? "Seguimiento del ciclo: alimentación, sanidad y evolución del lote. Estado y valores simulados para esta demostración."
                                : "Próximo paso: revisión del presupuesto y del legajo. Este ejemplo no se envió a Guardian."}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                  <p className="producer-local-note">
                    Estos dos proyectos son ficticios. Las propuestas nuevas
                    solo se conservan mientras permanecés en esta página; al
                    recargar o salir se restablecen los ejemplos iniciales.
                  </p>
                </>
              ) : (
                <div className="publish-layout">
                  <form
                    className="publish-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const data = new FormData(e.currentTarget);
                      setProjects((previous) => [
                        ...previous,
                        {
                          name: String(data.get("name")).trim(),
                          place: String(data.get("place")).trim(),
                          heads: Number(data.get("heads")),
                          amount: Number(data.get("amount")),
                          system: String(data.get("system")),
                          months: Number(data.get("months")),
                          status: "En evaluación",
                          photo: "/guardian/engorde.jpg",
                        },
                      ]);
                      setMessage(
                        "Propuesta de prueba registrada como En evaluación. No se publicó ni se envió a ningún tercero.",
                      );
                      setProducerTab("projects");
                    }}
                  >
                    <span className="site-eyebrow">NUEVA PROPUESTA</span>
                    <h2>Contanos sobre el ciclo.</h2>
                    <p>
                      Completá la información básica. La publicación requiere
                      una evaluación posterior.
                    </p>
                    <label>
                      Nombre del proyecto
                      <input
                        name="name"
                        required
                        maxLength={100}
                        placeholder="Ej.: Engorde Los Aromos"
                      />
                    </label>
                    <label>
                      Establecimiento y ubicación
                      <input
                        name="place"
                        required
                        maxLength={150}
                        placeholder="Ej.: Los Aromos, Tandil, Buenos Aires"
                      />
                    </label>
                    <div className="publish-fields">
                      <label>
                        Sistema de engorde
                        <select name="system">
                          <option>A corral</option>
                          <option>Mixto</option>
                          <option>A pastura</option>
                        </select>
                      </label>
                      <label>
                        Cabezas a comprar
                        <input
                          name="heads"
                          required
                          type="number"
                          min={1}
                          max={1000}
                          step={1}
                          placeholder="100"
                        />
                      </label>
                      <label>
                        Monto solicitado (ARS)
                        <input
                          name="amount"
                          required
                          type="number"
                          min={1}
                          step="0.01"
                          placeholder="Monto para compra de hacienda"
                        />
                      </label>
                      <label>
                        Plazo propuesto (meses)
                        <input
                          name="months"
                          required
                          type="number"
                          min={1}
                          max={36}
                          step={1}
                          placeholder="6"
                        />
                      </label>
                    </div>
                    <label>
                      Descripción del ciclo
                      <textarea
                        name="description"
                        required
                        maxLength={1000}
                        placeholder="Qué hacienda se compra, qué capacidad tenés disponible y cómo se llevará adelante el engorde."
                      />
                    </label>
                    <div className="publish-destination">
                      <CheckCircle2 size={19} />
                      <p>
                        Destino de los fondos: compra de hacienda. Alimentación,
                        sanidad y manejo a cargo del productor, según las
                        condiciones del proyecto.
                      </p>
                    </div>
                    <button className="site-button" type="submit">
                      Enviar proyecto a evaluación · Demo{" "}
                      <ArrowRight size={17} />
                    </button>
                  </form>
                  <aside className="publish-checklist">
                    <span className="site-eyebrow">ANTES DE PUBLICAR</span>
                    <h3>Información que vamos a necesitar.</h3>
                    {[
                      "Identificación del productor y disponibilidad del establecimiento.",
                      "Datos del RENSPA y condiciones sanitarias aplicables.",
                      "Presupuesto de compra e identificación del vendedor.",
                      "Cantidad, categoría y sistema de identificación de la hacienda.",
                      "Capacidad, alimentación y plan de manejo durante el ciclo.",
                    ].map((text) => (
                      <p key={text}>
                        <FileText size={17} />
                        {text}
                      </p>
                    ))}
                    <small>
                      En esta demo no subas documentación personal. El legajo se
                      define para cada operación y se revisa antes de aprobar.
                    </small>
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
                      ? "/guardian/engorde.jpg"
                      : section === "invest"
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
                    ? "QUIÉNES SOMOS"
                    : section === "invest"
                      ? "CÓMO INVERTIR"
                      : "CAPITAL QUE ACOMPAÑA AL CAMPO"}
                </span>
                <h1>{title}</h1>
                <p>
                  {section === "about"
                    ? "Guardian nace para acercar el capital a productores que tienen capacidad para crecer y necesitan financiar la compra de hacienda."
                    : section === "invest"
                      ? "Una participación en un ciclo ganadero empieza por conocer sus condiciones, sus riesgos y quién administra los fondos."
                      : "Conectamos a productores ganaderos con personas que quieren participar de un proyecto concreto, con información clara y seguimiento de principio a fin."}
                </p>
                <Link
                  className="site-button site-button-light"
                  href={section === "invest" ? "#pasos" : "/como-invertir"}
                >
                  {section === "invest"
                    ? "Conocer los pasos"
                    : "Conocé cómo invertir"}
                  <ArrowRight size={18} />
                </Link>
              </div>
              <span className="site-hero-demo">
                Prototipo académico · Datos ilustrativos · Sin recepción de
                aportes
              </span>
            </section>
            {section === "home" && (
              <>
                <section className="site-section site-introduction">
                  <span className="site-eyebrow">
                    UN PROYECTO CON UN DESTINO CONCRETO
                  </span>
                  <h2>
                    El campo tiene capacidad.
                    <br />
                    El capital puede ponerla en marcha.
                  </h2>
                  <p>
                    Guardian propone financiar la compra de hacienda para un
                    ciclo de engorde. El productor aporta su capacidad y
                    trabajo; el inversor participa del resultado. Cada proyecto
                    tiene sus propias condiciones y se estructura mediante un
                    fideicomiso.
                  </p>
                  <Link className="site-text-link" href="/quienes-somos">
                    Conocé quiénes somos <ArrowUpRight size={18} />
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
                    Un lote real.
                    <br />
                    Una historia que podés seguir.
                  </h2>
                </section>
                <section className="site-section">
                  <div className="site-section-heading">
                    <span className="site-eyebrow">ASÍ FUNCIONA GUARDIAN</span>
                    <h2>
                      Del aporte al resultado,
                      <br />
                      con las reglas claras.
                    </h2>
                  </div>
                  <div className="site-three-steps">
                    {[
                      [
                        "01",
                        "Conocés el proyecto",
                        "Quién produce, qué se compra, cuánto dura el ciclo y cuáles son los riesgos y costos.",
                      ],
                      [
                        "02",
                        "Participás mediante el fideicomiso",
                        "Una vez cumplidas las condiciones de acceso y adhesión, el aporte va a la cuenta del fideicomiso. El fiduciario externo administra los fondos.",
                      ],
                      [
                        "03",
                        "Seguís su evolución",
                        "El productor informa avances. Tras la venta y el cobro, el fiduciario liquida y distribuye los fondos según el contrato.",
                      ],
                    ].map(([n, t, b]) => (
                      <article key={n}>
                        <span>{n}</span>
                        <h3>{t}</h3>
                        <p>{b}</p>
                      </article>
                    ))}
                  </div>
                  <Link className="site-text-link" href="/como-invertir">
                    Entendé cómo participar <ArrowRight size={17} />
                  </Link>
                </section>
                <section className="site-producer-banner">
                  <div>
                    <span className="site-eyebrow">PARA QUIENES PRODUCEN</span>
                    <h2>
                      Tu próximo ciclo
                      <br />
                      también empieza acá.
                    </h2>
                    <p>
                      Presentá una propuesta para financiar la compra de
                      hacienda y reuní su información en un solo lugar.
                    </p>
                  </div>
                  <Link href="/producer" className="site-button">
                    Soy productor <ArrowRight size={17} />
                  </Link>
                </section>
              </>
            )}
            {section === "about" && (
              <>
                <section className="site-section site-introduction">
                  <span className="site-eyebrow">NUESTRO PROPÓSITO</span>
                  <h2>
                    Acercar dos necesidades.
                    <br />
                    Construir un vínculo claro.
                  </h2>
                  <p>
                    Hay productores con infraestructura y capacidad de engorde
                    que necesitan capital para comprar animales. Del otro lado,
                    hay personas interesadas en participar de la economía
                    productiva y entender el destino de su aporte. Guardian
                    busca conectar esas necesidades mediante proyectos
                    documentados.
                  </p>
                  <p className="site-honest-note">
                    Guardian es un proyecto en desarrollo presentado como tesis.
                    Esta web es un prototipo: no acredita operaciones,
                    autorizaciones ni antecedentes comerciales.
                  </p>
                </section>
                <section className="site-photo-band">
                  <Image
                    src="/guardian/cierre.jpg"
                    alt="Hacienda en un establecimiento ganadero"
                    fill
                    sizes="100vw"
                  />
                  <div />
                  <h2>
                    Cada parte tiene un rol.
                    <br />
                    Cada proyecto, sus reglas.
                  </h2>
                </section>
                <section className="site-section">
                  <div className="site-three-steps">
                    {[
                      [
                        "El productor",
                        "Ejecuta el engorde, asume alimentación, sanidad y manejo según el contrato e informa la evolución del lote.",
                      ],
                      [
                        "El fiduciario externo",
                        "Administra el patrimonio separado, realiza los pagos y distribuye los fondos efectivamente disponibles conforme al contrato.",
                      ],
                      [
                        "Guardian",
                        "Coordina la evaluación, la documentación, el seguimiento y la comunicación. No ofrece una billetera con saldo disponible.",
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
            {section === "invest" && (
              <>
                <section className="site-section" id="pasos">
                  <span className="site-eyebrow">
                    ANTES DE TOMAR UNA DECISIÓN
                  </span>
                  <h2>
                    Cómo sería participar,
                    <br />
                    paso a paso.
                  </h2>
                  <div className="invest-steps">
                    {[
                      [
                        "01",
                        "Accedé a la propuesta",
                        "La etapa inicial prevé vinculación privada. El acceso a proyectos debe ser autorizado; esta página solo explica el funcionamiento.",
                      ],
                      [
                        "02",
                        "Revisá las condiciones",
                        "Conocé al productor, el lote, el destino del aporte, la duración, la moneda, los costos y los riesgos. Revisá quién es el fiduciario y cómo se distribuyen resultados y pérdidas.",
                      ],
                      [
                        "03",
                        "Completá la adhesión",
                        "La identificación y la documentación contractual deben estar completas antes de aportar. En esta demo no se celebran contratos.",
                      ],
                      [
                        "04",
                        "Aportá a la cuenta del fideicomiso",
                        "En una operación habilitada, el dinero se transfiere a la cuenta indicada para ese proyecto. La acreditación se confirma con evidencia bancaria.",
                      ],
                      [
                        "05",
                        "Seguí el ciclo y su liquidación",
                        "Consultá los avances y las rendiciones. Después de vender y cobrar, el fiduciario liquida las obligaciones y distribuye los fondos disponibles según lo pactado.",
                      ],
                    ].map(([n, t, b]) => (
                      <article key={n}>
                        <span>{n}</span>
                        <div>
                          <h3>{t}</h3>
                          <p>{b}</p>
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
                    Información para entender.
                    <br />
                    Tiempo para decidir.
                  </h2>
                </section>
                <section className="site-section site-invest-faq">
                  <span className="site-eyebrow">PREGUNTAS IMPORTANTES</span>
                  <h2>Lo que tenés que saber.</h2>
                  {[
                    [
                      "¿El rendimiento está garantizado?",
                      "No. El resultado es variable y depende de la venta, los gastos y las reglas del contrato. Puede haber pérdidas, incluso del capital aportado, y demoras.",
                    ],
                    [
                      "¿Puedo retirar el aporte en cualquier momento?",
                      "No se ofrece rescate inmediato. El plazo de engorde es distinto del plazo total hasta el cobro y la liquidación. Las condiciones de salida deben estar previstas contractualmente.",
                    ],
                    [
                      "¿Qué es un fideicomiso?",
                      "Es un contrato por el cual se transmiten bienes a un fiduciario para cumplir un fin acordado. Los bienes conforman un patrimonio separado. Esa separación no garantiza rentabilidad ni elimina las responsabilidades legales.",
                    ],
                    [
                      "¿Qué información debería recibir?",
                      "Contrato, condiciones de adhesión, presupuesto, costos, riesgos, reglas de distribución, documentación del lote y rendiciones. Cada dato debe distinguir lo declarado de lo efectivamente verificado.",
                    ],
                    [
                      "¿Puedo invertir desde esta web?",
                      "No. Es una demostración académica. No recibe aportes, no habilita suscripciones y no permite ejecutar inversiones.",
                    ],
                  ].map(([q, a]) => (
                    <details key={q}>
                      <summary>
                        {q}
                        <ChevronDown size={17} />
                      </summary>
                      <p>{a}</p>
                    </details>
                  ))}
                </section>
              </>
            )}
            <section className="site-section site-consultations" id="consultas">
              <div>
                <span className="site-eyebrow">
                  CONVERSAR ES EL PRIMER PASO
                </span>
                <h2>
                  ¿Querés entender
                  <br />
                  un poco más?
                </h2>
                <p>
                  Encontrá respuestas sobre los aportes, los plazos, la
                  administración y el resultado de un proyecto.
                </p>
              </div>
              <Link href="/como-invertir#pasos" className="site-button">
                Ver información para invertir <ArrowRight size={17} />
              </Link>
              <p className="site-consultation-note">
                Durante esta demo no se envían consultas ni se recopilan datos
                de contacto.
              </p>
            </section>
          </>
        )}
      </main>
      <footer className="site-footer">
        <Link href="/" className="site-brand">
          <Logo size={30} />
          <span>Guardian</span>
        </Link>
        <div>
          <Link href="/quienes-somos">Quiénes somos</Link>
          <Link href="/como-invertir">Cómo invertir</Link>
          <Link href="/producer">Espacio productor</Link>
        </div>
        <p>
          Prototipo académico · No recibe aportes ni celebra contratos. Las
          imágenes y los ejemplos son ilustrativos.
        </p>
      </footer>
    </div>
  );
}
