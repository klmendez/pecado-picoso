import { useMemo } from "react";
import type { Barrio } from "../data/barrios";
import { BARRIOS } from "../data/barrios";
import { PRODUCTS, type Product, type Size, type Version } from "../data/products";
import { TOPPINGS } from "../data/toppings";
import { EXTRAS } from "../data/extras";
import { cop } from "../lib/format";
import type { PaymentMethod } from "../lib/whatsapp";

type Props = {
  name: string;
  phone: string;
  setName: (v: string) => void;
  setPhone: (v: string) => void;

  product: Product | null;
  setProduct: (p: Product | null) => void;

  version: Version | null;
  setVersion: (v: Version | null) => void;

  size: Size | null;
  setSize: (v: Size | null) => void;

  sizesAvailable: Size[];
  isGomitas: boolean;
  maxToppings: number;

  toppings: string[];
  toggleTopping: (id: string) => void;

  extrasQty: Record<string, number>;
  setExtraQty: (id: string, qty: number) => void;

  service: "llevar" | "domicilio" | "local";
  setService: (v: "llevar" | "domicilio" | "local") => void;

  barrio: Barrio | null;
  setBarrio: (b: Barrio | null) => void;

  address: string;
  setAddress: (v: string) => void;

  reference: string;
  setReference: (v: string) => void;

  paymentMethod: PaymentMethod;
  setPaymentMethod: (v: PaymentMethod) => void;

  comments: string;
  setComments: (v: string) => void;

  total: number;
  canSend: boolean;
  onSend: () => void;

  nequiPhone: string;
};

const inputClass =
  "mt-1 w-full rounded-xl bg-neutral-950/40 border border-neutral-800 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20";

function sizeLabel(size: Size) {
  return size === "pequeno" ? "Pequeño" : size === "mediano" ? "Mediano" : "Grande";
}

