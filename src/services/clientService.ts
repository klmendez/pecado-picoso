import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  deleteDoc,
  updateDoc,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { PedidoFirestore } from '../types/order';

const CLIENTS_COLLECTION = 'clientes';
const ORDERS_COLLECTION = 'pedidos';

export interface ClientAddress {
  direccion: string;
  barrio?: string;
  referencia?: string;
  lastUsed: Timestamp;
}

export interface FirestoreClient {
  id?: string;
  celular: string;
  nombres: string;
  direcciones: ClientAddress[];
  totalPedidos: number;
  totalGastado: number;
  ultimoPedido: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  fechaNacimiento?: string; // formato "MM-DD"
  correo?: string;
  notaAdmin?: string;
  etiquetas?: string[];
}

export class ClientService {
  // Buscar cliente por teléfono
  static async getClientByPhone(phone: string): Promise<FirestoreClient | null> {
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      if (!cleanPhone) return null;

      const docRef = doc(db, CLIENTS_COLLECTION, cleanPhone);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as FirestoreClient;
      }
      return null;
    } catch (error) {
      console.error('Error getting client:', error);
      return null;
    }
  }

  // Crear o actualizar cliente al hacer un pedido
  static async upsertClient(data: {
    celular: string;
    nombres: string;
    direccion?: string;
    barrio?: string;
    referencia?: string;
    totalPedido: number;
    fechaNacimiento?: string;
    correo?: string;
  }): Promise<void> {
    try {
      const cleanPhone = data.celular.replace(/\D/g, '');
      if (!cleanPhone) return;

      const docRef = doc(db, CLIENTS_COLLECTION, cleanPhone);
      const now = Timestamp.now();

      // Transacción atómica: evita que dos pedidos casi simultáneos del mismo
      // teléfono se pisen entre sí (uno leía el estado viejo y sobreescribía
      // lo que el otro acababa de guardar).
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);

        if (docSnap.exists()) {
          // Cliente existente: actualizar
          const existing = docSnap.data() as FirestoreClient;
          const direcciones = [...(existing.direcciones || [])];

          // Agregar dirección solo si no existe (evitar duplicados)
          if (data.direccion && data.direccion.trim()) {
            const existingAddr = direcciones.find(
              d => d.direccion.toLowerCase().trim() === data.direccion!.toLowerCase().trim()
            );
            if (existingAddr) {
              // Si ya existe, solo actualizar lastUsed
              existingAddr.lastUsed = now;
              if (data.barrio) existingAddr.barrio = data.barrio;
              if (data.referencia) existingAddr.referencia = data.referencia;
            } else {
              // Si no existe, agregar nueva dirección
              const newAddr: ClientAddress = {
                direccion: data.direccion.trim(),
                lastUsed: now
              };
              if (data.barrio) newAddr.barrio = data.barrio;
              if (data.referencia) newAddr.referencia = data.referencia;
              direcciones.push(newAddr);
            }
          }

          transaction.set(docRef, {
            ...existing,
            nombres: data.nombres || existing.nombres,
            direcciones,
            totalPedidos: (existing.totalPedidos || 0) + 1,
            totalGastado: (existing.totalGastado || 0) + data.totalPedido,
            ultimoPedido: now,
            updatedAt: now,
            fechaNacimiento: data.fechaNacimiento || existing.fechaNacimiento || null,
            correo: data.correo || existing.correo || null,
          });
        } else {
          // Cliente nuevo: crear
          const direcciones: ClientAddress[] = [];
          if (data.direccion && data.direccion.trim()) {
            const newAddr: ClientAddress = {
              direccion: data.direccion.trim(),
              lastUsed: now
            };
            if (data.barrio) newAddr.barrio = data.barrio;
            if (data.referencia) newAddr.referencia = data.referencia;
            direcciones.push(newAddr);
          }

          transaction.set(docRef, {
            celular: cleanPhone,
            nombres: data.nombres,
            direcciones,
            totalPedidos: 1,
            totalGastado: data.totalPedido,
            ultimoPedido: now,
            createdAt: now,
            updatedAt: now,
            fechaNacimiento: data.fechaNacimiento || null,
            correo: data.correo || null,
          });
        }
      });
    } catch (error) {
      console.error('Error upserting client:', error);
    }
  }

  // Crear cliente manualmente desde el admin (sin que haya hecho un pedido aún)
  static async createManualClient(data: {
    celular: string;
    nombres: string;
    fechaNacimiento?: string;
    correo?: string;
    notaAdmin?: string;
    etiquetas?: string[];
  }): Promise<void> {
    const cleanPhone = data.celular.replace(/\D/g, '');
    if (!cleanPhone) throw new Error('Teléfono inválido');

    const docRef = doc(db, CLIENTS_COLLECTION, cleanPhone);
    const existing = await getDoc(docRef);
    if (existing.exists()) throw new Error('Ya existe un cliente con ese teléfono');

    const now = Timestamp.now();
    await runTransaction(db, async (transaction) => {
      transaction.set(docRef, {
        celular: cleanPhone,
        nombres: data.nombres,
        direcciones: [],
        totalPedidos: 0,
        totalGastado: 0,
        ultimoPedido: now,
        createdAt: now,
        updatedAt: now,
        fechaNacimiento: data.fechaNacimiento || null,
        correo: data.correo || null,
        notaAdmin: data.notaAdmin || null,
        etiquetas: data.etiquetas || [],
      });
    });
  }

  // Editar datos de un cliente desde el admin. Si el teléfono cambia, migra
  // el documento a la nueva clave (el celular es el ID del documento).
  static async updateClient(
    currentPhone: string,
    patch: {
      celular?: string;
      nombres?: string;
      fechaNacimiento?: string | null;
      correo?: string | null;
      notaAdmin?: string | null;
      etiquetas?: string[];
    }
  ): Promise<void> {
    const cleanCurrent = currentPhone.replace(/\D/g, '');
    const cleanNext = patch.celular ? patch.celular.replace(/\D/g, '') : cleanCurrent;
    if (!cleanNext) throw new Error('Teléfono inválido');

    const currentRef = doc(db, CLIENTS_COLLECTION, cleanCurrent);
    const nextRef = doc(db, CLIENTS_COLLECTION, cleanNext);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      const currentSnap = await transaction.get(currentRef);
      if (!currentSnap.exists()) throw new Error('El cliente ya no existe');
      const existing = currentSnap.data() as FirestoreClient;

      if (cleanNext !== cleanCurrent) {
        const nextSnap = await transaction.get(nextRef);
        if (nextSnap.exists()) throw new Error('Ya existe otro cliente con ese teléfono');
      }

      const updated: any = {
        ...existing,
        celular: cleanNext,
        nombres: patch.nombres ?? existing.nombres,
        fechaNacimiento: patch.fechaNacimiento !== undefined ? (patch.fechaNacimiento || null) : (existing.fechaNacimiento || null),
        correo: patch.correo !== undefined ? (patch.correo || null) : (existing.correo || null),
        notaAdmin: patch.notaAdmin !== undefined ? (patch.notaAdmin || null) : (existing.notaAdmin || null),
        etiquetas: patch.etiquetas ?? existing.etiquetas ?? [],
        updatedAt: now,
      };

      if (cleanNext !== cleanCurrent) {
        transaction.delete(currentRef);
      }
      transaction.set(nextRef, updated);
    });

    // Los pedidos guardan el teléfono como una foto del momento en que se
    // crearon (no una referencia viva al cliente). Si el teléfono cambió,
    // hay que corregirlo también ahí para que WhatsApp, filtros, etc.
    // sigan apuntando al número correcto.
    if (cleanNext !== cleanCurrent) {
      await this.reassignOrdersPhone(cleanCurrent, cleanNext);
    }
  }

  // Actualiza 'cliente.celular' en todos los pedidos que tenían el teléfono
  // anterior, para que queden apuntando al nuevo. Best-effort: si falla, el
  // cliente ya quedó actualizado, solo el historial de pedidos no se corrigió.
  private static async reassignOrdersPhone(oldPhone: string, newPhone: string): Promise<void> {
    try {
      const ordersRef = collection(db, ORDERS_COLLECTION);
      const q = query(ordersRef, where('cliente.celular', '==', oldPhone));
      const snap = await getDocs(q);
      if (snap.empty) return;

      const batch = writeBatch(db);
      snap.docs.forEach((d) => {
        batch.update(d.ref, { 'cliente.celular': newPhone, updatedAt: Timestamp.now() });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error reasignando el teléfono en los pedidos:', error);
    }
  }

  // Eliminar un cliente (no borra sus pedidos históricos, solo el registro de cliente)
  static async deleteClient(phone: string): Promise<void> {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) return;
    await deleteDoc(doc(db, CLIENTS_COLLECTION, cleanPhone));
  }

  // Fusiona los datos de "mergePhone" dentro de "keepPhone", elimina "mergePhone"
  // y reasigna los pedidos históricos del duplicado al teléfono que se conserva.
  static async mergeClients(keepPhone: string, mergePhone: string): Promise<void> {
    const cleanKeep = keepPhone.replace(/\D/g, '');
    const cleanMerge = mergePhone.replace(/\D/g, '');
    if (!cleanKeep || !cleanMerge || cleanKeep === cleanMerge) {
      throw new Error('Selecciona dos clientes distintos para fusionar');
    }

    const keepRef = doc(db, CLIENTS_COLLECTION, cleanKeep);
    const mergeRef = doc(db, CLIENTS_COLLECTION, cleanMerge);

    await runTransaction(db, async (transaction) => {
      const keepSnap = await transaction.get(keepRef);
      const mergeSnap = await transaction.get(mergeRef);
      if (!keepSnap.exists() || !mergeSnap.exists()) {
        throw new Error('Uno de los dos clientes ya no existe');
      }

      const keep = keepSnap.data() as FirestoreClient;
      const merge = mergeSnap.data() as FirestoreClient;

      const direcciones = [...(keep.direcciones || [])];
      for (const addr of merge.direcciones || []) {
        const exists = direcciones.some(
          d => d.direccion.toLowerCase().trim() === addr.direccion.toLowerCase().trim()
        );
        if (!exists) direcciones.push(addr);
      }

      const etiquetas = Array.from(new Set([...(keep.etiquetas || []), ...(merge.etiquetas || [])]));

      const notas = [keep.notaAdmin, merge.notaAdmin].filter(Boolean).join(' | ') || null;

      const keepUltimo = keep.ultimoPedido?.toMillis ? keep.ultimoPedido.toMillis() : 0;
      const mergeUltimo = merge.ultimoPedido?.toMillis ? merge.ultimoPedido.toMillis() : 0;
      const keepCreated = keep.createdAt?.toMillis ? keep.createdAt.toMillis() : 0;
      const mergeCreated = merge.createdAt?.toMillis ? merge.createdAt.toMillis() : 0;

      transaction.set(keepRef, {
        ...keep,
        direcciones,
        totalPedidos: (keep.totalPedidos || 0) + (merge.totalPedidos || 0),
        totalGastado: (keep.totalGastado || 0) + (merge.totalGastado || 0),
        ultimoPedido: mergeUltimo > keepUltimo ? merge.ultimoPedido : keep.ultimoPedido,
        createdAt: mergeCreated && (mergeCreated < keepCreated || !keepCreated) ? merge.createdAt : keep.createdAt,
        fechaNacimiento: keep.fechaNacimiento || merge.fechaNacimiento || null,
        correo: keep.correo || merge.correo || null,
        notaAdmin: notas,
        etiquetas,
        updatedAt: Timestamp.now(),
      });

      transaction.delete(mergeRef);
    });

    await this.reassignOrdersPhone(cleanMerge, cleanKeep);
  }

  // Recalcula pedidos/gastado/última compra de un cliente a partir de su
  // historial real de pedidos. Se usa después de eliminar o editar un pedido,
  // para que las estadísticas del cliente no queden desfasadas.
  static async syncClientStats(phone: string, orders: (PedidoFirestore & { id: string })[]): Promise<void> {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) return;

    try {
      const docRef = doc(db, CLIENTS_COLLECTION, cleanPhone);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return; // no hay registro de cliente que sincronizar

      const totalPedidos = orders.length;
      const totalGastado = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const ultimoPedido = orders.reduce<Timestamp | null>((latest, o) => {
        if (!o.createdAt?.toMillis) return latest;
        if (!latest || o.createdAt.toMillis() > latest.toMillis()) return o.createdAt;
        return latest;
      }, null);

      await updateDoc(docRef, {
        totalPedidos,
        totalGastado,
        ...(ultimoPedido ? { ultimoPedido } : {}),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error syncing client stats:', error);
    }
  }

  // Obtener todos los clientes
  static async getAllClients(): Promise<FirestoreClient[]> {
    try {
      const q = query(collection(db, CLIENTS_COLLECTION));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreClient[];
    } catch (error) {
      console.error('Error getting clients:', error);
      return [];
    }
  }

  // Buscar clientes por nombre o teléfono
  static async searchClients(term: string): Promise<FirestoreClient[]> {
    try {
      const all = await this.getAllClients();
      const lower = term.toLowerCase();
      return all.filter(c =>
        c.nombres.toLowerCase().includes(lower) ||
        c.celular.includes(term.replace(/\D/g, ''))
      );
    } catch (error) {
      console.error('Error searching clients:', error);
      return [];
    }
  }
}
