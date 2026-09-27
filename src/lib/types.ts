// Dominio de Guardian. Estos tipos son el contrato entre las pantallas y los datos:
// hoy los sirve un mock, mañana Supabase, sin tocar los componentes.

export type Rol = "productor" | "colaborador" | "admin";

/** Destino de los fondos pedidos. */
/**
 * Guardian financia dos cosas distintas y la línea entre ellas es si el capital
 * compra cabezas o no.
 *
 * `ciclo_engorde` es el capital que va sobre el animal: la compra de la hacienda
 * y lo que la hace engordar, incluida la puesta a feedlot. `capital_trabajo` es
 * todo lo indirecto —ración, sanidad, alquiler del corral, flete, servicios— sobre
 * un lote que el productor ya tiene. `mixto` cuando el mismo proyecto hace las dos.
 *
 * El destino no es una etiqueta suelta: decide qué respalda al colaborador. En un
 * ciclo de engorde el respaldo se compra con el capital; en capital de trabajo el
 * respaldo ya existe antes de que entre un peso.
 */
export type DestinoFondos = "capital_trabajo" | "ciclo_engorde" | "mixto";

/**
 * Las dos modalidades con las que Guardian financia un ciclo. No son tres: lo
 * que antes se llamaba `mixto` es casi siempre compra y engorde con gastos del
 * ciclo adentro, y meterlo en una categoría propia hacía que el colaborador no
 * supiera qué estaba comprando.
 *
 * `compra_engorde` es el capital que adquiere hacienda y la termina, y puede
 * incluir los gastos del ciclo sobre ese mismo lote. El colaborador participa del
 * resultado efectivo de la venta.
 *
 * `capital_trabajo` financia gastos sobre un lote que el productor ya tiene. El
 * colaborador recibe capital más la tasa pactada, y el riesgo es de incumplimiento
 * del productor, no de precio de la hacienda.
 *
 * Que un gasto sea fijo o variable depende del objeto financiado y del contrato,
 * no de la modalidad: esa clasificación no se deduce acá.
 */
export type Modalidad = "compra_engorde" | "capital_trabajo";

/**
 * Qué se puede afirmar de una condición económica. `demostrativo` es el dato
 * ficticio que usa la demo; `contrato` es el que sale del instrumento firmado.
 * Nada que sea `demostrativo` se muestra sin decirlo.
 */
export type FuenteCondicion = "contrato" | "demostrativo";

/** Compra y engorde: el colaborador participa del resultado, no cobra una tasa. */
export interface ParticipacionResultado {
  /** null mientras el reparto no esté pactado: bloquea publicar y liquidar. */
  colaboradoresPct: number | null;
  productorPct: number | null;
  /** Sobre qué se calcula el reparto, con las palabras del contrato. */
  base: string;
  fuente: FuenteCondicion;
}

/** Capital de trabajo: capital más tasa, con su base temporal explícita. */
export interface TasaPactada {
  tasaPct: number | null;
  /** Una tasa sin base temporal no se puede calcular ni comparar. */
  base: "anual" | "mensual" | "ciclo" | null;
  calculo: string;
  vencimientos: string;
  fuente: FuenteCondicion;
}

/**
 * Una proyección de resultado, con la fecha en que se hizo y los supuestos a la
 * vista. Es una estimación del productor: no es el resultado y no se muestra
 * como si lo fuera.
 */
export interface ProyeccionResultado {
  fecha: string;
  supuestos: string[];
  ingresosEstimadosArs: number;
  costosEstimadosArs: number;
  /** null mientras la comisión de Guardian no esté definida. */
  comisionesEstimadasArs: number | null;
}

/**
 * Las condiciones económicas del proyecto. Se llenan según la modalidad y lo que
 * falta se muestra como pendiente en vez de completarse con un supuesto.
 */
/**
 * Lo que Guardian y el fideicomiso cobran, y quién lo paga.
 *
 * Va con base, momento y a cargo de quién, porque un porcentaje suelto no se
 * puede verificar: no es lo mismo 3 % sobre el capital colocado que 3 % sobre el
 * resultado, ni que lo pague el colaborador o salga del fideicomiso. Mientras el
 * porcentaje sea `null`, la liquidación no se puede calcular.
 */
