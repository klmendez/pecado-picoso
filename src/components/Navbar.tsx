import { useEffect, useState, useRef } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, MessageCircle, ChevronDown,
} from "lucide-react";
import { useStoreProducts } from "../hooks/useStoreProducts";
import { WHATSAPP_PHONE, INSTAGRAM_URL } from "../data/constants";
import logo from "../assets/logo.webp";

const simpleLinks = [
  { to: "/", label: "Inicio" },
  { to: "/catalogo", label: "Catálogo" },
  { to: "/contacto", label: "Contacto" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [colOpen, setColOpen] = useState(false);
  const [mobileColOpen, setMobileColOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { categories } = useStoreProducts();

  const isCategoriaActive = location.pathname === "/catalogo" || location.pathname === "/armar";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setColOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setColOpen(false);
  }, [location]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen]);

  return (
    <>
      {/* Announcement bar */}
      <div className="hidden sm:flex bg-rojo text-white text-xs font-medium py-1.5 overflow-hidden items-center justify-between">
        <div className="flex-1 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-8">
                <MessageCircle size={13} className="flex-shrink-0" />
                Dulce, ácido y picoso — Gomitas ahogadas y picosas en Popayán — Envíos rápidos
                <span className="mx-4 opacity-40">·</span>
              </span>
            ))}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-white pl-4 pr-4 flex-shrink-0 bg-rojo">
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:opacity-70 transition-opacity">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0">
              <motion.img
                src={logo}
                alt="Pecado Picoso"
                className="h-10 sm:h-12 lg:h-16 w-auto"
                whileHover={{ scale: 1.05 }}
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `text-sm font-semibold transition-colors ${isActive ? "text-black border-b-2 border-rojo pb-0.5" : "text-gray-600 hover:text-black"}`
                }
              >
                Inicio
              </NavLink>

              {/* Categorías dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setColOpen(!colOpen)}
                  className={`flex items-center gap-1 text-sm font-semibold transition-colors ${
                    isCategoriaActive ? "text-black border-b-2 border-rojo pb-0.5" : "text-gray-600 hover:text-black"
                  }`}
                >
                  Categorías
                  <ChevronDown size={14} className={`transition-transform duration-200 ${colOpen ? "rotate-180" : ""}`} />
                </button>

                {colOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 bg-white  shadow-lg border border-gray-100 py-2 z-50">
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45" />
                    {categories.map((c) => (
                      <Link
                        key={c.id}
                        to={`/armar?categoria=${c.id}`}
                        className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-rojo-light hover:text-black transition-colors gap-2"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {simpleLinks.slice(1).map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `text-sm font-semibold transition-colors ${isActive ? "text-black border-b-2 border-rojo pb-0.5" : "text-gray-600 hover:text-black"}`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Icons */}
            <div className="flex items-center gap-3">
              <Link
                to="/armar"
                className="hidden sm:inline-flex items-center gap-2 bg-rojo hover:bg-rojo-dark text-white font-bold px-4 py-2.5  text-sm transition-colors shadow-md"
              >
                Pedir ahora
              </Link>
              <button
                className="md:hidden p-2 text-gray-700"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menú"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-black/40"
                onClick={() => setMenuOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.div
                className="md:hidden fixed z-50 top-[68px] right-4 left-4 bg-white  shadow-lg border border-gray-100 overflow-hidden"
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
              >
                <div className="px-4 py-4 flex flex-col gap-1">
                  <NavLink to="/" end onClick={() => setMenuOpen(false)} className={({ isActive }) => `text-base font-semibold py-2 ${isActive ? "text-black" : "text-gray-600"}`}>
                    Inicio
                  </NavLink>

                  <div>
                    <button
                      onClick={() => setMobileColOpen(!mobileColOpen)}
                      className="w-full flex items-center justify-between text-base font-semibold py-2 text-gray-600"
                    >
                      Categorías
                      <ChevronDown size={16} className={`transition-transform duration-200 ${mobileColOpen ? "rotate-180" : ""}`} />
                    </button>
                    {mobileColOpen && (
                      <div className="pl-4 flex flex-col gap-1 border-l-2 border-rojo ml-1 mb-1">
                        {categories.map((c) => (
                          <Link key={c.id} to={`/armar?categoria=${c.id}`} onClick={() => setMenuOpen(false)} className="text-sm font-semibold py-1.5 text-gray-600 hover:text-black transition-colors">
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {simpleLinks.slice(1).map(({ to, label }) => (
                    <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `text-base font-semibold py-2 ${isActive ? "text-black" : "text-gray-600"}`}>
                      {label}
                    </NavLink>
                  ))}

                  <Link
                    to="/armar"
                    onClick={() => setMenuOpen(false)}
                    className="mt-2 bg-rojo text-white text-center font-bold py-3 flex items-center justify-center gap-2"
                  >
                    Pedir ahora
                  </Link>

                  <a
                    href={`https://wa.me/57${WHATSAPP_PHONE}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 bg-green-500 text-white text-center font-bold py-3  flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={18} />
                    Comprar por WhatsApp
                  </a>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
