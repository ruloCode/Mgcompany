import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Refresca el token en cada request y decide si la sesion puede entrar a /admin.
export async function actualizarSesion(request: NextRequest) {
  // Un Server Component no puede leer el pathname. El layout del panel lo
  // necesita para saber que seccion se pidio y decidir si el rol la tiene
  // permitida, asi que se lo pasamos por cabecera de request.
  const cabeceras = new Headers(request.headers)
  cabeceras.set("x-mg-ruta", request.nextUrl.pathname)

  let response = NextResponse.next({ request: { headers: cabeceras } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: cabeceras } })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  // getUser() y no getSession(): valida el JWT contra Supabase en vez de
  // confiar en la cookie, que es falsificable.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const esLogin = pathname.startsWith("/admin/login")
  // Recuperar la contraseña tiene que ser accesible SIN sesión: el enlace del
  // correo llega con un `code` en la URL y es justo lo que crea la sesión. Si
  // el guardia lo mandara al login, se llevaría el code por delante y el
  // enlace no serviría para nada.
  const esRecuperar = pathname.startsWith("/admin/recuperar")

  if (!user && !esLogin && !esRecuperar) {
    const url = request.nextUrl.clone()
    url.pathname = "/admin/login"
    url.searchParams.set("volver", pathname)
    return NextResponse.redirect(url)
  }

  if (user && esLogin && !esRecuperar) {
    const url = request.nextUrl.clone()
    url.pathname = "/admin"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return response
}
