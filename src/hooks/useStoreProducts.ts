import { useState, useEffect, useCallback } from "react";
import type { Product, Size } from "../data/products";
import type { FirestoreProduct } from "../services/productService";
import type { FirestoreCategory } from "../services/categoryService";

export type StoreCategory = {
  id: string;
  name: string;
  description?: string;
  image?: string;
};

export function useStoreProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ ProductService }, { CategoryService }] = await Promise.all([
        import("../services/productService"),
        import("../services/categoryService"),
      ]);

      const [rawProducts, rawCategories] = await Promise.all([
        ProductService.getProducts(),
        CategoryService.getCategories(),
      ]);

      setCategories(
        rawCategories.map((c: FirestoreCategory) => ({
          id: c.id!,
          name: c.name,
          description: c.description,
          image: c.image,
        }))
      );

      // Map Firestore products to store Product type
      const mapped: Product[] = rawProducts.map((fp: FirestoreProduct) => {
        const cat = rawCategories.find((c: FirestoreCategory) => c.id === fp.categoryId);
        const catName = (cat?.name ?? "").toLowerCase();
        const isGomitas = catName.includes("gomita") || catName.includes("goma");

        const base = {
          id: fp.id!,
          categoryId: fp.categoryId,
          name: fp.name,
          description: fp.description || "",
          image: fp.image,
        };

        if (isGomitas) {
          const opts = fp.priceOptions;
          const fallback = Number(fp.price) || 0;
          const prices = opts?.porVersion
            ? {
                ahogada: {
                  pequeno: opts.porVersion.ahogada?.pequeno || fallback,
                  mediano: opts.porVersion.ahogada?.mediano || 0,
                  grande: opts.porVersion.ahogada?.grande || 0,
                },
                picosa: {
                  pequeno: opts.porVersion.picosa?.pequeno || fallback,
                  mediano: opts.porVersion.picosa?.mediano || 0,
                  grande: opts.porVersion.picosa?.grande || 0,
                },
              }
            : {
                ahogada: { pequeno: fallback, mediano: 0, grande: 0 },
                picosa: { pequeno: fallback, mediano: 0, grande: 0 },
              };

          return {
            ...base,
            category: "gomitas" as const,
            toppingsIncludedMax: fp.toppingsIncludedMax ?? 4,
            sizes: (fp.sizes as Size[]) ?? ["pequeno"],
            prices,
          };
        }

        // Fruta fresh
        const opts = fp.priceOptions;
        let prices: any;
        if (opts?.fijo != null) {
          prices = { fijo: opts.fijo };
        } else if (opts?.porSize) {
          prices = { porSize: opts.porSize };
        } else {
          prices = { fijo: Number(fp.price) ?? 0 };
        }

        return {
          ...base,
          category: "frutafresh" as const,
          toppingsIncludedMax: fp.toppingsIncludedMax ?? 0,
          sizes: (fp.sizes as Size[]) ?? undefined,
          prices,
        };
      });

      setProducts(mapped);
    } catch (err: any) {
      setError(err.message || "Error cargando productos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { products, categories, loading, error, reload: load };
}
