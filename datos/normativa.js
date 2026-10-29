/* Biblioteca de normativa del BCRA vinculada a riesgo operacional, tecnológico, fraude y terceras partes.
   Para agregar una norma, sumá un objeto a "normas" con los mismos campos. Temas posibles:
   'operacional', 'tecnologia', 'terceros', 'fraude', 'usuarios'.
   Fuente: textos publicados por el BCRA. Verificá siempre la versión vigente del texto ordenado en bcra.gob.ar. */
window.MX_NORMATIVA = {
  actualizado: '2026-10-29',
  normas: [
    {
      id: 'A8471', numero: 'A 8471', fecha: '2026-08-27', temas: ['fraude', 'operacional', 'terceros'],
      titulo: 'Gestión del riesgo de fraude',
      destinatarios: 'Entidades financieras y proveedores de servicios de pago (PSP)',
      texto: 'Lineamientos para la Gestión de Riesgos (punto 6.5) y Gobierno Societario',
      resumen: 'Incorpora un proceso integral de gestión del riesgo de fraude interno y externo dentro del marco de riesgo operacional, con un programa antifraude documentado (prevención, detección, respuesta, resolución y aprendizaje).',
      claves: ['Función antifraude asignada (unidad o responsable)', 'Canales de denuncia para empleados, clientes y terceros', 'Base centralizada de denuncias, con montos reconocidos al cliente', 'Reporte de fraude al Directorio al menos trimestral', 'Reporte a la Central de Prevención de Fraude y comunicación de nuevas tipologías a la SEFyC'],
      plazos: 'Entidades: vigencia 01/12/2026. PSPCP: cronograma por etapas hasta vigencia plena el 01/09/2027. Otros PSP: desde 01/01/2027.',
      estado: 'Vigente desde 01/12/2026',
      url: 'https://www.bcra.gob.ar/Pdfs/comytexord/A8471.pdf',
      enlaces: [
        { t: 'Comunicación A 8471 (PDF BCRA)', url: 'https://www.bcra.gob.ar/Pdfs/comytexord/A8471.pdf' },
        { t: 'Texto ordenado vigente: Lineamientos para la gestión de riesgos (al 31/07/2026)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/texord/t-lingeef.pdf' },
        { t: 'Análisis: Abogados.com.ar', url: 'https://abogados.com.ar/nueva-regulacion-del-bcra-sobre-gestion-del-riesgo-de-fraude-com-a-8471/39964' },
        { t: 'Análisis: Bruchou & Funes de Rioja', url: 'https://bruchoufunes.com/nueva-regulacion-del-bcra-sobre-gestion-del-riesgo-de-fraude-com-a-8471/' }
      ]
    },
    {
      id: 'A8473', numero: 'A 8473', fecha: '2026-09-03', temas: ['fraude', 'tecnologia'],
      titulo: 'Puntaje (score) de riesgo de fraude en transferencias',
      destinatarios: 'Bancos, PSP que ofrecen cuentas de pago y administradores de esquemas de transferencias',
      texto: 'Sistema Nacional de Pagos · Transferencias',
      resumen: 'Crea un esquema obligatorio de puntaje de riesgo de fraude por CUIL/CUIT, elaborado por los administradores de transferencias con datos públicos, de la Central de Prevención de Fraude y transaccionales, para usar en el alta de clientes, el monitoreo de transferencias y la revisión del padrón.',
      claves: ['El puntaje no puede ser el único fundamento de una decisión', 'Un riesgo elevado no implica bloqueo automático', 'El BCRA entrega los datos sin costo (archivos y API)'],
      plazos: 'Administradores: 120 días para la infraestructura. Entidades: 60 días (alta y padrón) y 90 días (monitoreo) desde que el sistema esté operativo.',
      estado: 'En implementación',
      url: 'https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8473.pdf',
      enlaces: [
        { t: 'Comunicación A 8473 (PDF BCRA)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8473.pdf' },
        { t: 'Comunicado BCRA (03/09/2026)', url: 'https://www.bcra.gob.ar/noticias/el-bcra-profundiza-la-estrategia-de-prevencion-del-fraude/' },
        { t: 'Análisis: Abogados.com.ar', url: 'https://abogados.com.ar/nuevo-score-de-riesgo-de-fraude-del-bcra-para-transferencias-inmediatas-com-a-8473/40015' },
        { t: 'Análisis: Marval', url: 'https://www.marval.com/publicacion/prevencion-del-fraude-en-transferencias-inmediatas-17717' }
      ]
    },
    {
      id: 'A8401', numero: 'A 8401', fecha: '2026-02-13', temas: ['terceros', 'tecnologia'],
      titulo: 'Terceras partes y servicios críticos (hojas del texto ordenado)',
      destinatarios: 'Entidades financieras, cámaras compensadoras, redes de cajeros, PSP e infraestructuras del mercado financiero',
      texto: 'Requisitos mínimos de Tecnología y Seguridad de la Información (Secc. 1, 10, 11 y 12) y Expansión de Entidades Financieras (Secc. 2)',
      resumen: 'Refuerza la gestión de terceros: notificación previa de servicios críticos con taxonomía (IaaS, PaaS, SaaS, gestión de ciberincidentes, operaciones de seguridad), contratos, planes de salida, subcontratación, controles y auditorías.',
      claves: ['Notificación a la Gerencia de Auditoría Externa de Sistemas con 60 días corridos de anticipación', 'Plan de finalización y gestión de subcontrataciones', 'Tercerización en el exterior e intragrupo: certificación del supervisor de origen', 'Glosario: servicios críticos, shadow IT, tercera parte, tolerancia al riesgo'],
      plazos: 'Vigencia 06/02/2026. PSP inscriptos: desde 04/08/2026.',
      estado: 'Vigente',
      url: 'https://www.bcra.gob.ar/Pdfs/comytexord/A8401.pdf',
      enlaces: [
        { t: 'Comunicación A 8401 (PDF BCRA)', url: 'https://www.bcra.gob.ar/Pdfs/comytexord/A8401.pdf' },
        { t: 'Texto ordenado vigente: Requisitos mínimos de tecnología y seguridad de la información (al 13/02/2026)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-rmgcti.pdf' }
      ]
    },
    {
      id: 'A8398', numero: 'A 8398', fecha: '2026-02-05', temas: ['tecnologia', 'terceros'],
      titulo: 'PSP obligados en tecnología y nuevo régimen de terceras partes',
      destinatarios: 'Entidades financieras y proveedores de servicios de pago',
      texto: 'Requisitos mínimos de Tecnología y Seguridad de la Información (Secc. 10 y 11) y Expansión de Entidades Financieras (Secc. 2)',
      resumen: 'Incorpora a los PSP a los requisitos mínimos de gestión y control de riesgos de tecnología y seguridad de la información, y reescribe el régimen de relación con terceras partes. La A 8401 publicó las hojas del texto ordenado.',
      claves: ['Reemplaza la Sección 10 (relación con terceras partes) y la Sección 2 de Expansión de Entidades Financieras', 'Tercerización crítica: aviso a la SEFyC con 60 días, con taxonomía de servicios y subcontratistas', 'Contratos con acceso de la entidad y la SEFyC, gestión de incidentes y borrado de datos al finalizar', 'Terceros en el exterior: países con estándares PLA/FT reconocidos', 'NEWPAY reemplaza a PRISMA entre las infraestructuras alcanzadas'],
      plazos: '180 días corridos desde su difusión.',
      estado: 'Vigente',
      url: 'https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8398.pdf',
      enlaces: [
        { t: 'Comunicación A 8398 (PDF BCRA)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8398.pdf' },
        { t: 'Texto ordenado vigente: Requisitos mínimos de tecnología y seguridad de la información (al 13/02/2026)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-rmgcti.pdf' },
        { t: 'Análisis: Marval', url: 'https://www.marval.com/Publicacion/nuevas-obligaciones-para-psp-en-materia-de-ciberseguridad-17480?lang=es' }
      ]
    },
    {
      id: 'A8315', numero: 'A 8315', fecha: '2025-09-01', temas: ['operacional', 'terceros', 'tecnologia'],
      titulo: 'Riesgo operacional y resiliencia operacional (texto ordenado)',
      destinatarios: 'Entidades financieras',
      texto: 'Lineamientos para la Gestión de Riesgos · Secciones 6 y 12',
      resumen: 'Actualiza la Sección 6 (riesgo operacional: definición, Directorio y Alta Gerencia, gestión del cambio, tercerización, continuidad, tecnología y transparencia) e incorpora la Sección 12 de resiliencia operacional.',
      claves: ['Resiliencia: operaciones críticas, tolerancia a la disrupción y mapeo de interdependencias', 'Dependencia de terceros dentro de la resiliencia', 'Gestión de incidentes y continuidad del negocio'],
      plazos: 'Vigencia 01/09/2025.',
      estado: 'Vigente',
      url: 'https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8315.pdf',
      enlaces: [
        { t: 'Comunicación A 8315 (PDF BCRA)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8315.pdf' },
        { t: 'Texto ordenado vigente: Lineamientos para la gestión de riesgos (al 31/07/2026)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/texord/t-lingeef.pdf' }
      ]
    },
    {
      id: 'A8249', numero: 'A 8249', fecha: '2025-06-02', temas: ['operacional'],
      titulo: 'Nuevo marco de riesgo operacional y resiliencia',
      destinatarios: 'Entidades financieras',
      texto: 'Lineamientos para la Gestión de Riesgos',
      resumen: 'Modifica la gestión del riesgo operacional: tres líneas de defensa proporcionales al perfil de la entidad, nuevas responsabilidades del Directorio y la Alta Gerencia, nuevas herramientas de identificación y evaluación, principio de transparencia y nueva sección de resiliencia operacional.',
      claves: ['Tres líneas de defensa', 'Divulgación pública del enfoque y la exposición al riesgo operacional', 'Asumir que habrá disrupciones y definir tolerancia'],
      plazos: 'Vigencia 01/09/2025 (texto ordenado por A 8315).',
      estado: 'Vigente',
      url: 'https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8249.pdf',
      enlaces: [
        { t: 'Comunicación A 8249 (PDF BCRA)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8249.pdf' },
        { t: 'Texto ordenado vigente: Lineamientos para la gestión de riesgos (al 31/07/2026)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/texord/t-lingeef.pdf' },
        { t: 'Resumen: ADEBA', url: 'https://www.adeba.com.ar/a-8249/' }
      ]
    },
    {
      id: 'A8280', numero: 'A 8280', fecha: '2025-07-17', temas: ['tecnologia', 'terceros'],
      titulo: 'Notificación obligatoria de ciberincidentes (RRCI)',
      destinatarios: 'Entidades financieras, PSP e infraestructuras del mercado financiero',
      texto: 'Lineamientos para la Respuesta y Recuperación ante Ciberincidentes (RRCI) · Sección 3',
      resumen: 'Hace obligatoria la notificación de ciberincidentes que afecten servicios a clientes o la confidencialidad, integridad o disponibilidad de la información, incluidos los originados en terceras partes.',
      claves: ['Críticos: afectan fondos de clientes o funciones de pago y compensación', 'Aviso inicial dentro de la primera hora', 'Reporte de cierre con causa raíz dentro de 5 días corridos', 'Deja sin efecto la Com. "B" 11847'],
      plazos: 'Vigencia 18/07/2025. PSP (excepto PSPCP): 60 días hábiles.',
      estado: 'Vigente',
      url: 'https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8280.pdf',
      enlaces: [
        { t: 'Comunicación A 8280 (PDF BCRA)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8280.pdf' },
        { t: 'Texto ordenado vigente: Lineamientos RRCI', url: 'https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-RRCI.pdf' },
        { t: 'Análisis: Abogados.com.ar', url: 'https://abogados.com.ar/el-bcra-refuerza-la-gestion-de-ciberincidentes-en-el-sistema-financiero/37178' }
      ]
    },
    {
      id: 'A7783', numero: 'A 7783', fecha: '2023-06-02', temas: ['tecnologia', 'fraude'],
      titulo: 'Servicios financieros digitales',
      destinatarios: 'Entidades financieras, cámaras compensadoras, redes de cajeros, PSP e infraestructuras del mercado financiero',
      texto: 'Requisitos mínimos de tecnología y seguridad de la información asociados a los servicios financieros digitales',
      resumen: 'Fija requisitos para homebanking, billeteras y demás canales digitales: autenticación multifactor en acciones críticas, cifrado, registro de operaciones, canales de atención 24 horas y monitoreo de fraude. Extiende el alcance a Interbanking, Coelsa, Link y Prisma.',
      claves: ['Doble factor para alta de factores de autenticación y de cuentas de terceros', 'Registro de transacciones en tiempo real, disponible 90 días', 'Monitoreo de ingeniería social y detección de fraude'],
      plazos: '180 días corridos desde su difusión. Productos nuevos: aviso 60 días antes.',
      estado: 'Vigente',
      url: 'https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A7783.pdf',
      enlaces: [
        { t: 'Comunicación A 7783 (PDF BCRA)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A7783.pdf' },
        { t: 'Texto ordenado vigente: Requisitos mínimos de tecnología y seguridad de la información (al 13/02/2026)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-rmgcti.pdf' }
      ]
    },
    {
      id: 'A7724', numero: 'A 7724', fecha: '2023-03-10', temas: ['tecnologia', 'terceros', 'operacional'],
      titulo: 'Requisitos mínimos de tecnología y seguridad de la información',
      destinatarios: 'Entidades financieras (luego PSP por A 8398)',
      texto: 'Requisitos Mínimos para la Gestión y Control de los Riesgos de Tecnología y Seguridad de la Información (texto ordenado A 7777)',
      resumen: 'Marco central de riesgo tecnológico: gobierno, gestión de riesgos, gestión de TI, seguridad de la información, continuidad, infraestructura, ciberincidentes, software, terceras partes y canales electrónicos.',
      claves: ['Comité de gobierno de tecnología y seguridad', 'Evaluación de riesgos antes de nuevos productos y de delegar en terceros', 'Programa anual de ejercicios de continuidad', 'Registros de auditoría por al menos 6 años'],
      plazos: 'Texto ordenado vigente desde 06/09/2023 (A 7777).',
      estado: 'Vigente, modificada por A 7783, A 8398 y A 8401',
      url: 'https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A7777.pdf',
      enlaces: [
        { t: 'Texto ordenado inicial A 7777 (PDF BCRA)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A7777.pdf' },
        { t: 'Texto ordenado vigente: Requisitos mínimos de tecnología y seguridad de la información (al 13/02/2026)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-rmgcti.pdf' },
        { t: 'Análisis: Abogados.com.ar', url: 'https://abogados.com.ar/seguridad-informatica-comunicacion-a-7724-bcra/33748' }
      ]
    },
    {
      id: 'A7266', numero: 'A 7266', fecha: '2021-04-16', temas: ['tecnologia'],
      titulo: 'Lineamientos de respuesta y recuperación ante ciberincidentes (RRCI)',
      destinatarios: 'Entidades financieras, PSP con cuentas de pago e infraestructuras del mercado financiero',
      texto: 'Lineamientos para la Respuesta y Recuperación ante Ciberincidentes',
      resumen: 'Siete lineamientos basados en el FSB: gobierno, planificación y preparación, análisis, mitigación, restauración y recuperación, coordinación y comunicación, y mejora continua.',
      claves: ['Buenas prácticas proporcionales, con fundamentos documentados', 'Taxonomía para clasificar incidentes', 'Ejercicios, pruebas y simulacros'],
      plazos: 'Notificación obligatoria agregada por A 8280.',
      estado: 'Vigente, modificada por A 8280',
      url: 'https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-RRCI.pdf',
      enlaces: [
        { t: 'Texto ordenado vigente: Lineamientos RRCI', url: 'https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-RRCI.pdf' },
        { t: 'Comunicado BCRA (16/04/2021)', url: 'https://www.bcra.gob.ar/noticias/ciberincidentes-lineamientos-para-respuesta-y-recuperacion/' },
        { t: 'Análisis: Abogados.com.ar', url: 'https://abogados.com.ar/el-bcra-aprueba-lineamientos-para-ciberincidentes/28150' }
      ]
    },
    {
      id: 'A6354', numero: 'A 6354 y A 6375', fecha: '2017-11-03', temas: ['terceros', 'tecnologia'],
      titulo: 'Tercerización de servicios de tecnología informática',
      destinatarios: 'Entidades financieras',
      texto: 'Descentralización y tercerización de actividades · Delegación de actividades en terceros',
      resumen: 'Permite contratar con terceros, total o parcialmente, servicios de tecnología informática, con aviso previo a la SEFyC. Hoy estos aspectos se rigen por la Sección 2 de Expansión de Entidades Financieras y la A 8401.',
      claves: ['Aviso con 60 días corridos de anticipación', 'Servicios listados en los requisitos mínimos de tecnología'],
      plazos: '—',
      estado: 'Antecedente (actualizada por A 8401)',
      url: 'https://www.consejosalta.org.ar/wp-content/uploads/BCRA-6354.pdf',
      enlaces: [
        { t: 'Comunicación A 6354 (PDF)', url: 'https://www.consejosalta.org.ar/wp-content/uploads/BCRA-6354.pdf' },
        { t: 'Análisis: Marval', url: 'https://www.marval.com/publicacion/descentralizacion-y-tercerizacion-de-actividades-de-las-entidades-financieras-13094/' },
        { t: 'Texto ordenado vigente: Requisitos mínimos de tecnología y seguridad de la información (al 13/02/2026)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-rmgcti.pdf' }
      ]
    },
    {
      id: 'A5398', numero: 'A 5398', fecha: '2013-02-13', temas: ['operacional'],
      titulo: 'Lineamientos para la gestión de riesgos en las entidades financieras',
      destinatarios: 'Entidades financieras',
      texto: 'Lineamientos para la Gestión de Riesgos',
      resumen: 'Consolida en un texto ordenado los lineamientos de gestión de riesgos, entre ellos el de riesgo operacional. Es el texto que luego modifican A 8249, A 8315 y A 8471.',
      claves: ['Marco integral de gestión de riesgos', 'Base de la sección de riesgo operacional'],
      plazos: '—',
      estado: 'Texto ordenado vigente (con modificaciones)',
      url: 'https://www.argentina.gob.ar/normativa/nacional/norma-209180/texto',
      enlaces: [
        { t: 'Comunicación A 5398 (PDF BCRA)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A5398.pdf' },
        { t: 'Ficha en InfoLEG / Normativa nacional', url: 'https://www.argentina.gob.ar/normativa/nacional/norma-209180/texto' },
        { t: 'Texto ordenado vigente: Lineamientos para la gestión de riesgos (al 31/07/2026)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/texord/t-lingeef.pdf' }
      ]
    },
    {
      id: 'A4793', numero: 'A 4793', fecha: '2008-04-14', temas: ['operacional'],
      titulo: 'Lineamientos para la gestión del riesgo operacional',
      destinatarios: 'Entidades financieras',
      texto: 'Riesgo operacional (hoy Sección 6 de Lineamientos para la Gestión de Riesgos)',
      resumen: 'Define el riesgo operacional y la taxonomía de 7 tipos de eventos que usa este monitor para clasificar los hechos (fraude interno y externo, relaciones laborales, clientes y productos, daños a activos, fallas tecnológicas y ejecución de procesos).',
      claves: ['7 tipos de evento de pérdida', 'Base de datos de eventos de riesgo operacional'],
      plazos: '—',
      estado: 'Base de la taxonomía (texto actualizado por A 8249 y A 8315)',
      url: 'https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A4793.pdf',
      enlaces: [
        { t: 'Comunicación A 4793 (PDF BCRA)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A4793.pdf' },
        { t: 'Texto ordenado histórico de riesgo operacional (2008)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/texord/t-rieope.pdf' },
        { t: 'Texto ordenado vigente: Lineamientos para la gestión de riesgos (al 31/07/2026)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/texord/t-lingeef.pdf' }
      ]
    }
  ],
  comunicados: [
    { fecha: '2026-10-20', titulo: 'Alerta por llamadas que inventan un error en la cuenta para vaciarla', tema: 'fraude', fuente: 'Medio (TN, vía Central de Noticias Madariaga)',
      resumen: 'El BCRA advirtió sobre delincuentes que se hacen pasar por el Banco Central, bancos o billeteras y alegan una irregularidad en la cuenta.',
      url: 'https://www.centraldenoticiasmadariaga.com/2026/10/dicen-que-hubo-un-error-y-vacian-tu.html',
      enlaces: [{ t: 'Recomendaciones oficiales del BCRA para evitar estafas', url: 'https://www.bcra.gob.ar/noticias/recomendaciones-del-bcra-para-evitar-estafas-virtuales/' }] },
    { fecha: '2026-09-03', titulo: 'El BCRA profundiza la estrategia de prevención del fraude', tema: 'fraude', fuente: 'BCRA',
      resumen: 'Anuncia el perfil de riesgo de fraude por persona para monitoreo transaccional, alta de clientes y revisión KYC, con implementación gradual.',
      url: 'https://www.bcra.gob.ar/noticias/el-bcra-profundiza-la-estrategia-de-prevencion-del-fraude/',
      enlaces: [{ t: 'Comunicación A 8473 (PDF BCRA)', url: 'https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8473.pdf' }] },
    { fecha: '2026-08-05', titulo: 'Alerta por estafas que usan la imagen del BCRA y de sus autoridades', tema: 'fraude', fuente: 'Medio (El Economista)',
      resumen: 'Videos manipulados que promocionan inversiones falsas, pedidos de pagos anticipados y apps de acceso remoto para tomar control del dispositivo.',
      url: 'https://eleconomista.com.ar/economia/el-bcra-lanzo-una-alerta-urgente-una-estafa-usa-su-imagen-robar-datos-dinero-n97164',
      enlaces: [] },
    { fecha: '2025-08-06', titulo: 'Recomendaciones del BCRA para evitar estafas virtuales', tema: 'fraude', fuente: 'BCRA (actualizado 19/02/2026)',
      resumen: 'Pautas para clientes: no compartir datos ni códigos, verificar por canales oficiales, activar doble factor y denunciar ante la UFECI.',
      url: 'https://www.bcra.gob.ar/noticias/recomendaciones-del-bcra-para-evitar-estafas-virtuales/', enlaces: [] },
    { fecha: '2021-04-16', titulo: 'Ciberincidentes: lineamientos para respuesta y recuperación', tema: 'tecnologia', fuente: 'BCRA',
      resumen: 'Presentación de los lineamientos RRCI (Com. "A" 7266) para fortalecer la ciberresiliencia del sistema financiero.',
      url: 'https://www.bcra.gob.ar/noticias/ciberincidentes-lineamientos-para-respuesta-y-recuperacion/',
      enlaces: [{ t: 'Texto ordenado RRCI', url: 'https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-RRCI.pdf' }] }
  ],
  // Indicadores clave de riesgo (KRI) sugeridos por área. "monitor" indica si este sitio ya puede calcularlo.
  kri: [
    { tema: 'operacional', norma: 'A 4793 · A 8249', indicador: 'Eventos de riesgo operacional por tipo', formula: 'Eventos por tipo de la A 4793 en el período (aprobados y pendientes; sin rechazados)', fuente: 'Registro de eventos', monitor: 'eventos' },
    { tema: 'operacional', norma: 'A 4793', indicador: 'Pérdida valorizada por eventos', formula: 'Suma del monto en pesos de los eventos aprobados', fuente: 'Registro de eventos', monitor: 'perdida' },
    { tema: 'operacional', norma: 'A 8249 · A 8315', indicador: 'Ejercicios de continuidad cumplidos', formula: 'Ejercicios realizados / ejercicios planificados en el año', fuente: 'Área de continuidad', monitor: '' },
    { tema: 'fraude', norma: 'A 8471', indicador: 'Fraudes a clientes por canal', formula: 'Eventos de fraude por canal (homebanking, billetera, SIM, QR…), sin rechazados', fuente: 'Registro de eventos', monitor: 'fraude' },
    { tema: 'fraude', norma: 'A 8471 · Ley 24.240', indicador: 'Fallos y sanciones contra entidades', formula: 'Cantidad de fallos, condenas o multas por estafas a clientes', fuente: 'Monitor (candidatos)', monitor: 'judicial' },
    { tema: 'fraude', norma: 'A 8471', indicador: 'Recupero de montos defraudados', formula: 'Monto recuperado / monto defraudado', fuente: 'Base de denuncias de la entidad', monitor: '' },
    { tema: 'tecnologia', norma: 'A 7724 · KEV', indicador: 'Fallas explotadas en tecnología bancaria', formula: 'Vulnerabilidades con explotación activa en productos de uso bancario (VPN, firewalls, correo, virtualización)', fuente: 'Monitor (noticias)', monitor: 'kev' },
    { tema: 'tecnologia', norma: 'A 8280', indicador: 'Ciberincidentes notificados en plazo', formula: '% de incidentes críticos o importantes notificados dentro de la primera hora', fuente: 'Área de seguridad', monitor: '' },
    { tema: 'tecnologia', norma: 'A 7783', indicador: 'Disponibilidad de canales digitales', formula: 'Minutos de interrupción de homebanking y app por mes', fuente: 'Monitoreo de servicios', monitor: '' },
    { tema: 'terceros', norma: 'A 8401 · A 8280', indicador: 'Incidentes originados en proveedores', formula: 'Hechos relevados que afectan a proveedores tecnológicos o de servicios', fuente: 'Monitor (noticias)', monitor: 'terceros' },
    { tema: 'terceros', norma: 'A 8401', indicador: 'Servicios críticos notificados con 60 días', formula: 'Tercerizaciones críticas notificadas en plazo / total', fuente: 'Gestión de proveedores', monitor: '' },
    { tema: 'terceros', norma: 'A 8401', indicador: 'Proveedores críticos con plan de salida y auditoría', formula: '% de proveedores críticos con contrato completo, plan de finalización y auditoría anual', fuente: 'Gestión de proveedores', monitor: '' }
  ]
};
