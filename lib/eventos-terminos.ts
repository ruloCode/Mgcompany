import { CORREO_CONTACTO, LEYENDA_ALCOHOL, MG_INSTAGRAM } from "./eventos"

/* ============================================================
   Términos y condiciones de cada fiesta
   ============================================================
   Viven aquí, versionados, y no en una página suelta, por una razón: cada
   registro guarda la versión que aceptó (evento_registros.terminos_version).
   Si mañana alguien reclama, lo que protege a MG es poder mostrar QUÉ texto
   aceptó esa persona y CUÁNDO, no el texto que esté publicado ese día.

   Cambiar el texto = subir la versión. Nunca se edita una versión ya
   aceptada por alguien.

   Tres ideas organizan el texto, todas por norma colombiana:

   1. Quien publica una promoción queda obligado por ella (Ley 1480 de 2011,
      art. 33), y un concurso cuenta como promoción (art. 5). Por eso el
      premio de $3.000.000 dice en todas partes que lo OFRECE, DECIDE y PAGA
      DEF. Si solo lo dijera aquí, la página de MG lo seguiría prometiendo.
   2. El concurso se decide por un jurado, por creatividad: no hay sorteo.
      Un sorteo con premio es un juego de suerte y azar (Ley 643 de 2001) y
      exige autorización; un concurso de habilidad no es azar.
   3. La autorización de imagen tiene que ser previa, expresa y específica:
      quién la usa, para qué, dónde y por cuánto tiempo. Una frase genérica
      de "fines publicitarios" no basta.

   Lo que NO se hace a propósito: eximir a MG de todo. En contratos con
   consumidores, las cláusulas que limitan en exceso la responsabilidad son
   abusivas (Ley 1480, arts. 42-43) y se tienen por no escritas. Un texto que
   promete demasiado protege menos que uno que reparte bien lo que le toca a
   cada quien. Esto NO reemplaza la revisión de un abogado. */

export interface SeccionTerminos {
  titulo: string
  parrafos: string[]
}

export interface Terminos {
  version: string
  actualizados: string
  titulo: string
  secciones: SeccionTerminos[]
}

const CONTACTO = CORREO_CONTACTO

