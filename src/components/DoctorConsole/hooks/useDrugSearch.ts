import { useState, useCallback, useRef } from 'react';
import { opdService } from '../../../services/opdService';

export interface DrugResult {
  id: string;
  drug_code?: string;
  drug_name: string;
  generic_name?: string;
  drug_type?: string;
  strength?: string;
  unit?: string;
  route?: string;
  schedule?: string;
  manufacturer?: string;
}

export function useDrugSearch() {
  const [results, setResults] = useState<DrugResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string) => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await opdService.searchDrugs(query);
        setResults(data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return { results, loading, search, clear };
}
