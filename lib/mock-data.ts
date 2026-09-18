import type { Agent, Artist, ContactInfo, BusinessUnit, MGFlowShow, GalleryItem, TeamMember } from "./types"

// Mock Agents / Team
export const mockAgents: Agent[] = [
  {
    id: "1",
    name: "MG Management",
    email: "management@mgcompanygroup.com",
    bio: "Gestion integral de artistas y booking.",
  },
]

// Mock Artists - MG Company Group roster
export const mockArtists: Artist[] = [
  {
    id: "2",
    slug: "miguelacho-tf",
    name: "Miguelacho TF",
    bio: "Productor y artista con ADN caribeno, costero y afro. Referencia de la musica caribena contemporanea con colaboraciones junto a Flaco Flow, Jony Roy, Sambo Prod y Kartoonz.",
    bio_full: "Miguelacho TF es un productor y artista con ADN caribeno—costero y afro—cuyo proyecto nacio de la mezcla entre su nombre de pila, \"Miguel\", y la jerga cartagenera para Cartagena, \"Cartacho\"; \"TF\" viene de The Fat. Se formo de manera autodidacta desde 2010, fascinado por el Passa Passa Sound System de DJ Dever y el mundo de las pistas y la grabacion. Hoy es una referencia cuando se habla de musica caribena contemporanea y ha trabajado con talentos de Bogota y Soacha. Como productor, ha colaborado con Flaco Flow (Flaco Flow & Melanina), Jony Roy, Sambo Prod, Kartoonz (productor de Arcangel), entre otros. Su mensaje vital: la vida es una; con fe, salud y disciplina siempre hay camino para salir adelante.",
    location: "Cartagena, Colombia",
    agent_id: "1",
    photo_url: "/artists/miguelacho-tf/tf-01.jpg",
    hero_image_url: "/artists/miguelacho-tf/tf-02.jpg",
    social_links: {
      instagram: "https://instagram.com/miguelachotf",
      spotify: "https://open.spotify.com/artist/miguelachotf",
      youtube: "https://youtube.com/@miguelachotf",
    },
    media: {
      audio: [],
      video: [],
    },
    featured: true,
    shape: "portrait",
    spotify_embed: "https://open.spotify.com/embed/artist/18i7LjiyQTMxEamDZ6OJPo?utm_source=generator&theme=0",
    spotify_album_embed: "https://open.spotify.com/embed/album/25uxLpwKRe5GsORIe1xddW?utm_source=generator&theme=0",
  },
  {
    id: "3",
    slug: "bombo-hustle",
    name: "Bombo Hustle",
    bio: "Artista de reggae colombiano que fusiona las raices jamaiquinas con la energia latina, el dancehall y los sonidos del Caribe contemporaneo.",
    bio_full: "Bombo Hustle es reggae en estado puro, pero con alma colombiana. Su musica bebe directamente de las raices jamaiquinas del genero—el roots, el dub, el dancehall—y las mezcla con la energia de las calles latinas, creando un sonido que es tanto un homenaje a los clasicos como una declaracion de identidad propia.\n\nDesde sus inicios, Bombo encontro en el reggae mas que un genero: una filosofia de vida. Sus letras hablan de resistencia, de comunidad, de las luchas cotidianas y de la celebracion de estar vivo. Con riddims que hacen mover la cabeza y melodias que se quedan en la mente, cada track suyo es una invitacion a conectar con algo mas grande que uno mismo.\n\nEn tarima, Bombo Hustle se transforma. Su presencia escenica combina la vibra relajada del reggae con una intensidad contagiosa que enciende cualquier espacio, desde un sound system callejero hasta un festival multitudinario. Es esa dualidad—paz interior y fuego exterior—lo que lo hace unico en la escena.\n\nComo parte de MG Company Group, Bombo Hustle representa la diversidad sonora del roster y demuestra que el reggae colombiano tiene voz propia en el panorama musical latino. Su mensaje es claro: buenas vibras, musica real y siempre adelante.",
    location: "Colombia",
    agent_id: "1",
    photo_url: "/artists/bombo-hustle/bombo-01.jpg",
    hero_image_url: "/artists/bombo-hustle/bombo-02.jpg",
    social_links: {
      instagram: "https://instagram.com/bombohustle",
      spotify: "https://open.spotify.com/artist/bombohustle",
      youtube: "https://youtube.com/@bombohustle",
    },
    media: {
      audio: [],
      video: [],
    },
    featured: true,
    shape: "landscape",
    spotify_embed: "https://open.spotify.com/embed/artist/27f9q813v2dChRMDoQti5O?utm_source=generator",
  },
  {
    id: "8",
    slug: "solofk",
    name: "SoloFK",
    bio: "Artista urbano cristiano de Soacha que canaliza sus luchas internas y su fe en musica honesta y cruda. Su propuesta fusiona rap, trap y sonidos urbanos con letras de esperanza y vulnerabilidad.",
    bio_full: "Franki Leonardo Molina Bernal, mejor conocido en la musica urbana como SoloFK, nace un 22 de diciembre de 1997 en Soacha, Cundinamarca, Colombia. Comienza su carrera musical a los 16 anos, encontrando en la musica el canal perfecto para expresar lo que las palabras solas no podian.\n\nA causa de sus problemas de depresion y ansiedad, SoloFK decide tornar su mirada a Dios a los 13 anos y, con altos y bajos, decide dedicar su vida a escribir canciones del amor de Jesus y sus problemas internos a traves de la musica urbana. No es musica que predica desde un pulpito: es musica que habla desde la trinchera, desde la lucha real, desde las noches oscuras y los amaneceres que llegan cuando ya no los esperas.\n\nCanciones como \"Desahogo 1\", \"Desahogo 2\" y \"Desahogo 3\" se convirtieron en un espacio de catarsis compartida con su audiencia—temas donde la vulnerabilidad es la fuerza. \"Montana Rusa\" y \"Nunca Imagine\" capturan los vaivenes emocionales de quien pelea con sus demonios pero elige seguir adelante.\n\nSu album \"MENTE DE VIAJE\" es la obra que mejor define su propuesta: un recorrido por los paisajes internos de alguien que ha decidido ser transparente con su dolor y con su fe. Cada track es un capitulo de una historia que muchos viven pero pocos se atreven a contar.\n\nSoloFK demuestra que la musica urbana puede ser profundamente espiritual sin dejar de ser autentica, callejera y real. Su mensaje resuena con una generacion que busca algo mas que beats: busca verdad.",
    location: "Soacha, Colombia",
    agent_id: "1",
    photo_url: "/artists/solofk/solofk-01.jpg",
    hero_image_url: "/artists/solofk/solofk-02.jpg",
    social_links: {
      instagram: "https://instagram.com/solofk",
      spotify: "https://open.spotify.com/artist/solofk",
      youtube: "https://youtube.com/@solofk",
    },
    media: {
      audio: [],
      video: [],
    },
    featured: false,
    shape: "square",
    spotify_embed: "https://open.spotify.com/embed/artist/42UjaROPpLRPzMJOn0Nq47?utm_source=generator",
    spotify_album_embed: "https://open.spotify.com/embed/album/5wKtryzhYarBLkp39kLleI?utm_source=generator",
    discography: [
      { title: "MENTE DE VIAJE", year: 2024, spotify_url: "https://open.spotify.com" },
    ],
  },
  {
    id: "7",
    slug: "andres-santana",
    name: "Andres Santana",
    bio: "Cantautor colombiano que fusiona baladas pop y musica romantica con ritmos afro y caribenos, creando un sonido calido y envolvente.",
    bio_full: "Andres Santana es un cantautor colombiano cuya musica vive en la interseccion entre las baladas pop, la romantica latina y los ritmos afro-caribenos. Su propuesta nace de una sensibilidad melodica profunda, heredada de los grandes baladistas, pero con los pies firmemente plantados en la riqueza ritmica del Caribe y la costa atlantica.\n\nCon una voz que transmite intimidad y calidez, Andres construye canciones que hablan de amor, nostalgia y conexion humana, envueltas en arreglos donde conviven las guitarras acusticas con percusiones afro, marimbas y sintetizadores que le dan un aire contemporaneo a lo tradicional.\n\nSu sonido es un puente entre generaciones: quienes crecieron con los boleros y las baladas encuentran en su musica un eco familiar, mientras que las nuevas audiencias descubren en el una forma fresca de vivir la romantica latina. Cada cancion de Andres Santana es una invitacion a sentir, a dejarse llevar por melodias que abrazan y ritmos que mueven.\n\nComo parte del roster de MG Company Group, Andres Santana representa la versatilidad y la riqueza musical colombiana, demostrando que la musica romantica puede ser innovadora sin perder su esencia emotiva.",
    location: "Colombia",
    agent_id: "1",
    photo_url: "/artists/andres-santana/andres-01.jpg",
    hero_image_url: "/artists/andres-santana/andres-02.jpg",
    social_links: {
      instagram: "https://instagram.com/andressantana",
      spotify: "https://open.spotify.com/artist/andressantana",
      youtube: "https://youtube.com/@andressantana",
    },
    media: {
      audio: [],
      video: [],
    },
    featured: true,
    shape: "landscape",
    spotify_embed: "https://open.spotify.com/embed/artist/1IBZOpSsUlYvrO0931F8Kd?utm_source=generator",
    stream_embed: "https://untitled.stream/embed/nZ69MN2H8eAd",
  },
  {
    id: "9",
    slug: "karen-dayanna",
    name: "Karen Dayanna",
    bio: "Cantautora bogotana que cruza la cancion de autor con el pop, el indie, el folclore y el soft rock. Letras sobre memoria, transformacion y todo lo que perdura.",
    bio_full: "Karen Dayanna es una cantautora de Bogota con una propuesta que combina el alma de la cancion de autor con influencias del pop, el indie, el folclore y el soft rock, logrando un sonido fresco y sensible. A traves de sus letras busca explorar los procesos de transformacion, cargados de emocion y honestidad, invitando a quien escucha a reconocerse en ellas.\n\nSu obra trasciende a la memoria y el recuerdo, habita y crea alrededor de la levedad del ser. Viste y se abandera en la piel de todo lo sensible, lo intimo y lo humano, siendo una extension artistica del inherente deseo de encontrarse a si mismo.\n\nSus presentaciones combinan el abrazo calido de la remembranza, la profundidad sonora y una conexion intensa con las emociones, creando experiencias inmersivas en cada escenario.\n\nA traves de plataformas digitales, performances en vivo y eventos, Karen abre su camino en la escena emergente, posicionandose como una de las voces frescas que apuestan por la autenticidad en la musica independiente de Bogota.",
    tagline: "Mucho mas que un show.",
    genre: "Cancion de autor / Pop / Indie / Folk",
    meta_description: "Karen Dayanna, cantautora bogotana de cancion de autor, pop e indie. Escucha Pa' Toda la Vida y Volare, mira sus fotos y contactala para booking y prensa.",
    booking_email: "daka.musicaindependiente@gmail.com",
    press_kit_url: "/press/press-kit-karen-dayanna.pdf",
    location: "Bogota, Colombia",
    agent_id: "1",
    photo_url: "/artists/karen-dayanna/kd-portrait.jpg",
    hero_image_url: "/artists/karen-dayanna/kd-sesion-cuarto.jpg",
    gallery: [
      "/artists/karen-dayanna/kd-portrait.jpg",
      "/artists/karen-dayanna/kd-closeup.jpg",
      "/artists/karen-dayanna/kd-blazer.jpg",
      "/artists/karen-dayanna/kd-live-01.jpg",
      "/artists/karen-dayanna/kd-live-sala.jpg",
      "/artists/karen-dayanna/kd-sesion-cuarto.jpg",
    ],
    social_links: {
      instagram: "https://www.instagram.com/dakaq.r/",
      spotify: "https://open.spotify.com/artist/2KjluTBGvdPx6fU9VM726a",
      website: "https://linktr.ee/dakaq.r",
    },
    media: {
      audio: [],
      video: [],
    },
    featured: true,
    shape: "portrait",
    spotify_embed:
      "https://open.spotify.com/embed/artist/2KjluTBGvdPx6fU9VM726a?utm_source=generator&theme=0",
  },
]

