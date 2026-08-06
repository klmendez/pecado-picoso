import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Promotion } from '../types/promotion';

const PROMOS_COLLECTION = 'promociones';

export class PromotionService {
  static async getPromotions(): Promise<(Promotion & { id: string })[]> {
    const snap = await getDocs(collection(db, PROMOS_COLLECTION));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Promotion & { id: string }));
  }

  static async getActivePromotions(): Promise<(Promotion & { id: string })[]> {
    const all = await this.getPromotions();
    const now = new Date();
    return all.filter(p => {
      if (!p.activa) return false;
      if (p.fechaInicio) {
        const start = p.fechaInicio.toDate ? p.fechaInicio.toDate() : new Date(p.fechaInicio as any);
        if (now < start) return false;
      }
      if (p.fechaFin) {
        const end = p.fechaFin.toDate ? p.fechaFin.toDate() : new Date(p.fechaFin as any);
        if (now > end) return false;
      }
      return true;
    });
  }

  static async addPromotion(data: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, PROMOS_COLLECTION), {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  }

  static async updatePromotion(id: string, data: Partial<Promotion>): Promise<void> {
    const ref = doc(db, PROMOS_COLLECTION, id);
    await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
  }

  static async deletePromotion(id: string): Promise<void> {
    await deleteDoc(doc(db, PROMOS_COLLECTION, id));
  }

  static async incrementUsage(id: string): Promise<void> {
    const ref = doc(db, PROMOS_COLLECTION, id);
    await updateDoc(ref, { usosActuales: increment(1) });
  }
}
