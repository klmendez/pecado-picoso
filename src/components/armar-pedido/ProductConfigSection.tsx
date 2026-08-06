import { useEffect, useRef, useState, type ReactNode } from "react";

import { EXTRAS } from "../../data/extras";
import type { OrderItem } from "../../lib/whatsapp";
import { cop } from "../../lib/format";
import { getBasePrice } from "../../lib/pricing";
import { extrasTotal } from "../../lib/pricing";
import Referencias from "../Referencias";
import Toppings from "../Toppings";
import { getAvailableSizes, maxToppingsFor, labelSize, toppingsNames, extrasLine } from "./utils";

type MissingSection = "referencia" | "toppings" | "extras";

export function getItemMissingSection(item: OrderItem): { section: MissingSection; message: string } | null {
  const product = item.product;
  const max = maxToppingsFor(product);

  if (product.category === "gomitas") {
    if (!item.version) return { section: "referencia", message: "Falta que elijas ahogada o picosa" };
    if (max > 0 && item.toppingIds.length < 1) return { section: "toppings", message: "Falta que elijas al menos 1 topping" };
    if (max > 0 && item.toppingIds.length > max) return { section: "toppings", message: `Máximo ${max} toppings, quita alguno` };
    const gomitasExtrasQty = item.extrasQty?.gomitas ?? 0;
    if (gomitasExtrasQty > 0) {
      const selections = item.extraSelections?.gomitas ?? [];
      if (selections.length < gomitasExtrasQty) {
        return { section: "extras", message: `Falta que elijas ${gomitasExtrasQty} gomita(s) extra` };
      }
    }
  }

  return null;
}

export function getItemMissing(item: OrderItem): string | null {
  return getItemMissingSection(item)?.message ?? null;
}

function StepHeader({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
        {n}
      </span>
      <span className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{children}</span>
    </div>
  );
}

function MissingHint({ message }: { message: string }) {
  return (
    <div className="mt-2 ml-9 flex items-center gap-1.5 rounded bg-rojo-light px-2.5 py-1.5 text-[12px] font-semibold text-rojo">
      <span aria-hidden>⚠</span>
      <span>{message}</span>
    </div>
  );
}

