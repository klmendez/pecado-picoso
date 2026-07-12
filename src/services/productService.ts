import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type PriceType = 'fijo' | 'porSize' | 'porVersion';

export interface FirestoreProduct {
  id?: string;
  name: string;
  description: string;
  price?: number; // legacy / simple
  priceType?: PriceType;
  priceOptions?: {
    fijo?: number;
    porSize?: { pequeno?: number; mediano?: number; grande?: number };
    porVersion?: {
      ahogada?: { pequeno?: number; mediano?: number; grande?: number };
      picosa?: { pequeno?: number; mediano?: number; grande?: number };
    };
  };
  toppingsIncludedMax?: number;
  sizes?: string[];
  categoryId: string;
  image?: string;
  disponible?: boolean; // false = desactivado por el admin
  createdAt?: any;
}

export const ProductService = {
  async getProducts(): Promise<FirestoreProduct[]> {
    if (!db) throw new Error('Firebase no inicializado');
    const snap = await getDocs(collection(db, 'productos'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreProduct));
  },

  async addProduct(data: Omit<FirestoreProduct, 'id'>): Promise<void> {
    if (!db) throw new Error('Firebase no inicializado');
    await addDoc(collection(db, 'productos'), { ...data, createdAt: new Date() });
  },

  async updateProduct(id: string, data: Partial<FirestoreProduct>): Promise<void> {
    if (!db) throw new Error('Firebase no inicializado');
    await updateDoc(doc(db, 'productos', id), data);
  },

  async deleteProduct(id: string): Promise<void> {
    if (!db) throw new Error('Firebase no inicializado');
    await deleteDoc(doc(db, 'productos', id));
  }
};
