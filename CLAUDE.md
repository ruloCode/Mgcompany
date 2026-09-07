# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MG Company Group - Sitio web de productora artistica integral construido con Next.js 15. El sitio presenta artistas, unidades de negocio (MG Music, MG Film, MG Up, MG Live), contenido audiovisual (MG Flow), galeria, y un sistema de registro de eventos con generacion de codigos QR.

## Development Commands

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture

### Core Technology Stack
- **Framework**: Next.js 15 (App Router with React 19)
- **Database/Auth**: Supabase (authentication + PostgreSQL)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Form Handling**: React Hook Form + Zod validation
- **Animations**: Framer Motion + Embla Carousel
- **QR Codes**: qrcode.react (generation), @yudiel/react-qr-scanner (scanning)
- **Fonts**: Bebas Neue (headings), Inter (body)

### Project Structure
```
app/
  ├── page.tsx                    # Home (video hero, artistas, unidades, MG Flow teaser)
  ├── artistas/
  │   ├── page.tsx                # Listado de artistas con filtros
  │   └── [slug]/page.tsx         # Detalle de artista
  ├── nosotros/page.tsx           # Sobre MG Company Group
  ├── contacto/page.tsx           # Formulario de contacto
  ├── proyectos/
  │   ├── page.tsx                # Unidades de negocio
  │   └── [slug]/page.tsx         # Detalle de unidad
  ├── mg-flow/
  │   ├── page.tsx                # Shows y contenido audiovisual
  │   └── [slug]/page.tsx         # Detalle de show con episodios
  ├── galeria/page.tsx            # Galeria de fotos y videos
  ├── registro/page.tsx           # Registro de eventos con QR
  ├── admin/
  │   ├── page.tsx                # Admin dashboard (protected)
  │   └── login/page.tsx          # Admin login
  ├── layout.tsx                  # Root layout with metadata
  └── globals.css                 # Global styles
components/
  ├── site-header.tsx             # Navigation header (7 rutas + acceso discreto a /admin)
  ├── site-footer.tsx             # Footer with links + social
  ├── hero-logo.tsx               # Parallax hero with text
  ├── video-hero.tsx              # Full-screen video hero
  ├── featured-artists-carousel.tsx # Embla carousel for artists
  ├── business-units-grid.tsx     # Grid of 4 business units
  ├── netflix-carousel.tsx        # Horizontal scroll carousel
  ├── show-card.tsx               # MG Flow show card
  ├── gallery-grid.tsx            # Filterable photo/video gallery
  ├── section-heading.tsx         # Reusable section heading
  ├── platform-links.tsx          # Social/streaming platform icons
  ├── contact-form.tsx            # Contact form with validation
  ├── masonry-grid.tsx            # Artist masonry grid
  ├── artist-card.tsx             # Artist card component
  ├── artist-filter.tsx           # Artist search/filter
  ├── scrolling-text.tsx          # Animated scrolling text
  ├── registration-form.tsx       # Event registration with QR
  ├── audio-player.tsx            # Background audio player
  └── ui/                         # shadcn/ui component library
lib/
  ├── types.ts                    # TypeScript interfaces (Artist, BusinessUnit, MGFlowShow, etc.)
  ├── mock-data.ts                # Mock data and helper functions
  ├── supabase.ts                 # Supabase client + validation
  └── utils.ts                    # Utility functions (cn, etc.)
middleware.ts                     # Auth middleware for /admin routes
```

### Brand Identity
- **Primary Color**: `#E8200C` (MG Red) - CSS variable `--primary`, Tailwind `mg-red`
- **Background**: `#111111` (MG Black) - CSS variable `--background`, Tailwind `mg-black`
- **Text**: `#FFFFFF` (White)
- **Heading Font**: Bebas Neue (`font-heading`, `--font-bebas`)
- **Body Font**: Inter (`font-body`, `--font-inter`)
- **Typography Classes**: `.text-display`, `.text-hero`, `.text-heading` use Bebas Neue

