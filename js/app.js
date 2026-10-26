function naviaIcon(name, className = 'nv-icon') {
      return `<svg class="${className}" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#nv-icon-${name}"/></svg>`;
    }

function getCareerMaxCycles(career) {
      return (usilCurriculums[career] || []).length || 10;
    }

    let studentProfile = {
      name: '',
      code: '',
      email: '',
      career: '',
      cycle: '',
      goal: 'Ninguno'
    };
    let profileCompleted = false;

    function updateNavigationAccess() {
      document.querySelectorAll('.nav-tab[data-view="4"], .nav-tab[data-view="14"]').forEach(tab => {
        const isLocked = !profileCompleted;
        const tooltip = 'Completa tu perfil para acceder a esta página.';
        tab.setAttribute('aria-disabled', String(isLocked));
        tab.setAttribute('aria-label', isLocked ? `${tab.textContent.trim()}. ${tooltip}` : tab.textContent.trim());
        tab.title = isLocked ? tooltip : '';
      });
    }

    function updateProfileScreenState() {
      const canReturnToHome = !profileCompleted;
      document.getElementById('profileBackButton').classList.toggle('hidden', !canReturnToHome);
      document.getElementById('profileReadyStep').classList.toggle('hidden', !canReturnToHome);
      const progress = document.getElementById('profileProgress');
      progress.classList.toggle('max-w-md', canReturnToHome);
      progress.classList.toggle('max-w-xs', !canReturnToHome);
    }

    const USIL_EMAIL_RE = /^[a-z0-9ñáéíóúü_-]+(\.[a-z0-9ñáéíóúü_-]+)+@usil\.pe$/i;

    function openMicrosoftLogin() {
      const modal = document.getElementById('microsoftLoginModal');
      modal.classList.remove('hidden'); modal.classList.add('flex');
      document.getElementById('microsoftEmail').value = '';
      document.getElementById('microsoftPassword').value = '';
      msClearError(); msShowStep(1);
    }
    function msShowStep(n) {
      document.getElementById('msStep1').classList.toggle('hidden', n !== 1);
      document.getElementById('msStep2').classList.toggle('hidden', n !== 2);
      setTimeout(() => document.getElementById(n === 1 ? 'microsoftEmail' : 'microsoftPassword')?.focus(), 50);
    }
    function msClearError() {
      ['microsoftEmail', 'microsoftPassword'].forEach(clearMicrosoftFieldError);
    }

    function clearMicrosoftFieldError(inputId) {
      clearFieldError(inputId);
      if (inputId === 'microsoftEmail') document.getElementById('msEmailHint').classList.remove('hidden');
    }

    function clearFieldError(inputId) {
      const input = document.getElementById(inputId);
      const error = document.getElementById(`${inputId}-error`);
      if (!input || !error) return;
      input.classList.remove('input-erreur');
      input.removeAttribute('aria-invalid');
      const describedBy = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== error.id);
      if (inputId === 'microsoftEmail' && !describedBy.includes('msEmailHint')) describedBy.push('msEmailHint');
      if (describedBy.length) input.setAttribute('aria-describedby', describedBy.join(' '));
      else input.removeAttribute('aria-describedby');
      error.textContent = '';
      error.classList.add('hidden');
    }

    const errorInputListeners = new WeakSet();
    function showError(inputId, message) {
      const input = document.getElementById(inputId);
      const error = document.getElementById(`${inputId}-error`);
      const container = document.getElementById('toast-container');

      error.textContent = message;
      error.classList.remove('hidden');
      input.classList.add('input-erreur');
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', error.id);
      if (inputId === 'microsoftEmail') document.getElementById('msEmailHint').classList.add('hidden');

      if (!errorInputListeners.has(input)) {
        ['input', 'change'].forEach(eventName => input.addEventListener(eventName, () => clearFieldError(inputId)));
        errorInputListeners.add(input);
      }

      const toast = document.createElement('div');
      toast.className = 'toast-erreur';
      toast.textContent = message;
      container.replaceChildren(toast);
      requestAnimationFrame(() => toast.classList.add('visible'));
      setTimeout(() => toast.remove(), 5000);
    }

    ['microsoftEmail', 'microsoftPassword'].forEach(inputId => {
      document.getElementById(inputId).addEventListener('input', () => clearMicrosoftFieldError(inputId));
    });

    function isValidUsilEmail(v) { return USIL_EMAIL_RE.test((v || '').trim()); }
    function msNext() {
      const email = document.getElementById('microsoftEmail').value.trim().toLowerCase();
      if (!email) { showError('microsoftEmail', 'Escribe tu correo institucional.'); return; }
      if (!email.endsWith('@usil.pe')) { showError('microsoftEmail', 'Solo se aceptan correos institucionales que terminen en @usil.pe.'); return; }
      if (!isValidUsilEmail(email)) { showError('microsoftEmail', 'Usa el formato nombre.apellido@usil.pe (por ejemplo, ana.perez@usil.pe).'); return; }
      document.getElementById('microsoftEmail').value = email;
      document.getElementById('msEmailShown').textContent = email;
      msShowStep(2);
    }
    function msBack() { msClearError(); msShowStep(1); }
    function msTogglePass() {
      const f = document.getElementById('microsoftPassword'), b = document.getElementById('msPassToggle');
      f.type = f.type === 'password' ? 'text' : 'password';
      b.textContent = f.type === 'password' ? 'Mostrar' : 'Ocultar'; b.setAttribute('aria-pressed', String(f.type !== 'password'));
    }
    function closeMicrosoftLogin() {
      const modal = document.getElementById('microsoftLoginModal');
      modal.classList.add('hidden'); modal.classList.remove('flex');
    }
    function suggestNameFromEmail(email) {
      const local = email.split('@')[0].replace(/\d+/g, '');
      return local.split(/[._-]+/).filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
    function continueMicrosoftLogin() {
      const email = document.getElementById('microsoftEmail').value.trim().toLowerCase();
      const password = document.getElementById('microsoftPassword').value;
      if (!isValidUsilEmail(email)) { msShowStep(1); showError('microsoftEmail', 'Usa el formato nombre.apellido@usil.pe.'); return; }
      if (!password) { showError('microsoftPassword', 'Escribe tu contraseña.'); return; }
      studentProfile.email = email;
      document.getElementById('studentEmailLabel').textContent = email;
      document.getElementById('microsoftAccountBadge').classList.remove('hidden');
      // No se autocompletan datos del alumno; el nombre del correo solo se usa como ejemplo en el placeholder.
      document.getElementById('studentName').value = '';
      document.getElementById('studentName').placeholder = 'Ej. ' + suggestNameFromEmail(email);
      document.getElementById('studentCode').value = '';
      clearCodeError();
      document.getElementById('userCareer').value = '';
      document.getElementById('userCurrentCycle').value = '';
      closeMicrosoftLogin();
      showToast('Acceso institucional simulado correctamente');
      goToScreen(2);
    }

    function handleMicrosoftLogin() { openMicrosoftLogin(); }

    const STUDENT_CODE_RE = /^01\d{7}$/;
    function clearCodeError() { clearFieldError('studentCode'); }
    function onStudentCodeInput(el) {
      el.value = el.value.replace(/\D/g, '').slice(0, 9);
      clearCodeError();
    }
    function validateStudentCode() {
      const v = document.getElementById('studentCode').value.trim();
      if (!v) return true;
      if (STUDENT_CODE_RE.test(v)) return true;
      showError('studentCode', 'Si lo agregas, el código debe tener exactamente 9 dígitos y empezar con 01.');
      return false;
    }


    const GOAL_TEXT = {
      'Ninguno': 'Tu malla y tu carga académica no cambian; solo añadimos recomendaciones a tu orientación.',
      'Postgrado': 'Navia te mostrará consejos para fortalecer tu promedio y perfil de cara a una maestría. Tu ruta de cursos no se modifica.',
      'Doble grado': 'Navia te sugerirá cursos afines que podrían convalidarse en una segunda carrera. Tu ruta actual no se bloquea ni se altera.'
    };
    function onGoalChange() {
      const g = (document.querySelector('input[name="userGoal"]:checked') || {}).value || 'Ninguno';

    }

    function previewSelectedCareer() {
      const career = document.getElementById('userCareer').value;
      const preview = document.getElementById('careerPreviewText');
      const cycleSelect = document.getElementById('userCurrentCycle');
      const previousCycle = cycleSelect.value;
      const maxCycles = getCareerMaxCycles(career);
      cycleSelect.innerHTML = '<option value="" selected disabled>Selecciona tu ciclo</option>' +
        Array.from({ length: maxCycles }, (_, i) => `<option value="${i + 1}">${i + 1}.° ciclo</option>`).join('');
      if (previousCycle && Number(previousCycle) <= maxCycles) cycleSelect.value = previousCycle;
      preview.textContent = career ? `${career} · ${maxCycles} ciclos · malla cargada con los cursos proporcionados.` : 'Selecciona una carrera para cargar su malla.';
    }

    function saveStudentProfile() {
      const name = document.getElementById('studentName').value.trim();
      const code = document.getElementById('studentCode').value.trim();
      const career = document.getElementById('userCareer').value;
      const cycle = document.getElementById('userCurrentCycle').value;
      const goalEl = document.querySelector('input[name="userGoal"]:checked');
      const goal = goalEl ? goalEl.value : 'Ninguno';

      if (!name) { showError('studentName', 'Escribe tu nombre completo.'); return; }
      if (!career) { showError('userCareer', 'Selecciona tu carrera.'); return; }
      if (!cycle) { showError('userCurrentCycle', 'Selecciona tu ciclo actual.'); return; }
      if (!validateStudentCode()) return;

      studentProfile = { ...studentProfile, name, code, career, cycle, goal };
      profileCompleted = true;
      updateNavigationAccess();
      renderDynamicCurriculum();
      updateDashboardFromProfile();
      showToast(`Malla de ${career} cargada para ${name}`);
      goToScreen(3);
    }

    function renderDynamicCurriculum() {
      const grid = document.getElementById('dynamicCurriculumGrid');
      if (!grid) return;
      const curriculum = usilCurriculums[studentProfile.career] || usilCurriculums['Ingeniería de Sistemas de Información'];
      const prevApproved = new Set(Array.from(grid.querySelectorAll('.hist-check:checked')).map(cb => cb.dataset.course));
      grid.innerHTML = curriculum.map((courses, index) => `
        <div class="cycle-col bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div class="text-sm font-bold text-center py-2 ${index + 1 <= Number(studentProfile.cycle) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'} rounded-lg mb-2">${index + 1}.° Ciclo</div>
          <button type="button" class="cycle-toggle-button w-full mb-3 px-2 py-1.5 rounded border border-blue-600 text-blue-700 text-xs font-semibold hover:bg-blue-50" data-cycle="${index + 1}" onclick="toggleCycleCourses(${index + 1})">Marcar todos</button>
          <div class="cycle-course-list space-y-1.5">
            ${courses.map(course => `<label class="cycle-course-label flex items-start gap-1.5 cursor-pointer"><input type="checkbox" onchange="updateHistoryCounts()" class="hist-check mt-0.5 text-blue-600 rounded shrink-0" aria-label="Marcar ${course} en mi historial" data-cycle="${index + 1}" data-course="${course.replace(/"/g, '&quot;')}"><span class="cycle-course-name">${course}</span></label>`).join('')}
          </div>
        </div>`).join('');

      const total = curriculum.flat().length;
      document.querySelector('#screen-3 .text-slate-500.font-semibold')?.remove();
      const totalLabel = document.querySelector('#screen-3 #histCheckedCount')?.parentElement?.querySelector('div');
      if (totalLabel) totalLabel.innerHTML = `Cursos marcados<br>de ${total} en total`;
      document.getElementById('curriculumCareerTitle').textContent = studentProfile.career;
      document.getElementById('curriculumCycleBadge').textContent = `${studentProfile.cycle}.° ciclo actual`;
      (function(){ grid.querySelectorAll('.hist-check').forEach(cb => { if (prevApproved.has(cb.dataset.course)) cb.checked = true; }); })();
      updateHistoryCounts();
    }

    function toggleCycleCourses(cycle) {
      const checkboxes = Array.from(document.querySelectorAll(`.hist-check[data-cycle="${cycle}"]`));
      const shouldCheck = checkboxes.some(checkbox => !checkbox.checked);
      checkboxes.forEach(checkbox => { checkbox.checked = shouldCheck; });
      updateHistoryCounts();
    }

    function updateDashboardFromProfile() {
      const nameEl = document.getElementById('dashboardStudentName');
      const careerEl = document.getElementById('dashboardCareer');
      const cycleEl = document.getElementById('dashboardCycle');
      const headerName = document.getElementById('headerStudentName');
      const headerMeta = document.getElementById('headerStudentMeta');
      const headerInitials = document.getElementById('headerInitials');
      const safeName = studentProfile.name || 'Tu nombre';
      const safeCareer = studentProfile.career || 'Completa tu registro';
      const safeCycle = studentProfile.cycle ? `${studentProfile.cycle}.° ciclo` : 'Ciclo pendiente';
      if (nameEl) nameEl.textContent = safeName;
      if (careerEl) careerEl.textContent = safeCareer;
      if (cycleEl) cycleEl.textContent = safeCycle;
      const goalChip = document.getElementById('dashboardGoalChip');
      if (goalChip) { const g = studentProfile.goal || 'Ninguno'; goalChip.textContent = g === 'Ninguno' ? 'Ruta estándar' : (g === 'Postgrado' ? 'Objetivo: Postgrado' : 'Objetivo: Doble grado'); }
      if (headerName) headerName.textContent = studentProfile.name ? `${studentProfile.name} (USIL)` : 'Tu perfil';
      if (headerMeta) headerMeta.textContent = studentProfile.career ? `${safeCycle} • ${studentProfile.career.replace('Ingeniería de ','')}` : 'Completa tu registro';
      if (headerInitials) {
        const initials = studentProfile.name ? studentProfile.name.split(/\s+/).filter(Boolean).slice(0,2).map(n => n[0].toUpperCase()).join('') : 'NA';
        headerInitials.textContent = initials;
      }
    }

    // ========================================================================
    // NAVIA: RUTA DINÁMICA SEGÚN AVANCE, CARGA, CHECKS Y DIAGNÓSTICO
    // ========================================================================
    let selectedLoadCount = 0;
    let suggestedCourses = [];
    let selectedRouteCourses = [];
    let dynamicDiagnosticScore = null;
    let quizAnswers = [];

    const courseConcepts = {
      'Análisis y Diseño de Sistemas II': ['Analiza requisitos y diseña soluciones de sistemas conectando necesidades del negocio con una propuesta tecnológica.', 'Aplicado', 'Base para proyectos y gestión de sistemas'],
      'Gobierno de TI': ['Define cómo se dirige y controla la tecnología para alinear decisiones, riesgos y objetivos de la organización.', 'Estratégico', 'Gestión y toma de decisiones TI'],
      'Gobierno de Datos': ['Organiza políticas, responsabilidades y controles para asegurar que los datos sean confiables, seguros y útiles.', 'Estratégico', 'Calidad, seguridad y gestión de datos'],
      'Sistemas Operativos': ['Explica cómo un sistema operativo administra procesos, memoria, archivos y recursos de una computadora.', 'Técnico', 'Base para plataformas y rendimiento'],
      'Metodología de la Investigación Científica': ['Desarrolla habilidades para plantear problemas, buscar evidencia, analizar información y construir una investigación.', 'Teórico-aplicado', 'Proyectos e investigación'],
      'Ingeniería de Software III': ['Integra prácticas de ingeniería para planificar, construir, evaluar y mantener software de mayor complejidad.', 'Aplicado', 'Desarrollo profesional de software'],
      'Programación Competitiva': ['Fortalece algoritmos, estructuras de datos y resolución eficiente de problemas mediante ejercicios de programación.', 'Práctico', 'Algoritmos y resolución de problemas'],
      'Análisis y Diseño de Algoritmos': ['Estudia estrategias para diseñar algoritmos correctos y eficientes, comparando su complejidad y desempeño.', 'Técnico', 'Programación y optimización'],
      'Electivo 1': ['Curso de especialización elegido según la orientación académica y los intereses del estudiante.', 'Variable', 'Profundización de perfil'],
      'Desarrollo basado en Plataformas': ['Explora el desarrollo de soluciones considerando plataformas, servicios y entornos tecnológicos específicos.', 'Aplicado', 'Construcción de soluciones'],
      'Desarrollo Basado en Plataformas': ['Explora el desarrollo de soluciones considerando plataformas, servicios y entornos tecnológicos específicos.', 'Aplicado', 'Construcción de soluciones'],
      'Gestión de Sistemas de Información': ['Relaciona procesos, personas y tecnología para gestionar sistemas de información que apoyen a una organización.', 'Estratégico', 'Gestión de SI'],
      'Gestión del Conocimiento': ['Explica cómo una organización captura, comparte y utiliza conocimiento para mejorar sus decisiones y procesos.', 'Estratégico', 'Innovación y aprendizaje organizacional'],
      'Redes y Telecomunicaciones I': ['Introduce la comunicación entre dispositivos, redes, protocolos y fundamentos de conectividad.', 'Técnico', 'Infraestructura y conectividad'],
      'Fundamentos del Liderazgo Sostenible': ['Desarrolla habilidades para liderar equipos considerando colaboración, responsabilidad y sostenibilidad.', 'Humanístico', 'Trabajo en equipo y liderazgo'],
      'Electivo 2': ['Curso de especialización elegido para complementar el perfil profesional del estudiante.', 'Variable', 'Profundización de perfil'],
      'Agentes Inteligentes': ['Introduce sistemas capaces de percibir información, razonar y actuar para resolver problemas en distintos contextos.', 'Técnico', 'Inteligencia artificial'],
      'Seguridad de la Información': ['Aborda medidas para proteger información, sistemas y accesos frente a riesgos y amenazas.', 'Técnico', 'Protección de información'],
      'Gestión de Proyectos para Computación': ['Organiza alcance, tiempo, recursos y riesgos para planificar proyectos tecnológicos.', 'Aplicado', 'Gestión de proyectos'],
      'Cloud Computing': ['Explica el uso de recursos tecnológicos bajo demanda y los principales modelos de servicios en la nube.', 'Técnico', 'Arquitectura y servicios cloud'],
      'Oportunidades de Negocios': ['Identifica necesidades y oportunidades que pueden convertirse en propuestas de valor y soluciones de negocio.', 'Aplicado', 'Innovación y negocio'],
      'Electivo 3': ['Curso de especialización que permite orientar el perfil hacia un área tecnológica o de gestión.', 'Variable', 'Especialización'],
      'Internet of Things': ['Conecta dispositivos y sensores para recopilar, comunicar y utilizar datos en sistemas físicos y digitales.', 'Técnico', 'Sistemas conectados'],
      'Visualización de Datos': ['Transforma datos en representaciones visuales que facilitan descubrir patrones y comunicar información.', 'Aplicado', 'Análisis y comunicación de datos'],
      'Proyecto para Computación I': ['Integra conocimientos previos para plantear y desarrollar una solución tecnológica con alcance definido.', 'Proyecto', 'Integración de conocimientos'],
      'Tecnologías Emergentes': ['Analiza tecnologías nuevas y su posible impacto en productos, procesos y organizaciones.', 'Exploratorio', 'Innovación tecnológica'],
      'Computación en la Sociedad': ['Analiza el impacto de la computación en personas, organizaciones y sociedad desde una perspectiva responsable.', 'Humanístico', 'Impacto tecnológico'],
      'Electivo 4': ['Curso de especialización que complementa el perfil profesional según los intereses del estudiante.', 'Variable', 'Especialización'],
      'Big Data y Analítica de Datos': ['Trabaja con grandes volúmenes de datos y técnicas para obtener información útil para la toma de decisiones.', 'Técnico', 'Datos y analítica'],
      'Estrategias de Sistemas de Información': ['Relaciona tecnología y estrategia para orientar los sistemas de información hacia objetivos organizacionales.', 'Estratégico', 'Estrategia TI'],
      'Proyecto para Computación II': ['Consolida una solución tecnológica integrando planificación, desarrollo, evaluación y presentación de resultados.', 'Proyecto', 'Cierre de formación'],
      'Emprendimiento e Innovación Tecnológica': ['Convierte ideas tecnológicas en propuestas con valor, considerando validación, innovación y viabilidad.', 'Aplicado', 'Emprendimiento'],
      'Desarrollo de Negocios Electrónicos': ['Analiza cómo las tecnologías digitales apoyan modelos de negocio, canales y experiencias de clientes.', 'Aplicado', 'Negocios digitales'],
      'Electivo 5': ['Curso final de especialización para fortalecer el perfil profesional elegido.', 'Variable', 'Especialización']
    };

    function getCourseConceptBase(course) {
      if (courseConcepts[course]) return courseConcepts[course];
      const lower = course.toLowerCase();
      if (lower.includes('programación')) return ['Fortalece la construcción de programas mediante lógica, estructuras y buenas prácticas de desarrollo.', 'Práctico', 'Base para desarrollo de software'];
      if (lower.includes('datos')) return ['Desarrolla criterios para organizar, consultar o interpretar datos y convertirlos en información útil.', 'Aplicado', 'Gestión y análisis de datos'];
      if (lower.includes('matemática') || lower.includes('cálculo') || lower.includes('álgebra')) return ['Fortalece herramientas matemáticas para modelar problemas y resolver situaciones relacionadas con computación.', 'Teórico-aplicado', 'Base para cursos técnicos'];
      if (lower.includes('inglés')) return ['Desarrolla comprensión y comunicación en inglés aplicada a situaciones académicas y profesionales.', 'Práctico', 'Comunicación profesional'];
      return [`Desarrolla conocimientos fundamentales de ${course} y los conecta con situaciones académicas y profesionales de la carrera.`, 'Teórico-aplicado', 'Complementa tu formación profesional'];
    }


    const CT = {
      'fundamentos de programación':'Tu primer curso de programación: aprendes a pensar paso a paso, usar variables, condicionales y ciclos para resolver problemas con código.',
      'matemática':'Refuerza álgebra, funciones y razonamiento numérico, la base para los cursos de cálculo, estadística y computación.',
      'programación orientada a objetos i':'Aprendes a modelar problemas como objetos con atributos y comportamientos (clases, encapsulamiento, herencia básica) para escribir programas ordenados y reutilizables.',
      'matemática discreta':'Lógica, conjuntos, relaciones y grafos: las matemáticas que explican cómo funcionan los algoritmos, las bases de datos y la computación.',
      'cálculo de una variable':'Estudia cómo cambian las funciones (derivadas) y cómo acumular cantidades (integrales); sirve para modelar y optimizar fenómenos.',
      'administración para los negocios':'Introduce cómo se planifica, organiza y dirige una empresa, para que entiendas el negocio al que servirán tus sistemas.',
      'programación y estructuras de datos':'Aprendes a organizar la información con listas, pilas, colas y árboles, y a elegir la estructura que hace tu programa más rápido y ordenado.',
      'gestión de procesos':'Aprendes a describir, dibujar (BPMN) y mejorar los procesos de una organización, es decir, cómo se hace el trabajo paso a paso.',
      'álgebra lineal computacional':'Trabaja con vectores y matrices, herramientas clave para gráficos, análisis de datos e inteligencia artificial.',
      'electricidad y ondas':'Explica los fenómenos físicos detrás de los circuitos, la señal eléctrica y las ondas, base de los equipos y las redes.',
      'principios de economía':'Muestra cómo funcionan la oferta, la demanda y los costos, para entender el contexto económico de los proyectos de TI.',
      'análisis y diseño de sistemas i':'Aprendes a levantar requisitos con usuarios y a representar cómo debe funcionar un sistema (casos de uso, diagramas) antes de programarlo.',
      'estadística descriptiva e inferencia estadística':'Enseña a resumir datos y a sacar conclusiones confiables de una muestra; base para analítica y toma de decisiones.',
      'gerenciamiento de datos i':'Introducción a las bases de datos relacionales: diseñar tablas, relacionarlas y consultarlas con SQL.',
      'arquitectura de computadoras':'Explica cómo se organiza una computadora por dentro (procesador, memoria, entrada/salida) y cómo ejecuta instrucciones.',
      'fundamentos contables y financieros':'Aprendes a leer estados financieros y conceptos de costos e inversión, para evaluar si un proyecto es rentable.',
      'programación orientada a objetos ii':'Profundiza en POO: interfaces, polimorfismo, patrones de diseño y buenas prácticas para construir aplicaciones más grandes y mantenibles.',
      'arquitectura empresarial':'Visualiza a la organización como un todo (negocio, datos, aplicaciones y tecnología) para alinear los sistemas con la estrategia.',
      'gerenciamiento de datos ii':'Lleva SQL al siguiente nivel: optimización de consultas, transacciones, programación en base de datos y modelos no relacionales.',
      'interacción humano computador':'Aprendes a diseñar interfaces fáciles de usar, entendiendo a los usuarios y evaluando la usabilidad de un sistema.',
      'ética y ciudadanía':'Reflexiona sobre responsabilidad, valores y decisiones éticas en tu vida profesional y ciudadana.',
      'marketing':'Explica cómo se identifican necesidades del cliente y se comunica el valor de un producto o servicio.',
      'ingeniería de software i':'Introduce el ciclo de vida del software: requisitos, diseño, pruebas y metodologías de trabajo en equipo como Scrum.',
      'ingeniería de software ii':'Profundiza en arquitectura, patrones, pruebas y control de calidad para construir software confiable en equipo.',
      'ingeniería de software iii':'Integra todo lo aprendido para llevar un producto de software real a producción: calidad, despliegue continuo y mantenimiento.',
      'teoría de computación':'Estudia qué problemas puede resolver una computadora y con qué límites, usando autómatas y lenguajes formales.',
      'estructuras de datos avanzada':'Estructuras más potentes (árboles balanceados, grafos, tablas hash) para manejar grandes volúmenes de datos con eficiencia.',
      'experiencia de usuario (ux)':'Aprendes a investigar usuarios, prototipar y diseñar experiencias digitales pensadas para sus necesidades.',
      'sistemas operativos':'Descubres cómo el sistema operativo reparte procesador y memoria entre programas, administra archivos y evita conflictos entre procesos.',
      'gobierno de ti':'Cómo una organización decide, controla y mide su tecnología para que genere valor y riesgos aceptables (marcos como COBIT).',
      'gobierno de datos':'Define quién es responsable de los datos, con qué reglas y calidad se usan, y cómo se protegen y comparten dentro de una organización.',
      'análisis y diseño de sistemas ii':'Continúa el análisis con diseño detallado: modelos de datos, arquitectura de la solución y especificación lista para construir.',
      'metodología de la investigación científica':'Aprendes a formular una pregunta, buscar fuentes confiables, elegir un método y redactar una investigación (base de tu tesis).',
      'programación competitiva':'Entrenas resolviendo problemas algorítmicos con límites de tiempo, para pensar rápido y escribir código eficiente.',
      'análisis y diseño de algoritmos':'Aprendes a medir cuán eficiente es un algoritmo (notación O) y técnicas como divide y vencerás o programación dinámica.',
      'redes y telecomunicaciones i':'Cómo se comunican los dispositivos: modelo OSI/TCP-IP, direccionamiento IP, switches y routers.',
      'gestión de sistemas de información':'Cómo se planifican, operan y mejoran los sistemas que soportan las decisiones y operaciones de una organización.',
      'gestión del conocimiento':'Cómo una organización captura, comparte y aprovecha lo que sabe su gente para innovar y no perder experiencia.',
      'cloud computing':'Usar servidores, almacenamiento y servicios por internet bajo demanda (IaaS, PaaS, SaaS) en lugar de infraestructura propia.',
      'seguridad de la información':'Protege la confidencialidad, integridad y disponibilidad de la información: riesgos, controles, criptografía y buenas prácticas.',
      'gestión de proyectos para computación':'Planificar alcance, tiempos, costos y riesgos de un proyecto de TI y coordinar al equipo hasta entregarlo.',
      'agentes inteligentes':'Diseñas programas que perciben su entorno, toman decisiones y actúan para lograr un objetivo (base de la IA).',
      'internet of things':'Conecta objetos con sensores a internet para recolectar datos y automatizar acciones (casas, industria, ciudades inteligentes).',
      'visualización de datos':'Aprendes a convertir datos en gráficos y dashboards que cuenten una historia clara para decidir.',
      'big data y analítica de datos':'Técnicas y herramientas para procesar volúmenes masivos de datos y descubrir patrones que apoyen decisiones.'
    };
    // Preparación académica ampliada para cursos que no tienen una ficha o banco manual.
    // Las descripciones y preguntas generadas son material de estudio orientativo, no sumillas oficiales de USIL.
    function inferCourseFamily(course) {
      const n = course.toLowerCase();
      const career = (studentProfile && studentProfile.career || '').toLowerCase();
      if (/english|ingl[eé]s/.test(n)) return 'english';
      if (/matem|c[aá]lculo|[áa]lgebra|pensamiento matem|estad[ií]st|bioestad|financiera|contabilidad|contable|finanzas|econom[ií]a|microeconom|costos/.test(n)) return /contab|finanz|econom|costos|estados financieros/.test(n) ? 'business' : 'quantitative';
      if (/investigaci[oó]n|tesis|seminario/.test(n)) return 'research';
      if (/derecho|jur[ií]dic|legal|constitucional|penal|obligaciones|contratos|arbitraje|bioderecho|law|deontolog[ií]a|tributario|laboral|corporativo|procesal|argumentaci[oó]n|jurisprudencia|acto jur[ií]dico|real[e]?s/.test(n)) return 'law';
      if (/medicina|m[eé]dic|salud|cl[ií]nic|enfermedad|morfofuncional|organismo|bioqu[ií]m|biolog[ií]a|nutrici[oó]n|farmacolog|epidemiolog|microbiolog|parasitolog|gen[eé]tica|fisiopatolog|cirug[ií]a|pediatr|gineco|obstetric|geriatr|oncolog|psiquiatr|internado|externado|terap[eé]utica|diagn[oó]stico|patolog[ií]a|promoci[oó]n de salud|bio[eé]tica|emergencias/.test(n) || career.includes('medicina')) return 'medicine';
      if (/arquitect|diseño|dise[nñ]o|expresi[oó]n gr[aá]fica|construcci[oó]n|estructura|urban|territorio|territorial|ciudad|vivienda|topograf|geograf[ií]a|medioambiente|sostenibilidad|sostenible|megaproyecto|real estate|hábitat|habitat|procesos de la arquitectura/.test(n) || career.includes('arquitectura')) return 'architecture';
      if (/turismo|tur[ií]st|hospitalidad|ocio|patrimonio|destino|hotel|gastron|intermediaci[oó]n tur|operaciones en turismo|mercado tur|planificaci[oó]n tur|consultor[ií]a tur/.test(n) || career.includes('turismo')) return 'tourism';
      if (/comunicaci[oó]n|periodismo|fotograf[ií]a|publicidad|radio|audiovisual|semiótica|semi[oó]tica|p[uú]blicos|intercultural|comunicaci[oó]n visual|globalizaci[oó]n/.test(n) || career.includes('comunicaciones')) return 'communication';
      if (/educaci[oó]n|ense[nñ]anza|aprendizaje|psicolog[ií]a|infante|ni[nñ]o|niñez|ni[nñ]ez|lectoescritura|psicomotricidad|estimulaci[oó]n temprana|did[aá]ctica|curricular|preprofesional|t[ií]teres|libretos|instrumentos de evaluaci[oó]n|literatura para ni[nñ]os|ciencia y ambiente|personal social/.test(n) || career.includes('educación')) return 'education';
      if (/marketing|administraci[oó]n|negocio|empresarial|empresa|gerencia|gerencial|liderazgo|talento humano|recursos humanos|organizacional|planeamiento estrat[eé]gico|evaluaci[oó]n de proyectos|emprendimiento|innovaci[oó]n|operaciones|log[ií]stica|gesti[oó]n p[uú]blica|proyecto integrador|gesti[oó]n social|cooperaci[oó]n internacional/.test(n)) return 'business';
      if (/lenguaje|comunicaci[oó]n oral|comunicaci[oó]n escrita|interpretaci[oó]n de textos|filosof[ií]a|[eé]tica|realidad nacional|hist[oó]rico|sociedad|estado|ciudadan[ií]a|desarrollo humano|creatividad|futuro|competencias digitales|inform[aá]tica aplicada/.test(n)) return 'humanities';
      return 'professional';
    }
    const courseFamilyContent = {
      english: {desc:'Desarrolla comprensión lectora y auditiva, vocabulario, gramática y comunicación oral y escrita en inglés, con dificultad progresiva para contextos académicos y profesionales.', level:'Práctico', use:'Comunicación académica y profesional', qs:[['Which strategy best helps you understand an unfamiliar word in a reading?','Use the surrounding sentence and context clues.','Ignore the sentence and guess randomly.','Translate every word without reading the paragraph.','Choose the longest definition.'],['What makes a professional email effective?','A clear subject, polite tone, concise message and appropriate closing.','Writing the entire message in capital letters.','Leaving out the purpose of the message.','Using slang with every recipient.']]},
      quantitative: {desc:'Fortalece el razonamiento cuantitativo mediante la interpretación de datos, modelos, operaciones y procedimientos para resolver problemas de manera justificada.',level:'Teórico-aplicado',use:'Análisis cuantitativo y toma de decisiones',qs:[['Al resolver un problema cuantitativo, ¿qué conviene hacer antes de elegir una fórmula?','Identificar los datos, la incógnita y las condiciones del problema.','Elegir una fórmula al azar.','Redondear todos los datos sin revisar unidades.','Ignorar la información que no parece importante.'],['¿Qué permite comprobar una solución numérica?','Sustituir el resultado en las condiciones originales y revisar unidades y magnitud.','Cambiar los datos hasta obtener un resultado cómodo.','Usar siempre el número mayor.','Eliminar los pasos del procedimiento.']]},
      research: {desc:'Enseña a delimitar un problema, formular objetivos y preguntas, revisar fuentes confiables, elegir métodos de investigación, analizar evidencias y comunicar resultados con integridad académica.',level:'Teórico-aplicado',use:'Investigación, informes y tesis',qs:[['¿Qué característica debe tener una pregunta de investigación bien delimitada?','Debe ser clara, investigable y acotada a una población, fenómeno o contexto.','Debe incluir varias preguntas sin relación.','Debe anticipar como hecho el resultado esperado.','Debe evitar definir conceptos clave.'],['¿Para qué se citan las fuentes en un trabajo académico?','Para reconocer la autoría y permitir verificar la evidencia utilizada.','Para aumentar páginas sin aportar evidencia.','Para reemplazar el análisis propio.','Para ocultar de dónde procede una idea.']]},
      law: {desc:'Estudia conceptos, instituciones, normas y métodos de interpretación jurídica propios del área del curso, aplicándolos al análisis de casos, la argumentación y la solución fundamentada de controversias.',level:'Teórico-práctico',use:'Análisis de casos y argumentación jurídica',qs:[['Al analizar un caso jurídico, ¿cuál es el primer paso más sólido?','Precisar los hechos relevantes y la cuestión jurídica antes de aplicar normas.','Elegir una conclusión sin revisar los hechos.','Usar una norma sin comprobar su ámbito de aplicación.','Basarse únicamente en la opinión personal.'],['¿Qué fortalece una argumentación jurídica?','Relacionar normas aplicables, hechos probados e interpretación razonada.','Repetir la conclusión sin sustento.','Citar fuentes que no se relacionan con el caso.','Evitar responder a posibles objeciones.']]},
      medicine: {desc:'Integra conocimientos biomédicos, prevención, evaluación clínica y atención centrada en la persona según el área del curso. El aprendizaje debe relacionar mecanismos fisiológicos, signos, evidencia científica, seguridad y límites de actuación profesional.',level:'Teórico-práctico',use:'Razonamiento biomédico y atención segura',qs:[['Ante un caso clínico académico, ¿qué enfoque es más seguro para razonar una respuesta?','Integrar antecedentes, hallazgos, mecanismos fisiológicos y evidencia; reconocer cuándo se requiere supervisión clínica.','Concluir a partir de un solo dato aislado.','Indicar tratamiento sin valorar contraindicaciones.','Ignorar los signos de alarma.'],['¿Por qué es importante distinguir prevención, diagnóstico y tratamiento?','Porque son objetivos diferentes y requieren evaluación y decisiones apropiadas para cada etapa.','Porque significan exactamente lo mismo.','Porque la prevención solo se realiza después de tratar.','Porque el diagnóstico elimina la necesidad de evidencia.']]},
      architecture: {desc:'Desarrolla la lectura y representación del espacio, el diseño de soluciones arquitectónicas o territoriales y la evaluación de sus condiciones funcionales, técnicas, sociales y ambientales según el tema del curso.',level:'Teórico-práctico',use:'Diseño, representación y planificación del entorno',qs:[['Al iniciar una propuesta de diseño, ¿qué debe estudiarse antes de definir la solución?','Usuarios, necesidades, contexto, restricciones del lugar y criterios funcionales.','Solo el color de la fachada.','Únicamente una imagen de referencia.','La forma final sin analizar el uso.'],['¿Qué caracteriza una propuesta de diseño sostenible?','Considera el ciclo de vida, el uso de recursos, el contexto y el bienestar de las personas.','Maximiza materiales sin considerar su impacto.','Ignora el clima y la orientación.','Prioriza la apariencia aunque impida el uso seguro.']]},
      tourism: {desc:'Aborda la planificación y gestión de experiencias, servicios y destinos turísticos, considerando las necesidades del visitante, la calidad del servicio, el patrimonio, la viabilidad económica y la sostenibilidad según el área del curso.',level:'Aplicado',use:'Gestión y desarrollo responsable de servicios y destinos turísticos',qs:[['Al diseñar una experiencia turística sostenible, ¿qué decisión es más adecuada?','Involucrar a la comunidad, proteger el patrimonio y gestionar los impactos del visitante.','Aumentar visitantes sin evaluar la capacidad del destino.','Excluir a los residentes de las decisiones.','Promocionar recursos naturales sin plan de conservación.'],['¿Qué indicador ayuda a evaluar la calidad de un servicio turístico?','La satisfacción del visitante junto con indicadores operativos y de calidad.','Solo el tamaño del logotipo.','La cantidad de publicaciones sin medir resultados.','El número de folletos impresos sin conocer su uso.']]},
      communication: {desc:'Analiza cómo se producen, interpretan y difunden mensajes en distintos medios y contextos. Según el curso, trabaja escritura, narrativas, audiencias, lenguaje visual, producción mediática, investigación y responsabilidad comunicacional.',level:'Teórico-práctico',use:'Producción y análisis de mensajes para audiencias',qs:[['Antes de diseñar un mensaje para una campaña, ¿qué conviene definir?','La audiencia, el objetivo comunicacional, el contexto y el mensaje central.','Solo el color de fondo.','La cantidad de palabras sin conocer al público.','El canal más costoso sin evaluar su alcance.'],['¿Qué práctica fortalece la credibilidad de una pieza informativa?','Verificar fuentes, contrastar datos y distinguir hechos de opiniones.','Publicar una afirmación viral sin comprobarla.','Eliminar el contexto para hacerla más llamativa.','Usar una imagen como única prueba de cualquier afirmación.']]},
      education: {desc:'Estudia el desarrollo y aprendizaje de los estudiantes y el diseño de experiencias educativas adecuadas a sus necesidades. Puede incluir planificación, didáctica, evaluación, inclusión y reflexión sobre la práctica pedagógica.',level:'Teórico-práctico',use:'Diseño de experiencias de aprendizaje y evaluación',qs:[['¿Qué debería orientar la elección de una estrategia didáctica?','Los objetivos de aprendizaje, las características de los estudiantes y la evidencia de progreso.','La preferencia del docente sin considerar al grupo.','La cantidad de diapositivas.','Una única actividad para cualquier objetivo.'],['¿Para qué sirve la evaluación formativa?','Para identificar avances y dificultades y ajustar la enseñanza durante el aprendizaje.','Solo para asignar una nota al final.','Para reemplazar los objetivos de aprendizaje.','Para evitar retroalimentar al estudiante.']]},
      business: {desc:'Examina cómo se organizan y gestionan recursos, personas, operaciones, mercados y resultados para crear valor. Los contenidos concretos dependen del área del curso: estrategia, marketing, finanzas, contabilidad, liderazgo o gestión.',level:'Aplicado',use:'Gestión organizacional y decisiones basadas en evidencia',qs:[['Antes de implementar una decisión de gestión, ¿qué análisis resulta más útil?','Definir el objetivo, revisar datos y restricciones, comparar alternativas y evaluar riesgos.','Elegir la alternativa más popular sin analizarla.','Ignorar costos y necesidades de los clientes.','Medir el éxito solo por la rapidez de ejecución.'],['¿Qué hace útil a un indicador de gestión?','Mide un objetivo relevante, tiene una definición clara y permite comparar resultados en el tiempo.','Cambia de definición cada semana.','No se relaciona con ninguna meta.','No puede verificarse con datos.']]},
      humanities: {desc:'Fortalece la comunicación, el pensamiento crítico y la comprensión del contexto social, cultural y ético. El curso puede trabajar lectura, escritura, ciudadanía, creatividad, cultura o uso responsable de herramientas digitales.',level:'Teórico-aplicado',use:'Comunicación, pensamiento crítico y formación integral',qs:[['Al evaluar una afirmación sobre un tema social, ¿qué práctica favorece el pensamiento crítico?','Contrastar fuentes, distinguir hechos de opiniones y revisar el contexto.','Aceptar la primera publicación encontrada.','Compartirla porque coincide con una opinión propia.','Ignorar evidencia que contradiga la hipótesis.'],['¿Qué caracteriza una comunicación académica clara?','Organizar las ideas, usar evidencia pertinente y adaptar el lenguaje al propósito y al público.','Usar términos ambiguos sin explicarlos.','Mezclar conclusiones y ejemplos sin orden.','Evitar revisar el texto antes de entregarlo.']]},
      professional: {desc:'Introduce los fundamentos, métodos y vocabulario del área que indica el curso. Relaciona conceptos esenciales con ejemplos de aplicación, análisis de situaciones y criterios para justificar decisiones dentro de la carrera.',level:'Teórico-aplicado',use:'Fundamentos y aplicación profesional',qs:[['¿Cuál es una buena manera de demostrar comprensión de un concepto profesional?','Explicarlo con precisión y aplicarlo a un caso pertinente justificando la decisión.','Memorizar el nombre sin saber cuándo se utiliza.','Repetir una definición sin relacionarla con el caso.','Elegir una solución sin explicar sus razones.'],['Cuando una solución profesional no produce el resultado esperado, ¿qué conviene hacer?','Revisar supuestos y evidencias, identificar la causa y ajustar la solución de forma verificable.','Ocultar el resultado.','Repetir exactamente el mismo procedimiento sin analizarlo.','Cambiar varias cosas a la vez sin registrar resultados.']]}
    };
    function getPreparedQuestionBank(course) {
      const n = course.toLowerCase();
      const bankFor = (q1, q2) => [q1, q2];
      // Preguntas más concretas para las áreas recurrentes de las nuevas mallas.
      const detail =
        (/expresi[oó]n gr[aá]fica/.test(n) ? bankFor(['¿Qué permite una escala gráfica en un plano?','Relacionar una distancia representada con la distancia real.','Indicar el precio de los materiales.','Sustituir todas las cotas.','Determinar por sí sola la resistencia estructural.'],['¿Qué práctica mejora la legibilidad de un dibujo técnico?','Mantener jerarquía de líneas, cotas y símbolos consistentes.','Usar el mismo grosor para toda información sin criterio.','Omitir las unidades.','Cambiar la escala sin indicarlo.']) :
        /taller de dise[nñ]o|dise[nñ]o urbano/.test(n) ? bankFor(['¿Qué debe guiar la distribución de un espacio diseñado?','Las actividades, usuarios, circulación, seguridad y condiciones del contexto.','Solo la simetría de la planta.','La decoración sin considerar accesos.','La forma del mobiliario sin revisar el uso.'],['¿Qué función cumple un prototipo o esquema temprano de diseño?','Permite evaluar alternativas y detectar problemas antes de desarrollar la solución.','Reemplaza todas las verificaciones técnicas.','Garantiza automáticamente que el proyecto se construya.','Evita consultar a los usuarios.']) :
        /construcci[oó]n/.test(n) ? bankFor(['Antes de ejecutar una partida constructiva, ¿qué se debe revisar?','Planos, especificaciones, condiciones del sitio, seguridad y calidad de materiales.','Solo el color final.','Únicamente la fecha de entrega.','La publicidad del proveedor.'],['¿Por qué es importante controlar la calidad durante la construcción?','Para detectar desviaciones a tiempo y verificar que el trabajo cumpla especificaciones y normas aplicables.','Para evitar registrar avances.','Para reemplazar los planos por decisiones improvisadas.','Para eliminar las inspecciones.']) :
        /estructura/.test(n) ? bankFor(['¿Cuál es la función principal de una estructura en una edificación?','Resistir y transmitir las cargas de manera segura hacia sus apoyos y cimentación.','Definir exclusivamente los colores interiores.','Aumentar el peso sin propósito.','Sustituir las instalaciones sanitarias.'],['¿Qué debe considerarse al seleccionar un sistema estructural?','Cargas, luces, materiales, suelo, uso y requisitos normativos.','Solo la apariencia exterior.','Únicamente la disponibilidad de pintura.','El número de ventanas sin evaluar otros factores.']) :
        /turismo|tur[ií]st|patrimonio|destino|hospitalidad|gastron/.test(n) ? bankFor(['Al gestionar un destino turístico, ¿qué decisión ayuda a conservar sus recursos?','Estimar la capacidad de uso y gestionar los impactos ambientales y culturales.','Promover visitas ilimitadas sin control.','Excluir a la comunidad local.','Retirar toda señalización para aumentar la aventura.'],['¿Qué debe incluir una propuesta de producto turístico viable?','Público objetivo, experiencia, operación, costos, accesibilidad e impactos.','Solo un nombre atractivo.','Solo una fotografía promocional.','Un itinerario sin estimar tiempos ni recursos.']) :
        /periodismo|investigaci[oó]n de p[uú]blicos|comunicaci[oó]n escrita|comunicaci[oó]n digital|comunicaci[oó]n gr[aá]fica|fotograf[ií]a|radio|audiovisual|publicidad|semiótica|semi[oó]tica/.test(n) ? bankFor(['Al producir una pieza comunicacional, ¿qué decisión debe preceder al formato final?','Definir audiencia, objetivo, mensaje, canal y criterios de verificación.','Elegir efectos visuales sin definir el propósito.','Publicar sin revisar derechos ni fuentes.','Usar el mismo mensaje para todo público sin adaptación.'],['¿Cómo se evalúa si un mensaje llegó eficazmente a su público?','Contrastando el objetivo con indicadores pertinentes y retroalimentación de la audiencia.','Contando únicamente cuántos colores contiene.','Suponiendo que una publicación fue entendida por todos.','Midiendo solo el tamaño del archivo.']) :
        /marketing|investigaci[oó]n de mercado|mercado/.test(n) ? bankFor(['¿Qué permite una segmentación de mercado?','Agrupar clientes con necesidades o comportamientos semejantes para adaptar la propuesta.','Asegurar que todos los clientes son idénticos.','Eliminar la necesidad de investigar.','Fijar precios sin conocer costos ni demanda.'],['¿Qué aporta una investigación de mercado bien diseñada?','Evidencia sobre necesidades, hábitos y preferencias del público objetivo.','Una garantía de ventas sin importar el producto.','La sustitución de toda prueba con clientes.','Resultados válidos aunque la muestra esté sesgada.']) :
        /contabilidad|estados financieros|finanzas|financiera|costos/.test(n) ? bankFor(['¿Qué permite analizar un estado financiero?','La situación económica y financiera de una organización en un periodo o fecha determinados.','Únicamente el diseño del logotipo.','La satisfacción del cliente sin datos.','El organigrama sin información económica.'],['¿Por qué se distinguen costos fijos y variables?','Porque responden de forma diferente al nivel de actividad y apoyan el análisis de costos.','Porque ambos siempre cambian exactamente igual.','Porque los costos fijos solo existen en empresas grandes.','Porque los costos variables nunca se pueden estimar.']) :
        /recursos humanos|talento humano|psicolog[ií]a organizacional|comportamiento organizacional|liderazgo/.test(n) ? bankFor(['¿Qué práctica contribuye a gestionar mejor un equipo?','Aclarar objetivos, funciones, expectativas y canales de retroalimentación.','Evitar conversaciones sobre desempeño.','Asignar tareas sin explicar prioridades.','Usar el mismo incentivo para cualquier situación sin evaluar resultados.'],['Ante un conflicto laboral, ¿qué acción inicial es más constructiva?','Escuchar a las partes, precisar hechos y buscar acuerdos con criterios claros.','Difundir rumores para presionar.','Ignorar el problema indefinidamente.','Tomar una decisión sin conocer las versiones.']) :
        /operaciones|log[ií]stica|procesos/.test(n) ? bankFor(['¿Qué busca el análisis de un proceso operativo?','Identificar pasos, responsables, tiempos, desperdicios y oportunidades de mejora.','Aumentar pasos sin evaluar su utilidad.','Eliminar indicadores de calidad.','Registrar solo el resultado final.'],['¿Qué indicador puede ayudar a evaluar una operación?','Tiempo de ciclo, tasa de errores, costo o cumplimiento del servicio según el objetivo.','El color de los uniformes sin relación con la meta.','La cantidad de reuniones sin revisar su resultado.','Un número sin definición ni unidad.']) :
        /derecho penal/.test(n) ? bankFor(['En el análisis de un caso penal, ¿qué debe evaluarse antes de concluir responsabilidad?','Hechos acreditados, elementos del tipo aplicable, participación y garantías procesales.','La popularidad de la persona investigada.','Solo el titular de una noticia.','La intuición sin examinar evidencia.'],['¿Por qué es esencial respetar la presunción de inocencia?','Porque la responsabilidad debe determinarse mediante un proceso con garantías y prueba suficiente.','Porque impide investigar hechos.','Porque sustituye toda prueba.','Porque solo se aplica cuando existe confesión.']) :
        /derecho constitucional/.test(n) ? bankFor(['¿Qué función cumple una constitución en un Estado de derecho?','Organiza el poder público y reconoce derechos y principios fundamentales.','Regula únicamente contratos privados.','Sustituye todas las instituciones públicas.','Es una recomendación sin relevancia jurídica.'],['Al interpretar una norma constitucional, ¿qué debe considerarse?','Texto, principios, contexto y criterios interpretativos aplicables.','Solo una frase aislada sin contexto.','Únicamente la opinión de una de las partes.','El resultado deseado sin fundamento.']) :
        /psicomotricidad|estimulaci[oó]n temprana|infante|ni[nñ]o|aprendizaje|did[aá]ctica|lectoescritura|evaluaci[oó]n de los aprendizajes/.test(n) ? bankFor(['¿Qué caracteriza una actividad educativa adecuada al desarrollo infantil?','Considera edad, necesidades, seguridad, juego y objetivos de aprendizaje.','Exige la misma tarea compleja a todos sin apoyo.','Prioriza la repetición sin interacción.','Ignora las diferencias individuales.'],['¿Qué evidencia ayuda a valorar el progreso de un niño?','Observaciones sistemáticas y producciones vinculadas con objetivos claros.','Una impresión aislada sin contexto.','Compararlo siempre con un único modelo.','Registrar solo errores sin observar avances.']) : null);
      if (detail) return detail;
      const family = courseFamilyContent[inferCourseFamily(course)] || courseFamilyContent.professional;
      return family.qs.map(q => [`${q[0]} En el contexto de ${course.toLowerCase()},`, q[1], q[2], q[3], q[4]]);
    }

    function getCourseConcept(course) {
      const base = getCourseConceptBase(course);
      const l = course.toLowerCase();
      let t = CT[l];
      if (!t && l.startsWith('english')) t = 'Desarrolla tu inglés para comprender, hablar y escribir en contextos académicos y laborales; avanzas por niveles.';
      if (!t && l.startsWith('lenguaje y comunicación')) t = 'Mejora tu forma de leer, argumentar y redactar textos académicos con claridad.';
      if (!t && l.startsWith('realidad nacional')) t = 'Analiza la realidad social, económica y política del Perú y su relación con el mundo.';
      if (!t && l.startsWith('fundamentos en competencias digitales')) t = 'Herramientas digitales para estudiar y trabajar: ofimática, colaboración en línea y uso responsable de la tecnología.';
      if (!t) {
        const family = courseFamilyContent[inferCourseFamily(course)] || courseFamilyContent.professional;
        t = `${family.desc} En este curso, aplica estos fundamentos específicamente a ${course.toLowerCase()}.`;
        return [t, family.level, family.use];
      }
      return [t, base[1], base[2]];
    }
    // Banco de preguntas conceptuales: [pregunta, correcta, distractor1, distractor2, distractor3]
    const QB = {
      'fundamentos de programación': [['Un programa debe mostrar “Aprobado” solo si la nota es mayor o igual a 11. ¿Qué estructura necesitas?','Una condicional (if) que compare la nota con 11.','Un ciclo for que repita la nota 11 veces.','Una variable constante sin comparación.','Un comentario que explique la regla.'],['Un ciclo while empieza con contador = 0 y la condición es contador < 5, pero dentro nunca se modifica el contador. ¿Qué pasa?','Se repite indefinidamente porque la condición siempre se cumple.','Se ejecuta una sola vez.','Se ejecuta exactamente 5 veces.','No se ejecuta nunca.']],
      'fundamentos en competencias digitales': [['¿Qué práctica protege mejor tu cuenta institucional?','Usar una contraseña única y activar la verificación en dos pasos.','Usar la misma contraseña en todas tus cuentas para no olvidarla.','Compartir tu clave con un compañero de confianza.','Anotar la clave en un archivo compartido del grupo.'],['Para que un equipo edite un mismo informe a la vez sin crear versiones duplicadas, lo mejor es…','Trabajar en un documento en la nube con edición colaborativa.','Enviar el archivo por correo y unir los cambios a mano.','Guardar copias con distinto nombre en cada computadora.','Imprimir el informe y corregirlo en papel.']],
      'matemática': [['Si f(x) = 2x + 3, ¿cuánto vale f(4)?','11','8','14','9'],['La solución de la ecuación 3x − 6 = 12 es…','x = 6','x = 2','x = 18','x = 4']],
      'lenguaje y comunicación i': [['¿Qué distingue a una idea principal de una secundaria?','La principal expresa lo esencial del párrafo; las secundarias la apoyan o ejemplifican.','La principal siempre está en la primera línea.','La secundaria es la que tiene más palabras.','No hay diferencia: todas pesan igual.'],['¿Qué función cumple la tesis en un texto argumentativo?','Expresa la postura que el autor defenderá con argumentos.','Resume la biografía del autor.','Enumera las fuentes consultadas.','Cierra el texto con una pregunta.']],
      'realidad nacional y globalización': [['¿Qué describe mejor la globalización?','La creciente interconexión económica, cultural y tecnológica entre países.','El aislamiento comercial de las economías nacionales.','La desaparición de las diferencias culturales.','El comercio solo entre países vecinos.'],['¿Qué significa informalidad laboral?','Empleos sin contrato ni acceso pleno a seguridad social y derechos laborales.','Trabajos que solo se hacen desde casa.','Empleos de medio tiempo con contrato.','Trabajos independientes de alto ingreso.']],
      'english i': [['Choose the correct sentence.','She works in a bank every day.','She work in a bank every day.','She is work in a bank every day.','She working in a bank every day.'],['“What time do you usually wake up?” asks about…','Daily routine.','Past events.','Future plans.','Possibility.']],
      'english ii': [['Choose the correct past tense sentence.','Yesterday I visited my grandparents.','Yesterday I visit my grandparents.','Yesterday I am visiting my grandparents.','Yesterday I visits my grandparents.'],['Which sentence compares correctly?','This laptop is faster than that one.','This laptop is more fast than that one.','This laptop is fastest than that one.','This laptop is as faster as that one.']],
      'english iii': [['Which sentence uses the present perfect correctly?','I have lived in Lima since 2020.','I have live in Lima since 2020.','I am living in Lima since 2020.','I lived in Lima since 2020.'],['Choose the correct conditional.','If it rains, we will stay home.','If it will rain, we stay home.','If it rains, we would stayed home.','If it rained, we will stay home.']],
      'english iv': [['Which sentence is in the passive voice?','The report was written by the team.','The team wrote the report.','The team is writing the report.','The team will write the report.'],['“If I had studied more, I ___ the exam.”','would have passed','will pass','would pass','had passed']],
      'programación orientada a objetos i': [['¿Qué es una clase en programación orientada a objetos?','Una plantilla que define los atributos y comportamientos de los objetos que se crearán a partir de ella.','Una variable que guarda un número entero.','Un archivo donde se guardan los datos de forma permanente.','Un error que detiene la ejecución del programa.'],['¿Qué ventaja da declarar los atributos de una clase como privados?','Controlar cómo se leen o modifican mediante métodos, protegiendo la coherencia de los datos.','Que el programa se ejecute más rápido.','Que cualquier clase pueda modificarlos libremente.','Que ya no haga falta crear objetos.']],
      'matemática discreta': [['¿Cuándo es falsa una implicación lógica (si p entonces q)?','Solo cuando p es verdadera y q es falsa.','Cuando p y q son falsas.','Cuando p es falsa.','Siempre que q es verdadera.'],['¿Cuál es la negación de “todos los servidores están activos”?','Al menos un servidor no está activo.','Ningún servidor está activo.','Todos los servidores están inactivos.','Algunos servidores están activos.']],
      'cálculo de una variable': [['¿Qué representa la derivada de una función en un punto?','La rapidez con la que cambia la función en ese punto.','El área total bajo la curva.','El valor máximo de la función.','El promedio de todos sus valores.'],['Si la derivada de una función es positiva en un intervalo, la función allí es…','Creciente.','Decreciente.','Constante.','Discontinua.']],
      'administración para los negocios': [['¿Cuáles son las funciones clásicas de la administración?','Planificar, organizar, dirigir y controlar.','Comprar, vender, almacenar y despachar.','Diseñar, programar, probar y desplegar.','Contratar, capacitar, pagar y despedir.'],['Una empresa se propone “aumentar 10 % sus ventas este año”. Eso es un…','Objetivo (meta medible).','Riesgo.','Proceso operativo.','Estado financiero.']],
      'lenguaje y comunicación ii': [['¿Qué exige una buena citación (por ejemplo, APA)?','Indicar la fuente para reconocer la autoría, incluso si parafraseas.','Copiar el texto sin comillas si es corto.','Omitir el año de publicación.','Citar solo cuando la cita es textual.'],['¿Qué caracteriza a una buena conclusión en un ensayo?','Retoma la tesis y sintetiza los argumentos sin introducir ideas nuevas.','Presenta un argumento completamente nuevo.','Repite la introducción palabra por palabra.','Lista únicamente las referencias.']],
      'programación y estructuras de datos': [['¿Qué estructura sigue el principio LIFO (último en entrar, primero en salir)?','La pila (stack).','La cola (queue).','El arreglo ordenado.','La tabla hash.'],['¿Cuál es la ventaja principal de una tabla hash?','Buscar, insertar y eliminar en tiempo casi constante en promedio.','Mantener siempre los datos ordenados.','Ocupar menos memoria que cualquier otra estructura.','Recorrer los datos en orden de inserción.']],
      'gestión de procesos': [['En BPMN, ¿qué representa un rombo (compuerta)?','Un punto de decisión o bifurcación en el flujo del proceso.','El inicio del proceso.','Una tarea realizada por una persona.','Un almacén de datos.'],['¿Qué busca el análisis “AS-IS” de un proceso?','Documentar cómo funciona hoy para detectar cuellos de botella y mejoras.','Diseñar el proceso ideal futuro.','Elegir el software que lo automatizará.','Calcular el sueldo del personal.']],
      'álgebra lineal computacional': [['¿Para qué sirve multiplicar una matriz por un vector?','Para transformarlo (rotarlo, escalarlo o proyectarlo) en el espacio.','Para sumar todos sus elementos.','Para ordenar sus valores.','Para eliminar valores repetidos.'],['Si el determinante de una matriz cuadrada es 0, la matriz…','No tiene inversa (es singular).','Es la identidad.','Tiene inversa única.','Es diagonal.']],
      'electricidad y ondas': [['Con voltaje constante, si la resistencia aumenta, la corriente (ley de Ohm)…','Disminuye.','Aumenta.','Se mantiene igual.','Se vuelve alterna.'],['¿Cómo se relacionan la frecuencia y el período de una onda?','Son inversos: f = 1/T.','Son iguales.','Son directamente proporcionales.','No tienen relación.']],
      'principios de economía': [['Si el precio de un bien sube y lo demás no cambia, la cantidad demandada normalmente…','Disminuye.','Aumenta.','Se mantiene constante.','Se duplica.'],['¿Qué es el costo de oportunidad?','Lo que se renuncia al elegir una alternativa en lugar de otra.','El precio de compra de un bien.','El costo fijo de una empresa.','La ganancia neta del periodo.']],
      'ingeniería de software i': [['En Scrum, ¿qué es un Sprint?','Un periodo corto y fijo en el que el equipo construye un incremento del producto.','La reunión final con el cliente.','Un documento de requisitos completo.','La fase de mantenimiento.'],['¿En qué se diferencia un requisito no funcional de uno funcional?','Describe una cualidad del sistema (rendimiento, seguridad) y no una función concreta.','Describe lo que hace una pantalla.','Solo lo define el programador.','No necesita verificarse.']],
      'teoría de computación': [['¿Qué reconoce un autómata finito determinista?','Un lenguaje regular (patrones simples, como los de una expresión regular).','Cualquier programa posible.','Solo lenguajes con paréntesis balanceados.','Problemas indecidibles.'],['El problema de la parada demuestra que…','No existe un algoritmo general que decida si cualquier programa termina.','Todos los programas terminan.','Los programas infinitos no existen.','Toda máquina puede optimizarse.']],
      'análisis y diseño de sistemas i': [['¿Qué es un requisito funcional?','Lo que el sistema debe hacer, por ejemplo registrar una venta.','El lenguaje de programación a usar.','La velocidad mínima del servidor.','El presupuesto del proyecto.'],['Un diagrama de casos de uso sirve principalmente para…','Mostrar quién interactúa con el sistema y qué funciones usa.','Diseñar la base de datos.','Medir el rendimiento del código.','Definir el cronograma.']],
      'estadística descriptiva e inferencia estadística': [['¿Qué permite la inferencia estadística?','Sacar conclusiones sobre una población a partir de una muestra.','Contar todos los datos de la población uno por uno.','Solo graficar los datos.','Eliminar siempre los datos atípicos.'],['Si hay valores extremos muy altos, ¿qué medida de tendencia central se ve más afectada?','La media.','La mediana.','La moda.','El rango intercuartílico.']],
      'gerenciamiento de datos i': [['¿Para qué sirve una llave primaria en una tabla?','Para identificar de forma única cada registro.','Para cifrar los datos de la tabla.','Para ordenar los registros alfabéticamente.','Para copiar la tabla a otra base de datos.'],['¿Qué consulta SQL devuelve los clientes de Lima?',"SELECT * FROM clientes WHERE ciudad = 'Lima';","GET clientes WHERE Lima;","SELECT ciudad FROM Lima;","WHERE clientes = ciudad;"]],
      'arquitectura de computadoras': [['¿Qué función cumple la memoria caché?','Guardar datos de uso frecuente cerca del procesador para acceder más rápido.','Almacenar archivos de forma permanente.','Conectar la computadora a internet.','Enfriar el procesador.'],['En el ciclo de instrucción, ¿qué ocurre en la etapa de captación (fetch)?','La CPU obtiene de memoria la siguiente instrucción a ejecutar.','Se guarda el resultado en disco.','Se decodifica una señal de red.','Se apaga el reloj del procesador.']],
      'fundamentos contables y financieros': [['La ecuación contable básica establece que…','Activo = Pasivo + Patrimonio.','Activo = Ingresos − Gastos.','Pasivo = Activo + Patrimonio.','Patrimonio = Pasivo − Activo.'],['Un proyecto con VAN positivo indica que…','Genera más valor que su costo de capital, por lo que conviene financieramente.','Pierde dinero.','Tiene riesgo cero.','Debe rechazarse.']],
      'estructuras de datos avanzada': [['¿Por qué se usan árboles balanceados (como AVL)?','Para garantizar búsquedas en O(log n) evitando árboles degenerados.','Para almacenar datos sin orden.','Para reducir el número de nodos.','Para evitar usar referencias.'],['¿Qué recorrido de un grafo usa una cola y explora por niveles?','BFS (búsqueda en anchura).','DFS (búsqueda en profundidad).','Búsqueda binaria.','Ordenamiento topológico inverso.']],
      'experiencia de usuario (ux)': [['¿Para qué sirve una persona (persona de usuario) en UX?','Para representar necesidades y comportamientos de un grupo de usuarios y guiar el diseño.','Para definir el color de la marca.','Para programar la interfaz.','Para medir el tráfico web.'],['Un prototipo de baja fidelidad se usa para…','Validar ideas y flujos rápido y barato antes de invertir en el diseño final.','Publicar el producto final.','Reemplazar las pruebas con usuarios.','Definir la base de datos.']],
      'programación orientada a objetos ii': [['¿Qué es el polimorfismo?','Que objetos de distintas clases respondan de forma propia a un mismo mensaje o método.','Que una clase oculte sus atributos.','Que un programa se ejecute en varios procesadores.','Que una variable cambie de nombre.'],['¿Qué ventaja ofrece programar contra una interfaz y no contra una clase concreta?','Permite cambiar la implementación sin modificar el código que la usa.','Reduce siempre el número de clases.','Evita definir métodos.','Obliga a usar herencia múltiple.']],
      'arquitectura empresarial': [['¿Cuál es el objetivo de la arquitectura empresarial?','Alinear procesos, datos, aplicaciones y tecnología con la estrategia del negocio.','Elegir el lenguaje de programación de la empresa.','Reducir el personal de TI.','Diseñar únicamente la red de la oficina.'],['La capa que describe “qué aplicaciones sostienen cada proceso de negocio” es la de…','Aplicaciones (sistemas).','Infraestructura tecnológica.','Estrategia de negocio.','Datos físicos.']],
      'gerenciamiento de datos ii': [['¿Qué garantiza una transacción ACID?','Que un conjunto de operaciones se cumpla completo o no se aplique en absoluto.','Que la base de datos nunca se apague.','Que las consultas siempre sean más rápidas.','Que los datos no tengan relaciones.'],['¿Para qué sirve un índice en una tabla?','Acelerar las búsquedas, a costa de algo más de espacio y de tiempo de escritura.','Cifrar los datos.','Impedir siempre valores duplicados.','Hacer respaldos automáticos.']],
      'interacción humano computador': [['¿Qué evalúa la usabilidad de un sistema?','Qué tan fácil, eficiente y satisfactorio es para el usuario cumplir sus tareas.','Cuántas líneas de código tiene.','Qué tan rápido responde el servidor.','Cuántas funciones incluye.'],['La heurística de Nielsen “visibilidad del estado del sistema” dice que…','El sistema debe informar al usuario qué está ocurriendo con retroalimentación oportuna.','Todo debe permanecer oculto hasta que se pida.','La interfaz debe usar muchos colores.','Los errores deben mostrarse en código técnico.']],
      'ética y ciudadanía': [['Un desarrollador descubre que su empresa recolecta datos personales sin consentimiento. Lo correcto, desde la ética profesional, es…','Reportarlo y buscar corregir la práctica respetando la privacidad de las personas.','Ignorarlo porque el jefe lo autorizó.','Vender los datos para compensar el riesgo.','Borrar los registros sin avisar a nadie.'],['La ciudadanía responsable implica…','Ejercer derechos y cumplir deberes pensando en el bien común.','Priorizar siempre el beneficio personal.','Participar solo en elecciones.','Evitar opinar sobre asuntos públicos.']],
      'marketing': [['¿Qué es la segmentación de mercado?','Dividir el mercado en grupos con necesidades similares para atenderlos mejor.','Bajar el precio a todos los clientes.','Vender solo por internet.','Copiar la estrategia de la competencia.'],['Las 4P del marketing mix son…','Producto, precio, plaza y promoción.','Personas, procesos, plazos y presupuesto.','Planificación, producción, pruebas y postventa.','Proveedor, producción, precio y patente.']],
      'ingeniería de software ii': [['¿Qué busca una prueba unitaria?','Verificar que una parte pequeña del código (función o clase) funcione como se espera.','Probar el sistema completo con usuarios reales.','Medir la velocidad de la red.','Revisar la ortografía de la documentación.'],['¿Qué problema busca resolver la integración continua (CI)?','Detectar errores temprano al integrar y probar los cambios automáticamente y con frecuencia.','Eliminar la necesidad de pruebas.','Publicar sin revisión.','Reducir el tamaño del equipo.']],
      'análisis y diseño de sistemas ii': [['En un diagrama de clases, una relación de composición indica que…','La parte no existe sin el todo (ciclo de vida dependiente).','Las clases no se relacionan.','Una clase hereda de otra.','Ambas clases son interfaces.'],['¿Para qué sirve un diagrama de secuencia?','Mostrar cómo interactúan los objetos en el tiempo para realizar un caso de uso.','Definir las tablas de la base de datos.','Estimar costos del proyecto.','Listar los usuarios del sistema.']],
      'gobierno de ti': [['¿Para qué sirve el gobierno de TI?','Para asegurar que las decisiones y el uso de la tecnología generen valor y controlen riesgos.','Para instalar los equipos de cómputo.','Para programar las aplicaciones.','Para reemplazar al área de negocio.'],['COBIT es un marco que se usa para…','Gobernar y gestionar la TI alineándola con los objetivos del negocio.','Programar aplicaciones móviles.','Diseñar redes inalámbricas.','Calcular impuestos.']],
      'gobierno de datos': [['¿Qué define el gobierno de datos?','Roles, políticas y controles para que los datos sean confiables, seguros y bien usados.','La marca del servidor de base de datos.','Solo los respaldos diarios.','El diseño de los reportes.'],['Un “data steward” es responsable de…','Velar por la calidad y el uso correcto de un conjunto de datos en la organización.','Instalar los servidores.','Vender los datos a terceros.','Diseñar la interfaz del reporte.']],
      'sistemas operativos': [['¿Qué es una condición de carrera (race condition)?','Cuando varios procesos usan datos compartidos y el resultado depende del orden de ejecución.','Cuando el procesador funciona a su velocidad máxima.','Cuando un programa tarda mucho en abrirse.','Cuando se agota el espacio en disco.'],['¿Qué ocurre en un interbloqueo (deadlock)?','Varios procesos quedan esperándose mutuamente por recursos y ninguno avanza.','Un proceso usa toda la CPU.','El sistema se reinicia.','La memoria virtual se llena.']],
      'metodología de la investigación científica': [['¿Qué es una hipótesis?','Una respuesta tentativa al problema que se comprobará con evidencia.','La conclusión final de la investigación.','El listado de referencias.','Una opinión que no necesita verificarse.'],['¿Qué diferencia al enfoque cuantitativo del cualitativo?','El cuantitativo mide y analiza datos numéricos; el cualitativo interpreta significados y experiencias.','El cuantitativo no usa datos.','El cualitativo solo usa estadística.','No hay diferencia.']],
      'ingeniería de software iii': [['En un pipeline CI/CD, ¿qué suele seguir a las pruebas automáticas exitosas?','El despliegue automatizado a un entorno (staging o producción).','Reescribir el código desde cero.','Eliminar el repositorio.','Cerrar el proyecto.'],['La deuda técnica se refiere a…','Costos futuros de mantenimiento por decisiones rápidas o de baja calidad en el código.','Dinero que se debe al proveedor de internet.','Licencias vencidas.','Horas extra del equipo.']],
      'programación competitiva': [['Un problema pide procesar 10⁶ datos en 1 segundo. ¿Qué complejidad es viable?','O(n log n).','O(n²).','O(2ⁿ).','O(n!).'],['¿Qué técnica sirve cuando hay subproblemas repetidos y una solución óptima combinable?','Programación dinámica.','Fuerza bruta.','Búsqueda aleatoria.','Ordenar dos veces.']],
      'análisis y diseño de algoritmos': [['Si un algoritmo es O(n²) y n se duplica, el tiempo aproximadamente…','Se multiplica por 4.','Se duplica.','Se mantiene igual.','Se multiplica por 8.'],['“Divide y vencerás” consiste en…','Dividir el problema en subproblemas, resolverlos y combinar sus resultados.','Resolver todo de una sola vez.','Probar todas las combinaciones.','Elegir siempre la opción más cercana sin revisar.']],
      'desarrollo basado en plataformas': [['¿Qué es una API REST?','Una interfaz que expone recursos mediante HTTP para que otras aplicaciones los consuman.','Un lenguaje de programación.','Una base de datos.','Un tipo de red física.'],['¿Por qué usar servicios de una plataforma (autenticación, pagos) en vez de construirlos?','Ahorra tiempo y aprovecha soluciones probadas y mantenidas.','Elimina la necesidad de seguridad.','Hace que la app no necesite internet.','Evita cualquier costo.']],
      'gestión de sistemas de información': [['ITIL se enfoca principalmente en…','Gestionar los servicios de TI para entregar valor de forma consistente.','Programar algoritmos.','Diseñar hardware.','Medir el tráfico web.'],['¿Qué es un SLA (acuerdo de nivel de servicio)?','Un compromiso que define el nivel de servicio esperado (disponibilidad, tiempos de respuesta).','Una licencia de software.','Un manual de usuario.','Un respaldo de datos.']],
      'gestión del conocimiento': [['La diferencia entre conocimiento tácito y explícito es que…','El tácito vive en la experiencia de las personas; el explícito está documentado y se puede compartir.','El tácito siempre está en manuales.','El explícito solo existe en la mente.','Son lo mismo.'],['¿Qué práctica favorece la gestión del conocimiento en un equipo?','Documentar lecciones aprendidas y compartirlas en una base accesible.','Guardar la información solo en correos personales.','Rotar al personal sin registrar nada.','Evitar reuniones de retroalimentación.']],
      'redes y telecomunicaciones i': [['¿En qué capa del modelo OSI trabaja el protocolo IP?','Capa de red (capa 3).','Capa física (capa 1).','Capa de transporte (capa 4).','Capa de aplicación (capa 7).'],['¿Qué función principal cumple un router?','Enviar paquetes entre redes distintas según sus direcciones IP.','Amplificar la señal eléctrica dentro de una misma red.','Almacenar páginas web.','Cifrar el disco duro.']],
      'fundamentos del liderazgo sostenible': [['Un líder sostenible se caracteriza por…','Tomar decisiones que equilibran resultados, personas y medio ambiente a largo plazo.','Maximizar la ganancia inmediata sin importar el impacto.','Decidir siempre solo, sin escuchar al equipo.','Evitar el cambio.'],['Ante un conflicto en el equipo, la mejor acción inicial del líder es…','Escuchar a las partes para entender las causas y buscar un acuerdo.','Sancionar a la persona más antigua.','Ignorarlo hasta que pase.','Cambiar el objetivo del proyecto.']],
      'compiladores': [['¿Qué produce el analizador léxico de un compilador?','Una secuencia de tokens a partir del código fuente.','El código máquina final.','El árbol de ejecución del programa.','Los datos de prueba.'],['¿Qué verifica el análisis sintáctico?','Que los tokens cumplan la gramática del lenguaje.','Que el programa sea rápido.','Que el archivo no tenga virus.','Que los nombres tengan significado.']],
      'agentes inteligentes': [['Un agente reactivo simple decide su acción…','Solo a partir de lo que percibe en ese momento, sin memoria del pasado.','Planificando durante años.','Sin percibir el entorno.','Siempre al azar.'],['Un termostato que enciende la calefacción cuando la temperatura baja de 18 °C es un ejemplo de…','Agente reactivo basado en reglas.','Agente que aprende de millones de datos.','Red neuronal profunda.','Sistema multiagente.']],
      'seguridad de la información': [['¿Qué garantiza la integridad de la información?','Que los datos no sean modificados de forma no autorizada.','Que solo ciertas personas puedan leerlos.','Que estén disponibles las 24 horas.','Que se almacenen en la nube.'],['¿Qué es un ataque de phishing?','Engañar a una persona, normalmente por correo o mensaje, para que entregue credenciales o datos.','Saturar un servidor con tráfico.','Instalar un firewall.','Cifrar los datos de un disco.']],
      'gestión de proyectos para computación': [['¿Qué es la ruta crítica de un proyecto?','La secuencia de actividades que determina la duración mínima total del proyecto.','La lista de riesgos.','El conjunto de recursos más costosos.','El plan de comunicaciones.'],['La triple restricción de un proyecto involucra…','Alcance, tiempo y costo.','Personas, procesos y producto.','Calidad, marca y precio.','Riesgo, contrato y cliente.']],
      'cloud computing': [['En el modelo SaaS, el usuario…','Usa una aplicación lista, sin administrar servidores ni sistema operativo.','Administra el hardware.','Programa el sistema operativo.','Debe comprar sus propios servidores.'],['¿Qué significa elasticidad en la nube?','Ajustar automáticamente los recursos según la demanda.','Comprar servidores más grandes cada año.','Usar un solo centro de datos.','Desactivar el balanceador de carga.']],
      'oportunidades de negocios': [['Una propuesta de valor describe…','El beneficio concreto que el producto ofrece a un segmento y por qué lo prefiere.','El organigrama de la empresa.','Los costos fijos.','El logo de la marca.'],['Antes de invertir mucho en una idea, conviene…','Validarla con clientes reales mediante un producto mínimo viable (MVP).','Contratar a todo el equipo.','Comprar oficinas.','Lanzarla sin probar.']],
      'internet of things': [['¿Qué rol cumple un sensor en un sistema IoT?','Captar datos del entorno (temperatura, movimiento) y enviarlos para su procesamiento.','Almacenar el sistema operativo.','Cifrar la red.','Mostrar reportes ejecutivos.'],['MQTT es muy usado en IoT porque…','Es ligero y eficiente para dispositivos con pocos recursos y redes limitadas.','Sustituye al hardware.','Solo funciona con cables.','Se usa únicamente para correo.']],
      'visualización de datos': [['Para mostrar la evolución de las ventas mes a mes, el gráfico más adecuado suele ser…','Un gráfico de líneas.','Un gráfico circular con 12 porciones.','Un mapa de calor sin ejes.','Una tabla sin formato.'],['¿Qué práctica mejora un dashboard?','Mostrar pocos indicadores clave, claros y con contexto para decidir.','Incluir todos los gráficos posibles.','Usar muchos colores llamativos.','Ocultar las unidades.']],
      'proyecto para computación i': [['¿Qué documenta el alcance de un proyecto?','Qué se entregará y qué queda fuera del proyecto.','Cuánto ganará el equipo.','El código fuente completo.','La lista de invitados a la presentación.'],['¿Para qué sirve una matriz de riesgos?','Identificar riesgos y priorizarlos según probabilidad e impacto para planear respuestas.','Asignar tareas por día.','Contar horas trabajadas.','Comparar lenguajes de programación.']],
      'tecnologías emergentes': [['¿Qué diferencia a blockchain de una base de datos centralizada?','Registra datos en una cadena distribuida e inmutable, sin depender de un único administrador.','Es siempre más barata.','Solo guarda imágenes.','No usa criptografía.'],['Antes de adoptar una tecnología emergente, ¿qué análisis es más útil?','Evaluar su madurez, sus riesgos y el valor concreto que aporta al negocio.','Elegir la más popular en redes.','Adoptar la más nueva sin pruebas.','Esperar diez años.']],
      'computación en la sociedad': [['Un sistema automático de selección de personal discrimina a ciertos grupos porque se entrenó con datos históricos sesgados. Esto se conoce como…','Sesgo algorítmico.','Latencia de red.','Desbordamiento de memoria.','Denegación de servicio.'],['La brecha digital es…','La desigualdad en el acceso y uso de tecnologías entre personas o grupos.','Una falla del hardware.','Un tipo de virus.','La diferencia entre dos versiones de software.']],
      'big data y analítica de datos': [['Las “3V” clásicas del big data son…','Volumen, velocidad y variedad.','Valor, verificación y visualización.','Vector, variable y valor.','Validación, versión y vulnerabilidad.'],['¿Qué tipo de analítica responde “¿qué pasará?”','Analítica predictiva.','Analítica descriptiva.','Analítica de auditoría.','Revisión manual de logs.']],
      'estrategias de sistemas de información': [['Alinear TI con la estrategia del negocio significa que…','Los proyectos de TI apoyan directamente los objetivos de la organización.','TI decide sola la estrategia.','Se compra siempre la tecnología más cara.','TI se separa del resto de áreas.'],['Un análisis FODA sirve para…','Identificar fortalezas, oportunidades, debilidades y amenazas.','Programar una base de datos.','Medir la velocidad de la red.','Calcular la nómina.']],
      'proyecto para computación ii': [['Una prueba de aceptación de usuario (UAT) confirma que…','El sistema cumple lo que el usuario necesita antes de entregarlo.','El código no tiene comentarios.','El servidor es rápido.','La red es segura.'],['¿Qué debe incluir la entrega final de un proyecto de software?','El producto funcionando, su documentación y la evidencia de pruebas y resultados.','Solo el código fuente.','Solo la presentación.','Únicamente el manual de instalación.']],
      'emprendimiento e innovación tecnológica': [['¿Qué significa “pivotar” en una startup?','Cambiar el rumbo de la propuesta según lo aprendido del mercado.','Cerrar la empresa.','Contratar más personal.','Subir los precios.'],['El modelo Canvas sirve para…','Describir en una página cómo la empresa crea, entrega y captura valor.','Escribir el código de la aplicación.','Auditar las cuentas.','Elegir el hosting.']],
      'desarrollo de negocios electrónicos': [['¿Qué mide la tasa de conversión de una tienda en línea?','El porcentaje de visitantes que completan una acción deseada, como comprar.','El número total de productos.','La velocidad del servidor.','El costo del hosting.'],['Un carrito abandonado indica que…','El cliente agregó productos pero no completó la compra.','El cliente pagó dos veces.','El producto está agotado.','El sitio está caído.']]
    };
    // prerrequisitos del curso (nombres reales de la malla del alumno)
    function prereqNamesOf(course) {
      const cur = usilCurriculums[studentProfile.career] || [];
      const low = s => s.toLowerCase();
      const names = new Map(cur.flat().map(c => [low(c), c]));
      const map = ['Ingeniería de Sistemas de Información', 'Ingeniería de Software'].includes(studentProfile.career) ? Object.assign({}, PREREQ, studentProfile.career === 'Ingeniería de Software' ? PREREQ_SW : {}) : {};
      const m = {}; Object.keys(map).forEach(k => m[low(k)] = map[k]);
      return (m[low(course)] || []).filter(p => names.has(low(p))).map(p => names.get(low(p)));
    }
    const isElective = c => /^electivo/i.test(c);
    const _h = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    function allCourseNames() {
      const cur = usilCurriculums[studentProfile.career] || usilCurriculums['Ingeniería de Sistemas de Información'];
      return cur.flat().filter(c => !/^(electivo|english)/i.test(c));
    }
    function buildCourseQuestion(course, v) {
      const bank = QB[course.toLowerCase()] || getPreparedQuestionBank(course);
      let title, correct, wrong;
      if (bank) { const b = bank[v % bank.length]; title = b[0]; correct = b[1]; wrong = b.slice(2); }
      else {
        const pool = allCourseNames().filter(c => c.toLowerCase() !== course.toLowerCase());
        const pick = []; let idx = _h(course) + v;
        const val = c => v % 2 === 0 ? getCourseConcept(c)[0] : 'Te aporta: ' + getCourseConcept(c)[2].toLowerCase() + '.';
        correct = val(course);
        while (pick.length < 3 && pool.length) { const c = pool[idx++ % pool.length]; if (!pick.includes(c) && val(c) !== correct) pick.push(c); if (idx > _h(course) + 200) break; }
        wrong = pick.map(val);
        title = v % 2 === 0 ? `¿Cuál de estas descripciones corresponde a «${course}»?` : `¿Qué te aporta «${course}» en tu formación?`;
      }
      const ci = (_h(course) + v) % (wrong.length + 1);
      const options = [...wrong]; options.splice(ci, 0, correct);
      return { subject: course, course, title, options, correctIndex: ci };
    }

    function getApprovedCourseNames() {
      return Array.from(document.querySelectorAll('.hist-check:checked')).map(cb => cb.dataset.course || cb.parentElement.querySelector('span')?.textContent.trim()).filter(Boolean);
    }

    function getNextCycleNumber() {
      const current = Number(studentProfile.cycle || 1);
      return Math.min(current + 1, getCareerMaxCycles(studentProfile.career));
    }

    // Prerrequisitos REFERENCIALES (USIL no publica el detalle en sus folletos): se derivan de la lógica de la malla.
    const PREREQ = {
      'Programación Orientada a Objetos I':['Fundamentos de Programación'],
      'Matemática Discreta':['Matemática'], 'Cálculo de una Variable':['Matemática'],
      'Lenguaje y Comunicación II':['Lenguaje y Comunicación I'],
      'English II':['English I'], 'English III':['English II'], 'English IV':['English III'],
      'Programación y Estructuras de Datos':['Programación Orientada a Objetos I'],
      'Gestión de Procesos':['Administración para los Negocios'],
      'Álgebra Lineal Computacional':['Matemática'],
      'Electricidad y Ondas':['Cálculo de una Variable'],
      'Análisis y Diseño de Sistemas I':['Gestión de Procesos'],
      'Estadística Descriptiva e Inferencia Estadística':['Cálculo de una Variable'],
      'Gerenciamiento de Datos I':['Programación y Estructuras de Datos'],
      'Arquitectura de Computadoras':['Electricidad y Ondas'],
      'Fundamentos Contables y Financieros':['Principios de Economía'],
      'Programación Orientada a Objetos II':['Programación y Estructuras de Datos'],
      'Arquitectura Empresarial':['Análisis y Diseño de Sistemas I'],
      'Gerenciamiento de Datos II':['Gerenciamiento de Datos I'],
      'Interacción Humano Computador':['Análisis y Diseño de Sistemas I'],
      'Marketing':['Administración para los Negocios'],
      'Análisis y Diseño de Sistemas II':['Análisis y Diseño de Sistemas I'],
      'Gobierno de TI':['Arquitectura Empresarial'],
      'Gobierno de Datos':['Gerenciamiento de Datos II'],
      'Sistemas Operativos':['Arquitectura de Computadoras'],
      'Metodología de la Investigación Científica':['Estadística Descriptiva e Inferencia Estadística'],
      'Desarrollo basado en Plataformas':['Programación Orientada a Objetos II'],
      'Gestión de Sistemas de Información':['Análisis y Diseño de Sistemas II'],
      'Gestión del Conocimiento':['Gobierno de TI'],
      'Redes y Telecomunicaciones I':['Sistemas Operativos'],
      'Fundamentos del Liderazgo Sostenible':['Ética y Ciudadanía'],
      'Agentes Inteligentes':['Álgebra Lineal Computacional'],
      'Seguridad de la Información':['Redes y Telecomunicaciones I'],
      'Gestión de Proyectos para Computación':['Gestión de Sistemas de Información'],
      'Cloud Computing':['Redes y Telecomunicaciones I'],
      'Oportunidades de Negocios':['Marketing'],
      'Internet of Things':['Redes y Telecomunicaciones I'],
      'Visualización de Datos':['Gobierno de Datos'],
      'Proyecto para Computación I':['Gestión de Proyectos para Computación'],
      'Tecnologías Emergentes':['Cloud Computing'],
      'Computación en la Sociedad':['Ética y Ciudadanía'],
      'Big Data y Analítica de Datos':['Visualización de Datos'],
      'Estrategias de Sistemas de Información':['Gobierno de TI'],
      'Proyecto para Computación II':['Proyecto para Computación I'],
      'Emprendimiento e Innovación Tecnológica':['Oportunidades de Negocios'],
      'Desarrollo de Negocios Electrónicos':['Oportunidades de Negocios'],
      'Electivo 2':['Electivo 1'], 'Electivo 3':['Electivo 2'], 'Electivo 4':['Electivo 3'], 'Electivo 5':['Electivo 4'],
      // Ingeniería de Software
      'Ingeniería de Software I':['Programación Orientada a Objetos I'],
      'Ingeniería de Software II':['Ingeniería de Software I','Gerenciamiento de Datos I'],
      'Ingeniería de Software III':['Ingeniería de Software II'],
      'Teoría de Computación':['Matemática Discreta'],
      'Estructuras de Datos Avanzada':['Programación y Estructuras de Datos'],
      'Experiencia de Usuario (UX)':['Programación Orientada a Objetos I'],
      'Programación Competitiva':['Estructuras de Datos Avanzada'],
      'Análisis y Diseño de Algoritmos':['Estructuras de Datos Avanzada'],
      'Compiladores':['Teoría de Computación']
    };
    const PREREQ_SW = {
      'Interacción Humano Computador':['Experiencia de Usuario (UX)'],
      'Sistemas Operativos':['Estructuras de Datos Avanzada'],
      'Gestión de Sistemas de Información':['Ingeniería de Software II'],
      'Gestión de Proyectos para Computación':['Ingeniería de Software III'],
      'Visualización de Datos':['Gerenciamiento de Datos II'],
      'Estrategias de Sistemas de Información':['Gestión de Sistemas de Información']
    };

    function buildRouteCandidates() {
      const curriculum = usilCurriculums[studentProfile.career] || [];
      const low = s => s.toLowerCase();
      const approved = new Set(getApprovedCourseNames().map(low));
      const nameByKey = new Map(curriculum.flat().map(c => [low(c), c]));
      const current = Number(studentProfile.cycle || 1);
      const next = getNextCycleNumber();
      const map = ['Ingeniería de Sistemas de Información', 'Ingeniería de Software'].includes(studentProfile.career) ? Object.assign({}, PREREQ, studentProfile.career === 'Ingeniería de Software' ? PREREQ_SW : {}) : {};
      const mapLow = {}; Object.keys(map).forEach(k => mapLow[low(k)] = map[k]);
      const missingOf = c => (mapLow[low(c)] || []).filter(p => nameByKey.has(low(p)) && !approved.has(low(p))).map(p => nameByKey.get(low(p)));

      const seen = new Set(), out = [];
      const push = (course, cycle, level, label) => {
        if (approved.has(low(course)) || seen.has(course)) return;
        seen.add(course);
        const missing = missingOf(course);
        out.push({ course, cycle, level, priority: label, missing, blocked: missing.length > 0 });
      };
      curriculum.slice(0, Math.max(0, current - 1)).forEach((cs, i) => cs.forEach(c => push(c, i + 1, 1, 'Atraso · Prioridad')));
      (curriculum[current - 1] || []).forEach(c => push(c, current, 2, 'Ciclo actual · Pendiente'));
      if (next > current) (curriculum[next - 1] || []).forEach(c => push(c, next, 3, 'Próximo ciclo'));
      // Orden: 1) atrasos 2) pendientes del ciclo actual 3) próximo ciclo disponible 4) próximo ciclo bloqueado
      const rank = it => it.level === 3 && it.blocked ? 4 : it.level;
      out.sort((a, b) => rank(a) - rank(b) || a.cycle - b.cycle);
      out.forEach(it => { if (it.level === 3 && it.blocked) it.priority = 'Bloqueado por prerrequisito'; });
      curriculum.slice(Math.max(next, current)).forEach((cs, i) => cs.forEach(c => {
        if (approved.has(low(c)) || seen.has(c)) return;
        const missing = missingOf(c);
        if (missing.length) return;
        seen.add(c); out.push({ course: c, cycle: Math.max(next, current) + 1 + i, level: 5, priority: 'Ruta alternativa', missing: [], blocked: false });
      }));
      return out;
    }

    function renderLoadOptions() {
      const grid = document.getElementById('loadOptionsGrid');
      if (!grid) return;

      // La carga permitida en este paso es únicamente de 5 o 6 cursos.
      const options = [5, 6];
      grid.innerHTML = options.map(n => `
        <button type="button" onclick="selectLoadCourses(${n})" class="load-card flex-1 max-w-[220px] p-6 rounded-2xl border-2 ${selectedLoadCount===n?'border-blue-600 bg-blue-50/50 shadow-sm':'border-slate-200 bg-white'} text-center cursor-pointer transition hover:border-blue-300">
          <span class="text-3xl font-black ${selectedLoadCount===n?'text-blue-700':'text-slate-700'} block">${n}</span>
          <span class="text-xs font-bold ${selectedLoadCount===n?'text-blue-900':'text-slate-800'}">Cursos</span>
          <span class="text-[10px] ${selectedLoadCount===n?'text-blue-600 font-bold':'text-slate-600'} block mt-1">${n===5?'Carga equilibrada':'Carga completa'}</span>
        </button>`).join('');

      const next = getNextCycleNumber();
      const subtitle = document.getElementById('loadSelectorSubtitle');
      if (subtitle) subtitle.textContent = `Ciclo ${next}. Elige una carga de 5 o 6 cursos.`;

      const overdue = buildRouteCandidates().filter(item => item.level === 1).length;
      const summary = document.getElementById('loadDecisionSummary');
      if (summary) {
        summary.innerHTML = selectedLoadCount
          ? `Elegiste <strong>${selectedLoadCount} cursos</strong>. ${overdue ? `<strong>${overdue} curso${overdue===1?'':'s'} atrasado${overdue===1?'':'s'}</strong> tendrá prioridad en tu ruta.` : `Navia priorizará los cursos pendientes del ciclo ${next}.`}`
          : 'Elige 5 o 6 cursos para construir tu ruta.';
      }
    }

    function selectLoadCourses(number) {
      number = Number(number);
      if (![5, 6].includes(number)) return;
      selectedLoadCount = number;
      selectedRouteCourses = [];
      routeCustomized = false;
      renderLoadOptions();
      renderSuggestedCourses();
      renderCourseConcepts();
      clearFieldError('loadOptionsGrid');
      showToast(`Carga seleccionada: ${selectedLoadCount} cursos`);
    }

    function getPriorityCourses() {
      return buildRouteCandidates().filter(i => i.level <= 3 && !i.blocked).map(i => i.course).slice(0, selectedLoadCount);
    }
    function getDefaultRoute() {
      const c = buildRouteCandidates().filter(i => !i.blocked);
      return c.map(i => i.course).slice(0, selectedLoadCount);
    }
    function getSkippedPriority() { return getPriorityCourses().filter(c => !selectedRouteCourses.includes(c)); }

    function renderSuggestedCourses() {
      const container = document.getElementById('dynamicSuggestedCourses');
      if (!container) return;
      if (![5, 6].includes(selectedLoadCount)) {
        container.innerHTML = '<div class="p-5 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-2xl">Primero elige 5 o 6 cursos.</div>';
        return;
      }
      const cand = buildRouteCandidates();
      const core = cand.filter(i => i.level <= 3);
      const alts = cand.filter(i => i.level === 5);
      const selectable = core.filter(i => !i.blocked).length;
      const visible = core.slice(0, 14).concat(alts.slice(0, Math.max(0, selectedLoadCount + 2 - selectable)));
      suggestedCourses = visible.filter(i => !i.blocked).map(i => i.course);
      selectedRouteCourses = selectedRouteCourses.filter(c => suggestedCourses.includes(c));
      if (!routeCustomized) selectedRouteCourses = getDefaultRoute().filter(c => suggestedCourses.includes(c));
      const sub = document.getElementById('suggestedCoursesSubtitle');
      if (sub) sub.textContent = 'Navia ordena tus cursos por prioridad y respeta los prerrequisitos. Puedes elegir cuáles llevar; si te saltas uno prioritario, te avisaremos qué implica.';
      const prio = new Set(getPriorityCourses());
      container.innerHTML = visible.map(item => {
        const course = item.course, checked = selectedRouteCourses.includes(course);
        const [, level] = getCourseConcept(course);
        let icon, badgeClass;
        if (item.blocked) { icon = naviaIcon('lock', 'nv-icon h-3.5 w-3.5'); badgeClass = 'bg-slate-100 text-slate-600'; }
        else if (item.level === 1) { icon = '<span class="nv-status-dot nv-status-dot--urgent" aria-hidden="true"></span>'; badgeClass = 'bg-red-50 text-red-700'; }
        else if (item.level === 2) { icon = '<span class="nv-status-dot nv-status-dot--current" aria-hidden="true"></span>'; badgeClass = 'bg-amber-50 text-amber-700'; }
        else if (item.level === 3) { icon = '<span class="nv-status-dot nv-status-dot--available" aria-hidden="true"></span>'; badgeClass = 'bg-emerald-50 text-emerald-700'; }
        else { icon = '<span class="nv-status-dot nv-status-dot--other" aria-hidden="true"></span>'; badgeClass = 'bg-slate-100 text-slate-600'; }
        const label = item.blocked ? (item.level === 3 ? 'Bloqueado' : item.priority.split(' · ')[0] + ' · Bloqueado') : item.priority;
        const sub = item.blocked ? `${naviaIcon('lock', 'nv-icon inline-icon')} Primero aprueba: <strong>${item.missing.join(', ')}</strong>` : `${item.cycle}.° ciclo`;
        return `<label class="flex items-center justify-between gap-3 p-3.5 border ${item.blocked ? 'bg-slate-50 border-slate-200 opacity-70 cursor-not-allowed' : (checked ? 'bg-blue-50/40 border-blue-500 cursor-pointer hover:bg-slate-50' : 'bg-white border-slate-200 cursor-pointer hover:bg-slate-50')} rounded-2xl transition">
          <div class="flex items-center gap-3 min-w-0"><input type="checkbox" class="route-course-check text-blue-600 rounded" aria-label="Seleccionar curso ${course}" data-course="${course.replace(/"/g, '&quot;')}" ${checked ? 'checked' : ''} ${item.blocked ? 'disabled' : ''} onchange="toggleRouteCourse(this)"><div class="min-w-0"><div class="font-bold text-slate-800 text-sm truncate">${course}</div><div class="text-[11px] text-slate-500">${sub}</div></div></div>
          <div class="flex items-center gap-2 shrink-0"><span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeClass}">${icon} ${label}</span><span class="text-[10px] text-slate-500 hidden sm:inline">${level}</span></div>
        </label>`;
      }).join('');
      const count = document.getElementById('suggestedCoursesCount');
      if (count) count.textContent = `${selectedRouteCourses.length}/${selectedLoadCount} seleccionados · puedes llevar menos`;
      renderRouteWarning();
    }

    let routeCustomized = false;
    function toggleRouteCourse(input) {
      const course = input.dataset.course;
      routeCustomized = true;
      if (input.checked) {
        if (selectedRouteCourses.length >= selectedLoadCount) { input.checked = false; showError('dynamicSuggestedCourses', `Máximo ${selectedLoadCount} cursos. Desmarca uno para cambiarlo.`); return; }
        if (!selectedRouteCourses.includes(course)) selectedRouteCourses.push(course);
      } else selectedRouteCourses = selectedRouteCourses.filter(c => c !== course);
      clearFieldError('dynamicSuggestedCourses');
      renderSuggestedCourses();
      renderCourseConcepts();
    }

    function useRecommendedRoute() {
      routeCustomized = false;
      selectedRouteCourses = [];
      renderSuggestedCourses();
      renderCourseConcepts();
      closeRouteWarning();
      showToast('Ruta recomendada aplicada: primero tus cursos prioritarios');
    }

    function renderRouteWarning() {
      const el = document.getElementById('routeWarning');
      if (!el) return;
      const blocked = buildRouteCandidates().filter(i => i.blocked);
      const blockedNote = blocked.length ? `<div class="mt-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">${naviaIcon('lock', 'nv-icon inline-icon')} <strong>${blocked.length} curso${blocked.length===1?'':'s'} bloqueado${blocked.length===1?'':'s'}</strong> por prerrequisito. Aprueba primero: ${Array.from(new Set(blocked.flatMap(b => b.missing))).slice(0,4).join(', ')}.</div>` : '';
      const skipped = getSkippedPriority();
      if (!skipped.length && selectedRouteCourses.length >= selectedLoadCount) {
        el.innerHTML = `<div class="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">${naviaIcon('check-circle', 'nv-icon inline-icon')} Estás siguiendo la ruta recomendada por Navia con tus cursos prioritarios.</div>` + blockedNote;
        return;
      }
      el.innerHTML = skipped.length
        ? `<div class="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start justify-between gap-3"><div>${naviaIcon('warning', 'nv-icon inline-icon')} <strong>Te estás saltando ${skipped.length} curso${skipped.length === 1 ? '' : 's'} prioritario${skipped.length === 1 ? '' : 's'}:</strong> ${skipped.join(', ')}. Esto puede retrasar tu avance.</div><button type="button" onclick="useRecommendedRoute()" class="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 text-white font-semibold">Usar ruta recomendada</button></div>${blockedNote}`
        : `<div class="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">Elegiste ${selectedRouteCourses.length} de ${selectedLoadCount} cursos. Puedes continuar, pero llevar menos cursos alarga tu carrera.</div>${blockedNote}`;
    }

    function closeRouteWarning() { document.getElementById('routeWarnModal')?.remove(); }

    function showRouteWarning(skipped) {
      closeRouteWarning();
      const n = selectedRouteCourses.length;
      const m = document.createElement('div');
      m.id = 'routeWarnModal'; m.setAttribute('role','dialog'); m.setAttribute('aria-modal','true'); m.setAttribute('aria-labelledby','routeWarnTitle');
      m.className = 'fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4';
      m.innerHTML = `<div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 text-slate-800">
        ${naviaIcon('warning', 'nv-icon h-8 w-8 mb-1')}
        <h2 id="routeWarnTitle" class="text-lg font-black text-[#003366]">No estás llevando toda tu ruta prioritaria</h2>
        <p class="text-xs text-slate-600 mt-1">Elegiste <strong>${n} de ${selectedLoadCount}</strong> cursos${skipped.length ? ` y dejarías fuera: <strong>${skipped.join(', ')}</strong>` : ''}.</p>
        <p class="text-xs font-bold text-slate-800 mt-3">¿Qué podría pasar?</p>
        <ul class="text-xs text-slate-600 mt-1 space-y-1 list-disc pl-5">
          <li>Podrías necesitar <strong>ciclos extra</strong> al final de la carrera para cubrir los cursos postergados.</li>
          <li>Algunos cursos son <strong>prerrequisito</strong> de ciclos siguientes, y postergarlos puede bloquear cursos que te toca llevar.</li>
          <li>Los atrasos se acumulan y tu próximo ciclo llegará <strong>más cargado</strong>.</li>
          <li>Menos cursos por ciclo implica menos avance de créditos: revisa con tu coordinación si esto afecta tu beca, prácticas o egreso.</li>
        </ul>
        <div class="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">${naviaIcon('bulb', 'nv-icon inline-icon')} <strong>Recomendación de Navia:</strong> toma primero tus cursos prioritarios (atrasos y los del próximo ciclo). Es la ruta más corta para avanzar sin bloquearte.</div>
        <div class="mt-5 flex flex-col sm:flex-row gap-2 justify-end">
          <button type="button" onclick="proceedToConcepts()" class="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-medium hover:bg-slate-50">Continuar de todas formas</button>
          <button type="button" onclick="useRecommendedRoute()" class="px-5 py-2.5 rounded-xl bg-[#003366] text-white text-xs font-semibold hover:bg-blue-700">Tomar la ruta recomendada</button>
        </div></div>`;
      document.body.appendChild(m);
    }

    function renderCourseConcepts() {
      const container = document.getElementById('dynamicCourseConcepts');
      if (!container) return;
      const courses = selectedRouteCourses.length ? selectedRouteCourses : suggestedCourses;
      if (!courses.length) {
        container.innerHTML = '<div class="p-5 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-2xl">Selecciona tus cursos sugeridos para ver sus conceptos.</div>';
      } else {
        container.innerHTML = courses.map((course, i) => {
          const [concept, level, utility] = getCourseConcept(course);
          return `<div class="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs"><button onclick="toggleScreenAccordion('dynamic-acc-${i}')" class="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition"><div class="flex items-center gap-3 min-w-0"><div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">${i+1}</div><span class="font-bold text-slate-800 text-sm truncate">${course}</span></div><span id="dynamic-acc-${i}-arrow" class="text-slate-600">${naviaIcon('chevron-down', 'nv-icon h-4 w-4')}</span></button><div id="dynamic-acc-${i}-content" class="p-4 pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 text-xs hidden"><div class="md:col-span-8 text-slate-600 leading-relaxed">${concept}</div><div class="md:col-span-4 space-y-1.5 border-l border-slate-100 pl-4 text-slate-700"><div>${naviaIcon('book', 'nv-icon inline-icon')} <strong>Tipo:</strong> ${level}</div><div>${naviaIcon('bulb', 'nv-icon inline-icon')} <strong>Utilidad:</strong> ${utility}</div><div>${naviaIcon('route', 'nv-icon inline-icon')} <strong>Ruta:</strong> ${i===0?'Prioridad inicial':'Complementa la ruta'}</div></div></div></div>`;
        }).join('');
      }
      const count = document.getElementById('conceptsCount');
      if (count) count.textContent = `${courses.length} curso${courses.length===1?'':'s'}`;
    }

    function updateDynamicRecommendation() {
      const score = dynamicDiagnosticScore;
      const headline = document.getElementById('dynamicResultHeadline');
      const subtext = document.getElementById('dynamicResultSubtext');
      if (headline) headline.textContent = score === null ? 'Tu ruta está construida con tus decisiones.' : `Acertaste ${diagCorrect} de ${diagTotal} preguntas · ruta ajustada a tu preparación.`;
      if (subtext) subtext.textContent = score !== null && score < 70 ? 'Navia te recomienda reforzar estos temas antes de empezar el ciclo.' : 'Tienes una base favorable: Navia mantiene tu ruta y te sugiere repasar lo indicado.';
      const list = document.getElementById('dynamicRecommendationList');
      if (!list) return;
      const courses = selectedRouteCourses.length ? selectedRouteCourses : suggestedCourses;
      if (!courses.length) { list.innerHTML = '<div class="p-4 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">Completa tu selección para recibir una ruta.</div>'; return; }
      const weak = score === null ? [] : diagWrongCourses;
      const focus = weak.length ? weak.slice(0, 4) : courses.slice(0, 2);
      list.innerHTML = focus.map(course => {
        const [concept] = getCourseConcept(course);
        const text = weak.length ? `Repasa los fundamentos antes de llevarlo. ${concept}` : 'Sin puntos débiles detectados: mantenlo en tu ruta.';
        return `<div class="grid grid-cols-12 p-3 text-xs border border-slate-200 rounded-xl items-center hover:bg-slate-50"><div class="col-span-5 font-semibold text-slate-800">${course}</div><div class="col-span-7 text-slate-600">${text}</div></div>`;
      }).join('');
    }

    // Cierre de ciclo dinámico
    let closureQuestions = [];
    let closureAnswers = [];
    let closureQuizIndex = 0;
    let closureScore = 0;
    let closureStatuses = [];

    function getClosureCourses() {
      const selects = Array.from(document.querySelectorAll('.cierre-status-select'));
      return selects.map((sel, i) => ({
        course: sel.closest('.grid')?.querySelector('.font-bold.text-slate-800')?.textContent.trim() || `Curso ${i+1}`,
        status: sel.value
      }));
    }

    function buildClosureQuestions() {
      let rows = getClosureCourses().filter(r => r.status !== 'Retirado' && !isElective(r.course));
      if (!rows.length) rows = getClosureCourses().filter(r => !isElective(r.course));
      if (!rows.length) rows = (selectedRouteCourses.length ? selectedRouteCourses : []).map(c => ({ course: c, status: 'Aprobado' }));
      // los desaprobados van primero para que siempre entren en el examen
      rows = rows.slice().sort((a, b) => (b.status === 'Desaprobado') - (a.status === 'Desaprobado'));
      const qs = [];
      [0, 1].forEach(v => rows.forEach(r => qs.push(buildCourseQuestion(r.course, v))));
      return qs.slice(0, 12);
    }

    const getClosureCycle = () => Number(studentProfile.cycle) || 5;
    let closureRowsKey = '', closureApplied = false, lastClosure = null;
    function courseIcon(c) {
      const l = c.toLowerCase();
      if (l.includes('program')) return naviaIcon('code', 'nv-icon h-4 w-4');
      if (l.includes('dato')) return naviaIcon('database', 'nv-icon h-4 w-4');
      if (l.includes('english')) return naviaIcon('globe', 'nv-icon h-4 w-4');
      if (/matem|cálculo|álgebra|estad|electricidad/.test(l)) return naviaIcon('ruler', 'nv-icon h-4 w-4');
      if (/gest|gobierno|arquitectura|econom|contab|admin|market/.test(l)) return naviaIcon('building', 'nv-icon h-4 w-4');
      if (/ética|lenguaje|realidad|liderazgo/.test(l)) return naviaIcon('scale', 'nv-icon h-4 w-4');
      return naviaIcon('laptop', 'nv-icon h-4 w-4');
    }
    let plannedCourses = [];
    function renderClosureRows(force) {
      const host = document.getElementById('closureRows');
      if (!host) return;
      const career = studentProfile.career || 'Ingeniería de Sistemas de Información';
      const cur = usilCurriculums[career] || [];
      const cyc = getClosureCycle();
      const usingPlan = plannedCourses.length > 0;
      const list = usingPlan ? plannedCourses.slice() : (cur[cyc - 1] || []);
      const key = career + '|' + cyc + '|' + list.join(',');
      if (!force && key === closureRowsKey && host.children.length) return;
      closureRowsKey = key; closureApplied = false;
      const cycleOf = c => cur.findIndex(cs => cs.includes(c)) + 1;
      host.innerHTML = list.map((c, i) => `<div class="grid grid-cols-12 p-3.5 ${i < list.length - 1 ? 'border-b border-slate-100' : ''} items-center hover:bg-slate-50">
        <div class="col-span-8 flex items-center gap-3"><span class="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">${courseIcon(c)}</span><span><span class="font-bold text-slate-800 text-xs sm:text-sm block">${c}</span><span class="text-[10px] text-slate-600">${cycleOf(c)}.° ciclo de la malla</span></span></div>
        <div class="col-span-4 flex justify-end"><select aria-label="Estado final de ${c}" class="cierre-status-select bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold rounded-xl text-xs px-3 py-1.5 outline-none cursor-pointer" onchange="adjustStatusColor(this)"><option value="Aprobado" selected>Aprobado</option><option value="Desaprobado">Desaprobado</option><option value="Retirado">Retirado</option></select></div></div>`).join('');
    }

    function finalizeClosure() {
      const rows = getClosureCourses();
      if (!closureApplied && rows.length) {
        const closed = getClosureCycle();
        const boxes = Array.from(document.querySelectorAll('.hist-check'));
        rows.forEach(r => { const cb = boxes.find(b => b.dataset.course === r.course); if (cb) cb.checked = r.status === 'Aprobado'; });
        lastClosure = { cycle: closed, rows, newCycle: Math.min(closed + 1, getCareerMaxCycles(studentProfile.career)) };
        studentProfile.cycle = String(lastClosure.newCycle);
        // Se reinician las decisiones del ciclo anterior para que la nueva ruta parta del avance real
        selectedLoadCount = 0; selectedRouteCourses = []; suggestedCourses = []; routeCustomized = false; dynamicDiagnosticScore = null;
        if (studentProfile.career) renderDynamicCurriculum();
        updateDashboardFromProfile();
        updateHistoryCounts();
        closureApplied = true;
        plannedCourses = [];
      }
      goToScreen(13);
    }

    function renderClosureQuestion() {
      clearFieldError('closureOptionsContainer');
      closureQuestions = buildClosureQuestions();
      const q = closureQuestions[closureQuizIndex];
      const intro = document.getElementById('closureQuizIntro'); if (intro) intro.textContent = `Responde ${closureQuestions.length} preguntas para que Navia identifique qué reforzar.`;
      document.getElementById('closureQuizCounter').textContent = `Pregunta ${closureQuizIndex+1} de ${closureQuestions.length}`;
      document.getElementById('closureQuizCourse').textContent = `Curso: ${q.course}`;
      document.getElementById('closureQuestionText').textContent = q.title;
      const container = document.getElementById('closureOptionsContainer');
      const saved = Number.isInteger(closureAnswers[closureQuizIndex]) ? closureAnswers[closureQuizIndex] : null;
      container.innerHTML = q.options.map((opt,i)=>`<label class="flex items-center gap-3 p-3.5 rounded-2xl border-2 ${saved===i?'border-blue-600 bg-blue-50/40':'border-slate-200 bg-white'} cursor-pointer hover:bg-slate-50 transition"><input type="radio" name="closure_q_active" ${saved===i?'checked':''} value="${i}" class="text-blue-600 focus:ring-blue-500 w-4 h-4"><span class="text-xs sm:text-sm text-slate-800">${String.fromCharCode(65+i)}) ${opt}</span></label>`).join('');
      container.querySelectorAll('input').forEach(inp=>inp.addEventListener('change',()=>highlightSelectedOption(inp)));
      document.getElementById('closureNextBtnLabel').innerHTML = closureQuizIndex === closureQuestions.length-1
        ? `Ver resultado ${naviaIcon('arrow-right', 'nv-icon h-4 w-4')}`
        : `Siguiente ${naviaIcon('arrow-right', 'nv-icon h-4 w-4')}`;
    }

    function startClosureEvaluation() {
      closureQuestions = buildClosureQuestions();
      closureAnswers = [];
      closureQuizIndex = 0;
      closureScore = 0;
      renderClosureQuestion();
    }

    function closureNextQuestion() {
      const selected = document.querySelector('#closureOptionsContainer input[type="radio"]:checked');
      if (!selected) { showError('closureOptionsContainer', 'Selecciona una respuesta para continuar.'); return; }
      closureAnswers[closureQuizIndex] = Number(selected.value);
      if (closureQuizIndex < closureQuestions.length-1) {
        closureQuizIndex++;
        renderClosureQuestion();
      } else {
        closureScore = closureQuestions.reduce((sum,q,i)=>sum + (closureAnswers[i] === q.correctIndex ? 1 : 0), 0);
        renderClosureResult();
        goToScreen(12);
      }
    }

    function renderClosureResult() {
      const total = closureQuestions.length || 12;
      const score = closureScore;
      const percent = Math.round(score/total*100);
      const scoreLabel = document.getElementById('closureScoreLabel');
      if (scoreLabel) scoreLabel.innerHTML = `${score}<span class="text-xl text-slate-500 font-semibold">/${total}</span>`;
      const ring = document.getElementById('closureScoreRing');
      if (ring) ring.setAttribute('stroke-dashoffset', String(264 - (264*percent/100)));
      const head = document.getElementById('closureFeedbackHeadline');
      const text = document.getElementById('closureFeedbackText');
      if (head) head.textContent = percent >= 75 ? 'Tienes una base sólida para continuar.' : 'Hay temas que conviene reforzar antes de avanzar.';
      if (text) text.textContent = `${studentProfile.name || 'Tu perfil'} obtuvo ${score}/${total}. Navia ajustará la ruta usando este resultado y los cursos pendientes.`;
      const rows = getClosureCourses();
      const notPassed = rows.filter(r => r.status !== 'Aprobado');
      const wrong = closureQuestions.filter((q, i) => closureAnswers[i] !== q.correctIndex).map(q => q.course);
      const items = [];
      notPassed.forEach(r => items.push({ c: r.course, why: r.status === 'Desaprobado' ? 'Desaprobado: será tu prioridad al volver a llevarlo. ' : 'Retirado: queda pendiente y con prioridad. ' }));
      wrong.filter((v, i, a) => a.indexOf(v) === i).forEach(c => { if (!items.some(x => x.c === c)) items.push({ c, why: 'Fallaste preguntas de este curso: repasa sus temas clave. ' }); });
      const list = document.getElementById('closureReinforceList');
      if (list) list.innerHTML = items.map(it => { const [concept] = getCourseConcept(it.c); return `<div class="grid grid-cols-12 p-3 text-xs border-b border-slate-100 items-center"><div class="col-span-5 font-semibold text-slate-800">${it.c}</div><div class="col-span-7 text-slate-600">${it.why}${concept}</div></div>`; }).join('') || `<div class="p-3 text-xs text-emerald-700">${naviaIcon('check-circle', 'nv-icon inline-icon')} Aprobaste todo y respondiste bien. No hay cursos por reforzar.</div>`;
    }

    function updateClosingUserData() {
      const name = studentProfile.name || 'tu perfil';
      const career = studentProfile.career || 'tu carrera';
      const cycle = studentProfile.cycle ? `${studentProfile.cycle}.° ciclo` : 'tu ciclo';
      const h = document.getElementById('closingGreeting');
      const p = document.getElementById('closingStudentSummary');
      if (h) h.textContent = `¡Culminaste el ciclo, ${name}!`;
      if (p) p.textContent = plannedCourses.length ? `Registra el resultado de los ${plannedCourses.length} cursos que elegiste en tu ruta (${career}). Los desaprobados y retirados se conservarán como prioridad.` : `Actualiza tus resultados de ${cycle} en ${career} para que Navia ajuste tu ruta.`;
    }

    function updateFinalMalla() {
      const rows = lastClosure ? lastClosure.rows : getClosureCourses();
      const approved = rows.filter(r=>r.status==='Aprobado').length;
      const pending = rows.filter(r=>r.status==='Desaprobado').length + rows.filter(r=>r.status==='Retirado').length;
      const withdrawn = rows.filter(r=>r.status==='Retirado').length;
      const total = document.querySelectorAll('.hist-check').length || rows.length;
      const percent = total ? Math.round((approved / total) * 100) : 0;
      const a=document.getElementById('closingApprovedCount'); if(a) a.textContent=approved;
      const pe=document.getElementById('closingPendingCount'); if(pe) pe.textContent=pending;
      const w=document.getElementById('closingWithdrawnCount'); if(w) w.textContent=withdrawn;
      const title=document.getElementById('updatedMallaTitle'); if(title) title.textContent=`Malla actualizada, ${studentProfile.name || 'estudiante'}`;
      const summary=document.getElementById('updatedMallaSummary'); if(summary) summary.textContent=`${studentProfile.career || 'Tu carrera'} · ${lastClosure ? 'Cerraste el '+lastClosure.cycle+'.° ciclo y ahora estás en el '+studentProfile.cycle+'.°' : (studentProfile.cycle ? studentProfile.cycle+'.° ciclo' : 'ciclo actual')} · ${approved} cursos aprobados en este cierre.`;
      const list=document.getElementById('updatedMallaCourses');
      if(list) list.innerHTML=rows.map(r=>`<div class="flex items-center justify-between p-3 bg-white border ${r.status==='Aprobado'?'border-slate-200':'border-red-200 bg-red-50/30'} rounded-xl"><span class="text-xs font-semibold text-slate-800">${r.course}</span><span class="text-[11px] px-2 py-0.5 rounded-full ${r.status==='Aprobado'?'bg-emerald-100 text-emerald-800':'bg-red-100 text-red-800'} font-bold">${r.status==='Aprobado'?naviaIcon('check', 'nv-icon h-3 w-3')+' Aprobado':r.status==='Retirado'?naviaIcon('minus-circle', 'nv-icon h-3 w-3')+' Retirado':'! Pendiente'}</span></div>`).join('');
      const next=document.getElementById('updatedMallaNextText'); if(next) next.textContent = pending ? `Navia mantendrá ${pending} curso${pending===1?'':'s'} pendiente${pending===1?'':'s'} como prioridad para recuperar tu ruta.` : 'Tu ciclo quedó actualizado. Navia puede continuar con tu siguiente ruta.';
      const pt=document.getElementById('updatedMallaProgressText'); if(pt) pt.textContent=`${approved} aprobados · ${pending} pendientes`;
      const pr=document.getElementById('updatedMallaPercent'); if(pr) pr.textContent=`${percent}%`;
      const rr=document.getElementById('updatedMallaRing'); if(rr) rr.setAttribute('stroke-dasharray',`${percent}, 100`);
      const st=document.getElementById('updatedMallaStatus'); if(st) st.textContent = pending ? 'Recuperación priorizada' : 'Ruta lista para continuar';
      const ss=document.getElementById('updatedMallaStatusSub'); if(ss) ss.textContent = pending ? 'Los cursos pendientes se conservarán como prioridad.' : 'Tus decisiones ya fueron incorporadas.';
    }

    // Prototype State
    let currentActiveScreen = 1;
    let currentQuizIndex = 0;
    const totalScreens = 14;

    // Direct Navigation Controller
    function goToScreen(screenNumber) {
      if (screenNumber < 1 || screenNumber > totalScreens) return;
      if (!profileCompleted && [4, 14].includes(screenNumber)) return;
      updateNavigationAccess();
      
      // Hide all panels
      document.querySelectorAll('.screen-panel').forEach(p => p.classList.add('hidden'));

      // Show target
      const target = document.getElementById(`screen-${screenNumber}`);
      if (target) {
        if (screenNumber === 2) updateProfileScreenState();
        target.classList.remove('hidden');
        currentActiveScreen = screenNumber;
      }

      // Sync select dropdown in toolbar

      // Show or hide inner app top bar
      const innerNav = document.getElementById('innerAppNav');
      if (innerNav) {
        if (screenNumber === 1) {
          innerNav.classList.add('hidden');
        } else {
          innerNav.classList.remove('hidden');
        }
      }

      // Highlight active nav tabs
      document.querySelectorAll('.nav-tab').forEach(tab => {
        const viewAttr = parseInt(tab.getAttribute('data-view'));
        if (
          (screenNumber === 4 && viewAttr === 4) ||
          ((screenNumber >= 5 && screenNumber <= 9) && viewAttr === 6) ||
          ((screenNumber >= 10 && screenNumber <= 13) && viewAttr === 13) ||
          (screenNumber === 14 && viewAttr === 14) ||
          ((screenNumber === 2 || screenNumber === 3) && viewAttr === 2)
        ) {
          tab.classList.add('text-blue-700', 'font-bold', 'bg-blue-50');
          tab.classList.remove('text-slate-600');
        } else {
          tab.classList.remove('text-blue-700', 'font-bold', 'bg-blue-50');
          tab.classList.add('text-slate-600');
        }
      });

      // Special initializations per screen
      if (screenNumber === 5) { renderLoadOptions(); renderSuggestedCourses(); }
      if (screenNumber === 6) { renderSuggestedCourses(); }
      if (screenNumber === 7) { renderCourseConcepts(); }
      if (screenNumber === 8) { quizAnswers = []; currentQuizIndex = 0; renderQuizQuestion(currentQuizIndex); }
      if (screenNumber === 9) { updateDynamicRecommendation(); }
      if (screenNumber === 10) { updateClosingUserData(); renderClosureRows(); }
      if (screenNumber === 11) { startClosureEvaluation(); }
      if (screenNumber === 12) { renderClosureResult(); }
      if (screenNumber === 13) { updateFinalMalla(); }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Screen 1: Login Handler (compatibilidad con versiones anteriores del prototipo)
    function handleLoginSubmit(e) {
      e.preventDefault();
      handleMicrosoftLogin();
    }

    function togglePasswordVisibility() {
      const field = document.getElementById('loginPasswordField');
      if (field.type === 'password') {
        field.type = 'text';
      } else {
        field.type = 'password';
      }
    }

    // Screen 3: Curriculum Checkboxes Counter
    function updateHistoryCounts() {
      const allCheckboxes = document.querySelectorAll('.hist-check');
      const checked = Array.from(allCheckboxes).filter(cb => cb.checked).length;
      const total = allCheckboxes.length;
      const pending = total - checked;

      document.querySelectorAll('.cycle-toggle-button').forEach(button => {
        const cycleCheckboxes = Array.from(document.querySelectorAll(`.hist-check[data-cycle="${button.dataset.cycle}"]`));
        const allChecked = cycleCheckboxes.length > 0 && cycleCheckboxes.every(checkbox => checkbox.checked);
        button.textContent = allChecked ? 'Desmarcar todos' : 'Marcar todos';
        button.setAttribute('aria-label', `${allChecked ? 'Desmarcar' : 'Marcar'} todos los cursos del ciclo ${button.dataset.cycle}`);
        button.setAttribute('aria-pressed', String(allChecked));
      });

      const checkedEl = document.getElementById('histCheckedCount');
      const pendingEl = document.getElementById('histPendingCount');
      if (checkedEl) checkedEl.textContent = checked;
      if (pendingEl) pendingEl.textContent = pending;

      const dashApproved = document.getElementById('dashboardApprovedCount');
      const dashPending = document.getElementById('dashboardPendingCount');
      const dashTotal = document.getElementById('dashboardTotalCount');
      if (dashApproved) dashApproved.textContent = checked;
      if (dashPending) dashPending.textContent = pending;
      if (dashTotal) dashTotal.textContent = total;

      const percent = total ? Math.round((checked / total) * 100) : 0;
      const dashPercent = document.getElementById('dashboardProgressPercent');
      if (dashPercent) dashPercent.textContent = `${percent}%`;
      const dashRing = document.getElementById('dashboardProgressRing');
      if (dashRing) dashRing.setAttribute('stroke-dashoffset', String(264 - (264 * percent / 100)));

      const closingApproved = document.getElementById('closingApprovedCount');
      const closingPending = document.getElementById('closingPendingCount');
      if (closingApproved) closingApproved.textContent = checked;
      if (closingPending) closingPending.textContent = pending;
    }

    function continueToSuggestedCourses() {
      if (!selectedLoadCount) { showError('loadOptionsGrid', 'Selecciona cuántos cursos llevarás.'); return; }
      renderSuggestedCourses();
      goToScreen(6);
    }

    // Screen 7: Accordion Toggle
    function toggleScreenAccordion(id) {
      const content = document.getElementById(`${id}-content`);
      const arrow = document.getElementById(`${id}-arrow`);
      if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        if (arrow) arrow.innerHTML = naviaIcon('chevron-up', 'nv-icon h-4 w-4');
      } else {
        content.classList.add('hidden');
        if (arrow) arrow.innerHTML = naviaIcon('chevron-down', 'nv-icon h-4 w-4');
      }
    }

    function proceedToConcepts() {
      closeRouteWarning();
      plannedCourses = selectedRouteCourses.slice();
      renderCourseConcepts();
      goToScreen(7);
    }

    function continueToConcepts() {
      if (!selectedRouteCourses.length) { showError('dynamicSuggestedCourses', 'Elige al menos un curso para continuar.'); return; }
      const skipped = getSkippedPriority();
      if (skipped.length || selectedRouteCourses.length < selectedLoadCount) { showRouteWarning(skipped); return; }
      proceedToConcepts();
    }

    // Screen 8: Quiz Engine
    function buildDynamicDiagnosticQuestions() {
      let courses = (selectedRouteCourses.length ? selectedRouteCourses : suggestedCourses).filter(c => !isElective(c));
      if (!courses.length) return tenDiagnosticQuestions.slice(0, 6);
      const used = new Set(), qs = [];
      const one = (course) => {
        const pre = prereqNamesOf(course).filter(p => QB[p.toLowerCase()]);
        for (const p of pre) for (const v of [1, 0]) { const k = p + '|' + v; if (!used.has(k)) { used.add(k); const q = buildCourseQuestion(p, v); return Object.assign(q, { subject: `${course} · base: ${p}` }); } }
        const k = course + '|own'; used.add(k);
        return Object.assign(buildCourseQuestion(course, 0), { subject: course });
      };
      courses.forEach(c => qs.push(one(c)));
      if (courses.length < 4) courses.forEach(c => qs.push(Object.assign(buildCourseQuestion(c, 1), { subject: c })));
      return qs.slice(0, 10);
    }

    let diagWrongCourses = [], diagCorrect = 0, diagTotal = 0;
    function calculateDynamicDiagnosticScore() {
      const questions = buildDynamicDiagnosticQuestions();
      const ci = q => Number.isInteger(q.correctIndex) ? q.correctIndex : 0;
      diagWrongCourses = questions.filter((q, i) => quizAnswers[i] !== ci(q)).map(q => q.subject).filter((v, i, a) => a.indexOf(v) === i);
      diagTotal = questions.length;
      diagCorrect = questions.filter((q, i) => quizAnswers[i] === ci(q)).length;
      dynamicDiagnosticScore = Math.round((diagCorrect / Math.max(1, diagTotal)) * 100);
      const label = document.getElementById('diagScoreLabel');
      if (label) label.innerHTML = `${diagCorrect}<span class="text-xl text-slate-500 font-semibold">/${diagTotal}</span>`;
      const ring = document.getElementById('diagScoreRing');
      if (ring) ring.setAttribute('stroke-dashoffset', String(Math.round(264 - 264 * dynamicDiagnosticScore / 100)));
      updateDynamicRecommendation();
    }

    function renderQuizQuestion(idx) {
      clearFieldError('quizOptionsContainer');
      const qs = buildDynamicDiagnosticQuestions();
      const q = qs[idx] || qs[0];
      document.getElementById('quizBadgeCounter').textContent = `Pregunta ${idx + 1} de ${qs.length}`;
      document.getElementById('quizSubjectLabel').textContent = q.subject;
      document.getElementById('quizQuestionText').textContent = q.title;
      document.getElementById('quizPercentLabel').textContent = `${Math.round(((idx + 1) / qs.length) * 100)}%`;
      const saved = Number.isInteger(quizAnswers[idx]) ? quizAnswers[idx] : -1;
      document.getElementById('quizOptionsContainer').innerHTML = q.options.map((opt, i) =>
        `<label class="flex items-start gap-3 p-3.5 rounded-2xl border-2 ${i === saved ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white'} cursor-pointer transition hover:bg-blue-50/60"><input type="radio" name="diag_q_active" ${i === saved ? 'checked' : ''} onchange="highlightSelectedOption(this)" class="mt-1 text-blue-600 focus:ring-blue-500 w-4 h-4"><span class="text-xs sm:text-sm text-slate-700 font-medium">${opt}</span></label>`).join('');
      document.getElementById('quizNextBtnLabel').innerHTML = idx === qs.length - 1
        ? `Ver resultados de diagnóstico ${naviaIcon('arrow-right', 'nv-icon h-4 w-4')}`
        : `Siguiente pregunta ${naviaIcon('arrow-right', 'nv-icon h-4 w-4')}`;
    }

    function highlightSelectedOption(inputEl) {
      const box = inputEl.closest('label').parentElement;
      box.querySelectorAll('label').forEach(l => { l.classList.remove('border-blue-600', 'bg-blue-50/50', 'bg-blue-50/40'); l.classList.add('border-slate-200', 'bg-white'); });
      const lab = inputEl.closest('label');
      lab.classList.remove('border-slate-200', 'bg-white');
      lab.classList.add('border-blue-600', 'bg-blue-50/50');
    }

    function quizNextQuestion() {
      const radios = Array.from(document.querySelectorAll('#quizOptionsContainer input[type="radio"]'));
      const sel = radios.findIndex(r => r.checked);
      if (sel < 0) { showError('quizOptionsContainer', 'Selecciona una respuesta para continuar.'); return; }
      quizAnswers[currentQuizIndex] = sel;
      const total = buildDynamicDiagnosticQuestions().length;
      if (currentQuizIndex < total - 1) { currentQuizIndex++; renderQuizQuestion(currentQuizIndex); }
      else { calculateDynamicDiagnosticScore(); currentQuizIndex = 0; goToScreen(9); }
    }

    function quizGoBack() {
      if (currentQuizIndex > 0) {
        currentQuizIndex--;
        renderQuizQuestion(currentQuizIndex);
      } else {
        goToScreen(7);
      }
    }

    // Screen 10: Adjust Course Colors
    function adjustStatusColor(select) {
      select.classList.remove('bg-emerald-50', 'text-emerald-700', 'border-emerald-200', 'bg-red-100', 'text-red-700', 'border-red-200', 'bg-slate-100', 'text-slate-600');
      if (select.value === 'Aprobado') {
        select.classList.add('bg-emerald-50', 'text-emerald-700', 'border-emerald-200');
      } else if (select.value === 'Desaprobado') {
        select.classList.add('bg-red-100', 'text-red-700', 'border-red-200');
      } else {
        select.classList.add('bg-slate-100', 'text-slate-600', 'border-slate-200');
      }
      showToast(`Estado cambiado a: ${select.value}`);
    }

    // Screen 14: Community Functions
    function toggleCommentLike(btn, baseCount) {
      const numSpan = btn.querySelector('.likes-num');
      const isLiked = btn.getAttribute('data-liked') === 'true';
      if (!isLiked) {
        btn.setAttribute('data-liked', 'true');
        btn.classList.remove('text-rose-500', 'bg-rose-50');
        btn.classList.add('text-white', 'bg-rose-500');
        numSpan.textContent = baseCount + 1;
        showToast('¡Te gusta este comentario!');
      } else {
        btn.setAttribute('data-liked', 'false');
        btn.classList.add('text-rose-500', 'bg-rose-50');
        btn.classList.remove('text-white', 'bg-rose-500');
        numSpan.textContent = baseCount;
      }
    }

    function filterCommunityItems(query) {
      const term = query.toLowerCase().trim();
      const cards = document.querySelectorAll('#commCourseGrid .comm-card');
      const reviews = document.querySelectorAll('#commReviewsList .review-item');

      cards.forEach(c => {
        const text = c.innerText.toLowerCase();
        c.style.display = text.includes(term) ? '' : 'none';
      });

      reviews.forEach(r => {
        const text = r.innerText.toLowerCase();
        r.style.display = text.includes(term) ? '' : 'none';
      });
    }

    function filterByCourse(name) {
      const search = document.getElementById('communitySearchInput');
      search.value = name;
      filterCommunityItems(name);
      showToast(`Filtrando opiniones de: ${name}`);
    }

    function openLeaveReviewModal() {
      document.getElementById('reviewModal').classList.remove('hidden');
    }

    function closeLeaveReviewModal() {
      document.getElementById('reviewModal').classList.add('hidden');
    }

    function handleReviewSubmit(e) {
      e.preventDefault();
      const name = studentProfile.name.trim();
      const course = document.getElementById('reviewCourse').value;
      const content = document.getElementById('reviewContent').value.trim();
      if (!course) { showError('reviewCourse', 'Selecciona un curso.'); return; }
      if (!content) { showError('reviewContent', 'Escribe tu reseña o consejo.'); return; }
      const initials = name.substring(0, 2).toUpperCase();

      const list = document.getElementById('commReviewsList');
      const item = document.createElement('div');
      item.className = "review-item p-3.5 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-2xs flex items-start justify-between gap-3";
      item.innerHTML = `<div class="flex items-start gap-3"><div class="review-avatar w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0"></div><div><div class="flex items-baseline gap-2"><span class="review-author font-bold text-xs text-slate-900"></span><span class="review-course text-[10px] text-slate-600"></span></div><p class="review-content text-xs text-slate-600 mt-1 leading-relaxed"></p></div></div><button class="like-btn flex items-center gap-1.5 text-xs text-rose-500 font-semibold bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-full transition" aria-label="Me gusta esta opinión"><span>${naviaIcon('heart', 'nv-icon h-4 w-4')}</span><span class="likes-num">1</span></button>`;
      item.querySelector('.review-avatar').textContent = initials;
      item.querySelector('.review-author').textContent = name;
      item.querySelector('.review-course').textContent = course;
      item.querySelector('.review-content').textContent = content;
      item.querySelector('.like-btn').addEventListener('click', event => toggleCommentLike(event.currentTarget, 1));

      list.insertBefore(item, list.firstChild);
      closeLeaveReviewModal();
      document.getElementById('reviewContent').value = '';
      showToast('¡Tu opinión se publicó en la comunidad!');
    }

    // Toast Notification Manager
    let toastTimer;
    function showToast(msg) {
      const toast = document.getElementById('appToast');
      const text = document.getElementById('toastText');
      text.textContent = msg;
      toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
      }, 2800);
    }

    // Startup Initialization
    window.onload = () => {
      renderClosureRows();
      goToScreen(1);
      previewSelectedCareer();
      updateDashboardFromProfile();
      updateHistoryCounts();
      renderLoadOptions();
      renderSuggestedCourses();
      renderCourseConcepts();
    };
  