export interface Comision {
  concepto: string;
  /** Sobre qué se calcula, con las palabras del contrato. */
  base: string;
  porcentaje: number | null;
  aCargoDe: "colaborador" | "productor" | "fideicomiso";
  /** Cuándo se cobra. */
  momento: string;
  fuente: FuenteCondicion;
}

/**
 * Qué pasa cuando algo sale mal. No es letra chica: es la parte del contrato que
 * el colaborador necesita antes de poner el dinero, y la que hoy solo estaba escrita
 * para la mortandad.
 *
 * Cada caso dice qué se hace y quién lo soporta. Lo que no esté pactado se
 * muestra como pendiente y no se completa con un supuesto.
 */
export type CasoContingencia =
  | "mortandad"
  | "sanitaria"
  | "demora"
  | "incumplimiento"
  | "precio";

export interface Contingencia {
  caso: CasoContingencia;
  queDice: string;
  aCargoDe: string;
  fuente: FuenteCondicion;
}

export interface CondicionesEconomicas {
  monedaAporte: "ARS";
  monedaDevolucion: "ARS";
  participacion?: ParticipacionResultado;
  tasa?: TasaPactada;
  proyeccion?: ProyeccionResultado;
  /** Vacío es "sin definir": bloquea liquidar, no publicar. */
  comisiones: Comision[];
  contingencias: Contingencia[];
}

/**
 * Estado de posesión de los animales al publicar. Determina qué documentación
 * es obligatoria y cómo se liberarían los fondos.
 */
export type TipoPosesion = "promesa_inversion" | "existencia_comprobada" | "hibrido";

export type SistemaProductivo = "corral" | "pastura" | "mixto";

export type EstadoProyecto =
  | "borrador"
  | "en_validacion"
  | "abierto"
  | "fondeado"
  | "en_curso"
  | "cerrado"
  | "rechazado";

export type TipoDocumento =
  | "renspa"
  | "dte"
  | "romaneo"
  | "boleto_compraventa"
  | "listado_rfid"
  | "poliza_seguro"
  | "otro";

/** Lo que la IA puede afirmar sobre el documento. Deliberadamente separado de la autenticidad. */
export type EstadoExtraccion = "pendiente" | "procesando" | "ok" | "error";

/**
 * Dos verdades distintas que no hay que colapsar en un solo tilde verde:
 * que los datos cierren entre sí no prueba que el papel sea auténtico.
 */
export type EstadoConsistencia = "sin_revisar" | "consistente" | "con_discrepancias";
export type EstadoAutenticidad = "sin_verificar" | "verificada" | "rechazada";

export type Severidad = "alta" | "media" | "baja";

export interface Productor {
  id: string;
  nombre: string;
  razonSocial: string;
  /** Quién atiende el teléfono: la persona, no la razón social. */
  responsable: string;
  correo: string;
  telefono: string;
  cuit: string;
  renspa: string;
  marcaRegistrada: string;
  establecimiento: string;
  localidad: string;
  provincia: string;
  sistemaProductivo: SistemaProductivo;
  capacidadInstalada: number;
  ocupacionActual: number;
  ciclosCompletados: number;
}

export interface CampoExtraido {
  campo: string;
  etiqueta: string;
  valor: string;
  confianza: number;
}

export interface Discrepancia {
  id: string;
  documentoId: string;
  campo: string;
  etiqueta: string;
  valorDeclarado: string;
  valorExtraido: string;
  severidad: Severidad;
  detalle: string;
  resuelta: boolean;
  resolucion?: string;
}

export interface Documento {
  id: string;
  proyectoId: string | null;
  productorId: string;
  tipo: TipoDocumento;
  nombreArchivo: string;
  /** Un escaneo sin capa de texto obliga a ir por visión y es el caso más frágil. */
  tieneCapaTexto: boolean;
  subidoAt: string;
  estadoExtraccion: EstadoExtraccion;
  estadoConsistencia: EstadoConsistencia;
  estadoAutenticidad: EstadoAutenticidad;
  /** Canal oficial de verificación del DT-e: senasa.gob.ar/vdc */
  cuve?: string;
  camposExtraidos: CampoExtraido[];
  /** Totales que el propio documento imprime y que permiten verificar la aritmética. */
  controlesAritmeticos?: {
    etiqueta: string;
    calculado: string;
    impreso: string;
    coincide: boolean;
  }[];
  observacionAdmin?: string;
}

