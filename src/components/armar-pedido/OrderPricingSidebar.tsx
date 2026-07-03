import type { OrderItem } from "../../lib/whatsapp";
import { cop } from "../../lib/format";
import { toppingsNames, extrasLine } from "./utils";

type PricedItem = OrderItem & {
  baseUnit: number;
  extrasUnit: number;
  unit: number;
  line: number;
};

type Props = {
  items: PricedItem[];
  subtotal: number;
  delivery: number;
  total: number;
  canSend: boolean;
  onSend: () => void;
  onRemove: (itemId: string) => void;
  sendDisabledHint: string;
};

export default function OrderPricingSidebar({
  items,
  subtotal,
  delivery,
  total,
  canSend,
  onSend,
  onRemove,
  sendDisabledHint,
}: Props) {
  return (
    <aside className="lg:sticky lg:top-24 h-fit">
      <div className="border-b border-gray-200 pb-3">
        <div className="text-sm font-semibold">Resumen</div>
        <div className="text-xs text-gray-500">Detalle de precios</div>
      </div>

      <div className="mt-4 space-y-4">
        {items.length ? (
          items.map((item) => {
            const product = item.product;
            const isGomitas = product.category === "gomitas";
            const tops = item.toppingIds.length ? toppingsNames(item.toppingIds) : [];
            const ex = extrasLine(item.extrasQty);

            return (
              <div key={item.id} className="border-b border-gray-200 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{product.name}</div>
                    <div className="text-[11px] text-gray-500">
                      Cantidad: <span className="font-semibold text-gray-700">x{item.qty}</span>
                    </div>

                    {isGomitas ? (
                      <div className="mt-1 text-[11px] text-gray-500">
                        Referencia: <span className="font-semibold text-gray-700">{item.version ?? "Pendiente"}</span>
                      </div>
                    ) : null}

                    {tops.length ? (
                      <div className="mt-1 text-[11px] text-gray-500">
                        Toppings: <span className="text-gray-500">{tops.join(", ")}</span>
                      </div>
                    ) : null}

                    {ex.length ? (
                      <div className="mt-1 text-[11px] text-gray-500">
                        Extras: <span className="text-gray-500">{ex.join(", ")}</span>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="text-[10px] uppercase tracking-[0.22em] text-gray-500 hover:text-black"
                  >
                    quitar
                  </button>
                </div>

                <div className="mt-3 space-y-1 text-[12px]">
                  <div className="flex items-center justify-between text-gray-500">
                    <span>Base</span>
                    <span>{item.baseUnit > 0 ? cop(item.baseUnit) : <span className="text-rojo">Pendiente</span>}</span>
                  </div>
                  {item.extrasUnit > 0 ? (
                    <div className="flex items-center justify-between text-gray-500">
                      <span>Extras</span>
                      <span>{cop(item.extrasUnit)}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between text-gray-700 font-semibold">
                    <span>Subtotal</span>
                    <span>{item.line > 0 ? cop(item.line) : <span className="text-rojo">—</span>}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="border-b border-dashed border-gray-300 py-6 text-center text-sm text-gray-500">
            Aún no has agregado productos.
          </div>
        )}
      </div>

      <div className="mt-6 space-y-4">
        <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between text-gray-500">
            <span>Subtotal</span>
            <span>{cop(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-gray-500">
            <span>Envío</span>
            <span>{cop(delivery)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-black font-semibold text-lg">
            <span>Total</span>
            <span>{cop(total)}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onSend}
        disabled={!canSend}
        className={[
          "mt-5 w-full py-3 font-semibold transition-colors",
          canSend ? "bg-rojo text-white hover:bg-rojo-dark" : "border border-gray-300 text-gray-300 cursor-not-allowed",
        ].join(" ")}
      >
        Confirmar pedido
      </button>

      {!canSend ? <div className="mt-2 text-[11px] text-gray-500">{sendDisabledHint}</div> : null}
    </aside>
  );
}