export default function OrderForm({
  name,
  phone,
  setName,
  setPhone,
  product,
  setProduct,
  version,
  setVersion,
  size,
  setSize,
  sizesAvailable,
  isGomitas,
  maxToppings,
  toppings,
  toggleTopping,
  extrasQty,
  setExtraQty,
  service,
  setService,
  barrio,
  setBarrio,
  address,
  setAddress,
  reference,
  setReference,
  paymentMethod,
  setPaymentMethod,
  comments,
  setComments,
  total,
  canSend,
  onSend,
  nequiPhone,
}: Props) {
  const toppingsInfo = useMemo(() => {
    if (!product) return "";
    if (product.category === "gomitas") return `Incluye de 1 a ${maxToppings} toppings.`;
    return `FrutaFresh: sin toppings incluidos. Extras con valor.`;
  }, [product, maxToppings]);

  return (
    <div className="flex-1 space-y-6">
      {/* Intro */}
      <section>
        <h2 className="text-3xl font-black">Arma tu pedido</h2>
        <p className="text-neutral-400 mt-2">
          Toppings incluidos en <span className="font-bold">Gomitas</span>. Extras con valor para todos.
        </p>
      </section>

      {/* Cliente */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-bold text-neutral-200">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Tu nombre" />
        </div>
        <div>
          <label className="text-sm font-bold text-neutral-200">Teléfono</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            placeholder="+57 3xx xxx xxxx"
          />
        </div>
      </section>

      {/* Producto */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 space-y-3">
        <div className="font-black">Producto</div>

        <select
          value={product?.id ?? ""}
          onChange={(e) => setProduct(PRODUCTS.find((p) => p.id === e.target.value) ?? null)}
          className={inputClass}
        >
          <option value="" disabled>
            Selecciona un producto…
          </option>
          <optgroup label="Gomitas">
            {PRODUCTS.filter((p) => p.category === "gomitas").map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="FrutaFresh">
            {PRODUCTS.filter((p) => p.category === "frutafresh").map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </optgroup>
        </select>

        {product ? <div className="text-sm text-neutral-400">{toppingsInfo}</div> : null}
      </section>

      {/* Versión */}
      {isGomitas ? (
        <section className="space-y-2">
          <div className="font-black">Versión</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setVersion("ahogada")}
              className={[
                "rounded-2xl border px-4 py-3 text-left",
                version === "ahogada"
                  ? "border-white/30 bg-white/10"
                  : "border-neutral-800 bg-neutral-900 hover:bg-white/5",
              ].join(" ")}
            >
              <div className="font-black">Ahogada</div>
              <div className="text-sm text-neutral-400">Más chamoy, más jugosita</div>
            </button>

            <button
              type="button"
              onClick={() => setVersion("picosa")}
              className={[
                "rounded-2xl border px-4 py-3 text-left",
                version === "picosa"
                  ? "border-white/30 bg-white/10"
                  : "border-neutral-800 bg-neutral-900 hover:bg-white/5",
              ].join(" ")}
            >
              <div className="font-black">Picosa</div>
              <div className="text-sm text-neutral-400">Más chilito, más intensa</div>
            </button>
          </div>
        </section>
      ) : null}

      {/* Tamaño */}
      {product ? (
        <section className="space-y-2">
          <div className="font-black">Tamaño</div>

          {sizesAvailable.length ? (
            <div className="flex flex-wrap gap-2">
              {sizesAvailable.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={[
                    "rounded-2xl border px-4 py-2 font-bold",
                    size === s ? "border-white/30 bg-white/10" : "border-neutral-800 bg-neutral-900 hover:bg-white/5",
                  ].join(" ")}
                >
                  {sizeLabel(s)}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-neutral-400">Este producto no requiere tamaño.</div>
          )}
        </section>
      ) : null}

      {/* Toppings */}
      {isGomitas && product ? (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-black">Toppings incluidos</div>
            <div className="text-sm text-neutral-400">
              {toppings.length} / {maxToppings}
            </div>
          </div>

          <div className="text-sm text-neutral-400">Elige entre 1 y {maxToppings} toppings</div>

          <div className="grid sm:grid-cols-2 gap-2">
            {TOPPINGS.map((t) => {
              const active = toppings.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTopping(t.id)}
                  className={[
                    "rounded-2xl border px-4 py-3 text-left",
                    active ? "border-white/30 bg-white/10" : "border-neutral-800 bg-neutral-950/20 hover:bg-white/5",
                  ].join(" ")}
                >
                  <div className="font-bold">{t.name}</div>
                  <div className="text-xs text-neutral-500">Incluido (solo Gomitas)</div>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-neutral-500">
            *Incluidos solo en Gomitas. No suman valor. (Mínimo 1 topping)*
          </div>
        </section>
      ) : null}

      {/* Extras */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 space-y-3">
        <div className="font-black">Extras (con valor)</div>

        <div className="space-y-2">
          {EXTRAS.map((e) => {
            const qty = extrasQty[e.id] ?? 0;
            return (
              <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 p-3">
                <div>
                  <div className="font-bold">{e.name}</div>
                  <div className="text-sm text-neutral-400">{cop(e.price)}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-9 w-9 rounded-xl border border-neutral-800 bg-neutral-950/30 hover:bg-white/5"
                    onClick={() => setExtraQty(e.id, Math.max(0, qty - 1))}
                  >
                    −
                  </button>
                  <div className="w-10 text-center font-black">{qty}</div>
                  <button
                    type="button"
                    className="h-9 w-9 rounded-xl border border-neutral-800 bg-neutral-950/30 hover:bg-white/5"
                    onClick={() => setExtraQty(e.id, qty + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-neutral-500">*Los extras sí suman al total.*</div>
      </section>

      {/* Servicio */}
      <section className="space-y-2">
        <div className="font-black">Tipo de servicio</div>

        <div className="grid sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setService("domicilio")}
            className={[
              "rounded-2xl border px-4 py-3 text-left",
              service === "domicilio" ? "border-white/30 bg-white/10" : "border-neutral-800 bg-neutral-900 hover:bg-white/5",
            ].join(" ")}
          >
            <div className="font-black">A domicilio</div>
            <div className="text-sm text-neutral-400">Envío según barrio</div>
          </button>

          <button
            type="button"
            onClick={() => setService("llevar")}
            className={[
              "rounded-2xl border px-4 py-3 text-left",
              service === "llevar" ? "border-white/30 bg-white/10" : "border-neutral-800 bg-neutral-900 hover:bg-white/5",
            ].join(" ")}
          >
            <div className="font-black">Para llevar</div>
            <div className="text-sm text-neutral-400">Recoge tu pedido</div>
          </button>

          <button
            type="button"
            onClick={() => setService("local")}
            className="rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-left opacity-50 cursor-not-allowed"
            disabled
            title="Próximamente"
          >
            <div className="font-black">En el local</div>
            <div className="text-sm text-neutral-400">Próximamente</div>
          </button>
        </div>
      </section>

      {/* Domicilio */}
      {service === "domicilio" ? (
        <section className="space-y-3">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 space-y-3">
            <div className="font-black">Barrio</div>
            <select
              value={barrio?.id ?? ""}
              onChange={(e) => setBarrio(BARRIOS.find((b) => b.id === e.target.value) ?? null)}
              className={inputClass}
            >
              <option value="" disabled>
                Elige tu barrio…
              </option>
              {BARRIOS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.price == null ? "(Por confirmar)" : `(${cop(b.price)})`}
                </option>
              ))}
            </select>

            <div>
              <label className="text-sm font-bold text-neutral-200">Dirección</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClass}
                placeholder="Ej: Cra 7 # 12-34"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-neutral-200">Referencia (opcional)</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className={inputClass}
                placeholder="Ej: Portón negro, junto a la tienda…"
              />
            </div>

            <div className="text-xs text-neutral-500">*Precios sujetos a Domipop según barrio.*</div>
          </div>
        </section>
      ) : null}

      {/* Pago */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 space-y-3">
        <div className="font-black">Pago</div>

        <div className="text-sm text-neutral-300">
          Nequi / Llave: <span className="font-black">{nequiPhone}</span>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-sm font-bold text-neutral-200">Modalidad de pago:</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="rounded-xl bg-neutral-950/40 border border-neutral-800 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
          >
            <option value="Transferencia">Transferencia</option>
            <option value="Efectivo">Efectivo</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-bold text-neutral-200">Comentarios adicionales (opcional)</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className={inputClass}
            rows={3}
            placeholder="Ej: Sin tajín / bien sellado / etc."
          />
        </div>
      </section>

      {/* CTA Mobile */}
      <section className="lg:hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-neutral-400">Total</div>
            <div className="text-2xl font-black">{cop(total)}</div>
          </div>

          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className={[
              "rounded-xl px-4 py-3 font-black",
              canSend ? "bg-white text-neutral-950 hover:opacity-90" : "bg-neutral-800 text-neutral-400 cursor-not-allowed",
            ].join(" ")}
          >
            Enviar WhatsApp
          </button>
        </div>

        {!canSend ? (
          <div className="mt-2 text-xs text-neutral-400">
            Completa producto, datos, servicio y mínimo 1 topping (si es gomitas) para enviar.
          </div>
        ) : null}
      </section>
    </div>
  );
}
