import { documentosRequeridos, formatFecha } from "@/lib/format";
import type {
  Aporte,
  Colaborador,
  Comision,
  CondicionesEconomicas,
  Contingencia,
  ControlRealizado,
  Discrepancia,
  Documento,
  EstadoProyecto,
  Garantia,
  HitoDesembolso,
  Liquidacion,
  Productor,
  Proyecto,
  RegistroSeguimiento,
  RubroPresupuesto,
  TipoDocumento,
} from "@/lib/types";

// Datos de demostración. Los valores de los documentos (DT-e, romaneo) están tomados
// de comprobantes reales aportados por el equipo, para que la demo muestre el
// comportamiento real de la extracción y no un caso de laboratorio.

/** El proyecto sin lo que se deriva de él. */
type ProyectoDeclarado = Omit<
  Proyecto,
  "plazoCobroDias" | "presupuesto" | "cronograma" | "controles" | "condiciones"
> & {
  condiciones: Omit<CondicionesEconomicas, "comisiones" | "contingencias">;
};

export const productores: Productor[] = [
  {
    id: "prod-1",
    nombre: "Tropa Agroganadera",
    razonSocial: "TROPA AGROGANADERA S.A.",
    responsable: "Marcelo Giraudo",
    correo: "marcelo@tropaagro.com.ar",
    telefono: "2494 55-6677",
    cuit: "30-71903430-2",
    renspa: "01.036.0.01532/04",
    marcaRegistrada: "TA-4471",
    establecimiento: "DOÑA INA",
    localidad: "Chenaut, Exaltación de la Cruz",
    provincia: "Buenos Aires",
    sistemaProductivo: "corral",
    capacidadInstalada: 1200,
    ocupacionActual: 760,
    ciclosCompletados: 4,
  },
  {
    id: "prod-2",
    nombre: "La Redención",
    razonSocial: "LA REDENCIÓN S.R.L.",
    responsable: "Silvina Ferreyra",
    correo: "silvina@laredencion.com.ar",
    telefono: "3472 41-9080",
    cuit: "30-70912844-7",
    renspa: "02.017.0.00841/11",
    marcaRegistrada: "LR-0912",
    establecimiento: "LA REDENCIÓN",
    localidad: "Marcos Juárez",
    provincia: "Córdoba",
    sistemaProductivo: "mixto",
    capacidadInstalada: 800,
    ocupacionActual: 310,
    ciclosCompletados: 1,
  },
  {
    id: "prod-3",
    nombre: "El Amanecer",
    razonSocial: "GANADERA EL AMANECER S.A.",
    responsable: "Hugo Brambilla",
    correo: "hugo@elamanecer.com.ar",
    telefono: "3462 30-1144",
    cuit: "30-71554098-5",
    renspa: "03.084.0.02219/07",
    marcaRegistrada: "EA-2219",
    establecimiento: "EL AMANECER",
    localidad: "Venado Tuerto",
    provincia: "Santa Fe",
    sistemaProductivo: "pastura",
    capacidadInstalada: 600,
    ocupacionActual: 540,
    ciclosCompletados: 2,
  },
];

/**
 * Las garantías viven en el productor y los proyectos las apuntan. El cupo es el
 * tope de proyectos vivos que cada una puede respaldar a la vez; un ciclo cerrado
 * la libera.
 */
export const garantias: Garantia[] = [
  {
    id: "gar-1",
    productorId: "prod-1",
    tipo: "hipoteca",
    identificacion: "Matrícula 12.847 — Partido de Rojas",
    descripcion:
      "Primera hipoteca sobre 180 hectáreas del establecimiento, constituida a favor del fideicomiso marco.",
    valuacionArs: 630_000_000,
    cupoProyectos: 2,
    vigenciaHasta: "2028-03-31",
    estado: "vigente",
    estadoConstitucion: "constituida",
    instrumento: "Escritura inscripta en el registro que corresponde (dato demostrativo)",
    documentoId: null,
  },
  {
    id: "gar-2",
    productorId: "prod-1",
    tipo: "prenda_rodeo",
    identificacion: "Registro prendario 4.192/25",
    descripcion:
      "Prenda sobre las cabezas identificadas por caravana en el listado RFID de cada proyecto.",
    valuacionArs: 144_000_000,
    cupoProyectos: 2,
    vigenciaHasta: "2026-12-31",
    estado: "vigente",
    estadoConstitucion: "constituida",
    instrumento: "Escritura inscripta en el registro que corresponde (dato demostrativo)",
    documentoId: null,
  },
  {
    id: "gar-3",
    productorId: "prod-1",
    tipo: "aval_establecimiento",
    identificacion: "Aval La Josefina Agropecuaria S.A.",
    descripcion:
      "La sociedad del grupo responde con su patrimonio por el incumplimiento del productor.",
    valuacionArs: 225_000_000,
    cupoProyectos: 2,
    vigenciaHasta: "2027-06-30",
    estado: "vigente",
    estadoConstitucion: "constituida",
    instrumento: "Escritura inscripta en el registro que corresponde (dato demostrativo)",
    documentoId: null,
  },
  {
    id: "gar-4",
    productorId: "prod-2",
    tipo: "hipoteca",
    identificacion: "Matrícula 3.508 — Partido de Bolívar",
    descripcion: "Hipoteca en segundo grado sobre el casco del establecimiento.",
    valuacionArs: 315_000_000,
    cupoProyectos: 2,
    vigenciaHasta: "2027-09-30",
    estado: "vigente",
    estadoConstitucion: "constituida",
    instrumento: "Escritura inscripta en el registro que corresponde (dato demostrativo)",
    documentoId: null,
  },
  {
    id: "gar-5",
    productorId: "prod-3",
    tipo: "cesion_derechos",
    identificacion: "Cesión 2025/14 — Frigorífico Gorina",
    descripcion:
      "Lo que el frigorífico paga por el lote se cobra directo en el fideicomiso, antes de pasar por el productor.",
    valuacionArs: 117_000_000,
    cupoProyectos: 1,
    vigenciaHasta: "2026-08-31",
    estado: "sin_verificar",
    estadoConstitucion: "propuesta",
    documentoId: null,
  },
];

/**
 * Lo que cada proyecto declara. El presupuesto, el cronograma, los controles y
 * el plazo de cobro se completan abajo desde estos mismos datos: escritos a mano
 * catorce veces terminarían contradiciendo el monto o el plazo del proyecto.
 */
