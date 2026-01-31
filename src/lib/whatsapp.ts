import { NEQUI_PHONE } from "../data/constants";
import type { Product } from "../data/products";
import { cop } from "./format";

export function buildCode() {
  const d = new Date();
  const y = String(d.getFullYear()).slice(2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PP-${y}${m}${day}-${rnd}`;
}

export type PaymentMethod = "Transferencia" | "Efectivo";

export function buildWhatsAppMessage(args: {
  origin: string;
  code: string;
  name: string;
  phone: string;
  serviceLabel: string;
  barrioLine?: string;
  addressLine?: string;
  product: Product;
  detailLine: string;
  toppingsLine?: string;
  extrasLine?: string;
  subtotal: number;
  delivery: number;
  total: number;
  paymentMethod: PaymentMethod;
  comments?: string;
}) {
  const {
    origin,
    code,
    name,
    phone,
    serviceLabel,
    barrioLine,
    addressLine,
    product,
    detailLine,
    toppingsLine,
    extrasLine,
    subtotal,
    delivery,
    total,
    paymentMethod,
    comments,
  } = args;

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
    `X1 ${product.name}${detailLine ? " - " + detailLine : ""}  ${cop(subtotal)}`,
    toppingsLine ? `  Toppings (incluidos): ${toppingsLine}` : null,
    extrasLine ? `  Extras: ${extrasLine}` : null,
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
    .filter(Boolean)
    .join("\n");
}

/**
 * API oficial de WhatsApp (como pediste)
 */
export function waLink(whatsPhone: string, text: string) {
  const clean = whatsPhone.replace(/\D/g, "");
  return `https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(text)}`;
}
