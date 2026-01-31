import type { Product, Version, Size } from "../data/products";
import type { Barrio } from "../data/barrios";
import { cop } from "../lib/format";

const SIZE_LABEL: Record<string, string> = { pequeno: "Pequeño", mediano: "Mediano", grande: "Grande" };
const VERSION_LABEL: Record<Version, string> = { ahogada: "Ahogada", picosa: "Picosa" };

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
  const serviceLabel = service === "domicilio" ? "Domicilio" : service === "llevar" ? "Para llevar" : "En el local";

  return (
    <aside className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="font-black text-lg">Tu pedido</div>

      <div className="mt-3 text-sm space-y-2">
        <div className="flex justify-between gap-3">
          <span className="text-neutral-400">Producto</span>
          <span className="font-bold text-right">{product ? product.name : "—"}</span>
        </div>

        {product?.category === "gomitas" ? (
          <>
            <div className="flex justify-between gap-3">
              <span className="text-neutral-400">Versión</span>
              <span className="font-bold">{version ? VERSION_LABEL[version] : "—"}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-neutral-400">Tamaño</span>
              <span className="font-bold">{size ? SIZE_LABEL[size] : "—"}</span>
            </div>
            <div>
              <div className="text-neutral-400">Toppings incluidos</div>
              <div className="font-bold">{toppingsNames.length ? toppingsNames.join(", ") : "—"}</div>
            </div>
          </>
        ) : (
          <div className="flex justify-between gap-3">
            <span className="text-neutral-400">Tamaño</span>
            <span className="font-bold">{size ? SIZE_LABEL[size] : (product ? ("fijo" in product.prices ? "Fijo" : "—") : "—")}</span>
          </div>
        )}

        <div>
          <div className="text-neutral-400">Extras</div>
          <div className="font-bold">{extrasLine || "—"}</div>
        </div>

        <div className="flex justify-between gap-3">
          <span className="text-neutral-400">Servicio</span>
          <span className="font-bold">{serviceLabel}</span>
        </div>

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
