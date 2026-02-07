import { NavLink, Link } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../assets/logo.webp";
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "px-3 py-2 rounded-lg text-sm font-medium transition no-underline visited:text-inherit",
    isActive
      ? "bg-white/10 text-white"
      : "text-red-100 hover:bg-white/10 hover:text-white",
  ].join(" ");

export default function Navbar() {
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

            {/* CTA */}
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
              {/* glow suave */}
              <span
                className="
                  pointer-events-none absolute inset-0 rounded-full
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  ring-2 ring-white/10
                  shadow-[0_0_28px_rgba(255,50,50,0.28)]
                "
              />

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
        </div>
      </div>
    </header>
  );
}
