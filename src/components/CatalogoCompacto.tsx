import type { Product } from "../data/products";
import { PRODUCTS } from "../data/products";
import { cop } from "../lib/format";

type TabValue = "todos" | "gomitas" | "frutafresh";

function getStartingPrice(product: Product): number | null {
  if (product.category === "gomitas") {
    const values: number[] = [];
    Object.values(product.prices).forEach((versionPrices: any) => {
      Object.values(versionPrices).forEach((price: any) => {
        if (price && price > 0) values.push(price);
      });
    });
    return values.length ? Math.min(...values) : null;
  }

  const prices: any = product.prices;
  if ("fijo" in prices && typeof prices.fijo === "number") return prices.fijo;

  if (prices.porSize) {
    const vals = Object.values(prices.porSize).filter((v: any) => typeof v === "number" && v > 0) as number[];
    return vals.length ? Math.min(...vals) : null;
  }

  return null;
}

type Props = {
  selectedIds: string[];
  onToggle: (p: Product) => void;
  filter: TabValue; // ✅ nuevo
};

export default function CatalogoCompacto({ selectedIds, onToggle, filter }: Props) {
  const isSelected = (id: string) => selectedIds.includes(id);

  const list = PRODUCTS.filter((p) => {
    if (filter === "todos") return true;
    return p.category === filter;
  });

  return (
    <div className="grid grid-cols-2 gap-3">
      {list.map((p) => {
        const active = isSelected(p.id);
        const from = getStartingPrice(p);

        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onToggle(p)}
            className={[
              "group text-left transition",
              "border-b border-white/10 pb-3",
              active ? "opacity-100" : "opacity-90 hover:opacity-100",
            ].join(" ")}
          >
            <div className="flex gap-3">
              {/* Imagen (más grande) */}
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden bg-white/5">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-[10px] text-white/40">Sin imagen</div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-white">{p.name}</div>
                    <div className="text-[11px] text-white/55">
                      {p.category === "gomitas" ? "Gomitas" : "FrutaFresh"}
                      {from != null ? ` • Desde ${cop(from)}` : ""}
                    </div>
                  </div>

                  <span
                    className={[
                      "shrink-0 text-[10px] uppercase tracking-[0.22em] px-2 py-1",
                      active ? "text-white font-black" : "text-white/55",
                    ].join(" ")}
                  >
                    {active ? "Quitar" : "Agregar"}
                  </span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
