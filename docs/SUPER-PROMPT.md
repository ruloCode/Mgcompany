# Super prompt — Centro de Operaciones MG

Documento de arranque para cualquier agente o persona que vaya a seguir
construyendo el panel. Está escrito para pegarse tal cual como contexto: define
el dominio, las invariantes que no se pueden romper, lo que ya existe y el
siguiente tramo de trabajo.

Última actualización: después del Nivel 1 y 2 (personas dentro del trabajo).

---

## 1. El encargo en una frase

MG Company Group es una productora artística en Bogotá con 16 artistas y 22
lanzamientos planeados hasta 2027. El panel en `/admin` es su centro de
operaciones: planifica los lanzamientos, agenda el estudio, coordina el
contenido de 17 cuentas de redes, hace scouting del ecosistema y ahora reparte
el trabajo entre las personas del equipo.

**No es un CRM ni una herramienta genérica de tareas.** Es una herramienta de
sello discográfico. Cada decisión de producto se juzga contra una pregunta:
*¿esto ayuda a que 22 lanzamientos salgan a tiempo con un equipo pequeño?*

---

## 2. La idea central: el calendario no se guarda, se deriva

Esta es la invariante que hay que entender antes de tocar nada.

Cada proyecto tiene una **fecha de release**. Todos sus hitos se calculan
**hacia atrás** desde ahí, aplicando las reglas de `mg_config.reglas`:

```
release − 56 días  →  grabación musical terminada
release − 45 días  →  content day (rodaje único)
release − 35 días  →  master final
release − 31 días  →  edición de contenido lista
release − 28 días  →  entrega al distribuidor
release − 21 días  →  pitch editorial + pre-save activo
release           →  RELEASE
release + N meses →  fin de post-lanzamiento
```

Encima, un agendador reparte las canciones pendientes sobre la capacidad real
del estudio (EDF: primero el deadline más cercano), respetando días de sesión,
bloques por día y un techo semanal con ~33% de colchón.

**Consecuencia:** mover una fecha de release recalcula el proyecto entero en
cascada. No hay fechas que mantener a mano. Esto es lo más valioso del sistema
y ninguna funcionalidad nueva puede romperlo.

**Lo único que se persiste del calendario son las excepciones:**

- `mg_eventos_estado` — fecha movida a mano, marcado como hecho, cancelado,
  **responsable**, **prioridad**
- `mg_eventos_extra` — eventos creados a mano

**Por eso los ids son TEXT y no uuid.** El motor los compone:
`p3:release`, `p3:ses2`, `party:2026-11`, `radar:rp5`, `post:xxx`, `ex1a2b3c`.
Las excepciones apuntan a ese id derivado. Con uuids habría que mantener una
tabla de traducción sin ganar nada: estos ids no son secretos ni enumerables
desde fuera del panel.

**Corolario que ya se aprovechó:** como `mg_eventos_extra` permite crear
eventos a mano y `mg_eventos_estado` les pone responsable, **el modelo de
eventos ES el modelo de tareas**. No hay ni debe haber una entidad `tarea`
aparte.

---

## 3. Stack y estructura

Next.js 15 (App Router, React 19) · Supabase (auth + Postgres + RLS) ·
TypeScript · CSS propio con tokens (no Tailwind dentro del panel).

```
lib/mg/
  tipos.ts         modelo de dominio
  fechas.ts        utilidades YYYY-MM-DD (Date al mediodía: sin desfases de zona)
  constantes.ts    tipos de evento, estados, PLATS, PILARES, CATS del radar, SPECS
  motor.ts         eventosProyecto · agendarSesiones · eventosFiestas ·
                   calcularAlertas · misPendientes · cargaPorPersona
  radar.ts         puntaje 0-100 por categoría + recomendación
  plan.ts          plan automático de contenido, nomenclatura de assets
  permisos.ts      matriz de roles (espejo en cliente de lo que impone RLS)
  datos.ts         server-only: carga el Snapshot y el perfil actual
lib/supabase/      client · server · middleware
app/admin/
  acciones.ts      TODAS las Server Actions
  panel.css        sistema visual (tema en [data-tema] sobre .panel)
  login/           fuera del route group, a propósito
  (panel)/         todo lo que exige perfil activo
components/admin/  vistas cliente sobre el Snapshot que les pasa el server
```

