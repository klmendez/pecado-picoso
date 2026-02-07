import { useEffect, useState, type SVGProps } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/logo.webp";
import { NEQUI_PHONE } from "../data/constants";

const WHATSAPP_PHONE = "3178371144";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "px-3 py-2 rounded-lg text-sm font-medium transition no-underline visited:text-inherit",
    isActive
      ? "bg-white/10 text-white"
      : "text-red-100 hover:bg-white/10 hover:text-white",
  ].join(" ");

const mobileItemClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center justify-between w-full px-4 py-3 rounded-xl no-underline visited:text-inherit transition",
    isActive ? "bg-white/10 text-white" : "text-red-100 hover:bg-white/10 hover:text-white",
  ].join(" ");

function IconMenu(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4 6.5A1 1 0 0 1 5 5.5h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm0 6A1 1 0 0 1 5 11.5h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm1 5a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2H5Z" />
    </svg>
  );
}

function IconClose(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.3 5a1 1 0 0 1 1.4 0L12 9.3 16.3 5a1 1 0 1 1 1.4 1.4L13.4 10.7l4.3 4.3a1 1 0 1 1-1.4 1.4L12 12.1l-4.3 4.3a1 1 0 1 1-1.4-1.4l4.3-4.3-4.3-4.3A1 1 0 0 1 6.3 5Z" />
    </svg>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Cierra el menú al navegar
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Bloquea scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="pp-container pt-4 pb-3 md:pt-6 md:pb-4">
        <div className="relative">
          {/* BARRA PRINCIPAL (pill) */}
          <div
            className="
              flex items-center justify-between gap-3 sm:gap-4
              rounded-full
              bg-gradient-to-b from-black/80 via-red-950/80 to-red-900/70
              backdrop-blur-sm
              px-4 sm:px-6
              py-2
              shadow-md shadow-black/25
              pl-[88px] sm:pl-[116px]
            "
          >
            {/* MARCA */}
            <Link
              to="/"
              className="flex items-center gap-2 text-white no-underline visited:text-inherit min-w-0"
              aria-label="Ir al inicio"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <div className="leading-tight min-w-0">
                <div className="font-black tracking-wide text-[13px] sm:text-sm md:text-base truncate">
                  PECADO PICOSO
                </div>
              </div>
            </Link>

            {/* NAV DESKTOP */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/armar" className={navLinkClass}>
                Armar pedido
              </NavLink>
              <NavLink to="/catalogo" className={navLinkClass}>
                Ver catálogo
              </NavLink>
              <NavLink to="/terminos" className={navLinkClass}>
                Términos
              </NavLink>
              <NavLink to="/contacto" className={navLinkClass}>
                Contacto
              </NavLink>
            </nav>

            {/* RIGHT SIDE: CTA + HAMBURGUESA MOBILE */}
            <div className="flex items-center gap-2">
              <Link
                to="/armar"
                className="
                  inline-flex items-center gap-2
                  rounded-xl
                  bg-red-900 text-white
                  px-3 sm:px-4
                  py-2
                  text-[12px] sm:text-sm font-bold
                  shadow-md shadow-black/40
                  hover:bg-red-600 hover:shadow-red-900/50
                  transition
                  no-underline visited:text-inherit
                  whitespace-nowrap
                "
              >
                <span className="hidden sm:inline">Pedir ahora</span>
                <span className="sm:hidden">Pedir</span>
              </Link>

              {/* Botón menú (solo mobile) */}
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="
                  md:hidden
                  inline-flex items-center justify-center
                  h-10 w-10
                  rounded-xl
                  border border-white/15
                  bg-white/5 hover:bg-white/10
                  text-white
                  transition
                "
                aria-label="Abrir menú"
              >
                <IconMenu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* LOGO (sale de la barra) */}
          <Link
            to="/"
            className="
              absolute left-0 top-1/2
              -translate-x-[18%] sm:-translate-x-[22%]
              -translate-y-1/2
              no-underline visited:text-inherit
            "
            aria-label="Ir al inicio"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <motion.div
              initial={{ rotate: -8, scale: 0.95 }}
              animate={{ rotate: 0, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              className="
                relative
                h-[96px] w-[96px]
                sm:h-[118px] sm:w-[118px]
                md:h-[126px] md:w-[126px]
                rounded-full
                bg-transparent
                flex items-center justify-center
              "
              title="Pecado Picoso"
            >
              <img
                src={logo}
                alt="Pecado Picoso"
                className="
                  relative
                  h-[72px] sm:h-[90px] md:h-[100px]
                  w-auto object-contain
                  drop-shadow-[0_10px_22px_rgba(0,0,0,0.45)]
                "
              />
            </motion.div>
          </Link>

          {/* DRAWER MOBILE */}
          <AnimatePresence>
            {open && (
              <>
                {/* overlay */}
                <motion.button
                  type="button"
                  onClick={close}
                  aria-label="Cerrar menú"
                  className="fixed inset-0 z-[60] bg-black/55"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />

                {/* panel */}
                <motion.aside
                  className="
                    fixed z-[70]
                    top-3 right-3 left-3
                    rounded-2xl
                    border border-white/10
                    bg-gradient-to-b from-black/85 via-red-950/85 to-red-900/80
                    backdrop-blur
                    shadow-xl shadow-black/40
                    overflow-hidden
                  "
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <div className="text-white font-black tracking-wide text-sm">
                      Menú
                    </div>
                    <button
                      type="button"
                      onClick={close}
                      className="
                        inline-flex h-9 w-9 items-center justify-center
                        rounded-xl
                        border border-white/15
                        bg-white/5 hover:bg-white/10
                        text-white transition
                      "
                      aria-label="Cerrar"
                    >
                      <IconClose className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="p-3">
                    <nav className="grid gap-2">
                      <NavLink to="/catalogo" className={mobileItemClass}>
                        Ver catálogo
                      </NavLink>
                      <NavLink to="/armar" className={mobileItemClass}>
                        Armar pedido
                      </NavLink>
                      <NavLink to="/terminos" className={mobileItemClass}>
                        Términos
                      </NavLink>
                      <NavLink to="/contacto" className={mobileItemClass}>
                        Contacto
                      </NavLink>
                    </nav>

                    <div className="mt-3 grid gap-2">
                      <a
                        href={`https://wa.me/57${WHATSAPP_PHONE}`}
                        target="_blank"
                        rel="noreferrer"
                        className="
                          inline-flex items-center justify-center
                          rounded-xl
                          px-4 py-3
                          text-sm font-black
                          text-white
                          bg-white/10 hover:bg-white/15
                          border border-white/15 hover:border-white/25
                          transition
                          no-underline
                        "
                      >
                        Escribir por WhatsApp
                      </a>

                      <a
                        href="https://www.instagram.com/pecadopicoso.pop/"
                        target="_blank"
                        rel="noreferrer"
                        className="
                          inline-flex items-center justify-center
                          rounded-xl
                          px-4 py-3
                          text-sm font-black
                          text-white/90 hover:text-white
                          border border-white/10 hover:border-white/20
                          transition
                          no-underline
                        "
                      >
                        Instagram @pecadopicoso.pop
                      </a>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-xs text-red-100/75">
                        Nequi: <span className="font-black text-white">{NEQUI_PHONE}</span>
                      </div>
                    </div>
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
