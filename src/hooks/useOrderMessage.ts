import { useCallback } from "react";

import type { Barrio } from "../data/barrios";
import type { OrderItem, PaymentMethod, Service } from "../lib/whatsapp";
import { buildCode, buildWhatsAppMessage, waLink } from "../lib/whatsapp";
import { EXTRAS } from "../data/extras";
import { TOPPINGS } from "../data/toppings";
import { WHATSAPP_PHONE } from "../data/constants";

type Params = {
  name: string;
  phone: string;
  service: Service;
  barrio: Barrio | null;
  address: string;
  reference: string;
  paymentMethod: PaymentMethod;
  comments: string;
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  total: number;
  destination?: string;
  locationLink?: string;
  descuentoTotal?: number;
  appliedPromotions?: { nombre: string; descuento: number }[];
};

export function useOrderMessage(params: Params) {
  const {
    name,
    phone,
    service,
    barrio,
    address,
    reference,
    paymentMethod,
    comments,
    items,
    subtotal,
    delivery,
    total,
    destination = `57${WHATSAPP_PHONE}`,
    locationLink,
    descuentoTotal = 0,
    appliedPromotions = [],
  } = params;

  const openWhatsApp = useCallback(() => {
    const canSend = Boolean(name.trim() && phone.trim() && items.length && subtotal > 0);
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
      locationLink,
      descuentoTotal,
      appliedPromotions,
    });

    window.open(waLink(destination, message), "_blank");
  }, [
    name,
    phone,
    service,
    barrio,
    address,
    reference,
    paymentMethod,
    comments,
    items,
    subtotal,
    delivery,
    total,
    destination,
    locationLink,
    descuentoTotal,
    appliedPromotions,
  ]);

  return { openWhatsApp };
}
