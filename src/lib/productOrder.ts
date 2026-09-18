type CreationDate = Date | { toMillis(): number } | null;

export function newestProductsFirst<T extends { createdAt?: CreationDate }>(products: T[]): T[] {
  const createdMillis = (product: T) => {
    const value = product.createdAt;
    const millis = value instanceof Date ? value.getTime() : value?.toMillis() ?? 0;
    return Number.isFinite(millis) ? millis : 0;
  };

  // Keep legacy products without a date visible, after dated products.
  return [...products].sort((a, b) => createdMillis(b) - createdMillis(a));
}
