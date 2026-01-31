import { useMemo, useState } from "react";
import CategoryTabs from "../components/CategoryTabs";
import ProductCard from "../components/ProductCard";
import { PRODUCTS, type Product } from "../data/products";

type CatalogoProps = {
  onSelectProduct?: (product: Product) => void;
  selectedProductIds?: string[];
  showHeader?: boolean;
  embedded?: boolean;
  actionLabel?: string;
};

export default function Catalogo({
  onSelectProduct,
  selectedProductIds = [],
  showHeader = true,
  embedded = false,
  actionLabel,
}: CatalogoProps = {}) {
  const [tab, setTab] = useState<"todos" | "gomitas" | "frutafresh">("todos");

  const list = useMemo(() => {
    if (tab === "todos") return PRODUCTS;
    return PRODUCTS.filter((p) => p.category === tab);
  }, [tab]);

  const containerClass = embedded ? "space-y-6" : "mx-auto max-w-6xl px-4 py-10";

  // ✅ 2 columnas siempre (mobile y desktop)
  const gridClass = embedded
    ? "grid grid-cols-2 gap-3 sm:gap-4"
    : "mt-8 grid grid-cols-2 gap-3 sm:gap-4";

  return (
    <div className={containerClass}>
      {showHeader ? (
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black">Catálogo</h2>
            <p className="text-neutral-400 mt-2">Gomitas y FrutaFresh en un solo lugar.</p>
          </div>
          <CategoryTabs value={tab} onChange={setTab} />
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="text-2xl font-black">Selecciona tu capricho</h3>
          <CategoryTabs value={tab} onChange={setTab} />
        </div>
      )}

      <div className={gridClass}>
        {list.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onSelect={onSelectProduct}
            selected={selectedProductIds.includes(p.id)}
            actionLabel={actionLabel ?? (onSelectProduct ? "Elegir" : undefined)}
          />
        ))}
      </div>
    </div>
  );
}
