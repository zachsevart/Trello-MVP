import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Card } from '../types';

export function useCards(listId: string, refreshTrigger?: number) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('list_id', listId)
        .order('position', { ascending: true });

      if (error) throw error;
      setCards(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cards');
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards, refreshTrigger]);

  async function addCard(title: string) {
    const position = cards.length;
    const tempId = `temp-${Date.now()}`;

    // Optimistic update
    const newCard: Card = {
      id: tempId,
      list_id: listId,
      title,
      description: '',
      position,
      story_points: null,
      due_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCards([...cards, newCard]);

    try {
      const { data, error } = await supabase
        .from('cards')
        .insert({ list_id: listId, title, position })
        .select()
        .single();

      if (error) throw error;

      setCards(prev => prev.map(c => c.id === tempId ? data : c));
    } catch (err) {
      setCards(prev => prev.filter(c => c.id !== tempId));
      setError(err instanceof Error ? err.message : 'Failed to add card');
    }
  }

  async function updateCard(cardId: string, updates: Partial<Pick<Card, 'title' | 'description' | 'story_points' | 'due_date'>>) {
    const previousCards = cards;

    // Optimistic update
    setCards(cards.map(c => c.id === cardId ? { ...c, ...updates } : c));

    try {
      const { error } = await supabase
        .from('cards')
        .update(updates)
        .eq('id', cardId);

      if (error) throw error;
    } catch (err) {
      setCards(previousCards);
      setError(err instanceof Error ? err.message : 'Failed to update card');
    }
  }

  async function deleteCard(cardId: string) {
    const previousCards = cards;

    // Optimistic update
    setCards(cards.filter(c => c.id !== cardId));

    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;
    } catch (err) {
      setCards(previousCards);
      setError(err instanceof Error ? err.message : 'Failed to delete card');
    }
  }

  async function moveCard(cardId: string, targetListId: string, targetPosition: number) {
    try {
      const { error } = await supabase
        .from('cards')
        .update({ list_id: targetListId, position: targetPosition })
        .eq('id', cardId);

      if (error) throw error;

      // Remove from current list if moving to different list
      if (targetListId !== listId) {
        setCards(cards.filter(c => c.id !== cardId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move card');
    }
  }

  async function reorderCards(reorderedCards: Card[]) {
    const previousCards = cards;

    // Optimistic update
    setCards(reorderedCards);

    try {
      const updates = reorderedCards.map((card, index) => ({
        id: card.id,
        position: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('cards')
          .update({ position: update.position })
          .eq('id', update.id);

        if (error) throw error;
      }
    } catch (err) {
      setCards(previousCards);
      setError(err instanceof Error ? err.message : 'Failed to reorder cards');
    }
  }

  return {
    cards,
    loading,
    error,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    reorderCards,
    refreshCards: fetchCards,
  };
}
