import { useState } from "react";
import { Link } from "react-router-dom";

import type { Product, Size } from "../data/products";
import { useStoreProducts } from "../hooks/useStoreProducts";
import { cop } from "../lib/format";
import imgAhogado from "../assets/referencias/ahogado.jpg";
import imgPicosin from "../assets/referencias/picosin.jpg";

type Props = {
  embedded?: boolean;
  showHeader?: boolean;
};

function getGomitasMinByVersion(product: Product): { ahogada: number | null; picosa: number | null } {
  if (product.category !== "gomitas") return { ahogada: null, picosa: null };

  const ahogadaVals = Object.values(product.prices.ahogada).filter(
    (v): v is number => typeof v === "number" && v > 0,
  );
  const picosaVals = Object.values(product.prices.picosa).filter(
    (v): v is number => typeof v === "number" && v > 0,
  );

  return {
    ahogada: ahogadaVals.length ? Math.min(...ahogadaVals) : null,
    picosa: picosaVals.length ? Math.min(...picosaVals) : null,
  };
}

function getFrutaFreshPrices(product: Product): {
  fijo: number | null;
  pequeno: number | null;
  mediano: number | null;
} {
  if (product.category !== "frutafresh") return { fijo: null, pequeno: null, mediano: null };

  const prices: any = product.prices;

  if ("fijo" in prices && typeof prices.fijo === "number" && prices.fijo > 0) {
    return { fijo: prices.fijo, pequeno: null, mediano: null };
  }

  const porSize = prices.porSize as Partial<Record<Size, number>> | undefined;
  const pequeno = typeof porSize?.pequeno === "number" && porSize.pequeno > 0 ? porSize.pequeno : null;
  const mediano = typeof porSize?.mediano === "number" && porSize.mediano > 0 ? porSize.mediano : null;

  return { fijo: null, pequeno, mediano };
}

function priceLine(p: Product) {
  if (p.category === "gomitas") {
    const gv = getGomitasMinByVersion(p);
    const parts: string[] = [];
    if (gv.ahogada != null) parts.push(`Ahogada desde ${cop(gv.ahogada)}`);
    if (gv.picosa != null) parts.push(`Picosa desde ${cop(gv.picosa)}`);
    return parts.length ? parts.join(" • ") : "Precio por confirmar";
  }

  const ff = getFrutaFreshPrices(p);
  if (ff.fijo != null) return `Precio ${cop(ff.fijo)}`;
  const parts: string[] = [];
  if (ff.pequeno != null) parts.push(`Pequeño ${cop(ff.pequeno)}`);
  if (ff.mediano != null) parts.push(`Mediano ${cop(ff.mediano)}`);
  return parts.length ? parts.join(" • ") : "Precio por confirmar";
}

