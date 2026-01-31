import { Link, NavLink } from "react-router-dom";
import { INSTAGRAM, NEQUI_PHONE, CITY } from "../data/constants";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "px-3 py-2 rounded-lg text-sm font-medium transition no-underline visited:text-inherit",
    isActive ? "bg-white/10 text-white" : "text-red-100 hover:bg-white/10 hover:text-white",
  ].join(" ");

const linkClass =
  "text-red-100 hover:text-white transition no-underline visited:text-inherit";

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
        <div className="grid gap-8 md:grid-cols-3">
          {/* Marca */}
          <div className="space-y-3">
            <div className="font-black tracking-wide text-base md:text-lg text-white">
              PECADO PICOSO
            </div>
            <p className="text-sm text-red-100/80 leading-relaxed">
              Dulce, ácido y picoso en una sola mordida. {CITY}.
            </p>

            <Link
              to="/armar"
              className="
                inline-flex items-center
                rounded-xl
                bg-red-900 text-white
                px-4 py-2
                text-sm font-bold
                shadow-md shadow-black/40
                hover:bg-red-600 hover:shadow-red-900/50
                transition
                no-underline visited:text-inherit
              "
            >
              Pedir ahora
            </Link>
          </div>

          {/* Navegación */}
          <div className="space-y-3">
            <div className="text-sm font-black text-white">Navegación</div>
            <nav className="flex flex-wrap gap-2">
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
          <div className="space-y-4">
            <div>
              <div className="text-sm font-black text-white">Redes</div>
              <div className="mt-2 text-sm text-red-100/80 break-all">
                {INSTAGRAM}
              </div>
            </div>

            <div>
              <div className="text-sm font-black text-white">Pago</div>
              <div className="mt-2 text-sm text-red-100/80">
                Nequi / Llave:{" "}
                <span className="font-bold text-white">{NEQUI_PHONE}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Línea inferior */}
        <div className="mt-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
