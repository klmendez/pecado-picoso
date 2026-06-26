import { Link } from "react-router-dom";
import { MapPin, Clock, MessageCircle } from "lucide-react";
import { CITY, INSTAGRAM_URL, waLink } from "../data/constants";
import logo from "../assets/logo.webp";

export default function Footer() {
  return (
    <footer className="bg-black text-white mt-auto">
      {/* Mobile footer (compact) */}
      <div className="md:hidden px-5 py-5 flex flex-col items-center gap-3">
        <img src={logo} alt="Pecado Picoso" className="h-10 w-auto" />
        <a
          href={waLink("Hola, quiero más información")}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-xs bg-green-500 text-white font-semibold px-4 py-2 "
        >
          <MessageCircle size={14} /> WhatsApp
        </a>
        <div className="flex gap-4">
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram" className="text-gray-500 hover:text-rojo transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
        </div>
        <p className="text-gray-600 text-[10px]">© {new Date().getFullYear()} Pecado Picoso</p>
      </div>

      {/* Desktop footer (full) */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <img src={logo} alt="Pecado Picoso" className="h-14 w-auto" />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Dulce, ácido y picoso. Las gomitas más atrevidas de {CITY}, bañadas en chamoy artesanal y tajín.
            </p>
          </div>

          {/* Nav links */}
          <div>
            <h3 className="font-bold text-rojo mb-4 uppercase tracking-wider text-sm">Tienda</h3>
            <ul className="space-y-2">
              {[
                { to: "/catalogo", label: "Catálogo" },
                { to: "/armar", label: "Armar Pedido" },
                { to: "/contacto", label: "Contacto" },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-gray-400 hover:text-rojo transition-colors text-sm">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-bold text-rojo mb-4 uppercase tracking-wider text-sm">Información</h3>
            <ul className="space-y-2">
              {[
                { to: "/terminos", label: "Términos" },
                { to: "/contacto", label: "Contacto" },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-gray-400 hover:text-rojo transition-colors text-sm">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-rojo mb-4 uppercase tracking-wider text-sm">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-gray-400 text-sm">
                <MapPin size={16} className="mt-0.5 flex-shrink-0 text-rojo" />
                {CITY}, Colombia
              </li>
              <li className="flex items-start gap-2 text-gray-400 text-sm">
                <Clock size={16} className="mt-0.5 flex-shrink-0 text-rojo" />
                Lun – Sáb: 10am – 8pm
              </li>
              <li>
                <a
                  href={waLink("Hola, quiero más información")}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm bg-green-500 hover:bg-green-600 transition-colors text-white font-semibold px-4 py-2  w-fit"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              </li>
            </ul>
            {/* Social */}
            <div className="flex gap-4 mt-5">
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram"
                className="text-gray-400 hover:text-rojo transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} Pecado Picoso. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
