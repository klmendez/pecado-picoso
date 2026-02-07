import { useEffect, useRef } from "react";

import { EXTRAS } from "../../data/extras";
import type { OrderItem } from "../../lib/whatsapp";
import { cop } from "../../lib/format";
import Referencias from "../Referencias";
import Toppings from "../Toppings";
import { getAvailableSizes, maxToppingsFor, labelSize } from "./utils";

type Props = {
  items: OrderItem[];
  updateItem: (productId: string, patch: Partial<OrderItem>) => void;
  updateQty: (productId: string, qty: number) => void;
  activeProductId?: string | null;
  onFocusProduct?: (productId: string | null) => void;
};

function isItemConfigComplete(item: OrderItem) {
  const product = item.product;
  const max = maxToppingsFor(product);

  if (product.category === "gomitas") {
    if (!item.version) return false;
    if (max > 0) {
      if (item.toppingIds.length < 1) return false;
      if (item.toppingIds.length > max) return false;
    }
    return true;
  }

  if (product.category === "frutafresh") {
    return item.toppingIds.length <= max;
  }

  return true;
}

function extrasCount(extrasQty: Record<string, number> | undefined) {
  return Object.values(extrasQty ?? {}).reduce((acc, n) => acc + (n ?? 0), 0);
}

function buildSummary(item: OrderItem) {
  const size = item.size ? `Tamaño: ${labelSize(item.size)}` : "Tamaño: —";
  const ref = item.version ? `Ref: ${String(item.version)}` : "Ref: —";
  const toppings = item.toppingIds?.length ? `Toppings: ${item.toppingIds.length}` : "Toppings: 0";
  const extrasN = extrasCount(item.extrasQty);
  const extras = extrasN ? `Extras: ${extrasN}` : "Extras: 0";
  return [size, ref, toppings, extras].join(" · ");
}

