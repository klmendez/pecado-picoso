import { NEQUI_PHONE } from "../data/constants";
import type { Barrio } from "../data/barrios";
import { cop } from "./format";
import type { Product, Size, Version } from "../data/products";
import { isFixedPrice } from "../data/products";

export function buildCode() {
  const d = new Date();
  const y = String(d.getFullYear()).slice(2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PP-${y}${m}${day}-${rnd}`;
}

export type PaymentMethod = "Transferencia" | "Efectivo";
export type Service = "llevar" | "domicilio" | "local";

export type Topping = { id: string; name: string };
export type Extra = { id: string; name: string };

export type OrderItem = {
  id: string;
  product: Product;
  qty: number;

  // config por item
  version: Version | null; // aplica a gomitas
  size: Size | null; // aplica a gomitas y frutafresh porSize
  toppingIds: string[]; // aplica a TODO producto con toppingsIncludedMax > 0
  extrasQty: Record<string, number>;
  extraSelections: Record<string, string[]>;
};

function sizeLabel(size: Size | null) {
  if (!size) return "";
  return size === "pequeno" ? "Pequeño" : size === "mediano" ? "Mediano" : "Grande";
}

function versionLabel(version: Version | null) {
  if (!version) return "";
  return version === "ahogada" ? "Ahogada" : "Picosa";
}

export function formatServiceLabel(service: Service) {
  return service === "domicilio"
    ? "Domicilio"
    : service === "llevar"
    ? "Para llevar"
    : "Consumir en el local";
}

export function formatBarrioLine(service: Service, barrio: Barrio | null) {
  if (service !== "domicilio" || !barrio) return undefined;
  return `📍 *Barrio:* ${barrio.name} ${
    barrio.price == null ? "(Se confirma)" : `(${cop(barrio.price)})`
  }`;
}

export function formatAddressLine(service: Service, address: string, reference: string) {
  if (service !== "domicilio") return undefined;
  const addr = address.trim();
  const ref = reference.trim();
  if (!addr) return `🏠 *Dirección:* (pendiente)`;
  return `🏠 *Dirección:* ${addr}${ref ? `\n🧭 *Referencia:* ${ref}` : ""}`;
}

export function buildDetailLine(product: Product, version: Version | null, size: Size | null) {
  const parts: string[] = [];

  // Gomitas: versión + tamaño
  if (product.category === "gomitas") {
    if (version) parts.push(versionLabel(version));
    if (size) parts.push(sizeLabel(size));
  }

  // FrutaFresh:
  // - si es fijo: no agregamos tamaño
  // - si es porSize: agregamos tamaño si existe
  if (product.category === "frutafresh") {
    if (!isFixedPrice(product.prices) && size) parts.push(sizeLabel(size));
  }

  return parts.join(" · ");
}

export function formatToppingsNames(toppingIds: string[], toppingsCatalog: Topping[]) {
  if (!toppingIds.length) return undefined;
  const lookup = new Map(toppingsCatalog.map((t) => [t.id, t.name]));
  const names = toppingIds.map((id) => lookup.get(id) ?? id);
  return names.join(", ");
}

export function formatExtrasNames(
  extrasQty: Record<string, number>,
  extrasCatalog: Extra[],
  extraSelections: Record<string, string[]>,
  toppingsCatalog: Topping[],
) {
  const lookup = new Map(extrasCatalog.map((e) => [e.id, e.name]));
  const toppingLookup = new Map(toppingsCatalog.map((t) => [t.id, t.name]));
  const parts: string[] = [];
  for (const [id, qty] of Object.entries(extrasQty)) {
    const q = Number(qty) || 0;
    if (q <= 0) continue;
    const selections = extraSelections[id] ?? [];
    const detail =
      id === "gomitas" && selections.length
        ? ` (${selections
            .slice(0, q)
            .map((sel) => toppingLookup.get(sel) ?? sel)
            .join(", ")})`
        : "";
    parts.push(`${lookup.get(id) ?? id} x${q}${detail}`);
  }
  return parts.length ? parts.join(", ") : undefined;
}

function section(title: string) {
  // separador “bonito” para WhatsApp
  return `\n━━━━━━━━━━━━━━\n*${title}*\n━━━━━━━━━━━━━━`;
}

function pickServiceEmoji(service: Service) {
  if (service === "domicilio") return "🛵";
  if (service === "llevar") return "🥡";
  return "🏠";
}

function pickCategoryEmoji(product: Product) {
  return product.category === "gomitas" ? "🌶️" : "🍍";
}

export function waLink(whatsPhone: string, text: string) {
  const clean = whatsPhone.replace(/\D/g, "");
  return `https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppMessage(args: {
  origin: string;
  code: string;
  name: string;
  phone: string;

  service: Service;
  barrio: Barrio | null;
  address: string;
  reference: string;

  items: OrderItem[];

  subtotal: number;
  delivery: number;
  total: number;

  toppingsCatalog: Topping[];
  extrasCatalog: Extra[];

  paymentMethod: PaymentMethod;
  comments?: string;
}) {
  const {
    origin,
    code,
    name,
    phone,
    service,
    barrio,
    address,
    reference,
    items,
    subtotal,
    delivery,
    total,
    toppingsCatalog,
    extrasCatalog,
    paymentMethod,
    comments,
  } = args;

  const serviceLabel = formatServiceLabel(service);
  const barrioLine = formatBarrioLine(service, barrio);
  const addressLine = formatAddressLine(service, address, reference);
  const deliveryPendingLine =
    service === "domicilio" && barrio?.price == null
      ? "⚠️ *El valor del envío se confirma según tu ubicación.*"
      : undefined;

  const productLines = items.flatMap((it, idx) => {
    const detail = buildDetailLine(it.product, it.version, it.size);

    // ✅ IMPORTANTE: toppings para cualquier producto que tenga toppingsIncludedMax > 0
    const maxToppings = it.product.toppingsIncludedMax ?? 0;
    const toppingsNames =
      maxToppings > 0 ? formatToppingsNames(it.toppingIds, toppingsCatalog) : undefined;

    const extrasNames = formatExtrasNames(it.extrasQty, extrasCatalog, it.extraSelections ?? {}, toppingsCatalog);

    const head = `${idx + 1}) x${it.qty} ${pickCategoryEmoji(it.product)} *${it.product.name}*${
      detail ? `\n   ▸ ${detail}` : ""
    }`;

    const toppingLine = toppingsNames
      ? `   ▸ 🍬 *Toppings* (máx. ${maxToppings}): ${toppingsNames}`
      : null;

    const extrasLine = extrasNames ? `   ▸ ✨ *Extras:* ${extrasNames}` : null;

    return [head, toppingLine, extrasLine].filter((x): x is string => x != null);
  });

  const deliveryLine =
    service === "domicilio" ? `Entrega: ${cop(delivery)}` : `Entrega: ${cop(0)}`;

  const payEmoji = paymentMethod === "Transferencia" ? "🏦" : "💵";

  const headerLines = [`👋 *Nuevo pedido*`, `🧾 *Código:* ${code}`, `🌐 *Origen:* ${origin}`];

  const customerSection = [
    section("🙋 Datos del cliente"),
    `Nombre: *${name}*`,
    `Teléfono: *${phone}*`,
  ];

  const serviceSection = [
    section(`${pickServiceEmoji(service)} Servicio`),
    `Tipo: *${serviceLabel}*`,
    barrioLine ?? null,
    addressLine ?? null,
    deliveryPendingLine ?? null,
  ];

  const productsSection = [section("� Productos"), ...productLines];

  const commentsSection = comments?.trim()
    ? [section("📝 Comentarios"), comments.trim()]
    : [];

  const sendSection = [section("� Enviar"), `Envíanos este mensaje ahora y confirmamos tu pedido 🙌`];

  const totalsSection = [
    section("💰 Totales"),
    `Subtotal: *${cop(subtotal)}*`,
    deliveryLine,
    `Total: *${cop(total)}*`,
    `${payEmoji} Método de pago: *${paymentMethod}*`,
    `Nequi / Llave: *${NEQUI_PHONE}*`,
    paymentMethod === "Transferencia"
      ? `📎 Si pagas por transferencia, envíanos el comprobante para confirmar el pedido.`
      : `✅ Si pagas en efectivo, por favor ten el valor exacto si es posible.`,
  ];

  return [
    ...headerLines,
    ...customerSection,
    ...serviceSection,
    ...productsSection,
    ...commentsSection,
    ...sendSection,
    ...totalsSection,
  ]
    .filter((line): line is string => line !== null && line !== undefined)
    .join("\n");
}
