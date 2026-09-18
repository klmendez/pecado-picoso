import { useState } from "react";
import { X } from "lucide-react";
import { useLocation } from "react-router-dom";
import akoraLogo from "../assets/akora.png";
import "./AkoraBubble.css";

const message = "Venimos desde el sitio web de Pecado Picoso y nos interesa un menú web como ese";
const contactUrl = `https://api.whatsapp.com/send?phone=573148320587&text=${encodeURIComponent(message)}`;

export default function AkoraBubble() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { pathname } = useLocation();

  return (
    <aside
      className={`akora-widget${pathname.startsWith("/armar") ? " akora-widget--order" : ""}`}
      aria-label="Diseño web por Akora"
    >
      <div className={`akora-notice${isExpanded ? "" : " akora-notice--mini"}`}>
        {isExpanded ? (
          <>
            <button
              type="button"
              className="akora-dismiss"
              aria-label="Reducir aviso de Akora"
              onClick={() => setIsExpanded(false)}
            >
              <X size={16} aria-hidden="true" />
            </button>
            <a href={contactUrl} target="_blank" rel="noopener noreferrer">
              <strong className="akora-headline">¿Te gustó este menú web?</strong>
              <span className="akora-cta">Pica aquí y te diseñamos uno.</span>
              <span className="akora-caption">Menú web diseñado por Akora</span>
            </a>
          </>
        ) : (
          <button type="button" className="akora-mini-notice" onClick={() => setIsExpanded(true)}>
            Menú Web diseñado por Akora
          </button>
        )}
      </div>
      <a
        className="akora-bubble"
        href={contactUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar a Akora por WhatsApp (abre en una nueva pestaña)"
        title="Menú Web Diseñado por Akora. Pica aquí para contactarnos."
      >
        <img src={akoraLogo} alt="Akora 212 Digital Lab" width="64" height="64" />
        <span className="akora-status" aria-hidden="true" />
      </a>
    </aside>
  );
}
