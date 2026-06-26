import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface FirestoreCategory {
  id?: string;
  name: string;
  description?: string;
  image?: string;
  createdAt?: any;
}

export const CategoryService = {
  async getCategories(): Promise<FirestoreCategory[]> {
    if (!db) throw new Error('Firebase no inicializado');
    const snap = await getDocs(collection(db, 'categorias'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreCategory));
  },

  async addCategory(data: Omit<FirestoreCategory, 'id'>): Promise<void> {
    if (!db) throw new Error('Firebase no inicializado');
    await addDoc(collection(db, 'categorias'), { ...data, createdAt: new Date() });
  },

  async updateCategory(id: string, data: Partial<FirestoreCategory>): Promise<void> {
    if (!db) throw new Error('Firebase no inicializado');
    await updateDoc(doc(db, 'categorias', id), data);
  },

  async deleteCategory(id: string): Promise<void> {
    if (!db) throw new Error('Firebase no inicializado');
    await deleteDoc(doc(db, 'categorias', id));
  }
};
