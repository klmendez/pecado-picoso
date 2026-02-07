import type { Product, Size } from "../../data/products";
import { isFixedPrice } from "../../data/products";
import type { Barrio } from "../../data/barrios";
import { TOPPINGS } from "../../data/toppings";
import { EXTRAS } from "../../data/extras";

export function getAvailableSizes(product: Product): Size[] {
  if (product.category === "gomitas") return product.sizes;
  if (isFixedPrice(product.prices)) return product.sizes ?? [];
  const entries = Object.entries(product.prices.porSize ?? {}) as Array<[Size, number | undefined]>;
  return entries.filter(([, v]) => typeof v === "number" && v > 0).map(([s]) => s);
}

export function defaultSize(product: Product): Size | null {
  const sizes = getAvailableSizes(product);
  return sizes[0] ?? null;
}

export function maxToppingsFor(product: Product): number {
  if (product.category === "gomitas") return Math.max(0, product.toppingsIncludedMax ?? 0);
  if (product.category === "frutafresh") return Math.max(0, product.toppingsIncludedMax ?? 2);
  return 0;
}

export function labelSize(size: Size) {
  return size === "pequeno" ? "Pequeño" : size === "mediano" ? "Mediano" : "Grande";
}

export function toppingsNames(ids: string[]) {
  const map = new Map(TOPPINGS.map((t) => [t.id, t.name]));
  return ids.map((id) => map.get(id) ?? id);
}

export function extrasLine(extrasQty: Record<string, number>) {
  return EXTRAS.flatMap((extra) => {
    const qty = extrasQty[extra.id] ?? 0;
    return qty > 0 ? [`${extra.name} x${qty}`] : [];
  });
}

export function barrioMatchesQuery(barrio: Barrio, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const name = barrio.name.toLowerCase();
  const id = barrio.id.toLowerCase();
  return name.includes(q) || id.includes(q);
}
