import { useCallback, useMemo, useReducer } from "react";

import type { Product } from "../data/products";
import type { OrderItem } from "../lib/whatsapp";
import { defaultSize } from "../components/armar-pedido/utils";

type OrderItemsAction =
  | { type: "add"; item: OrderItem }
  | { type: "remove"; itemId: string }
  | { type: "removeLastOfProduct"; productId: string }
  | { type: "duplicate"; itemId: string }
  | { type: "update"; itemId: string; patch: Partial<OrderItem> };

type State = OrderItem[];

function createOrderItemId() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createItem(product: Product): OrderItem {
  return {
    id: createOrderItemId(),
    product,
    qty: 1,
    version: product.category === "gomitas" ? "ahogada" : null,
    size: defaultSize(product),
    toppingIds: [],
    extrasQty: {},
    extraSelections: {},
  };
}

function reducer(state: State, action: OrderItemsAction): State {
  switch (action.type) {
    case "add": {
      return [...state, action.item];
    }
    case "remove": {
      return state.filter((it) => it.id !== action.itemId);
    }
    case "removeLastOfProduct": {
      const lastIdx = state.map((it) => it.product.id).lastIndexOf(action.productId);
      if (lastIdx === -1) return state;
      return [...state.slice(0, lastIdx), ...state.slice(lastIdx + 1)];
    }
    case "duplicate": {
      const idx = state.findIndex((it) => it.id === action.itemId);
      if (idx === -1) return state;
      const source = state[idx];
      const duplicated: OrderItem = {
        ...source,
        id: createOrderItemId(),
        qty: 1,
        toppingIds: [...source.toppingIds],
        extrasQty: { ...source.extrasQty },
        extraSelections: Object.fromEntries(
          Object.entries(source.extraSelections).map(([key, value]) => [key, [...value]]),
        ),
      };
      const next = [...state];
      next.splice(idx + 1, 0, duplicated);
      return next;
    }
    case "update": {
      return state.map((it) => (it.id === action.itemId ? { ...it, ...action.patch } : it));
    }
    default:
      return state;
  }
}

export function useOrderItems(initialItems: OrderItem[] = []) {
  const [items, dispatch] = useReducer(reducer, initialItems);

  const addProduct = useCallback((product: Product) => {
    const item = createItem(product);
    dispatch({ type: "add", item });
    return item.id;
  }, []);

  const updateItem = useCallback((itemId: string, patch: Partial<OrderItem>) => {
    dispatch({ type: "update", itemId, patch });
  }, []);

  const duplicateItem = useCallback((itemId: string) => {
    dispatch({ type: "duplicate", itemId });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    dispatch({ type: "remove", itemId });
  }, []);

  const removeLastOfProduct = useCallback((productId: string) => {
    dispatch({ type: "removeLastOfProduct", productId });
  }, []);

  const selectedIds = useMemo(() => [...new Set(items.map((it) => it.product.id))], [items]);
  const selectedCountByProduct = useMemo(
    () =>
      items.reduce<Record<string, number>>((acc, item) => {
        acc[item.product.id] = (acc[item.product.id] ?? 0) + 1;
        return acc;
      }, {}),
    [items],
  );

  return {
    items,
    selectedIds,
    selectedCountByProduct,
    addProduct,
    updateItem,
    duplicateItem,
    removeItem,
    removeLastOfProduct,
  };
}
