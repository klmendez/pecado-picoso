// src/pages/ArmarPedido.tsx
import { useEffect, useMemo, useState } from "react";
import type { Barrio } from "../data/barrios";
import { BARRIOS } from "../data/barrios";
import type { Product, Size, Version } from "../data/products";
import { isFixedPrice } from "../data/products";
import { TOPPINGS } from "../data/toppings";
import { EXTRAS } from "../data/extras";
import { cop } from "../lib/format";
import { getBasePrice, extrasTotal, deliveryCost } from "../lib/pricing";
import {
  buildCode,
  buildWhatsAppMessage,
  waLink,
  type PaymentMethod,
  type Service,
  type OrderItem,
} from "../lib/whatsapp";
import { NEQUI_PHONE } from "../data/constants";

import CatalogoCompacto from "../components/CatalogoCompacto";
import CategoryTabs from "../components/CategoryTabs";
import Referencias from "../components/Referencias";

const WHATSAPP_DESTINATION = "573178371144";
type TabValue = "todos" | "gomitas" | "frutafresh";

function getAvailableSizes(product: Product): Size[] {
  if (product.category === "gomitas") return product.sizes;
  if (isFixedPrice(product.prices)) return product.sizes ?? [];
  const entries = Object.entries(product.prices.porSize ?? {}) as Array<[Size, number | undefined]>;
  return entries.filter(([, v]) => typeof v === "number" && v > 0).map(([s]) => s);
}

function defaultSize(product: Product): Size | null {
  const sizes = getAvailableSizes(product);
  return sizes[0] ?? null;
}

function maxToppingsFor(product: Product): number {
  if (product.category !== "gomitas") return 0;
  return Math.max(0, product.toppingsIncludedMax ?? 0);
}

function labelSize(size: Size) {
  return size === "pequeno" ? "Pequeño" : size === "mediano" ? "Mediano" : "Grande";
}

function toppingsNames(ids: string[]) {
  const m = new Map(TOPPINGS.map((t) => [t.id, t.name]));
  return ids.map((id) => m.get(id) ?? id);
}

function extrasLine(extrasQty: Record<string, number>) {
  return EXTRAS.flatMap((e) => {
    const qty = extrasQty[e.id] ?? 0;
    return qty > 0 ? [`${e.name} x${qty}`] : [];
  });
}

