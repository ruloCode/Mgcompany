/**
 * Genera public/og/og-gala.jpg (1200x630).
 *
 * La foto de fondo es la misma del hero (public/gala/gala-crowd.jpg),
 * tratada en duotono rojo: la marca no tiene ámbar ni cian y una foto sin
 * tratar en un feed rompe el sistema más que ayudarlo.
 *
 * Mismo sistema que las demas tarjetas OG (marca arriba, kicker entre
 * corchetes, titulo en Bebas, pie con el dominio y la barra roja), con dos
 * cosas propias del evento:
 *
 *   - la fecha como bloque tipografico grande, que es el dato por el que
 *     alguien decide si le importa el enlace;
 *   - un troquel de tiquete en el borde derecho, el mismo motivo del pase.
 *
 * El fondo es una foto tratada en duotono rojo: la marca no tiene ambar ni
 * cian, y una foto sin tratar en un feed rompe el sistema mas que ayudarlo.
 *
 * Playwright no es dependencia del proyecto (solo hace falta para regenerar
 * la tarjeta), asi que se resuelve igual que en generar-og-karen-dayanna.mjs:
 *
 *   npx --yes playwright@1 --version
 *   node scripts/generar-og-gala.mjs
 */
import { fileURLToPath, pathToFileURL } from "node:url"
import { dirname, join } from "node:path"
import { mkdir, readdir, writeFile, rm } from "node:fs/promises"
import { existsSync } from "node:fs"
import { homedir } from "node:os"

async function cargarPlaywright() {
  try {
    return await import("playwright")
  } catch {
    const cache = join(homedir(), ".npm", "_npx")
    if (!existsSync(cache)) throw new Error("Instala playwright: npx --yes playwright@1 --version")
    for (const entrada of await readdir(cache)) {
      const candidato = join(cache, entrada, "node_modules", "playwright", "index.mjs")
      if (existsSync(candidato)) return import(pathToFileURL(candidato).href)
    }
    throw new Error("No encontre playwright. Corre: npx --yes playwright@1 --version")
  }
}

async function navegadorInstalado() {
  const base = join(homedir(), "Library", "Caches", "ms-playwright")
  if (!existsSync(base)) return undefined
  const builds = (await readdir(base))
    .filter((d) => d.startsWith("chromium_headless_shell-"))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]))
  for (const build of builds) {
    const bin = join(base, build, "chrome-headless-shell-mac-arm64", "chrome-headless-shell")
    if (existsSync(bin)) return bin
  }
  return undefined
}

const { chromium } = await cargarPlaywright()

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..")
const publico = (rel) => pathToFileURL(join(raiz, "public", rel)).href

/* La foto es opcional a proposito. Si esta, va en duotono rojo; si no, la
   tarjeta cae a la version tipografica —negro, rojo y Bebas— que es igual de
   valida en el sistema y nunca se ve rota por un archivo que falta. */