const proyectosDeclarados: ProyectoDeclarado[] = [
  {
    id: "pry-1",
    productorId: "prod-1",
    titulo: "Engorde a corral — 180 novillitos",
    modalidad: "capital_trabajo",
    destinoFondosPrevio: "capital_trabajo",
    condiciones: {
      monedaAporte: "ARS",
      monedaDevolucion: "ARS",
      tasa: {
        tasaPct: 34,
        base: "ciclo",
        calculo: "Sobre el capital aportado, devengado a lo largo del ciclo y sin capitalización",
        vencimientos: "Un único vencimiento al cierre del ciclo, a los 120 días",
        fuente: "demostrativo",
      },
    },
    montoMinimoInicioArs: 52_050_000,
    destinoDetalle:
      "Ración balanceada de los 120 días, plan sanitario y mano de obra del corral. La hacienda ya es del establecimiento.",
    tipoPosesion: "existencia_comprobada",
    sistemaProductivo: "corral",
    cabezas: 180,
    categoria: "Novillito",
    raza: "Angus",
    pesoEntradaKg: 250,
    pesoSalidaObjetivoKg: 390,
    montoObjetivoArs: 86_850_000,
    montoRecaudadoArs: 52_950_000,
    montoLiberadoArs: 20_700_000,
    montoRetiradoArs: 20_700_000,
    plazoDias: 120,
    rendimientoEsperadoPct: 34,
    garantiaId: "gar-1",
    tieneSeguro: true,
    estado: "abierto",
    provincia: "Buenos Aires",
    fideicomiso: {
      serie: "Guardian Ganadero — Serie I",
      fiduciario: "Guardian S.A.S., fiduciario de la serie",
      fiduciantes:
        "Los colaboradores del proyecto, que aportan el capital, y TROPA AGROGANADERA S.A., que aporta la hacienda, el campo y el trabajo",
      fideicomisarios:
        "Los mismos colaboradores, en proporción a lo suscripto, y el productor por su porción del resultado",
      bienesFideicomitidos:
        "180 novillitos identificados con caravana RFID bajo el RENSPA 01.036.0.01532/04, y el capital suscripto por los colaboradores",
      objeto:
        "Engordar el lote durante el ciclo, venderlo a faena y repartir el producido entre los fideicomisarios",
      repartoResultado:
        "El resultado de la venta se reparte 65 % para los colaboradores y 35 % para el productor, sobre los kilos ganados en el ciclo",
      mortandad:
        "Hasta el 2 % de mortandad la absorbe el fideicomiso; por encima de ese piso responde el productor, salvo caso fortuito acreditado",
      inicioAt: "2026-08-21",
      extincionAt: "2027-02-17",
      rendicionCuentas: "Trimestral, y en todos los casos al cierre del ciclo",
      seguroResponsabilidadCivil:
        "Contratada, con cobertura de mortandad sobre el lote",
      inscripcion: "Registro Público de Comercio de la Provincia de Buenos Aires",
    },
    creadoAt: "2026-08-14",
    publicadoAt: "2026-08-21",
  },
  {
    id: "pry-2",
    productorId: "prod-2",
    titulo: "Compra e invernada — 220 terneros",
    modalidad: "compra_engorde",
    destinoFondosPrevio: "ciclo_engorde",
    condiciones: {
      monedaAporte: "ARS",
      monedaDevolucion: "ARS",
      participacion: {
        colaboradoresPct: 65,
        productorPct: 35,
        base: "Sobre el resultado neto de la venta, una vez cubiertos los gastos reconocidos del ciclo",
        fuente: "demostrativo",
      },
      proyeccion: {
        fecha: "2026-09-01",
        supuestos: [
          "Precio del kilo vivo al cierre igual al de la última semana",
          "Sin mortandad por encima de la prevista en el contrato",
          "Gastos del ciclo dentro del presupuesto aprobado",
        ],
        ingresosEstimadosArs: 164_124_000,
        costosEstimadosArs: 116_400_000,
        comisionesEstimadasArs: null,
      },
    },
    montoMinimoInicioArs: 69_900_000,
    destinoDetalle:
      "Compra de los 220 terneros. El campo, la pastura y el trabajo los pone el establecimiento.",
    tipoPosesion: "promesa_inversion",
    sistemaProductivo: "mixto",
    cabezas: 220,
    categoria: "Ternero",
    raza: "Braford",
    pesoEntradaKg: 190,
    pesoSalidaObjetivoKg: 330,
    montoObjetivoArs: 116_400_000,
    montoRecaudadoArs: 23_250_000,
    montoLiberadoArs: 0,
    montoRetiradoArs: 0,
    plazoDias: 180,
    rendimientoEsperadoPct: 41,
    garantiaId: "gar-4",
    tieneSeguro: true,
    estado: "abierto",
    provincia: "Córdoba",
    fideicomiso: {
      serie: "Guardian Ganadero — Serie II",
      fiduciario: "Guardian S.A.S., fiduciario de la serie",
      fiduciantes:
        "Los colaboradores del proyecto, que aportan el capital, y LA REDENCIÓN S.R.L., que aporta la hacienda, el campo y el trabajo",
      fideicomisarios:
        "Los mismos colaboradores, en proporción a lo suscripto, y el productor por su porción del resultado",
      bienesFideicomitidos:
        "220 terneros identificados con caravana RFID bajo el RENSPA 02.017.0.00841/11, y el capital suscripto por los colaboradores",
      objeto:
        "Engordar el lote durante el ciclo, venderlo a faena y repartir el producido entre los fideicomisarios",
      repartoResultado:
        "El resultado de la venta se reparte 65 % para los colaboradores y 35 % para el productor, sobre los kilos ganados en el ciclo",
      mortandad:
        "Hasta el 2 % de mortandad la absorbe el fideicomiso; por encima de ese piso responde el productor, salvo caso fortuito acreditado",
      inicioAt: "2026-09-09",
      extincionAt: "2027-05-07",
      rendicionCuentas: "Trimestral, y en todos los casos al cierre del ciclo",
      seguroResponsabilidadCivil:
        "Contratada, con cobertura de mortandad sobre el lote",
      inscripcion: "Registro Público de la Provincia de Córdoba",
    },
    creadoAt: "2026-09-02",
    publicadoAt: "2026-09-09",
  },
  {
    id: "pry-3",
    productorId: "prod-3",
    titulo: "Recría sobre pastura — 140 vaquillonas",
    modalidad: "compra_engorde",
    destinoFondosPrevio: "mixto",
    condiciones: {
      monedaAporte: "ARS",
      monedaDevolucion: "ARS",
      participacion: {
        colaboradoresPct: 65,
        productorPct: 35,
        base: "Sobre el resultado neto de la venta, una vez cubiertos los gastos reconocidos del ciclo",
        fuente: "demostrativo",
      },
      proyeccion: {
        fecha: "2026-09-01",
        supuestos: [
          "Precio del kilo vivo al cierre igual al de la última semana",
          "Sin mortandad por encima de la prevista en el contrato",
          "Gastos del ciclo dentro del presupuesto aprobado",
        ],
        ingresosEstimadosArs: 83_979_000,
        costosEstimadosArs: 65_100_000,
        comisionesEstimadasArs: null,
      },
    },
    montoMinimoInicioArs: 39_000_000,
    destinoDetalle:
      "Compra de 60 vaquillonas y suplementación proteica de todo el lote sobre pastura.",
    tipoPosesion: "hibrido",
    sistemaProductivo: "pastura",
    cabezas: 140,
    categoria: "Vaquillona",
    raza: "Angus colorado",
    pesoEntradaKg: 210,
    pesoSalidaObjetivoKg: 340,
    montoObjetivoArs: 65_100_000,
    montoRecaudadoArs: 65_100_000,
    montoLiberadoArs: 0,
    montoRetiradoArs: 0,
    plazoDias: 150,
    rendimientoEsperadoPct: 29,
    garantiaId: "gar-5",
    tieneSeguro: false,
    estado: "fondeado",
    provincia: "Santa Fe",
    fideicomiso: {
      serie: "Guardian Ganadero — Serie III",
      fiduciario: "Guardian S.A.S., fiduciario de la serie",
      fiduciantes:
        "Los colaboradores del proyecto, que aportan el capital, y GANADERA EL AMANECER S.A., que aporta la hacienda, el campo y el trabajo",
      fideicomisarios:
        "Los mismos colaboradores, en proporción a lo suscripto, y el productor por su porción del resultado",
      bienesFideicomitidos:
        "140 vaquillonas identificados con caravana RFID bajo el RENSPA 03.084.0.02219/07, y el capital suscripto por los colaboradores",
      objeto:
        "Engordar el lote durante el ciclo, venderlo a faena y repartir el producido entre los fideicomisarios",
      repartoResultado:
        "El resultado de la venta se reparte 65 % para los colaboradores y 35 % para el productor, sobre los kilos ganados en el ciclo",
      mortandad:
        "Hasta el 2 % de mortandad la absorbe el fideicomiso; por encima de ese piso responde el productor, salvo caso fortuito acreditado",
      inicioAt: "2026-08-04",
      extincionAt: "2027-03-02",
      rendicionCuentas: "Trimestral, y en todos los casos al cierre del ciclo",
      seguroResponsabilidadCivil:
        "Contratada la responsabilidad civil obligatoria; sin cobertura de mortandad",
      inscripcion: "Registro Público de Comercio de Santa Fe",
    },
    creadoAt: "2026-07-28",
    publicadoAt: "2026-08-04",
  },
  {
    id: "pry-4",
    productorId: "prod-1",
    titulo: "Engorde a corral — 200 vaquillonas",
    modalidad: "capital_trabajo",
    destinoFondosPrevio: "capital_trabajo",
    condiciones: {
      monedaAporte: "ARS",
      monedaDevolucion: "ARS",
      tasa: {
        tasaPct: 33,
        base: "ciclo",
        calculo: "Sobre el capital aportado, devengado a lo largo del ciclo y sin capitalización",
        vencimientos: "Un único vencimiento al cierre del ciclo, a los 120 días",
        fuente: "demostrativo",
      },
    },
    montoMinimoInicioArs: 59_550_000,
    destinoDetalle:
      "Ración, sanidad y mano de obra del ciclo. Los animales ya están en el corral.",
    tipoPosesion: "existencia_comprobada",
    sistemaProductivo: "corral",
    cabezas: 200,
    categoria: "Vaquillona",
    raza: "Angus",
    pesoEntradaKg: 240,
    pesoSalidaObjetivoKg: 380,
    montoObjetivoArs: 99_300_000,
    montoRecaudadoArs: 0,
    montoLiberadoArs: 0,
    montoRetiradoArs: 0,
    plazoDias: 120,
    rendimientoEsperadoPct: 33,
    garantiaId: "gar-2",
    tieneSeguro: true,
    estado: "en_validacion",
    provincia: "Buenos Aires",
    creadoAt: "2026-09-18",
  },
  {
    id: "pry-5",
    productorId: "prod-2",
    titulo: "Terminación a corral — 95 novillos",
    modalidad: "capital_trabajo",
    destinoFondosPrevio: "capital_trabajo",
    condiciones: {
      monedaAporte: "ARS",
      monedaDevolucion: "ARS",
      tasa: {
        tasaPct: null,
        base: null,
        calculo: "Sin pactar",
        vencimientos: "Sin pactar",
        fuente: "demostrativo",
      },
    },
    montoMinimoInicioArs: null,
    destinoDetalle:
      "Alimento de terminación, sanidad y flete a faena.",
    tipoPosesion: "existencia_comprobada",
    sistemaProductivo: "corral",
    cabezas: 95,
    categoria: "Novillo",
    raza: "Hereford",
    pesoEntradaKg: 320,
    pesoSalidaObjetivoKg: 450,
    montoObjetivoArs: 49_200_000,
    montoRecaudadoArs: 0,
    montoLiberadoArs: 0,
    montoRetiradoArs: 0,
    plazoDias: 90,
    rendimientoEsperadoPct: 26,
    garantiaId: "gar-4",
    tieneSeguro: true,
    estado: "en_validacion",
    provincia: "Córdoba",
    creadoAt: "2026-09-20",
  },
  {
    id: "pry-6",
    productorId: "prod-1",
    titulo: "Engorde a corral — 28 cabezas (ciclo cerrado)",
    modalidad: "capital_trabajo",
    destinoFondosPrevio: "capital_trabajo",
    condiciones: {
      monedaAporte: "ARS",
      monedaDevolucion: "ARS",
      tasa: {
        tasaPct: 31,
        base: "ciclo",
        calculo: "Sobre el capital aportado, devengado a lo largo del ciclo y sin capitalización",
        vencimientos: "Un único vencimiento al cierre del ciclo, a los 110 días",
        fuente: "demostrativo",
      },
    },
    montoMinimoInicioArs: 8_100_000,
    destinoDetalle:
      "Ración y sanidad del ciclo.",
    tipoPosesion: "existencia_comprobada",
    sistemaProductivo: "corral",
    cabezas: 28,
    categoria: "Vaquillona / Novillito",
    raza: "Angus",
    pesoEntradaKg: 240,
    pesoSalidaObjetivoKg: 330,
    montoObjetivoArs: 13_500_000,
    montoRecaudadoArs: 13_500_000,
    montoLiberadoArs: 13_500_000,
    montoRetiradoArs: 9_300_000,
    plazoDias: 110,
    rendimientoEsperadoPct: 31,
    garantiaId: "gar-3",
    tieneSeguro: true,
    estado: "cerrado",
    provincia: "Buenos Aires",
    fideicomiso: {
      serie: "Guardian Ganadero — Serie IV",
      fiduciario: "Guardian S.A.S., fiduciario de la serie",
      fiduciantes:
        "Los colaboradores del proyecto, que aportan el capital, y TROPA AGROGANADERA S.A., que aporta la hacienda, el campo y el trabajo",
      fideicomisarios:
        "Los mismos colaboradores, en proporción a lo suscripto, y el productor por su porción del resultado",
      bienesFideicomitidos:
        "28 vaquillona / novillitos identificados con caravana RFID bajo el RENSPA 01.036.0.01532/04, y el capital suscripto por los colaboradores",
      objeto:
        "Engordar el lote durante el ciclo, venderlo a faena y repartir el producido entre los fideicomisarios",
      repartoResultado:
        "El resultado de la venta se reparte 65 % para los colaboradores y 35 % para el productor, sobre los kilos ganados en el ciclo",
      mortandad:
        "Hasta el 2 % de mortandad la absorbe el fideicomiso; por encima de ese piso responde el productor, salvo caso fortuito acreditado",
      inicioAt: "2026-06-04",
      extincionAt: "2026-11-21",
      rendicionCuentas: "Trimestral, y en todos los casos al cierre del ciclo",
      seguroResponsabilidadCivil:
        "Contratada, con cobertura de mortandad sobre el lote",
      inscripcion: "Registro Público de Comercio de la Provincia de Buenos Aires",
    },
    creadoAt: "2026-05-30",
    publicadoAt: "2026-06-04",
    // Cifras del romaneo de playa real: 28 cabezas, 9.240 kg vivos, 5.437 kg de carne.
    resultado: {
      dteSalida: "32624494",
      cabezasFaena: 28,
      kilosVivos: 9240,
      kgCarne: 5437,
      rendimientoPct: 58.84,
      fecha: "2026-09-21",
    },
  },
  {
    id: "pry-7",
    productorId: "prod-3",
    titulo: "Invernada sobre pastura — 60 terneras",
    modalidad: "compra_engorde",
    destinoFondosPrevio: "ciclo_engorde",
    condiciones: {
      monedaAporte: "ARS",
      monedaDevolucion: "ARS",
      participacion: {
        colaboradoresPct: null,
        productorPct: null,
        base: "Sin pactar",
        fuente: "demostrativo",
      },
    },
    montoMinimoInicioArs: null,
    destinoDetalle:
      "Compra de las 60 terneras a la consignataria.",
    tipoPosesion: "promesa_inversion",
    sistemaProductivo: "pastura",
    cabezas: 60,
    categoria: "Ternera",
    raza: "Brangus",
    pesoEntradaKg: 180,
    pesoSalidaObjetivoKg: 300,
    montoObjetivoArs: 29_850_000,
    montoRecaudadoArs: 0,
    montoLiberadoArs: 0,
    montoRetiradoArs: 0,
    plazoDias: 180,
    rendimientoEsperadoPct: 38,
    garantiaId: "",
    tieneSeguro: false,
    estado: "borrador",
    provincia: "Santa Fe",
    creadoAt: "2026-09-22",
  },
  // Borrador a medio llenar: existe para que la ficha técnica tenga algo que
  // pedir. Los ceros y las cadenas vacías no son datos, son huecos.
  {
    id: "pry-8",
    productorId: "prod-1",
    titulo: "Recría a corral — 90 terneras",
    modalidad: "capital_trabajo",
    destinoFondosPrevio: "capital_trabajo",
    condiciones: {
      monedaAporte: "ARS",
      monedaDevolucion: "ARS",
      tasa: {
        tasaPct: null,
        base: null,
        calculo: "Sin pactar",
        vencimientos: "Sin pactar",
        fuente: "demostrativo",
      },
    },
    montoMinimoInicioArs: null,
    destinoDetalle:
      "",
    tipoPosesion: "existencia_comprobada",
    sistemaProductivo: "corral",
    cabezas: 90,
    categoria: "Ternera",
    raza: "Cruza británica",
    pesoEntradaKg: 190,
    pesoSalidaObjetivoKg: 0,
    montoObjetivoArs: 0,
    montoRecaudadoArs: 0,
    montoLiberadoArs: 0,
    montoRetiradoArs: 0,
    plazoDias: 150,
    rendimientoEsperadoPct: 0,
    garantiaId: "",
    tieneSeguro: false,
    estado: "borrador",
    provincia: "Buenos Aires",
    creadoAt: "2026-09-24",
  },
  // El caso que quedó sin clasificar al pasar de destino a modalidad. Se dejó
  // así a propósito: el texto no permite saber si el capital compra hacienda o
  // solo paga gastos, y adivinar sería peor que frenarlo. No se puede publicar
  // hasta que alguien lo resuelva.
  {
    id: "pry-14",
    productorId: "prod-1",
    titulo: "Ciclo 2026 — 110 novillitos",
    modalidad: null,
    motivoRevisionModalidad:
      "El proyecto venía cargado como mixto y el detalle no dice si el capital compra hacienda o solo financia los gastos del lote que ya está en el corral. Hasta saberlo no se puede decir si el colaborador participa del resultado o cobra una tasa.",
    destinoFondosPrevio: "mixto",
    condiciones: {
      monedaAporte: "ARS",
      monedaDevolucion: "ARS",
    },
    montoMinimoInicioArs: null,
    destinoDetalle:
      "Capital para el ciclo 2026 del lote de novillitos.",
    tipoPosesion: "hibrido",
    sistemaProductivo: "corral",
    cabezas: 110,
    categoria: "Novillito",
    raza: "Cruza británica",
    pesoEntradaKg: 230,
    pesoSalidaObjetivoKg: 370,
    montoObjetivoArs: 57_000_000,
    montoRecaudadoArs: 0,
    montoLiberadoArs: 0,
    montoRetiradoArs: 0,
    plazoDias: 140,
    rendimientoEsperadoPct: 0,
    garantiaId: "",
    tieneSeguro: false,
    estado: "borrador",
    provincia: "Buenos Aires",
    creadoAt: "2026-09-26",
  },
  // El ciclo que está andando: la hacienda ya está en el corral y el capital
  // se liberó por tramos, así que no todo lo recaudado se retiró todavía.
  {
    id: "pry-9",
    productorId: "prod-1",
    titulo: "Terminación a corral — 120 novillos",
    modalidad: "capital_trabajo",
    destinoFondosPrevio: "capital_trabajo",
    condiciones: {
      monedaAporte: "ARS",
      monedaDevolucion: "ARS",
      tasa: {
        tasaPct: 28,
        base: "ciclo",
        calculo: "Sobre el capital aportado, devengado a lo largo del ciclo y sin capitalización",
        vencimientos: "Un único vencimiento al cierre del ciclo, a los 90 días",
        fuente: "demostrativo",
      },
    },
    montoMinimoInicioArs: 38_700_000,
    destinoDetalle:
      "Ración, sanidad y mano de obra de los 150 días de encierre.",
    tipoPosesion: "existencia_comprobada",
    sistemaProductivo: "corral",
    cabezas: 120,
    categoria: "Novillo",
    raza: "Angus",
    pesoEntradaKg: 310,
    pesoSalidaObjetivoKg: 440,
    montoObjetivoArs: 64_500_000,
    montoRecaudadoArs: 64_500_000,
    montoLiberadoArs: 43_050_000,
    montoRetiradoArs: 32_100_000,
    plazoDias: 90,
    rendimientoEsperadoPct: 28,
    garantiaId: "gar-2",
    tieneSeguro: true,
    estado: "en_curso",
    provincia: "Buenos Aires",
    fideicomiso: {
      serie: "Guardian Ganadero — Serie V",
      fiduciario: "Guardian S.A.S., fiduciario de la serie",
      fiduciantes:
        "Los colaboradores del proyecto, que aportan el capital, y TROPA AGROGANADERA S.A., que aporta la hacienda, el campo y el trabajo",
      fideicomisarios:
        "Los mismos colaboradores, en proporción a lo suscripto, y el productor por su porción del resultado",
      bienesFideicomitidos:
        "120 novillos identificados con caravana RFID bajo el RENSPA 01.036.0.01532/04, y el capital suscripto por los colaboradores",
      objeto:
        "Engordar el lote durante el ciclo, venderlo a faena y repartir el producido entre los fideicomisarios",
      repartoResultado:
        "El resultado de la venta se reparte 65 % para los colaboradores y 35 % para el productor, sobre los kilos ganados en el ciclo",
      mortandad:
        "Hasta el 2 % de mortandad la absorbe el fideicomiso; por encima de ese piso responde el productor, salvo caso fortuito acreditado",
      inicioAt: "2026-07-09",
      extincionAt: "2026-12-06",
      rendicionCuentas: "Trimestral, y en todos los casos al cierre del ciclo",
      seguroResponsabilidadCivil:
        "Contratada, con cobertura de mortandad sobre el lote",
      inscripcion: "Registro Público de Comercio de la Provincia de Buenos Aires",
    },
    creadoAt: "2026-07-02",
    publicadoAt: "2026-07-09",
  },
  // Los tres ciclos anteriores, ya liquidados. Son los que explican por qué el
  // establecimiento figura con cuatro ciclos completados.
  {
    id: "pry-10",
    productorId: "prod-1",
    titulo: "Engorde a corral — 150 novillitos (ciclo 2025/26)",
    modalidad: "capital_trabajo",
    destinoFondosPrevio: "capital_trabajo",
    condiciones: {
      monedaAporte: "ARS",
      monedaDevolucion: "ARS",
      tasa: {
        tasaPct: 32,
        base: "ciclo",
        calculo: "Sobre el capital aportado, devengado a lo largo del ciclo y sin capitalización",
        vencimientos: "Un único vencimiento al cierre del ciclo, a los 115 días",
        fuente: "demostrativo",
      },
    },
    montoMinimoInicioArs: 42_900_000,
    destinoDetalle:
      "Ración y sanidad del ciclo.",
    tipoPosesion: "existencia_comprobada",
    sistemaProductivo: "corral",
    cabezas: 150,
    categoria: "Novillito",
    raza: "Angus",
    pesoEntradaKg: 245,
    pesoSalidaObjetivoKg: 385,
    montoObjetivoArs: 71_400_000,
    montoRecaudadoArs: 71_400_000,
    montoLiberadoArs: 71_400_000,
    montoRetiradoArs: 71_400_000,
    plazoDias: 115,
    rendimientoEsperadoPct: 32,
    garantiaId: "gar-3",
    tieneSeguro: true,
    estado: "cerrado",
    provincia: "Buenos Aires",
    fideicomiso: {
      serie: "Guardian Ganadero — Serie VI",
      fiduciario: "Guardian S.A.S., fiduciario de la serie",
      fiduciantes:
        "Los colaboradores del proyecto, que aportan el capital, y TROPA AGROGANADERA S.A., que aporta la hacienda, el campo y el trabajo",
      fideicomisarios:
        "Los mismos colaboradores, en proporción a lo suscripto, y el productor por su porción del resultado",
      bienesFideicomitidos:
        "150 novillitos identificados con caravana RFID bajo el RENSPA 01.036.0.01532/04, y el capital suscripto por los colaboradores",
      objeto:
        "Engordar el lote durante el ciclo, venderlo a faena y repartir el producido entre los fideicomisarios",
      repartoResultado:
        "El resultado de la venta se reparte 65 % para los colaboradores y 35 % para el productor, sobre los kilos ganados en el ciclo",
      mortandad:
        "Hasta el 2 % de mortandad la absorbe el fideicomiso; por encima de ese piso responde el productor, salvo caso fortuito acreditado",
      inicioAt: "2026-01-23",
      extincionAt: "2026-07-17",
      rendicionCuentas: "Trimestral, y en todos los casos al cierre del ciclo",
      seguroResponsabilidadCivil:
        "Contratada, con cobertura de mortandad sobre el lote",
      inscripcion: "Registro Público de Comercio de la Provincia de Buenos Aires",
    },
    creadoAt: "2026-01-16",
    publicadoAt: "2026-01-23",
    resultado: {
      dteSalida: "31488207",
      cabezasFaena: 150,
      kilosVivos: 57_450,
      kgCarne: 33_218,
      rendimientoPct: 57.82,
      fecha: "2026-05-19",
    },
  },
  {
    id: "pry-11",
    productorId: "prod-1",
    titulo: "Recría a corral — 95 vaquillonas (ciclo 2025)",
    modalidad: "capital_trabajo",
    destinoFondosPrevio: "capital_trabajo",
    condiciones: {
      monedaAporte: "ARS",
      monedaDevolucion: "ARS",
      tasa: {
        tasaPct: 29,
        base: "ciclo",
        calculo: "Sobre el capital aportado, devengado a lo largo del ciclo y sin capitalización",
        vencimientos: "Un único vencimiento al cierre del ciclo, a los 130 días",
        fuente: "demostrativo",
      },
    },
    montoMinimoInicioArs: 23_550_000,
    destinoDetalle:
      "Ración, sanidad y mano de obra del ciclo.",
    tipoPosesion: "existencia_comprobada",
    sistemaProductivo: "corral",
    cabezas: 95,
    categoria: "Vaquillona",
    raza: "Hereford",
    pesoEntradaKg: 200,
    pesoSalidaObjetivoKg: 320,
    montoObjetivoArs: 39_300_000,
    montoRecaudadoArs: 39_300_000,
    montoLiberadoArs: 39_300_000,
    montoRetiradoArs: 39_300_000,
    plazoDias: 130,
    rendimientoEsperadoPct: 29,
    garantiaId: "gar-1",
    tieneSeguro: true,
    estado: "cerrado",
    provincia: "Buenos Aires",
    fideicomiso: {
      serie: "Guardian Ganadero — Serie VII",
      fiduciario: "Guardian S.A.S., fiduciario de la serie",
      fiduciantes:
        "Los colaboradores del proyecto, que aportan el capital, y TROPA AGROGANADERA S.A., que aporta la hacienda, el campo y el trabajo",
      fideicomisarios:
        "Los mismos colaboradores, en proporción a lo suscripto, y el productor por su porción del resultado",
      bienesFideicomitidos:
        "95 vaquillonas identificados con caravana RFID bajo el RENSPA 01.036.0.01532/04, y el capital suscripto por los colaboradores",
      objeto:
        "Engordar el lote durante el ciclo, venderlo a faena y repartir el producido entre los fideicomisarios",
      repartoResultado:
        "El resultado de la venta se reparte 65 % para los colaboradores y 35 % para el productor, sobre los kilos ganados en el ciclo",
      mortandad:
        "Hasta el 2 % de mortandad la absorbe el fideicomiso; por encima de ese piso responde el productor, salvo caso fortuito acreditado",
      inicioAt: "2025-07-11",
      extincionAt: "2026-01-17",
      rendicionCuentas: "Trimestral, y en todos los casos al cierre del ciclo",
      seguroResponsabilidadCivil:
        "Contratada, con cobertura de mortandad sobre el lote",
      inscripcion: "Registro Público de Comercio de la Provincia de Buenos Aires",
    },
    creadoAt: "2025-07-04",
    publicadoAt: "2025-07-11",
    resultado: {
      dteSalida: "30117645",
      cabezasFaena: 95,
      kilosVivos: 30_115,
      kgCarne: 17_285,
      rendimientoPct: 57.4,
      fecha: "2025-11-28",
    },
  },
  {
    id: "pry-12",
    productorId: "prod-1",
    titulo: "Engorde a corral — 60 novillitos (primer ciclo)",
    modalidad: "capital_trabajo",
    destinoFondosPrevio: "capital_trabajo",
    condiciones: {
      monedaAporte: "ARS",
      monedaDevolucion: "ARS",
      tasa: {
        tasaPct: 27,
        base: "ciclo",
        calculo: "Sobre el capital aportado, devengado a lo largo del ciclo y sin capitalización",
        vencimientos: "Un único vencimiento al cierre del ciclo, a los 105 días",
        fuente: "demostrativo",
      },
    },
    montoMinimoInicioArs: 15_300_000,
    destinoDetalle:
      "Ración y sanidad del ciclo.",
    tipoPosesion: "existencia_comprobada",
    sistemaProductivo: "corral",
    cabezas: 60,
    categoria: "Novillito",
    raza: "Angus",
    pesoEntradaKg: 255,
    pesoSalidaObjetivoKg: 375,
    montoObjetivoArs: 25_500_000,
    montoRecaudadoArs: 25_500_000,
    montoLiberadoArs: 25_500_000,
    montoRetiradoArs: 25_500_000,
    plazoDias: 105,
    rendimientoEsperadoPct: 27,
    garantiaId: "gar-2",
    tieneSeguro: true,
    estado: "cerrado",
    provincia: "Buenos Aires",
    fideicomiso: {
      serie: "Guardian Ganadero — Serie VIII",
      fiduciario: "Guardian S.A.S., fiduciario de la serie",
      fiduciantes:
        "Los colaboradores del proyecto, que aportan el capital, y TROPA AGROGANADERA S.A., que aporta la hacienda, el campo y el trabajo",
      fideicomisarios:
        "Los mismos colaboradores, en proporción a lo suscripto, y el productor por su porción del resultado",
      bienesFideicomitidos:
        "60 novillitos identificados con caravana RFID bajo el RENSPA 01.036.0.01532/04, y el capital suscripto por los colaboradores",
      objeto:
        "Engordar el lote durante el ciclo, venderlo a faena y repartir el producido entre los fideicomisarios",
      repartoResultado:
        "El resultado de la venta se reparte 65 % para los colaboradores y 35 % para el productor, sobre los kilos ganados en el ciclo",
      mortandad:
        "Hasta el 2 % de mortandad la absorbe el fideicomiso; por encima de ese piso responde el productor, salvo caso fortuito acreditado",
      inicioAt: "2025-02-18",
      extincionAt: "2025-08-02",
      rendicionCuentas: "Trimestral, y en todos los casos al cierre del ciclo",
      seguroResponsabilidadCivil:
        "Contratada, con cobertura de mortandad sobre el lote",
      inscripcion: "Registro Público de Comercio de la Provincia de Buenos Aires",
    },
    creadoAt: "2025-02-10",
    publicadoAt: "2025-02-18",
    resultado: {
      dteSalida: "29004318",
      cabezasFaena: 60,
      kilosVivos: 19_380,
      kgCarne: 11_066,
      rendimientoPct: 57.1,
      fecha: "2025-06-03",
    },
  },
  {
    id: "pry-13",
    productorId: "prod-1",
    titulo: "Ración y sanidad — 210 novillitos en engorde",
    modalidad: "capital_trabajo",
    destinoFondosPrevio: "capital_trabajo",
    condiciones: {
      monedaAporte: "ARS",
      monedaDevolucion: "ARS",
      tasa: {
        tasaPct: 29,
        base: "ciclo",
        calculo: "Sobre el capital aportado, devengado a lo largo del ciclo y sin capitalización",
        vencimientos: "Un único vencimiento al cierre del ciclo, a los 135 días",
        fuente: "demostrativo",
      },
    },
    montoMinimoInicioArs: 37_350_000,
    destinoDetalle:
      "Solo insumos: ración balanceada de los 135 días, plan sanitario completo, sales minerales y la mano de obra del corral. Los 210 novillitos ya son del establecimiento y están encerrados; el capital no compra un solo animal.",
    tipoPosesion: "existencia_comprobada",
    sistemaProductivo: "corral",
    cabezas: 210,
    categoria: "Novillito",
    raza: "Braford",
    pesoEntradaKg: 240,
    pesoSalidaObjetivoKg: 400,
    montoObjetivoArs: 62_250_000,
    montoRecaudadoArs: 18_600_000,
    montoLiberadoArs: 0,
    montoRetiradoArs: 0,
    plazoDias: 135,
    rendimientoEsperadoPct: 29,
    garantiaId: "gar-1",
    tieneSeguro: false,
    estado: "abierto",
    provincia: "Buenos Aires",
    fideicomiso: {
      serie: "Guardian Ganadero — Serie IX",
      fiduciario: "Guardian S.A.S., fiduciario de la serie",
      fiduciantes:
        "Los colaboradores del proyecto, que aportan el capital para los insumos, y TROPA AGROGANADERA S.A., que aporta la hacienda, el campo y el trabajo",
      fideicomisarios:
        "Los mismos colaboradores, en proporción a lo suscripto, y el productor por su porción del resultado",
      bienesFideicomitidos:
        "El capital suscripto por los colaboradores y los 210 novillitos identificados con caravana RFID bajo el RENSPA 01.036.0.01532/04, afectados al fideicomiso como garantía del ciclo",
      objeto:
        "Financiar los insumos del encierre, engordar el lote, venderlo a faena y repartir el producido entre los fideicomisarios",
      repartoResultado:
        "El resultado de la venta se reparte 60 % para los colaboradores y 40 % para el productor, sobre los kilos ganados en el ciclo",
      mortandad:
        "Hasta el 2 % de mortandad la absorbe el fideicomiso; por encima de ese piso responde el productor, salvo caso fortuito acreditado",
      inicioAt: "2026-09-20",
      extincionAt: "2027-04-03",
      rendicionCuentas: "Trimestral, y en todos los casos al cierre del ciclo",
      seguroResponsabilidadCivil:
        "Contratada la responsabilidad civil obligatoria; sin cobertura de mortandad",
      inscripcion: "Registro Público de Comercio de la Provincia de Buenos Aires",
    },
    creadoAt: "2026-09-10",
    publicadoAt: "2026-09-20",
  },
];