// Populate agent references
mockArtists.forEach(artist => {
  artist.agent = mockAgents.find(agent => agent.id === artist.agent_id)
})

// Business Units
export const mockBusinessUnits: BusinessUnit[] = [
  {
    slug: "mg-music",
    name: "MG Music",
    tagline: "Produccion musical de clase mundial",
    description: "MG Music es la division de produccion y distribucion musical de MG Company Group. Nos encargamos de la creacion, grabacion, mezcla, masterizacion y distribucion de musica para nuestros artistas. Contamos con un estudio de grabacion equipado con la mejor tecnologia y un equipo de productores e ingenieros de sonido de primer nivel.",
    services: ["Produccion musical", "Grabacion en estudio", "Mezcla y masterizacion", "Distribucion digital", "Composicion y arreglos", "Beats y produccion"],
    image_url: "/generated/mg-music.png",
  },
  {
    slug: "mg-film",
    name: "MG Film",
    tagline: "Contenido visual que cuenta historias",
    description: "MG Film es la productora audiovisual de MG Company Group. Creamos videoclips, documentales, contenido para redes sociales y piezas cinematograficas que elevan la imagen de nuestros artistas y marcas aliadas. Cada proyecto es tratado con el mismo nivel de detalle y calidad cinematografica.",
    services: ["Videoclips musicales", "Documentales", "Contenido para redes", "Direccion creativa", "Post-produccion", "Motion graphics"],
    image_url: "/generated/mg-film.png",
  },
  {
    slug: "mg-up",
    name: "MG Up",
    tagline: "Desarrollo y gestion de talento",
    description: "MG Up es la division de desarrollo artistico y management. Nos encargamos de descubrir, formar y posicionar nuevos talentos en la industria musical. Ofrecemos un programa integral que cubre desde la formacion artistica hasta la estrategia de marca personal y posicionamiento en plataformas digitales.",
    services: ["Management artistico", "Desarrollo de marca personal", "Estrategia digital", "Booking y contrataciones", "Relaciones publicas", "Coaching artistico"],
    image_url: "/generated/mg-up.png",
  },
  {
    slug: "mg-live",
    name: "MG Live",
    tagline: "Experiencias en vivo inolvidables",
    description: "MG Live es la division de eventos y producciones en vivo de MG Company Group. Organizamos conciertos, festivales, showcases y eventos corporativos con los mas altos estandares de produccion. Cada evento es una experiencia unica diseñada para conectar artistas con su publico.",
    services: ["Produccion de eventos", "Conciertos y festivales", "Showcases", "Eventos corporativos", "Giras y tours", "Produccion tecnica"],
    image_url: "/generated/mg-live.png",
  },
]

