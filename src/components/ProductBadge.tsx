import "./ProductBadge.css";

type Props = {
  badge?: string;
  variant?: "default" | "purchase";
};

export default function ProductBadge({ badge, variant = "default" }: Props) {
  if (!badge) return null;

  const isNew = badge === "Nuevo";

  return (
    <span className={`product-badge product-badge--${variant} product-badge--${isNew ? "new" : "popular"}`}>
      {!isNew && <span className="product-badge__star" aria-hidden="true">★</span>}
      <span>{isNew && variant === "purchase" ? "¡Nuevo!" : badge}</span>
    </span>
  );
}