/**
 * El plazo de cobro: lo que tarda el dinero en volver después de la venta. El
 * frigorífico no paga contra entrega, así que el colaborador espera más que el
 * animal. Treinta días para una venta a faena, diez para una venta en pie.
 */
const PLAZO_COBRO: Record<string, number> = {
  compra_engorde: 30,
  capital_trabajo: 15,
};

function presupuestoDe(p: ProyectoDeclarado): RubroPresupuesto[] {
  const total = p.montoObjetivoArs;
  if (total === 0) return [];

  const periodo = `Los ${p.plazoDias} días del ciclo`;

  if (p.modalidad === "compra_engorde") {
    return [
      {
        rubro: "Hacienda",
        concepto: `Compra de ${p.cabezas} cabezas de ${p.categoria.toLowerCase()}, ${p.pesoEntradaKg} kg de entrada`,
        montoArs: Math.round(total * 0.68),
        periodo: "Al inicio",
      },
      {
        rubro: "Alimentación",
        concepto: "Ración de recría y terminación",
        montoArs: Math.round(total * 0.22),
        periodo,
      },
      {
        rubro: "Sanidad",
        concepto: "Plan sanitario del lote",
        montoArs: Math.round(total * 0.05),
        periodo,
      },
      {
        rubro: "Flete",
        concepto: "Traslado al establecimiento receptor",
        montoArs: Math.round(total * 0.05),
        periodo: "Al inicio",
      },
    ];
  }

  return [
    {
      rubro: "Alimentación",
      concepto: "Ración diaria del lote",
      montoArs: Math.round(total * 0.62),
      periodo,
    },
    {
      rubro: "Sanidad",
      concepto: "Plan sanitario y mano de obra veterinaria",
      montoArs: Math.round(total * 0.14),
      periodo,
    },
    {
      rubro: "Corral",
      concepto: "Alquiler del corral y servicios",
      montoArs: Math.round(total * 0.16),
      periodo,
    },
    {
      rubro: "Flete",
      concepto: "Traslados del ciclo",
      montoArs: Math.round(total * 0.08),
      periodo,
    },
  ];
}

