import { useState } from "react";
import type { Product, Size } from "../data/products";
import { cop } from "../lib/format";
import type { CategoryTabValue } from "./CategoryTabs";

function getMinPrice(product: Product): number | null {
  if (product.category === "gomitas") {
    const all = [
      ...Object.values(product.prices.ahogada),
      ...Object.values(product.prices.picosa),
    ].filter((v): v is number => typeof v === "number" && v > 0);
    return all.length ? Math.min(...all) : null;
  }

  const prices: any = product.prices;
  if ("fijo" in prices && typeof prices.fijo === "number" && prices.fijo > 0) {
    return prices.fijo;
  }
  const porSize = prices.porSize as Partial<Record<Size, number>> | undefined;
  const all = Object.values(porSize ?? {}).filter((v): v is number => typeof v === "number" && v > 0);
  return all.length ? Math.min(...all) : null;
}

function getPriceDescription(product: Product): string {
  if (product.category === "gomitas") {
    const ahogada = Math.min(...Object.values(product.prices.ahogada).filter((v): v is number => v > 0));
    const picosa = Math.min(...Object.values(product.prices.picosa).filter((v): v is number => v > 0));
    const parts: string[] = [];
    if (ahogada > 0) parts.push(`Ahogada ${cop(ahogada)}`);
    if (picosa > 0) parts.push(`Picosa ${cop(picosa)}`);
    return parts.length ? parts.join(" • ") : "Precio por confirmar";
  }

  const prices: any = product.prices;
  if ("fijo" in prices && typeof prices.fijo === "number" && prices.fijo > 0) {
    return cop(prices.fijo);
  }
  const porSize = prices.porSize as Partial<Record<Size, number>> | undefined;
  const parts: string[] = [];
  if (porSize?.pequeno) parts.push(`Pequeño ${cop(porSize.pequeno)}`);
  if (porSize?.mediano) parts.push(`Mediano ${cop(porSize.mediano)}`);
  if (porSize?.grande) parts.push(`Grande ${cop(porSize.grande)}`);
  return parts.length ? parts.join(" • ") : "Precio por confirmar";
}

function getDetailText(p: Product): string | null {
  const anyP = p as any;
  if (Array.isArray(anyP.ingredients) && anyP.ingredients.length) return anyP.ingredients.join(", ");
  if (typeof anyP.ingredients === "string" && anyP.ingredients.trim()) return anyP.ingredients.trim();
  if (typeof anyP.description === "string" && anyP.description.trim()) return anyP.description.trim();
  return null;
}

type Props = {
  selectedIds: string[];
  selectedCountByProduct: Record<string, number>;
  onAdd: (p: Product) => void;
  onRemoveLast: (productId: string) => void;
  filter: CategoryTabValue;
  extraProducts?: Product[];
};

export default function CatalogoCompacto({ selectedCountByProduct, onAdd, onRemoveLast, filter, extraProducts = [] }: Props) {
  const [flippedId, setFlippedId] = useState<string | null>(null);

  const list = extraProducts.filter((p) => {
    if (filter === "todos") return true;
    if (p.categoryId) return p.categoryId === filter;
    return p.category === filter;
  });

  return (
    <div className="space-y-4">
      {list.map((p) => {
        const count = selectedCountByProduct[p.id] ?? 0;
        const minPrice = getMinPrice(p);
        const isFlipped = flippedId === p.id;
        const details = getDetailText(p);

        return (
          <div
            key={p.id}
            className="border-b border-gray-200 pb-4 last:border-b-0"
            style={{ perspective: "1000px" }}
          >
            <div
              className="relative transition-transform duration-500"
              style={{
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* FRONT */}
              <div
                className="flex gap-4 cursor-pointer"
                style={{ backfaceVisibility: "hidden" }}
                onClick={() => setFlippedId(p.id)}
              >
                {/* Imagen 4:5 */}
                <div className="relative w-24 sm:w-36 flex-shrink-0 overflow-hidden bg-gray-100" style={{ aspectRatio: "4/5" }}>
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">
                      Sin imagen
                    </div>
                  )}

                  {count > 0 ? (
                    <div className="absolute left-0 top-0 bg-rojo px-2 py-1 text-[11px] font-semibold text-white">
                      x{count}
                    </div>
                  ) : null}
                </div>

                {/* Info */}
                <div className="flex flex-col justify-center py-2 min-w-0 flex-1">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                    {p.category === "gomitas" ? "Gomitas" : "FrutaFresh"}
                  </span>
                  <h3 className="mt-1 text-base sm:text-lg font-medium text-gray-900 leading-tight">{p.name}</h3>
                  <p className="mt-1.5 text-sm font-semibold text-gray-900">{getPriceDescription(p)}</p>
                  <p className="mt-2 text-[10px] text-gray-400">Toca para ver más</p>
                </div>
              </div>

              {/* BACK */}
              <div
                className="absolute inset-0 flex flex-col bg-rojo cursor-pointer overflow-y-auto"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
                onClick={() => setFlippedId(null)}
              >
                <div className="flex gap-3 flex-1 min-h-0">
                  <div className="relative w-20 sm:w-28 flex-shrink-0 overflow-hidden bg-rojo-dark">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover opacity-40" loading="lazy" />
                    ) : null}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-2">
                      {count === 0 ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onAdd(p); }}
                          className="w-full border border-white bg-white text-rojo-dark py-1.5 text-[10px] font-medium uppercase tracking-wider active:bg-white/80"
                        >
                          Agregar
                        </button>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onRemoveLast(p.id); }}
                              className="flex h-9 w-9 items-center justify-center border border-white/50 text-sm text-white active:bg-white/20"
                            >
                              −
                            </button>
                            <span className="w-5 text-center text-xs font-medium text-white">{count}</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onAdd(p); }}
                              className="flex h-9 w-9 items-center justify-center border border-white bg-white text-sm text-rojo-dark active:bg-white/80"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-[9px] text-white/50">{count} en pedido</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center py-3 min-w-0 flex-1 pr-3">
                    <span className="text-[9px] uppercase tracking-widest text-white/50 font-medium">
                      {p.category === "gomitas" ? "Gomitas" : "FrutaFresh"}
                    </span>
                    <h3 className="mt-0.5 text-sm font-semibold text-white leading-tight">{p.name}</h3>
                    {details ? (
                      <p className="mt-1.5 text-xs text-white/80 leading-relaxed">{details}</p>
                    ) : null}
                    <div className="mt-1.5 text-[10px] text-white/50">
                      {p.category === "gomitas"
                        ? "Ahogada o picosa"
                        : (p.toppingsIncludedMax ?? 0) > 0
                          ? `Hasta ${p.toppingsIncludedMax} toppings`
                          : "Personalizable"}
                    </div>
                    {minPrice != null ? (
                      <p className="mt-1.5 text-sm font-semibold text-white">Desde {cop(minPrice)}</p>
                    ) : null}
                    <p className="mt-2 text-[10px] text-white/40">Toca para volver</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
