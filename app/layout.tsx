import type React from "react"
import type { Metadata } from "next"
import { Inter, Bebas_Neue, JetBrains_Mono, Cormorant_Garamond } from "next/font/google"
import "./globals.css"
import RescateRecuperacion from "@/components/admin/rescate-recuperacion"
import SiteChrome from "@/components/site-chrome"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" })
const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
})
// Sustituto libre de Kudryashev Display Contrast, la tipografia de contraste
// del press kit de Karen Dayanna
const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-cormorant",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://mgcompany.co"),
  title: "MG Company Group | Productora Artistica",
  description: "MG Company Group es una productora artistica integral. Musica, cine, eventos en vivo y desarrollo de talento.",
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "MG Company Group",
    title: "MG Company Group | Productora Artística",
    description:
      "Música, film, management y eventos en vivo. Convertimos talento en marca.",
    images: [
      {
        url: "/og/og-home.jpg",
        width: 1200,
        height: 630,
        alt: "MG Company Group — Productora Artística",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MG Company Group | Productora Artística",
    description:
      "Música, film, management y eventos en vivo. Convertimos talento en marca.",
    images: ["/og/og-home.jpg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.variable} ${bebasNeue.variable} ${jetbrainsMono.variable} ${cormorant.variable} font-body`}>
        <RescateRecuperacion />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  )
}
