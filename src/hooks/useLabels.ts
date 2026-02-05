// TODO: implement working useLabels hook

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Label, CardLabel } from '../types';

const DEFAULT_COLORS = [
  '#61bd4f', // green
  '#f2d600', // yellow
  '#ff9f1a', // orange
  '#eb5a46', // red
  '#c377e0', // purple
  '#0079bf', // blue
];

export function useLabels(boardId: string | undefined) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [cardLabels, setCardLabels] = useState<CardLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLabels = useCallback(async () => {
    if (!boardId) return;

    try {
      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .eq('board_id', boardId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setLabels(data);
      } else {
        // Create default labels if none exist
        await createDefaultLabels();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch labels');
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  const fetchCardLabels = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('card_labels')
        .select('*');

      if (error) throw error;
      setCardLabels(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch card labels');
    }
  }, []);

  useEffect(() => {
    fetchLabels();
    fetchCardLabels();
  }, [fetchLabels, fetchCardLabels]);

  async function createDefaultLabels() {
    if (!boardId) return;

    const defaultLabels = DEFAULT_COLORS.map((color) => ({
      board_id: boardId,
      name: '',
      color,
    }));

    try {
      const { data, error } = await supabase
        .from('labels')
        .insert(defaultLabels)
        .select();

      if (error) throw error;
      setLabels(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create default labels');
    }
  }

  async function addLabel(name: string, color: string) {
    if (!boardId) return;

    try {
      const { data, error } = await supabase
        .from('labels')
        .insert({ board_id: boardId, name, color })
        .select()
        .single();

      if (error) throw error;
      setLabels([...labels, data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add label');
    }
  }

  const updateLabel = useCallback(async (labelId: string, updates: Partial<Pick<Label, 'name' | 'color'>>) => {
    setLabels(prev => {
      const updated = prev.map(l => l.id === labelId ? { ...l, ...updates } : l);
      return updated;
    });

    try {
      const { error } = await supabase
        .from('labels')
        .update(updates)
        .eq('id', labelId);

      if (error) throw error;
    } catch (err) {
      // Refetch on error to ensure consistency
      fetchLabels();
      setError(err instanceof Error ? err.message : 'Failed to update label');
    }
  }, [fetchLabels]);

  async function toggleCardLabel(cardId: string, labelId: string) {
    const existing = cardLabels.find(cl => cl.card_id === cardId && cl.label_id === labelId);

    if (existing) {
      // Remove label from card
      setCardLabels(cardLabels.filter(cl => !(cl.card_id === cardId && cl.label_id === labelId)));

      try {
        const { error } = await supabase
          .from('card_labels')
          .delete()
          .eq('card_id', cardId)
          .eq('label_id', labelId);

        if (error) throw error;
      } catch (err) {
        // Rollback
        setCardLabels([...cardLabels, existing]);
        setError(err instanceof Error ? err.message : 'Failed to remove label');
      }
    } else {
      // Add label to card
      const newCardLabel: CardLabel = { card_id: cardId, label_id: labelId };
      setCardLabels([...cardLabels, newCardLabel]);

      try {
        const { error } = await supabase
          .from('card_labels')
          .insert(newCardLabel);

        if (error) throw error;
      } catch (err) {
        // Rollback
        setCardLabels(cardLabels.filter(cl => !(cl.card_id === cardId && cl.label_id === labelId)));
        setError(err instanceof Error ? err.message : 'Failed to add label');
      }
    }
  }

  function getCardLabels(cardId: string): Label[] {
    const labelIds = cardLabels
      .filter(cl => cl.card_id === cardId)
      .map(cl => cl.label_id);
    return labels.filter(l => labelIds.includes(l.id));
  }

  return {
    labels,
    cardLabels,
    loading,
    error,
    addLabel,
    updateLabel,
    toggleCardLabel,
    getCardLabels,
    refreshLabels: fetchLabels,
  };
}