export default function ProductConfigSection({
  items,
  updateItem,
  updateQty,
  activeProductId,
  onFocusProduct,
}: Props) {
  if (!items.length) return null;

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Evitar scroll/animación cuando cambian toppings/extras: solo al cambiar activeProductId
  const prevActiveIdRef = useRef<string | null>(null);

  const goToNextProductByIndex = (index: number) => {
    const nextItem = items[index + 1];
    if (nextItem) onFocusProduct?.(nextItem.product.id);
    else onFocusProduct?.(null); // ✅ al final quedan todos cerrados
  };

  // Scroll SOLO cuando cambia activeProductId (no cuando cambian items por toppings/extras)
  useEffect(() => {
    if (!activeProductId) {
      prevActiveIdRef.current = null;
      return;
    }

    const prev = prevActiveIdRef.current;
    prevActiveIdRef.current = activeProductId;

    if (prev === activeProductId) return;

    const timeout = window.setTimeout(() => {
      const el = cardRefs.current[activeProductId];
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const headerOffset = 120;
      const inView = rect.top >= headerOffset && rect.bottom <= window.innerHeight;

      if (!inView) {
        el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
      }

      el.animate(
        [
          { transform: "scale(0.98)", boxShadow: "0 12px 35px rgba(0,0,0,0.0)" },
          { transform: "scale(1)", boxShadow: "0 12px 35px rgba(0,0,0,0.45)" },
        ],
        { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }, 60);

    return () => window.clearTimeout(timeout);
  }, [activeProductId]);

  return (
    <section>
      <div>
        <div className="text-sm font-black">2) Ajustar</div>
        <div className="text-xs text-white/55">
          Cantidad, tamaño, (gomitas: referencia), toppings (gomitas y frutafresh), extras.
        </div>
      </div>

      <div className="mt-5 space-y-7">
        {items.map((it, index) => {
          const p = it.product;
          const isGomitas = p.category === "gomitas";
          const canHaveToppings = p.category === "gomitas" || p.category === "frutafresh";
          const sizes = getAvailableSizes(p);
          const maxT = maxToppingsFor(p);
          const showToppings = canHaveToppings && maxT > 0;

          const isActive = activeProductId === p.id;
          const isComplete = isItemConfigComplete(it);
          const summary = buildSummary(it);

          const focusProduct = (force = false) => {
            if (force || !isActive) onFocusProduct?.(p.id);
          };

          const goToNextProduct = () => goToNextProductByIndex(index);

          // ✅ Header click behavior:
          // - Si está pendiente: se puede abrir/cerrar tocando el header
          // - Si está listo: NO se abre tocando el header (solo con botón Editar)
          const handleHeaderClick = () => {
            if (isComplete) return; // bloquea abrir por accidente
            onFocusProduct?.(isActive ? null : p.id);
          };

          return (
            <div
              key={p.id}
              ref={(node) => {
                if (node) cardRefs.current[p.id] = node;
                else delete cardRefs.current[p.id];
              }}
              className={[
                "relative scroll-mt-28 border-t border-white/10 pb-4 pt-5 pl-8 transition-colors duration-300",
                isActive ? "border-white/25" : "",
              ].join(" ")}
            >
              <span
                aria-hidden
                className={[
                  "absolute left-0 top-6 h-3 w-3 -translate-x-1/2 rounded-full",
                  isActive ? "bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.18)]" : isComplete ? "bg-white/50" : "bg-white/20",
                ].join(" ")}
              />

              {/* HEADER (siempre visible) */}
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={handleHeaderClick}
                  className={[
                    "min-w-0 text-left",
                    isComplete ? "cursor-default" : "cursor-pointer",
                  ].join(" ")}
                >
                  <div className={[
                    "text-sm font-black tracking-wide",
                    isActive ? "text-white" : "text-white/90",
                  ].join(" ")}>{p.name}</div>

                  <div className="text-[11px] text-white/55">
                    {isGomitas ? "Gomitas" : "FrutaFresh"}
                    {!isActive ? <span className="ml-2 text-white/45">· {summary}</span> : null}
                  </div>

                  {!isActive ? (
                    <div className="mt-2 inline-flex items-center gap-2">
                      <span
                        className={[
                          "rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
                          isComplete ? "border-emerald-400/60 text-emerald-200" : "border-white/15 text-white/45",
                        ].join(" ")}
                      >
                        {isComplete ? "Listo" : "Pendiente"}
                      </span>

                      {isComplete ? (
                        <span className="text-[10px] text-white/45">No se abrirá a menos que edites</span>
                      ) : (
                        <span className="text-[10px] text-white/45">Toca para personalizar producto</span>
                      )}
                    </div>
                  ) : null}
                </button>

                <div className="flex flex-col items-end gap-2">
                  {/* ✅ Botón Editar SOLO cuando está completo y cerrado */}
                  {!isActive && isComplete ? (
                    <button
                      type="button"
                      onClick={() => onFocusProduct?.(p.id)}
                      className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-black text-white/80 transition hover:border-white/40 hover:text-white"
                    >
                      Editar
                    </button>
                  ) : null}

                  {/* Qty */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="h-8 w-8 border border-white/10 bg-transparent transition hover:border-white/30 hover:bg-white/[0.05]"
                      onClick={() => {
                        focusProduct();
                        updateQty(p.id, Math.max(0, it.qty - 1));
                      }}
                    >
                      −
                    </button>
                    <div className="w-8 text-center text-sm font-black">{it.qty}</div>
                    <button
                      type="button"
                      className="h-8 w-8 border border-white/10 bg-transparent transition hover:border-white/30 hover:bg-white/[0.05]"
                      onClick={() => {
                        focusProduct();
                        updateQty(p.id, it.qty + 1);
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* CONTENIDO (solo cuando está activo = expandido) */}
              {isActive ? (
                <>
                  <div className="mt-4 border-l border-white/10 pl-6">
                    <div className="text-[11px] font-black text-white/70">Tamaño</div>
                    {sizes.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {sizes.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              focusProduct();
                              updateItem(p.id, { size: s });
                            }}
                            className={[
                              "rounded-full border border-white/12 px-3 py-1 text-[11px] font-black transition",
                              it.size === s
                                ? "border-emerald-300/70 bg-emerald-400/10 text-emerald-100"
                                : "text-white/60 hover:text-white",
                            ].join(" ")}
                          >
                            {labelSize(s)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-1 text-[11px] text-white/45">No aplica.</div>
                    )}
                  </div>

                  {isGomitas || showToppings ? (
                    <div className="mt-6 space-y-5 border-l border-white/10 pl-6">
                      {isGomitas ? (
                        <Referencias
                          value={it.version ?? null}
                          onChange={(v) => {
                            focusProduct();
                            updateItem(p.id, { version: v });
                          }}
                        />
                      ) : null}

                      {showToppings ? (
                        <Toppings
                          value={it.toppingIds}
                          onChange={(next) => {
                            focusProduct();
                            updateItem(p.id, { toppingIds: next });
                          }}
                          max={maxT}
                          min={isGomitas && maxT > 0 ? 1 : 0}
                          small
                          title="Toppings"
                          subtitle={isGomitas ? "Selecciona (mínimo 1)" : `Opcional (hasta ${maxT})`}
                        />
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-6 border-l border-white/10 pl-6">
                    <div className="text-[11px] font-black text-white/70">Extras</div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {EXTRAS.map((extra) => {
                        const qty = it.extrasQty[extra.id] ?? 0;
                        return (
                          <div key={extra.id} className="rounded-xl border border-white/10 p-3">
                            <div className="text-[11px] font-black">{extra.name}</div>
                            <div className="text-[10px] text-white/55">{cop(extra.price)}</div>

                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                className="h-7 w-7 border border-white/10 transition hover:border-white/30 hover:bg-white/[0.05]"
                                onClick={() => {
                                  focusProduct();
                                  updateItem(p.id, {
                                    extrasQty: { ...it.extrasQty, [extra.id]: Math.max(0, qty - 1) },
                                  });
                                }}
                              >
                                −
                              </button>
                              <div className="w-7 text-center text-sm font-black">{qty}</div>
                              <button
                                type="button"
                                className="h-7 w-7 border border-white/10 transition hover:border-white/30 hover:bg-white/[0.05]"
                                onClick={() => {
                                  focusProduct();
                                  updateItem(p.id, {
                                    extrasQty: { ...it.extrasQty, [extra.id]: qty + 1 },
                                  });
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 border-l border-white/10 pl-6 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      onClick={() => onFocusProduct?.(null)}
                      className="rounded-full border border-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/70 hover:border-white/40 hover:text-white"
                    >
                      Cerrar
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!isComplete) return;
                        goToNextProduct();
                      }}
                      disabled={!isComplete}
                      className={[
                        "rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em]",
                        isComplete
                          ? "border-emerald-400/60 text-emerald-200 hover:bg-emerald-400/10"
                          : "border-white/15 text-white/35 cursor-not-allowed",
                      ].join(" ")}
                    >
                      {items[index + 1] ? "Guardar y siguiente" : "Guardar y cerrar"}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
