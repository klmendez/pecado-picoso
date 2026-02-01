import { useCallback, useMemo, useReducer } from "react";

import type { Product } from "../data/products";
import type { OrderItem } from "../lib/whatsapp";
import { defaultSize } from "../components/armar-pedido/utils";

type OrderItemsAction =
  | { type: "toggle"; product: Product }
  | { type: "update"; productId: string; patch: Partial<OrderItem> }
  | { type: "setQty"; productId: string; qty: number };

type State = OrderItem[];

function createItem(product: Product): OrderItem {
  return {
    product,
    qty: 1,
    version: product.category === "gomitas" ? null : null,
    size: defaultSize(product),
    toppingIds: [],
    extrasQty: {},
  };
}

function reducer(state: State, action: OrderItemsAction): State {
  switch (action.type) {
    case "toggle": {
      const idx = state.findIndex((it) => it.product.id === action.product.id);
      if (idx >= 0) {
        const next = [...state];
        next.splice(idx, 1);
        return next;
      }
      return [...state, createItem(action.product)];
    }
    case "update": {
      return state.map((it) => (it.product.id === action.productId ? { ...it, ...action.patch } : it));
    }
    case "setQty": {
      return state
        .map((it) => (it.product.id === action.productId ? { ...it, qty: action.qty } : it))
        .filter((it) => it.qty > 0);
    }
    default:
      return state;
  }
}

export function useOrderItems(initialItems: OrderItem[] = []) {
  const [items, dispatch] = useReducer(reducer, initialItems);

  const toggleProduct = useCallback((product: Product) => {
    dispatch({ type: "toggle", product });
  }, []);

  const updateItem = useCallback((productId: string, patch: Partial<OrderItem>) => {
    dispatch({ type: "update", productId, patch });
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    dispatch({ type: "setQty", productId, qty });
  }, []);

  const selectedIds = useMemo(() => items.map((it) => it.product.id), [items]);

  return {
    items,
    selectedIds,
    toggleProduct,
    updateItem,
    updateQty,
  };
}
