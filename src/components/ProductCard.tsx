import { Link } from "react-router-dom";
import type { Product } from "../data/products";
import { cop } from "../lib/format";

function getStartingPrice(product: Product): number | null {
  if (product.category === "gomitas") {
    const values: number[] = [];
    Object.values(product.prices).forEach((versionPrices) => {
      Object.values(versionPrices).forEach((price) => {
        if (typeof price === "number" && price > 0) values.push(price);
      });
    });
    return values.length ? Math.min(...values) : null;
  }

  const { prices } = product as any;
  if ("fijo" in prices && typeof prices.fijo === "number") return prices.fijo;

  if (prices.porSize) {
    const vals = Object.values(prices.porSize).filter(
      (v): v is number => typeof v === "number" && v > 0,
    );
    return vals.length ? Math.min(...vals) : null;
  }

  return null;
}

function getGomitasPrices(product: Product): { ahogada: number | null; picosa: number | null } {
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

function getSubtitle(product: Product): string {
  return product.category === "gomitas" ? "Incluye toppings • Ahogada o Picosa" : "FrutaFresh";
}

type ProductCardProps = {
  product: Product;
  onToggle?: (product: Product) => void; // ✅ toggle add/remove
  actionLabel?: string; // label cuando NO está seleccionado (ej "Agregar")
  selected?: boolean;
};

export default function ProductCard({
  product,
  onToggle,
  actionLabel = "Agregar",
  selected = false,
}: ProductCardProps) {
  const startingPrice = getStartingPrice(product);
  const subtitle = getSubtitle(product);
  const gomitasPrices = product.category === "gomitas" ? getGomitasPrices(product) : null;

  return (
    <article
      className={[
        "group flex flex-col sm:flex-row gap-4 rounded-3xl p-4 transition",
        selected ? "bg-white/15 ring-1 ring-white/80" : "hover:bg-white/6 hover:ring-1 hover:ring-white/30",
      ].join(" ")}
    >
      <div
        className="
          relative shrink-0 overflow-hidden rounded-2xl
          bg-white/[0.04] ring-1 ring-white/10
          h-28 w-full
          sm:h-24 sm:w-24
        "
      >
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-white/30 text-xs">Sin imagen</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="truncate text-base font-black text-white">{product.name}</div>

          {onToggle ? (
            <button
              type="button"
              onClick={() => onToggle(product)}
              className={[
                "shrink-0 text-[10px] sm:text-xs uppercase tracking-[0.28em] rounded-full px-3 py-1 transition",
                selected ? "bg-white text-neutral-950" : "border border-white/20 text-white/70 hover:border-white hover:text-white",
              ].join(" ")}
            >
              {selected ? "Quitar" : actionLabel}
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
          {product.category === "gomitas" && gomitasPrices ? (
            <span className="flex flex-wrap gap-x-3 gap-y-1">
              {gomitasPrices.ahogada !== null && (
                <span>
                  Ahogada{" "}
                  <span className="font-bold text-white">{cop(gomitasPrices.ahogada)}</span>
                </span>
              )}
              {gomitasPrices.picosa !== null && (
                <span>
                  Picosa{" "}
                  <span className="font-bold text-white">{cop(gomitasPrices.picosa)}</span>
                </span>
              )}
            </span>
          ) : startingPrice !== null ? (
            <span>
              Desde <span className="font-bold text-white">{cop(startingPrice)}</span>
            </span>
          ) : (
            <span>Precio según configuración</span>
          )}

          {selected ? (
            <span className="inline-flex items-center rounded-full bg-white text-neutral-950 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]">
              En el pedido
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
