export type QuizItem = {
  id: string;
  subjectSlug: string;
  prompt: string;
  answer: boolean;
  note?: string;
};

export const MIX_SLUG = "mixto";

export const QUIZ: QuizItem[] = [
  {
    id: "adm-1",
    subjectSlug: "administrativo",
    prompt:
      "La jurisdicción contencioso administrativa es solo un sistema exclusivo de protección de la legalidad objetiva del acto.",
    answer: false,
  },
  {
    id: "adm-2",
    subjectSlug: "administrativo",
    prompt:
      "El lapso para interponer el recurso contencioso tributario es de 180 días hábiles.",
    answer: false,
    note: "Son 25 días continuos.",
  },
  {
    id: "adm-3",
    subjectSlug: "administrativo",
    prompt:
      "Si en una querella funcionarial se pide la nulidad del acto, la restitución al cargo y el pago de salarios caídos, esa petición es inadmisible por inepta acumulación.",
    answer: false,
  },
  {
    id: "adm-4",
    subjectSlug: "administrativo",
    prompt:
      "El contencioso administrativo venezolano está influenciado por el sistema español, norteamericano y francés.",
    answer: true,
  },
  {
    id: "adm-5",
    subjectSlug: "administrativo",
    prompt:
      "Un correo que identifica el acto y su fecha de emisión puede servir para darse por notificado y acompañar el libelo del recurso de nulidad.",
    answer: true,
  },
  {
    id: "adm-6",
    subjectSlug: "administrativo",
    prompt:
      "El acto dictado por el inspector del trabajo en un procedimiento de despido es revisado por el contencioso administrativo.",
    answer: false,
  },
  {
    id: "adm-7",
    subjectSlug: "administrativo",
    prompt:
      "La participación de un tercero en el contencioso administrativo sólo es posible si el propio tercero se la pide al juez.",
    answer: false,
  },
  {
    id: "adm-8",
    subjectSlug: "administrativo",
    prompt:
      "Si una querella se declara inadmisible por caducidad y se intenta de nuevo contra el mismo acto, el tribunal puede declarar inadmisible por cosa juzgada.",
    answer: true,
  },
  {
    id: "adm-9",
    subjectSlug: "administrativo",
    prompt:
      "El interés actual como legitimación activa permite mayor accesibilidad a la jurisdicción contencioso administrativa.",
    answer: true,
  },
  {
    id: "adm-10",
    subjectSlug: "administrativo",
    prompt:
      "El lapso de la querella funcionarial está en una ley especial y es distinto a los 180 días de la LOJCA.",
    answer: true,
  },
  {
    id: "adm-11",
    subjectSlug: "administrativo",
    prompt:
      "La característica subjetiva del contencioso se manifiesta en que la decisión resuelve la ilegalidad del acto y restituye la situación infringida.",
    answer: true,
  },
  {
    id: "adm-12",
    subjectSlug: "administrativo",
    prompt:
      "La función electoral es función administrativa controlada por el contencioso administrativo.",
    answer: true,
  },
  {
    id: "adm-13",
    subjectSlug: "administrativo",
    prompt:
      "El objetivo del contencioso administrativo es dirimir conflictos entre particulares.",
    answer: false,
  },
  {
    id: "adm-14",
    subjectSlug: "administrativo",
    prompt:
      "El lapso de caducidad de 180 días se cuenta, como todo lapso procesal, en días de despacho.",
    answer: false,
  },
  {
    id: "adm-15",
    subjectSlug: "administrativo",
    prompt:
      "Si la Procuraduría no responde el procedimiento administrativo, se puede intentar el recurso de contenido patrimonial contra entes públicos.",
    answer: true,
  },
  {
    id: "adm-16",
    subjectSlug: "administrativo",
    prompt:
      "Un recurso por deficiencia del servicio eléctrico intentado directamente, sin queja previa al prestador, puede declararse inadmisible.",
    answer: true,
  },
  {
    id: "adm-17",
    subjectSlug: "administrativo",
    prompt:
      "Vecinos pueden tener legitimación para actuar en el contencioso contra un consejo comunal que no rinde cuentas de recursos comunes.",
    answer: true,
  },
  {
    id: "adm-18",
    subjectSlug: "administrativo",
    prompt:
      "El contencioso administrativo tiene definidas constitucionalmente sus funciones desde la Constitución de 1961.",
    answer: false,
  },
  {
    id: "adm-19",
    subjectSlug: "administrativo",
    prompt:
      "El contencioso administrativo tiene como objetivo dirimir las controversias entre órganos administrativos.",
    answer: false,
  },
  {
    id: "adm-20",
    subjectSlug: "administrativo",
    prompt:
      "El lapso para recurrir actos administrativos temporales es de 90 días continuos.",
    answer: false,
  },
  {
    id: "adm-21",
    subjectSlug: "administrativo",
    prompt:
      "Son principios del contencioso administrativo la gratuidad, la celeridad, la brevedad, la transparencia y la responsabilidad.",
    answer: true,
  },
  {
    id: "adm-22",
    subjectSlug: "administrativo",
    prompt:
      "Una demanda de 100 millones contra la Alcaldía de San Cristóbal, interpuesta en un juzgado superior estadal, puede declinarse a la Sala Político Administrativa.",
    answer: true,
  },
  {
    id: "adm-23",
    subjectSlug: "administrativo",
    prompt:
      "Actualmente existen cuatro juzgados nacionales en la jurisdicción contenciosa administrativa, conforme a la LOJCA.",
    answer: true,
  },
  {
    id: "adm-24",
    subjectSlug: "administrativo",
    prompt:
      "La omisión de consignar el poder con el libelo conlleva la inadmisibilidad del recurso.",
    answer: true,
  },
  {
    id: "adm-25",
    subjectSlug: "administrativo",
    prompt: "El contencioso administrativo nace con la Constitución de 1811.",
    answer: false,
  },
  {
    id: "civ-1",
    subjectSlug: "civil-iv",
    prompt:
      "En el Código Civil venezolano el contrato de compraventa es consensual: se perfecciona por el consentimiento sobre la cosa y el precio.",
    answer: true,
  },
  {
    id: "civ-2",
    subjectSlug: "civil-iv",
    prompt: "El depósito es siempre un contrato oneroso.",
    answer: false,
    note: "Puede ser gratuito u oneroso.",
  },
  {
    id: "civ-3",
    subjectSlug: "civil-iv",
    prompt: "La hipoteca recae sobre bienes muebles.",
    answer: false,
    note: "La hipoteca es un derecho real sobre inmuebles.",
  },
  {
    id: "civ-4",
    subjectSlug: "civil-iv",
    prompt:
      "El vendedor está obligado al saneamiento por evicción y por vicios ocultos.",
    answer: true,
  },
  {
    id: "civ-5",
    subjectSlug: "civil-iv",
    prompt:
      "En el depósito irregular de cosas fungibles se transfiere la propiedad al depositario, que restituye otro tanto de la misma especie.",
    answer: true,
  },
  {
    id: "civ-6",
    subjectSlug: "civil-iv",
    prompt: "La prenda recae sobre bienes inmuebles.",
    answer: false,
    note: "La prenda es sobre muebles; la hipoteca, sobre inmuebles.",
  },
  {
    id: "civ-7",
    subjectSlug: "civil-iv",
    prompt:
      "La tradición de la cosa vendida es el modo de adquirir la propiedad frente a terceros.",
    answer: true,
  },
  {
    id: "civ-8",
    subjectSlug: "civil-iv",
    prompt:
      "El precio en la compraventa puede consistir en otra cosa distinta del dinero.",
    answer: false,
    note: "Si se da otra cosa, hay permuta.",
  },
  {
    id: "civ-9",
    subjectSlug: "civil-iv",
    prompt:
      "La fianza es un contrato accesorio: no existe sin una obligación principal.",
    answer: true,
  },
  {
    id: "civ-10",
    subjectSlug: "civil-iv",
    prompt:
      "El depositario puede usar la cosa depositada aunque el contrato no lo autorice.",
    answer: false,
  },
  {
    id: "lab-1",
    subjectSlug: "laboral",
    prompt:
      "En la LOTTT el contrato de trabajo se presume, aun si no hay documento escrito, cuando hay prestación de servicio por cuenta ajena.",
    answer: true,
  },
  {
    id: "lab-2",
    subjectSlug: "laboral",
    prompt:
      "Las prestaciones sociales por antigüedad se pagan solo si el trabajador renuncia de forma justificada.",
    answer: false,
    note: "Se generan por el hecho del trabajo, con independencia de la causa de terminación.",
  },
  {
    id: "lab-3",
    subjectSlug: "laboral",
    prompt:
      "El período de prueba no puede pactarse en un contrato por tiempo indeterminado.",
    answer: false,
  },
  {
    id: "lab-4",
    subjectSlug: "laboral",
    prompt:
      "La jornada ordinaria máxima, como regla, es de 8 horas diarias y 40 semanales en la LOTTT.",
    answer: true,
  },
  {
    id: "lab-5",
    subjectSlug: "laboral",
    prompt:
      "El salario incluye solo el sueldo base en dinero, nunca utilidades ni alícuotas.",
    answer: false,
  },
  {
    id: "lab-6",
    subjectSlug: "laboral",
    prompt:
      "El despido de un trabajador amparado por inamovilidad requiere calificación previa del inspector del trabajo.",
    answer: true,
  },
  {
    id: "lab-7",
    subjectSlug: "laboral",
    prompt:
      "El contrato a tiempo determinado es la forma ordinaria de contratación en Venezuela.",
    answer: false,
    note: "La regla es el contrato por tiempo indeterminado.",
  },
  {
    id: "lab-8",
    subjectSlug: "laboral",
    prompt:
      "Las utilidades son una obligación anual del patrono y forman parte del salario para prestaciones.",
    answer: true,
  },
  {
    id: "lab-9",
    subjectSlug: "laboral",
    prompt:
      "La relación de trabajo se caracteriza por ajenidad, subordinación y retribución.",
    answer: true,
  },
  {
    id: "lab-10",
    subjectSlug: "laboral",
    prompt:
      "El trabajador puede renunciar a las prestaciones sociales en el contrato de ingreso.",
    answer: false,
    note: "Son derechos irrenunciables.",
  },
  {
    id: "mer-1",
    subjectSlug: "mercantil",
    prompt:
      "Es comerciante quien hace del comercio su profesión habitual, según el Código de Comercio.",
    answer: true,
  },
  {
    id: "mer-2",
    subjectSlug: "mercantil",
    prompt:
      "Todos los actos de un no comerciante son actos de comercio por el solo hecho de hacerse por escrito.",
    answer: false,
  },
  {
    id: "mer-3",
    subjectSlug: "mercantil",
    prompt:
      "La sociedad anónima limita la responsabilidad de los socios al capital suscrito.",
    answer: true,
  },
  {
    id: "mer-4",
    subjectSlug: "mercantil",
    prompt:
      "El Registro Mercantil es irrelevante para la oponibilidad de la compañía frente a terceros.",
    answer: false,
  },
  {
    id: "mer-5",
    subjectSlug: "mercantil",
    prompt:
      "La letra de cambio es un título de crédito formal y abstracto.",
    answer: true,
  },
  {
    id: "mer-6",
    subjectSlug: "mercantil",
    prompt:
      "El comerciante no está obligado a llevar libros de contabilidad.",
    answer: false,
  },
  {
    id: "mer-7",
    subjectSlug: "mercantil",
    prompt:
      "La compraventa mercantil se presume onerosa y se rige, en lo no previsto, por el Código de Comercio.",
    answer: true,
  },
  {
    id: "mer-8",
    subjectSlug: "mercantil",
    prompt:
      "Una sociedad de responsabilidad limitada puede tener un número ilimitado de socios, como la anónima.",
    answer: false,
  },
  {
    id: "prc-1",
    subjectSlug: "procesal",
    prompt:
      "La contestación de la demanda es el acto en el que el demandado afirma, niega o desconoce los hechos y opone defensas.",
    answer: true,
  },
  {
    id: "prc-2",
    subjectSlug: "procesal",
    prompt:
      "Las cuestiones previas del artículo 346 del CPC se proponen después de sentenciada la causa.",
    answer: false,
    note: "Se oponen en la contestación o dentro de su lapso.",
  },
  {
    id: "prc-3",
    subjectSlug: "procesal",
    prompt:
      "La reconvención se propone en el mismo acto de contestación.",
    answer: true,
  },
  {
    id: "prc-4",
    subjectSlug: "procesal",
    prompt:
      "Si el demandado no contesta, se tienen por admitidos los hechos no contradichos, en los términos del CPC.",
    answer: true,
  },
  {
    id: "prc-5",
    subjectSlug: "procesal",
    prompt:
      "El procedimiento incidental se tramita siempre en cuaderno separado y suspende automáticamente el juicio principal.",
    answer: false,
  },
  {
    id: "prc-6",
    subjectSlug: "procesal",
    prompt:
      "La falta de cualidad es una cuestión previa que ataca la legitimación.",
    answer: true,
  },
  {
    id: "prc-7",
    subjectSlug: "procesal",
    prompt:
      "La litispendencia se da cuando hay otro juicio idéntico en trámite entre las mismas partes.",
    answer: true,
  },
  {
    id: "prc-8",
    subjectSlug: "procesal",
    prompt:
      "El juez puede suplir de oficio las defensas que el demandado no opuso, en cualquier materia.",
    answer: false,
  },
  {
    id: "prc-9",
    subjectSlug: "procesal",
    prompt:
      "La inepta acumulación de pretensiones puede dar lugar a una cuestión previa de inadmisibilidad.",
    answer: true,
  },
  {
    id: "prc-10",
    subjectSlug: "procesal",
    prompt:
      "La contestación puede hacerse de forma oral, sin dejar constancia en el expediente.",
    answer: false,
  },
  {
    id: "prb-1",
    subjectSlug: "pruebas",
    prompt:
      "La carga de la prueba corresponde, como regla, a quien afirma un hecho.",
    answer: true,
  },
  {
    id: "prb-2",
    subjectSlug: "pruebas",
    prompt:
      "El documento público hace plena fe entre las partes y respecto de terceros, en los términos de ley.",
    answer: true,
  },
  {
    id: "prb-3",
    subjectSlug: "pruebas",
    prompt:
      "La confesión es un medio de prueba prohibido en el proceso civil venezolano.",
    answer: false,
  },
  {
    id: "prb-4",
    subjectSlug: "pruebas",
    prompt:
      "La prueba se promueve y evacua en los lapsos que fija el CPC; fuera de ellos, como regla, es extemporánea.",
    answer: true,
  },
  {
    id: "prb-5",
    subjectSlug: "pruebas",
    prompt:
      "El juez está atado a un único medio de prueba y no puede apreciar el conjunto.",
    answer: false,
    note: "Rige la sana crítica y la apreciación conjunta.",
  },
  {
    id: "prb-6",
    subjectSlug: "pruebas",
    prompt:
      "La inspección judicial permite al tribunal constatar hechos que no requieren conocimientos especiales.",
    answer: true,
  },
  {
    id: "prb-7",
    subjectSlug: "pruebas",
    prompt:
      "El documento privado emanado de tercero se tiene por reconocido sin ningún trámite.",
    answer: false,
  },
  {
    id: "prb-8",
    subjectSlug: "pruebas",
    prompt:
      "Los hechos notorios no requieren prueba.",
    answer: true,
  },
  {
    id: "pad-1",
    subjectSlug: "practicas-adm",
    prompt:
      "El procedimiento administrativo se rige, en lo general, por la Ley Orgánica de Procedimientos Administrativos (LOPA).",
    answer: true,
  },
  {
    id: "pad-2",
    subjectSlug: "practicas-adm",
    prompt:
      "El silencio administrativo positivo opera en todos los procedimientos, sin excepción legal.",
    answer: false,
  },
  {
    id: "pad-3",
    subjectSlug: "practicas-adm",
    prompt:
      "El acto administrativo debe ser motivado, salvo los de simple trámite.",
    answer: true,
  },
  {
    id: "pad-4",
    subjectSlug: "practicas-adm",
    prompt:
      "La notificación del acto es irrelevante para que comience el lapso de impugnación.",
    answer: false,
  },
  {
    id: "pad-5",
    subjectSlug: "practicas-adm",
    prompt:
      "El interesado puede pedir copias certificadas de las actas del expediente administrativo.",
    answer: true,
  },
  {
    id: "pad-6",
    subjectSlug: "practicas-adm",
    prompt:
      "Un recurso de reconsideración se interpone ante el mismo órgano que dictó el acto.",
    answer: true,
  },
  {
    id: "ppr-1",
    subjectSlug: "practicas-proc",
    prompt:
      "El escrito de contestación debe identificar el tribunal, las partes y oponerse a los hechos de la demanda.",
    answer: true,
  },
  {
    id: "ppr-2",
    subjectSlug: "practicas-proc",
    prompt:
      "En la promoción de pruebas basta decir “promuevo las que convengan” sin especificar medios.",
    answer: false,
  },
  {
    id: "ppr-3",
    subjectSlug: "practicas-proc",
    prompt:
      "El poder debe acreditarse en el expediente para actuar en juicio en nombre de otro.",
    answer: true,
  },
  {
    id: "ppr-4",
    subjectSlug: "practicas-proc",
    prompt:
      "La reconvención se anexa un año después de la contestación.",
    answer: false,
    note: "Se propone en el mismo acto de contestar.",
  },
  {
    id: "ppr-5",
    subjectSlug: "practicas-proc",
    prompt:
      "Al promover testigos hay que indicar, en principio, los hechos sobre los que declararán.",
    answer: true,
  },
  {
    id: "ppr-6",
    subjectSlug: "practicas-proc",
    prompt:
      "Un modelo de contestación no sustituye el análisis del libelo concreto.",
    answer: true,
  },
];

export function questionsFor(slug: string): QuizItem[] {
  if (slug === MIX_SLUG) return [...QUIZ];
  return QUIZ.filter((q) => q.subjectSlug === slug);
}

export function quizCounts(): Record<string, number> {
  const map: Record<string, number> = { [MIX_SLUG]: QUIZ.length };
  for (const q of QUIZ) {
    map[q.subjectSlug] = (map[q.subjectSlug] ?? 0) + 1;
  }
  return map;
}

export function shuffle<T>(arr: T[]): T[] {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}