/**
 * Quien pone el capital. No tiene establecimiento ni RENSPA, así que su ficha es
 * corta: quién es, cómo se verificó que es esa persona, y a qué cuenta se le
 * devuelve. Esa cuenta es el único dato operativo del colaborador: sin ella una
 * liquidación aprobada no se puede pagar.
 */
export interface Colaborador {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  /** CUIT o CUIL. Hace falta para el contrato de adhesión y para la retención. */
  cuil: string;
  altaAt: string;
  /** Contra qué se verificó la identidad, y cuándo. Vacío si todavía no pasó. */
  identidad: { metodo: string; fecha: string } | null;
  /** La cuenta donde se acreditan las liquidaciones. A nombre del colaborador. */
  cbuDevolucion: string;
  aliasDevolucion: string;
}

/**
 * Cada proyecto es una serie de un fideicomiso ordinario de administración
 * (CCyC arts. 1666-1707). Los campos son los que el contrato tiene que tener sí
 * o sí: partes, bienes fideicomitidos, objeto, plazo, rendición de cuentas,
 * seguro e inscripción registral. Si alguno falta, no hay contrato válido, así
 * que ninguno es opcional.
 *
 * Guardian es el fiduciario de cada serie: administra el patrimonio separado,
 * rinde cuentas y responde por su gestión. Eso es distinto de garantizar el
 * resultado, que depende de la venta del lote y no de la administración.
 */
export interface Fideicomiso {
  /** "Guardian Ganadero — Serie IV". El marco es uno; cada ciclo es una serie. */
  serie: string;
  /** Quien administra el patrimonio separado: Guardian. */
  fiduciario: string;
  /** Quienes aportan: los colaboradores ponen dinero, el productor hacienda o trabajo. */
  fiduciantes: string;
  /** Quienes cobran el resultado. Suelen ser los mismos fiduciantes. */
  fideicomisarios: string;
  /** Qué entra al patrimonio separado, individualizado (art. 1667 inc. a). */
  bienesFideicomitidos: string;
  /** Qué se hace con esos bienes y cómo se reparte el producido. */
  objeto: string;
  /** Cómo se divide el resultado del ciclo, ganancia o pérdida. */
  repartoResultado: string;
  /** Quién soporta la mortandad: la cláusula que más pesa en el downside. */
  mortandad: string;
  inicioAt: string;
  /** Extinción de la serie. El tope legal son 30 años (art. 1668). */
  extincionAt: string;
  /** No menos de una vez al año (art. 1675), y es irrenunciable. */
  rendicionCuentas: string;
  /** Responsabilidad civil sobre los bienes: obligatorio (art. 1685). */
  seguroResponsabilidadCivil: string;
  /** Dónde quedó inscripto el contrato (art. 1669). */
  inscripcion: string;
}

/**
 * Los tipos de garantía real que un productor puede constituir.
 *
 * No se confunden con la documentación del lote. El DT-e, el romaneo y el listado
 * de caravanas son transparencia: dicen qué hay, dónde está y de quién es, y no
 * responden por nada si el ciclo sale mal. La garantía es lo que se ejecuta.
 */
export type TipoGarantia =
  | "hipoteca"
  | "prenda_rodeo"
  | "aval_establecimiento"
  | "cesion_derechos"
  | "fianza_personal";

export type EstadoGarantia = "vigente" | "sin_verificar" | "vencida";

/**
 * Hasta dónde llegó la garantía. Una garantía propuesta es una intención; una
 * constituida tiene instrumento inscripto y se puede ejecutar. El cupo por
 * cantidad de proyectos es una política operativa y no mide cobertura: una
 * hipoteca de $ 150 millones respaldando dos proyectos de $ 120 millones entra en el
 * cupo y no alcanza para los dos.
 */
export type EstadoConstitucion = "propuesta" | "en_revision" | "constituida";

/**
 * Una garantía vive en el productor y no en el proyecto: la misma hipoteca sirve
 * para más de un ciclo, y volver a cargarla en cada alta sería trabajo al vicio.
 *
 * De ahí el cupo. Un bien alcanza para respaldar unos pocos proyectos vivos a la
 * vez; sin tope, el mismo inmueble terminaría ofrecido a diez proyectos y cada
 * colaborador creería tenerlo entero.
 */
