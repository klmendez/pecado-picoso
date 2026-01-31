import { INSTAGRAM, NEQUI_PHONE, CITY } from "../data/constants";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-900">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 md:grid-cols-3">
        <div>
          <div className="font-black text-lg">PECADO PICOSO 😈🔥</div>
          <p className="text-sm text-neutral-400 mt-2">
            Dulce, ácido y picoso en una sola mordida. {CITY}.
          </p>
        </div>

        <div className="text-sm">
          <div className="font-bold mb-2">Redes</div>
          <div className="text-neutral-300">{INSTAGRAM}</div>
        </div>

        <div className="text-sm">
          <div className="font-bold mb-2">Pago</div>
          <div className="text-neutral-300">Nequi / Llave: {NEQUI_PHONE}</div>
        </div>
      </div>
    </footer>
  );
}
