import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { Product, Size, Version } from "../../data/products";
import { useStoreProducts } from "../../hooks/useStoreProducts";
import { cop } from "../../lib/format";

const SLIDE_INTERVAL_MS = 6000;

type SlideProduct = Product & {
  priceLabel: string;
  highlightLine: string | null;
  extraInfo: string | null;
};

function getGomitasPrices(product: Product & { category: "gomitas" }) {
  const versions = Object.keys(product.prices) as Version[];
  const result: Partial<Record<Version, number | null>> = {};

  versions.forEach((version) => {
    const sizePrices = product.prices[version];
    const values = Object.values(sizePrices).filter((value): value is number => typeof value === "number" && value > 0);
    result[version] = values.length ? Math.min(...values) : null;
  });

  return result;
}

function getFrutaFreshPrices(product: Product & { category: "frutafresh" }) {
  const prices = product.prices;
  if ("fijo" in prices && typeof prices.fijo === "number" && prices.fijo > 0) {
    return { fijo: prices.fijo, pequeno: null, mediano: null };
  }

  const porSize = prices.porSize ?? {};
  const pick = (size: Size) => {
    const value = porSize?.[size];
    return typeof value === "number" && value > 0 ? value : null;
  };

  return {
    fijo: null,
    pequeno: pick("pequeno"),
    mediano: pick("mediano"),
  };
}

function buildPriceLabel(product: Product): { price: string; highlight: string | null; extra: string | null } {
  if (product.category === "gomitas") {
    const base = getGomitasPrices(product);
    const parts: string[] = [];
    if (base.ahogada != null) parts.push(`Ahogada desde ${cop(base.ahogada)}`);
    if (base.picosa != null) parts.push(`Picosa desde ${cop(base.picosa)}`);
    return {
      price: parts.length ? parts.join(" • ") : "Precio por confirmar",
      highlight: "Ahogadas o picosas, tú decides",
      extra:
        product.toppingsIncludedMax && product.toppingsIncludedMax > 0
          ? `Incluye hasta ${product.toppingsIncludedMax} toppings`
          : null,
    };
  }

  const ff = getFrutaFreshPrices(product);
  if (ff.fijo != null) {
    return { price: `Precio ${cop(ff.fijo)}`, highlight: "Fruta fresca con chamoy artesanal", extra: null };
  }

  const parts: string[] = [];
  if (ff.pequeno != null) parts.push(`Pequeño ${cop(ff.pequeno)}`);
  if (ff.mediano != null) parts.push(`Mediano ${cop(ff.mediano)}`);
  return {
    price: parts.length ? parts.join(" • ") : "Precio por confirmar",
    highlight: "Refrescante, ácido y picoso",
    extra:
      product.toppingsIncludedMax && product.toppingsIncludedMax > 0
        ? `Incluye hasta ${product.toppingsIncludedMax} toppings`
        : null,
  };
}

export default function ProductCarousel() {
  const { products: storeProducts } = useStoreProducts();
  const slides = useMemo<SlideProduct[]>(() => {
    return storeProducts.map((product) => {
      const { price, highlight, extra } = buildPriceLabel(product);
      return {
        ...product,
        priceLabel: price,
        highlightLine: highlight,
        extraInfo: extra,
      };
    });
  }, [storeProducts]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const handleSelect = (next: number) => {
    if (next === index) return;
    setIndex(next);
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % slides.length);
  };

  const current = slides[index];

  if (!current) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Cargando productos...
      </div>
    );
  }

  return (
    <div className="relative">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 56 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -56 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col gap-8 lg:flex-row lg:items-center px-1 sm:px-4"
        >
          <div className="flex-1 space-y-3 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-gray-400">
              {current.badge ? <span className="rounded-full border border-gray-300 px-3 py-1 text-[10px] tracking-[0.25em] text-gray-600">{current.badge}</span> : null}
              <span>{current.category === "gomitas" ? "Gomitas" : "FrutaFresh"}</span>
            </div>
            <h3 className="text-xl sm:text-3xl font-black leading-snug text-black">{current.name}</h3>
            <p className="text-[0.9rem] sm:text-sm text-gray-500 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {current.description}
            </p>
            <div className="text-base sm:text-xl font-black text-gray-800">{current.priceLabel}</div>
            {current.highlightLine ? (
              <div className="text-[10px] uppercase tracking-[0.2em] text-red-600">{current.highlightLine}</div>
            ) : null}
            {current.extraInfo ? (
              <div className="text-[11px] text-gray-400">{current.extraInfo}</div>
            ) : null}
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="relative h-48 w-48 sm:h-68 sm:w-68 md:h-80 md:w-80 overflow-hidden rounded-[2.5rem] border border-gray-300 bg-gray-100 shadow-[0_30px_55px_rgba(0,0,0,0.45)]">
              {current.image ? (
                <img
                  src={current.image}
                  alt={current.name}
                  className="h-full w-full object-cover transition-transform duration-[900ms] ease-out"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  Imagen pendiente
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 && (
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-center gap-2">
            {slides.map((product, i) => {
              const active = index === i;
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelect(i)}
                  className={[
                    "h-2 w-6 rounded-full transition-all",
                    active ? "bg-black" : "bg-gray-300 hover:bg-gray-400",
                  ].join(" ")}
                  aria-label={`Ver ${product.name}`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              className="rounded-full border border-gray-300 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 transition hover:border-gray-400 hover:text-black"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-full border border-gray-300 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 transition hover:border-gray-400 hover:text-black"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
