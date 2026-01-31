import type { Product, Size } from "../data/products";
import { PRODUCTS } from "../data/products";
import { cop } from "../lib/format";

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

type Props = {
  selectedIds: string[];
  onToggle: (p: Product) => void;
  filter: TabValue;
};

export default function CatalogoCompacto({ selectedIds, onToggle, filter }: Props) {
  const isSelected = (id: string) => selectedIds.includes(id);

  const list = PRODUCTS.filter((p) => {
    if (filter === "todos") return true;
    return p.category === filter;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {list.map((p) => {
        const active = isSelected(p.id);

        const gv = p.category === "gomitas" ? getGomitasMinByVersion(p) : null;
        const ff = p.category === "frutafresh" ? getFrutaFreshPrices(p) : null;

        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onToggle(p)}
            className={[
              "group text-left transition",
              "border-b border-white/10 pb-3",
              active ? "opacity-100" : "opacity-90 hover:opacity-100",
            ].join(" ")}
          >
            <div className="flex gap-3">
              {/* Imagen */}
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden bg-white/5">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-[10px] text-white/40">Sin imagen</div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {/* Mobile: 2 líneas. Desktop: 1 línea */}
                    <div className="text-sm font-black text-white leading-snug line-clamp-2 sm:line-clamp-1">
                      {p.name}
                    </div>

                    <div className="mt-0.5 text-[11px] text-white/55">
                      {p.category === "gomitas" ? (
                        <>
                          Gomitas
                          {gv?.ahogada != null ? ` • Ahogada ${cop(gv.ahogada)}` : ""}
                          {gv?.picosa != null ? ` • Picosa ${cop(gv.picosa)}` : ""}
                        </>
                      ) : (
                        <>
                          FrutaFresh
                          {ff?.fijo != null ? ` • ${cop(ff.fijo)}` : ""}
                          {ff?.fijo == null && ff?.pequeno != null ? ` • Pequeño ${cop(ff.pequeno)}` : ""}
                          {ff?.fijo == null && ff?.mediano != null ? ` • Mediano ${cop(ff.mediano)}` : ""}
                        </>
                      )}
                    </div>
                  </div>

                  <span
                    className={[
                      "shrink-0 text-[10px] uppercase tracking-[0.22em] px-2 py-1",
                      active ? "text-white font-black" : "text-white/55",
                    ].join(" ")}
                  >
                    {active ? "Quitar" : "Agregar"}
                  </span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