function cronogramaDe(p: ProyectoDeclarado): HitoDesembolso[] {
  const total = p.montoObjetivoArs;
  if (total === 0) return [];

  if (p.modalidad === "compra_engorde") {
    return [
      {
        hito: "Compra de la hacienda",
        momento: "Al alcanzar el mínimo de inicio",
        montoArs: Math.round(total * 0.68),
        condicion:
          "Operación aprobada, con vendedor, precio y establecimiento receptor identificados. Se paga al vendedor.",
      },
      {
        hito: "Recepción del lote",
        momento: "Dentro de los 10 días de la compra",
        montoArs: Math.round(total * 0.12),
        condicion: "DT-e cerrado en destino, inventario e identificación del lote.",
      },
      {
        hito: "Ración y sanidad",
        momento: "Por período, contra presupuesto",
        montoArs: Math.round(total * 0.2),
        condicion: "Factura, remito conformado y pago al proveedor.",
      },
    ];
  }

  return [
    {
      hito: "Primer tramo",
      momento: "Al alcanzar el mínimo de inicio",
      montoArs: Math.round(total * 0.4),
      condicion: "Existencia del lote comprobada y presupuesto aprobado.",
    },
    {
      hito: "Segundo tramo",
      momento: `A los ${Math.round(p.plazoDias / 3)} días`,
      montoArs: Math.round(total * 0.35),
      condicion: "Rendición del tramo anterior: facturas, entregas y pagos.",
    },
    {
      hito: "Tramo final",
      momento: `A los ${Math.round((p.plazoDias * 2) / 3)} días`,
      montoArs: Math.round(total * 0.25),
      condicion: "Rendición al día y pesada del lote cargada.",
    },
  ];
}

