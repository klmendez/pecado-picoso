import type { Barrio } from "../data/barrios";
import { cop } from "../lib/format";

type Props = {
  items: Array<{
    id: string;
    title: string;
    detail?: string;
    toppings?: string[];
    extras?: string[];
    price: number;
  }>;

  service: "llevar" | "domicilio" | "local";
  barrio: Barrio | null;
  address: string;

  subtotal: number;
  delivery: number;
  total: number;

  canSend: boolean;
  onSend: () => void;
};

export default function OrderAside({
  items,
  service,
  barrio,
  address,
  subtotal,
  delivery,
  total,
  canSend,
  onSend,
}: Props) {
  const serviceLabel = service === "domicilio" ? "Domicilio" : service === "llevar" ? "Para llevar" : "En el local";

  return (
    <aside className="w-full lg:w-[360px] lg:sticky lg:top-24 h-fit space-y-3">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 space-y-3">
        <div className="font-black text-lg">Tu pedido</div>

        <div className="space-y-3 text-sm">
          {items.length ? (
            items.map((item) => (
              <div key={item.id} className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3 space-y-1">
                <div className="flex justify-between gap-3">
                  <span className="font-bold text-white">{item.title}</span>
                  <span className="font-bold text-white">{cop(item.price)}</span>
                </div>
                {item.detail ? <div className="text-neutral-400 text-xs">{item.detail}</div> : null}
                {item.toppings && item.toppings.length ? (
                  <div className="text-neutral-400 text-xs">Toppings: {item.toppings.join(", ")}</div>
                ) : null}
                {item.extras && item.extras.length ? (
                  <div className="text-neutral-500 text-xs">Extras: {item.extras.join(", ")}</div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="text-neutral-500">Agrega productos para ver el resumen.</div>
          )}

          <div className="pt-2 border-t border-neutral-800" />

          <div className="flex justify-between gap-3">
            <span className="text-neutral-400">Servicio</span>
            <span className="font-bold">{serviceLabel}</span>
          </div>

          {service === "domicilio" ? (
            <>
              <div className="flex justify-between gap-3">
                <span className="text-neutral-400">Barrio</span>
                <span className="font-bold text-right">{barrio?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-neutral-400">Dirección</span>
                <span className="font-bold text-right">{address?.trim() || "—"}</span>
              </div>
            </>
          ) : null}

          <div className="pt-2 border-t border-neutral-800" />

          <div className="flex justify-between gap-3">
            <span className="text-neutral-400">Subtotal</span>
            <span className="font-bold">{cop(subtotal)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-neutral-400">Entrega</span>
            <span className="font-bold">{cop(delivery)}</span>
          </div>
          <div className="flex justify-between gap-3 text-base">
            <span className="text-neutral-300 font-black">Total</span>
            <span className="font-black">{cop(total)}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onSend}
        disabled={!canSend}
        className={[
          "w-full rounded-2xl px-4 py-3 font-black text-center",
          canSend ? "bg-white text-neutral-950 hover:opacity-90" : "bg-neutral-800 text-neutral-400 cursor-not-allowed",
        ].join(" ")}
        title={!canSend ? "Completa el pedido para enviar" : ""}
      >
        Enviar pedido por WhatsApp
      </button>

      <div className="text-xs text-neutral-400">
        *Si usas domicilio, el costo depende del barrio. “En el local” está deshabilitado (Próximamente).*
      </div>


    </aside>
  );
}
