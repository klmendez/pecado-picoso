import { Link, NavLink } from "react-router-dom";
import { CITY } from "../data/constants";

const INSTAGRAM_URL = "https://www.instagram.com/pecadopicoso.pop/";
const WHATSAPP_PHONE = "3178371144";
const NEQUI_PHONE = "3177708226";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "text-sm no-underline visited:text-inherit transition",
    isActive ? "text-white" : "text-red-100/80 hover:text-white",
  ].join(" ");

const linkClass = "text-red-100/80 hover:text-white transition no-underline visited:text-inherit";

export default function Footer() {
  return (
    <footer
      className="
        border-t border-white/10
        bg-gradient-to-b from-black/80 via-red-950/80 to-red-900/70
        backdrop-blur-sm
      "
    >
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Marca */}
          <div className="space-y-4">
            <div className="font-black tracking-[0.18em] text-white text-sm">
              PECADO PICOSO
            </div>

            <p className="text-sm text-red-100/80 leading-relaxed max-w-sm">
              Dulce, ácido y picoso en una sola mordida. {CITY}.
            </p>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/armar"
                className="
                  inline-flex items-center justify-center
                  rounded-full
                  px-4 py-2
                  text-sm font-black
                  text-white
                  bg-white/10 hover:bg-white/15
                  border border-white/15 hover:border-white/25
                  transition
                  no-underline visited:text-inherit
                "
              >
                Pedir ahora
              </Link>

              <a
                href={`https://wa.me/57${WHATSAPP_PHONE}`}
                target="_blank"
                rel="noreferrer"
                className="
                  inline-flex items-center justify-center
                  rounded-full
                  px-4 py-2
                  text-sm font-black
                  text-white/90 hover:text-white
                  bg-transparent
                  border border-white/10 hover:border-white/20
                  transition
                  no-underline visited:text-inherit
                "
              >
                WhatsApp
              </a>
            </div>
          </div>

          {/* Navegación */}
          <div className="space-y-4">
            <div className="text-sm font-black text-white">Navegación</div>

            <nav className="grid gap-2">
              <NavLink to="/catalogo" className={navLinkClass}>
                Catálogo
              </NavLink>
              <NavLink to="/armar" className={navLinkClass}>
                Armar pedido
              </NavLink>
              <NavLink to="/terminos" className={navLinkClass}>
                Términos
              </NavLink>
              <NavLink to="/contacto" className={navLinkClass}>
                Contacto
              </NavLink>
            </nav>
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div>
              <div className="text-sm font-black text-white">Instagram</div>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm text-red-100/80 hover:text-white transition no-underline visited:text-inherit"
              >
                @pecadopicoso.pop
              </a>
            </div>

            <div>
              <div className="text-sm font-black text-white">WhatsApp</div>
              <a
                href={`https://wa.me/57${WHATSAPP_PHONE}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm text-red-100/80 hover:text-white transition no-underline visited:text-inherit"
              >
                +57 {WHATSAPP_PHONE}
              </a>
            </div>

            <div>
              <div className="text-sm font-black text-white">Pago</div>
              <div className="mt-2 text-sm text-red-100/80">
                Nequi / Llave: <span className="font-black text-white">{NEQUI_PHONE}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Línea inferior */}
        <div className="mt-10 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs text-red-100/70">
            © {new Date().getFullYear()} Pecado Picoso. Todos los derechos reservados.
          </div>

          <div className="flex gap-4 text-xs">
            <Link to="/terminos" className={linkClass}>
              Términos
            </Link>
            <Link to="/contacto" className={linkClass}>
              Contacto
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
