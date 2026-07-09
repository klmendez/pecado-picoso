import { useEffect, useState } from 'react';
import { PromotionService } from '../services/promotionService';
import type { Promotion } from '../types/promotion';

export function usePromotions() {
  const [promotions, setPromotions] = useState<(Promotion & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await PromotionService.getActivePromotions();
      setPromotions(data);
    } catch (err) {
      console.error('Error loading promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return { promotions, loading, reload: load };
}

export function useAllPromotions() {
  const [promotions, setPromotions] = useState<(Promotion & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await PromotionService.getPromotions();
      setPromotions(data);
    } catch (err) {
      console.error('Error loading promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return { promotions, loading, reload: load };
}