### Patrón de datos

Un **Snapshot** completo por request (`cargarSnapshot()`), pasado del Server
Component a la vista cliente. El volumen es de decenas de filas por tabla, así
que paginar complicaría más de lo que ahorra. Las mutaciones son Server Actions
que validan permiso, escriben, dejan bitácora y hacen `revalidatePath`.

### `app/admin/login` NO puede vivir dentro de `(panel)`

El layout de `(panel)` exige perfil activo y redirige a `/admin/login`. Si el
login estuviera dentro, sería un bucle infinito de redirecciones. Ya pasó una
vez; no lo repitas.

---

## 4. Autorización: la base de datos manda

Seis roles: `owner` · `admin` · `manager` · `contenido` · `artista` · `viewer`.

**La autoridad real es RLS en Postgres, no la interfaz.** `lib/mg/permisos.ts`
es un espejo para no pintar botones que van a fallar; nunca es la fuente de
verdad.

Las policies llaman a funciones `SECURITY DEFINER` con `search_path` fijo:
`es_staff()`, `puede_operar()`, `puede_publicar()`, `es_admin()`,
`rol_actual()`, `mi_artista_id()`.

**Nunca escribas una policy sobre `perfiles` que consulte `perfiles`
directamente**: Postgres entra en recursión infinita de RLS. Para eso existen
esas funciones.

### Barandas ya montadas (no las debilites)

- El **primer** usuario que se registra queda `owner` activo; el resto entra
  `viewer` inactivo hasta que un admin lo habilite.
- Nadie cambia su propio rol, estado ni artista vinculado. `artista_id` es
  campo de admin: si un `artista` pudiera auto-asignárselo, aprobaría las
  publicaciones de cualquier artista del roster.
- Solo el owner toca al owner. Siempre queda al menos un owner activo.
- Cuando `auth.uid()` es NULL (service_role o SQL directo) los triggers ceden:
  es la vía de recuperación si se pierde el acceso del único owner.
- `mg_bitacora` y `mg_salud_historial` son **append-only**: sin policy de
  UPDATE ni DELETE.
- `mg_avisos` es privada por persona: ni un owner ve la bandeja ajena.
- Una persona puede cerrar **lo suyo** (`policy "cierro lo mio"`), pero el
  `WITH CHECK` la obliga a seguir siendo la responsable: puede cerrar, no
  reasignar.

### Prueba obligatoria al tocar permisos

Cualquier cambio en RLS se verifica contra la base real con tokens de usuarios
de distinto rol, comprobando **filas afectadas** y no códigos HTTP: PostgREST
devuelve 204 cuando RLS filtra la fila, lo que parece éxito y no lo es. Usa
`Prefer: return=representation` y cuenta el array.

---

## 5. Esquema

### Ya existente

| Tabla | Para qué |
|---|---|
| `perfiles` | Usuario del panel. Rol, artista vinculado, `capacidad_semanal`. |
| `mg_artistas` | Roster. `tier` marca/compilado define la ventana de campaña. |
| `mg_proyectos` | Lanzamientos. `release` es la fecha de la que cuelga todo. Además `lider_id`, `salud`, `salud_nota`, `salud_at`. |
| `mg_eventos_estado` | Excepciones + **responsable_id** + **prioridad** + `hecho_at`. |
| `mg_eventos_extra` | Eventos creados a mano. |
| `mg_config` | Fila única: reglas del motor, capacidad de estudio, huecos de publicación. |
| `mg_publicaciones` | Calendario de contenido, métricas, aprobaciones, `responsable_id`. |
| `mg_textos` | Biblioteca de copies y sets de hashtags. |
| `mg_radar` | Fichas del ecosistema (roster + prospectos) con mediciones. |
| `mg_salud_historial` | Reportes semanales de salud. Append-only. |
| `mg_comentarios` | Polimórfico por `(entidad_tipo, entidad_id)`. |
| `mg_avisos` | Bandeja por persona. |
| `mg_bitacora` | Quién cambió qué. Append-only. |
| `mg1_inscripciones` | Buzón público de la convocatoria; el staff lo lee y cura. |
| `gala_registros` | Buzón público de la Gala MG. El cupo (80) y el pase QR los deciden triggers, no la app. |