export interface Garantia {
  id: string;
  productorId: string;
  tipo: TipoGarantia;
  /** Matrícula, partida o número de registro: cómo se individualiza el bien. */
  identificacion: string;
  descripcion: string;
  valuacionArs: number;
  /** Cuántos proyectos vivos puede respaldar al mismo tiempo. */
  cupoProyectos: number;
  vigenciaHasta: string;
  estado: EstadoGarantia;
  estadoConstitucion: EstadoConstitucion;
  /** El instrumento que la constituye, cuando existe. */
  instrumento?: string;
  /** El documento que la constituye, cuando está cargado. */
  documentoId: string | null;
}

export interface Proyecto {
  id: string;
  productorId: string;
  titulo: string;
  /**
   * La modalidad del proyecto. `null` es "sin determinar": un registro viejo que
   * no se pudo clasificar sin leerlo. No se adivina, no se publica y queda a la
   * vista para que alguien lo resuelva.
   */
  modalidad: Modalidad | null;
  /** Por qué quedó sin determinar, cuando es el caso. */
  motivoRevisionModalidad?: string;
  /** El valor anterior, para poder rastrear de dónde salió la modalidad. */
  destinoFondosPrevio?: DestinoFondos;
  condiciones: CondicionesEconomicas;
  /**
   * El mínimo con el que el ciclo puede arrancar, que no es el objetivo.
   * Alcanzarlo no inicia la ejecución por sí solo: hace falta además que las
   * condiciones contractuales y el presupuesto estén aprobados.
   */
  montoMinimoInicioArs: number | null;
  /**
   * Las operaciones frenadas y por qué. Una suspensión impide operar hacia
   * adelante; no borra lo anterior ni tapa la rendición.
   */
  restricciones?: Restriccion[];
  /**
   * En qué se gasta el capital, con las palabras del productor. El destino dice
   * la categoría —capital de trabajo, ciclo de engorde, mixto—; esto dice si
   * es ración, sanidad, mano de obra o los animales en sí. El colaborador de un
   * proyecto de capital de trabajo está financiando insumos, no hacienda, y
   * tiene derecho a leerlo antes de poner el dinero.
   */
  destinoDetalle: string;
  tipoPosesion: TipoPosesion;
  sistemaProductivo: SistemaProductivo;
  cabezas: number;
  categoria: string;
  /** La raza del lote. Cambia la ganancia diaria esperada y el precio de venta. */
  raza: string;
  pesoEntradaKg: number;
  pesoSalidaObjetivoKg: number;
  montoObjetivoArs: number;
  montoRecaudadoArs: number;
  /** De lo recaudado, lo que Guardian ya aprobó que salga hacia el productor. */
  montoLiberadoArs: number;
  /** De lo liberado, lo que el productor ya retiró. */
  montoRetiradoArs: number;
  /** Lo que dura el engorde. */
  plazoDias: number;
  /**
   * Lo que tarda el dinero en volver después de la venta, que no es lo mismo que
   * el ciclo: entre que el animal sale y el frigorífico paga pasan semanas.
   * `null` mientras no esté definido.
   */
  plazoCobroDias: number | null;
  /** En qué se gasta el capital, rubro por rubro. */
  presupuesto: RubroPresupuesto[];
  /** Cuándo sale cada tramo y contra qué. */
  cronograma: HitoDesembolso[];
  /** Los controles que Guardian hizo sobre este proyecto, con su fecha y alcance. */
  controles: ControlRealizado[];
  rendimientoEsperadoPct: number;
  /**
   * La garantía del productor que respalda este proyecto. Es una referencia y no
   * un texto libre: la garantía se configura una vez y se reusa, y el cupo se
   * cuenta sobre los proyectos que la apuntan. Vacío es el hueco.
   */
  garantiaId: string;
  tieneSeguro: boolean;
  estado: EstadoProyecto;
  provincia: string;
  creadoAt: string;
  publicadoAt?: string;
  /**
   * La serie del fideicomiso bajo la que se estructura el proyecto. Se constituye
   * al publicar, así que un borrador no la tiene.
   */
  fideicomiso?: Fideicomiso;
  /** El romaneo del frigorífico: lo único que describe el resultado real del ciclo. */
  resultado?: {
    dteSalida: string;
    cabezasFaena: number;
    kilosVivos: number;
    kgCarne: number;
    rendimientoPct: number;
    fecha: string;
  };
}