/* ===== Navia: accesibilidad (ARIA) + transición ligera ===== */
(function () {
  'use strict';
  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const SYMBOLS = /^[\s\p{Extended_Pictographic}\u2190-\u21FF\u2022\u2299\u2713\u2715\u2716\u00B7\uFE0F\u200D]+$/u;

  function enhance(root) {
    root = root || document;
    $$('svg:not([aria-hidden])', root).forEach(e => { e.setAttribute('aria-hidden', 'true'); e.setAttribute('focusable', 'false'); });
    $$('span,div,p', root).forEach(e => {
      if (e.children.length || e.hasAttribute('aria-hidden')) return;
      const t = e.textContent;
      if (t && t.trim() && SYMBOLS.test(t)) {
        const p = e.parentElement;
        if (p && p.tagName === 'BUTTON' && p.textContent.trim() === t.trim() && !p.hasAttribute('aria-label')) return;
        e.setAttribute('aria-hidden', 'true');
      }
    });
    $$('[onclick]:not(button):not(a):not(input):not(select):not([role])', root).forEach(e => {
      e.setAttribute('role', 'button'); e.setAttribute('tabindex', '0');
      e.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); e.click(); } });
    });
    $$('input:not([type=hidden]),select,textarea', root).forEach(e => {
      if (e.hasAttribute('aria-label') || e.hasAttribute('aria-labelledby') || e.closest('label') || (e.id && $('label[for="' + e.id + '"]'))) return;
      const row = e.closest('li,tr,div');
      const nm = e.dataset.course || e.placeholder || (row && ($('.font-bold', row) || {}).textContent) || 'Campo';
      e.setAttribute('aria-label', nm.trim());
    });
    $$('div.max-w-md.mx-auto.relative', root).forEach(c => { if (!c.hasAttribute('role')) { c.setAttribute('role', 'group'); c.setAttribute('aria-label', 'Progreso del registro'); } });
    $$('div.ring-4', root).forEach(c => c.parentElement && c.parentElement.setAttribute('aria-current', 'step'));
    $$('button', root).forEach(b => { if (!b.hasAttribute('aria-label') && b.textContent.trim() && !b.textContent.replace(SYMBOLS, '').trim()) b.setAttribute('aria-label', b.textContent.trim() === '✕' ? 'Cerrar' : 'Acción'); });
  }

  /* Navegación: sin ocultar nada; solo foco, título y anuncio */
  const baseGo = window.goToScreen;
  let started = false;
  window.goToScreen = function (n) {
    baseGo(n);
    const cur = document.getElementById('screen-' + n);
    if (!cur) return;
    enhance(cur);
    if (!reduce()) {
      cur.classList.remove('nv-screen-in'); void cur.offsetWidth; cur.classList.add('nv-screen-in');
      setTimeout(() => cur.classList.remove('nv-screen-in'), 400);
    }
    const h = $('h1', cur) || $('h2,h3', cur);
    const title = h ? h.textContent.replace(/\s+/g, ' ').trim() : 'Navia';
    document.title = title + ' · Navia';
    const ann = document.getElementById('nvAnnouncer');
    if (ann) { ann.textContent = ''; setTimeout(() => { ann.textContent = 'Pantalla: ' + title; }, 50); }
    if (started && h && h.tagName === 'H1') h.focus({ preventScroll: true });
    started = true;
    $$('.nav-tab').forEach(t => t.classList.contains('bg-blue-50') ? t.setAttribute('aria-current', 'page') : t.removeAttribute('aria-current'));
  };

  /* Diálogos: foco, trampa de Tab, Escape */
  const CLOSERS = { microsoftLoginModal: () => window.closeMicrosoftLogin && closeMicrosoftLogin(), reviewModal: () => window.closeLeaveReviewModal && closeLeaveReviewModal(), routeWarnModal: () => window.closeRouteWarning && closeRouteWarning() };
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const open = new Map();
  const shown = d => getComputedStyle(d).display !== 'none';
  function sync(d) {
    if (shown(d) && !open.has(d)) {
      open.set(d, document.activeElement);
      if (!reduce()) { d.classList.add('nv-dialog-in'); setTimeout(() => d.classList.remove('nv-dialog-in'), 300); }
      enhance(d);
      setTimeout(() => { const f = $$(FOCUSABLE, d).find(x => x.offsetParent !== null); if (f) f.focus(); }, 60);
    } else if (!shown(d) && open.has(d)) {
      const back = open.get(d); open.delete(d);
      if (back && document.contains(back) && back.focus) back.focus();
    }
  }
  document.addEventListener('keydown', e => {
    const d = Array.from(open.keys()).pop(); if (!d) return;
    if (e.key === 'Escape') { const c = CLOSERS[d.id]; if (c) { e.preventDefault(); c(); } return; }
    if (e.key === 'Tab') {
      const f = $$(FOCUSABLE, d).filter(x => x.offsetParent !== null); if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !d.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    }
  });

  function init() {
    enhance(document);
    // diálogos estáticos: observar solo su atributo class
    const dm = new MutationObserver(ms => ms.forEach(m => sync(m.target)));
    $$('[role=dialog]').forEach(d => dm.observe(d, { attributes: true, attributeFilter: ['class'] }));
    // contenido dinámico: solo nodos agregados, con espera para no saturar
    let t = null; const pending = new Set();
    new MutationObserver(ms => {
      ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType !== 1) return;
        pending.add(n);
        if (n.getAttribute && n.getAttribute('role') === 'dialog') { dm.observe(n, { attributes: true, attributeFilter: ['class'] }); sync(n); }
      }));
      ms.forEach(m => m.removedNodes.forEach(n => { if (open.has(n)) { const back = open.get(n); open.delete(n); if (back && document.contains(back)) back.focus(); } }));
      if (pending.size && !t) t = setTimeout(() => { t = null; const list = Array.from(pending); pending.clear(); list.forEach(n => document.contains(n) && enhance(n)); }, 120);
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();



