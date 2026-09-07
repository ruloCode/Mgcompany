"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const navItems = [
  { href: "/nosotros", label: "Nosotros" },
  { href: "/artistas", label: "Artistas" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/mg-flow", label: "MG Flow" },
  { href: "/galeria", label: "Galeria" },
  { href: "/mg1/convocatoria", label: "Convocatoria" },
  { href: "/gala", label: "Gala MG" },
  { href: "/contacto", label: "Contacto" },
]

export default function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-mg-black/95 backdrop-blur-md border-b border-white/20 shadow-lg"
            : "bg-mg-black/70 backdrop-blur-sm border-b border-white/10"
        }`}
      >
        <div className="hidden md:flex items-center justify-between gap-6 px-6 lg:px-8 py-1.5 border-b border-white/10 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
          <span>MG / Productora artística</span>
          <span className="text-mg-red">Artistic Growth Company</span>
          <span>EST. 2024</span>
        </div>
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-5 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="hover:opacity-80 transition-opacity duration-200"
          >
            <Image
              src="/logo-mg.png"
              alt="MG Company Group"
              width={48}
              height={48}
              className="h-10 w-10 md:h-12 md:w-12"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm uppercase font-bold tracking-wide hover:text-mg-red transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-mg-red after:transition-all hover:after:w-full"
              >
                {item.label}
              </Link>
            ))}

            {/* Acceso al panel administrativo: deliberadamente discreto.
                Apunta a /admin y no a /admin/login: el middleware manda al
                login solo si no hay sesion, y al dashboard si ya la hay. */}
            <Link
              href="/admin"
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/30 hover:text-white/60 transition-colors duration-200 border-l border-white/10 pl-6"
            >
              Login
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-110"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-mg-black lg:hidden"
            onClick={toggleMenu}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="container mx-auto px-4 pt-24 flex flex-col gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <Link
                  href="/"
                  className="text-4xl font-heading uppercase tracking-tight hover:text-mg-red transition-colors block"
                  onClick={toggleMenu}
                >
                  Inicio
                </Link>
              </motion.div>
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 2), duration: 0.4 }}
                >
                  <Link
                    href={item.href}
                    className="text-4xl font-heading uppercase tracking-tight hover:text-mg-red transition-colors block"
                    onClick={toggleMenu}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (navItems.length + 2), duration: 0.4 }}
                className="pt-6 mt-2 border-t border-white/10"
              >
                <Link
                  href="/admin"
                  className="font-mono text-xs uppercase tracking-[0.25em] text-white/30 hover:text-white/60 transition-colors block"
                  onClick={toggleMenu}
                >
                  Login
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
