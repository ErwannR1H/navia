
    // 10 Detailed realistic Computer Science & Systems Questions
    const tenDiagnosticQuestions = [
      {
        subject: "Bases de Datos",
        title: "¿Qué es una base de datos?",
        options: [
          "Un conjunto organizado de datos que permite almacenarlos, relacionarlos y consultarlos fácilmente.",
          "Un programa que sirve para diseñar formularios y mostrar reportes en pantalla.",
          "Una hoja de cálculo donde se guardan datos sin relaciones entre sí.",
          "Un sistema que almacena información digital, pero solo en archivos de texto plano."
        ]
      },
      {
        subject: "Matemática Discreta",
        title: "¿Cuál de las siguientes proposiciones lógicas define una implicación (condicional)?",
        options: [
          "Solo es falsa cuando el antecedente es verdadero y el consecuente es falso.",
          "Es verdadera solo si ambas proposiciones tienen el mismo valor de verdad.",
          "Es falsa únicamente cuando ambas proposiciones son falsas.",
          "Equivale siempre a la conjunción simultánea de dos premisas."
        ]
      },
      {
        subject: "Programación Orientada a Objetos",
        title: "¿Cuál es el principio de encapsulamiento en POO?",
        options: [
          "Ocultar el estado interno y los datos de un objeto protegiéndolos mediante métodos de acceso.",
          "Permitir la herencia múltiple directa de más de diez clases padres.",
          "Convertir automáticamente cualquier variable entera en texto.",
          "Garantizar que todo el código se compile dentro de un único archivo binario."
        ]
      },
      {
        subject: "Algoritmos y Estructuras de Datos",
        title: "¿Cuál es la complejidad temporal promedio del algoritmo de ordenamiento Quicksort?",
        options: [
          "O(n log n)",
          "O(n²)",
          "O(1)",
          "O(2ⁿ)"
        ]
      },
      {
        subject: "Gestión por Procesos",
        title: "En el estándar BPMN (Business Process Model and Notation), ¿qué representa un rombo?",
        options: [
          "Una compuerta (Gateway) de decisión o bifurcación en el flujo del proceso.",
          "Un evento de inicio que detona una transacción financiera.",
          "Una tarea manual ejecutada por un operador externo.",
          "Un repositorio físico de almacenamiento de base de datos."
        ]
      },
      {
        subject: "Redes de Computadoras",
        title: "¿En qué capa del modelo OSI opera el protocolo IP?",
        options: [
          "Capa de Red (Network Layer - Capa 3)",
          "Capa de Enlace de Datos (Data Link - Capa 2)",
          "Capa de Transporte (Transport Layer - Capa 4)",
          "Capa de Aplicación (Application Layer - Capa 7)"
        ]
      },
      {
        subject: "Ingeniería de Software",
        title: "¿Qué caracteriza al marco de trabajo Scrum?",
        options: [
          "Ciclos iterativos cortos (Sprints) enfocados en entregar incrementos de valor frecuentes.",
          "Documentación rígida y secuencial sin posibilidad de cambios de alcance.",
          "Desarrollo exclusivo sin pruebas hasta finalizar el último módulo del sistema.",
          "Asignación permanente de un solo programador para todas las etapas del proyecto."
        ]
      },
      {
        subject: "Sistemas Operativos",
        title: "¿Qué es una condición de carrera (Race Condition)?",
        options: [
          "Cuando múltiples procesos acceden y manipulan datos compartidos concurrentemente y el resultado depende del orden de ejecución.",
          "La velocidad máxima a la que el procesador alcanza la frecuencia Boost.",
          "El tiempo que tarda el sistema operativo en cargar la memoria virtual desde el disco.",
          "Un error provocado exclusivamente por cortes de energía eléctrica en el servidor."
        ]
      },
      {
        subject: "Arquitectura de Software",
        title: "¿Cuál es la principal ventaja de una arquitectura basada en Microservicios?",
        options: [
          "Despliegues y escalabilidad independientes para cada servicio o dominio de negocio.",
          "Cero uso de peticiones de red para comunicación entre módulos.",
          "Uso obligatorio de una sola base de datos centralizada e inmutable.",
          "Eliminación por completo de la necesidad de balanceadores de carga."
        ]
      },
      {
        subject: "Seguridad de la Información",
        title: "¿Qué componente fundamental garantiza el principio de no repudio en criptografía?",
        options: [
          "El uso de firmas digitales respaldadas por criptografía asimétrica.",
          "El uso de contraseñas de cuatro dígitos almacenadas en texto plano.",
          "Ocultar las direcciones IP locales de los usuarios en la intranet.",
          "El reinicio periódico del cortafuegos de hardware."
        ]
      }
    ];

    // ========================================================================
    // NAVIA: DATOS DE MALLAS EJEMPLARES USIL + PERFIL DEL ALUMNO
    // ========================================================================
    const usilCurriculums = {
      "Ingeniería de Sistemas de Información": [
        ["Fundamentos de Programación", "Fundamentos en Competencias Digitales", "Matemática", "Lenguaje y Comunicación I", "Realidad Nacional y Globalización", "English I"],
        ["Programación Orientada a Objetos I", "Matemática Discreta", "Cálculo de una Variable", "Administración para los Negocios", "Lenguaje y Comunicación II", "English II"],
        ["Programación y Estructuras de Datos", "Gestión de Procesos", "Álgebra Lineal Computacional", "Electricidad y Ondas", "Principios de Economía", "English III"],
        ["Análisis y Diseño de Sistemas I", "Estadística Descriptiva e Inferencia Estadística", "Gerenciamiento de Datos I", "Arquitectura de Computadoras", "Fundamentos Contables y Financieros", "English IV"],
        ["Programación Orientada a Objetos II", "Arquitectura Empresarial", "Gerenciamiento de Datos II", "Interacción Humano Computador", "Ética y Ciudadanía", "Marketing"],
        ["Análisis y Diseño de Sistemas II", "Gobierno de TI", "Gobierno de Datos", "Sistemas Operativos", "Metodología de la Investigación Científica", "Electivo 1"],
        ["Desarrollo basado en Plataformas", "Gestión de Sistemas de Información", "Gestión del Conocimiento", "Redes y Telecomunicaciones I", "Fundamentos del Liderazgo Sostenible", "Electivo 2"],
        ["Agentes Inteligentes", "Seguridad de la Información", "Gestión de Proyectos para Computación", "Cloud Computing", "Oportunidades de Negocios", "Electivo 3"],
        ["Internet of Things", "Visualización de Datos", "Proyecto para Computación I", "Tecnologías Emergentes", "Computación en la Sociedad", "Electivo 4"],
        ["Big Data y Analítica de Datos", "Estrategias de Sistemas de Información", "Proyecto para Computación II", "Emprendimiento e Innovación Tecnológica", "Desarrollo de Negocios Electrónicos", "Electivo 5"]
      ],
      "Ingeniería de Software": [
        ["Fundamentos de Programación", "Fundamentos en Competencias Digitales", "Matemática", "Lenguaje y Comunicación I", "Realidad Nacional y Globalización", "English I"],
        ["Programación Orientada a Objetos I", "Matemática Discreta", "Cálculo de Una Variable", "Lenguaje y Comunicación II", "Administración para los Negocios", "English II"],
        ["Programación y Estructuras de Datos", "Ingeniería de Software I", "Álgebra Lineal Computacional", "Teoría de Computación", "Principios de Economía", "English III"],
        ["Estructuras de Datos Avanzada", "Estadística Descriptiva e Inferencia Estadística", "Gerenciamiento de Datos I", "Experiencia de Usuario (UX)", "Fundamentos Contables y Financieros", "English IV"],
        ["Programación Orientada a Objetos II", "Ingeniería de Software II", "Gerenciamiento de Datos II", "Interacción Humano Computador", "Ética y Ciudadanía", "Marketing"],
        ["Ingeniería de Software III", "Programación Competitiva", "Análisis y Diseño de Algoritmos", "Sistemas Operativos", "Metodología de la Investigación Científica", "Electivo 1"],
        ["Desarrollo Basado en Plataformas", "Gestión de Sistemas de Información", "Compiladores", "Redes y Telecomunicaciones I", "Fundamentos del Liderazgo Sostenible", "Electivo 2"],
        ["Agentes Inteligentes", "Seguridad de la Información", "Gestión de Proyectos para Computación", "Cloud Computing", "Oportunidades de Negocios", "Electivo 3"],
        ["Internet of Things", "Visualización de Datos", "Proyecto para Computación I", "Tecnologías Emergentes", "Computación en la Sociedad", "Electivo 4"],
        ["Big Data y Analítica de Datos", "Estrategias de Sistemas de Información", "Proyecto para Computación II", "Emprendimiento e Innovación Tecnológica", "Desarrollo de Negocios Electrónicos", "Electivo 5"]
      ],
      "Administración en Turismo": [
        ["Desarrollo Humano", "English I", "Fundamentos de la Industria de la Hospitalidad", "Lenguaje I", "Matemática", "Teoría del Turismo y Ocio"],
        ["Administración para los Negocios", "Análisis Histórico-Social del Perú", "Contabilidad General", "English II", "Geografía Turística y Territorio", "Lenguaje II"],
        ["English III", "Estadística General", "Gestión del Patrimonio Cultural", "Marketing", "Patrimonio Natural y Turismo", "Realidad Nacional y Globalización"],
        ["Economía General", "English IV", "Gestión Sostenible del Turismo", "Metodología de la Investigación", "Sociedad, Estado y Empresa", "Turismo Cultural y Patrimonial"],
        ["English V", "Ética y Ciudadanía", "Finanzas Empresariales", "Gestión de Servicios Turísticos", "Gestión Empresarial e Intermediación Turística", "Gestión Pública en Turismo"],
        ["Análisis Gerencial de la Información Financiera", "Desarrollo de Productos Turísticos", "English VI: RREL", "Investigación y Análisis de Mercado", "Legislación Turística, Hotelera y de la Gastronomía", "Mercado Turístico"],
        ["Administración del Talento humano", "Creatividad e Innovación: Design Thinking", "Economía del Turismo", "Gestión y Evaluación Ambiental", "Operaciones en Turismo", "Planificación Turística"],
        ["Cooperación Internacional en Turismo", "Dirección de Marketing en Turismo", "Evaluación de Proyectos", "Gestión Social de Proyectos", "Planeamiento Estratégico", "Turismo Gastronómico Sostenible"],
        ["Consultoría Turística", "Seminario I", "Electivo I", "Electivo II"],
        ["Proyecto Integrador", "Seminario II", "Electivo III", "Electivo IV"]
      ],
      "Arquitectura, Urbanismo y Territorio": [
        ["English I", "Matemática", "Lenguaje y Comunicación I", "Fundamentos en Competencias Digitales", "Expresión Gráfica Analógica 1", "Taller de Diseño I: Elementos"],
        ["English II", "Realidad Nacional y Globalización", "Lenguaje y Comunicación II", "Territorio y Hábitat Sostenible", "Expresión Gráfica Analógica 2", "Taller de Diseño II: Elementos"],
        ["English III", "Ética y Ciudadanía", "Administración para los Negocios", "Procesos de la Arquitectura 1", "Expresión Gráfica Analógica 3", "Taller de Diseño III: Sistemas"],
        ["English IV", "Fundamentos del Liderazgo Sostenible", "Principios de Economía", "Procesos de la Arquitectura 2", "Construcción 1", "Taller de Diseño IV: Espacios Urbanos y Territoriales"],
        ["Estadística Descriptiva e Inferencia Estadística", "Fundamentos Contables y Financieros", "Marketing", "Expresión Gráfica Digital 1", "Construcción 2", "Taller de Diseño V: Ciudades"],
        ["Metodología de la Investigación Científica", "Oportunidades de Negocios", "Sist. Inf. Geografía y Topografía", "Expresión Gráfica Digital 2", "Estructuras 1", "Taller de Diseño VI: Urbanismo"],
        ["Normatividad y Gestión", "Urban Historical Processes", "Sociedad, Ciudad y Territorio I", "Procesos de la Arquitectura Peruana", "Estructuras 2", "Taller de Diseño VII: Territorios"],
        ["Electivo 1", "Diseño Urbano", "Sociedad, Ciudad y Territorio II", "Arquitectura y Medioambiente", "Gestión en la Construcción", "Taller de Diseño VIII: Infraestructura"],
        ["Electivo 2", "Electivo 3", "Megaproyectos", "Sostenibilidad y Vivienda Social", "Seminario de Investigación y Tesis", "Taller de Diseño IX: Proyecto de Tesis"],
        ["Electivo 4", "Electivo 5", "Visión Geopolítica", "Seminario de Sostenibilidad Urbana", "Real Estate Marketing", "Proyecto Integrador"]
      ],
      "Comunicaciones": [
        ["Desarrollo Humano", "English I", "Fundamentos de Matemática", "Introducción a las Comunicaciones", "Lenguaje I"],
        ["Administración para los Negocios", "English II", "Estadística General", "Lenguaje II", "Taller de Comunicación Visual"],
        ["Comunicación Escrita I", "English III", "Historia de la Comunicación", "Marketing", "Metodología de la Investigación", "Realidad Nacional y Globalización"],
        ["Comunicación Escrita II", "English IV", "Principios de Economía", "Sociedad, Estado y Empresa", "Teoría de la Comunicación"],
        ["English V", "Ética y Ciudadanía", "Fotografía", "Fundamentos de las Finanzas", "Fundamentos del Periodismo"],
        ["Comunicación Audiovisual", "Comunicación Digital", "Comunicación Empresarial", "English VI: RREL", "Fundamentos de la Publicidad"],
        ["Comunicación Gráfica", "Comunicación Intercultural", "Psicología de la Comunicación", "Electivo 1", "Electivo 2"],
        ["Investigación de Públicos", "Sociología de la Comunicación", "Taller de Radio", "Electivo 3", "Electivo 4"],
        ["Comunicación y Globalización", "Investigación en Comunicación I", "Semiótica", "Electivo 5", "Electivo 6"],
        ["Comunicación Política", "Ética y Comunicación", "Investigación en Comunicación II", "Electivo 7", "Electivo 8"]
      ],
      "Administración de Empresas": [
        ["Comunicación Oral y Escrita", "Realidad Nacional", "English I", "Introducción Empresarial", "Matemática Básica"],
        ["Matemática Aplicada a los Negocios", "Tópicos Generales de la Ciencia de la Computación", "English II", "Filosofía y Ética"],
        ["English III", "Estadística Descriptiva e Inferencial", "Liderazgo y Sostenibilidad", "Introducción al Marketing", "Principios de Administración"],
        ["Metodología de la Investigación", "English IV", "Economía Básica", "Diseño de Procesos Organizacionales"],
        ["Contabilidad General", "Investigación de Mercados", "Habilidades Gerenciales", "Microeconomía"],
        ["Derecho Empresarial y Sociedades", "Comportamiento Organizacional", "Análisis e Interpretación de Estados Financieros", "Administración de Recursos Humanos"],
        ["Contabilidad de Costos", "Finanzas", "Gerencia de Operaciones y Logística", "Electivo I"],
        ["Contabilidad Gerencial", "Planeamiento Estratégico", "Derecho Tributario y Laboral", "Electivo II"],
        ["Evaluación de Proyectos", "Seminario de Tesis I", "Gerencia Estratégica", "Electivo III"],
        ["Proyecto Integrador", "Sistemas Integrados de Información Gerencial", "Seminario de Tesis II", "Electivo IV"]
      ],
      "Medicina Humana": [
        ["Atención Integral", "Desarrollo Humano", "English I", "Fundamentos de la Promoción de Salud", "Integración de Estructura y Función del Organismo Humano", "Lenguaje I"],
        ["English II", "Integración Morfofuncional del Sistema Nervioso", "Lenguaje II", "Pensamiento Matemático", "Práctica y Profesionalismo Médico I", "Proceso Químico-Biológicos y Nutrición"],
        ["Bioestadística", "English III", "Bioquímica y Biología Molecular", "Integración Morfofuncional del Sistema Cardio-Circulatorio", "Integración Morfofuncional del Sistema Respiratorio", "Nutrición y Estilos de Vida Saludable", "Práctica y Profesionalismo Médico II"],
        ["English IV", "Genética y Enfermedad", "Integración Morfofuncional del Sistema Digestivo", "Integración Morfofuncional del Sistema Excretor", "Mecanismos de Infección y Defensa", "Metodología de la Investigación", "Práctica y Profesionalismo Médico III"],
        ["English V", "Epidemiología", "Integración Morfofuncional del Sistema Endocrino y Reproductor", "Integración Morfofuncional del Sistema Hematopoyético", "Métodos Estadísticos en Biociencias", "Microbiología y Parasitología", "Práctica y Profesionalismo Médico IV"],
        ["English VI: PRE-IELTS", "Ética y Ciudadanía", "Farmacología", "Integración Fisiopatológica", "Introducción a la Clínica e Interpretación de Exámenes Auxiliares", "Salud Pública"],
        ["Diagnóstico Comunitario", "Especialidades I", "Principios de Nutrición Clínica y Funcional", "Principios de Introducción a la Medicina P4", "Realidad Nacional y Globalización", "Terapéutica Integrada"],
        ["Especialidades II", "Geriatría", "Medicina Física y del Deporte", "Nutrición Funcional Aplicada a Especialidades Clínicas y Sistemas", "Salud Mental y Psiquiatría", "Electivo 1"],
        ["Aplicación Clínica de la Medicina P4", "Cirugía y Traumatología", "Gestión en Salud", "Salud Global y Sistemas de Salud", "Oncología Médica", "Tesis I"],
        ["Aspectos Legales de la Práctica Médica y Patología Forense", "Emergencias y Desastres", "Ginecología y Obstetricia", "Liderazgo, Innovación y Emprendimiento en Salud", "Pediatría", "Electivo 2"],
        ["Externado en Medicina", "Externado en Cirugía y Traumatología", "Tesis II", "Electivo 3", "Electivo 4"],
        ["Externado en Pediatría", "Externado en Gineco-obstetricia", "Bioética"],
        ["Internado en Pediatría", "Internado en Medicina"],
        ["Internado en Cirugía", "Internado en Ginecología y Obstetricia"]
      ],
      "Derecho": [
        ["Realidad Nacional y Globalización", "Lenguaje y Comunicación I", "Matemática", "Fundamentos en Competencias Digitales", "Imaginación del Futuro y Creatividad", "English I"],
        ["Lenguaje y Comunicación II", "English II", "Filosofía y Lógica", "Introducción al Derecho", "Derecho Constitucional"],
        ["Ética y Ciudadanía", "English III", "Teoría General del Derecho", "Derecho de Personas", "Derecho Penal I", "Derecho Procesal Constitucional"],
        ["Fundamentos del Liderazgo Sostenible", "Metodología de la Investigación Científica", "English IV", "Product Design in Legaltech", "Acto Jurídico y Obligaciones", "Derecho Penal II"],
        ["Filosofía del Derecho", "Derechos Reales", "Derecho de Contratos", "Derecho de Familia", "Derecho Administrativo I"],
        ["Argumentación Jurídica", "Derecho Administrativo II", "Derecho Procesal Civil", "Derecho Laboral Empresarial", "Derecho Corporativo I"],
        ["Derecho Tributario", "Derecho Corporativo II", "Bioderecho", "Responsabilidad Civil", "International Law"],
        ["Growth and Management for Startups", "Arbitraje", "Deontología Jurídica", "Seminario de Investigación I", "Anglo American Law and Case Analysis"],
        ["Derecho de la Competencia y del Consumidor", "Derecho Penal Económico", "Seminario de Investigación II", "Electivo 1", "Electivo 2"],
        ["Seminario de Investigación III", "Derecho Bancario y Financiero", "Electivo 3", "Electivo 4", "Electivo 5"]
      ],
      "Educación Inicial": [
        ["Desarrollo Humano", "English I", "Lenguaje I", "Matemática", "Administración para los Negocios"],
        ["Biología", "Cultura Política y Realidad de la Educación Peruana", "English II", "Lenguaje II", "Marketing", "Psicología General"],
        ["English III", "Estadística General", "Informática Aplicada a la Educación", "Interpretación de Textos", "Realidad Nacional y Globalización", "Teoría de la Educación"],
        ["Acompañamiento Temprano", "Alimentación y Nutrición", "English IV", "Metodología de la Investigación", "Principios de Economía"],
        ["English V", "Fundamentos de las Finanzas", "Estrategias de Enseñanza y Aprendizaje", "Psicología del Infante", "Psicomotricidad", "Ética y Ciudadanía"],
        ["Aprestamiento a la Lectoescritura", "Desarrollo de Habilidades Lingüísticas", "Diseño y Programación Curricular", "English VI: RREL", "Psicología del Aprendizaje", "Software Educativo"],
        ["Desarrollo de la Expresión Gráfico-Plástica", "Estrategias de Evaluación de los Aprendizajes", "Investigación Educacional", "Literatura para Niños", "Proyecto Integrador", "Introducción a la Psicomotricidad", "Introducción a la Estimulación Temprana"],
        ["Desarrollo de la Educación Musical", "Didáctica para Lógico Matemático", "Diseño de Instrumentos de Evaluación", "Organización de la Información", "Práctica Preprofesional Inicial", "Desarrollo Psico. del Niño de 3 a 5 años", "Desarrollo de la Estimulación Temprana"],
        ["Didáctica para Ciencia y Ambiente", "Didáctica para Personal Social", "Planificación de Clases y Actividades", "Práctica Preprofesional Intermedia", "Sistematización de la Información", "Diseño de Sesiones de Psicomotricidad", "Diseño de Sesiones de Estimulación Temprana"],
        ["Coaching Educativo", "Gerencia y Legislación en Instituciones Educativas", "Informe y Sustentación del Proyecto de Investigación", "Práctica Preprofesional Intensiva", "Títeres y Libretos", "Desarrollo de Actividades de Psicomotricidad", "Desarrollo de Actividades de Estimulación Temprana"]
      ]
    };

    