/**
 * Los controles que Guardian dice haber hecho. Cada uno con su fecha, su método
 * y su alcance, porque "verificado" sin eso no se puede contrastar. Solo los
 * tienen los proyectos que pasaron por validación.
 */
function controlesDe(p: ProyectoDeclarado): ControlRealizado[] {
  if (!p.publicadoAt) return [];
  return [
    {
      control: "Legajo del productor",
      fecha: p.publicadoAt,
      alcance: "Identidad, constancia de RENSPA y disponibilidad del establecimiento",
      metodo: "Revisión documental",
      responsable: "Equipo de validación de Guardian",
    },
    {
      control: "Consistencia del lote",
      fecha: p.publicadoAt,
      alcance: "Cabezas declaradas contra las amparadas en la documentación",
      metodo: "Lectura automática más reglas de control",
      responsable: "Plataforma",
    },
    {
      control: "Autenticidad del DT-e",
      fecha: p.publicadoAt,
      alcance: "Contraste del CUVE contra SENASA",
      metodo: "Consulta por canal habilitado",
      responsable: "Equipo de validación de Guardian",
    },
  ];
}


/**
 * Las comisiones de la demo. Los porcentajes son ficticios y están marcados como
 * tales: no hay tarifario definido todavía. Lo que sí es real es la estructura,
 * que es lo que hay que poder verificar —sobre qué se calcula, cuándo se cobra y
 * quién la paga—, porque un porcentaje suelto no dice nada.
 *
 * `pry-13` queda sin definir a propósito: sirve para ver qué pasa cuando falta
 * el dato en vez de completarlo con un supuesto.
 */
function comisionesDe(p: ProyectoDeclarado): Comision[] {
  if (p.id === "pry-13") {
    return [
      {
        concepto: "Comisión de colocación",
        base: "Sin definir",
        porcentaje: null,
        aCargoDe: "fideicomiso",
        momento: "Sin definir",
        fuente: "demostrativo",
      },
    ];
  }

  const base: Comision[] = [
    {
      concepto: "Comisión de colocación",
      base: "Sobre el capital efectivamente acreditado",
      porcentaje: 3,
      aCargoDe: "fideicomiso",
      momento: "Al liberarse el primer desembolso",
      fuente: "demostrativo",
    },
    {
      concepto: "Monitoreo del ciclo",
      base: "Sobre el capital acreditado, por el plazo del ciclo",
      porcentaje: 1,
      aCargoDe: "fideicomiso",
      momento: "Prorrateado, se descuenta en la liquidación",
      fuente: "demostrativo",
    },
    {
      concepto: "Honorarios del fiduciario",
      base: "Sobre el capital administrado",
      porcentaje: 1.5,
      aCargoDe: "fideicomiso",
      momento: "En la liquidación del ciclo",
      fuente: "demostrativo",
    },
  ];

  if (p.modalidad === "compra_engorde") {
    base.push({
      concepto: "Comisión de éxito",
      base: "Sobre el resultado neto, después de gastos reconocidos",
      porcentaje: 2,
      aCargoDe: "fideicomiso",
      momento: "Solo si el resultado es positivo",
      fuente: "demostrativo",
    });
  }

  return base;
}

/**
 * Qué pasa si algo sale mal. Antes solo estaba escrita la mortandad, adentro del
 * fideicomiso; el resto —una demora, un problema sanitario, que el productor no
 * cumpla— quedaba sin contestar justo donde el colaborador pregunta.
 */
function contingenciasDe(p: ProyectoDeclarado): Contingencia[] {
  const garantia = garantias.find((g) => g.id === p.garantiaId);
  const constituida = garantia?.estadoConstitucion === "constituida";

  const comunes: Contingencia[] = [
    {
      caso: "mortandad",
      queDice:
        "Hasta el 2 % del lote lo absorbe el fideicomiso. Por encima de ese piso responde el productor, salvo caso fortuito acreditado.",
      aCargoDe: "Fideicomiso hasta el piso; después, el productor",
      fuente: "demostrativo",
    },
    {
      caso: "sanitaria",
      queDice:
        "El productor avisa dentro de las 48 horas, aísla el lote y carga el diagnóstico. El tratamiento sale del rubro de sanidad del presupuesto aprobado.",
      aCargoDe: "Presupuesto del proyecto",
      fuente: "demostrativo",
    },
    {
      caso: "demora",
      queDice:
        "El ciclo puede estirarse hasta 30 días sin que cambien las condiciones. Más allá de eso, se avisa a los colaboradores y se revisa el plazo de cobro.",
      aCargoDe: "Sin costo para el colaborador dentro de los 30 días",
      fuente: "demostrativo",
    },
    {
      caso: "incumplimiento",
      queDice: constituida
        ? "Se intima al productor y, si no regulariza, el fiduciario ejecuta la garantía constituida."
        : "No hay garantía constituida en este proyecto: el reclamo es contra el productor y no hay un bien afectado para ejecutar.",
      aCargoDe: constituida ? "El productor, con su garantía afectada" : "El productor",
      fuente: "demostrativo",
    },
  ];

  if (p.modalidad === "compra_engorde") {
    comunes.push({
      caso: "precio",
      queDice:
        "El resultado depende del precio de la hacienda al cierre. Puede ser menor al proyectado, y puede ser negativo: el colaborador participa de lo que se obtenga.",
      aCargoDe: "El colaborador, en proporción a lo aportado",
      fuente: "demostrativo",
    });
  }

  return comunes;
}

