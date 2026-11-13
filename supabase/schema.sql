create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'student' check (role in ('student', 'admin')),
  display_name text,
  student_code text,
  career text,
  cycle integer check (cycle between 1 and 20),
  goal text not null default 'Ninguno',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  academic_state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.curriculum_courses (
  career text not null,
  cycle integer not null check (cycle between 1 and 20),
  course_name text not null,
  primary key (career, cycle, course_name)
);

create table if not exists public.community_public_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  reputation integer not null default 0 check (reputation >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 4 and 160),
  category text not null check (category in (
    'platform_outage', 'data_security', 'academic_recommendation',
    'academic_history', 'login', 'functionality', 'visual_issue',
    'community_content', 'other'
  )),
  priority text not null check (priority in ('critical', 'high', 'medium', 'low')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  attachment_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique default ('NAV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  owner_id uuid not null references auth.users(id) on delete cascade,
  consumer_name text not null,
  consumer_address text not null,
  consumer_document text not null,
  consumer_email text not null,
  consumer_phone text,
  service_description text not null,
  complaint_type text not null check (complaint_type in ('reclamo', 'queja')),
  detail text not null,
  request text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table public.complaints add column if not exists status text not null default 'open';
alter table public.complaints drop constraint if exists complaints_status_check;
alter table public.complaints add constraint complaints_status_check
  check (status in ('open', 'in_progress', 'closed'));

create table if not exists public.complaint_messages (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now()
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  course text not null,
  body text not null check (char_length(body) between 1 and 5000),
  status text not null default 'discussion' check (status in ('discussion', 'resolved', 'academic_question', 'hidden')),
  likes integer not null default 0 check (likes >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.community_posts(id) on delete cascade,
  comment_id uuid references public.community_comments(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 5 and 1000),
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  check ((post_id is null) <> (comment_id is null))
);

create unique index if not exists community_post_reports_unique
on public.community_reports(post_id, reporter_id) where post_id is not null;

create unique index if not exists community_comment_reports_unique
on public.community_reports(comment_id, reporter_id) where comment_id is not null;

create table if not exists public.community_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

insert into public.curriculum_courses (career, cycle, course_name) values
  ('Ingeniería de Sistemas de Información', 1, 'Fundamentos de Programación'),
  ('Ingeniería de Sistemas de Información', 1, 'Fundamentos en Competencias Digitales'),
  ('Ingeniería de Sistemas de Información', 1, 'Matemática'),
  ('Ingeniería de Sistemas de Información', 1, 'Lenguaje y Comunicación I'),
  ('Ingeniería de Sistemas de Información', 1, 'Realidad Nacional y Globalización'),
  ('Ingeniería de Sistemas de Información', 1, 'English I'),
  ('Ingeniería de Sistemas de Información', 2, 'Programación Orientada a Objetos I'),
  ('Ingeniería de Sistemas de Información', 2, 'Matemática Discreta'),
  ('Ingeniería de Sistemas de Información', 2, 'Cálculo de una Variable'),
  ('Ingeniería de Sistemas de Información', 2, 'Administración para los Negocios'),
  ('Ingeniería de Sistemas de Información', 2, 'Lenguaje y Comunicación II'),
  ('Ingeniería de Sistemas de Información', 2, 'English II'),
  ('Ingeniería de Sistemas de Información', 3, 'Programación y Estructuras de Datos'),
  ('Ingeniería de Sistemas de Información', 3, 'Gestión de Procesos'),
  ('Ingeniería de Sistemas de Información', 3, 'Álgebra Lineal Computacional'),
  ('Ingeniería de Sistemas de Información', 3, 'Electricidad y Ondas'),
  ('Ingeniería de Sistemas de Información', 3, 'Principios de Economía'),
  ('Ingeniería de Sistemas de Información', 3, 'English III'),
  ('Ingeniería de Sistemas de Información', 4, 'Análisis y Diseño de Sistemas I'),
  ('Ingeniería de Sistemas de Información', 4, 'Estadística Descriptiva e Inferencia Estadística'),
  ('Ingeniería de Sistemas de Información', 4, 'Gerenciamiento de Datos I'),
  ('Ingeniería de Sistemas de Información', 4, 'Arquitectura de Computadoras'),
  ('Ingeniería de Sistemas de Información', 4, 'Fundamentos Contables y Financieros'),
  ('Ingeniería de Sistemas de Información', 4, 'English IV'),
  ('Ingeniería de Sistemas de Información', 5, 'Programación Orientada a Objetos II'),
  ('Ingeniería de Sistemas de Información', 5, 'Arquitectura Empresarial'),
  ('Ingeniería de Sistemas de Información', 5, 'Gerenciamiento de Datos II'),
  ('Ingeniería de Sistemas de Información', 5, 'Interacción Humano Computador'),
  ('Ingeniería de Sistemas de Información', 5, 'Ética y Ciudadanía'),
  ('Ingeniería de Sistemas de Información', 5, 'Marketing'),
  ('Ingeniería de Sistemas de Información', 6, 'Análisis y Diseño de Sistemas II'),
  ('Ingeniería de Sistemas de Información', 6, 'Gobierno de TI'),
  ('Ingeniería de Sistemas de Información', 6, 'Gobierno de Datos'),
  ('Ingeniería de Sistemas de Información', 6, 'Sistemas Operativos'),
  ('Ingeniería de Sistemas de Información', 6, 'Metodología de la Investigación Científica'),
  ('Ingeniería de Sistemas de Información', 6, 'Electivo 1'),
  ('Ingeniería de Sistemas de Información', 7, 'Desarrollo basado en Plataformas'),
  ('Ingeniería de Sistemas de Información', 7, 'Gestión de Sistemas de Información'),
  ('Ingeniería de Sistemas de Información', 7, 'Gestión del Conocimiento'),
  ('Ingeniería de Sistemas de Información', 7, 'Redes y Telecomunicaciones I'),
  ('Ingeniería de Sistemas de Información', 7, 'Fundamentos del Liderazgo Sostenible'),
  ('Ingeniería de Sistemas de Información', 7, 'Electivo 2'),
  ('Ingeniería de Sistemas de Información', 8, 'Agentes Inteligentes'),
  ('Ingeniería de Sistemas de Información', 8, 'Seguridad de la Información'),
  ('Ingeniería de Sistemas de Información', 8, 'Gestión de Proyectos para Computación'),
  ('Ingeniería de Sistemas de Información', 8, 'Cloud Computing'),
  ('Ingeniería de Sistemas de Información', 8, 'Oportunidades de Negocios'),
  ('Ingeniería de Sistemas de Información', 8, 'Electivo 3'),
  ('Ingeniería de Sistemas de Información', 9, 'Internet of Things'),
  ('Ingeniería de Sistemas de Información', 9, 'Visualización de Datos'),
  ('Ingeniería de Sistemas de Información', 9, 'Proyecto para Computación I'),
  ('Ingeniería de Sistemas de Información', 9, 'Tecnologías Emergentes'),
  ('Ingeniería de Sistemas de Información', 9, 'Computación en la Sociedad'),
  ('Ingeniería de Sistemas de Información', 9, 'Electivo 4'),
  ('Ingeniería de Sistemas de Información', 10, 'Big Data y Analítica de Datos'),
  ('Ingeniería de Sistemas de Información', 10, 'Estrategias de Sistemas de Información'),
  ('Ingeniería de Sistemas de Información', 10, 'Proyecto para Computación II'),
  ('Ingeniería de Sistemas de Información', 10, 'Emprendimiento e Innovación Tecnológica'),
  ('Ingeniería de Sistemas de Información', 10, 'Desarrollo de Negocios Electrónicos'),
  ('Ingeniería de Sistemas de Información', 10, 'Electivo 5'),
  ('Ingeniería de Software', 1, 'Fundamentos de Programación'),
  ('Ingeniería de Software', 1, 'Fundamentos en Competencias Digitales'),
  ('Ingeniería de Software', 1, 'Matemática'),
  ('Ingeniería de Software', 1, 'Lenguaje y Comunicación I'),
  ('Ingeniería de Software', 1, 'Realidad Nacional y Globalización'),
  ('Ingeniería de Software', 1, 'English I'),
  ('Ingeniería de Software', 2, 'Programación Orientada a Objetos I'),
  ('Ingeniería de Software', 2, 'Matemática Discreta'),
  ('Ingeniería de Software', 2, 'Cálculo de Una Variable'),
  ('Ingeniería de Software', 2, 'Lenguaje y Comunicación II'),
  ('Ingeniería de Software', 2, 'Administración para los Negocios'),
  ('Ingeniería de Software', 2, 'English II'),
  ('Ingeniería de Software', 3, 'Programación y Estructuras de Datos'),
  ('Ingeniería de Software', 3, 'Ingeniería de Software I'),
  ('Ingeniería de Software', 3, 'Álgebra Lineal Computacional'),
  ('Ingeniería de Software', 3, 'Teoría de Computación'),
  ('Ingeniería de Software', 3, 'Principios de Economía'),
  ('Ingeniería de Software', 3, 'English III'),
  ('Ingeniería de Software', 4, 'Estructuras de Datos Avanzada'),
  ('Ingeniería de Software', 4, 'Estadística Descriptiva e Inferencia Estadística'),
  ('Ingeniería de Software', 4, 'Gerenciamiento de Datos I'),
  ('Ingeniería de Software', 4, 'Experiencia de Usuario (UX)'),
  ('Ingeniería de Software', 4, 'Fundamentos Contables y Financieros'),
  ('Ingeniería de Software', 4, 'English IV'),
  ('Ingeniería de Software', 5, 'Programación Orientada a Objetos II'),
  ('Ingeniería de Software', 5, 'Ingeniería de Software II'),
  ('Ingeniería de Software', 5, 'Gerenciamiento de Datos II'),
  ('Ingeniería de Software', 5, 'Interacción Humano Computador'),
  ('Ingeniería de Software', 5, 'Ética y Ciudadanía'),
  ('Ingeniería de Software', 5, 'Marketing'),
  ('Ingeniería de Software', 6, 'Ingeniería de Software III'),
  ('Ingeniería de Software', 6, 'Programación Competitiva'),
  ('Ingeniería de Software', 6, 'Análisis y Diseño de Algoritmos'),
  ('Ingeniería de Software', 6, 'Sistemas Operativos'),
  ('Ingeniería de Software', 6, 'Metodología de la Investigación Científica'),
  ('Ingeniería de Software', 6, 'Electivo 1'),
  ('Ingeniería de Software', 7, 'Desarrollo Basado en Plataformas'),
  ('Ingeniería de Software', 7, 'Gestión de Sistemas de Información'),
  ('Ingeniería de Software', 7, 'Compiladores'),
  ('Ingeniería de Software', 7, 'Redes y Telecomunicaciones I'),
  ('Ingeniería de Software', 7, 'Fundamentos del Liderazgo Sostenible'),
  ('Ingeniería de Software', 7, 'Electivo 2'),
  ('Ingeniería de Software', 8, 'Agentes Inteligentes'),
  ('Ingeniería de Software', 8, 'Seguridad de la Información'),
  ('Ingeniería de Software', 8, 'Gestión de Proyectos para Computación'),
  ('Ingeniería de Software', 8, 'Cloud Computing'),
  ('Ingeniería de Software', 8, 'Oportunidades de Negocios'),
  ('Ingeniería de Software', 8, 'Electivo 3'),
  ('Ingeniería de Software', 9, 'Internet of Things'),
  ('Ingeniería de Software', 9, 'Visualización de Datos'),
  ('Ingeniería de Software', 9, 'Proyecto para Computación I'),
  ('Ingeniería de Software', 9, 'Tecnologías Emergentes'),
  ('Ingeniería de Software', 9, 'Computación en la Sociedad'),
  ('Ingeniería de Software', 9, 'Electivo 4'),
  ('Ingeniería de Software', 10, 'Big Data y Analítica de Datos'),
  ('Ingeniería de Software', 10, 'Estrategias de Sistemas de Información'),
  ('Ingeniería de Software', 10, 'Proyecto para Computación II'),
  ('Ingeniería de Software', 10, 'Emprendimiento e Innovación Tecnológica'),
  ('Ingeniería de Software', 10, 'Desarrollo de Negocios Electrónicos'),
  ('Ingeniería de Software', 10, 'Electivo 5'),
  ('Administración en Turismo', 1, 'Desarrollo Humano'),
  ('Administración en Turismo', 1, 'English I'),
  ('Administración en Turismo', 1, 'Fundamentos de la Industria de la Hospitalidad'),
  ('Administración en Turismo', 1, 'Lenguaje I'),
  ('Administración en Turismo', 1, 'Matemática'),
  ('Administración en Turismo', 1, 'Teoría del Turismo y Ocio'),
  ('Administración en Turismo', 2, 'Administración para los Negocios'),
  ('Administración en Turismo', 2, 'Análisis Histórico-Social del Perú'),
  ('Administración en Turismo', 2, 'Contabilidad General'),
  ('Administración en Turismo', 2, 'English II'),
  ('Administración en Turismo', 2, 'Geografía Turística y Territorio'),
  ('Administración en Turismo', 2, 'Lenguaje II'),
  ('Administración en Turismo', 3, 'English III'),
  ('Administración en Turismo', 3, 'Estadística General'),
  ('Administración en Turismo', 3, 'Gestión del Patrimonio Cultural'),
  ('Administración en Turismo', 3, 'Marketing'),
  ('Administración en Turismo', 3, 'Patrimonio Natural y Turismo'),
  ('Administración en Turismo', 3, 'Realidad Nacional y Globalización'),
  ('Administración en Turismo', 4, 'Economía General'),
  ('Administración en Turismo', 4, 'English IV'),
  ('Administración en Turismo', 4, 'Gestión Sostenible del Turismo'),
  ('Administración en Turismo', 4, 'Metodología de la Investigación'),
  ('Administración en Turismo', 4, 'Sociedad, Estado y Empresa'),
  ('Administración en Turismo', 4, 'Turismo Cultural y Patrimonial'),
  ('Administración en Turismo', 5, 'English V'),
  ('Administración en Turismo', 5, 'Ética y Ciudadanía'),
  ('Administración en Turismo', 5, 'Finanzas Empresariales'),
  ('Administración en Turismo', 5, 'Gestión de Servicios Turísticos'),
  ('Administración en Turismo', 5, 'Gestión Empresarial e Intermediación Turística'),
  ('Administración en Turismo', 5, 'Gestión Pública en Turismo'),
  ('Administración en Turismo', 6, 'Análisis Gerencial de la Información Financiera'),
  ('Administración en Turismo', 6, 'Desarrollo de Productos Turísticos'),
  ('Administración en Turismo', 6, 'English VI: RREL'),
  ('Administración en Turismo', 6, 'Investigación y Análisis de Mercado'),
  ('Administración en Turismo', 6, 'Legislación Turística, Hotelera y de la Gastronomía'),
  ('Administración en Turismo', 6, 'Mercado Turístico'),
  ('Administración en Turismo', 7, 'Administración del Talento humano'),
  ('Administración en Turismo', 7, 'Creatividad e Innovación: Design Thinking'),
  ('Administración en Turismo', 7, 'Economía del Turismo'),
  ('Administración en Turismo', 7, 'Gestión y Evaluación Ambiental'),
  ('Administración en Turismo', 7, 'Operaciones en Turismo'),
  ('Administración en Turismo', 7, 'Planificación Turística'),
  ('Administración en Turismo', 8, 'Cooperación Internacional en Turismo'),
  ('Administración en Turismo', 8, 'Dirección de Marketing en Turismo'),
  ('Administración en Turismo', 8, 'Evaluación de Proyectos'),
  ('Administración en Turismo', 8, 'Gestión Social de Proyectos'),
  ('Administración en Turismo', 8, 'Planeamiento Estratégico'),
  ('Administración en Turismo', 8, 'Turismo Gastronómico Sostenible'),
  ('Administración en Turismo', 9, 'Consultoría Turística'),
  ('Administración en Turismo', 9, 'Seminario I'),
  ('Administración en Turismo', 9, 'Electivo I'),
  ('Administración en Turismo', 9, 'Electivo II'),
  ('Administración en Turismo', 10, 'Proyecto Integrador'),
  ('Administración en Turismo', 10, 'Seminario II'),
  ('Administración en Turismo', 10, 'Electivo III'),
  ('Administración en Turismo', 10, 'Electivo IV'),
  ('Arquitectura, Urbanismo y Territorio', 1, 'English I'),
  ('Arquitectura, Urbanismo y Territorio', 1, 'Matemática'),
  ('Arquitectura, Urbanismo y Territorio', 1, 'Lenguaje y Comunicación I'),
  ('Arquitectura, Urbanismo y Territorio', 1, 'Fundamentos en Competencias Digitales'),
  ('Arquitectura, Urbanismo y Territorio', 1, 'Expresión Gráfica Analógica 1'),
  ('Arquitectura, Urbanismo y Territorio', 1, 'Taller de Diseño I: Elementos'),
  ('Arquitectura, Urbanismo y Territorio', 2, 'English II'),
  ('Arquitectura, Urbanismo y Territorio', 2, 'Realidad Nacional y Globalización'),
  ('Arquitectura, Urbanismo y Territorio', 2, 'Lenguaje y Comunicación II'),
  ('Arquitectura, Urbanismo y Territorio', 2, 'Territorio y Hábitat Sostenible'),
  ('Arquitectura, Urbanismo y Territorio', 2, 'Expresión Gráfica Analógica 2'),
  ('Arquitectura, Urbanismo y Territorio', 2, 'Taller de Diseño II: Elementos'),
  ('Arquitectura, Urbanismo y Territorio', 3, 'English III'),
  ('Arquitectura, Urbanismo y Territorio', 3, 'Ética y Ciudadanía'),
  ('Arquitectura, Urbanismo y Territorio', 3, 'Administración para los Negocios'),
  ('Arquitectura, Urbanismo y Territorio', 3, 'Procesos de la Arquitectura 1'),
  ('Arquitectura, Urbanismo y Territorio', 3, 'Expresión Gráfica Analógica 3'),
  ('Arquitectura, Urbanismo y Territorio', 3, 'Taller de Diseño III: Sistemas'),
  ('Arquitectura, Urbanismo y Territorio', 4, 'English IV'),
  ('Arquitectura, Urbanismo y Territorio', 4, 'Fundamentos del Liderazgo Sostenible'),
  ('Arquitectura, Urbanismo y Territorio', 4, 'Principios de Economía'),
  ('Arquitectura, Urbanismo y Territorio', 4, 'Procesos de la Arquitectura 2'),
  ('Arquitectura, Urbanismo y Territorio', 4, 'Construcción 1'),
  ('Arquitectura, Urbanismo y Territorio', 4, 'Taller de Diseño IV: Espacios Urbanos y Territoriales'),
  ('Arquitectura, Urbanismo y Territorio', 5, 'Estadística Descriptiva e Inferencia Estadística'),
  ('Arquitectura, Urbanismo y Territorio', 5, 'Fundamentos Contables y Financieros'),
  ('Arquitectura, Urbanismo y Territorio', 5, 'Marketing'),
  ('Arquitectura, Urbanismo y Territorio', 5, 'Expresión Gráfica Digital 1'),
  ('Arquitectura, Urbanismo y Territorio', 5, 'Construcción 2'),
  ('Arquitectura, Urbanismo y Territorio', 5, 'Taller de Diseño V: Ciudades'),
  ('Arquitectura, Urbanismo y Territorio', 6, 'Metodología de la Investigación Científica'),
  ('Arquitectura, Urbanismo y Territorio', 6, 'Oportunidades de Negocios'),
  ('Arquitectura, Urbanismo y Territorio', 6, 'Sist. Inf. Geografía y Topografía'),
  ('Arquitectura, Urbanismo y Territorio', 6, 'Expresión Gráfica Digital 2'),
  ('Arquitectura, Urbanismo y Territorio', 6, 'Estructuras 1'),
  ('Arquitectura, Urbanismo y Territorio', 6, 'Taller de Diseño VI: Urbanismo'),
  ('Arquitectura, Urbanismo y Territorio', 7, 'Normatividad y Gestión'),
  ('Arquitectura, Urbanismo y Territorio', 7, 'Urban Historical Processes'),
  ('Arquitectura, Urbanismo y Territorio', 7, 'Sociedad, Ciudad y Territorio I'),
  ('Arquitectura, Urbanismo y Territorio', 7, 'Procesos de la Arquitectura Peruana'),
  ('Arquitectura, Urbanismo y Territorio', 7, 'Estructuras 2'),
  ('Arquitectura, Urbanismo y Territorio', 7, 'Taller de Diseño VII: Territorios'),
  ('Arquitectura, Urbanismo y Territorio', 8, 'Electivo 1'),
  ('Arquitectura, Urbanismo y Territorio', 8, 'Diseño Urbano'),
  ('Arquitectura, Urbanismo y Territorio', 8, 'Sociedad, Ciudad y Territorio II'),
  ('Arquitectura, Urbanismo y Territorio', 8, 'Arquitectura y Medioambiente'),
  ('Arquitectura, Urbanismo y Territorio', 8, 'Gestión en la Construcción'),
  ('Arquitectura, Urbanismo y Territorio', 8, 'Taller de Diseño VIII: Infraestructura'),
  ('Arquitectura, Urbanismo y Territorio', 9, 'Electivo 2'),
  ('Arquitectura, Urbanismo y Territorio', 9, 'Electivo 3'),
  ('Arquitectura, Urbanismo y Territorio', 9, 'Megaproyectos'),
  ('Arquitectura, Urbanismo y Territorio', 9, 'Sostenibilidad y Vivienda Social'),
  ('Arquitectura, Urbanismo y Territorio', 9, 'Seminario de Investigación y Tesis'),
  ('Arquitectura, Urbanismo y Territorio', 9, 'Taller de Diseño IX: Proyecto de Tesis'),
  ('Arquitectura, Urbanismo y Territorio', 10, 'Electivo 4'),
  ('Arquitectura, Urbanismo y Territorio', 10, 'Electivo 5'),
  ('Arquitectura, Urbanismo y Territorio', 10, 'Visión Geopolítica'),
  ('Arquitectura, Urbanismo y Territorio', 10, 'Seminario de Sostenibilidad Urbana'),
  ('Arquitectura, Urbanismo y Territorio', 10, 'Real Estate Marketing'),
  ('Arquitectura, Urbanismo y Territorio', 10, 'Proyecto Integrador'),
  ('Comunicaciones', 1, 'Desarrollo Humano'),
  ('Comunicaciones', 1, 'English I'),
  ('Comunicaciones', 1, 'Fundamentos de Matemática'),
  ('Comunicaciones', 1, 'Introducción a las Comunicaciones'),
  ('Comunicaciones', 1, 'Lenguaje I'),
  ('Comunicaciones', 2, 'Administración para los Negocios'),
  ('Comunicaciones', 2, 'English II'),
  ('Comunicaciones', 2, 'Estadística General'),
  ('Comunicaciones', 2, 'Lenguaje II'),
  ('Comunicaciones', 2, 'Taller de Comunicación Visual'),
  ('Comunicaciones', 3, 'Comunicación Escrita I'),
  ('Comunicaciones', 3, 'English III'),
  ('Comunicaciones', 3, 'Historia de la Comunicación'),
  ('Comunicaciones', 3, 'Marketing'),
  ('Comunicaciones', 3, 'Metodología de la Investigación'),
  ('Comunicaciones', 3, 'Realidad Nacional y Globalización'),
  ('Comunicaciones', 4, 'Comunicación Escrita II'),
  ('Comunicaciones', 4, 'English IV'),
  ('Comunicaciones', 4, 'Principios de Economía'),
  ('Comunicaciones', 4, 'Sociedad, Estado y Empresa'),
  ('Comunicaciones', 4, 'Teoría de la Comunicación'),
  ('Comunicaciones', 5, 'English V'),
  ('Comunicaciones', 5, 'Ética y Ciudadanía'),
  ('Comunicaciones', 5, 'Fotografía'),
  ('Comunicaciones', 5, 'Fundamentos de las Finanzas'),
  ('Comunicaciones', 5, 'Fundamentos del Periodismo'),
  ('Comunicaciones', 6, 'Comunicación Audiovisual'),
  ('Comunicaciones', 6, 'Comunicación Digital'),
  ('Comunicaciones', 6, 'Comunicación Empresarial'),
  ('Comunicaciones', 6, 'English VI: RREL'),
  ('Comunicaciones', 6, 'Fundamentos de la Publicidad'),
  ('Comunicaciones', 7, 'Comunicación Gráfica'),
  ('Comunicaciones', 7, 'Comunicación Intercultural'),
  ('Comunicaciones', 7, 'Psicología de la Comunicación'),
  ('Comunicaciones', 7, 'Electivo 1'),
  ('Comunicaciones', 7, 'Electivo 2'),
  ('Comunicaciones', 8, 'Investigación de Públicos'),
  ('Comunicaciones', 8, 'Sociología de la Comunicación'),
  ('Comunicaciones', 8, 'Taller de Radio'),
  ('Comunicaciones', 8, 'Electivo 3'),
  ('Comunicaciones', 8, 'Electivo 4'),
  ('Comunicaciones', 9, 'Comunicación y Globalización'),
  ('Comunicaciones', 9, 'Investigación en Comunicación I'),
  ('Comunicaciones', 9, 'Semiótica'),
  ('Comunicaciones', 9, 'Electivo 5'),
  ('Comunicaciones', 9, 'Electivo 6'),
  ('Comunicaciones', 10, 'Comunicación Política'),
  ('Comunicaciones', 10, 'Ética y Comunicación'),
  ('Comunicaciones', 10, 'Investigación en Comunicación II'),
  ('Comunicaciones', 10, 'Electivo 7'),
  ('Comunicaciones', 10, 'Electivo 8'),
  ('Administración de Empresas', 1, 'Comunicación Oral y Escrita'),
  ('Administración de Empresas', 1, 'Realidad Nacional'),
  ('Administración de Empresas', 1, 'English I'),
  ('Administración de Empresas', 1, 'Introducción Empresarial'),
  ('Administración de Empresas', 1, 'Matemática Básica'),
  ('Administración de Empresas', 2, 'Matemática Aplicada a los Negocios'),
  ('Administración de Empresas', 2, 'Tópicos Generales de la Ciencia de la Computación'),
  ('Administración de Empresas', 2, 'English II'),
  ('Administración de Empresas', 2, 'Filosofía y Ética'),
  ('Administración de Empresas', 3, 'English III'),
  ('Administración de Empresas', 3, 'Estadística Descriptiva e Inferencial'),
  ('Administración de Empresas', 3, 'Liderazgo y Sostenibilidad'),
  ('Administración de Empresas', 3, 'Introducción al Marketing'),
  ('Administración de Empresas', 3, 'Principios de Administración'),
  ('Administración de Empresas', 4, 'Metodología de la Investigación'),
  ('Administración de Empresas', 4, 'English IV'),
  ('Administración de Empresas', 4, 'Economía Básica'),
  ('Administración de Empresas', 4, 'Diseño de Procesos Organizacionales'),
  ('Administración de Empresas', 5, 'Contabilidad General'),
  ('Administración de Empresas', 5, 'Investigación de Mercados'),
  ('Administración de Empresas', 5, 'Habilidades Gerenciales'),
  ('Administración de Empresas', 5, 'Microeconomía'),
  ('Administración de Empresas', 6, 'Derecho Empresarial y Sociedades'),
  ('Administración de Empresas', 6, 'Comportamiento Organizacional'),
  ('Administración de Empresas', 6, 'Análisis e Interpretación de Estados Financieros'),
  ('Administración de Empresas', 6, 'Administración de Recursos Humanos'),
  ('Administración de Empresas', 7, 'Contabilidad de Costos'),
  ('Administración de Empresas', 7, 'Finanzas'),
  ('Administración de Empresas', 7, 'Gerencia de Operaciones y Logística'),
  ('Administración de Empresas', 7, 'Electivo I'),
  ('Administración de Empresas', 8, 'Contabilidad Gerencial'),
  ('Administración de Empresas', 8, 'Planeamiento Estratégico'),
  ('Administración de Empresas', 8, 'Derecho Tributario y Laboral'),
  ('Administración de Empresas', 8, 'Electivo II'),
  ('Administración de Empresas', 9, 'Evaluación de Proyectos'),
  ('Administración de Empresas', 9, 'Seminario de Tesis I'),
  ('Administración de Empresas', 9, 'Gerencia Estratégica'),
  ('Administración de Empresas', 9, 'Electivo III'),
  ('Administración de Empresas', 10, 'Proyecto Integrador'),
  ('Administración de Empresas', 10, 'Sistemas Integrados de Información Gerencial'),
  ('Administración de Empresas', 10, 'Seminario de Tesis II'),
  ('Administración de Empresas', 10, 'Electivo IV'),
  ('Medicina Humana', 1, 'Atención Integral'),
  ('Medicina Humana', 1, 'Desarrollo Humano'),
  ('Medicina Humana', 1, 'English I'),
  ('Medicina Humana', 1, 'Fundamentos de la Promoción de Salud'),
  ('Medicina Humana', 1, 'Integración de Estructura y Función del Organismo Humano'),
  ('Medicina Humana', 1, 'Lenguaje I'),
  ('Medicina Humana', 2, 'English II'),
  ('Medicina Humana', 2, 'Integración Morfofuncional del Sistema Nervioso'),
  ('Medicina Humana', 2, 'Lenguaje II'),
  ('Medicina Humana', 2, 'Pensamiento Matemático'),
  ('Medicina Humana', 2, 'Práctica y Profesionalismo Médico I'),
  ('Medicina Humana', 2, 'Proceso Químico-Biológicos y Nutrición'),
  ('Medicina Humana', 3, 'Bioestadística'),
  ('Medicina Humana', 3, 'English III'),
  ('Medicina Humana', 3, 'Bioquímica y Biología Molecular'),
  ('Medicina Humana', 3, 'Integración Morfofuncional del Sistema Cardio-Circulatorio'),
  ('Medicina Humana', 3, 'Integración Morfofuncional del Sistema Respiratorio'),
  ('Medicina Humana', 3, 'Nutrición y Estilos de Vida Saludable'),
  ('Medicina Humana', 3, 'Práctica y Profesionalismo Médico II'),
  ('Medicina Humana', 4, 'English IV'),
  ('Medicina Humana', 4, 'Genética y Enfermedad'),
  ('Medicina Humana', 4, 'Integración Morfofuncional del Sistema Digestivo'),
  ('Medicina Humana', 4, 'Integración Morfofuncional del Sistema Excretor'),
  ('Medicina Humana', 4, 'Mecanismos de Infección y Defensa'),
  ('Medicina Humana', 4, 'Metodología de la Investigación'),
  ('Medicina Humana', 4, 'Práctica y Profesionalismo Médico III'),
  ('Medicina Humana', 5, 'English V'),
  ('Medicina Humana', 5, 'Epidemiología'),
  ('Medicina Humana', 5, 'Integración Morfofuncional del Sistema Endocrino y Reproductor'),
  ('Medicina Humana', 5, 'Integración Morfofuncional del Sistema Hematopoyético'),
  ('Medicina Humana', 5, 'Métodos Estadísticos en Biociencias'),
  ('Medicina Humana', 5, 'Microbiología y Parasitología'),
  ('Medicina Humana', 5, 'Práctica y Profesionalismo Médico IV'),
  ('Medicina Humana', 6, 'English VI: PRE-IELTS'),
  ('Medicina Humana', 6, 'Ética y Ciudadanía'),
  ('Medicina Humana', 6, 'Farmacología'),
  ('Medicina Humana', 6, 'Integración Fisiopatológica'),
  ('Medicina Humana', 6, 'Introducción a la Clínica e Interpretación de Exámenes Auxiliares'),
  ('Medicina Humana', 6, 'Salud Pública'),
  ('Medicina Humana', 7, 'Diagnóstico Comunitario'),
  ('Medicina Humana', 7, 'Especialidades I'),
  ('Medicina Humana', 7, 'Principios de Nutrición Clínica y Funcional'),
  ('Medicina Humana', 7, 'Principios de Introducción a la Medicina P4'),
  ('Medicina Humana', 7, 'Realidad Nacional y Globalización'),
  ('Medicina Humana', 7, 'Terapéutica Integrada'),
  ('Medicina Humana', 8, 'Especialidades II'),
  ('Medicina Humana', 8, 'Geriatría'),
  ('Medicina Humana', 8, 'Medicina Física y del Deporte'),
  ('Medicina Humana', 8, 'Nutrición Funcional Aplicada a Especialidades Clínicas y Sistemas'),
  ('Medicina Humana', 8, 'Salud Mental y Psiquiatría'),
  ('Medicina Humana', 8, 'Electivo 1'),
  ('Medicina Humana', 9, 'Aplicación Clínica de la Medicina P4'),
  ('Medicina Humana', 9, 'Cirugía y Traumatología'),
  ('Medicina Humana', 9, 'Gestión en Salud'),
  ('Medicina Humana', 9, 'Salud Global y Sistemas de Salud'),
  ('Medicina Humana', 9, 'Oncología Médica'),
  ('Medicina Humana', 9, 'Tesis I'),
  ('Medicina Humana', 10, 'Aspectos Legales de la Práctica Médica y Patología Forense'),
  ('Medicina Humana', 10, 'Emergencias y Desastres'),
  ('Medicina Humana', 10, 'Ginecología y Obstetricia'),
  ('Medicina Humana', 10, 'Liderazgo, Innovación y Emprendimiento en Salud'),
  ('Medicina Humana', 10, 'Pediatría'),
  ('Medicina Humana', 10, 'Electivo 2'),
  ('Medicina Humana', 11, 'Externado en Medicina'),
  ('Medicina Humana', 11, 'Externado en Cirugía y Traumatología'),
  ('Medicina Humana', 11, 'Tesis II'),
  ('Medicina Humana', 11, 'Electivo 3'),
  ('Medicina Humana', 11, 'Electivo 4'),
  ('Medicina Humana', 12, 'Externado en Pediatría'),
  ('Medicina Humana', 12, 'Externado en Gineco-obstetricia'),
  ('Medicina Humana', 12, 'Bioética'),
  ('Medicina Humana', 13, 'Internado en Pediatría'),
  ('Medicina Humana', 13, 'Internado en Medicina'),
  ('Medicina Humana', 14, 'Internado en Cirugía'),
  ('Medicina Humana', 14, 'Internado en Ginecología y Obstetricia'),
  ('Derecho', 1, 'Realidad Nacional y Globalización'),
  ('Derecho', 1, 'Lenguaje y Comunicación I'),
  ('Derecho', 1, 'Matemática'),
  ('Derecho', 1, 'Fundamentos en Competencias Digitales'),
  ('Derecho', 1, 'Imaginación del Futuro y Creatividad'),
  ('Derecho', 1, 'English I'),
  ('Derecho', 2, 'Lenguaje y Comunicación II'),
  ('Derecho', 2, 'English II'),
  ('Derecho', 2, 'Filosofía y Lógica'),
  ('Derecho', 2, 'Introducción al Derecho'),
  ('Derecho', 2, 'Derecho Constitucional'),
  ('Derecho', 3, 'Ética y Ciudadanía'),
  ('Derecho', 3, 'English III'),
  ('Derecho', 3, 'Teoría General del Derecho'),
  ('Derecho', 3, 'Derecho de Personas'),
  ('Derecho', 3, 'Derecho Penal I'),
  ('Derecho', 3, 'Derecho Procesal Constitucional'),
  ('Derecho', 4, 'Fundamentos del Liderazgo Sostenible'),
  ('Derecho', 4, 'Metodología de la Investigación Científica'),
  ('Derecho', 4, 'English IV'),
  ('Derecho', 4, 'Product Design in Legaltech'),
  ('Derecho', 4, 'Acto Jurídico y Obligaciones'),
  ('Derecho', 4, 'Derecho Penal II'),
  ('Derecho', 5, 'Filosofía del Derecho'),
  ('Derecho', 5, 'Derechos Reales'),
  ('Derecho', 5, 'Derecho de Contratos'),
  ('Derecho', 5, 'Derecho de Familia'),
  ('Derecho', 5, 'Derecho Administrativo I'),
  ('Derecho', 6, 'Argumentación Jurídica'),
  ('Derecho', 6, 'Derecho Administrativo II'),
  ('Derecho', 6, 'Derecho Procesal Civil'),
  ('Derecho', 6, 'Derecho Laboral Empresarial'),
  ('Derecho', 6, 'Derecho Corporativo I'),
  ('Derecho', 7, 'Derecho Tributario'),
  ('Derecho', 7, 'Derecho Corporativo II'),
  ('Derecho', 7, 'Bioderecho'),
  ('Derecho', 7, 'Responsabilidad Civil'),
  ('Derecho', 7, 'International Law'),
  ('Derecho', 8, 'Growth and Management for Startups'),
  ('Derecho', 8, 'Arbitraje'),
  ('Derecho', 8, 'Deontología Jurídica'),
  ('Derecho', 8, 'Seminario de Investigación I'),
  ('Derecho', 8, 'Anglo American Law and Case Analysis'),
  ('Derecho', 9, 'Derecho de la Competencia y del Consumidor'),
  ('Derecho', 9, 'Derecho Penal Económico'),
  ('Derecho', 9, 'Seminario de Investigación II'),
  ('Derecho', 9, 'Electivo 1'),
  ('Derecho', 9, 'Electivo 2'),
  ('Derecho', 10, 'Seminario de Investigación III'),
  ('Derecho', 10, 'Derecho Bancario y Financiero'),
  ('Derecho', 10, 'Electivo 3'),
  ('Derecho', 10, 'Electivo 4'),
  ('Derecho', 10, 'Electivo 5'),
  ('Educación Inicial', 1, 'Desarrollo Humano'),
  ('Educación Inicial', 1, 'English I'),
  ('Educación Inicial', 1, 'Lenguaje I'),
  ('Educación Inicial', 1, 'Matemática'),
  ('Educación Inicial', 1, 'Administración para los Negocios'),
  ('Educación Inicial', 2, 'Biología'),
  ('Educación Inicial', 2, 'Cultura Política y Realidad de la Educación Peruana'),
  ('Educación Inicial', 2, 'English II'),
  ('Educación Inicial', 2, 'Lenguaje II'),
  ('Educación Inicial', 2, 'Marketing'),
  ('Educación Inicial', 2, 'Psicología General'),
  ('Educación Inicial', 3, 'English III'),
  ('Educación Inicial', 3, 'Estadística General'),
  ('Educación Inicial', 3, 'Informática Aplicada a la Educación'),
  ('Educación Inicial', 3, 'Interpretación de Textos'),
  ('Educación Inicial', 3, 'Realidad Nacional y Globalización'),
  ('Educación Inicial', 3, 'Teoría de la Educación'),
  ('Educación Inicial', 4, 'Acompañamiento Temprano'),
  ('Educación Inicial', 4, 'Alimentación y Nutrición'),
  ('Educación Inicial', 4, 'English IV'),
  ('Educación Inicial', 4, 'Metodología de la Investigación'),
  ('Educación Inicial', 4, 'Principios de Economía'),
  ('Educación Inicial', 5, 'English V'),
  ('Educación Inicial', 5, 'Fundamentos de las Finanzas'),
  ('Educación Inicial', 5, 'Estrategias de Enseñanza y Aprendizaje'),
  ('Educación Inicial', 5, 'Psicología del Infante'),
  ('Educación Inicial', 5, 'Psicomotricidad'),
  ('Educación Inicial', 5, 'Ética y Ciudadanía'),
  ('Educación Inicial', 6, 'Aprestamiento a la Lectoescritura'),
  ('Educación Inicial', 6, 'Desarrollo de Habilidades Lingüísticas'),
  ('Educación Inicial', 6, 'Diseño y Programación Curricular'),
  ('Educación Inicial', 6, 'English VI: RREL'),
  ('Educación Inicial', 6, 'Psicología del Aprendizaje'),
  ('Educación Inicial', 6, 'Software Educativo'),
  ('Educación Inicial', 7, 'Desarrollo de la Expresión Gráfico-Plástica'),
  ('Educación Inicial', 7, 'Estrategias de Evaluación de los Aprendizajes'),
  ('Educación Inicial', 7, 'Investigación Educacional'),
  ('Educación Inicial', 7, 'Literatura para Niños'),
  ('Educación Inicial', 7, 'Proyecto Integrador'),
  ('Educación Inicial', 7, 'Introducción a la Psicomotricidad'),
  ('Educación Inicial', 7, 'Introducción a la Estimulación Temprana'),
  ('Educación Inicial', 8, 'Desarrollo de la Educación Musical'),
  ('Educación Inicial', 8, 'Didáctica para Lógico Matemático'),
  ('Educación Inicial', 8, 'Diseño de Instrumentos de Evaluación'),
  ('Educación Inicial', 8, 'Organización de la Información'),
  ('Educación Inicial', 8, 'Práctica Preprofesional Inicial'),
  ('Educación Inicial', 8, 'Desarrollo Psico. del Niño de 3 a 5 años'),
  ('Educación Inicial', 8, 'Desarrollo de la Estimulación Temprana'),
  ('Educación Inicial', 9, 'Didáctica para Ciencia y Ambiente'),
  ('Educación Inicial', 9, 'Didáctica para Personal Social'),
  ('Educación Inicial', 9, 'Planificación de Clases y Actividades'),
  ('Educación Inicial', 9, 'Práctica Preprofesional Intermedia'),
  ('Educación Inicial', 9, 'Sistematización de la Información'),
  ('Educación Inicial', 9, 'Diseño de Sesiones de Psicomotricidad'),
  ('Educación Inicial', 9, 'Diseño de Sesiones de Estimulación Temprana'),
  ('Educación Inicial', 10, 'Coaching Educativo'),
  ('Educación Inicial', 10, 'Gerencia y Legislación en Instituciones Educativas'),
  ('Educación Inicial', 10, 'Informe y Sustentación del Proyecto de Investigación'),
  ('Educación Inicial', 10, 'Práctica Preprofesional Intensiva'),
  ('Educación Inicial', 10, 'Títeres y Libretos'),
  ('Educación Inicial', 10, 'Desarrollo de Actividades de Psicomotricidad'),
  ('Educación Inicial', 10, 'Desarrollo de Actividades de Estimulación Temprana')
on conflict (career, cycle, course_name) do nothing;

create index if not exists tickets_owner_updated_idx on public.tickets(owner_id, updated_at desc);
create index if not exists ticket_messages_ticket_created_idx on public.ticket_messages(ticket_id, created_at);
create index if not exists complaints_owner_created_idx on public.complaints(owner_id, created_at desc);
create index if not exists complaint_messages_complaint_created_idx on public.complaint_messages(complaint_id, created_at);
create index if not exists community_posts_created_idx on public.community_posts(created_at desc);
create index if not exists community_comments_post_created_idx on public.community_comments(post_id, created_at);
create index if not exists community_reports_pending_idx on public.community_reports(status, created_at);

create or replace function public.is_navia_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.set_student_profile(
  p_display_name text,
  p_student_code text,
  p_career text,
  p_cycle integer,
  p_goal text
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if length(trim(coalesce(p_display_name, ''))) < 2
    or length(trim(coalesce(p_career, ''))) < 2
    or p_cycle is null or p_cycle < 1 or p_cycle > 20 then
    raise exception 'Invalid student profile';
  end if;

  insert into public.profiles (id, email, display_name, student_code, career, cycle, goal)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    trim(p_display_name),
    nullif(trim(p_student_code), ''),
    trim(p_career),
    p_cycle,
    coalesce(nullif(trim(p_goal), ''), 'Ninguno')
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    student_code = excluded.student_code,
    career = excluded.career,
    cycle = excluded.cycle,
    goal = excluded.goal,
    updated_at = now()
  returning * into saved;

  insert into public.community_public_profiles (user_id, display_name)
  values (auth.uid(), trim(p_display_name))
  on conflict (user_id) do update set
    display_name = excluded.display_name,
    updated_at = now();

  return saved;
end;
$$;

create or replace function public.reset_community_post_likes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.likes := 0;
  return new;
end;
$$;

drop trigger if exists community_posts_reset_likes on public.community_posts;
create trigger community_posts_reset_likes
before insert on public.community_posts
for each row execute function public.reset_community_post_likes();

create or replace function public.assign_ticket_priority()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.priority := case
    when new.category in ('platform_outage', 'data_security') then 'critical'
    when new.category in ('academic_recommendation', 'academic_history') then 'high'
    when new.category in ('visual_issue') then 'low'
    else 'medium'
  end;
  return new;
end;
$$;

drop trigger if exists tickets_set_priority on public.tickets;
create trigger tickets_set_priority
before insert or update of category on public.tickets
for each row execute function public.assign_ticket_priority();

create or replace function public.touch_ticket_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.tickets set updated_at = now() where id = new.ticket_id;
  return new;
end;
$$;

create or replace function public.attach_ticket_file(p_ticket_id uuid, p_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or split_part(p_path, '/', 1) <> p_ticket_id::text then
    raise exception 'Invalid ticket attachment';
  end if;

  update public.tickets
  set attachment_path = p_path, updated_at = now()
  where id = p_ticket_id and owner_id = auth.uid() and status <> 'closed';

  if not found then
    raise exception 'Ticket not found or closed';
  end if;
end;
$$;

create or replace function public.create_ticket_with_message(
  p_subject text,
  p_category text,
  p_body text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  created public.tickets;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.tickets (owner_id, subject, category, priority)
  values (auth.uid(), trim(p_subject), p_category, 'medium')
  returning * into created;

  insert into public.ticket_messages (ticket_id, author_id, body)
  values (created.id, auth.uid(), trim(p_body));

  return to_jsonb(created);
end;
$$;

create or replace function public.set_ticket_status(p_ticket_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('open', 'in_progress', 'closed') then
    raise exception 'Invalid ticket status';
  end if;
  if not public.is_navia_admin() and not (
    p_status = 'closed'
    and exists (
      select 1 from public.tickets t
      where t.id = p_ticket_id and t.owner_id = auth.uid() and t.status <> 'closed'
    )
  ) then
    raise exception 'Administrator access required';
  end if;
  update public.tickets set status = p_status, updated_at = now() where id = p_ticket_id;
  if not found then
    raise exception 'Ticket not found';
  end if;
end;
$$;

create or replace function public.toggle_community_like(p_post_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  resulting_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if exists (
    select 1 from public.community_likes
    where post_id = p_post_id and user_id = auth.uid()
  ) then
    delete from public.community_likes where post_id = p_post_id and user_id = auth.uid();
    update public.community_posts set likes = greatest(likes - 1, 0) where id = p_post_id;
  else
    insert into public.community_likes (post_id, user_id) values (p_post_id, auth.uid());
    update public.community_posts set likes = likes + 1 where id = p_post_id;
  end if;

  select likes into resulting_count from public.community_posts where id = p_post_id;
  return resulting_count;
end;
$$;

create or replace function public.refresh_community_reputation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.community_public_profiles
  set reputation = coalesce((
    select sum(likes)::integer from public.community_posts where author_id = new.author_id
  ), 0)
  where user_id = new.author_id;
  return new;
end;
$$;

drop trigger if exists community_post_reputation on public.community_posts;
create trigger community_post_reputation
after insert or update of likes on public.community_posts
for each row execute function public.refresh_community_reputation();

drop trigger if exists ticket_messages_touch_ticket on public.ticket_messages;
create trigger ticket_messages_touch_ticket
after insert on public.ticket_messages
for each row execute function public.touch_ticket_updated_at();

alter table public.profiles enable row level security;
alter table public.student_data enable row level security;
alter table public.community_public_profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_messages enable row level security;
alter table public.community_posts enable row level security;
alter table public.curriculum_courses enable row level security;
alter table public.community_reports enable row level security;

drop policy if exists "profiles_read_self_or_admin" on public.profiles;
create policy "profiles_read_self_or_admin" on public.profiles
for select to authenticated using (id = (select auth.uid()) or (select public.is_navia_admin()));

drop policy if exists "student_data_owner_or_admin" on public.student_data;
create policy "student_data_owner_or_admin" on public.student_data
for all to authenticated
using (user_id = (select auth.uid()) or (select public.is_navia_admin()))
with check (user_id = (select auth.uid()) or (select public.is_navia_admin()));

drop policy if exists "community_public_profiles_read" on public.community_public_profiles;
create policy "community_public_profiles_read" on public.community_public_profiles
for select to authenticated using (true);

drop policy if exists "tickets_read_owner_or_admin" on public.tickets;
create policy "tickets_read_owner_or_admin" on public.tickets
for select to authenticated
using (owner_id = (select auth.uid()) or (select public.is_navia_admin()));

drop policy if exists "tickets_create_owner" on public.tickets;
create policy "tickets_create_owner" on public.tickets
for insert to authenticated with check (owner_id = (select auth.uid()));

drop policy if exists "ticket_messages_read_participants" on public.ticket_messages;
create policy "ticket_messages_read_participants" on public.ticket_messages
for select to authenticated using (
  exists (
    select 1 from public.tickets t where t.id = ticket_id
      and (t.owner_id = (select auth.uid()) or (select public.is_navia_admin()))
  )
);

drop policy if exists "ticket_messages_add_participants" on public.ticket_messages;
create policy "ticket_messages_add_participants" on public.ticket_messages
for insert to authenticated with check (
  author_id = (select auth.uid())
  and exists (
    select 1 from public.tickets t where t.id = ticket_id
      and t.status <> 'closed'
      and (t.owner_id = (select auth.uid()) or (select public.is_navia_admin()))
  )
);

drop policy if exists "complaints_create_owner" on public.complaints;
create policy "complaints_create_owner" on public.complaints
for insert to authenticated with check (owner_id = (select auth.uid()));

drop policy if exists "complaints_read_owner_or_admin" on public.complaints;
create policy "complaints_read_owner_or_admin" on public.complaints
for select to authenticated using (owner_id = (select auth.uid()) or (select public.is_navia_admin()));

drop policy if exists "complaints_update_admin" on public.complaints;
create policy "complaints_update_admin" on public.complaints
for update to authenticated using ((select public.is_navia_admin()))
with check ((select public.is_navia_admin()));

drop policy if exists "complaint_messages_read_participants" on public.complaint_messages;
create policy "complaint_messages_read_participants" on public.complaint_messages
for select to authenticated using (
  exists (
    select 1 from public.complaints c where c.id = complaint_id
      and (c.owner_id = (select auth.uid()) or (select public.is_navia_admin()))
  )
);

drop policy if exists "complaint_messages_add_admin" on public.complaint_messages;
create policy "complaint_messages_add_admin" on public.complaint_messages
for insert to authenticated with check (
  author_id = (select auth.uid()) and (select public.is_navia_admin())
);

drop policy if exists "community_posts_read_visible" on public.community_posts;
create policy "community_posts_read_visible" on public.community_posts
for select to authenticated using (status <> 'hidden' or (select public.is_navia_admin()));

drop policy if exists "community_posts_create_self" on public.community_posts;
create policy "community_posts_create_self" on public.community_posts
for insert to authenticated with check (author_id = (select auth.uid()));

drop policy if exists "community_posts_delete_self" on public.community_posts;
create policy "community_posts_delete_self" on public.community_posts
for delete to authenticated using (author_id = (select auth.uid()));

drop policy if exists "community_posts_moderate" on public.community_posts;
create policy "community_posts_moderate" on public.community_posts
for update to authenticated using ((select public.is_navia_admin()))
with check ((select public.is_navia_admin()));

drop policy if exists "curriculum_courses_read_authenticated" on public.curriculum_courses;
create policy "curriculum_courses_read_authenticated" on public.curriculum_courses
for select to authenticated using (true);

drop policy if exists "community_reports_create_self" on public.community_reports;
create policy "community_reports_create_self" on public.community_reports
for insert to authenticated with check (
  reporter_id = (select auth.uid())
  and (
    (post_id is not null and exists (
      select 1 from public.community_posts p
      where p.id = post_id and p.author_id <> (select auth.uid()) and p.status <> 'hidden'
    ))
    or (comment_id is not null and exists (
      select 1 from public.community_comments c
      join public.community_posts p on p.id = c.post_id
      where c.id = comment_id and c.author_id <> (select auth.uid())
        and c.status = 'visible' and p.status <> 'hidden'
    ))
  )
);

drop policy if exists "community_reports_read_own_or_admin" on public.community_reports;
create policy "community_reports_read_own_or_admin" on public.community_reports
for select to authenticated using (reporter_id = (select auth.uid()) or (select public.is_navia_admin()));

drop policy if exists "community_reports_moderate" on public.community_reports;
create policy "community_reports_moderate" on public.community_reports
for update to authenticated using ((select public.is_navia_admin()))
with check ((select public.is_navia_admin()));

drop policy if exists "community_comments_read_visible" on public.community_comments;
create policy "community_comments_read_visible" on public.community_comments
for select to authenticated using (
  (status = 'visible' and exists (
    select 1 from public.community_posts p
    where p.id = post_id and p.status <> 'hidden'
  )) or (select public.is_navia_admin())
);

drop policy if exists "community_comments_create_self" on public.community_comments;
create policy "community_comments_create_self" on public.community_comments
for insert to authenticated with check (
  author_id = (select auth.uid())
  and status = 'visible'
  and exists (
    select 1 from public.community_posts p
    where p.id = post_id and p.status <> 'hidden'
  )
);

drop policy if exists "community_comments_moderate" on public.community_comments;
create policy "community_comments_moderate" on public.community_comments
for update to authenticated using ((select public.is_navia_admin()))
with check ((select public.is_navia_admin()));

drop policy if exists "community_comments_delete_self" on public.community_comments;
create policy "community_comments_delete_self" on public.community_comments
for delete to authenticated using (author_id = (select auth.uid()));

alter table public.community_likes enable row level security;
alter table public.community_comments enable row level security;

drop policy if exists "community_likes_read_own" on public.community_likes;
create policy "community_likes_read_own" on public.community_likes
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "community_likes_create_self" on public.community_likes;
create policy "community_likes_create_self" on public.community_likes
for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "community_likes_delete_self" on public.community_likes;
create policy "community_likes_delete_self" on public.community_likes
for delete to authenticated using (user_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ticket-attachments', 'ticket-attachments', false, 5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "ticket_files_upload_owner" on storage.objects;
create policy "ticket_files_upload_owner" on storage.objects
for insert to authenticated with check (
  bucket_id = 'ticket-attachments'
  and exists (
    select 1 from public.tickets t
    where t.id::text = (storage.foldername(name))[1]
      and t.owner_id = (select auth.uid()) and t.status <> 'closed'
  )
);

drop policy if exists "ticket_files_read_participants" on storage.objects;
create policy "ticket_files_read_participants" on storage.objects
for select to authenticated using (
  bucket_id = 'ticket-attachments'
  and exists (
    select 1 from public.tickets t
    where t.id::text = (storage.foldername(name))[1]
      and (t.owner_id = (select auth.uid()) or (select public.is_navia_admin()))
  )
);

grant execute on function public.is_navia_admin() to authenticated;
grant execute on function public.set_student_profile(text, text, text, integer, text) to authenticated;
grant execute on function public.attach_ticket_file(uuid, text) to authenticated;
grant execute on function public.create_ticket_with_message(text, text, text) to authenticated;
grant execute on function public.set_ticket_status(uuid, text) to authenticated;
grant execute on function public.toggle_community_like(uuid) to authenticated;
grant select on public.profiles to authenticated;
grant select on public.community_public_profiles to authenticated;
grant select on public.curriculum_courses to authenticated;
grant select, insert, update on public.student_data to authenticated;
grant select, insert on public.tickets to authenticated;
grant select, insert on public.ticket_messages to authenticated;
grant select, insert, update on public.complaints to authenticated;
grant select, insert on public.complaint_messages to authenticated;
grant select, insert, delete on public.community_posts to authenticated;
grant select, insert, update on public.community_reports to authenticated;
grant select, insert, delete on public.community_likes to authenticated;
grant select, insert, update, delete on public.community_comments to authenticated;

revoke all on function public.set_student_profile(text, text, text, integer, text) from public, anon;
revoke all on function public.attach_ticket_file(uuid, text) from public, anon;
revoke all on function public.create_ticket_with_message(text, text, text) from public, anon;
revoke all on function public.set_ticket_status(uuid, text) from public, anon;
revoke all on function public.toggle_community_like(uuid) from public, anon;