### Data Model
- **Artist**: id, slug, name, bio, social_links, media, discography, videos, featured, shape
- **BusinessUnit**: slug, name, tagline, description, services[]
- **MGFlowShow**: slug, title, description, category, episodes[]
- **GalleryItem**: type (photo|video), url, category (estudio|en-vivo|eventos|bts)
- **TeamMember**: name, role, photo_url, bio

### Routes
| Route | Description |
|-------|------------|
| `/` | Home - video hero, featured artists, business units, MG Flow teaser |
| `/artistas` | Artist roster with search/filter |
| `/artistas/[slug]` | Artist detail with bio, discography, videos |
| `/nosotros` | About - mission, team, values |
| `/contacto` | Contact form + company info |
| `/proyectos` | Business units overview |
| `/proyectos/[slug]` | Business unit detail + services |
| `/mg-flow` | Shows listing (Netflix-style carousels) |
| `/mg-flow/[slug]` | Show detail with episode list |
| `/galeria` | Photo/video gallery with category filters |
| `/registro` | Redirect a `/gala` (era una maqueta que no guardaba nada) |
| `/gala` | Landing y registro de la **Gala MG** (vie 11 sep, 5–9 p.m., aforo 80) |
| `/gala/pase/[codigo]` | Pase de entrada con QR. Solo existe si el registro está `confirmed` |
| `/mg1` | Redirect a `/mg1/convocatoria` |
| `/mg1/convocatoria` | Landing publica del Concurso MG1 + formulario de inscripcion (persiste en Supabase) |
| `/mg1/jurado/[invitado]` | Invitacion privada de jurado, parametrizada por slug |
| `/admin/login` | Acceso al panel (entrar / crear cuenta) |
| `/admin/mi-trabajo` | Lo asignado a ti: atrasado / hoy / esta semana / despues |
| `/admin/bandeja` | Avisos: asignaciones, menciones, proyectos en riesgo |
| `/admin/area` | Companeros del area, su agenda a 30 dias y el canal del area |
| `/admin` | Panel · Resumen: KPIs, alertas y proximos eventos. Con rol `produccion` renderiza otra pantalla (`InicioProduccion`) |
| `/admin/cartera` | Semaforo de salud por proyecto + historial de reportes |
| `/admin/reuniones` | Actas: del resumen a los compromisos con responsable y fecha |
| `/admin/reuniones/[id]` | Detalle de un acta: decisiones, riesgos, pendientes, hilo |
| `/admin/carga` | Compromisos por persona y semana contra su capacidad |
| `/admin/calendario` | Calendario mensual de todos los eventos derivados |
| `/admin/timeline` | Gantt de campanas (pre / release / post) |
| `/admin/estudio` | Sesiones de grabacion agendadas por capacidad |
| `/admin/artistas` | Roster y proyectos, editables en linea |
| `/admin/fiestas` | Residencia mensual de showcases |
| `/admin/redes` | Calendario de contenido (8 sub-vistas + composer) |
| `/admin/radar` | Scouting del ecosistema con puntaje por rol |
| `/admin/mg1` | Curaduria de las inscripciones de la convocatoria |
| `/admin/gala` | Admisiones y acreditación de la Gala MG |
| `/admin/plan` | Reglas del motor de fechas y capacidad de estudio |
| `/admin/equipo` | Miembros, roles y activacion de cuentas (owner/admin) |
| `/admin/datos` | Respaldos y bitacora completa |

Las rutas en `STANDALONE_PREFIXES` (`components/site-chrome.tsx`) se renderizan sin
header/footer del sitio: hoy `/mg1/jurado`, `/mg1/convocatoria`, `/admin` y
`/gala/pase` (el pase se abre en la puerta: solo tiene que caber el QR).

## Panel administrativo (`/admin`)