export const proyectos: Proyecto[] = proyectosDeclarados.map((p) => ({
  ...p,
  condiciones: {
    ...p.condiciones,
    comisiones: comisionesDe(p),
    contingencias: contingenciasDe(p),
  },
  plazoCobroDias: p.modalidad ? PLAZO_COBRO[p.modalidad] : null,
  presupuesto: presupuestoDe(p),
  cronograma: cronogramaDe(p),
  controles: controlesDe(p),
}));

const documentosCargados: Documento[] = [
  {
    id: "doc-1",
    proyectoId: "pry-4",
    productorId: "prod-1",
    tipo: "dte",
    nombreArchivo: "DT-e 032636337-5.pdf",
    tieneCapaTexto: true,
    subidoAt: "2026-09-18",
    estadoExtraccion: "ok",
    estadoConsistencia: "con_discrepancias",
    estadoAutenticidad: "sin_verificar",
    cuve: "023 2636 3375",
    camposExtraidos: [
      { campo: "numero", etiqueta: "Nº de DT-e", valor: "032636337-5", confianza: 0.99 },
      { campo: "cuve", etiqueta: "CUVE", valor: "023 2636 3375", confianza: 0.97 },
      { campo: "fechaCarga", etiqueta: "Fecha de carga", valor: "22/09/2026", confianza: 0.98 },
      { campo: "motivo", etiqueta: "Motivo", valor: "Faena", confianza: 0.99 },
      { campo: "renspaOrigen", etiqueta: "RENSPA origen", valor: "01.036.0.01532/04", confianza: 0.96 },
      { campo: "titularOrigen", etiqueta: "Titular origen", valor: "TROPA AGROGANADERA S.A.", confianza: 0.98 },
      { campo: "cuitOrigen", etiqueta: "CUIT origen", valor: "30-71903430-2", confianza: 0.99 },
      { campo: "establecimiento", etiqueta: "Establecimiento", valor: "DOÑA INA", confianza: 0.94 },
      { campo: "destinoTipo", etiqueta: "Tipo de destino", valor: "FRIGORÍFICO", confianza: 0.97 },
      { campo: "cabezas", etiqueta: "Cabezas (total)", valor: "34", confianza: 0.93 },
      { campo: "detalleCategorias", etiqueta: "Detalle por categoría", valor: "Vaquillona 20 · Novillito 14", confianza: 0.91 },
      { campo: "ultimaAftosa", etiqueta: "Última aftosa", valor: "18/05/2026", confianza: 0.95 },
    ],
  },
  {
    id: "doc-2",
    proyectoId: null,
    productorId: "prod-1",
    tipo: "renspa",
    nombreArchivo: "constancia-renspa.pdf",
    tieneCapaTexto: true,
    subidoAt: "2026-09-18",
    estadoExtraccion: "ok",
    estadoConsistencia: "consistente",
    estadoAutenticidad: "verificada",
    camposExtraidos: [
      { campo: "renspa", etiqueta: "RENSPA", valor: "01.036.0.01532/04", confianza: 0.98 },
      { campo: "titular", etiqueta: "Titular", valor: "TROPA AGROGANADERA S.A.", confianza: 0.97 },
      { campo: "cuit", etiqueta: "CUIT", valor: "30-71903430-2", confianza: 0.99 },
      { campo: "establecimiento", etiqueta: "Establecimiento", valor: "DOÑA INA", confianza: 0.95 },
      { campo: "partido", etiqueta: "Partido", valor: "Exaltación de la Cruz", confianza: 0.93 },
    ],
  },
  {
    id: "doc-3",
    proyectoId: "pry-4",
    productorId: "prod-1",
    tipo: "listado_rfid",
    nombreArchivo: "caravanas-lote-sept.pdf",
    tieneCapaTexto: false,
    subidoAt: "2026-09-19",
    estadoExtraccion: "ok",
    estadoConsistencia: "con_discrepancias",
    estadoAutenticidad: "sin_verificar",
    camposExtraidos: [
      { campo: "cantidad", etiqueta: "Identificadores leídos", valor: "180", confianza: 0.72 },
      { campo: "formato", etiqueta: "Formato", valor: "Válido (15 dígitos, prefijo 032)", confianza: 0.88 },
      { campo: "duplicados", etiqueta: "Duplicados internos", valor: "0", confianza: 0.95 },
    ],
  },
  {
    id: "doc-4",
    proyectoId: "pry-6",
    productorId: "prod-1",
    tipo: "romaneo",
    nombreArchivo: "708.pdf",
    tieneCapaTexto: true,
    subidoAt: "2026-09-21",
    estadoExtraccion: "ok",
    estadoConsistencia: "consistente",
    estadoAutenticidad: "verificada",
    camposExtraidos: [
      { campo: "numero", etiqueta: "Nº de romaneo", valor: "2.537.774", confianza: 0.98 },
      { campo: "fecha", etiqueta: "Fecha", valor: "21/09/2026", confianza: 0.99 },
      { campo: "frigorifico", etiqueta: "Frigorífico", valor: "Agroindustrias Quilmes S.A.", confianza: 0.97 },
      { campo: "vendedorCuit", etiqueta: "CUIT vendedor", valor: "30-71903430-2", confianza: 0.99 },
      { campo: "dte", etiqueta: "DT-e asociado", valor: "32624494", confianza: 0.96 },
      { campo: "cabezasFaena", etiqueta: "Cabezas faena", valor: "28", confianza: 0.97 },
      { campo: "kilosVivos", etiqueta: "Kilos vivos", valor: "9.240", confianza: 0.98 },
      { campo: "kgCarne", etiqueta: "Kg de carne", valor: "5.437", confianza: 0.96 },
      { campo: "rendimiento", etiqueta: "Rendimiento", valor: "58,84 %", confianza: 0.98 },
    ],
    // El documento trae sus propios totales de control: se recalculan y se comparan.
    controlesAritmeticos: [
      { etiqueta: "Kilos vivos ÷ cabezas", calculado: "330,0 kg", impreso: "330 kg", coincide: true },
      { etiqueta: "Kg carne ÷ kilos vivos", calculado: "58,84 %", impreso: "58,84 %", coincide: true },
      { etiqueta: "Correlativo de reses (116 a 143)", calculado: "28 reses", impreso: "28 cabezas", coincide: true },
      { etiqueta: "Tabla de tipificación (56 medias ÷ 2)", calculado: "28 animales", impreso: "28 cabezas", coincide: true },
    ],
  },
  {
    id: "doc-5",
    proyectoId: "pry-5",
    productorId: "prod-2",
    tipo: "dte",
    nombreArchivo: "20260921224918501_0001.pdf",
    tieneCapaTexto: false,
    subidoAt: "2026-09-20",
    estadoExtraccion: "procesando",
    estadoConsistencia: "sin_revisar",
    estadoAutenticidad: "sin_verificar",
    camposExtraidos: [],
  },
  {
    id: "doc-6",
    proyectoId: "pry-5",
    productorId: "prod-2",
    tipo: "poliza_seguro",
    nombreArchivo: "poliza-mortandad-2026.pdf",
    tieneCapaTexto: true,
    subidoAt: "2026-09-20",
    estadoExtraccion: "ok",
    estadoConsistencia: "consistente",
    estadoAutenticidad: "sin_verificar",
    camposExtraidos: [
      { campo: "aseguradora", etiqueta: "Aseguradora", valor: "Sancor Seguros", confianza: 0.96 },
      { campo: "numero", etiqueta: "Nº de póliza", valor: "77-0194882", confianza: 0.94 },
      { campo: "vigencia", etiqueta: "Vigencia", valor: "01/09/2026 — 28/02/2027", confianza: 0.92 },
      { campo: "sumaAsegurada", etiqueta: "Suma asegurada", valor: "$ 49.000.000", confianza: 0.9 },
      { campo: "riesgo", etiqueta: "Riesgo cubierto", valor: "Mortandad por accidente y enfermedad", confianza: 0.89 },
    ],
  },
  {
    id: "doc-7",
    proyectoId: "pry-1",
    productorId: "prod-1",
    tipo: "dte",
    nombreArchivo: "DT-e ingreso-invernada.pdf",
    tieneCapaTexto: true,
    subidoAt: "2026-08-14",
    estadoExtraccion: "ok",
    estadoConsistencia: "consistente",
    estadoAutenticidad: "verificada",
    cuve: "021 8845 1120",
    camposExtraidos: [
      { campo: "numero", etiqueta: "Nº de DT-e", valor: "031884511-2", confianza: 0.98 },
      { campo: "motivo", etiqueta: "Motivo", valor: "Invernada", confianza: 0.97 },
      { campo: "cabezas", etiqueta: "Cabezas", valor: "180", confianza: 0.96 },
      { campo: "renspaDestino", etiqueta: "RENSPA destino", valor: "01.036.0.01532/04", confianza: 0.95 },
    ],
  },
  {
    id: "doc-8",
    proyectoId: null,
    productorId: "prod-2",
    tipo: "renspa",
    nombreArchivo: "constancia-renspa-la-redencion.pdf",
    tieneCapaTexto: true,
    subidoAt: "2026-07-30",
    estadoExtraccion: "ok",
    estadoConsistencia: "consistente",
    estadoAutenticidad: "verificada",
    camposExtraidos: [
      { campo: "renspa", etiqueta: "RENSPA", valor: "02.017.0.00841/11", confianza: 0.97 },
      { campo: "titular", etiqueta: "Titular", valor: "LA REDENCIÓN S.R.L.", confianza: 0.96 },
      { campo: "cuit", etiqueta: "CUIT", valor: "30-70912844-7", confianza: 0.98 },
      { campo: "establecimiento", etiqueta: "Establecimiento", valor: "LA REDENCIÓN", confianza: 0.95 },
      { campo: "partido", etiqueta: "Partido", valor: "Marcos Juárez", confianza: 0.94 },
    ],
  },
  {
    id: "doc-9",
    proyectoId: null,
    productorId: "prod-3",
    tipo: "renspa",
    nombreArchivo: "constancia-renspa-el-amanecer.pdf",
    tieneCapaTexto: true,
    subidoAt: "2026-08-05",
    estadoExtraccion: "ok",
    estadoConsistencia: "consistente",
    estadoAutenticidad: "verificada",
    camposExtraidos: [
      { campo: "renspa", etiqueta: "RENSPA", valor: "03.084.0.02219/07", confianza: 0.98 },
      { campo: "titular", etiqueta: "Titular", valor: "GANADERA EL AMANECER S.A.", confianza: 0.97 },
      { campo: "cuit", etiqueta: "CUIT", valor: "30-71554098-5", confianza: 0.99 },
      { campo: "establecimiento", etiqueta: "Establecimiento", valor: "EL AMANECER", confianza: 0.96 },
      { campo: "partido", etiqueta: "Partido", valor: "Venado Tuerto", confianza: 0.93 },
    ],
  },
];

