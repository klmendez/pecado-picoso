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

export type ItemDiscount = { nombre: string; descuento: number };

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

  // Descuentos que le aplicaron a este producto en particular (foto del
  // momento en que se creó el pedido; no se recalcula si el pedido se edita).
  discounts?: ItemDiscount[];
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
  return `📍 *Barrio:* ${barrio.name}${barrio.price == null ? " (Se confirma)" : ""}`;
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

// Nombres de toppings incluidos, uno por línea (para listas con viñetas)
export function getToppingNamesList(toppingIds: string[], toppingsCatalog: Topping[]): string[] {
  const lookup = new Map(toppingsCatalog.map((t) => [t.id, t.name]));
  return toppingIds.map((id) => lookup.get(id) ?? id);
}

export type ExtraDetail = { name: string; qty: number; total: number; selectionNames?: string[] };

// Detalle de adiciones con precio total por línea (precio unitario x cantidad x
// unidades del producto), para mostrar "• Nombre: $monto". Si el extra es de
// tipo "gomitas", incluye los sabores elegidos (selectionNames).
export function getExtrasDetail(
  extrasQty: Record<string, number>,
  itemQty: number,
  extrasCatalog: (Extra & { price: number })[],
  extraSelections: Record<string, string[]> = {},
  toppingsCatalog: Topping[] = [],
): ExtraDetail[] {
  const toppingLookup = new Map(toppingsCatalog.map((t) => [t.id, t.name]));
  const details: ExtraDetail[] = [];
  for (const extra of extrasCatalog) {
    const q = Number(extrasQty[extra.id]) || 0;
    if (q <= 0) continue;
    const totalQty = q * itemQty;
    const selections = extraSelections[extra.id] ?? [];
    const selectionNames = extra.id === "gomitas" && selections.length
      ? selections.slice(0, q).map((sel) => toppingLookup.get(sel) ?? sel)
      : undefined;
    details.push({ name: extra.name, qty: totalQty, total: extra.price * totalQty, selectionNames });
  }
  return details;
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

  items: (OrderItem & { baseLine: number })[];

  subtotal: number;
  delivery: number;
  total: number;

  toppingsCatalog: Topping[];
  extrasCatalog: (Extra & { price: number })[];

  paymentMethod: PaymentMethod;
  comments?: string;
  locationLink?: string;
  descuentoTotal?: number;
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
    locationLink,
    descuentoTotal = 0,
  } = args;

  const serviceLabel = formatServiceLabel(service);
  const barrioLine = formatBarrioLine(service, barrio);
  const addressLine = formatAddressLine(service, address, reference);
  const deliveryPendingLine =
    service === "domicilio" && barrio?.price == null
      ? "⚠️ *El valor del envío se confirma según tu ubicación.*"
      : undefined;

  const productBlocks = items.map((it, idx) => {
    const detail = buildDetailLine(it.product, it.version, it.size);
    const maxToppings = it.product.toppingsIncludedMax ?? 0;
    const toppingNames = maxToppings > 0 ? getToppingNamesList(it.toppingIds, toppingsCatalog) : [];
    const extrasDetail = getExtrasDetail(it.extrasQty, it.qty, extrasCatalog, it.extraSelections ?? {}, toppingsCatalog);
    const itemDiscounts = it.discounts ?? [];
    const itemDiscountTotal = itemDiscounts.reduce((s, d) => s + d.descuento, 0);
    const extrasTotalMonto = extrasDetail.reduce((s, e) => s + e.total, 0);
    const netTotal = it.baseLine + extrasTotalMonto - itemDiscountTotal;

    const lines: string[] = [];
    lines.push(`*${idx + 1}) x${it.qty} ${pickCategoryEmoji(it.product)} ${it.product.name}*`);
    if (detail) lines.push(detail);
    lines.push(`Precio del producto: *${cop(it.baseLine)}*`);

    if (toppingNames.length) {
      lines.push("", "🍬 *Incluye:*");
      toppingNames.forEach((n) => lines.push(`• ${n}`));
    }

    if (extrasDetail.length) {
      lines.push("", "➕ *Adiciones:*");
      extrasDetail.forEach((e) => {
        const sel = e.selectionNames?.length ? ` (${e.selectionNames.join(", ")})` : "";
        lines.push(`• ${e.name}${e.qty > 1 ? ` x${e.qty}` : ""}${sel}: ${cop(e.total)}`);
      });
    }

    if (itemDiscounts.length) {
      lines.push("");
      itemDiscounts.forEach((d) => lines.push(`${d.nombre}: _-${cop(d.descuento)}_`));
    }

    lines.push("", `*Subtotal del producto: ${cop(netTotal)}*`);

    return lines.join("\n");
  });

  const payEmoji = paymentMethod === "Transferencia" ? "🏦" : "💵";

  const headerLines = [`👋 *¡Nuevo pedido recibido!*`, `🧾 *Código:* ${code}`, `🌐 *Origen:* ${origin}`];

  const customerSection = [
    section("🙋 Datos del cliente"),
    `Nombre: *${name}*`,
    `Teléfono: *${phone}*`,
  ];

  const locationLine = locationLink ? `📍 *Ubicación en tiempo real:* ${locationLink}` : null;

  const serviceSection = [
    section(`${pickServiceEmoji(service)} Servicio`),
    `Tipo: *${serviceLabel}*`,
    barrioLine ?? null,
    addressLine ?? null,
    locationLine ?? null,
    deliveryPendingLine ?? null,
  ];

  const productsSection = [section("🛍️ Detalle del pedido"), "", productBlocks.join("\n\n\n")];

  const commentsSection = comments?.trim()
    ? [section("📝 Comentarios"), comments.trim()]
    : [];

  const deliveryLine = service === "domicilio" ? `${pickServiceEmoji(service)} Domicilio: *${cop(delivery)}*` : null;

  const paymentSummarySection = [
    section("💰 Resumen de pago"),
    `Productos: *${cop(subtotal - descuentoTotal)}*`,
    deliveryLine,
    "",
    `💳 *TOTAL A PAGAR: ${cop(total)}*`,
  ];

  const paymentMethodSection = [
    section(`${payEmoji} Método de pago`),
    `*${paymentMethod}*`,
    "",
    `Nequi / Llave: *${NEQUI_PHONE}*`,
    "",
    paymentMethod === "Transferencia"
      ? `📎 Envíanos el comprobante para confirmar tu pedido.`
      : `✅ Ten el valor exacto si es posible.`,
  ];

  const footerSection = ["", `🌶️ *¡Gracias por pecar con nosotros!*`];

  return [
    ...headerLines,
    ...customerSection,
    ...serviceSection,
    ...productsSection,
    ...commentsSection,
    ...paymentSummarySection,
    ...paymentMethodSection,
    ...footerSection,
  ]
    .filter((line): line is string => line !== null && line !== undefined)
    .join("\n");
}
