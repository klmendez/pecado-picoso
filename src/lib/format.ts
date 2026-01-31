const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function cop(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return copFormatter.format(Math.max(0, Math.round(value)));
}