/**
 * El respaldo de rutina de los proyectos publicados.
 *
 * Los documentos de arriba son los casos ricos —el DT-e con discrepancias, el
 * romaneo real, el escaneo sin capa de texto— y están escritos a mano. Estos
 * salen del propio proyecto, porque un proyecto publicado sin la documentación
 * obligatoria no debería poder existir: el colaborador lo está viendo en el
 * catálogo. Generarlos así también evita que las cifras del papel y las
 * declaradas se separen cuando alguien edita el seed.
 */
const ESTADOS_PUBLICOS: EstadoProyecto[] = ["abierto", "fondeado", "en_curso", "cerrado"];

function respaldoDeProyecto(proyecto: Proyecto, desde: number): Documento[] {
  const productor = productores.find((x) => x.id === proyecto.productorId);
  if (!productor) return [];

  const yaCargados = new Set(
    documentosCargados
      .filter((d) => d.proyectoId === proyecto.id || d.productorId === productor.id)
      .map((d) => (d.proyectoId === null ? d.tipo : `${d.proyectoId}:${d.tipo}`)),
  );
  const falta = (tipo: TipoDocumento) =>
    !yaCargados.has(tipo) && !yaCargados.has(`${proyecto.id}:${tipo}`);

  const base = {
    proyectoId: proyecto.id,
    productorId: productor.id,
    tieneCapaTexto: true,
    subidoAt: proyecto.publicadoAt ?? proyecto.creadoAt,
    estadoExtraccion: "ok" as const,
    estadoConsistencia: "consistente" as const,
    estadoAutenticidad: "verificada" as const,
  };

  const docs: Documento[] = [];
  const requeridos = documentosRequeridos(proyecto.tipoPosesion);
  const serie = proyecto.id.replace("pry-", "");

  if (requeridos.includes("dte") && falta("dte")) {
    docs.push({
      ...base,
      id: `doc-r${desde + docs.length}`,
      tipo: "dte",
      nombreArchivo: `DT-e ingreso ${proyecto.id}.pdf`,
      cuve: `0${20 + Number(serie)} ${4100 + Number(serie) * 7} ${3300 + Number(serie)}`,
      camposExtraidos: [
        { campo: "numero", etiqueta: "Nº de DT-e", valor: `0318${44000 + Number(serie) * 13}-${Number(serie) % 9}`, confianza: 0.98 },
        { campo: "motivo", etiqueta: "Motivo", valor: "Invernada", confianza: 0.97 },
        { campo: "cabezas", etiqueta: "Cabezas", valor: String(proyecto.cabezas), confianza: 0.96 },
        { campo: "renspaDestino", etiqueta: "RENSPA destino", valor: productor.renspa, confianza: 0.95 },
        { campo: "titularOrigen", etiqueta: "Titular", valor: productor.razonSocial, confianza: 0.97 },
      ],
    });
  }

  if (requeridos.includes("listado_rfid") && falta("listado_rfid")) {
    docs.push({
      ...base,
      id: `doc-r${desde + docs.length}`,
      tipo: "listado_rfid",
      nombreArchivo: `caravanas ${proyecto.id}.csv`,
      camposExtraidos: [
        { campo: "cantidad", etiqueta: "Identificadores leídos", valor: String(proyecto.cabezas), confianza: 0.94 },
        { campo: "formato", etiqueta: "Formato", valor: "Válido (15 dígitos, prefijo 032)", confianza: 0.96 },
        { campo: "duplicados", etiqueta: "Duplicados internos", valor: "0", confianza: 0.97 },
      ],
    });
  }

  if (requeridos.includes("boleto_compraventa") && falta("boleto_compraventa")) {
    docs.push({
      ...base,
      id: `doc-r${desde + docs.length}`,
      tipo: "boleto_compraventa",
      nombreArchivo: `boleto compra ${proyecto.id}.pdf`,
      estadoAutenticidad: "sin_verificar",
      camposExtraidos: [
        { campo: "vendedor", etiqueta: "Vendedor", valor: "Consignataria del Centro S.A.", confianza: 0.95 },
        { campo: "comprador", etiqueta: "Comprador", valor: productor.razonSocial, confianza: 0.97 },
        { campo: "cantidad", etiqueta: "Cantidad", valor: `${proyecto.cabezas} cabezas`, confianza: 0.96 },
        { campo: "categoria", etiqueta: "Categoría", valor: proyecto.categoria, confianza: 0.94 },
        { campo: "fecha", etiqueta: "Fecha del boleto", valor: formatFecha(base.subidoAt), confianza: 0.98 },
      ],
    });
  }

  const r = proyecto.resultado;
  if (r && falta("romaneo")) {
    const promedio = Math.round(r.kilosVivos / r.cabezasFaena);
    const rinde = ((r.kgCarne / r.kilosVivos) * 100).toFixed(2);
    docs.push({
      ...base,
      id: `doc-r${desde + docs.length}`,
      tipo: "romaneo",
      nombreArchivo: `romaneo ${r.dteSalida}.pdf`,
      subidoAt: r.fecha,
      camposExtraidos: [
        { campo: "dteSalida", etiqueta: "Nº de DT-e", valor: r.dteSalida, confianza: 0.97 },
        { campo: "frigorifico", etiqueta: "Frigorífico", valor: "Frigorífico Regional del Norte S.A.", confianza: 0.95 },
        { campo: "cabezasFaena", etiqueta: "Cabezas faena", valor: String(r.cabezasFaena), confianza: 0.96 },
        { campo: "kilosVivos", etiqueta: "Kilos vivos", valor: String(r.kilosVivos), confianza: 0.95 },
        { campo: "kgCarne", etiqueta: "Kg de carne", valor: String(r.kgCarne), confianza: 0.94 },
        { campo: "rendimiento", etiqueta: "Rendimiento", valor: `${rinde} %`, confianza: 0.96 },
      ],
      controlesAritmeticos: [
        {
          etiqueta: "Kilos vivos ÷ cabezas",
          calculado: `${promedio} kg`,
          impreso: `${promedio} kg`,
          coincide: true,
        },
        {
          etiqueta: "Kg de carne ÷ kilos vivos",
          calculado: `${rinde} %`,
          impreso: `${r.rendimientoPct} %`,
          coincide: Math.abs(Number(rinde) - r.rendimientoPct) < 0.5,
        },
      ],
    });
  }

  return docs;
}

const respaldoGenerado: Documento[] = proyectos
  .filter((p) => ESTADOS_PUBLICOS.includes(p.estado))
  .flatMap((p, i) => respaldoDeProyecto(p, i * 10 + 1));

export const documentos: Documento[] = [...documentosCargados, ...respaldoGenerado];

export const discrepancias: Discrepancia[] = [
  {
    id: "dis-1",
    documentoId: "doc-1",
    campo: "cabezas",
    etiqueta: "Cantidad de cabezas",
    valorDeclarado: "200",
    valorExtraido: "34",
    severidad: "alta",
    detalle:
      "El proyecto declara 200 cabezas y el DT-e ampara 34 (20 vaquillonas + 14 novillitos). El documento no respalda el lote completo: falta documentación por 166 cabezas.",
    resuelta: false,
  },
  {
    id: "dis-2",
    documentoId: "doc-1",
    campo: "motivo",
    etiqueta: "Motivo del movimiento",
    valorDeclarado: "Ingreso al ciclo",
    valorExtraido: "Faena",
    severidad: "alta",
    detalle:
      "El DT-e es de salida a frigorífico, no de ingreso al establecimiento. Para abrir un ciclo de engorde se espera un DT-e con motivo Invernada o Traslado.",
    resuelta: false,
  },
  {
    id: "dis-3",
    documentoId: "doc-3",
    campo: "cantidad",
    etiqueta: "Identificadores RFID",
    valorDeclarado: "200",
    valorExtraido: "180",
    severidad: "media",
    detalle:
      "Se leyeron 180 identificadores sobre 200 cabezas declaradas. El archivo está escaneado sin capa de texto y la confianza de lectura es baja (72%): puede ser un faltante real o una lectura incompleta.",
    resuelta: false,
  },
];


/**
 * Las pesadas de un ciclo. Se generan desde el propio proyecto en vez de
 * escribirlas a mano: así un ciclo nunca muestra una curva que contradice su
 * peso de entrada, su objetivo o su fecha de arranque.
 *
 * La ganancia diaria arranca más baja y sube: el animal recién entrado al corral
 * se está acostumbrando a la ración y no engorda igual que a los treinta días.
 * Eso es lo que hace que la curva no sea una recta.
 */
