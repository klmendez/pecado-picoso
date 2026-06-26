import { FiInstagram, FiMapPin } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { INSTAGRAM_URL, WHATSAPP_PHONE, NEQUI_PHONE, CITY } from "../data/constants";

export default function Contacto() {
  return (
    <div className="bg-crema text-gray-900 pt-16 sm:pt-20 lg:pt-24">
      <div className="mx-auto max-w-2xl px-4 pb-12">
        <header className="pb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Contacto</p>
          <h1 className="mt-3 text-2xl sm:text-3xl font-semibold text-gray-900">
            Escríbenos
          </h1>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Pedidos por WhatsApp · Pagos por Nequi
          </p>
        </header>

        <div className="divide-y divide-gray-200">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-4 py-5 group"
          >
            <div className="flex items-center gap-4 min-w-0">
              <FiInstagram className="text-lg text-gray-400 group-hover:text-rojo transition" />
              <div>
                <div className="text-sm font-medium text-gray-900">Instagram</div>
                <div className="text-sm text-gray-500">@pecadopicoso.pop</div>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Redes</span>
          </a>

          <a
            href={`https://wa.me/57${WHATSAPP_PHONE}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-4 py-5 group"
          >
            <div className="flex items-center gap-4 min-w-0">
              <FaWhatsapp className="text-lg text-green-600 group-hover:text-green-700 transition" />
              <div>
                <div className="text-sm font-medium text-gray-900">WhatsApp</div>
                <div className="text-sm text-gray-500">+57 {WHATSAPP_PHONE}</div>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Pedidos</span>
          </a>

          <div className="flex items-center justify-between gap-4 py-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-5 w-5 border border-rojo/50 flex items-center justify-center text-[9px] font-semibold text-rojo">
                N
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Nequi</div>
                <div className="text-sm text-gray-500">{NEQUI_PHONE}</div>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Pago</span>
          </div>

          <div className="flex items-center justify-between gap-4 py-5">
            <div className="flex items-center gap-4 min-w-0">
              <FiMapPin className="text-lg text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-900">Ciudad</div>
                <div className="text-sm text-gray-500">{CITY}</div>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Ubicación</span>
          </div>
        </div>
      </div>
    </div>
  );
}
