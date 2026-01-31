import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Barrio } from "../data/barrios";
import { BARRIOS } from "../data/barrios";
import { PRODUCTS, type Product, type Size, type Version } from "../data/products";
import { TOPPINGS } from "../data/toppings";
import { EXTRAS } from "../data/extras";
import { getBasePrice, extrasTotal, deliveryCost } from "../lib/pricing";
import { buildCode } from "../lib/whatsapp";
import type { PaymentMethod } from "../lib/whatsapp";
import { cop } from "../lib/format";
import { NEQUI_PHONE } from "../data/constants";
import Catalogo from "./Catalogo";
import OrderAside from "../components/OrderAside";
import ahogadoRefImg from "../assets/referencias/ahogado.jpg";
import picosinRefImg from "../assets/referencias/picosin.jpg";

/**
 * Número fijo WhatsApp
 * 3135707125 -> 57 + 3135707125
 */
const WHATSAPP_DESTINATION = "573135707125";

/**
 * Link usando API oficial de WhatsApp
 */
function waApiLink(phoneDigits: string, message: string) {
  const phone = phoneDigits.replace(/\D/g, "");
  const text = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${phone}&text=${text}`;
}

function getToppingLimit(product: Product): number {
  return product.category === "gomitas" ? product.toppingsIncludedMax : 0;
}

function findProductById(id: string | null): Product | null {
  if (!id) return null;
  return PRODUCTS.find((p) => p.id === id) ?? null;
}

function sizeLabel(size: Size | null) {
  if (!size) return "";
  return size === "pequeno" ? "Pequeño" : size === "mediano" ? "Mediano" : "Grande";
}

function versionLabel(v: Version | null) {
  if (!v) return "";
  return v === "ahogada" ? "Ahogada" : "Picosa";
}

type CartItem = {
  id: string;
  product: Product;
  version: Version | null;
  size: Size | null;
  toppings: string[];
  extras: Record<string, number>;
  note?: string;
};

type CartSummaryItem = {
  id: string;
  title: string;
  detail?: string;
  toppings?: string[];
  extras?: string[];
  price: number;
};

const VERSION_REFERENCES: Array<{
  key: Version;
  name: string;
  title: string;
  subtitle: string;
  image: string;
}> = [
  {
    key: "ahogada",
    name: "Ahogada",
    title: "CAPRICHO AHOGADO",
    subtitle: "Pura tentación en cada gota",
    image: ahogadoRefImg,
  },
  {
    key: "picosa",
    name: "Picosa",
    title: "CAPRICHO PICOSIN",
    subtitle: "Intensidad que enamora",
    image: picosinRefImg,
  },
];

const VERSION_META = new Map(VERSION_REFERENCES.map((ref) => [ref.key, ref]));

function createCartItem(product: Product): CartItem {
  const defaultSize = product.category === "gomitas" ? product.sizes[0] : product.sizes?.[0] ?? null;
  const defaultVersion = product.category === "gomitas" ? null : null;
  return {
    id: `${product.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    product,
    version: defaultVersion,
    size: defaultSize,
    toppings: product.category === "gomitas" ? TOPPINGS.slice(0, 1).map((t) => t.id) : [],
    extras: {},
  };
}

