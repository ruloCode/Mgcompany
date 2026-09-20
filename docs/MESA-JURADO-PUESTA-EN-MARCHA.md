# Mesa del jurado MG1 — puesta en marcha

Tres pasos. Solo el primero es obligatorio para que la página funcione.

La página es `/mg1/seleccion/<jurado>` y sale de la migración `022`. Mientras
las tablas no existan, el jurado ve “Ya volvemos” en vez de una pantalla rota:
es a propósito, pero tampoco puede votar.

---

## 1. Instalar la mesa (Supabase → SQL Editor)

Pega **todo** el contenido de `supabase/migrations/022_mg1_seleccion_jurados.sql`
y ejecútalo. Crea dos tablas (`mg1_jurado_votos`, `mg1_jurado_comentarios`), el
trigger del tope de 12 y las policies.

Es idempotente: si lo corres dos veces no rompe nada.

## 2. Comprobar que los 32 están marcados

La página lista **exactamente** las inscripciones con `estado = 'preseleccionado'`.
Ni una más. Corre esto:

```sql
SELECT estado, count(*)
  FROM public.mg1_inscripciones
 WHERE edicion = 'mg1-2026'
 GROUP BY estado
 ORDER BY 2 DESC;
```

- Si `preseleccionado` dice **32** → listo, no hagas nada más en este paso.
- Si dice 0 o un número distinto, la curaduría todavía no está reflejada en la
  base. Dos formas de arreglarlo:

**a) Desde el panel** (lo normal): `/admin/mg1`, columna *Estado*, marcar cada
uno como “Preseleccionado”. Queda registrado en la bitácora con tu nombre.

**b) Por SQL**, si tienes la lista de correos a mano:

```sql
UPDATE public.mg1_inscripciones
   SET estado = 'preseleccionado'
 WHERE edicion = 'mg1-2026'
   AND lower(email) IN (
     'correo1@ejemplo.com',
     'correo2@ejemplo.com'
     -- … los 32
   );
```

Comprueba con el `SELECT` de arriba antes de dar por hecho que quedaron.

> Ojo: el estado `seleccionado` es otra cosa — es el veredicto final, los 12.
> La mesa del jurado trabaja sobre `preseleccionado`.

## 3. (Opcional) Verlo en tu máquina

En `.env.local` la línea `SUPABASE_SERVICE_ROLE_KEY=` está **vacía**, así que en
local la mesa corre con 32 fichas de mentira y lo dice en pantalla (“Modo demo”).
Para trabajar contra los datos reales:

```bash
vercel env pull .env.local --project menu-coctel --environment production
```

Eso sobrescribe tu `.env.local`, así que haz copia antes si tienes algo propio
ahí (`NEXT_PUBLIC_SITE_URL`, por ejemplo).

No hace falta para producción: en Vercel la key ya está puesta.

---

## Los enlaces que se reparten

Uno por jurado. No se enlazan desde ningún lado del sitio y llevan `noindex`:

```
https://mgcompany.co/mg1/seleccion/miguelacho-tf
https://mgcompany.co/mg1/seleccion/jony-roy
https://mgcompany.co/mg1/seleccion/queens-tafari
```

También están listos para copiar en `/admin/mg1`, sección *Mesa del jurado*,
donde además se ve el consolidado: quién marcó a quién y qué escribió cada uno.

Agregar un jurado es añadir una línea a `JURADOS` en `lib/mg1-seleccion.ts` y
desplegar. No hay nada que crear en la base.

## Qué ve el jurado, y qué no

**Ve:** nombre artístico, ciudad, su música (YouTube y Spotify suenan dentro de
la ficha) y por qué se inscribió. Los comentarios de los otros jurados.

**No ve:** nombre completo, correo, celular, notas internas de curaduría, ni a
quién marcaron los demás — para que el primero en votar no arrastre al resto.
