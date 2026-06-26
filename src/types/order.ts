import type { Timestamp } from 'firebase/firestore';
import type { OrderItem, PaymentMethod, Service } from '../lib/whatsapp';

export interface CustomerLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

export interface CustomerInfo {
  nombres: string;
  celular: string;
  direccion: string;
  coordenadas?: CustomerLocation;
  mapsLink?: string;
  ubicacionTiempoReal?: CustomerLocation[];
}

export type OrderStatus = 'no_pagado' | 'pagado' | 'preparando' | 'en_camino' | 'entregado' | 'cancelado';

export interface PedidoFirestore {
  numeroOrden: string;
  
  // Productos del carrito
  items: OrderItem[];
  total: number;
  subtotal: number;
  delivery: number;
  
  // Datos del cliente
  cliente: CustomerInfo;
  
  // Configuración del pedido
  formaPago: PaymentMethod;
  servicio: Service;
  estado: OrderStatus;
  
  // Metadatos
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Notas internas del admin
  notaAdmin?: string;
  
  // Historial de cambios de estado
  historialEstado?: {
    estado: OrderStatus;
    timestamp: Timestamp;
    nota?: string;
  }[];
}

export interface OrderFilters {
  estado?: OrderStatus | 'todos';
  fechaDesde?: Date;
  fechaHasta?: Date;
  busqueda?: string;
}

export interface OrderUpdate {
  cliente?: Partial<CustomerInfo>;
  items?: OrderItem[];
  formaPago?: PaymentMethod;
  servicio?: Service;
  estado?: OrderStatus;
  notaAdmin?: string;
  total?: number;
  subtotal?: number;
  delivery?: number;
  historialEstado?: {
    estado: OrderStatus;
    timestamp: any;
    nota?: string;
  }[];
}
