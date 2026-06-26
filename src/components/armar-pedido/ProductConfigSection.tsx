import { useEffect, useRef } from "react";

import { EXTRAS } from "../../data/extras";
import type { OrderItem } from "../../lib/whatsapp";
import { cop } from "../../lib/format";
import { getBasePrice } from "../../lib/pricing";
import { extrasTotal } from "../../lib/pricing";
import Referencias from "../Referencias";
import Toppings from "../Toppings";
import { getAvailableSizes, maxToppingsFor, labelSize, toppingsNames, extrasLine } from "./utils";

export function getItemMissing(item: OrderItem): string | null {
  const product = item.product;
  const max = maxToppingsFor(product);

  if (product.category === "gomitas") {
    if (!item.version) return "Elige una referencia (ahogada o picosa)";
    if (max > 0 && item.toppingIds.length < 1) return "Elige al menos 1 topping";
    if (max > 0 && item.toppingIds.length > max) return `Máximo ${max} toppings`;
    const gomitasExtrasQty = item.extrasQty?.gomitas ?? 0;
    if (gomitasExtrasQty > 0) {
      const selections = item.extraSelections?.gomitas ?? [];
      if (selections.length < gomitasExtrasQty) return `Selecciona ${gomitasExtrasQty} gomita(s) extra`;
    }
  }

  return null;
}

type Props = {
  items: OrderItem[];
  updateItem: (itemId: string, patch: Partial<OrderItem>) => void;
  duplicateItem: (itemId: string) => void;
  removeItem: (itemId: string) => void;
  activeProductId?: string | null;
  onFocusProduct?: (itemId: string | null) => void;
  onGoToNext?: () => void;
  showIncompleteWarning?: boolean;
};

export function isItemConfigComplete(item: OrderItem) {
  const product = item.product;
  const max = maxToppingsFor(product);

  if (product.category === "gomitas") {
    if (!item.version) return false;
    if (max > 0) {
      if (item.toppingIds.length < 1) return false;
      if (item.toppingIds.length > max) return false;
    }
    const gomitasExtrasQty = item.extrasQty?.gomitas ?? 0;
    if (gomitasExtrasQty > 0) {
      const selections = item.extraSelections?.gomitas ?? [];
      if (selections.length < gomitasExtrasQty) return false;
    }
    return true;
  }

  if (product.category === "frutafresh") {
    return item.toppingIds.length <= max;
  }

  return true;
}

function buildSummaryLine(item: OrderItem) {
  const size = item.size ? `${labelSize(item.size)}` : "—";
  const ref = item.version ? String(item.version) : "—";
  const toppings = item.toppingIds?.length ? `${item.toppingIds.length} toppings` : "0 toppings";
  return [size, ref, toppings].join(" · ");
}

