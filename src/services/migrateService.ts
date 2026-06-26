import { db } from '../lib/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export const MigrateService = {
  async migrateAll(): Promise<string> {
    if (!db) return 'Firebase no inicializado';

    // 1. Buscar o crear categorías
    const catRef = collection(db, 'categorias');
    const existingCatsSnap = await getDocs(catRef);
    const existingCats = existingCatsSnap.docs.map(d => ({ id: d.id, name: (d.data().name || '').toLowerCase() }));

    let gomitasId = existingCats.find(c => c.name.includes('gomita'))?.id;
    let frutaId = existingCats.find(c => c.name.includes('fruta') || c.name.includes('fresh'))?.id;

    const createdCats: string[] = [];

    if (!gomitasId) {
      const ref = await addDoc(catRef, {
        name: 'Gomitas',
        description: 'Gomitas empanizadas, ahogadas o picosas',
        image: '',
        createdAt: new Date(),
      });
      gomitasId = ref.id;
      createdCats.push('Gomitas');
    }

    if (!frutaId) {
      const ref = await addDoc(catRef, {
        name: 'Fruta Fresh',
        description: 'Fruta fresca con chamoy artesanal',
        image: '',
        createdAt: new Date(),
      });
      frutaId = ref.id;
      createdCats.push('Fruta Fresh');
    }

    // 2. Buscar productos existentes
    const prodRef = collection(db, 'productos');
    const existingProdsSnap = await getDocs(prodRef);
    const existingNames = new Set(existingProdsSnap.docs.map(d => (d.data().name || '').toLowerCase()));

    const products = [
      { name: 'Minipecado 40g', description: 'La dosis perfecta para un antojo rápido. Gomitas con equilibrio entre dulce, ácido y picante.', categoryId: gomitasId, price: 5900, priceType: 'porVersion', priceOptions: { porVersion: { ahogada: { pequeno: 5900, mediano: 0, grande: 0 }, picosa: { pequeno: 5900, mediano: 0, grande: 0 } } }, toppingsIncludedMax: 4, sizes: ['pequeno'], image: '', createdAt: new Date() },
      { name: 'Pecado para cada uno', description: 'Presentación individual para disfrutar en cualquier momento. Textura firme y sabor intenso.', categoryId: gomitasId, price: 8500, priceType: 'porVersion', priceOptions: { porVersion: { ahogada: { pequeno: 8500, mediano: 0, grande: 0 }, picosa: { pequeno: 9500, mediano: 0, grande: 0 } } }, toppingsIncludedMax: 4, sizes: ['pequeno'], image: '', createdAt: new Date() },
      { name: 'Picosa Suprema', description: 'Versión intensa para quienes disfrutan el picante marcado y el contraste ácido.', categoryId: gomitasId, price: 13500, priceType: 'porVersion', priceOptions: { porVersion: { ahogada: { pequeno: 13500, mediano: 0, grande: 0 }, picosa: { pequeno: 14500, mediano: 0, grande: 0 } } }, toppingsIncludedMax: 4, sizes: ['pequeno'], image: '', createdAt: new Date() },
      { name: 'Pecado Real', description: 'Presentación grande pensada para compartir. La opción más completa para un antojo fuerte.', categoryId: gomitasId, price: 18000, priceType: 'porVersion', priceOptions: { porVersion: { ahogada: { pequeno: 18000, mediano: 0, grande: 0 }, picosa: { pequeno: 19500, mediano: 0, grande: 0 } } }, toppingsIncludedMax: 4, sizes: ['pequeno'], image: '', createdAt: new Date() },
      { name: 'Leyenda Picosa', description: 'Una combinación equilibrada de tamaño y sabor, con un toque de picante que se vuelve clásico.', categoryId: gomitasId, price: 28000, priceType: 'porVersion', priceOptions: { porVersion: { ahogada: { pequeno: 28000, mediano: 0, grande: 0 }, picosa: { pequeno: 32000, mediano: 0, grande: 0 } } }, toppingsIncludedMax: 4, sizes: ['pequeno'], image: '', createdAt: new Date() },
      { name: 'Duo Shot', description: 'Dos frutas en una sola presentación: piña y mango con chamoy y tajín.', categoryId: frutaId, price: 13500, priceType: 'porSize', priceOptions: { porSize: { pequeno: 13500, mediano: 14500, grande: 0 } }, toppingsIncludedMax: 2, sizes: ['pequeno', 'mediano'], image: '', createdAt: new Date() },
      { name: 'Mango Shot', description: 'Vaso de mango fresco con chamoy, gomitas y un toque picoso.', categoryId: frutaId, price: 13000, priceType: 'porSize', priceOptions: { porSize: { pequeno: 13000, mediano: 14000, grande: 0 } }, toppingsIncludedMax: 2, sizes: ['pequeno', 'mediano'], image: '', createdAt: new Date() },
      { name: 'Piñasón Picoso', description: 'Rebanada de piña fresca bañada en chamoy artesanal y cubierta con tajín.', categoryId: frutaId, price: 8000, priceType: 'fijo', priceOptions: { fijo: 8000 }, toppingsIncludedMax: 0, sizes: [], image: '', createdAt: new Date() },
      { name: 'Mamoloko', description: 'El sabor único del mamoncillo llevado al límite: refrescante, ácido y con picante ligero que engancha desde el primer bocado.', categoryId: frutaId, price: 14000, priceType: 'fijo', priceOptions: { fijo: 14000 }, toppingsIncludedMax: 2, sizes: [], image: '', createdAt: new Date() },
    ];

    let createdCount = 0;
    for (const p of products) {
      if (!existingNames.has(p.name.toLowerCase())) {
        await addDoc(prodRef, p);
        createdCount++;
      }
    }

    return `Migración: ${createdCats.length ? createdCats.join(', ') + ' creadas. ' : ''}${createdCount} productos nuevos subidos.`;
  },
};
