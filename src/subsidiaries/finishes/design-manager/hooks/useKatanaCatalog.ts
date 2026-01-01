import { useEffect, useMemo, useState } from 'react';
import type { KatanaCatalogItem } from '../types/katanaCatalog';
import { subscribeToKatanaCatalogItems } from '../services/katanaCatalogService';

interface UseKatanaCatalogResult {
  items: KatanaCatalogItem[];
  loading: boolean;
  error: Error | null;
  standardItems: KatanaCatalogItem[];
}

export function useKatanaCatalog(): UseKatanaCatalogResult {
  const [items, setItems] = useState<KatanaCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToKatanaCatalogItems(
      (data) => {
        setItems(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const standardItems = useMemo(() => items.filter((i) => i.isStandard), [items]);

  return { items, loading, error, standardItems };
}