export default function ProductConfigSection({
  items,
  updateItem,
  duplicateItem,
  removeItem,
  activeProductId,
  onFocusProduct,
  onGoToNext,
  showIncompleteWarning = false,
}: Props) {
  if (!items.length) return null;

  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevActiveIdRef = useRef<string | null>(null);

  const allComplete = items.every(isItemConfigComplete);
  const showSummary = allComplete && !activeProductId;

  const goToNextProductByIndex = (index: number) => {
    const nextItem = items[index + 1];
    if (nextItem) onFocusProduct?.(nextItem.id);
    else onFocusProduct?.(null);
  };

  useEffect(() => {
    if (!activeProductId) {
      prevActiveIdRef.current = null;
      return;
    }

    const prev = prevActiveIdRef.current;
    prevActiveIdRef.current = activeProductId;

    if (prev === activeProductId) return;

    const timeout = window.setTimeout(() => {
      const el = itemRefs.current[activeProductId];
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const headerOffset = 120;
      const inView = rect.top >= headerOffset && rect.bottom <= window.innerHeight;

      if (!inView) {
        el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
      }
    }, 60);

    return () => window.clearTimeout(timeout);
  }, [activeProductId]);

  return (
    <section>
      <div className="hidden sm:block">
        <div className="text-sm font-semibold text-gray-900">Personaliza tus productos</div>
        <div className="text-xs text-gray-400">
          Tamaño, referencia, toppings y extras.
        </div>
      </div>

      {showSummary ? (
        <div className="sm:mt-5">
          <div className="text-xs font-medium text-emerald-600 mb-3">✓ Todo listo</div>

          <div className="divide-y divide-gray-100">
            {items.map((it) => {
              const p = it.product;
              const isGomitas = p.category === "gomitas";
              const tops = it.toppingIds.length ? toppingsNames(it.toppingIds) : [];
              const ex = extrasLine(it.extrasQty ?? {});
              const sameProductItems = items.filter((i) => i.product.id === p.id);
              const instanceNumber = sameProductItems.findIndex((i) => i.id === it.id) + 1;
              const hasDuplicates = sameProductItems.length > 1;

              const baseUnit = getBasePrice(
                p,
                isGomitas ? it.version : null,
                it.size,
              );
              const extrasU = extrasTotal(it.extrasQty ?? {}, EXTRAS);
              const itemTotal = (baseUnit + extrasU) * it.qty;

              return (
                <div key={it.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-900">{p.name}</span>
                      {hasDuplicates ? (
                        <span className="text-[10px] text-gray-400">#{instanceNumber}</span>
                      ) : null}
                    </div>
                    <div className="mt-1 space-y-0.5 text-[11px] text-gray-500">
                      <div>{labelSize(it.size)} · {isGomitas ? it.version : "—"}</div>
                      {tops.length ? <div>Toppings: {tops.join(", ")}</div> : null}
                      {ex.length ? <div>Extras: {ex.join(", ")}</div> : null}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {itemTotal > 0 ? cop(itemTotal) : <span className="text-rojo text-xs">Sin precio</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onFocusProduct?.(it.id)}
                    className="text-[10px] text-gray-400 hover:text-gray-900"
                  >
                    Editar
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onGoToNext}
            className="mt-4 w-full border border-gray-900 bg-gray-900 text-white py-3 text-xs font-medium uppercase tracking-[0.15em] active:bg-black sm:w-auto sm:px-8"
          >
            Datos y envío →
          </button>
        </div>
      ) : (
        <div className="sm:mt-5 divide-y divide-gray-200">
          {items.map((it, index) => {
            const p = it.product;
            const isGomitas = p.category === "gomitas";
            const canHaveToppings = p.category === "gomitas" || p.category === "frutafresh";
            const sizes = getAvailableSizes(p);
            const maxT = maxToppingsFor(p);
            const showToppings = canHaveToppings && maxT > 0;
            const extrasQty = it.extrasQty ?? {};
            const extraSelections = it.extraSelections ?? {};

            const isActive = activeProductId === it.id;
            const isComplete = isItemConfigComplete(it);
            const missing = isComplete ? null : getItemMissing(it);
            const summary = buildSummaryLine(it);

            const sameProductItems = items.filter((i) => i.product.id === p.id);
            const instanceNumber = sameProductItems.findIndex((i) => i.id === it.id) + 1;
            const hasDuplicates = sameProductItems.length > 1;

            const focusProduct = (force = false) => {
              if (force || !isActive) onFocusProduct?.(it.id);
            };

            const goToNextProduct = () => goToNextProductByIndex(index);

            const handleHeaderClick = () => {
              if (isComplete) return;
              onFocusProduct?.(isActive ? null : it.id);
            };

            return (
              <div
                key={it.id}
                ref={(node) => {
                  if (node) itemRefs.current[it.id] = node;
                  else delete itemRefs.current[it.id];
                }}
                className="scroll-mt-28 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleHeaderClick}
                    className={[
                      "min-w-0 text-left flex-1",
                      isComplete ? "cursor-default" : "cursor-pointer",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2">
                      <span className={[
                        "text-xs",
                        isComplete ? "text-emerald-600" : showIncompleteWarning && !isComplete ? "text-rojo" : "text-gray-300",
                      ].join(" ")}>
                        {isComplete ? "✓" : showIncompleteWarning ? "!" : "○"}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{p.name}</span>
                      {hasDuplicates ? (
                        <span className="text-[10px] text-gray-400">#{instanceNumber}</span>
                      ) : null}
                    </div>

                    {!isActive ? (
                      <div className="ml-5 mt-0.5 text-[11px]">
                        {isComplete ? (
                          <span className="text-gray-400">{summary}</span>
                        ) : showIncompleteWarning ? (
                          <span className="text-rojo">{missing ?? "Falta personalizar"}</span>
                        ) : (
                          <span className="text-gray-400">Toca para personalizar</span>
                        )}
                      </div>
                    ) : null}
                  </button>

                  <div className="flex items-center gap-2">
                    {!isActive && isComplete ? (
                      <button
                        type="button"
                        onClick={() => onFocusProduct?.(it.id)}
                        className="text-[10px] text-gray-400 hover:text-gray-900"
                      >
                        Editar
                      </button>
                    ) : null}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="h-7 w-7 border border-gray-200 text-sm transition hover:border-gray-400"
                        onClick={() => removeItem(it.id)}
                      >
                        −
                      </button>
                      <div className="w-7 text-center text-[10px] font-medium text-gray-400">x1</div>
                      <button
                        type="button"
                        className="h-7 w-7 border border-gray-200 text-sm transition hover:border-gray-400"
                        onClick={() => { focusProduct(); duplicateItem(it.id); }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {isActive ? (
                  <div className="mt-3 ml-5 space-y-4">
                    <div>
                      <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Tamaño</div>
                      {sizes.length ? (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {sizes.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => { focusProduct(); updateItem(it.id, { size: s }); }}
                              className={[
                                "border px-3 py-1 text-[11px] font-medium transition",
                                it.size === s
                                  ? "border-gray-900 bg-gray-900 text-white"
                                  : "border-gray-200 text-gray-500 hover:border-gray-400",
                              ].join(" ")}
                            >
                              {labelSize(s)}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-1 text-[11px] text-gray-400">No aplica.</div>
                      )}
                    </div>

                    {isGomitas ? (
                      <Referencias
                        value={it.version ?? null}
                        onChange={(v) => { focusProduct(); updateItem(it.id, { version: v }); }}
                      />
                    ) : null}

                    {showToppings ? (
                      <Toppings
                        value={it.toppingIds}
                        onChange={(next) => { focusProduct(); updateItem(it.id, { toppingIds: next }); }}
                        max={maxT}
                        min={isGomitas && maxT > 0 ? 1 : 0}
                        small
                        title="Toppings"
                        subtitle={isGomitas ? "Selecciona (mínimo 1)" : `Opcional (hasta ${maxT})`}
                      />
                    ) : null}

                    <div>
                      <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Extras</div>
                      <div className="mt-2 space-y-2">
                        {EXTRAS.map((extra) => {
                          const qty = extrasQty[extra.id] ?? 0;
                          const currentSelections = extraSelections[extra.id] ?? [];

                          const applyExtrasPatch = (nextQty: number, nextSelectionIds: string[]) => {
                            const nextExtrasQty = { ...extrasQty, [extra.id]: nextQty };
                            const nextExtraSelections = { ...extraSelections };

                            if (nextSelectionIds.length) nextExtraSelections[extra.id] = nextSelectionIds;
                            else delete nextExtraSelections[extra.id];

                            updateItem(it.id, {
                              extrasQty: nextExtrasQty,
                              extraSelections: nextExtraSelections,
                            });
                          };

                          return (
                            <div key={extra.id} className="py-1.5">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <span className="text-[12px] font-medium text-gray-700">{extra.name}</span>
                                  <span className="ml-1.5 text-[10px] text-gray-400">{cop(extra.price)}</span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    className="h-6 w-6 border border-gray-200 text-xs transition hover:border-gray-400"
                                    onClick={() => {
                                      focusProduct();
                                      const nextQty = Math.max(0, qty - 1);
                                      const trimmed = currentSelections.slice(0, nextQty);
                                      applyExtrasPatch(nextQty, trimmed);
                                    }}
                                  >
                                    −
                                  </button>
                                  <div className="w-5 text-center text-xs font-medium">{qty}</div>
                                  <button
                                    type="button"
                                    className="h-6 w-6 border border-gray-200 text-xs transition hover:border-gray-400"
                                    onClick={() => {
                                      focusProduct();
                                      const nextQty = qty + 1;
                                      const trimmed = currentSelections.slice(0, nextQty);
                                      applyExtrasPatch(nextQty, trimmed);
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {extra.id === "gomitas" && qty > 0 ? (
                                <div className="mt-2">
                                  <Toppings
                                    value={currentSelections}
                                    onChange={(next) => {
                                      focusProduct();
                                      const trimmed = next.slice(0, qty);
                                      applyExtrasPatch(qty, trimmed);
                                    }}
                                    max={qty}
                                    min={qty}
                                    small
                                    title="Gomitas extra"
                                    subtitle={`Selecciona ${qty} ${qty === 1 ? "opción" : "opciones"}`}
                                  />
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                      <button
                        type="button"
                        onClick={() => onFocusProduct?.(null)}
                        className="border border-gray-200 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-gray-500 hover:border-gray-400"
                      >
                        Cerrar
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!isComplete) return;
                          onFocusProduct?.(null);
                        }}
                        disabled={!isComplete}
                        className={[
                          "border px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em]",
                          isComplete
                            ? "border-gray-900 bg-gray-900 text-white active:bg-black"
                            : "border-gray-200 text-gray-300 cursor-not-allowed",
                        ].join(" ")}
                      >
                        Listo
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
