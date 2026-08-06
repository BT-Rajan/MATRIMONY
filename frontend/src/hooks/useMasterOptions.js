import { useEffect, useState } from 'react';
import { masterService } from '../services/masterService';

/**
 * Loads active options for a master slug. If parentSlug/parentId are given,
 * treats this as a hierarchical dropdown (e.g. Caste depends on Religion) —
 * options are empty until a parent is selected, and reload whenever it changes.
 */
export function useMasterOptions(slug, parentId) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const isDependent = parentId !== undefined;

  useEffect(() => {
    if (isDependent && !parentId) {
      setOptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    masterService
      .options(slug, parentId)
      .then((items) => setOptions(items.filter((i) => i.is_active)))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [slug, parentId]);

  return { options, loading };
}
