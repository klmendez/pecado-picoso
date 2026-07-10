import { useMemo } from "react";

import type { Barrio } from "../data/barrios";
import { EXTRAS } from "../data/extras";
import type { OrderItem, Service } from "../lib/whatsapp";
import { deliveryCost, extrasTotal, getBasePrice } from "../lib/pricing";
import { maxToppingsFor } from "../components/armar-pedido/utils";
import type { Promotion, AppliedPromotion } from "../types/promotion";
import { BIRTHDAY_DISCOUNT_PERCENT } from "../data/constants";
import { isBirthdayToday } from "../lib/birthday";

export type ChecklistItem = {
  id: "products" | "config" | "customer" | "delivery" | "total";
  label: string;
  ok: boolean;
};

export type OrderValidationSnapshot = {
  itemsOk: boolean;
  itemsConfigOk: boolean;
  customerOk: boolean;
  deliveryOk: boolean;
  subtotalOk: boolean;
};

type Params = {
  items: OrderItem[];
  service: Service;
  barrio: Barrio | null;
  address: string;
  name: string;
  phone: string;
  promotions?: (Promotion & { id: string })[];
  birthdayKey?: string | null;
};

type Result = {
  pricedItems: (OrderItem & {
    baseUnit: number;
    extrasUnit: number;
    unit: number;
    line: number;
  })[];
  subtotal: number;
  delivery: number;
  total: number;
  descuentoTotal: number;
  totalConDescuento: number;
  appliedPromotions: AppliedPromotion[];
  checklist: ChecklistItem[];
  validation: OrderValidationSnapshot;
  canSend: boolean;
  sendDisabledHint: string;
};

export function useOrderPricingValidation({ items, service, barrio, address, name, phone, promotions = [], birthdayKey = null }: Params): Result {
  const pricedItems = useMemo(() => {
    return items.map((it) => {
      const baseUnit = getBasePrice(
        it.product,
        it.product.category === "gomitas" ? it.version : null,
        it.size,
      );
      const extrasUnit = extrasTotal(it.extrasQty, EXTRAS);
      const unit = baseUnit + extrasUnit;
      const line = unit * it.qty;
      return { ...it, baseUnit, extrasUnit, unit, line };
    });
  }, [items]);

  const subtotal = useMemo(() => pricedItems.reduce((sum, it) => sum + it.line, 0), [pricedItems]);
  const delivery = useMemo(() => deliveryCost(service, barrio), [service, barrio]);

  const { descuentoTotal, appliedPromotions } = useMemo(() => {
    if (!pricedItems.length) return { descuentoTotal: 0, appliedPromotions: [] as AppliedPromotion[] };

    const applied: AppliedPromotion[] = [];
    let totalDiscount = 0;

    if (isBirthdayToday(birthdayKey)) {
      const itemsSubtotal = pricedItems.reduce((s, it) => s + it.line, 0);
      const discount = Math.round(itemsSubtotal * BIRTHDAY_DISCOUNT_PERCENT / 100);
      if (discount > 0) {
        totalDiscount += discount;
        applied.push({
          promoId: "birthday",
          nombre: `🎂 Descuento de cumpleaños (${BIRTHDAY_DISCOUNT_PERCENT}%)`,
          tipo: "porcentaje",
          valor: BIRTHDAY_DISCOUNT_PERCENT,
          descuento: discount,
        });
      }
    }

    for (const promo of promotions) {
      if (!promo.activa) continue;
      const targetItems = promo.productosIds?.length
        ? pricedItems.filter(it => promo.productosIds.includes(it.product.id))
        : pricedItems;

      if (!targetItems.length) continue;

      if (promo.cantidadMinima) {
        const totalQty = targetItems.reduce((s, it) => s + it.qty, 0);
        if (totalQty < promo.cantidadMinima) continue;
      }

      let discount = 0;
      if (promo.tipo === 'porcentaje') {
        const itemsSubtotal = targetItems.reduce((s, it) => s + it.line, 0);
        discount = Math.round(itemsSubtotal * promo.valor / 100);
      } else if (promo.tipo === 'valor_fijo') {
        discount = promo.valor;
      } else if (promo.tipo === '2x1') {
        // For each pair, discount the cheapest
        for (const it of targetItems) {
          const freeItems = Math.floor(it.qty / 2);
          if (freeItems > 0) discount += it.unit * freeItems;
        }
      }

      if (discount > 0) {
        totalDiscount += discount;
        applied.push({
          promoId: promo.id,
          nombre: promo.nombre,
          tipo: promo.tipo,
          valor: promo.valor,
          descuento: discount,
        });
      }
    }

    return { descuentoTotal: totalDiscount, appliedPromotions: applied };
  }, [pricedItems, promotions, birthdayKey]);

  const total = subtotal + delivery - descuentoTotal;
  const totalConDescuento = total;

  const validation = useMemo<OrderValidationSnapshot>(() => {
    const itemsOk = items.length > 0;

    let itemsConfigOk = true;
    for (const it of items) {
      const p = it.product;
      const max = maxToppingsFor(p);

      if (p.category === "gomitas") {
        if (!it.version) {
          itemsConfigOk = false;
          break;
        }
        if (max > 0 && (it.toppingIds.length < 1 || it.toppingIds.length > max)) {
          itemsConfigOk = false;
          break;
        }
        continue;
      }

      if (p.category === "frutafresh" && it.toppingIds.length > max) {
        itemsConfigOk = false;
        break;
      }
    }

    const customerOk = Boolean(name.trim() && phone.trim());
    const deliveryOk = service !== "domicilio" || Boolean(barrio && address.trim());
    const subtotalOk = subtotal > 0;

    return { itemsOk, itemsConfigOk, customerOk, deliveryOk, subtotalOk };
  }, [items, name, phone, service, barrio, address, subtotal]);

  const checklist = useMemo<ChecklistItem[]>(() => {
    return [
      { id: "products", label: "Agrega productos", ok: validation.itemsOk },
      { id: "config", label: "Configura tus productos", ok: validation.itemsConfigOk },
      { id: "customer", label: "Datos de contacto", ok: validation.customerOk },
      { id: "delivery", label: "Datos de entrega", ok: validation.deliveryOk },
      { id: "total", label: "Total mayor a $0", ok: validation.subtotalOk },
    ];
  }, [validation]);

  const pending = checklist.filter((item) => !item.ok);
  const canSend = pending.length === 0;
  const sendDisabledHint = pending.length
    ? `Completa: ${pending.map((item) => item.label.toLowerCase()).join(", ")}.`
    : "";

  return {
    pricedItems,
    subtotal,
    delivery,
    total,
    descuentoTotal,
    totalConDescuento,
    appliedPromotions,
    checklist,
    validation,
    canSend,
    sendDisabledHint,
  };
}
