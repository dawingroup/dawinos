/**
 * Hook: Subscribe to approved WhatsApp message templates
 */

import { useState, useEffect } from 'react';
import { subscribeToTemplates } from '../services/whatsappService';
import type { WhatsAppTemplate } from '../types';

export function useWhatsAppTemplates() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeToTemplates(
      (data) => {
        setTemplates(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { templates, loading, error };
}
