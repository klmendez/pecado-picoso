import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Los toppings están definidos en código (data/toppings.ts); acá solo se
// guarda la lista de IDs que el admin desactivó, en un único documento.
const DOC_REF = () => doc(db, 'configuracion', 'disponibilidad');

export const ToppingAvailabilityService = {
  async getDisabledToppingIds(): Promise<string[]> {
    const snap = await getDoc(DOC_REF());
    if (!snap.exists()) return [];
    return (snap.data().toppingsDeshabilitados as string[]) || [];
  },

  subscribe(callback: (disabledIds: string[]) => void): () => void {
    return onSnapshot(DOC_REF(), (snap) => {
      const ids = snap.exists() ? (snap.data().toppingsDeshabilitados as string[]) || [] : [];
      callback(ids);
    });
  },

  async setToppingAvailability(toppingId: string, disabled: boolean): Promise<void> {
    const ref = DOC_REF();
    const snap = await getDoc(ref);
    const current: string[] = snap.exists() ? (snap.data().toppingsDeshabilitados as string[]) || [] : [];
    const next = disabled
      ? Array.from(new Set([...current, toppingId]))
      : current.filter((id) => id !== toppingId);
    await setDoc(ref, { toppingsDeshabilitados: next }, { merge: true });
  },
};