type Props = {
  items: OrderItem[];
  updateItem: (itemId: string, patch: Partial<OrderItem>) => void;
  duplicateItem: (itemId: string) => void;
  removeItem: (itemId: string) => void;
  activeProductId?: string | null;
  onFocusProduct?: (itemId: string | null) => void;
  onGoToNext?: () => void;
  onAddAnotherProduct?: () => void;
  showIncompleteWarning?: boolean;
  disabledToppingIds?: string[];
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
  onAddAnotherProduct,
  showIncompleteWarning = false,
  disabledToppingIds = [],
}: Props) {
  if (!items.length) return null;

  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevActiveIdRef = useRef<string | null>(null);
  const [attemptedItemId, setAttemptedItemId] = useState<string | null>(null);

  const allComplete = items.every(isItemConfigComplete);
  const showSummary = allComplete && !activeProductId;

  const registerSectionRef = (itemId: string, section: MissingSection) => (node: HTMLDivElement | null) => {
    const key = `${itemId}:${section}`;
    if (node) sectionRefs.current[key] = node;
    else delete sectionRefs.current[key];
  };

  const scrollToSection = (itemId: string, section: MissingSection, delay: number) => {
    window.setTimeout(() => {
      const el = sectionRefs.current[`${itemId}:${section}`];
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }, delay);
  };

  const attemptCompleteItem = (item: OrderItem) => {
    if (isItemConfigComplete(item)) {
      setAttemptedItemId(null);
      onFocusProduct?.(null);
      return;
    }
    setAttemptedItemId(item.id);
    const missingInfo = getItemMissingSection(item);
    if (missingInfo) scrollToSection(item.id, missingInfo.section, 50);
  };

  useEffect(() => {
    if (!showIncompleteWarning || !activeProductId) return;
    const activeItem = items.find((it) => it.id === activeProductId);
    if (!activeItem || isItemConfigComplete(activeItem)) return;

    setAttemptedItemId(activeItem.id);
    const missingInfo = getItemMissingSection(activeItem);
    if (missingInfo) scrollToSection(activeItem.id, missingInfo.section, 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showIncompleteWarning, activeProductId]);

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

  const summaryTopRef = useRef<HTMLDivElement | null>(null);
  const prevShowSummaryRef = useRef(false);

  useEffect(() => {
    if (showSummary && !prevShowSummaryRef.current) {
      const timeout = window.setTimeout(() => {
        summaryTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
      }, 60);
      prevShowSummaryRef.current = true;
      return () => window.clearTimeout(timeout);
    }
    prevShowSummaryRef.current = showSummary;
  }, [showSummary]);

  return (
    <section>
      <div className="hidden sm:block">
        <div className="text-sm font-semibold text-gray-900">Personaliza tus productos</div>
        <div className="text-xs text-gray-400">
          Tamaño, referencia, toppings y extras.
        </div>
      </div>

      {showSummary ? (
        <div ref={summaryTopRef} className="scroll-mt-24 sm:mt-5">
          <div className="text-xs font-medium text-rojo mb-3">✓ Todo listo</div>

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
                <div key={it.id} className="py-3 flex items-start gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-100">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-900">{p.name}</span>
                      {hasDuplicates ? (
                        <span className="text-[10px] text-gray-400">#{instanceNumber}</span>
                      ) : null}
                    </div>
                    <div className="mt-1 space-y-0.5 text-[11px] text-gray-500">
                      <div>{it.size ? labelSize(it.size) : "—"} · {isGomitas ? it.version : "—"}</div>
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
                    className="shrink-0 border border-rojo bg-white text-rojo hover:bg-rojo hover:text-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition"
                  >
                    Editar
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onAddAnotherProduct}
              className="w-full border border-gray-300 text-gray-700 py-3 text-xs font-medium uppercase tracking-[0.15em] hover:border-gray-400 active:bg-gray-50 sm:w-auto sm:px-6"
            >
              + Agregar otro producto
            </button>
            <button
              type="button"
              onClick={onGoToNext}
              className="w-full border border-rojo bg-rojo text-white py-3 text-xs font-medium uppercase tracking-[0.15em] active:bg-rojo-dark sm:w-auto sm:px-8"
            >
              Completar datos →
            </button>
          </div>
        </div>
      ) : (
        <div className="sm:mt-5 divide-y divide-gray-200">
          {items.map((it) => {
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
            const missingInfo = isComplete ? null : getItemMissingSection(it);
            const summary = buildSummaryLine(it);
            const showAttemptedHint = attemptedItemId === it.id && !isComplete;

            let stepCounter = 0;
            const sizeStepNum = sizes.length ? ++stepCounter : 0;
            const referenciaStepNum = isGomitas ? ++stepCounter : 0;
            const toppingsStepNum = showToppings ? ++stepCounter : 0;
            const extrasStepNum = ++stepCounter;

            const sameProductItems = items.filter((i) => i.product.id === p.id);
            const instanceNumber = sameProductItems.findIndex((i) => i.id === it.id) + 1;
            const hasDuplicates = sameProductItems.length > 1;

            const focusProduct = (force = false) => {
              if (force || !isActive) onFocusProduct?.(it.id);
            };


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
                        isComplete ? "text-rojo" : showIncompleteWarning && !isComplete ? "text-rojo" : "text-gray-300",
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
                          <span className="text-rojo">{missingInfo?.message ?? "Falta personalizar"}</span>
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
                        className="border border-rojo bg-white text-rojo hover:bg-rojo hover:text-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition"
                      >
                        Editar
                      </button>
                    ) : null}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="h-9 w-9 sm:h-7 sm:w-7 border border-gray-200 text-sm transition hover:border-gray-400 active:bg-gray-100"
                        onClick={() => removeItem(it.id)}
                      >
                        −
                      </button>
                      <div className="w-7 text-center text-[10px] font-medium text-gray-400">x1</div>
                      <button
                        type="button"
                        className="h-9 w-9 sm:h-7 sm:w-7 border border-gray-200 text-sm transition hover:border-gray-400 active:bg-gray-100"
                        onClick={() => { focusProduct(); duplicateItem(it.id); }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {isActive ? (
                  <div className="mt-4 space-y-6">
                    {/* Imagen grande del producto */}
                    <div className="mx-auto w-full max-w-[240px] sm:mx-0 sm:max-w-[280px]">
                      <div className="relative w-full overflow-hidden rounded-lg bg-gray-100" style={{ aspectRatio: "4/5" }}>
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">Sin imagen</div>
                        )}
                      </div>
                    </div>

                    {sizes.length ? (
                      <div>
                        <StepHeader n={sizeStepNum}>Elige el tamaño</StepHeader>
                        <div className="mt-2 ml-9 flex flex-wrap gap-1.5">
                          {sizes.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => { focusProduct(); updateItem(it.id, { size: s }); }}
                              className={[
                                "border px-3 py-1.5 text-[12px] font-medium transition",
                                it.size === s
                                  ? "border-rojo bg-rojo text-white"
                                  : "border-gray-200 text-gray-500 hover:border-gray-400",
                              ].join(" ")}
                            >
                              {labelSize(s)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {isGomitas ? (
                      <div ref={registerSectionRef(it.id, "referencia")} className="scroll-mt-28">
                        <StepHeader n={referenciaStepNum}>¿Ahogada o picosa?</StepHeader>
                        {showAttemptedHint && missingInfo?.section === "referencia" ? (
                          <MissingHint message={missingInfo.message} />
                        ) : null}
                        <div className="mt-2 ml-9">
                          <Referencias
                            value={it.version ?? null}
                            onChange={(v) => { focusProduct(); updateItem(it.id, { version: v }); }}
                            title=""
                            subtitle=""
                          />
                        </div>
                      </div>
                    ) : null}

                    {showToppings ? (
                      <div ref={registerSectionRef(it.id, "toppings")} className="scroll-mt-28">
                        <StepHeader n={toppingsStepNum}>
                          {isGomitas ? "Elige tus toppings (mínimo 1)" : `Elige tus toppings (opcional, hasta ${maxT})`}
                        </StepHeader>
                        {showAttemptedHint && missingInfo?.section === "toppings" ? (
                          <MissingHint message={missingInfo.message} />
                        ) : null}
                        <div className="mt-2 ml-9">
                          <Toppings
                            value={it.toppingIds}
                            onChange={(next) => { focusProduct(); updateItem(it.id, { toppingIds: next }); }}
                            max={maxT}
                            min={isGomitas && maxT > 0 ? 1 : 0}
                            small
                            title=""
                            subtitle=""
                            disabledIds={disabledToppingIds}
                          />
                        </div>
                      </div>
                    ) : null}

                    <div ref={registerSectionRef(it.id, "extras")} className="scroll-mt-28">
                      <StepHeader n={extrasStepNum}>Extras (opcional)</StepHeader>
                      {showAttemptedHint && missingInfo?.section === "extras" ? (
                        <MissingHint message={missingInfo.message} />
                      ) : null}
                      <div className="mt-2 ml-9 space-y-2">
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
                                    className="h-8 w-8 sm:h-6 sm:w-6 border border-gray-200 text-xs transition hover:border-gray-400 active:bg-gray-100"
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
                                    className="h-8 w-8 sm:h-6 sm:w-6 border border-gray-200 text-xs transition hover:border-gray-400 active:bg-gray-100"
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
                                    disabledIds={disabledToppingIds}
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
                        onClick={() => { setAttemptedItemId(null); onFocusProduct?.(null); }}
                        className="border border-gray-200 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-gray-500 hover:border-gray-400"
                      >
                        Cerrar
                      </button>

                      <button
                        type="button"
                        onClick={() => attemptCompleteItem(it)}
                        className={[
                          "border px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] transition",
                          isComplete
                            ? "border-rojo bg-rojo text-white active:bg-rojo-dark"
                            : "border-gray-300 text-gray-500 hover:border-rojo hover:text-rojo",
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
