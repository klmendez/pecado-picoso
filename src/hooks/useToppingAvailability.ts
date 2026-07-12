import { useEffect, useState } from 'react';
import { ToppingAvailabilityService } from '../services/toppingAvailabilityService';

export function useToppingAvailability() {
  const [disabledToppingIds, setDisabledToppingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = ToppingAvailabilityService.subscribe((ids) => {
      setDisabledToppingIds(ids);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { disabledToppingIds, loading };
}
