/** Shared blog post registry — source of truth for sitemap blog URLs and RSS feeds. */

export interface BlogPost {
  lang: "en" | "es";
  /** Absolute path including trailing slash, e.g. /blog/slug/ */
  path: string;
  title: string;
  description: string;
  /** YYYY-MM-DD */
  datePublished: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    lang: "en",
    path: "/blog/you-dont-have-to-sing-well/",
    title: "You Don't Have to Sing Well: Why Your Toddler Prefers Your Voice Anyway",
    description:
      "Babies don't grade on pitch. The research on why your imperfect, off-key singing is exactly what your toddler wants to hear — and what recordings can't replace.",
    datePublished: "2026-08-17",
  },
  {
    lang: "es",
    path: "/es/blog/cantarle-a-mi-bebe-si-canto-mal/",
    title: "¿Cantarle a mi bebé si canto mal? Por qué tu hijo prefiere tu voz de todos modos",
    description:
      "Los bebés no califican el tono. La investigación sobre por qué tu canto imperfecto y desafinado es exactamente lo que tu hijo quiere oír — y lo que las grabaciones no pueden reemplazar.",
    datePublished: "2026-08-17",
  },
  {
    lang: "en",
    path: "/blog/toddler-screen-time-honest-take/",
    title: "Screen Time for Toddlers: An Honest Take From People Who Make Toddler Content",
    description:
      "We make toddler music videos for a living. Here's our honest read of the screen time research — including when not to use our videos.",
    datePublished: "2026-08-04",
  },
  {
    lang: "es",
    path: "/es/blog/es-malo-youtube-para-ninos-pequenos/",
    title: "¿Es malo YouTube para niños pequeños? Una respuesta honesta",
    description:
      "Hacemos videos musicales para niños. Aquí va nuestra lectura honesta de la investigación sobre pantallas — incluso cuándo no usar nuestros videos.",
    datePublished: "2026-08-04",
  },
  {
    lang: "en",
    path: "/blog/why-toddlers-want-the-same-song-on-repeat/",
    title: "Why Toddlers Want the Same Song on Repeat (It's Not Torture, It's Learning)",
    description:
      "The 40th play-through is doing more for your toddler's brain than the 1st. The science of why kids demand repetition and why you should (usually) give in.",
    datePublished: "2026-07-29",
  },
  {
    lang: "es",
    path: "/es/blog/por-que-mi-hijo-quiere-la-misma-cancion/",
    title: "Por qué mi hijo quiere la misma canción una y otra vez (no es tortura: es aprendizaje)",
    description:
      "La reproducción número 40 hace más por el cerebro de tu hijo que la primera. La ciencia de por qué los niños piden repetición — y por qué (casi siempre) conviene ceder.",
    datePublished: "2026-07-29",
  },
  {
    lang: "en",
    path: "/blog/teaching-toddlers-second-language-songs/",
    title: "Teaching Your Toddler a Second Language With Songs (What Actually Works)",
    description:
      "Songs are the easiest way into a second language for toddlers — but only if you sing too. The research on early bilingual exposure, honestly explained.",
    datePublished: "2026-07-26",
  },
  {
    lang: "es",
    path: "/es/blog/ensenar-ingles-a-ninos-con-canciones/",
    title: "Enseñar inglés a niños con canciones (lo que sí funciona)",
    description:
      "Las canciones son la puerta más fácil al inglés para niños pequeños — pero solo si tú también cantas. La investigación sobre la exposición temprana, explicada con honestidad.",
    datePublished: "2026-07-26",
  },
  {
    lang: "en",
    path: "/blog/do-animal-sounds-count-as-words/",
    title: "Do Animal Sounds Count as Words? Yes, and Here's Why That's Great News",
    description:
      'Speech therapists count "moo" and "woof" as real words. Here\'s the science behind why animal sounds come first — and how farm songs help toddlers talk.',
    datePublished: "2026-07-21",
  },
  {
    lang: "es",
    path: "/es/blog/los-sonidos-de-animales-cuentan-como-palabras/",
    title: "¿Los sonidos de animales cuentan como palabras? Sí, y por qué es una gran noticia",
    description:
      'Los terapeutas del habla cuentan "muu" y "guau" como palabras reales. La ciencia detrás de por qué los sonidos de animales llegan primero — y cómo las canciones de la granja ayudan a hablar.',
    datePublished: "2026-07-21",
  },
  {
    lang: "en",
    path: "/blog/alphabet-songs-for-toddlers/",
    title: "Alphabet Songs for Toddlers: How Kids Really Learn Their ABCs",
    description:
      "The ABC song alone won't teach letters — but singing plus these 6 simple tricks will. How toddlers really learn the alphabet, backed by literacy research.",
    datePublished: "2026-07-20",
  },
  {
    lang: "es",
    path: "/es/blog/canciones-del-abecedario-para-ninos/",
    title: "Canciones del Abecedario para Niños: Aprender las Letras Cantando",
    description:
      "La canción del ABC por sí sola no enseña las letras — pero cantar más estos 6 trucos sencillos, sí. Cómo aprenden el abecedario los niños pequeños.",
    datePublished: "2026-07-20",
  },
  {
    lang: "en",
    path: "/blog/bedtime-songs-for-toddlers/",
    title: "Bedtime Songs for Toddlers: Build a Musical Wind-Down That Works",
    description:
      "Bedtime battles? Here's how to use lullabies and calm songs to build a toddler wind-down routine that actually works — backed by sleep research.",
    datePublished: "2026-07-20",
  },
  {
    lang: "en",
    path: "/blog/songs-to-teach-toddlers-colors/",
    title: "Songs to Teach Toddlers Colors: 7 Ways That Actually Work",
    description:
      "Trying to teach your toddler colors? Here are 7 simple, song-based activities you can do today — no printables, no prep, just music and play.",
    datePublished: "2026-07-19",
  },
];

export function postsForLang(lang: "en" | "es"): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.lang === lang);
}

export function absolutePostUrl(path: string): string {
  return `https://www.zaydio.com${path}`;
}
