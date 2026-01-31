import type { Product, Size } from "../data/products";
import { PRODUCTS } from "../data/products";
import { cop } from "../lib/format";

type Props = {
  embedded?: boolean;
  showHeader?: boolean;

  selectedProductIds: string[];
  onToggleProduct: (p: Product) => void;

  actionLabel?: string; // “Agregar”
};

type TabValue = "todos" | "gomitas" | "frutafresh";

function getGomitasMinByVersion(product: Product): { ahogada: number | null; picosa: number | null } {
  if (product.category !== "gomitas") return { ahogada: null, picosa: null };

  const ahogadaVals = Object.values(product.prices.ahogada).filter(
    (v): v is number => typeof v === "number" && v > 0,
  );
  const picosaVals = Object.values(product.prices.picosa).filter(
    (v): v is number => typeof v === "number" && v > 0,
  );

  return {
    ahogada: ahogadaVals.length ? Math.min(...ahogadaVals) : null,
    picosa: picosaVals.length ? Math.min(...picosaVals) : null,
  };
}

function getFrutaFreshPrices(product: Product): {
  fijo: number | null;
  pequeno: number | null;
  mediano: number | null;
} {
  if (product.category !== "frutafresh") return { fijo: null, pequeno: null, mediano: null };

  const prices: any = product.prices;

  if ("fijo" in prices && typeof prices.fijo === "number" && prices.fijo > 0) {
    return { fijo: prices.fijo, pequeno: null, mediano: null };
  }

  const porSize = prices.porSize as Partial<Record<Size, number>> | undefined;
  const pequeno = typeof porSize?.pequeno === "number" && porSize.pequeno > 0 ? porSize.pequeno : null;
  const mediano = typeof porSize?.mediano === "number" && porSize.mediano > 0 ? porSize.mediano : null;

  return { fijo: null, pequeno, mediano };
}

function priceLine(p: Product) {
  if (p.category === "gomitas") {
    const gv = getGomitasMinByVersion(p);
    const parts: string[] = [];
    if (gv.ahogada != null) parts.push(`Ahogada desde ${cop(gv.ahogada)}`);
    if (gv.picosa != null) parts.push(`Picosa desde ${cop(gv.picosa)}`);
    return parts.length ? parts.join(" • ") : "Precio por confirmar";
  }

  const ff = getFrutaFreshPrices(p);
  if (ff.fijo != null) return `Precio ${cop(ff.fijo)}`;
  const parts: string[] = [];
  if (ff.pequeno != null) parts.push(`Pequeño ${cop(ff.pequeno)}`);
  if (ff.mediano != null) parts.push(`Mediano ${cop(ff.mediano)}`);
  return parts.length ? parts.join(" • ") : "Precio por confirmar";
}

export default function Catalogo({
  embedded = false,
  showHeader = true,
  selectedProductIds,
  onToggleProduct,
  actionLabel = "Agregar",
}: Props) {
  const isSelected = (id: string) => selectedProductIds.includes(id);

  // si luego quieres tabs, ya tienes el type TabValue
  const list = PRODUCTS;

  return (
    <div className={embedded ? "bg-neutral-950 text-white" : "bg-neutral-950 text-white pt-24 lg:pt-28"}>
      <div className={embedded ? "" : "px-4 pb-16"}>
        {showHeader ? (
          <div className="mx-auto max-w-6xl pt-8 pb-6">
            <div className="text-xs uppercase tracking-[0.35em] text-white/50">Catálogo</div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black">Elige tus productos</h1>
            <p className="mt-1 text-sm text-white/55">Selecciona uno o varios para armar tu pedido.</p>
          </div>
        ) : null}

        {/* LISTA 1 COLUMNA */}
        <div className="mx-auto max-w-6xl border-t border-white/10 divide-y divide-white/10">
          {list.map((p) => {
            const active = isSelected(p.id);

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onToggleProduct(p)}
                className={[
                  "w-full text-left group transition",
                  "py-4 sm:py-5",
                  active ? "bg-white/[0.03]" : "hover:bg-white/[0.02]",
                ].join(" ")}
              >
                <div className="flex gap-4">
                  {/* Imagen MÁS grande */}
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 shrink-0 overflow-hidden rounded-2xl bg-white/5">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-xs text-white/40">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-base sm:text-lg font-black leading-snug line-clamp-2">
                          {p.name}
                        </div>

                        <div className="mt-1 text-xs text-white/55">
                          {p.category === "gomitas"
                            ? "Gomitas • Ahogada o Picosa • Incluye toppings"
                            : "FrutaFresh • Incluye hasta 2 toppings"}
                        </div>
                      </div>

                      <span
                        className={[
                          "shrink-0 text-[10px] uppercase tracking-[0.22em] px-2 py-1 rounded-md border",
                          active
                            ? "text-white font-black bg-white/10 border-white/20"
                            : "text-white/60 bg-white/5 border-white/10 group-hover:text-white",
                        ].join(" ")}
                      >
                        {active ? "Quitar" : actionLabel}
                      </span>
                    </div>

                    {/* Descripción */}
                    {"description" in p && (p as any).description ? (
                      <div className="mt-2 text-sm text-white/70 leading-relaxed line-clamp-2 sm:line-clamp-3">
                        {(p as any).description}
                      </div>
                    ) : null}

                    {/* Precios */}
                    <div className="mt-2 text-sm font-black text-white/85">
                      {priceLine(p)}
                    </div>

                    {/* Acento rojo suave */}
                    <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-red-600/25 to-transparent" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
