import { Link } from "react-router-dom";
import type { Product } from "../data/products";
import { cop } from "../lib/format";

function getStartingPrice(product: Product): number | null {
  if (product.category === "gomitas") {
    const values: number[] = [];
    Object.values(product.prices).forEach((versionPrices) => {
      Object.values(versionPrices).forEach((price) => {
        if (price && price > 0) values.push(price);
      });
    });
    return values.length ? Math.min(...values) : null;
  }

  const { prices } = product;
  if ("fijo" in prices && typeof prices.fijo === "number") return prices.fijo;
  if (prices.porSize) {
    const vals = Object.values(prices.porSize).filter((v): v is number => typeof v === "number" && v > 0);
    return vals.length ? Math.min(...vals) : null;
  }
  return null;
}

function getSubtitle(product: Product): string {
  return product.category === "gomitas" ? "Incluye toppings • Ahogada o Picosa" : "FrutaFresh";
}

type ProductCardProps = {
  product: Product;
  onSelect?: (product: Product) => void;
  actionLabel?: string;
  selected?: boolean;
};

export default function ProductCard({ product, onSelect, actionLabel = "Armar", selected = false }: ProductCardProps) {
  const startingPrice = getStartingPrice(product);
  const subtitle = getSubtitle(product);

  return (
    <article
      className={[
        "group flex gap-4 rounded-3xl p-4 transition",
        selected ? "bg-white/15 ring-1 ring-white/80" : "hover:bg-white/6 hover:ring-1 hover:ring-white/30",
      ].join(" ")}
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-white/30 text-xs">Sin imagen</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="truncate text-base font-black text-white">{product.name}</div>
          {onSelect ? (
            <button
              type="button"
              onClick={() => onSelect(product)}
              className={[
                "shrink-0 text-xs uppercase tracking-[0.28em] rounded-full px-3 py-1 transition",
                selected
                  ? "bg-white text-neutral-950"
                  : "border border-white/20 text-white/70 hover:border-white hover:text-white",
              ].join(" ")}
            >
              {actionLabel}
            </button>
          ) : (
            <Link
              to={`/armar?productId=${encodeURIComponent(product.id)}`}
              className="shrink-0 text-xs uppercase tracking-widest text-white/60 hover:text-white transition"
            >
              Armar
            </Link>
          )}
        </div>

        <div className="mt-1 text-xs text-white/50">{subtitle}</div>

        <p className="mt-2 text-sm text-white/70 leading-snug line-clamp-2">{product.description}</p>

        <div className="mt-3 text-xs text-white/60 flex items-center gap-2">
          {startingPrice !== null ? (
            <span>
              Desde <span className="font-bold text-white">{cop(startingPrice)}</span>
            </span>
          ) : (
            <span>Precio según configuración</span>
          )}
          {selected ? (
            <span className="inline-flex items-center rounded-full bg-white text-neutral-950 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]">
              Seleccionado
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