(function(){
  'use strict';
  function improveAccessibility(root){
    root = root || document;
    root.querySelectorAll('img').forEach(function(img){
      if(!img.hasAttribute('alt')) img.setAttribute('alt','');
      if(!img.hasAttribute('loading')) img.setAttribute('loading','lazy');
    });
    root.querySelectorAll('svg').forEach(function(svg){
      if(!svg.hasAttribute('aria-label') && !svg.hasAttribute('aria-labelledby')){
        svg.setAttribute('aria-hidden','true');
        svg.setAttribute('focusable','false');
      }
    });
    root.querySelectorAll('input,select,textarea').forEach(function(el){
      if(el.type==='hidden' || el.type==='submit' || el.type==='button') return;
      var hasLabel = (el.id && root.querySelector('label[for="'+CSS.escape(el.id)+'"]')) || el.closest('label') || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      if(!hasLabel && el.type==='checkbox'){
        var course = el.getAttribute('data-course');
        el.setAttribute('aria-label', course ? 'Seleccionar '+course : 'Marcar opción');
      } else if(!hasLabel && el.type==='radio'){
        var parentLabel=el.closest('label');
        if(parentLabel && !parentLabel.textContent.trim()) el.setAttribute('aria-label','Opción de respuesta');
      } else if(!hasLabel && el.tagName==='SELECT'){
        el.setAttribute('aria-label','Selecciona una opción');
      } else if(!hasLabel && el.tagName==='INPUT'){
        el.setAttribute('aria-label',el.placeholder || 'Campo de entrada');
      } else if(!hasLabel && el.tagName==='TEXTAREA'){
        el.setAttribute('aria-label',el.placeholder || 'Área de texto');
      }
    });
    root.querySelectorAll('[role="button"]').forEach(function(el){
      if(el.tagName!=='BUTTON' && el.tagName!=='A' && !el.hasAttribute('tabindex')) el.setAttribute('tabindex','0');
      if(el.tagName!=='BUTTON' && el.tagName!=='A' && !el.dataset.keyboardA11y){
        el.dataset.keyboardA11y='1';
        el.addEventListener('keydown',function(e){
          if((e.key==='Enter'||e.key===' ') && !e.target.closest('button,a,input,select,textarea')){e.preventDefault();el.click();}
        });
      }
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){improveAccessibility();});
  else improveAccessibility();
  var observer=new MutationObserver(function(records){records.forEach(function(record){record.addedNodes.forEach(function(node){if(node.nodeType===1) improveAccessibility(node);});});});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.naviaRefreshAccessibility=improveAccessibility;
})();



/* Expansión hacia abajo del proceso 1: alterna aria-expanded y la clase .open (animación por grid-template-rows) */
(function(){const b=document.getElementById('guideToggle'),p=document.getElementById('guidePanel');
  b.addEventListener('click',()=>{const o=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',o);p.classList.toggle('open',o);
    if(o)setTimeout(()=>p.scrollIntoView({behavior:'smooth',block:'nearest'}),360)});
  document.getElementById('guideCta').addEventListener('click',()=>{b.click();scrollTo({top:0,behavior:'smooth'})});})();