Centro de operaciones interno. Portado del prototipo `mg-dashboard_1.html`
(localStorage) a Next.js + Supabase.

### La idea central: el calendario no se guarda, se deriva

Cada proyecto proyecta sus hitos **hacia atras desde su fecha de release**
aplicando las reglas de `mg_config` (programacion hacia atras + colchones tipo
cadena critica). Las sesiones de grabacion se agendan encima con un algoritmo
EDF sobre la capacidad real del estudio. Cambiar una fecha de release recalcula
todo el proyecto en cascada.

Lo unico que se **persiste** del calendario son las excepciones:

- `mg_eventos_estado` — fecha movida a mano, hito hecho, evento cancelado,
  **responsable y prioridad**
- `mg_eventos_extra` — eventos creados a mano

Corolario: como `mg_eventos_extra` permite crear eventos a mano y
`mg_eventos_estado` les pone responsable, **el modelo de eventos ES el modelo de
tareas**. No hay ni debe haber una entidad `tarea` aparte.

### Dos ejes que se confunden facil

`mg_proyectos.estado` describe la **produccion musical** (mezcla, seleccion de
masters). `mg_proyectos.salud` describe si **llega a la fecha** (`en_curso`,
`en_riesgo`, `desviado`). Un proyecto puede estar en mezcla Y desviado.

Por eso los ids son TEXT y no uuid: el motor compone ids derivados
(`p3:release`, `p3:ses2`, `party:2026-11`, `post:xxx`) y las excepciones apuntan
a ese id. Con uuids habria que mantener una tabla de traduccion sin ganar nada.

### Estructura

```
lib/mg/
  tipos.ts         # modelo de dominio
  fechas.ts        # utilidades YYYY-MM-DD (Date al mediodia: sin desfases de zona)
  constantes.ts    # tipos de evento, estados, PLATS, PILARES, CATS del radar, SPECS
  motor.ts         # eventosProyecto, agendarSesiones, eventosFiestas, calcularAlertas
  radar.ts         # puntaje 0-100 por categoria + recomendacion
  plan.ts          # plan automatico de contenido por lanzamiento, nomenclatura de assets
  permisos.ts      # matriz de roles + lista blanca de secciones por rol y
                   # guardia de ruta (espejo en cliente de lo que impone RLS)
  datos.ts         # server-only: carga el Snapshot y el perfil actual
lib/supabase/
  client.ts        # navegador
  server.ts        # Server Components / Actions
  middleware.ts    # refresco de sesion + guardia de /admin
app/admin/
  acciones.ts      # todas las Server Actions (cada una valida permiso y deja bitacora)
  panel.css        # sistema visual del panel (tema en [data-tema] sobre .panel)
  login/           # fuera del layout autenticado, a proposito
  (panel)/         # route group: todo lo que exige perfil activo
components/admin/  # vistas, cada una cliente sobre el Snapshot que le pasa el server
```

`app/admin/login` NO puede vivir dentro del route group `(panel)`: ese layout
exige perfil activo y redirige a `/admin/login`, lo que causaria un bucle.

### Roles

`owner` · `admin` · `manager` · `contenido` · `produccion` · `artista` · `viewer`
(ver `lib/mg/permisos.ts` y la tabla en `/admin/equipo`).

La autoridad real es **RLS en Postgres**, no la interfaz. Las policies llaman a
funciones SECURITY DEFINER (`es_staff()`, `puede_operar()`, `puede_publicar()`,
`es_admin()`, `es_produccion()`, `mi_artista_id()`) — nunca consultan `perfiles`
directamente, porque una policy sobre `perfiles` que lea `perfiles` entra en
recursion.

Alta de usuarios: cada quien crea su cuenta en `/admin/login`. El trigger
`handle_new_user` resuelve el alta en tres casos (migracion `014`):

1. **primer** usuario del sistema → `owner` activo;
2. correo presente en `mg_accesos_previstos` → el rol previsto, **activo**;
3. cualquier otro → `viewer` **inactivo**, a la espera de que un admin lo habilite.