// MG Flow Shows
export const mockMGFlowShows: MGFlowShow[] = [
  {
    slug: "dia-de-clase",
    title: "Dia de Clase",
    description: "Un espacio educativo donde artistas y profesionales de la industria comparten conocimientos y experiencias sobre el negocio de la musica.",
    thumbnail: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&h=400&fit=crop",
    category: "Educativo",
    episodes: [
      { title: "Como empezar en la industria musical", youtube_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "45:00" },
      { title: "Derechos de autor y regalias", youtube_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "38:00" },
    ],
  },
  {
    slug: "the-hustle-report",
    title: "The Hustle Report",
    description: "Reportajes y entrevistas a fondo sobre la escena urbana, los negocios detras de la musica y las historias de exito.",
    thumbnail: "https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=600&h=400&fit=crop",
    category: "Entrevistas",
    episodes: [
      { title: "El negocio del streaming", youtube_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "52:00" },
      { title: "Independiente vs Sello discografico", youtube_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "41:00" },
    ],
  },
  {
    slug: "studio-sessions",
    title: "Studio Sessions",
    description: "Sesiones en vivo desde el estudio de MG Company Group. Artistas interpretando sus temas en un formato intimo y acustico.",
    thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=400&fit=crop",
    category: "Musica",
    episodes: [
      { title: "Bad Fellaz - Sesion Acustica", youtube_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "28:00" },
      { title: "Miguelacho TF - En el estudio", youtube_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "32:00" },
    ],
  },
  {
    slug: "behind-the-beat",
    title: "Behind the Beat",
    description: "Un vistazo al proceso creativo de los productores. Desde la idea inicial hasta el track terminado.",
    thumbnail: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=600&h=400&fit=crop",
    category: "Produccion",
    episodes: [
      { title: "Como hacer un beat de trap", youtube_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "35:00" },
    ],
  },
  {
    slug: "mg-freestyle",
    title: "MG Freestyle",
    description: "Los artistas del roster se enfrentan al microfono en sesiones de freestyle puro. Sin filtros, sin edicion.",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop",
    category: "Musica",
    episodes: [
      { title: "Freestyle Session #1", youtube_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "15:00" },
      { title: "Freestyle Session #2", youtube_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "18:00" },
      { title: "Freestyle Session #3", youtube_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "12:00" },
    ],
  },
  {
    slug: "la-ruta",
    title: "La Ruta",
    description: "Docuserie que sigue a los artistas de MG Company Group en sus giras, shows y vida cotidiana.",
    thumbnail: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=600&h=400&fit=crop",
    category: "Documental",
    episodes: [
      { title: "Detras de camaras - Tour 2024", youtube_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "48:00" },
    ],
  },
  {
    slug: "el-podcast-mg",
    title: "El Podcast MG",
    description: "Conversaciones sin guion con artistas, productores y figuras de la industria. El lado humano de la musica.",
    thumbnail: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&h=400&fit=crop",
    category: "Podcast",
    episodes: [
      { title: "Episodio 1 - Los inicios", youtube_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "62:00" },
      { title: "Episodio 2 - El futuro del urbano", youtube_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "55:00" },
    ],
  },
  {
    slug: "clash-de-beats",
    title: "Clash de Beats",
    description: "Productores compiten creando beats en tiempo real. Creatividad, presion y talento puro.",
    thumbnail: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=600&h=400&fit=crop",
    category: "Competencia",
    episodes: [
      { title: "Ronda 1 - Trap vs Reggaeton", youtube_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "25:00" },
    ],
  },
]

