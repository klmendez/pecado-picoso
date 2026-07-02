import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const CLIENTS_COLLECTION = 'clientes';

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
  }): Promise<void> {
    try {
      const cleanPhone = data.celular.replace(/\D/g, '');
      if (!cleanPhone) return;

      const docRef = doc(db, CLIENTS_COLLECTION, cleanPhone);
      const docSnap = await getDoc(docRef);
      const now = Timestamp.now();

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
            direcciones.push({
              direccion: data.direccion.trim(),
              barrio: data.barrio,
              referencia: data.referencia,
              lastUsed: now
            });
          }
        }

        await setDoc(docRef, {
          ...existing,
          nombres: data.nombres || existing.nombres,
          direcciones,
          totalPedidos: (existing.totalPedidos || 0) + 1,
          totalGastado: (existing.totalGastado || 0) + data.totalPedido,
          ultimoPedido: now,
          updatedAt: now
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

        await setDoc(docRef, {
          celular: cleanPhone,
          nombres: data.nombres,
          direcciones,
          totalPedidos: 1,
          totalGastado: data.totalPedido,
          ultimoPedido: now,
          createdAt: now,
          updatedAt: now
        });
      }
    } catch (error) {
      console.error('Error upserting client:', error);
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
