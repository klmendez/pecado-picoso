import type { Barrio } from "../data/barrios";
import { BARRIOS } from "../data/barrios";
import type { Size, Version } from "../data/products";
import type { OrderItem, PaymentMethod } from "../lib/whatsapp";
import { TOPPINGS } from "../data/toppings";
import { EXTRAS } from "../data/extras";
import { cop } from "../lib/format";
import { isFixedPrice } from "../data/products";

type Props = {
  items: OrderItem[];
  updateQty: (productId: string, qty: number) => void;
  updateItem: (productId: string, patch: Partial<OrderItem>) => void;

  // servicio/domicilio
  service: "llevar" | "domicilio" | "local";
  setService: (v: "llevar" | "domicilio" | "local") => void;
  barrio: Barrio | null;
  setBarrio: (b: Barrio | null) => void;
  address: string;
  setAddress: (v: string) => void;
  reference: string;
  setReference: (v: string) => void;

  // pago/comentarios
  paymentMethod: PaymentMethod;
  setPaymentMethod: (v: PaymentMethod) => void;
  comments: string;
  setComments: (v: string) => void;

  // cliente
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;

  // total
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

function getAvailableSizes(it: OrderItem): Size[] {
  const p = it.product;
  if (p.category === "gomitas") return p.sizes;
  if (isFixedPrice(p.prices)) return p.sizes ?? [];
  const entries = Object.entries(p.prices.porSize ?? {}) as Array<[Size, number | undefined]>;
  return entries.filter(([, v]) => typeof v === "number" && v > 0).map(([s]) => s);
}

function maxToppingsFor(it: OrderItem): number {
  if (it.product.category !== "gomitas") return 0;
  return Math.max(0, it.product.toppingsIncludedMax ?? 0);
}

export default function OrderFormMulti({
  items,
  updateQty,
  updateItem,

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

  name,
  setName,
  phone,
  setPhone,

  total,
  canSend,
  onSend,
  nequiPhone,
}: Props) {
  return (
    <div className="flex-1 space-y-6">
      <section>
        <h2 className="text-3xl font-black">2) Configura tus productos</h2>
        <p className="text-white/60 mt-2">Ajusta cantidad, referencia/toppings (si es gomitas), tamaño y extras.</p>
      </section>

      {/* Items */}
      <section className="space-y-4">
        {items.map((it) => {
          const p = it.product;
          const sizesAvailable = getAvailableSizes(it);
          const maxT = maxToppingsFor(it);

          return (
            <div key={p.id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm uppercase tracking-[0.28em] text-white/50">Producto</div>
                  <div className="text-xl font-black">{p.name}</div>
                  <div className="text-sm text-white/60">{p.category === "gomitas" ? "Gomitas" : "FrutaFresh"}</div>
                </div>

                {/* Qty */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-9 w-9 rounded-xl border border-neutral-800 bg-neutral-950/30 hover:bg-white/5"
                    onClick={() => updateQty(p.id, Math.max(0, it.qty - 1))}
                    aria-label="Disminuir cantidad"
                  >
                    −
                  </button>
                  <div className="w-10 text-center font-black">{it.qty}</div>
                  <button
                    type="button"
                    className="h-9 w-9 rounded-xl border border-neutral-800 bg-neutral-950/30 hover:bg-white/5"
                    onClick={() => updateQty(p.id, it.qty + 1)}
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Versión + Toppings (solo gomitas) */}
              {p.category === "gomitas" ? (
                <div className="space-y-3">
                  <div className="font-black">Referencia</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateItem(p.id, { version: "ahogada" as Version })}
                      className={[
                        "rounded-2xl border px-4 py-3 text-left",
                        it.version === "ahogada" ? "border-white/30 bg-white/10" : "border-neutral-800 bg-neutral-950/20 hover:bg-white/5",
                      ].join(" ")}
                    >
                      <div className="font-black">Ahogada</div>
                      <div className="text-sm text-white/60">Más chamoy, más jugosita</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateItem(p.id, { version: "picosa" as Version })}
                      className={[
                        "rounded-2xl border px-4 py-3 text-left",
                        it.version === "picosa" ? "border-white/30 bg-white/10" : "border-neutral-800 bg-neutral-950/20 hover:bg-white/5",
                      ].join(" ")}
                    >
                      <div className="font-black">Picosa</div>
                      <div className="text-sm text-white/60">Más chilito, más intensa</div>
                    </button>
                  </div>

                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-black">Toppings incluidos</div>
                      <div className="text-sm text-white/60">
                        {it.toppingIds.length} / {maxT}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2">
                      {TOPPINGS.map((t) => {
                        const active = it.toppingIds.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              updateItem(p.id, {
                                toppingIds: (() => {
                                  const prev = it.toppingIds;
                                  if (prev.includes(t.id)) return prev.filter((x) => x !== t.id);
                                  if (maxT > 0 && prev.length >= maxT) return prev;
                                  return [...prev, t.id];
                                })(),
                              });
                            }}
                            className={[
                              "rounded-2xl border px-4 py-3 text-left",
                              active ? "border-white/30 bg-white/10" : "border-neutral-800 bg-neutral-950/20 hover:bg-white/5",
                            ].join(" ")}
                          >
                            <div className="font-bold">{t.name}</div>
                            <div className="text-xs text-white/50">Incluido</div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-xs text-white/50">*Mínimo 1 topping en gomitas*</div>
                  </div>
                </div>
              ) : null}

              {/* Tamaño (si aplica) */}
              <div className="space-y-2">
                <div className="font-black">Tamaño</div>
                {sizesAvailable.length ? (
                  <div className="flex flex-wrap gap-2">
                    {sizesAvailable.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateItem(p.id, { size: s })}
                        className={[
                          "rounded-2xl border px-4 py-2 font-bold",
                          it.size === s ? "border-white/30 bg-white/10" : "border-neutral-800 bg-neutral-950/20 hover:bg-white/5",
                        ].join(" ")}
                      >
                        {sizeLabel(s)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-white/60">Este producto no requiere tamaño.</div>
                )}
              </div>

              {/* Extras */}
              <div className="space-y-2">
                <div className="font-black">Extras (con valor)</div>
                <div className="space-y-2">
                  {EXTRAS.map((e) => {
                    const qty = it.extrasQty[e.id] ?? 0;
                    return (
                      <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 p-3">
                        <div>
                          <div className="font-bold">{e.name}</div>
                          <div className="text-sm text-white/60">{cop(e.price)}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="h-9 w-9 rounded-xl border border-neutral-800 bg-neutral-950/30 hover:bg-white/5"
                            onClick={() =>
                              updateItem(p.id, {
                                extrasQty: { ...it.extrasQty, [e.id]: Math.max(0, qty - 1) },
                              })
                            }
                            aria-label={`Quitar ${e.name}`}
                          >
                            −
                          </button>
                          <div className="w-10 text-center font-black">{qty}</div>
                          <button
                            type="button"
                            className="h-9 w-9 rounded-xl border border-neutral-800 bg-neutral-950/30 hover:bg-white/5"
                            onClick={() =>
                              updateItem(p.id, {
                                extrasQty: { ...it.extrasQty, [e.id]: qty + 1 },
                              })
                            }
                            aria-label={`Agregar ${e.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-white/50">*Los extras sí suman al total.*</div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Datos cliente */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-bold text-white/80">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Tu nombre" />
        </div>
        <div>
          <label className="text-sm font-bold text-white/80">Teléfono</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+57 3xx xxx xxxx" />
        </div>
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
            <div className="text-sm text-white/60">Envío según barrio</div>
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
            <div className="text-sm text-white/60">Recoge tu pedido</div>
          </button>

          <button
            type="button"
            className="rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-left opacity-50 cursor-not-allowed"
            disabled
            title="Próximamente"
          >
            <div className="font-black">En el local</div>
            <div className="text-sm text-white/60">Próximamente</div>
          </button>
        </div>
      </section>

      {/* Domicilio */}
      {service === "domicilio" ? (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 space-y-3">
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
            <label className="text-sm font-bold text-white/80">Dirección</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="Ej: Cra 7 # 12-34" />
          </div>

          <div>
            <label className="text-sm font-bold text-white/80">Referencia (opcional)</label>
            <input value={reference} onChange={(e) => setReference(e.target.value)} className={inputClass} placeholder="Ej: Portón negro..." />
          </div>

          <div className="text-xs text-white/50">*Precios sujetos a Domipop según barrio.*</div>
        </section>
      ) : null}

      {/* Pago */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 space-y-3">
        <div className="font-black">Pago</div>

        <div className="text-sm text-white/80">
          Nequi / Llave: <span className="font-black">{nequiPhone}</span>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-sm font-bold text-white/80">Modalidad:</label>
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
          <label className="text-sm font-bold text-white/80">Comentarios (opcional)</label>
          <textarea value={comments} onChange={(e) => setComments(e.target.value)} className={inputClass} rows={3} />
        </div>
      </section>

      {/* CTA Mobile */}
      <section className="lg:hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/60">Total</div>
            <div className="text-2xl font-black">{cop(total)}</div>
          </div>

          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className={[
              "rounded-xl px-4 py-3 font-black",
              canSend ? "bg-white text-neutral-950 hover:opacity-90" : "bg-neutral-800 text-white/40 cursor-not-allowed",
            ].join(" ")}
          >
            Enviar WhatsApp
          </button>
        </div>

        {!canSend ? (
          <div className="mt-2 text-xs text-white/60">
            Completa productos, datos, domicilio (si aplica) y configura gomitas (referencia + topping).
          </div>
        ) : null}
      </section>
    </div>
  );
}
