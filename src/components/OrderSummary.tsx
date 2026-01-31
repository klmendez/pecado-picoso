import type { Product, Version, Size } from "../data/products";
import type { Barrio } from "../data/barrios";
import { cop } from "../lib/format";

const SIZE_LABEL: Record<string, string> = {
  pequeno: "Pequeño",
  mediano: "Mediano",
  grande: "Grande",
};

const VERSION_LABEL: Record<Version, string> = {
  ahogada: "Ahogada",
  picosa: "Picosa",
};

export default function OrderSummary({
  product,
  version,
  size,
  toppingsNames,
  extrasLine,
  service,
  barrio,
  address,
  subtotal,
  delivery,
  total,
}: {
  product: Product | null;
  version: Version | null;
  size: Size | null;
  toppingsNames: string[];
  extrasLine: string;
  service: "llevar" | "domicilio" | "local";
  barrio: Barrio | null;
  address: string;
  subtotal: number;
  delivery: number;
  total: number;
}) {
  const serviceLabel =
    service === "domicilio"
      ? "Domicilio"
      : service === "llevar"
      ? "Para llevar"
      : "En el local";

  // ✅ Regla unificada: si el producto define toppingsIncludedMax, entonces muestra toppings
  const maxToppings = product?.toppingsIncludedMax ?? 0;
  const hasToppings = maxToppings > 0;

  // ✅ Versión solo para gomitas
  const showVersion = product?.category === "gomitas";

  // ✅ Mostrar tamaño:
  // - gomitas: depende de Size seleccionado
  // - frutafresh: si es fijo -> "Fijo", si no -> Size seleccionado
  const sizeLabel = (() => {
    if (!product) return "—";

    // si hay size seleccionado, lo mostramos
    if (size) return SIZE_LABEL[size];

    // frutafresh fijo
    if (product.category === "frutafresh") {
      return "fijo" in product.prices && typeof product.prices.fijo === "number" ? "Fijo" : "—";
    }

    // gomitas sin size (raro, pero por seguridad)
    return "—";
  })();

  return (
    <aside className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="font-black text-lg">Tu pedido</div>

      <div className="mt-3 text-sm space-y-2">
        {/* Producto */}
        <div className="flex justify-between gap-3">
          <span className="text-neutral-400">Producto</span>
          <span className="font-bold text-right">{product ? product.name : "—"}</span>
        </div>

        {/* Versión (solo gomitas) */}
        {showVersion ? (
          <div className="flex justify-between gap-3">
            <span className="text-neutral-400">Versión</span>
            <span className="font-bold">{version ? VERSION_LABEL[version] : "—"}</span>
          </div>
        ) : null}

        {/* Tamaño */}
        <div className="flex justify-between gap-3">
          <span className="text-neutral-400">Tamaño</span>
          <span className="font-bold">{sizeLabel}</span>
        </div>

        {/* Toppings (gomitas + frutafresh si max>0) */}
        {hasToppings ? (
          <div>
            <div className="text-neutral-400">Toppings incluidos (máx. {maxToppings})</div>
            <div className="font-bold">{toppingsNames.length ? toppingsNames.join(", ") : "—"}</div>
          </div>
        ) : null}

        {/* Extras */}
        <div>
          <div className="text-neutral-400">Extras</div>
          <div className="font-bold">{extrasLine || "—"}</div>
        </div>

        {/* Servicio */}
        <div className="flex justify-between gap-3">
          <span className="text-neutral-400">Servicio</span>
          <span className="font-bold">{serviceLabel}</span>
        </div>

        {/* Domicilio */}
        {service === "domicilio" ? (
          <>
            <div className="flex justify-between gap-3">
              <span className="text-neutral-400">Barrio</span>
              <span className="font-bold">{barrio?.name ?? "—"}</span>
            </div>
            <div>
              <div className="text-neutral-400">Dirección</div>
              <div className="font-bold">{address || "—"}</div>
            </div>
          </>
        ) : null}

        <hr className="border-neutral-800" />

        {/* Totales */}
        <div className="flex justify-between gap-3">
          <span className="text-neutral-400">Subtotal</span>
          <span className="font-bold">{cop(subtotal)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-neutral-400">Entrega</span>
          <span className="font-bold">{cop(delivery)}</span>
        </div>
        <div className="flex justify-between gap-3 text-base">
          <span className="font-black">Total</span>
          <span className="font-black">{cop(total)}</span>
        </div>
      </div>
    </aside>
  );
}
