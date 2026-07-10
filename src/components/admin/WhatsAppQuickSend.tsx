import { useEffect, useRef, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { ChevronDown } from 'lucide-react';
import type { QuickMessage } from '../../lib/whatsappTemplates';

interface WhatsAppQuickSendProps {
  phone: string;
  templates: QuickMessage[];
  className?: string;
}

export default function WhatsAppQuickSend({ phone, templates, className = '' }: WhatsAppQuickSendProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const send = (message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=57${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setOpen(false);
  };

  const sendCustom = () => {
    const custom = window.prompt('Escribe el mensaje para enviar por WhatsApp:');
    setOpen(false);
    if (custom && custom.trim()) send(custom.trim());
  };

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex items-center gap-0.5 text-green-500 hover:text-green-600"
        title="Enviar WhatsApp"
      >
        <FaWhatsapp size={14} />
        <ChevronDown size={10} />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 z-50 mt-1 w-60 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {templates.map((t, i) => (
            <button
              key={i}
              type="button"
              onClick={() => send(t.message)}
              className="block w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
            >
              {t.label}
            </button>
          ))}
          <div className="my-1 border-t border-gray-100" />
          <button
            type="button"
            onClick={sendCustom}
            className="block w-full px-3 py-2 text-left text-xs font-medium text-blue-600 hover:bg-blue-50"
          >
            ✏️ Mensaje personalizado...
          </button>
        </div>
      )}
    </div>
  );
}