export default function ArmarPedido() {
  const [category, setCategory] = useState<TabValue>("todos");

  const [items, setItems] = useState<OrderItem[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState<Service>("llevar");
  const [barrio, setBarrio] = useState<Barrio | null>(null);
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Transferencia");
  const [comments, setComments] = useState("");

  useEffect(() => {
    if (service !== "domicilio") {
      setBarrio(null);
      setAddress("");
      setReference("");
    }
  }, [service]);

  const selectedIds = useMemo(() => items.map((it) => it.product.id), [items]);

  const toggleProduct = (p: Product) => {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.product.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      }
      return [
        ...prev,
        {
          product: p,
          qty: 1,
          version: p.category === "gomitas" ? null : null,
          size: defaultSize(p),
          toppingIds: [],
          extrasQty: {},
        },
      ];
    });
  };

  const updateItem = (productId: string, patch: Partial<OrderItem>) => {
    setItems((prev) => prev.map((it) => (it.product.id === productId ? { ...it, ...patch } : it)));
  };

  const updateQty = (productId: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((it) => (it.product.id === productId ? { ...it, qty } : it))
        .filter((it) => it.qty > 0),
    );
  };

  // ===== precios por item (para resumen completo) =====
  const pricedItems = useMemo(() => {
    return items.map((it) => {
      const baseUnit = getBasePrice(it.product, it.product.category === "gomitas" ? it.version : null, it.size);
      const extrasUnit = extrasTotal(it.extrasQty, EXTRAS);
      const unit = baseUnit + extrasUnit;
      const line = unit * it.qty;
      return { ...it, baseUnit, extrasUnit, unit, line };
    });
  }, [items]);

  const subtotal = useMemo(() => pricedItems.reduce((sum, it) => sum + it.line, 0), [pricedItems]);
  const delivery = useMemo(() => deliveryCost(service, barrio), [service, barrio]);
  const total = subtotal + delivery;

  // ===== validaciones =====
  const itemsOk = items.length > 0;

  const gomitasOk = useMemo(() => {
    for (const it of items) {
      if (it.product.category !== "gomitas") continue;
      if (!it.version) return false;

      const max = maxToppingsFor(it.product);
      if (max > 0) {
        if (it.toppingIds.length < 1) return false;
        if (it.toppingIds.length > max) return false;
      }
    }
    return true;
  }, [items]);

  const deliveryOk = service !== "local" && (service !== "domicilio" || (barrio && address.trim()));

  const canSend = Boolean(itemsOk && gomitasOk && subtotal > 0 && name.trim() && phone.trim() && deliveryOk);

  const handleSend = () => {
    if (!canSend) return;

    const origin = window.location.origin;
    const code = buildCode();

    const message = buildWhatsAppMessage({
      origin,
      code,
      name: name.trim(),
      phone: phone.trim(),
      service,
      barrio,
      address,
      reference,
      items,
      subtotal,
      delivery,
      total,
      toppingsCatalog: TOPPINGS,
      extrasCatalog: EXTRAS,
      paymentMethod,
      comments: comments.trim() || undefined,
    });

    window.open(waLink(WHATSAPP_DESTINATION, message), "_blank");
  };

  return (
    <div className="bg-neutral-950 text-white">
      {/* Header centrado */}
      <header className="px-4 pt-8 pb-4">
        <div className="mx-auto max-w-6xl text-center">
          <div className="text-xs uppercase tracking-[0.35em] text-white/50">Armar pedido</div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black">Elige y envía</h1>
          <div className="mt-1 text-xs text-white/55">{items.length} seleccionados</div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* LEFT */}
          <main className="space-y-10">
            {/* 1) Elegir productos */}
            <section>
              <div>
                <div className="text-sm font-black">1) Elegir productos</div>
                <div className="text-xs text-white/55">Toca para agregar o quitar.</div>
              </div>

              <div className="mt-4">
                <CategoryTabs value={category} onChange={setCategory} />
              </div>

              <div className="mt-4">
                <CatalogoCompacto selectedIds={selectedIds} onToggle={toggleProduct} filter={category} />
              </div>
            </section>

            {/* 2) Ajustar */}
            {items.length ? (
              <section>
                <div>
                  <div className="text-sm font-black">2) Ajustar</div>
                  <div className="text-xs text-white/55">
                    Cantidad, tamaño, (gomitas: referencia y toppings), extras.
                  </div>
                </div>

                <div className="mt-5 space-y-7">
                  {items.map((it) => {
                    const p = it.product;
                    const isGomitas = p.category === "gomitas";
                    const sizes = getAvailableSizes(p);
                    const maxT = maxToppingsFor(p);

                    return (
                      <div key={p.id} className="border-t border-white/10 pt-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-black truncate">{p.name}</div>
                            <div className="text-[11px] text-white/55">{isGomitas ? "Gomitas" : "FrutaFresh"}</div>
                          </div>

                          {/* qty */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="h-8 w-8 border border-white/10 bg-transparent hover:bg-white/[0.04]"
                              onClick={() => updateQty(p.id, Math.max(0, it.qty - 1))}
                            >
                              −
                            </button>
                            <div className="w-8 text-center text-sm font-black">{it.qty}</div>
                            <button
                              type="button"
                              className="h-8 w-8 border border-white/10 bg-transparent hover:bg-white/[0.04]"
                              onClick={() => updateQty(p.id, it.qty + 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* tamaño */}
                        <div className="mt-3">
                          <div className="text-[11px] font-black text-white/70">Tamaño</div>
                          {sizes.length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {sizes.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => updateItem(p.id, { size: s })}
                                  className={[
                                    "border border-white/10 px-3 py-1 text-[11px] font-black",
                                    it.size === s ? "text-white" : "text-white/55 hover:text-white",
                                  ].join(" ")}
                                >
                                  {labelSize(s)}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-1 text-[11px] text-white/45">No aplica.</div>
                          )}
                        </div>

                        {/* gomitas */}
                        {isGomitas ? (
                          <div className="mt-5 space-y-5">
                            <Referencias
                              value={it.version as any}
                              onChange={(v) => updateItem(p.id, { version: v as Version })}
                              small
                              title="Referencia"
                              subtitle="Selecciona una"
                            />

                            <div>
                              <div className="flex items-center justify-between">
                                <div className="text-[11px] font-black text-white/70">Toppings</div>
                                <div className="text-[11px] text-white/55">
                                  {it.toppingIds.length}/{maxT}
                                </div>
                              </div>

                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {TOPPINGS.map((t) => {
                                  const active = it.toppingIds.includes(t.id);
                                  return (
                                    <button
                                      key={t.id}
                                      type="button"
                                      onClick={() => {
                                        const prev = it.toppingIds;
                                        const next = active
                                          ? prev.filter((x) => x !== t.id)
                                          : maxT > 0 && prev.length >= maxT
                                            ? prev
                                            : [...prev, t.id];
                                        updateItem(p.id, { toppingIds: next });
                                      }}
                                      className={[
                                        "border border-white/10 px-3 py-2 text-left text-[11px] font-black",
                                        active ? "text-white" : "text-white/55 hover:text-white",
                                      ].join(" ")}
                                    >
                                      {t.name}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="mt-2 text-[10px] text-white/40">Mínimo 1 topping en gomitas.</div>
                            </div>
                          </div>
                        ) : null}

                        {/* extras */}
                        <div className="mt-5">
                          <div className="text-[11px] font-black text-white/70">Extras</div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {EXTRAS.map((e) => {
                              const qty = it.extrasQty[e.id] ?? 0;
                              return (
                                <div key={e.id} className="border border-white/10 p-2">
                                  <div className="text-[11px] font-black">{e.name}</div>
                                  <div className="text-[10px] text-white/55">{cop(e.price)}</div>

                                  <div className="mt-2 flex items-center gap-2">
                                    <button
                                      type="button"
                                      className="h-7 w-7 border border-white/10 hover:bg-white/[0.04]"
                                      onClick={() =>
                                        updateItem(p.id, {
                                          extrasQty: { ...it.extrasQty, [e.id]: Math.max(0, qty - 1) },
                                        })
                                      }
                                    >
                                      −
                                    </button>
                                    <div className="w-7 text-center text-sm font-black">{qty}</div>
                                    <button
                                      type="button"
                                      className="h-7 w-7 border border-white/10 hover:bg-white/[0.04]"
                                      onClick={() =>
                                        updateItem(p.id, {
                                          extrasQty: { ...it.extrasQty, [e.id]: qty + 1 },
                                        })
                                      }
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!gomitasOk ? (
                  <div className="mt-4 text-xs text-white/60">
                    Falta configurar alguna gomita: referencia y mínimo 1 topping.
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* 3) Datos y envío */}
            <section className="border-t border-white/10 pt-6">
              <div className="text-sm font-black">3) Datos y envío</div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-black text-white/70">Nombre</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-black text-white/70">Teléfono</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="+57 3xx xxx xxxx"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setService("llevar")}
                  className={[
                    "border border-white/10 px-3 py-3 text-left",
                    service === "llevar" ? "text-white" : "text-white/55 hover:text-white",
                  ].join(" ")}
                >
                  <div className="text-xs font-black">Para llevar</div>
                  <div className="text-[11px] text-white/55">Recoges tú</div>
                </button>

                <button
                  type="button"
                  onClick={() => setService("domicilio")}
                  className={[
                    "border border-white/10 px-3 py-3 text-left",
                    service === "domicilio" ? "text-white" : "text-white/55 hover:text-white",
                  ].join(" ")}
                >
                  <div className="text-xs font-black">Domicilio</div>
                  <div className="text-[11px] text-white/55">Según barrio</div>
                </button>
              </div>

              {service === "domicilio" ? (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-[11px] font-black text-white/70">Barrio</label>
                    <select
                      value={barrio?.id ?? ""}
                      onChange={(e) => setBarrio(BARRIOS.find((b) => b.id === e.target.value) ?? null)}
                      className="mt-1 w-full border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
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
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[11px] font-black text-white/70">Dirección</label>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mt-1 w-full border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                      placeholder="Cra 7 # 12-34"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[11px] font-black text-white/70">Referencia</label>
                    <input
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="mt-1 w-full border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                      placeholder="Portón negro…"
                    />
                  </div>
                </div>
              ) : null}

              <div className="mt-5 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black">Pago</div>
                  <div className="text-[11px] text-white/55">
                    Nequi: <span className="font-black text-white/80">{NEQUI_PHONE}</span>
                  </div>
                </div>

                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="mt-2 w-full border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="Transferencia">Transferencia</option>
                  <option value="Efectivo">Efectivo</option>
                </select>

                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="mt-2 w-full border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                  rows={3}
                  placeholder="Comentarios (opcional)"
                />
              </div>

              {/* CTA Mobile */}
              <div className="lg:hidden mt-5">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend}
                  className={[
                    "w-full border border-white/20 py-3 font-black",
                    canSend ? "text-white hover:bg-white/[0.04]" : "text-white/35 cursor-not-allowed",
                  ].join(" ")}
                >
                  Enviar WhatsApp • {cop(total)}
                </button>
                {!canSend ? (
                  <div className="mt-2 text-[11px] text-white/55">
                    Falta: productos, datos, domicilio (si aplica) y gomitas configuradas.
                  </div>
                ) : null}
              </div>
            </section>
          </main>

          {/* RIGHT: Resumen con precios */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="border-b border-white/10 pb-3">
              <div className="text-sm font-black">Resumen</div>
              <div className="text-xs text-white/55">Detalle de precios</div>
            </div>

            <div className="mt-4 space-y-4">
              {pricedItems.length ? (
                pricedItems.map((it) => {
                  const p = it.product;
                  const isGomitas = p.category === "gomitas";
                  const tops = isGomitas ? toppingsNames(it.toppingIds) : [];
                  const ex = extrasLine(it.extrasQty);

                  return (
                    <div key={p.id} className="border-b border-white/10 pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-black truncate">{p.name}</div>
                          <div className="text-[11px] text-white/55">
                            Cantidad: <span className="font-black text-white/75">x{it.qty}</span>
                          </div>

                          {isGomitas ? (
                            <div className="mt-1 text-[11px] text-white/55">
                              Referencia:{" "}
                              <span className="font-black text-white/75">
                                {it.version ? it.version : "Pendiente"}
                              </span>
                              {tops.length ? (
                                <div className="mt-1">
                                  Toppings: <span className="text-white/70">{tops.join(", ")}</span>
                                </div>
                              ) : null}
                            </div>
                          ) : null}

                          {ex.length ? (
                            <div className="mt-1 text-[11px] text-white/55">
                              Extras: <span className="text-white/70">{ex.join(", ")}</span>
                            </div>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() => updateQty(p.id, 0)}
                          className="text-[10px] uppercase tracking-[0.22em] text-white/55 hover:text-white"
                        >
                          quitar
                        </button>
                      </div>

                      <div className="mt-3 space-y-1 text-[12px]">
                        <div className="flex items-center justify-between text-white/70">
                          <span>Base (unidad)</span>
                          <span>{cop(it.baseUnit)}</span>
                        </div>
                        <div className="flex items-center justify-between text-white/70">
                          <span>Extras (unidad)</span>
                          <span>{cop(it.extrasUnit)}</span>
                        </div>
                        <div className="flex items-center justify-between text-white/80 font-black">
                          <span>Subtotal item</span>
                          <span>{cop(it.line)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-white/55">Aún no has agregado productos.</div>
              )}
            </div>

            <div className="mt-4 border-t border-white/10 pt-4 space-y-2">
              <div className="flex items-center justify-between text-white/70 text-sm">
                <span>Subtotal</span>
                <span>{cop(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-white/70 text-sm">
                <span>Envío</span>
                <span>{cop(delivery)}</span>
              </div>
              <div className="flex items-center justify-between text-white font-black text-lg pt-2 border-t border-white/10">
                <span>Total</span>
                <span>{cop(total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className={[
                "mt-4 w-full border border-white/20 py-3 font-black",
                canSend ? "text-white hover:bg-white/[0.04]" : "text-white/35 cursor-not-allowed",
              ].join(" ")}
            >
              Enviar WhatsApp
            </button>

            {!canSend ? (
              <div className="mt-2 text-[11px] text-white/55">
                Completa: productos + datos + domicilio (si aplica) + gomitas (referencia + 1 topping).
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
