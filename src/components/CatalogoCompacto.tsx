import type { Product, Size } from "../data/products";
import { cop } from "../lib/format";
import type { CategoryTabValue } from "./CategoryTabs";

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

function getExtraInfo(p: Product): string {
  if (p.category === "gomitas") return "Ahogada o picosa";
  return (p.toppingsIncludedMax ?? 0) > 0
    ? `Hasta ${p.toppingsIncludedMax} toppings`
    : "Personalizable";
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
  const list = extraProducts.filter((p) => {
    if (filter === "todos") return true;
    if (p.categoryId) return p.categoryId === filter;
    return p.category === filter;
  });

  return (
    <div className="space-y-4">
      {list.map((p) => {
        const count = selectedCountByProduct[p.id] ?? 0;
        const details = getDetailText(p);
        const disponible = p.disponible !== false;

        return (
          <div key={p.id} className="flex gap-4 border-b border-gray-200 pb-4 last:border-b-0">
            {/* Imagen 4:5 */}
            <div className={["relative w-32 sm:w-44 md:w-48 flex-shrink-0 overflow-hidden bg-gray-100", !disponible ? "opacity-50" : ""].join(" ")} style={{ aspectRatio: "4/5" }}>
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

              {!disponible ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-800">
                    No disponible
                  </span>
                </div>
              ) : count > 0 ? (
                <div className="absolute left-0 top-0 bg-rojo px-2 py-1 text-[11px] font-semibold text-white">
                  x{count}
                </div>
              ) : null}
            </div>

            {/* Info: precio, descripción y controles, todo visible de una vez */}
            <div className="flex flex-col justify-center py-2 min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                {p.category === "gomitas" ? "Gomitas" : "FrutaFresh"}
              </span>
              <h3 className="mt-1 text-base sm:text-lg font-medium text-gray-900 leading-tight">{p.name}</h3>

              {disponible ? (
                <p className="mt-1 text-sm font-semibold text-gray-900">{getPriceDescription(p)}</p>
              ) : (
                <p className="mt-1 text-sm font-semibold text-gray-400">No disponible por ahora</p>
              )}

              {details ? (
                <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{details}</p>
              ) : null}

              <p className="mt-1 text-[10px] text-gray-400">{getExtraInfo(p)}</p>

              <div className="mt-3">
                {!disponible ? (
                  <span className="inline-block border border-gray-300 text-gray-400 py-1.5 px-4 text-[11px] font-medium uppercase tracking-wider">
                    No disponible
                  </span>
                ) : count === 0 ? (
                  <button
                    type="button"
                    onClick={() => onAdd(p)}
                    className="inline-flex items-center gap-1.5 border border-rojo bg-rojo py-1.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-white active:bg-rojo-dark"
                  >
                    + Agregar
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-3 border border-rojo px-1">
                    <button
                      type="button"
                      onClick={() => onRemoveLast(p.id)}
                      className="flex h-8 w-8 items-center justify-center text-rojo active:bg-rojo-light"
                      aria-label="Quitar uno"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm font-semibold text-gray-900">{count}</span>
                    <button
                      type="button"
                      onClick={() => onAdd(p)}
                      className="flex h-8 w-8 items-center justify-center text-rojo active:bg-rojo-light"
                      aria-label="Agregar uno más"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
