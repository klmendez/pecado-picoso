import type { Product } from "../../data/products";
import CatalogoCompacto from "../CatalogoCompacto";
import CategoryTabs from "../CategoryTabs";
import type { CategoryTabValue } from "../CategoryTabs";

type Props = {
  category: CategoryTabValue;
  onChangeCategory: (value: CategoryTabValue) => void;
  selectedIds: string[];
  selectedCountByProduct: Record<string, number>;
  onAddProduct: (product: Product) => void;
};

export default function ProductSelectionSection({
  category,
  onChangeCategory,
  selectedIds,
  selectedCountByProduct,
  onAddProduct,
}: Props) {
  return (
    <section>
      <div>
        <div className="text-sm font-black">1) Elegir productos</div>
        <div className="text-xs text-white/55">Cada toque agrega una unidad; luego puedes personalizar cada una por separado.</div>
      </div>

      <div className="mt-4">
        <CategoryTabs value={category} onChange={onChangeCategory} />
      </div>

      <div className="mt-4">
        <CatalogoCompacto
          selectedIds={selectedIds}
          selectedCountByProduct={selectedCountByProduct}
          onAdd={onAddProduct}
          filter={category}
        />
      </div>

      {selectedIds.length ? (
        <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-300/60 bg-emerald-400/10 text-[10px] font-black">
            ✓
          </span>
          Listo para configuración
        </div>
      ) : null}
    </section>
  );
}
