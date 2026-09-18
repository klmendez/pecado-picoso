import "./ProductImage.css";

type Props = {
  src: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
};

/** Renders product URLs in their original orientation. */
export default function ProductImage({ src, alt, className = "", loading = "lazy" }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      className={`product-image-foreground ${className}`}
      loading={loading}
    />
  );
}
