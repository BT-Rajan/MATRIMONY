import { useEffect, useState } from 'react';
import { api } from './api';

export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('settings').then(setSettings).catch((e) => setError(e.code));
  }, []);
  return { settings, error };
}