export default function ArmarPedido() {
  const [params] = useSearchParams();
  const preId = params.get("productId");
  const [cart, setCart] = useState<CartItem[]>(() => {
    const initial = findProductById(preId);
    return initial ? [createCartItem(initial)] : [];
  });

  const [activeItemId, setActiveItemId] = useState<string | null>(cart[0]?.id ?? null);

  const activeItem = cart.find((item) => item.id === activeItemId) ?? cart[cart.length - 1] ?? null;

  // Cliente (se solicita después de servicio/pago, pero necesitamos estado global)
  const [service, setService] = useState<"llevar" | "domicilio" | "local">("llevar");
  const [barrio, setBarrio] = useState<Barrio | null>(null);
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Transferencia");
  const [comments, setComments] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (service !== "domicilio") {
      setBarrio(null);
      setAddress("");
      setReference("");
    }
  }, [service]);

  function updateActiveItem(updater: (item: CartItem) => CartItem) {
    if (!activeItem) return;
    setCart((prev) => prev.map((item) => (item.id === activeItem.id ? updater(item) : item)));
  }

  function addProductToCart(product: Product) {
    setCart((prev) => {
      const next = [...prev, createCartItem(product)];
      setActiveItemId(next[next.length - 1].id);
      return next;
    });
  }

  function removeCartItem(id: string) {
    setCart((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      if (activeItemId === id) {
        setActiveItemId(filtered[filtered.length - 1]?.id ?? null);
      }
      return filtered;
    });
  }

  const cartTotals = useMemo(() => {
    let subtotal = 0;
    const detailLines: string[] = [];
    const itemsSummary: CartSummaryItem[] = [];

    cart.forEach((item, index) => {
      const basePrice = getBasePrice(item.product, item.version, item.size);
      const extrasSum = extrasTotal(item.extras, EXTRAS);
      const itemTotal = basePrice + extrasSum;
      subtotal += itemTotal;

      const detailParts: string[] = [];
      if (item.product.category === "gomitas") {
        if (item.version) detailParts.push(versionLabel(item.version));
        if (item.size) detailParts.push(sizeLabel(item.size));
      } else {
        const fixed = "fijo" in item.product.prices && !!item.product.prices.fijo;
        if (!fixed && item.size) detailParts.push(sizeLabel(item.size));
      }

      const toppingsMap = new Map(TOPPINGS.map((t) => [t.id, t.name]));
      const toppingsList =
        item.product.category === "gomitas" && item.toppings.length
          ? item.toppings.map((id) => toppingsMap.get(id) ?? id)
          : undefined;

      const extrasParts: string[] = [];
      for (const extra of EXTRAS) {
        const qty = item.extras[extra.id] ?? 0;
        if (qty > 0) extrasParts.push(`${extra.name} x${qty}`);
      }

      const detailLine = `${index + 1}. ${item.product.name}${detailParts.length ? ` – ${detailParts.join(" · ")}` : ""}`;
      const toppingsLine = toppingsList && toppingsList.length ? ` → Toppings: ${toppingsList.join(", ")}` : "";
      const extrasLine = extrasParts.length ? ` → Extras: ${extrasParts.join(", ")}` : "";

      detailLines.push(`${detailLine}${toppingsLine}${extrasLine}`);

      itemsSummary.push({
        id: item.id,
        title: item.product.name,
        detail: detailParts.join(" · ") || undefined,
        toppings: toppingsList,
        extras: extrasParts.length ? extrasParts : undefined,
        price: itemTotal,
      });
    });

    return {
      subtotal,
      detailLines,
      itemsSummary,
    };
  }, [cart]);

  const delivery = useMemo(() => deliveryCost(service, barrio), [service, barrio]);
  const total = useMemo(() => cartTotals.subtotal + delivery, [cartTotals, delivery]);

  const canSend = useMemo(() => {
    if (!cart.length) return false;
    if (!name.trim() || !phone.trim()) return false;
    if (service === "local") return false;
    if (service === "domicilio" && (!barrio || !address.trim())) return false;

    // Validate each item
    for (const item of cart) {
      if (item.product.category === "gomitas") {
        if (!item.version || !item.size || item.toppings.length < 1) return false;
      } else {
        const fixed = "fijo" in item.product.prices && !!item.product.prices.fijo;
        if (!fixed && !item.size) return false;
      }
    }
    return true;
  }, [cart, name, phone, service, barrio, address]);

  function handleSend() {
    if (!canSend || !cart.length) return;

    const origin = window.location.origin;
    const code = buildCode();

    const serviceLabel =
      service === "domicilio"
        ? "Domicilio"
        : service === "llevar"
        ? "Para llevar"
        : "En el local (Próximamente)";

    const barrioLine =
      service === "domicilio" && barrio
        ? `Barrio: ${barrio.name} ${barrio.price == null ? "(Se confirma)" : `(${cop(barrio.price)})`}`
        : undefined;

    const addressLine =
      service === "domicilio"
        ? `Dirección: ${address}${reference.trim() ? ` • Ref: ${reference.trim()}` : ""}`
        : undefined;

    const cartMessage = cartTotals.detailLines.join("\n");

    const msg = [
      `Vengo de ${origin}`,
      `CODIGO DE VENTA: ${code}`,
      "",
      `Tipo de servicio: ${serviceLabel}`,
      "",
      `Nombre: ${name.trim()}`,
      `Telefono: ${phone.trim()}`,
      barrioLine ?? null,
      addressLine ?? null,
      "",
      "Productos",
      cartMessage,
      "",
      `Subtotal: ${cop(cartTotals.subtotal)}`,
      `Entrega: ${cop(delivery)}`,
      `Total: ${cop(total)}`,
      "",
      "Pago",
      `Modalidad de pago: ${paymentMethod}`,
      `Total a pagar: ${cop(total)}`,
      `Nequi / Llave: ${NEQUI_PHONE}`,
      "",
      "Si pagas por transferencia, envianos el comprobante para confirmar el pedido.",
      comments.trim() ? "" : null,
      comments.trim() ? `Comentarios adicionales: ${comments.trim()}` : null,
      "",
      "Envíanos este mensaje ahora.",
    ]
      .filter(Boolean)
      .join("\n");

    const link = waApiLink(WHATSAPP_DESTINATION, msg);
    window.location.href = link;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-28 pb-12 space-y-10">
      <header className="text-center space-y-3">
        <span className="text-[11px] uppercase tracking-[0.28em] text-white/50">Pedido rápido</span>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Arma tu pedido</h1>
        <p className="text-sm md:text-base text-white/60 max-w-2xl mx-auto">
          Selecciona tus productos, ajusta toppings y extras, define tu servicio y comparte el pedido por WhatsApp.
        </p>
      </header>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-white">1. Elige tus productos</h2>
          {cart.length ? (
            <span className="text-sm text-white/60">{cart.length} producto(s) en tu pedido</span>
          ) : null}
        </div>

        <Catalogo
          embedded
          showHeader={false}
          onSelectProduct={addProductToCart}
          selectedProductIds={cart.map((item) => item.product.id)}
          actionLabel="Agregar"
        />

        {cart.length ? (
          <div className="space-y-8 border-t border-white/10 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-white">Productos en tu pedido</h3>
                <p className="text-white/60 text-sm">Elige cuál quieres editar para ajustar sabores y extras.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {cart.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveItemId(item.id)}
                    className={[
                      "rounded-full px-3 py-1 text-xs font-bold transition",
                      activeItemId === item.id
                        ? "bg-white text-neutral-950"
                        : "border border-white/30 text-white/70 hover:border-white/60",
                    ].join(" ")}
                  >
                    {item.product.name}
                  </button>
                ))}
              </div>
            </div>

            {activeItem ? (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-white">{activeItem.product.name}</h4>
                    <p className="text-sm text-white/60 max-w-xl">{activeItem.product.description}</p>
                  </div>
                  {cart.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeCartItem(activeItem.id)}
                      className="text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white"
                    >
                      Quitar
                    </button>
                  ) : null}
                </div>

                {activeItem.product.category === "gomitas" ? (
                  <div className="space-y-5">
                    <div className="flex items-baseline gap-3">
                      <span className="text-sm font-bold uppercase tracking-[0.26em] text-white/60">Referencia</span>
                      <span className="text-white/70 text-sm">Escoge cómo quieres tu capricho</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {VERSION_REFERENCES.map((ref) => {
                        const isActive = activeItem.version === ref.key;
                        return (
                          <button
                            key={ref.key}
                            type="button"
                            onClick={() =>
                              updateActiveItem((item) => ({
                                ...item,
                                version: ref.key,
                              }))
                            }
                            className={[
                              "group relative flex flex-col items-center gap-4 text-center transition",
                              isActive ? "scale-[1.02]" : "opacity-80 hover:opacity-100",
                            ].join(" ")}
                          >
                            <span
                              className={[
                                "relative block h-36 w-36 overflow-hidden rounded-full shadow-[0_18px_40px_rgba(0,0,0,0.45)] transition-all",
                                isActive ? "ring ring-white ring-offset-2 ring-offset-transparent" : "ring-1 ring-white/20",
                              ].join(" ")}
                            >
                              <img src={ref.image} alt={ref.title} className="h-full w-full object-cover" loading="lazy" />
                              <span className="absolute inset-x-0 bottom-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-white drop-shadow">
                                {ref.name}
                              </span>
                              <span
                                className={[
                                  "absolute inset-0 rounded-full bg-black/65 opacity-0 transition-opacity",
                                  "group-hover:opacity-100",
                                  isActive ? "opacity-100" : "",
                                ].join(" ")}
                              >
                                <span className="flex h-full flex-col items-center justify-center px-6 text-white">
                                  <span className="text-xs font-black tracking-[0.18em] uppercase">{ref.title}</span>
                                  <span className="mt-2 text-xs text-white/80 whitespace-pre-line leading-snug">{ref.subtitle}</span>
                                </span>
                              </span>
                            </span>
                            <span className="text-xs uppercase tracking-[0.2em] text-white/70">{isActive ? "Seleccionado" : "Ver detalles"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <div className="font-black text-white">Tamaño</div>
                  <div className="flex flex-wrap gap-2">
                    {(activeItem.product.category === "gomitas"
                      ? activeItem.product.sizes
                      : activeItem.product.sizes ?? [])
                      .filter(Boolean)
                      .map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() =>
                            updateActiveItem((item) => ({
                              ...item,
                              size: s,
                            }))
                          }
                          className={[
                            "rounded-full px-4 py-2 text-sm font-bold transition",
                            activeItem.size === s
                              ? "bg-white text-neutral-950"
                              : "border border-white/20 text-white/70 hover:border-white/40",
                          ].join(" ")}
                        >
                          {sizeLabel(s)}
                        </button>
                      ))}
                  </div>
                </div>

                {activeItem.product.category === "gomitas" ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-white/60">
                      <span className="font-black text-white">Toppings incluidos</span>
                      <span>
                        {activeItem.toppings.length} / {Math.min(getToppingLimit(activeItem.product), 4)}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {TOPPINGS.map((t) => {
                        const active = activeItem.toppings.includes(t.id);
                        const toppingLimit = Math.min(getToppingLimit(activeItem.product), 4);
                        const atMax = !active && activeItem.toppings.length >= toppingLimit;
                        const atMin = active && activeItem.toppings.length <= 1;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() =>
                              updateActiveItem((item) => {
                                const isOn = item.toppings.includes(t.id);
                                if (isOn && item.toppings.length <= 1) return item;
                                if (isOn) {
                                  return {
                                    ...item,
                                    toppings: item.toppings.filter((id) => id !== t.id),
                                  };
                                }
                                const limit = Math.min(getToppingLimit(item.product), 4);
                                if (!isOn && item.toppings.length >= limit) {
                                  return item;
                                }
                                return {
                                  ...item,
                                  toppings: [...item.toppings, t.id],
                                };
                              })
                            }
                            disabled={atMax || atMin}
                            className={[
                              "rounded-2xl border border-white/15 px-4 py-3 text-left transition",
                              active
                                ? "bg-white/10 border-white/40"
                                : "bg-white/[0.02] hover:border-white/30",
                              atMax || atMin ? "opacity-40 cursor-not-allowed" : "",
                            ].join(" ")}
                          >
                            <div className="font-bold text-white">{t.name}</div>
                            <div className="text-xs text-white/60">Incluido</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <div className="font-black text-white">Extras</div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {EXTRAS.map((extra) => {
                      const qty = activeItem.extras[extra.id] ?? 0;
                      return (
                        <div
                          key={extra.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                        >
                          <div>
                            <div className="font-bold text-white">{extra.name}</div>
                            <div className="text-xs text-white/60">{cop(extra.price)}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="h-8 w-8 rounded-full border border-white/20 text-white"
                              onClick={() =>
                                updateActiveItem((item) => ({
                                  ...item,
                                  extras: {
                                    ...item.extras,
                                    [extra.id]: Math.max(0, (item.extras[extra.id] ?? 0) - 1),
                                  },
                                }))
                              }
                            >
                              −
                            </button>
                            <div className="w-8 text-center font-black text-white">{qty}</div>
                            <button
                              type="button"
                              className="h-8 w-8 rounded-full border border-white text-white"
                              onClick={() =>
                                updateActiveItem((item) => ({
                                  ...item,
                                  extras: {
                                    ...item.extras,
                                    [extra.id]: (item.extras[extra.id] ?? 0) + 1,
                                  },
                                }))
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
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
            Agrega tus productos desde el catálogo para comenzar.
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-white">2. Servicio y pago</h2>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
          <div className="space-y-4">
            <div className="font-black text-white">Tipo de servicio</div>
            <div className="grid sm:grid-cols-3 gap-2">
              {([
                {
                  value: "domicilio" as const,
                  title: "A domicilio",
                  desc: "Envío según barrio",
                },
                {
                  value: "llevar" as const,
                  title: "Para llevar",
                  desc: "Recoge tu pedido",
                },
                {
                  value: "local" as const,
                  title: "En el local",
                  desc: "Próximamente",
                  disabled: true,
                },
              ]).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => !option.disabled && setService(option.value)}
                  className={[
                    "rounded-2xl border px-4 py-3 text-left",
                    option.disabled
                      ? "border-white/10 text-white/40 cursor-not-allowed"
                      : service === option.value
                      ? "border-white/40 bg-white/10 text-white"
                      : "border-white/10 text-white/70 hover:border-white/30",
                  ].join(" ")}
                >
                  <div className="font-black text-white">{option.title}</div>
                  <div className="text-sm text-white/60">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="font-black text-white">Pago</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div className="text-sm text-white/70">
                Nequi / Llave: <span className="font-black text-white">{NEQUI_PHONE}</span>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <label className="text-sm font-bold text-white">Modalidad de pago:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/40"
                >
                  <option value="Transferencia">Transferencia</option>
                  <option value="Efectivo">Efectivo</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-white">Comentarios adicionales (opcional)</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl bg-white/5 border border-white/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="Ej: Sin tajín / bien sellado / etc."
                />
              </div>
            </div>
          </div>

          {service === "domicilio" ? (
            <div className="space-y-4">
              <div className="font-black text-white">Detalles de domicilio</div>
              <div className="space-y-3">
                <select
                  value={barrio?.id ?? ""}
                  onChange={(e) => setBarrio(BARRIOS.find((b: Barrio) => b.id === e.target.value) ?? null)}
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/40"
                >
                  <option value="" disabled>
                    Elige tu barrio…
                  </option>
                  {BARRIOS.map((b: Barrio) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.price == null ? "(Por confirmar)" : `(${cop(b.price)})`}
                    </option>
                  ))}
                </select>

                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/40"
                  placeholder="Dirección (Ej: Cra 7 # 12-34)"
                />
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/40"
                  placeholder="Referencia (opcional)"
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-white">3. Datos finales</h2>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-white">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="mt-1 w-full rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/40"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-white">Teléfono</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+57 3xx xxx xxxx"
                className="mt-1 w-full rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/40"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <OrderAside
          items={cartTotals.itemsSummary}
          service={service}
          barrio={barrio}
          address={address}
          subtotal={cartTotals.subtotal}
          delivery={delivery}
          total={total}
          canSend={canSend}
          onSend={handleSend}
        />
      </section>
    </div>
  );
}
