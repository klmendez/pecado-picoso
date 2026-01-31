import { useState } from "react";
import type { Product } from "../data/products";
import Catalogo from "./Catalogo";

export default function CatalogoPage() {
  // Estado local solo para que /catalogo funcione como página independiente
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const onToggleProduct = (p: Product) => {
    setSelectedProductIds((prev) =>
      prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id],
    );
  };

  return (
    <div className="bg-neutral-950 text-white min-h-screen">
      <Catalogo
        embedded={false}
        showHeader={true}
        selectedProductIds={selectedProductIds}
        onToggleProduct={onToggleProduct}
        actionLabel="Agregar"
      />
    </div>
  );
}