### Dos ejes que se confunden fácil

`mg_proyectos.estado` describe la **producción musical**: `sin_producir`,
`grabacion`, `mezcla`, `seleccion_masters`, `listo`, `lanzado`…

`mg_proyectos.salud` describe si **llega a la fecha**: `en_curso`, `en_riesgo`,
`desviado`. Un proyecto puede estar en mezcla **y** desviado. No los mezcles ni
los derives uno del otro.

---

## 6. Decisiones de producto ya tomadas

Respétalas salvo que haya una razón nueva y explícita.

1. **Un solo responsable por cosa.** Dueños compartidos es lo mismo que nadie
   responsable. Si hacen falta varias manos, se parte en varios eventos.
2. **Un semáforo en rojo exige nota.** La interfaz bloquea guardar `en_riesgo`
   o `desviado` sin explicación: un rojo sin contexto no se puede accionar en
   la reunión del lunes.
3. **El canal de avisos externo es WhatsApp, no el correo.** Es por donde ya
   opera MG.
4. **El panel no guarda archivos.** Guarda el enlace; el archivo vive en la
   nube (convención Frame.io adaptada). No lo conviertas en un gestor de
   archivos.
5. **La capacidad es una declaración, no una medición.** Nada de cronometrar
   el día de nadie.
6. **Todo en español**, incluido el código: nombres de función, variables,
   columnas y mensajes. El equipo que lo mantiene trabaja en español.

### Lo que NO se debe construir todavía

- **Partes de horas / time tracking.** Mata la adopción en equipos creativos
  pequeños. La capacidad por bloques da el 80%.
- **Dependencias entre tareas tipo Gantt clásico.** El motor de fechas
  derivadas ya resuelve casi todo lo que la gente usa las dependencias para
  resolver. Agregarlas duplica el modelo.
- **Publicar automáticamente en redes por API.** Caro, frágil, y las APIs de
  Instagram y TikTok cambian de reglas cada temporada.
- **Chat interno.** Compite con WhatsApp y pierde. Los comentarios anclados al
  trabajo son lo que WhatsApp no sabe hacer.

---

## 7. Convenciones de código

- **Fechas:** siempre strings `YYYY-MM-DD`. El `Date` se construye al mediodía
  (`new Date(y, m-1, d, 12)`) para que ningún cambio de horario ni desfase de
  zona corra el día una casilla. Usa los helpers de `lib/mg/fechas.ts`; no
  metas `Date` crudo en la lógica de calendario.
- **Comentarios en el código:** explican *por qué*, nunca *qué*. Si el código
  ya lo dice, no lo repitas. Documenta la decisión no obvia y la trampa que
  evita.
- **Server Actions:** toda mutación pasa por `mutar(permiso, fn)`, que valida
  permiso, ejecuta, registra en bitácora y revalida. Las excepciones
  (`revisarPublicacion`, `cerrarMiPendiente`, `comentar`) manejan su propia
  autorización porque el permiso depende de la fila.
- **Errores visibles.** Una edición en línea que falla en silencio es peor que
  un error: si la base rechaza algo, se muestra.
- **CSS:** tokens en `.panel`, tema en `[data-tema]`. Nada de colores
  literales en componentes.
