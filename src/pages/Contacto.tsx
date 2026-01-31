import { FiInstagram, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

const INSTAGRAM_URL = "https://www.instagram.com/pecadopicoso.pop/";
const WHATSAPP_PHONE = "3178371144";
const NEQUI_PHONE = "3177708226";
const CITY = "Popayán";

export default function Contacto() {
  return (
    <div className="bg-neutral-950 text-white pt-24 lg:pt-28">
      <div className="mx-auto max-w-3xl px-4 pb-16">
        {/* Header */}
        <header className="pb-8">
          <div className="text-xs uppercase tracking-[0.35em] text-white/50">
            Contacto
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black">
            Escríbenos
          </h1>
          <p className="mt-1 text-sm text-white/55">
            Pedidos por WhatsApp · Pagos por Nequi
          </p>
        </header>

        {/* Lista */}
        <div className="border-t border-white/10 divide-y divide-white/10">
          {/* Instagram */}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="block py-5 group hover:bg-white/[0.02] transition"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <FiInstagram className="text-lg text-white/60 group-hover:text-white transition" />
                <div>
                  <div className="text-sm font-black">Instagram</div>
                  <div className="text-sm text-white/70">
                    @pecadopicoso.pop
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                Redes
              </span>
            </div>
          </a>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/57${WHATSAPP_PHONE}`}
            target="_blank"
            rel="noreferrer"
            className="block py-5 group hover:bg-white/[0.02] transition"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <FaWhatsapp className="text-lg text-white/60 group-hover:text-white transition" />
                <div>
                  <div className="text-sm font-black">WhatsApp</div>
                  <div className="text-sm text-white/70">
                    +57 {WHATSAPP_PHONE}
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                Pedidos
              </span>
            </div>
          </a>

          {/* Nequi */}
          <div className="py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                {/* “logo” Nequi minimal */}
                <div className="h-5 w-5 rounded-sm border border-white/30 flex items-center justify-center text-[9px] font-black text-white/70">
                  N
                </div>
                <div>
                  <div className="text-sm font-black">Nequi</div>
                  <div className="text-sm text-white/70">
                    {NEQUI_PHONE}
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                Pago
              </span>
            </div>
          </div>

          {/* Ciudad */}
          <div className="py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <FiPhone className="text-lg text-white/50" />
                <div>
                  <div className="text-sm font-black">Ciudad</div>
                  <div className="text-sm text-white/70">
                    {CITY}
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                Ubicación
              </span>
            </div>
          </div>
        </div>

        {/* acento final */}
        <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-red-600/30 to-transparent" />
      </div>
    </div>
  );
}
