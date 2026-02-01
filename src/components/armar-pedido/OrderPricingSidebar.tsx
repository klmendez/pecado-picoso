import type { OrderItem } from "../../lib/whatsapp";
import { cop } from "../../lib/format";
import { toppingsNames, extrasLine } from "./utils";
import type { ChecklistItem } from "../../hooks/useOrderPricingValidation";

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
  onRemove: (productId: string) => void;
  sendDisabledHint: string;
  checklist: ChecklistItem[];
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
  checklist,
}: Props) {
  return (
    <aside className="lg:sticky lg:top-24 h-fit">
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 shadow-[0_15px_45px_rgba(0,0,0,0.45)]">
        <div className="border-b border-white/10 pb-3">
          <div className="text-sm font-black">Resumen</div>
          <div className="text-xs text-white/55">Detalle de precios</div>
        </div>

        <div className="mt-4 space-y-4">
          {items.length ? (
            items.map((item) => {
              const product = item.product;
              const isGomitas = product.category === "gomitas";
              const tops = item.toppingIds.length ? toppingsNames(item.toppingIds) : [];
              const ex = extrasLine(item.extrasQty);

              return (
                <div key={product.id} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-black truncate">{product.name}</div>
                      <div className="text-[11px] text-white/55">
                        Cantidad: <span className="font-black text-white/75">x{item.qty}</span>
                      </div>

                      {isGomitas ? (
                        <div className="mt-1 text-[11px] text-white/55">
                          Referencia: <span className="font-black text-white/75">{item.version ?? "Pendiente"}</span>
                        </div>
                      ) : null}

                      {tops.length ? (
                        <div className="mt-1 text-[11px] text-white/55">
                          Toppings: <span className="text-white/70">{tops.join(", ")}</span>
                        </div>
                      ) : null}

                      {ex.length ? (
                        <div className="mt-1 text-[11px] text-white/55">
                          Extras: <span className="text-white/70">{ex.join(", ")}</span>
                        </div>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemove(product.id)}
                      className="text-[10px] uppercase tracking-[0.22em] text-white/55 hover:text-white"
                    >
                      quitar
                    </button>
                  </div>

                  <div className="mt-3 space-y-1 text-[12px]">
                    <div className="flex items-center justify-between text-white/70">
                      <span>Base (unidad)</span>
                      <span>{cop(item.baseUnit)}</span>
                    </div>
                    <div className="flex items-center justify-between text-white/70">
                      <span>Extras (unidad)</span>
                      <span>{cop(item.extrasUnit)}</span>
                    </div>
                    <div className="flex items-center justify-between text-white/80 font-black">
                      <span>Subtotal item</span>
                      <span>{cop(item.line)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-white/55">
              Aún no has agregado productos.
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-white/50">Checklist</div>
            <ul className="mt-3 space-y-2">
              {checklist.map((item) => (
                <li key={item.id} className="flex items-center gap-3 text-[12px]">
                  <span
                    className={[
                      "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-black",
                      item.ok ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300" : "border-white/15 bg-white/5 text-white/45",
                    ].join(" ")}
                  >
                    {item.ok ? "✓" : ""}
                  </span>
                  <span className={item.ok ? "text-white/80" : "text-white/45"}>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between text-white/70">
              <span>Subtotal</span>
              <span>{cop(subtotal)}</span>
            </div>
            <div className="flex items-center justify_between text-white/70">
              <span>Envío</span>
              <span>{cop(delivery)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-2 text-white font-black text-lg">
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
            "mt-5 w-full rounded-full border border-white/30 py-3 font-black",
            canSend ? "text-white hover:bg-white/[0.08]" : "text-white/35 cursor-not-allowed",
          ].join(" ")}
        >
          Enviar WhatsApp
        </button>

        {!canSend ? <div className="mt-2 text-[11px] text-white/55">{sendDisabledHint}</div> : null}
      </div>
    </aside>
  );
}