function pesadasDeProyecto(
  proyecto: Proyecto,
  opciones: { hasta: string; cada: number; pesoFinal?: number },
): RegistroSeguimiento[] {
  const desde = new Date(proyecto.publicadoAt ?? proyecto.creadoAt);
  const hasta = new Date(opciones.hasta);
  const dias = Math.round((hasta.getTime() - desde.getTime()) / 86_400_000);
  if (dias < opciones.cada) return [];

  const pesoFinal = opciones.pesoFinal ?? proyecto.pesoSalidaObjetivoKg;
  const plazo = Math.max(proyecto.plazoDias, dias);
  const registros: RegistroSeguimiento[] = [];
  let vivas = proyecto.cabezas;

  for (let n = 1; n * opciones.cada <= dias; n++) {
    const diasCorridos = n * opciones.cada;
    const avance = diasCorridos / plazo;
    // La curva de engorde: lenta al principio, pareja después.
    const curva = avance * (0.72 + 0.28 * avance);
    const peso =
      proyecto.pesoEntradaKg + (pesoFinal - proyecto.pesoEntradaKg) * curva;

    // Una baja cada tanto, siempre por debajo del 2 % que absorbe el fideicomiso.
    const baja = n === 3 || n === 7 ? 1 : 0;
    vivas -= baja;

    const fecha = new Date(desde.getTime() + diasCorridos * 86_400_000);
    const gasto = Math.round((proyecto.montoObjetivoArs / plazo) * opciones.cada);

    registros.push({
      id: `seg-${proyecto.id.replace("pry-", "")}-${n}`,
      proyectoId: proyecto.id,
      fecha: fecha.toISOString().slice(0, 10),
      cabezas: vivas,
      pesoPromedioKg: Math.round(peso),
      mortandad: baja,
      gastoArs: gasto,
      conceptoGasto:
        n % 3 === 0 ? "Ración, sanidad y mano de obra" : "Ración y mano de obra",
      nota:
        baja > 0
          ? "Una baja en el lote. Se dio aviso y queda dentro del margen que absorbe el fideicomiso."
          : undefined,
    });
  }

  return registros;
}

const porId = (id: string) => proyectos.find((p) => p.id === id)!;

/**
 * El ciclo en curso se sigue hasta hoy; los cerrados, hasta la fecha del
 * romaneo y con el peso vivo que el romaneo terminó midiendo.
 */
export const seguimiento: RegistroSeguimiento[] = [
  ...pesadasDeProyecto(porId("pry-9"), { hasta: "2026-09-25", cada: 14 }),
  ...proyectos
    .filter((p) => p.estado === "cerrado" && p.resultado)
    .flatMap((p) =>
      pesadasDeProyecto(p, {
        hasta: p.resultado!.fecha,
        cada: 21,
        pesoFinal: Math.round(p.resultado!.kilosVivos / p.resultado!.cabezasFaena),
      }),
    ),
];

/**
 * El colaborador de la demo y su cartera.
 *
 * Los aportes muestran los tres casos que la operatoria real tiene que
 * distinguir y que una billetera taparía: el que adhirió y todavía no
 * transfirió, el que transfirió de menos y el que está acreditado entero. El
 * monto acreditado no sale de un comprobante subido sino de un movimiento
 * bancario conciliado.
 */
const aportesDelColaborador: Aporte[] = [
  {
    id: "ap-1",
    proyectoId: "pry-1",
    colaboradorId: "col-1",
    ordenSuscripcion: "GDN-2026-000181",
    montoComprometidoArs: 7_500_000,
    montoAcreditadoArs: 7_500_000,
    moneda: "ARS",
    estado: "acreditado",
    adhesionAt: "2026-08-23",
    contratoVersion: "Contrato de adhesión v3 — 2026-08-01",
    movimientos: [
      {
        id: "mov-1",
        referenciaExterna: "TRF-9f21c4",
        importeArs: 7_500_000,
        fecha: "2026-08-25",
        estadoConciliacion: "conciliado",
      },
    ],
  },
  {
    id: "ap-2",
    proyectoId: "pry-13",
    colaboradorId: "col-1",
    ordenSuscripcion: "GDN-2026-000204",
    montoComprometidoArs: 6_000_000,
    montoAcreditadoArs: 3_750_000,
    moneda: "ARS",
    estado: "acreditado_parcial",
    adhesionAt: "2026-09-21",
    contratoVersion: "Contrato de adhesión v3 — 2026-08-01",
    movimientos: [
      {
        id: "mov-2",
        referenciaExterna: "TRF-4b88a1",
        importeArs: 3_750_000,
        fecha: "2026-09-22",
        estadoConciliacion: "con_diferencia",
        observacion:
          "Se acreditaron $ 3.750.000 contra una orden de $ 6.000.000. Queda pendiente el resto: la diferencia no se completa sola.",
      },
    ],
  },
  {
    id: "ap-3",
    proyectoId: "pry-2",
    colaboradorId: "col-1",
    ordenSuscripcion: "GDN-2026-000219",
    montoComprometidoArs: 4_500_000,
    montoAcreditadoArs: 0,
    moneda: "ARS",
    estado: "pendiente_acreditacion",
    adhesionAt: "2026-09-26",
    contratoVersion: "Contrato de adhesión v3 — 2026-08-01",
    movimientos: [],
  },
  {
    id: "ap-4",
    proyectoId: "pry-6",
    colaboradorId: "col-1",
    ordenSuscripcion: "GDN-2026-000102",
    montoComprometidoArs: 3_000_000,
    montoAcreditadoArs: 3_000_000,
    moneda: "ARS",
    estado: "acreditado",
    adhesionAt: "2026-06-03",
    contratoVersion: "Contrato de adhesión v2 — 2026-03-14",
    movimientos: [
      {
        id: "mov-3",
        referenciaExterna: "TRF-1a77d0",
        importeArs: 3_000_000,
        fecha: "2026-06-04",
        estadoConciliacion: "conciliado",
      },
    ],
  },
];

/**
 * El resto del pozo de cada proyecto, en un aporte agregado por proyecto.
 *
 * Existe para que el porcentaje recaudado salga de aportes acreditados y no de
 * un número suelto en el proyecto: `montoRecaudadoArs` queda como el total ya
 * calculado de lo acreditado, y la ficha lo vuelve a sumar desde los aportes.
 * Si los dos no dieran lo mismo, la demo estaría mostrando capital que no entró.
 */
const aportesDelResto: Aporte[] = proyectos
  .filter((p) => {
    if (p.montoRecaudadoArs <= 0) return false;
    const deColaboradorDemo = aportesDelColaborador
      .filter((a) => a.proyectoId === p.id)
      .reduce((acc, a) => acc + a.montoAcreditadoArs, 0);
    return p.montoRecaudadoArs - deColaboradorDemo > 0;
  })
  .map((p, i) => {
    const deColaboradorDemo = aportesDelColaborador
      .filter((a) => a.proyectoId === p.id)
      .reduce((acc, a) => acc + a.montoAcreditadoArs, 0);
    const resto = Math.max(0, p.montoRecaudadoArs - deColaboradorDemo);
    const fecha = p.publicadoAt ?? p.creadoAt;
    return {
      id: `ap-r${i + 1}`,
      proyectoId: p.id,
      colaboradorId: "col-otros",
      ordenSuscripcion: `GDN-2026-9${String(i + 1).padStart(5, "0")}`,
      montoComprometidoArs: resto,
      montoAcreditadoArs: resto,
      moneda: "ARS" as const,
      estado: "acreditado" as const,
      adhesionAt: fecha,
      contratoVersion: "Contrato de adhesión v3 — 2026-08-01",
      movimientos: [
        {
          id: `mov-r${i + 1}`,
          referenciaExterna: `TRF-${p.id}`,
          importeArs: resto,
          fecha,
          estadoConciliacion: "conciliado" as const,
        },
      ],
    };
  })
  .filter((a) => a.montoAcreditadoArs > 0);

/**
 * El colaborador de la demo. Uno solo: alcanza para que la cartera y el perfil
 * tengan a quién mostrar.
 */
export const colaboradores: Colaborador[] = [
  {
    id: "col-1",
    nombre: "Lucía Ferreyra",
    email: "lucia.ferreyra@ejemplo.com.ar",
    telefono: "+54 9 11 5544-2210",
    cuil: "27-33845120-4",
    altaAt: "2026-07-14",
    identidad: { metodo: "DNI contra RENAPER", fecha: "2026-07-15" },
    cbuDevolucion: "0000000000000000000000",
    aliasDevolucion: "lucia.ferreyra.gdn",
  },
  /*
   * El resto de los colaboradores de cada proyecto, en una sola fila.
   *
   * La demo tiene un colaborador con nombre y el recaudado de los proyectos sale
   * de sumar aportes acreditados, así que la diferencia tiene que estar puesta
   * por alguien. Este es ese alguien: un agregado, no una persona. Cuando haya
   * altas reales, desaparece y en su lugar quedan las filas de cada uno.
   */
  {
    id: "col-otros",
    nombre: "Resto de los colaboradores",
    email: "colaboradores@ejemplo.com.ar",
    telefono: "—",
    cuil: "—",
    altaAt: "2026-01-01",
    identidad: null,
    cbuDevolucion: "",
    aliasDevolucion: "",
  },
];

export const aportes: Aporte[] = [...aportesDelColaborador, ...aportesDelResto];

/**
 * Las liquidaciones del colaborador. Calculada, aprobada y pagada son tres cosas
 * distintas y la cartera las muestra separadas: una liquidación aprobada
 * todavía no es dinero cobrado.
 */
export const liquidaciones: Liquidacion[] = [
  {
    id: "liq-1",
    proyectoId: "pry-6",
    colaboradorId: "col-1",
    concepto: "Cierre del ciclo, con el resultado de la venta ya cobrada",
    capitalArs: 3_000_000,
    resultadoArs: 730_500,
    estado: "pagada",
    fecha: "2026-09-19",
    pagadaAt: "2026-09-23",
  },
];