// Gallery Items
export const mockGalleryItems: GalleryItem[] = [
  { id: "g1", type: "photo", url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=600&fit=crop", category: "estudio", caption: "Sesion de grabacion" },
  { id: "g2", type: "photo", url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop", category: "en-vivo", caption: "Show en vivo" },
  { id: "g3", type: "photo", url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=600&fit=crop", category: "eventos", caption: "Festival MG Live" },
  { id: "g4", type: "photo", url: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&h=600&fit=crop", category: "bts", caption: "Detras de camaras" },
  { id: "g5", type: "photo", url: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&h=600&fit=crop", category: "en-vivo", caption: "Concierto" },
  { id: "g6", type: "photo", url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=600&fit=crop", category: "eventos", caption: "Evento especial" },
  { id: "g7", type: "photo", url: "https://images.unsplash.com/photo-1571266028243-d220fec7fe85?w=800&h=600&fit=crop", category: "estudio", caption: "En el estudio" },
  { id: "g8", type: "photo", url: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=600&fit=crop", category: "en-vivo", caption: "Performance" },
  { id: "g9", type: "video", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=600&fit=crop", category: "bts", caption: "Making of videoclip" },
  { id: "g10", type: "photo", url: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=600&fit=crop", category: "estudio", caption: "Produccion musical" },
  { id: "g11", type: "photo", url: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&h=600&fit=crop", category: "eventos", caption: "Lanzamiento" },
  { id: "g12", type: "photo", url: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&h=400&fit=crop", category: "bts", caption: "Sesion de fotos" },
]

// Team Members
export const mockTeamMembers: TeamMember[] = [
  {
    name: "Miguel Garcia",
    role: "CEO & Fundador",
    photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    bio: "Visionario y emprendedor detras de MG Company Group. Con mas de 10 anos de experiencia en la industria musical.",
  },
  {
    name: "Laura Martinez",
    role: "Directora Creativa",
    photo_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    bio: "Encargada de la direccion artistica y visual de todos los proyectos de MG Company Group.",
  },
  {
    name: "Carlos Hernandez",
    role: "Director de MG Music",
    photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    bio: "Productor musical e ingeniero de sonido con amplia experiencia en la industria.",
  },
  {
    name: "Andrea Lopez",
    role: "Directora de MG Film",
    photo_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    bio: "Directora audiovisual especializada en videoclips y contenido musical.",
  },
]

// Mock Company Information
export const mockContactInfo: ContactInfo = {
  company_name: "MG Company Group",
  address: {
    line1: "Carrera 43A #1-50",
    line2: "Oficina 201",
    city: "Medellin",
    postal_code: "050021",
    country: "Colombia",
  },
  email: {
    general: "info@mgcompanygroup.com",
    bookings: "bookings@mgcompanygroup.com",
    press: "prensa@mgcompanygroup.com",
  },
  phone: "+57 300 123 4567",
  about: {
    short: "MG Company Group es una productora artistica integral que impulsa el talento latino a traves de musica, cine, eventos en vivo y desarrollo de artistas.",
    long: "Fundada con la vision de transformar la industria del entretenimiento latino, MG Company Group se ha consolidado como una productora artistica de referencia. Nuestras cuatro unidades de negocio — MG Music, MG Film, MG Up y MG Live — trabajan en sinergia para ofrecer un ecosistema completo que cubre todas las necesidades de un artista moderno. Desde la produccion musical hasta la creacion de contenido audiovisual, desde el desarrollo de talento hasta la organizacion de eventos memorables, en MG Company Group creemos en el poder de la creatividad y el trabajo duro para llevar el talento latino al mundo.",
  },
  social: {
    instagram: "https://instagram.com/mgcompanygroup",
    youtube: "https://youtube.com/@mgcompanygroup",
    spotify: "https://open.spotify.com/mgcompanygroup",
    tiktok: "https://tiktok.com/@mgcompanygroup",
  },
}

// Helper functions
export function getArtistBySlug(slug: string): Artist | undefined {
  return mockArtists.find(artist => artist.slug === slug)
}

export function getArtistsByAgent(agentId: string): Artist[] {
  return mockArtists.filter(artist => artist.agent_id === agentId)
}

export function getFeaturedArtists(): Artist[] {
  return mockArtists.filter(artist => artist.featured)
}

export function getAllArtists(): Artist[] {
  return mockArtists
}

export function getAllAgents(): Agent[] {
  return mockAgents
}

export function getAgentById(id: string): Agent | undefined {
  return mockAgents.find(agent => agent.id === id)
}

export function getBusinessUnitBySlug(slug: string): BusinessUnit | undefined {
  return mockBusinessUnits.find(unit => unit.slug === slug)
}

export function getAllBusinessUnits(): BusinessUnit[] {
  return mockBusinessUnits
}

export function getShowBySlug(slug: string): MGFlowShow | undefined {
  return mockMGFlowShows.find(show => show.slug === slug)
}

export function getAllShows(): MGFlowShow[] {
  return mockMGFlowShows
}

export function getAllGalleryItems(): GalleryItem[] {
  return mockGalleryItems
}

export function getGalleryByCategory(category: string): GalleryItem[] {
  if (category === 'todos') return mockGalleryItems
  return mockGalleryItems.filter(item => item.category === category)
}

export function getAllTeamMembers(): TeamMember[] {
  return mockTeamMembers
}