Nadie consigue acceso solo por registrarse: el caso 2 exige que un admin haya
escrito antes esa fila, y `mg_accesos_previstos` solo la toca `es_admin()`.

### Accesos individuales (migracion `017`)

El rol da la base; una persona concreta puede llevar ademas una **excepcion
nombrada**, en dos columnas de `perfiles`:

- `secciones_extra` — secciones del panel que ve ademas de las de su rol
- `permisos_extra` — capacidades concretas concedidas a ella (catalogo cerrado
  en `PERMISOS_EXTRA`, `lib/mg/permisos.ts`)

Existe porque la alternativa cuesta mas: subir de rol concede de paso todo lo
demas, y un rol nuevo por combinacion termina en veinte roles que nadie
recuerda. Caso que lo motivo: quien compone y arregla (`produccion`) es ademas
quien habla con los inscritos de MG1 y les anota cuando pueden venir.

Tres invariantes:

1. **Una seccion extra solo añade navegacion, nunca permisos.** Cada boton
   sigue preguntando por el suyo. `seccionesVisibles()` descarta ademas
   cualquier seccion cuyo permiso el rol no tenga.
2. **Un permiso extra concede lo minimo que nombra.** `mg1:contactar` abre
   notas y disponibilidad; el estado de la curaduria sigue siendo de
   `puede_operar()`. Como RLS decide por fila y no por columna, ese recorte lo
   impone el trigger `proteger_curaduria_mg1`.
3. **Nadie se concede nada a si mismo.** Las dos columnas entran en los campos
   que `proteger_perfil` reserva a un admin sobre OTRA cuenta.

Se editan en `/admin/equipo` (boton *Personalizar* de cada fila). "Ver como"
apaga los extras de quien mira: previsualiza un rol, no una persona.

### El rol `produccion` (area de Produccion musical)

Aqui **el rol ES el area**: "mis companeros" son los perfiles activos con este
mismo rol. No hay tabla de equipos porque no hacen falta jerarquia ni
pertenencia multiple; el dia que hagan, `VistaArea` es el unico sitio que
cambia.

Dos cosas lo separan del resto de roles:

- **Panel recortado por lista blanca.** `SECCIONES_POR_ROL` en `permisos.ts` le
  da 9 de las 19 secciones. El motivo no es de seguridad sino de carga mental:
  el panel completo esta pensado para quien coordina. Al anadir una seccion
  nueva hay que decidir si entra en esa lista; por omision **no** entra.
- **El recorte se impone por ruta, no solo en la navegacion.** El middleware
  pasa el pathname al layout del panel en la cabecera `x-mg-ruta` (un Server
  Component no puede leerlo), y el layout redirige con `puedeVerSeccion()`. Sin
  eso bastaria escribir `/admin/cartera` a mano.

Alcance honesto: `es_staff()` sigue concediendo `SELECT` sobre las tablas
operativas, porque media docena de policies de la `004` cuelgan de esa funcion.
Salvo en `mg1_inscripciones`, donde la `018` corto la lectura por seccion, lo
que se recorta es la navegacion y las rutas, no el SELECT crudo. El objetivo
del rol es que el panel no agobie, no aislar informacion: cuando lo segundo
haga falta —datos personales de terceros, por ejemplo— hay que decirlo y
cerrarlo en su policy, como hizo la `018`.

Puede **proponer** sesiones de estudio (`mg_eventos_extra.propuesta = true`);
confirmarlas sigue exigiendo `puede_operar()`, porque la capacidad del estudio
es un recurso compartido. Lo garantiza el trigger
`proteger_confirmacion_sesion`.

Para el detalle completo del dominio, las invariantes y el siguiente tramo de
trabajo, ver **`docs/SUPER-PROMPT.md`**.

