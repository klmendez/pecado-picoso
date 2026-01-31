import type { Product } from "../data/products";
import { PRODUCTS } from "../data/products";
import ProductCard from "../components/ProductCard";

type Props = {
  embedded?: boolean;
  showHeader?: boolean;

  // ✅ carrito / multi-select
  selectedProductIds: string[];
  onToggleProduct: (p: Product) => void;

  actionLabel?: string; // “Agregar”
};

export default function Catalogo({
  embedded = false,
  showHeader = true,
  selectedProductIds,
  onToggleProduct,
  actionLabel = "Agregar",
}: Props) {
  const isSelected = (id: string) => selectedProductIds.includes(id);

  return (
    <div className={embedded ? "" : "px-4"}>
      {showHeader ? (
        <div className="mx-auto max-w-6xl py-10">
          <h1 className="text-3xl font-black text-white">Catálogo</h1>
          <p className="text-white/60 mt-2">Elige uno o varios productos.</p>
        </div>
      ) : null}

      <div className="mx-auto max-w-6xl grid gap-3">
        {PRODUCTS.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            selected={isSelected(p.id)}
            onToggle={onToggleProduct}
            actionLabel={actionLabel}
          />
        ))}
      </div>
    </div>
  );
}