function normalizeText(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

function productDetailsText(p: Product) {
  const anyP = p as any;
  const ingredients =
    Array.isArray(anyP.ingredients) && anyP.ingredients.length
      ? anyP.ingredients.join(", ")
      : normalizeText(anyP.ingredients) ?? normalizeText(anyP.description);

  return ingredients;
}

export default function Catalogo({
  embedded = false,
  showHeader = true,
}: Props) {
  const { products: storeProducts } = useStoreProducts();
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  const scrollToElementTop = (el: HTMLElement | null) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const offset = window.innerWidth >= 1024 ? 104 : window.innerWidth >= 640 ? 88 : 72;
    const targetTop = Math.max(0, rect.top + window.scrollY - offset);
    window.scrollTo({ top: targetTop, behavior: "smooth" });
  };

  const list = storeProducts;

  return (
    <div className={embedded ? "bg-crema text-neutral-900" : "bg-crema text-neutral-900 pt-16 sm:pt-20 lg:pt-24"}>
      <div className={embedded ? "" : "px-4 pb-16"}>
        {showHeader ? (
          <div className="mx-auto max-w-6xl pt-4 sm:pt-8 pb-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Catálogo</p>
            <h1 className="mt-1.5 text-xl sm:text-2xl font-semibold text-gray-900">Nuestros productos</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">Gomitas y fruta con nuestro mix especial.</p>
          </div>
        ) : null}

        {/* Intro: SOLO referencias en redondo */}
        <section className="mx-auto max-w-6xl mt-2 mb-6 sm:mb-10">
          <div className="text-center mb-4 sm:mb-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">gomitas</p>
            <h2 className="mt-1.5 text-base sm:text-xl font-semibold text-gray-900">Ahogadas o picosas, tú decides</h2>
            <div className="mx-auto max-w-2xl">
              <p className="mt-2 text-sm text-gray-600 text-center leading-relaxed px-4">
                Nuestras gomitas pueden ser ahogadas en chamoy o con un toque picoso. La presentación y el precio pueden variar según la referencia que elijas.
              </p>
            </div>
          </div>

          <div className="flex flex-row items-center justify-center gap-6 sm:gap-10">
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-20 h-20 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-1 ring-gray-200">
                <img src={imgAhogado} alt="Gomitas ahogadas" className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/5" />
              </div>
              <div className="text-center">
                <div className="text-[11px] uppercase tracking-[0.28em] text-gray-600">ahogada</div>
                <div className="text-xs text-gray-500 mt-1">Bañadas en nuestro mix especial de chamoy.</div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="relative w-20 h-20 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-1 ring-gray-200">
                <img src={imgPicosin} alt="Gomitas picosas" className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/5" />
              </div>
              <div className="text-center">
                <div className="text-[11px] uppercase tracking-[0.28em] text-gray-600">picosa</div>
                <div className="text-xs text-gray-500 mt-1">Con el toque justo de picante que enamora.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Productos: 1 columna en mobile, 2 columnas en desktop */}
        <section className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {list.map((p) => {
              const expanded = expandedProductId === p.id;
              const details = productDetailsText(p);

              return (
                <div key={p.id} className="border-t border-gray-200 pt-5">
                  {/* Contenedor relativo para el drawer */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        setExpandedProductId((prev) => (prev === p.id ? null : p.id));
                        const target = e.currentTarget as unknown as HTMLElement;
                        requestAnimationFrame(() => scrollToElementTop(target));
                      }}
                      aria-expanded={expanded}
                      aria-controls={`product-details-${p.id}`}
                      className="w-full text-left group"
                    >
                      <div className="flex items-start gap-5">
                        {/* Foto MÁS grande (NO redonda) */}
                        <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 shrink-0 overflow-hidden bg-gray-50 ring-1 ring-gray-200 overflow-hidden">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className={[
                                "h-full w-full object-cover transition-transform duration-500",
                                "group-hover:scale-[1.05]",
                                expanded ? "scale-[1.02]" : "",
                              ].join(" ")}
                              loading="lazy"
                            />
                          ) : (
                            <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">Sin imagen</div>
                          )}

                          <div
                            className={[
                              "absolute inset-0 transition-opacity duration-200",
                              expanded ? "opacity-100 bg-black/10" : "opacity-0 group-hover:opacity-100 bg-black/5",
                            ].join(" ")}
                          />
                        </div>

                        {/* Info básica SIEMPRE visible (incluye precio) */}
                        <div className={["min-w-0 flex-1", expanded ? "lg:pr-[360px]" : ""].join(" ")}>
                          <div className="text-[11px] uppercase tracking-[0.28em] text-gray-500">
                            {p.category === "gomitas" ? "Gomitas" : "FrutaFresh"}
                          </div>

                          <div className="mt-1 text-lg sm:text-xl font-semibold leading-snug text-black">{p.name}</div>

                          <div className="mt-2 text-base font-bold text-gray-700">{priceLine(p)}</div>

                          {!expanded ? (
                            <div className="mt-2 text-xs text-gray-400">Toca para ver ingredientes y detalles.</div>
                          ) : null}
                        </div>
                      </div>
                    </button>

                    {/* Drawer desktop: barra lateral visible con la info */}
                    <div className="hidden lg:block">
                      <div
                        className={[
                          "absolute top-0 right-0 h-full w-[340px]",
                          "border-l border-gray-200",
                          "bg-white/95 backdrop-blur-sm",
                          "px-5 py-4 rounded-r-xl",
                          "transition-all duration-300 ease-out",
                          expanded
                            ? "opacity-100 translate-x-0 pointer-events-auto"
                            : "opacity-0 translate-x-6 pointer-events-none",
                        ].join(" ")}
                      >
                        <div className="flex h-full flex-col justify-between gap-4">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.28em] text-gray-500">Ingredientes</div>

                            <div className="mt-2 text-sm text-gray-700 leading-relaxed">
                              {details ? details : <span className="text-gray-400">Ingredientes por confirmar.</span>}
                            </div>

                            <div className="mt-3 text-xs text-gray-500">
                              {p.category === "gomitas" ? (
                                <span>
                                  Elige <span className="font-semibold text-gray-800">ahogadas</span> o{" "}
                                  <span className="font-semibold text-gray-800">picosas</span>. Cambia la presentación y
                                  puede variar el precio.
                                </span>
                              ) : (
                                <span>
                                  {(p.toppingsIncludedMax ?? 2) > 0
                                    ? `Incluye hasta ${(p.toppingsIncludedMax ?? 2).toString()} toppings (los eliges al armar tu pedido).`
                                    : "No incluye toppings."}
                                </span>
                              )}
                            </div>

                            <Link
                              to={`/armar?categoria=${p.categoryId || p.category}`}
                              className="mt-4 inline-flex items-center gap-2 bg-rojo px-4 py-2 text-xs font-bold text-white hover:bg-rojo-dark transition-colors"
                            >
                              Armar pedido
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Panel móvil/tablet debajo */}
                    <div
                      id={`product-details-${p.id}`}
                      className={[
                        "lg:hidden overflow-hidden transition-all duration-300 ease-out",
                        expanded ? "max-h-[520px] opacity-100 mt-4" : "max-h-0 opacity-0 mt-0",
                      ].join(" ")}
                    >
                      <div className="border-t border-gray-200 pt-4">
                        <div className="text-[10px] uppercase tracking-[0.28em] text-gray-500">Ingredientes</div>
                        <div className="mt-2 text-sm text-gray-600 leading-relaxed">
                          {details ? details : <span className="text-gray-400">Ingredientes por confirmar.</span>}
                        </div>

                        <div className="mt-3 text-xs text-gray-500">
                          {p.category === "gomitas" ? (
                            <span>
                              Elige <span className="font-semibold text-gray-800">ahogadas</span> o{" "}
                              <span className="font-semibold text-gray-800">picosas</span>. Cambia la presentación y puede
                              variar el precio.
                            </span>
                          ) : (
                            <span>
                              {(p.toppingsIncludedMax ?? 2) > 0
                                ? `Incluye hasta ${(p.toppingsIncludedMax ?? 2).toString()} toppings (los eliges al armar tu pedido).`
                                : "No incluye toppings."}
                            </span>
                          )}
                        </div>

                        <Link
                          to={`/armar?categoria=${p.categoryId || p.category}`}
                          className="mt-4 inline-flex items-center gap-2 bg-rojo px-4 py-2 text-xs font-bold text-white hover:bg-rojo-dark transition-colors"
                        >
                          Armar pedido
                        </Link>

                        <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-rojo/25 to-transparent" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