Barandas en `perfiles` (triggers `proteger_perfil` y `exigir_un_owner`):
nadie cambia su propio rol, estado ni artista vinculado; solo el owner toca al
owner; y siempre queda al menos un owner activo. Cuando `auth.uid()` es NULL
(service_role o SQL directo) los triggers ceden: es la via de recuperacion si
se pierde el acceso del unico owner.

### Authentication & Authorization
- Admin routes (`/admin/*`) are protected via middleware
- Middleware uses Supabase SSR auth with cookie management
- Unauthenticated users accessing `/admin` are redirected to `/admin/login`

### Build Configuration
- ESLint and TypeScript errors ignored during builds (next.config.mjs)
- Images are unoptimized
- Middleware matcher targets `/admin/:path*` routes

## Database Schema

> Nota: `lib/supabase.ts` y las rutas `/admin` documentadas mas abajo aun no existen en
> el repo. Lo que si esta conectado a Supabase hoy es el formulario de MG1.

### `mg1_inscripciones` (migracion `supabase/migrations/002_...`)

Inscripciones de la convocatoria MG1. Se escribe desde `app/api/mg1/inscripcion/route.ts`
usando `lib/supabase-admin.ts` (nunca desde el cliente).

RLS: policy de **INSERT para anon**, sin policy de SELECT/UPDATE/DELETE — los datos
personales solo se leen con la `service_role` key. Un correo por edicion (indice unico
sobre `lower(email), edicion`). El formulario trae honeypot (`website`) y validacion
compartida en `lib/mg1-inscripcion.ts`.

Sin credenciales de Supabase, en desarrollo el route handler cae a
`.data/mg1-inscripciones.jsonl`; en produccion responde 503 en vez de perder datos.

### Tablas del panel (migraciones `003`-`014`)

| Tabla | Para que |
|-------|----------|
| `perfiles` | Un usuario del panel. FK a `auth.users`. Aqui viven el rol y sus accesos individuales (`secciones_extra`, `permisos_extra`). |
| `mg_artistas` | Roster. `tier` marca/compilado define la ventana de campana. |
| `mg_proyectos` | Lanzamientos. `release` es la fecha de la que cuelga todo. |
| `mg_eventos_estado` | Excepciones sobre los eventos derivados. |
| `mg_eventos_extra` | Eventos creados a mano. |
| `mg_config` | Fila unica: reglas del motor, capacidad de estudio, huecos de publicacion. |
| `mg_publicaciones` | Calendario de contenido, con metricas y aprobaciones. |
| `mg_textos` | Biblioteca de copies y sets de hashtags. |
| `mg_radar` | Fichas del ecosistema (roster + prospectos) con mediciones. |
| `mg_salud_historial` | Reportes semanales de salud. Append-only. |
| `mg_comentarios` | Hilos polimorficos por `(entidad_tipo, entidad_id)` con @menciones. |
| `mg_avisos` | Bandeja por persona. Privada: ni un owner ve la ajena. |
| `mg_bitacora` | Append-only: quien cambio que. Sin policy de UPDATE/DELETE. |
| `mg_accesos_previstos` | Correo → rol, escrito por un admin ANTES de que la persona se registre. Solo `es_admin()`. |
| `gala_registros` | Registros a la Gala MG. El cupo y el pase QR los decide la base, no la app. |

`mg_comentarios` admite `entidad_tipo = 'area'`, con el `entidad_id` igual al
nombre del area (`'produccion'`). Asi el canal general de un area reutiliza
menciones, edicion y moderacion en vez de estrenar una tabla de mensajes: un
canal es un hilo de comentarios sobre una entidad que no es una fila.

