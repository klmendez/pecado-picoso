import type { Product, Size, Version } from "../data/products";
import { isFixedPrice } from "../data/products";
import type { Extra } from "../data/extras";
import type { Barrio } from "../data/barrios";

export function getBasePrice(product: Product | null, version: Version | null, size: Size | null): number {
  if (!product) return 0;

  if (product.category === "gomitas") {
    if (!version || !size) return 0;
    const price = product.prices[version]?.[size];
    // Retorna el precio si es > 0, sino intenta la otra versión
    if (typeof price === "number" && price > 0) return price;
    // Si el precio es 0 o undefined, intenta la otra versión
    const otherVersion = version === "ahogada" ? "picosa" : "ahogada";
    const otherPrice = product.prices[otherVersion]?.[size];
    if (typeof otherPrice === "number" && otherPrice > 0) return otherPrice;
    return price ?? 0;
  }

  const { prices } = product;

  // Fruta Fresh: primero intenta precio fijo
  if (isFixedPrice(prices)) {
    return prices.fijo;
  }

  // Luego intenta por tamaño
  if (size && prices.porSize?.[size]) {
    return prices.porSize[size] ?? 0;
  }

  // Si no hay tamaño pero hay porSize, retorna el primer precio disponible
  if (prices.porSize) {
    const first = Object.values(prices.porSize).find((value): value is number => typeof value === "number" && value > 0);
    if (typeof first === "number") return first;
  }

  return 0;
}

export function extrasTotal(extrasQty: Record<string, number>, catalog: Extra[]): number {
  return catalog.reduce((sum, extra) => {
    const qty = extrasQty[extra.id] ?? 0;
    if (!qty) return sum;
    return sum + extra.price * qty;
  }, 0);
}

export function deliveryCost(service: "llevar" | "domicilio" | "local", barrio: Barrio | null): number {
  if (service !== "domicilio") return 0;
  if (!barrio) return 0;
  return barrio.price ?? 0;
}
