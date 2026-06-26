import type { Product } from "../../data/products";
import CatalogoCompacto from "../CatalogoCompacto";
import CategoryTabs from "../CategoryTabs";
import type { CategoryTabValue } from "../CategoryTabs";

type StoreCategory = { id: string; name: string };

type Props = {
  category: CategoryTabValue;
  onChangeCategory: (value: CategoryTabValue) => void;
  selectedIds: string[];
  selectedCountByProduct: Record<string, number>;
  onAddProduct: (product: Product) => void;
  onRemoveLastOfProduct: (productId: string) => void;
  extraProducts?: Product[];
  categories?: StoreCategory[];
};

export default function ProductSelectionSection({
  category,
  onChangeCategory,
  selectedIds,
  selectedCountByProduct,
  onAddProduct,
  onRemoveLastOfProduct,
  extraProducts,
  categories,
}: Props) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <CategoryTabs value={category} onChange={onChangeCategory} categories={categories} />
      </div>

      <div className="mt-3 sm:mt-4">
        <CatalogoCompacto
          selectedIds={selectedIds}
          selectedCountByProduct={selectedCountByProduct}
          onAdd={onAddProduct}
          onRemoveLast={onRemoveLastOfProduct}
          filter={category}
          extraProducts={extraProducts}
        />
      </div>

      {selectedIds.length ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-emerald-600">
          <span>✓</span>
          <span>{selectedIds.length} {selectedIds.length === 1 ? "producto seleccionado" : "productos seleccionados"}</span>
        </div>
      ) : null}
    </section>
  );
}
