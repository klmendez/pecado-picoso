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
  product: Product;
  qty: number;

  // config por item
  version: Version | null; // gomitas
  size: Size | null;
  toppingIds: string[]; // gomitas
  extrasQty: Record<string, number>;
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
  return service === "domicilio" ? "Domicilio" : service === "llevar" ? "Para llevar" : "En el local (Próximamente)";
}

export function formatBarrioLine(service: Service, barrio: Barrio | null) {
  if (service !== "domicilio" || !barrio) return undefined;
  return `Barrio: ${barrio.name} ${barrio.price == null ? "(Se confirma)" : `(${cop(barrio.price)})`}`;
}

export function formatAddressLine(service: Service, address: string, reference: string) {
  if (service !== "domicilio") return undefined;
  const addr = address.trim();
  const ref = reference.trim();
  if (!addr) return `Dirección: (pendiente)`;
  return `Dirección: ${addr}${ref ? ` • Ref: ${ref}` : ""}`;
}

export function buildDetailLine(product: Product, version: Version | null, size: Size | null) {
  const parts: string[] = [];

  if (product.category === "gomitas") {
    if (version) parts.push(versionLabel(version));
    if (size) parts.push(sizeLabel(size));
  } else if (!isFixedPrice(product.prices) && size) {
    parts.push(sizeLabel(size));
  }

  return parts.join(" · ");
}

export function formatToppingsNames(toppingIds: string[], toppingsCatalog: Topping[]) {
  if (!toppingIds.length) return undefined;
  const lookup = new Map(toppingsCatalog.map((t) => [t.id, t.name]));
  const names = toppingIds.map((id) => lookup.get(id) ?? id);
  return names.join(", ");
}

export function formatExtrasNames(extrasQty: Record<string, number>, extrasCatalog: Extra[]) {
  const lookup = new Map(extrasCatalog.map((e) => [e.id, e.name]));
  const parts: string[] = [];
  for (const [id, qty] of Object.entries(extrasQty)) {
    const q = Number(qty) || 0;
    if (q <= 0) continue;
    parts.push(`${lookup.get(id) ?? id} x${q}`);
  }
  return parts.length ? parts.join(", ") : undefined;
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

  const productLines = items.flatMap((it, idx) => {
    const detail = buildDetailLine(it.product, it.version, it.size);
    const toppingsNames = it.product.category === "gomitas" ? formatToppingsNames(it.toppingIds, toppingsCatalog) : undefined;
    const extrasNames = formatExtrasNames(it.extrasQty, extrasCatalog);

    return [
      `${idx + 1}) X${it.qty} ${it.product.name}${detail ? " - " + detail : ""}`,
      toppingsNames ? `   Toppings (incluidos): ${toppingsNames}` : null,
      extrasNames ? `   Extras: ${extrasNames}` : null,
    ].filter((x): x is string => x !== null && x !== undefined);
  });

  return [
    `Vengo de ${origin}`,
    `CODIGO DE VENTA: ${code}`,
    ``,
    `Tipo de servicio: ${serviceLabel}`,
    ``,
    `Nombre: ${name}`,
    `Telefono: ${phone}`,
    barrioLine ?? null,
    addressLine ?? null,
    ``,
    `Productos`,
    ...productLines,
    ``,
    `Subtotal: ${cop(subtotal)}`,
    `Entrega: ${cop(delivery)}`,
    `Total: ${cop(total)}`,
    ``,
    `Pago`,
    `Modalidad de pago: ${paymentMethod}`,
    `Total a pagar: ${cop(total)}`,
    `Nequi / Llave: ${NEQUI_PHONE}`,
    ``,
    `Si pagas por transferencia, envianos el comprobante para confirmar el pedido.`,
    comments ? `` : null,
    comments ? `Comentarios adicionales:` : null,
    comments ? `${comments}` : null,
    ``,
    `Envíanos este mensaje ahora.`,
  ]
    .filter((line): line is string => line !== null && line !== undefined)
    .join("\n");
}