/**
 * Una pesada del lote durante el ciclo: cuántos animales quedan, cuánto pesan y
 * qué se gastó desde la anterior.
 *
 * Es el dato que sostiene las dos promesas del proyecto. Para el colaborador, que
 * puso capital en un corral que no ve, es la única forma de saber si el ciclo
 * viene bien antes del romaneo. Para Guardian es la serie que después alimenta
 * los modelos: sin pesadas intermedias, un ciclo es un número de entrada y otro
 * de salida.
 *
 * El peso es el promedio del lote, no el de un animal: así se pesa en la
 * balanza del corral, por tropa y no cabeza por cabeza.
 */
export interface RegistroSeguimiento {
  id: string;
  proyectoId: string;
  fecha: string;
  /** Cabezas vivas en el lote ese día. */
  cabezas: number;
  pesoPromedioKg: number;
  /** Bajas desde el registro anterior. */
  mortandad: number;
  /** Lo gastado en el período, en pesos. */
  gastoArs: number;
  conceptoGasto: string;
  nota?: string;
}

/** Qué quedó frenado en un proyecto, desde cuándo y por decisión de quién. */
export interface Restriccion {
  alcance: "adhesiones" | "desembolsos";
  motivo: string;
  responsable: string;
  desde: string;
}

/**
 * La adhesión de un colaborador a un proyecto y el dinero que efectivamente entró.
 *
 * Están separados a propósito. Aceptar el contrato genera una orden de
 * suscripción, no un aporte: el dinero existe cuando el banco lo acredita y la
 * conciliación lo vincula a esta orden. Subir un comprobante no acredita nada.
 */
export type EstadoAporte =
  | "pendiente_acreditacion"
  | "acreditado_parcial"
  | "acreditado"
  | "devuelto";

export interface Aporte {
  id: string;
  proyectoId: string;
  colaboradorId: string;
  /** El identificador que el colaborador pone en la transferencia. */
  ordenSuscripcion: string;
  montoComprometidoArs: number;
  /** Lo que el banco acreditó y la conciliación reconoció. Puede ser parcial. */
  montoAcreditadoArs: number;
  moneda: "ARS";
  estado: EstadoAporte;
  adhesionAt: string;
  /** La versión del contrato que el colaborador aceptó. */
  contratoVersion: string;
  movimientos: MovimientoBancario[];
}

/**
 * Un movimiento de la cuenta del fideicomiso. La referencia externa es la que
 * evita que la misma notificación cuente dos veces.
 */
export interface MovimientoBancario {
  id: string;
  referenciaExterna: string;
  importeArs: number;
  fecha: string;
  estadoConciliacion: "conciliado" | "con_diferencia" | "sin_identificar";
  observacion?: string;
}

/**
 * Lo que le toca a un colaborador de un ciclo. Calculada no es aprobada, y
 * aprobada no es pagada: el fiduciario paga, y hasta que eso pase el colaborador no
 * cobró.
 */
export type EstadoLiquidacion = "calculada" | "aprobada" | "pagada";

export interface Liquidacion {
  id: string;
  proyectoId: string;
  colaboradorId: string;
  concepto: string;
  capitalArs: number;
  resultadoArs: number;
  estado: EstadoLiquidacion;
  fecha: string;
  pagadaAt?: string;
}

/**
 * Una línea del presupuesto. Es lo que el colaborador necesita para saber en qué se
 * va su capital, y lo que después se compara contra las facturas: sin el rubro y
 * el período, una rendición no se puede imputar contra nada.
 */
export interface RubroPresupuesto {
  rubro: string;
  concepto: string;
  /** A quién se le paga, cuando ya está identificado. */
  proveedor?: string;
  montoArs: number;
  /** El tramo del ciclo que cubre. */
  periodo: string;
}

/**
 * Un tramo del desembolso: cuándo sale y contra qué se libera. Cumplir el hito
 * no paga solo: el fiduciario autoriza y ejecuta según sus atribuciones.
 */
export interface HitoDesembolso {
  hito: string;
  momento: string;
  montoArs: number;
  /** Qué hay que presentar para que ese tramo se libere. */
  condicion: string;
}

/**
 * Un control hecho sobre el proyecto. El alcance importa tanto como el
 * resultado: "verificado" sin decir qué se miró, cuándo y cómo no dice nada.
 */
export interface ControlRealizado {
  control: string;
  fecha: string;
  alcance: string;
  metodo: string;
  responsable: string;
}