export const TERMINOS_EVENTOS: Record<string, Terminos> = {
  "coronacion-mg1": {
    version: "1.0",
    actualizados: "23 de octubre de 2026",
    titulo: "La Coronación MG1",
    secciones: [
      {
        titulo: "Quién es quién",
        parrafos: [
          "MG Company Group («MG») produce La Coronación MG1, la noche final del concurso MG1, y administra la lista de invitados, el registro y los pases.",
          "Def Jamaica Club («DEF») es el establecimiento donde se realiza el evento, en Soacha, Cundinamarca. DEF opera el lugar y responde por sus instalaciones, su seguridad, el control de acceso, el aforo y la venta y servicio de alimentos y bebidas.",
          "El concurso de disfraces y su premio de $3.000.000 los ofrece, decide y paga exclusivamente DEF (sección 6). MG no es parte de ese concurso.",
        ],
      },
      {
        titulo: "Aceptación",
        parrafos: [
          "Al registrarte en la lista aceptas estos términos. Si no estás de acuerdo con ellos, no te registres.",
          "MG puede actualizar estos términos antes del evento para corregir o precisar condiciones. La versión vigente es la publicada en esta página y cada registro guarda la versión que se aceptó. Una actualización no afecta derechos ya adquiridos.",
        ],
      },
      {
        titulo: "El evento",
        parrafos: [
          "Viernes 30 de octubre de 2026, puertas desde las 6:00 p.m., en Def Jamaica Club, Soacha.",
          "La programación, los artistas y los horarios pueden cambiar. Si el evento se aplaza, cambia de lugar o se cancela por fuerza mayor, caso fortuito, orden de autoridad o razones de seguridad, MG lo informará por los mismos medios por los que lo dio a conocer.",
          "El acceso por la lista no requiere pago. Por eso ni MG ni DEF reconocen los gastos en que incurras para asistir, como transporte, disfraz o alojamiento.",
        ],
      },
      {
        titulo: "Registro, pase y acceso",
        parrafos: [
          "El pase es personal e intransferible: uno por persona, ligado al correo con el que te registraste.",
          "El pase (código QR) llega a tu correo y es el único medio de ingreso por la lista. Cuídalo: permite un solo ingreso, y quien lo presente primero será tratado como su titular.",
          "Estar registrado no garantiza el ingreso. El acceso depende del aforo del establecimiento, de las condiciones de seguridad y de las reglas de admisión de la sección 5.",
          "Los datos que entregues deben ser verdaderos. MG puede anular registros con datos falsos, duplicados o creados de forma automatizada.",
        ],
      },
      {
        titulo: "Admisión y conducta",
        parrafos: [
          "Solo mayores de 18 años. En la puerta debes presentar tu documento de identidad original y vigente (cédula de ciudadanía, cédula de extranjería o pasaporte). Sin documento no hay ingreso, aunque tengas pase.",
          "DEF puede negar el ingreso o retirar del lugar a quien no acredite su mayoría de edad; esté en evidente estado de embriaguez o bajo efecto de sustancias; porte armas, objetos peligrosos o sustancias prohibidas; tenga conductas violentas, de acoso o que pongan en riesgo a otras personas; o incumpla estos términos o las normas del establecimiento. El ingreso nunca se negará por motivos discriminatorios.",
          `El consumo de bebidas alcohólicas es responsabilidad de cada asistente, y su venta y servicio corresponden exclusivamente a DEF. ${LEYENDA_ALCOHOL}`,
        ],
      },
      {
        titulo: "Concurso de disfraces · lo ofrece y paga DEF",
        parrafos: [
          "Organizador y responsable: DEF. DEF ofrece el concurso, elige al ganador y paga el premio. MG no participa en la elección, no paga el premio y no responde por su entrega. Cualquier reclamo sobre el concurso se dirige a DEF.",
          "Premio: $3.000.000 (tres millones de pesos colombianos) para un (1) ganador, que debe ser una persona natural. Si el disfraz es grupal, el premio se paga a una sola persona del grupo, y su reparto es asunto del grupo.",
          "Pueden participar los mayores de 18 años que hayan ingresado al evento, que estén presentes cuando se anuncie al ganador y que acrediten su identidad.",
          "El ganador lo elige exclusivamente DEF, con el jurado y los criterios que DEF defina y dé a conocer en el evento. Es un concurso de creatividad: no hay sorteo ni intervención del azar.",
          "DEF acordará con el ganador la forma y el plazo de pago, después de verificar su identidad. El premio no es transferible ni canjeable por otros bienes.",
          "El premio puede estar sujeto a retención en la fuente y a los demás impuestos que establezca la ley, entre ellos el impuesto de ganancia ocasional. Los impuestos a cargo del ganador son de su responsabilidad, y las retenciones que exija la ley las practica quien paga el premio.",
          "Reglas para los disfraces: no se admiten armas reales ni réplicas que puedan confundirse con armas reales, objetos cortantes, fuego, pirotecnia, aerosoles ni líquidos; tampoco disfraces que inciten al odio o a la discriminación, ni uniformes de autoridad usados para confundir. Las máscaras deben poder quitarse para el control de identidad. DEF puede impedir el ingreso con un disfraz que incumpla estas reglas.",
        ],
      },
      {
        titulo: "La botella para el perfil más activo · la entrega MG",
        parrafos: [
          "MG entrega una (1) botella de licor, cuya referencia define MG, a la persona que MG considere el perfil más activo.",
          `Para elegirla, MG valora la actividad en redes sociales relacionada con MG1 y con este evento —comentarios y publicaciones compartidas que etiqueten a @${MG_INSTAGRAM}— y las personas que, registradas con su link personal, ingresen efectivamente al evento.`,
          "Cuenta la actividad desde el registro hasta el viernes 30 de octubre de 2026 a las 8:00 p.m. El ganador se anuncia en el evento y debe estar presente, ser mayor de 18 años y acreditar su identidad.",
          "La decisión de MG es definitiva. MG puede excluir cuentas falsas, interacciones compradas o automatizadas y cualquier forma de manipulación.",
          "La botella se entrega esa misma noche en el evento. No es canjeable por dinero ni transferible.",
        ],
      },
      {
        titulo: "Sorpresas para parches disfrazados · las da MG",
        parrafos: [
          "MG podrá entregar sorpresas a algunos de los grupos que asistan disfrazados. Qué se entrega, a quién y cuándo depende exclusivamente del criterio de MG y de la disponibilidad. No es un premio garantizado ni se entrega a todos los grupos disfrazados.",
        ],
      },
      {
        titulo: "Link personal de invitación",
        parrafos: [
          "Cada persona registrada recibe un link personal para invitar. Quien se registre con él queda asociado a quien lo invitó.",
          "El link no da derecho a un premio por sí solo: es uno de los elementos que MG valora según la sección 7. MG puede anular las asociaciones obtenidas de forma fraudulenta.",
        ],
      },
      {
        titulo: "Fotos, video y uso de tu imagen",
        parrafos: [
          "El evento será fotografiado y grabado, porque hace parte del contenido del reality MG1.",
          "Al registrarte e ingresar autorizas de manera previa y expresa a MG y a DEF para captar tu imagen, tu voz y tu apariencia durante el evento y usarlas, sin remuneración, en: (a) los capítulos y contenidos de MG1 en YouTube; (b) las publicaciones de MG y de DEF en Instagram, TikTok, Facebook y sus sitios web; y (c) la promoción de futuros eventos de MG. La autorización vale para cualquier país, porque el contenido se publica en internet, y por cinco (5) años desde el evento. El contenido publicado dentro de ese plazo puede seguir publicado después.",
          "Si no quieres aparecer, díselo al equipo de producción de MG al ingresar: MG hará esfuerzos razonables para no usar tomas en las que seas protagonista o se te identifique. En las tomas generales del público no se puede garantizar que no aparezcas.",
          `Puedes pedir el retiro de una publicación de MG en la que aparezcas escribiendo a ${CONTACTO}. MG la atenderá dentro de un plazo razonable.`,
        ],
      },
      {
        titulo: "El contenido que publiques",
        parrafos: [
          `Si publicas contenido del evento etiquetando a @${MG_INSTAGRAM}, autorizas a MG a compartirlo en sus redes, citando tu cuenta.`,
          "Si recibiste tu acceso como parte de un acuerdo para generar contenido, debes contarle a tu audiencia esa relación —por ejemplo, con la etiqueta de colaboración de la plataforma o con #Invitado—, como recomienda la Guía de Buenas Prácticas en la Publicidad a través de Influenciadores de la Superintendencia de Industria y Comercio.",
        ],
      },
      {
        titulo: "Responsabilidad",
        parrafos: [
          "MG responde por lo que le corresponde: la administración de la lista y de los pases, la producción de su contenido, y la botella y las sorpresas que entregue.",
          "DEF responde por el establecimiento —instalaciones, seguridad, control de ingreso, aforo y servicio de alimentos y bebidas— y por el concurso de disfraces y su premio.",
          "En la medida en que la ley lo permite, MG no responde por objetos perdidos, olvidados o hurtados; por daños causados por otros asistentes o por terceros; por el transporte de ida y regreso; ni por hechos atribuibles a DEF o a la conducta de cada asistente. Nada en estos términos limita la responsabilidad que la ley no permite limitar.",
        ],
      },
      {
        titulo: "Tus datos personales",
        parrafos: [
          "MG trata tus datos según la Ley 1581 de 2012 para gestionar tu registro, tu pase y tu ingreso, y para medir la actividad de la comunidad. Solo si lo autorizaste en la casilla aparte, los usará para invitarte a próximos eventos y en audiencias publicitarias.",
          "Para controlar el ingreso, MG puede compartir con DEF los datos estrictamente necesarios.",
          `Puedes conocer, actualizar, rectificar y suprimir tus datos, y revocar tu autorización, escribiendo a ${CONTACTO}.`,
        ],
      },
      {
        titulo: "Ley aplicable y contacto",
        parrafos: [
          "Estos términos se rigen por la ley colombiana.",
          `Para cualquier pregunta sobre la lista, tu pase o estos términos, escribe a ${CONTACTO}. Las preguntas sobre el concurso de disfraces y su premio se dirigen a DEF.`,
        ],
      },
    ],
  },
}

export const terminosDe = (evento: string): Terminos | null => TERMINOS_EVENTOS[evento] ?? null
