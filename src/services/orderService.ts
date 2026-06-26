import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { PedidoFirestore, OrderFilters, OrderUpdate, CustomerLocation } from '../types/order';

const ORDERS_COLLECTION = 'pedidos';

export class OrderService {
  // Crear nuevo pedido
  static async createOrder(orderData: Omit<PedidoFirestore, 'createdAt' | 'updatedAt' | 'historialEstado'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const orderWithTimestamps = {
        ...orderData,
        createdAt: now,
        updatedAt: now,
        historialEstado: [{
          estado: orderData.estado,
          timestamp: now,
          nota: 'Pedido creado'
        }]
      };
      const docRef = await addDoc(collection(db, ORDERS_COLLECTION), orderWithTimestamps);
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Error al crear el pedido');
    }
  }

  // Obtener pedido por ID
  static async getOrder(orderId: string): Promise<PedidoFirestore | null> {
    try {
      const docRef = doc(db, ORDERS_COLLECTION, orderId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as PedidoFirestore & { id: string };
      }
      return null;
    } catch (error) {
      console.error('Error getting order:', error);
      throw new Error('Error al obtener el pedido');
    }
  }

  // Obtener todos los pedidos con filtros
  static async getOrders(filters: OrderFilters = {}): Promise<(PedidoFirestore & { id: string })[]> {
    try {
      const constraints: QueryConstraint[] = [];

      // Filtro por estado
      if (filters.estado && filters.estado !== 'todos') {
        constraints.push(where('estado', '==', filters.estado));
      }

      // Filtro por fecha
      if (filters.fechaDesde) {
        constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.fechaDesde)));
      }
      if (filters.fechaHasta) {
        const endDate = new Date(filters.fechaHasta);
        endDate.setHours(23, 59, 59, 999);
        constraints.push(where('createdAt', '<=', Timestamp.fromDate(endDate)));
      }

      const q = query(collection(db, ORDERS_COLLECTION), ...constraints);
      const querySnapshot = await getDocs(q);

      let orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (PedidoFirestore & { id: string })[];

      // Ordenar manualmente por fecha descendente (evita índice compuesto en Firestore)
      orders.sort((a, b) => {
        const getTime = (x: any) => {
          if (x?.toMillis) return x.toMillis();
          if (x?.toDate) return x.toDate().getTime();
          return 0;
        };
        return getTime(b.createdAt) - getTime(a.createdAt);
      });

      // Filtro por búsqueda (cliente, teléfono, número de orden)
      if (filters.busqueda) {
        const searchTerm = filters.busqueda.toLowerCase();
        orders = orders.filter(order =>
          order.cliente.nombres.toLowerCase().includes(searchTerm) ||
          order.cliente.celular.includes(searchTerm) ||
          order.numeroOrden.toLowerCase().includes(searchTerm)
        );
      }

      return orders;
    } catch (error) {
      console.error('Error getting orders:', error);
      throw new Error('Error al obtener los pedidos');
    }
  }

  // Actualizar pedido
  static async updateOrder(orderId: string, updates: OrderUpdate): Promise<void> {
    try {
      const orderRef = doc(db, ORDERS_COLLECTION, orderId);
      const now = Timestamp.now();
      
      // Si se está actualizando el estado, agregar al historial
      if (updates.estado) {
        const orderDoc = await getDoc(orderRef);
        if (orderDoc.exists()) {
          const currentOrder = orderDoc.data() as PedidoFirestore;
          const newHistoryEntry = {
            estado: updates.estado,
            timestamp: now,
            nota: updates.notaAdmin || `Estado cambiado a ${updates.estado}`
          };
          
          updates.historialEstado = [
            ...(currentOrder.historialEstado || []),
            newHistoryEntry
          ];
        }
      }
      
      await updateDoc(orderRef, {
        ...updates,
        updatedAt: now
      });
    } catch (error) {
      console.error('Error updating order:', error);
      throw new Error('Error al actualizar el pedido');
    }
  }

  // Actualizar ubicación en tiempo real del cliente
  static async updateCustomerLocation(orderId: string, location: CustomerLocation): Promise<void> {
    try {
      const docRef = doc(db, ORDERS_COLLECTION, orderId);
      const currentOrder = await this.getOrder(orderId);
      
      if (currentOrder) {
        const ubicacionTiempoReal = currentOrder.cliente.ubicacionTiempoReal || [];
        
        // Mantener solo las últimas 50 ubicaciones para evitar documentos muy grandes
        const updatedLocations = [...ubicacionTiempoReal, location].slice(-50);
        
        await updateDoc(docRef, {
          'cliente.coordenadas': location,
          'cliente.ubicacionTiempoReal': updatedLocations,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error updating customer location:', error);
      throw new Error('Error al actualizar la ubicación');
    }
  }

  // Eliminar pedido
  static async deleteOrder(orderId: string): Promise<void> {
    try {
      const docRef = doc(db, ORDERS_COLLECTION, orderId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting order:', error);
      throw new Error('Error al eliminar el pedido');
    }
  }

  // Escuchar cambios en tiempo real
  static subscribeToOrders(
    callback: (orders: (PedidoFirestore & { id: string })[]) => void,
    filters: OrderFilters = {},
    onError?: (error: Error) => void
  ): () => void {
    const constraints: QueryConstraint[] = [];

    if (filters.estado && filters.estado !== 'todos') {
      constraints.push(where('estado', '==', filters.estado));
    }

    const q = query(collection(db, ORDERS_COLLECTION), ...constraints);

    return onSnapshot(q, (querySnapshot) => {
      let orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (PedidoFirestore & { id: string })[];

      // Ordenar manualmente por fecha descendente (evita índice compuesto en Firestore)
      orders.sort((a, b) => {
        const getTime = (x: any) => {
          if (x?.toMillis) return x.toMillis();
          if (x?.toDate) return x.toDate().getTime();
          return 0;
        };
        return getTime(b.createdAt) - getTime(a.createdAt);
      });

      // Aplicar filtro de búsqueda si existe
      if (filters.busqueda) {
        const searchTerm = filters.busqueda.toLowerCase();
        orders = orders.filter(order =>
          order.cliente.nombres.toLowerCase().includes(searchTerm) ||
          order.cliente.celular.includes(searchTerm) ||
          order.numeroOrden.toLowerCase().includes(searchTerm)
        );
      }

      callback(orders);
    }, (error) => {
      console.error('Error in orders subscription:', error);
      if (onError) onError(error);
    });
  }

  // Escuchar cambios de un pedido específico
  static subscribeToOrder(
    orderId: string,
    callback: (order: (PedidoFirestore & { id: string }) | null) => void
  ): () => void {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as PedidoFirestore & { id: string });
      } else {
        callback(null);
      }
    });
  }

  // Generar número de orden único
  static generateOrderNumber(): string {
    const now = new Date();
    const timestamp = now.getTime();
    return `PP-${timestamp}`;
  }

  // Obtener estadísticas básicas
  static async getOrderStats(): Promise<{
    total: number;
    noPagado: number;
    pagado: number;
    preparando: number;
    enCamino: number;
    entregado: number;
    cancelado: number;
  }> {
    try {
      const orders = await this.getOrders();
      
      const stats = {
        total: orders.length,
        noPagado: 0,
        pagado: 0,
        preparando: 0,
        enCamino: 0,
        entregado: 0,
        cancelado: 0
      };

      orders.forEach(order => {
        switch (order.estado) {
          case 'no_pagado':
            stats.noPagado++;
            break;
          case 'pagado':
            stats.pagado++;
            break;
          case 'preparando':
            stats.preparando++;
            break;
          case 'en_camino':
            stats.enCamino++;
            break;
          case 'entregado':
            stats.entregado++;
            break;
          case 'cancelado':
            stats.cancelado++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting order stats:', error);
      throw new Error('Error al obtener estadísticas');
    }
  }
}