La `003` ademas abrio `mg1_inscripciones` a lectura para el staff autenticado
(la `002` la habia dejado como buzon de solo escritura para el publico, y el
panel necesita curar esas inscripciones). La `018` estrecha esa lectura: la
tabla guarda nombre completo, correo, celular y ciudad de gente que se
inscribio a un concurso, no del equipo, asi que la ve **quien ve la seccion**
—`owner`, `admin`, `manager`, `viewer`— y quien la tenga concedida a titulo
personal (`puede_ver_mg1()`). Produccion, audiovisual, contenido y artista no.
Esa funcion es un espejo en SQL de `SECCIONES_POR_ROL`: si cambia la lista
blanca de la seccion `mg1`, hay que tocar las dos.

### `gala_registros` (migracion `019`)

Registro publico a la **Gala MG** (viernes 11 de septiembre, 5:00–9:00 p.m., privado, sin
cover, aforo 80). Se escribe desde `app/api/gala/registro/route.ts` con
`lib/supabase-admin.ts`; el modelo compartido cliente/servidor vive en
`lib/gala.ts`.

Tres reglas viven en Postgres y no en la aplicacion, a proposito:

1. **Nadie se confirma solo.** `gala_asignar_cupo` (BEFORE INSERT) pisa el
   `estado` que llegue: todos entran `pending`. Los estados son
   `pending` | `confirmed` | `waitlist` | `rejected`.
2. **El cupo lo reparte la base.** El mismo trigger toma
   `pg_advisory_xact_lock` por edicion y manda a `waitlist` a partir del
   registro 81. En el route handler dos envios simultaneos leerian el mismo
   conteo y los dos entrarian como cupo principal.
3. **El QR solo existe si estas confirmado.** `gala_emitir_pase`
   (BEFORE UPDATE) genera `codigo` al pasar a `confirmed`, y un CHECK impide
   que exista un codigo en cualquier otro estado. La landing lo promete y la
   base lo cumple.

La `020` corrigio la fecha: la edicion se llama `gala-2026-09-11` y el DEFAULT
de la columna se movio con ella, porque ese texto es la clave por la que el
trigger del aforo cuenta y por la que agrupa el indice unico de correo.

La confirmacion y el QR se envian por **correo**, no por WhatsApp. Hoy ese
envio es manual: `/admin/gala` arma el mensaje y lo abre en el cliente de
correo (`enlaceCorreo` en `components/admin/vista-gala.tsx`). Automatizarlo
exige conectar un proveedor; ese texto es el que tendria que mandar.

El medidor de aforo publico (`components/gala/medidor-cupo.tsx`) existe pero
NO se monta: enseñar "quedan 80 de 80" con la lista corta juega en contra. El
aforo real lo sigue imponiendo la base.

RLS: INSERT para anon (el formulario), SELECT y UPDATE solo para quien ve la
seccion — `puede_ver_gala()`, espejo de `SECCIONES_POR_ROL` como en la `018`.
`proteger_admision_gala` recorta a quien solo tiene el permiso individual
`gala:acreditar`: marca ingresos y anota, no decide admisiones. Sin policy de
DELETE: un registro no se borra, se marca `rejected`.

No se pide genero (se infiere del nombre en el analisis posterior) ni
direccion.

### `registros`

The `registros` table structure:
- `id`: Primary key
- `nombre`: Full name (string, required)
- `celular`: Phone number (string, required, unique)
- `correo`: Email (string, required, unique, stored lowercase)
- `genero`: Gender (string, required)
- `fecha_nacimiento`: Birth date (date, optional)
- `created_at`: Registration timestamp (auto-generated)

## Environment Setup

Required environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Assets Needed (Placeholders in Use)

- Logo MG Company Group (SVG/PNG) -> `public/logo-mg.svg`
- Video hero reel (MP4, 10-20s) -> `public/videos/hero-reel.mp4`
- Video poster fallback -> `public/videos/hero-poster.jpg`
- Artist photos -> `public/artists/[name]/`
- Team photos -> `public/team/`
- Gallery photos -> `public/gallery/`
- MG Flow thumbnails -> `public/mg-flow/`
- OG de la Gala -> `public/og/og-gala.jpg` (cae a `og-home.jpg` si no existe)
