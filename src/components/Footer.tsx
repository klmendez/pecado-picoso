import { Link, NavLink } from "react-router-dom";
import { CITY } from "../data/constants";
import logo from "../assets/logo.webp";

const INSTAGRAM_URL = "https://www.instagram.com/pecadopicoso.pop/";
const WHATSAPP_PHONE = "3178371144";
const NEQUI_PHONE = "3177708226";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "text-[11px] transition no-underline visited:text-inherit",
    isActive ? "text-white" : "text-red-100/75 hover:text-white",
  ].join(" ");

export default function Footer() {
  return (
    <footer
      className="
        border-t border-white/10
        bg-gradient-to-b from-red-950/90 via-red-900/90 to-red-950/95
        backdrop-blur
      "
    >
      <div className="mx-auto max-w-6xl px-4 py-4">
        {/* FILA SUPERIOR */}
        <div className="flex items-center justify-between gap-3">
          {/* Logo + texto */}
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={logo}
              alt="Pecado Picoso"
              className="h-8 w-8 object-contain"
            />

            <div className="leading-tight">
              <div className="text-[11px] font-black tracking-[0.15em] text-white">
                PECADO PICOSO
              </div>
              <div className="text-[11px] text-red-100/80">
                Dulce, ácido y picoso · {CITY}
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/armar"
              className="
                rounded-full
                px-3 py-1.5
                text-[11px] font-black
                text-white
                bg-white/15 hover:bg-white/25
                border border-white/20
                transition
                no-underline
              "
            >
              Pedir
            </Link>

            <a
              href={`https://wa.me/57${WHATSAPP_PHONE}`}
              target="_blank"
              rel="noreferrer"
              className="
                rounded-full
                px-3 py-1.5
                text-[11px] font-black
                text-white/90 hover:text-white
                border border-white/15 hover:border-white/30
                transition
                no-underline
              "
            >
              WhatsApp
            </a>
          </div>
        </div>

        {/* LINKS */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
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

          <span className="h-3 w-px bg-white/15 mx-1" />

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-red-100/75 hover:text-white transition no-underline"
          >
            @pecadopicoso.pop
          </a>
        </div>

        {/* LÍNEA FINAL */}
        <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-red-100/60">
          <span>© {new Date().getFullYear()} Pecado Picoso</span>

          <span>
            Nequi: <strong className="text-white">{NEQUI_PHONE}</strong>
          </span>
        </div>
      </div>
    </footer>
  );
}