const rutaFondo = join(raiz, "public", "gala", "gala-crowd.jpg")
const hayFoto = existsSync(rutaFondo)
const FONDO = hayFoto ? pathToFileURL(rutaFondo).href : ""

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1200px; height:630px; background:#0a0a0a; overflow:hidden;
         font-family:'JetBrains Mono',monospace; color:#fff; }
  .card { position:relative; width:1200px; height:630px; overflow:hidden;
          display:flex; }

  /* ---------- fondo ---------- */
  .foto { position:absolute; inset:0;
          background:url('${FONDO}') center 42% / cover no-repeat;
          filter:grayscale(1) contrast(1.22) brightness(0.52); }
  .duo { position:absolute; inset:0; background:#e8200c; mix-blend-mode:color; opacity:0.72; }
  .duo2 { position:absolute; inset:0;
          background:linear-gradient(90deg, #0a0a0a 10%, rgba(10,10,10,0.90) 40%,
                     rgba(10,10,10,0.48) 72%, rgba(10,10,10,0.80) 100%); }

  /* Sin foto: el resplandor del hero de /gala, más dos barridos diagonales
     que le dan profundidad a un fondo que si no queda muerto. */
  .brillo { position:absolute; inset:0;
            background:radial-gradient(ellipse 46% 88% at 84% 8%, rgba(232,32,12,0.50) 0%, transparent 60%),
                       radial-gradient(ellipse 52% 62% at 6% 104%, rgba(232,32,12,0.26) 0%, transparent 62%); }
  .haz { position:absolute; width:1500px; height:190px; left:-180px; top:180px;
         transform:rotate(-14deg); opacity:0.5;
         background:linear-gradient(90deg, transparent, rgba(232,32,12,0.34), transparent); }
  .haz.dos { top:414px; height:120px; transform:rotate(-9deg); opacity:0.34; }

  .vineta { position:absolute; inset:0;
            background:radial-gradient(ellipse 82% 92% at 46% 48%, transparent 34%, rgba(0,0,0,0.76) 100%); }
  .grano { position:absolute; inset:0; opacity:0.26; mix-blend-mode:overlay;
           background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='0.5'/></svg>"); }

  /* ---------- cuerpo del tiquete ---------- */
  .cuerpo { position:relative; width:952px; height:630px;
            padding:44px 52px 42px 58px; display:flex; flex-direction:column; }

  .riel { display:flex; align-items:center; gap:26px;
          font-size:15px; letter-spacing:0.26em; color:rgba(255,255,255,0.5); }
  .riel .rojo { color:#ff5a45; }
  .riel i { display:block; flex:1; height:1px; background:rgba(255,255,255,0.14); }

  .kicker { display:flex; align-items:center; gap:18px; margin-top:30px; }
  .kicker span { color:#ff5a45; font-size:17px; letter-spacing:0.28em; font-weight:500; white-space:nowrap; }
  .kicker i { display:block; flex:1; height:1px; background:linear-gradient(90deg,#e8200c,transparent); }

  h1 { font-family:'Bebas Neue',sans-serif; font-size:172px; line-height:0.80;
       letter-spacing:-0.006em; text-transform:uppercase; margin-top:10px; }
  h1 .mg { color:#e8200c; }

  /* La fecha manda: es el dato que decide si el enlace importa. */
  .datos { display:flex; align-items:stretch; gap:0; margin-top:34px;
           border-top:1px solid rgba(255,255,255,0.14);
           border-bottom:1px solid rgba(255,255,255,0.14); }
  .col { padding:18px 30px; border-left:1px solid rgba(255,255,255,0.10); }
  .col:first-child { padding-left:0; border-left:0; }
  .col .et { font-size:12px; letter-spacing:0.28em; color:rgba(255,255,255,0.42); }
  .col .va { font-family:'Bebas Neue',sans-serif; font-size:44px; line-height:1;
             margin-top:8px; letter-spacing:0.02em; white-space:nowrap; }
  .col.dia .va { color:#fff; }
  .col.dia .va em { font-style:normal; color:#e8200c; }

  .mezcla { margin-top:auto; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .mezcla li { list-style:none; border:1px solid rgba(255,255,255,0.22);
               padding:7px 14px; font-size:13px; letter-spacing:0.16em;
               color:rgba(255,255,255,0.82); }
  .mezcla li b { color:#ff5a45; font-weight:500; }

  .pie { margin-top:26px; display:flex; align-items:center; gap:16px; }
  .pie img { width:32px; height:32px; object-fit:contain; }
  .pie span { font-size:16px; letter-spacing:0.26em; color:rgba(255,255,255,0.7); }

  /* ---------- talón ---------- */
  /* El troquel del pase, pero con contenido: un talón vacío es un adorno. */
  .talon { position:relative; width:248px; height:630px;
           border-left:2px dashed rgba(255,255,255,0.22);
           display:flex; flex-direction:column; align-items:center;
           justify-content:center; gap:6px; padding:44px 20px; }
  .talon::before, .talon::after {
    content:''; position:absolute; left:-20px; width:40px; height:40px;
    border-radius:50%; background:#0a0a0a; }
  .talon::before { top:-20px; }
  .talon::after { bottom:-20px; }

  .talon .arriba { position:absolute; top:44px; font-size:13px;
                   letter-spacing:0.34em; color:rgba(255,255,255,0.45); }
  .talon .cupo { font-family:'Bebas Neue',sans-serif; font-size:150px; line-height:0.78;
                 color:#e8200c; text-shadow:0 0 60px rgba(232,32,12,0.55); }
  .talon .lugares { font-size:15px; letter-spacing:0.32em; color:rgba(255,255,255,0.78); }
  .talon .regla { width:64px; height:5px; background:#e8200c; margin-top:20px; }
  .talon .abajo { position:absolute; bottom:44px; font-size:13px;
                  letter-spacing:0.30em; color:rgba(255,255,255,0.45); text-align:center; }
</style></head>
<body><div class="card">
  ${hayFoto
    ? '<div class="foto"></div><div class="duo"></div><div class="duo2"></div>'
    : '<div class="brillo"></div><div class="haz"></div><div class="haz dos"></div>'}
  <div class="vineta"></div><div class="grano"></div>

  <div class="cuerpo">
    <div class="riel">
      <span>MG / COMUNIDAD</span>
      <i></i>
      <span class="rojo">EVENTO PRIVADO</span>
    </div>

    <div class="kicker"><span>[ REGISTRO ABIERTO · SIN COVER ]</span><i></i></div>
    <h1>Gala <span class="mg">MG</span></h1>

    <div class="datos">
      <div class="col dia">
        <div class="et">FECHA</div>
        <div class="va">VIE 11 <em>SEP</em></div>
      </div>
      <div class="col">
        <div class="et">HORA</div>
        <div class="va">5:00 – 9:00 P.M.</div>
      </div>
      <div class="col">
        <div class="et">CIUDAD</div>
        <div class="va">Bogotá</div>
      </div>
    </div>

    <ul class="mezcla">
      <li><b>22</b> ARTISTAS</li>
      <li><b>44</b> INVITADOS</li>
      <li><b>14</b> GREMIO</li>
      <li>SOLO CON REGISTRO CONFIRMADO</li>
    </ul>

    <div class="pie">
      <img src="${publico("logo-mg.png")}" alt="">
      <span>MGCOMPANY.CO/GALA</span>
    </div>
  </div>

  <div class="talon">
    <div class="arriba">PASE ÚNICO</div>
    <div class="cupo">80</div>
    <div class="lugares">LUGARES</div>
    <div class="regla"></div>
    <div class="abajo">MG<br>COMPANY</div>
  </div>
</div></body></html>`

const navegador = await chromium.launch({ executablePath: await navegadorInstalado() })
const pagina = await navegador.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
})
const temporal = join(raiz, "public", ".og-gala.tmp.html")
await writeFile(temporal, html, "utf-8")
await pagina.goto(pathToFileURL(temporal).href, { waitUntil: "networkidle" })
await pagina.evaluate(() => document.fonts.ready)
await mkdir(join(raiz, "public", "og"), { recursive: true })
await pagina.screenshot({
  path: join(raiz, "public", "og", "og-gala.jpg"),
  type: "jpeg",
  quality: 92,
})
await navegador.close()
await rm(temporal, { force: true })
console.log("public/og/og-gala.jpg")
