import { INSTAGRAM, NEQUI_PHONE, CITY } from "../data/constants";

export default function Contacto() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h2 className="text-3xl font-black">Contacto</h2>
      <p className="text-neutral-400 mt-2">Pedidos por WhatsApp + pagos por Nequi/Llave.</p>

      <div className="mt-6 grid gap-4">
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
          <div className="font-black">Instagram</div>
          <div className="text-neutral-300 mt-1">{INSTAGRAM}</div>
        </div>

        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
          <div className="font-black">Nequi / Llave</div>
          <div className="text-neutral-300 mt-1">{NEQUI_PHONE}</div>
        </div>

        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
          <div className="font-black">Ciudad</div>
          <div className="text-neutral-300 mt-1">{CITY}</div>
        </div>
      </div>
    </div>
  );
}
