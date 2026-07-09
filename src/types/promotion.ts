import type { Timestamp } from 'firebase/firestore';

export type PromotionType = 'porcentaje' | 'valor_fijo' | '2x1' | 'combo';

export interface Promotion {
  id?: string;
  nombre: string;
  descripcion?: string;
  tipo: PromotionType;
  // Para porcentaje: valor entre 1-100. Para valor_fijo: monto en pesos.
  valor: number;
  // IDs de productos a los que aplica. Vacío = aplica a todos.
  productosIds: string[];
  // Cantidad mínima para activar (ej: 2x1 requiere 2)
  cantidadMinima?: number;
  activa: boolean;
  fechaInicio?: Timestamp;
  fechaFin?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Datos de la promoción aplicada que se guardan en el pedido
export interface AppliedPromotion {
  promoId: string;
  nombre: string;
  tipo: PromotionType;
  valor: number;
  descuento: number; // Monto total descontado
}