- **Accesibilidad:** `aria-label` en todo control sin texto, foco visible,
  estado nunca solo por color (siempre chip con texto o icono).

---

## 8. Estado actual

**Vive en producción:** https://mgcompany.co/admin

16 secciones en cuatro grupos: *Lo mío* (Mi trabajo, Bandeja) · *Operación*
(Resumen, Cartera y salud, Carga del equipo, Calendario, Timeline, Estudio) ·
*Catálogo* (Artistas, Fiestas, Redes, Radar, MG1) · *Administración* (Plan y
reglas, Equipo, Datos).

Migraciones `001`–`008` aplicadas. Datos reales cargados: 16 artistas, 22
proyectos, 68 canciones por grabar.

---

## 9. Siguiente tramo

En orden. Cada uno es un incremento entregable por separado.

### 9.1 · Resumen diario por WhatsApp

Cierra el Nivel 2. Hoy la bandeja existe dentro del panel, pero eso exige que
la gente entre. El resumen sale a buscarlos.

- Un cron diario (~7:00 hora de Bogotá) que, por cada persona activa, arme:
  lo atrasado, lo que vence hoy, lo que espera su aprobación.
- Envío por la Cloud API de WhatsApp Business (Meta) o Twilio. Hace falta
  `WHATSAPP_TOKEN` y `WHATSAPP_PHONE_ID` en las variables de entorno, y
  plantillas aprobadas por Meta para mensajes iniciados por el negocio.
- Añadir `perfiles.celular` y `perfiles.avisos_whatsapp BOOLEAN`.
- **No mandes nada si la persona no tiene nada.** Un resumen vacío diario es
  la forma más rápida de que lo silencien.

### 9.2 · Vistas guardadas y filtros compartidos

“Lo de Abner”, “Todo lo atrasado”, “Contenido de esta semana”. Un PM vive de
vistas. Tabla `mg_vistas` (nombre, dueño, compartida, filtros jsonb) y un
selector en las pantallas de lista.

### 9.3 · Plantillas de proyecto

Al crear un lanzamiento, poder elegir una plantilla que además de los hitos
derivados cree una checklist de entregables (portada, letra, splits firmados,
metadata) con responsable por defecto. Se apoya en `mg_eventos_extra`.

### 9.4 · Presupuesto por proyecto

El radar ya captura tarifas de proveedores. Conectarlo: presupuesto estimado
contra comprometido por lanzamiento.

### 9.5 · Reporte exportable para dirección

Un PDF o página compartible con la cartera, la salud y lo que viene el próximo
mes. Es el artefacto que sale del equipo hacia afuera.

---

## 10. Cómo verificar antes de dar algo por hecho

No basta con que compile.

1. `npx tsc --noEmit` limpio en `lib/`, `app/admin/`, `components/admin/`.
2. `npm run build` sin errores.
3. Prueba en navegador con **dos cuentas de distinto rol**, comprobando que la
   mutación realmente persistió (recargar y volver a leer), no solo que la
   petición devolvió 200.
4. Si tocaste RLS: prueba directa contra PostgREST con tokens de cada rol,
   contando filas afectadas.
5. Cero errores de consola en el recorrido.
6. Limpia los datos de prueba de la base al terminar.

---

## 11. Contexto operativo

- Proyecto Supabase: `mgcompany` (`zlhyditztewneymqjqpm`), enlazado por CLI.
- Proyecto Vercel: `menu-coctel` en `papayo-tech`; dominio `mgcompany.co`.
  Push a `main` dispara despliegue de producción.
- En Vercel están `NEXT_PUBLIC_SUPABASE_URL` y
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. La `SUPABASE_SERVICE_ROLE_KEY` NO
  está y el panel no la necesita: usa la anon key con la sesión del usuario y
  deja que RLS filtre.
- `npm install` necesita `--legacy-peer-deps` (ya está en `.npmrc`).
- Puerto 3000 suele estar ocupado en local; usa 3005.
