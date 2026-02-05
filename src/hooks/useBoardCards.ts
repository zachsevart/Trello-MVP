import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Card } from '../types';

export function useBoardCards(boardId: string | undefined, listIds: string[]) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fetchIdRef = useRef(0);
  const listIdsKey = listIds.join(',');

  useEffect(() => {
    if (!boardId || listIds.length === 0) {
      setCards([]);
      setLoading(false);
      return;
    }

    // Clear old data and show loading immediately
    setCards([]);
    setLoading(true);

    // Track this fetch to avoid race conditions
    const fetchId = ++fetchIdRef.current;

    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('cards')
          .select('*')
          .in('list_id', listIds)
          .order('position', { ascending: true });

        // Only update if this is still the latest fetch
        if (fetchId !== fetchIdRef.current) return;

        if (error) throw error;
        setCards(data || []);
      } catch (err) {
        if (fetchId !== fetchIdRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch cards');
      } finally {
        if (fetchId === fetchIdRef.current) {
          setLoading(false);
        }
      }
    }

    fetchData();
  }, [boardId, listIdsKey]);

  async function refreshCards() {
    if (!boardId || listIds.length === 0) return;

    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .in('list_id', listIds)
      .order('position', { ascending: true });

    if (!error && data) {
      setCards(data);
    }
  }

  // Get cards for a specific list
  function getCardsForList(listId: string): Card[] {
    return cards
      .filter((c) => c.list_id === listId)
      .sort((a, b) => a.position - b.position);
  }

  async function addCard(listId: string, title: string) {
    const listCards = getCardsForList(listId);
    const position = listCards.length;
    const tempId = `temp-${Date.now()}`;

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
      setCards((prev) => prev.map((c) => (c.id === tempId ? data : c)));
    } catch (err) {
      setCards((prev) => prev.filter((c) => c.id !== tempId));
      setError(err instanceof Error ? err.message : 'Failed to add card');
    }
  }

  async function updateCard(
    cardId: string,
    updates: Partial<Pick<Card, 'title' | 'description' | 'story_points' | 'due_date' | 'is_complete' | 'checklist'>>
  ) {
    const previousCards = cards;
    setCards(cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)));

    try {
      const { error } = await supabase.from('cards').update(updates).eq('id', cardId);
      if (error) throw error;
    } catch (err) {
      setCards(previousCards);
      setError(err instanceof Error ? err.message : 'Failed to update card');
    }
  }

  async function deleteCard(cardId: string) {
    const previousCards = cards;
    setCards(cards.filter((c) => c.id !== cardId));

    try {
      const { error } = await supabase.from('cards').delete().eq('id', cardId);
      if (error) throw error;
    } catch (err) {
      setCards(previousCards);
      setError(err instanceof Error ? err.message : 'Failed to delete card');
    }
  }

  async function moveCardToList(cardId: string, targetListId: string, targetPosition: number) {
    const previousCards = cards;

    // Optimistic update
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId ? { ...c, list_id: targetListId, position: targetPosition } : c
      )
    );

    try {
      const { error } = await supabase
        .from('cards')
        .update({ list_id: targetListId, position: targetPosition })
        .eq('id', cardId);

      if (error) throw error;
    } catch (err) {
      setCards(previousCards);
      setError(err instanceof Error ? err.message : 'Failed to move card');
    }
  }

  async function reorderCardsInList(listId: string, reorderedCards: Card[]) {
    const previousCards = cards;

    // Update positions in state
    const otherCards = cards.filter((c) => c.list_id !== listId);
    const updatedCards = reorderedCards.map((card, index) => ({
      ...card,
      position: index,
    }));
    setCards([...otherCards, ...updatedCards]);

    try {
      for (const card of updatedCards) {
        const { error } = await supabase
          .from('cards')
          .update({ position: card.position })
          .eq('id', card.id);

        if (error) throw error;
      }
    } catch (err) {
      setCards(previousCards);
      setError(err instanceof Error ? err.message : 'Failed to reorder cards');
    }
  }

  // Update local state for drag operations (optimistic, no DB call)
  function setCardsOptimistic(newCards: Card[] | ((prev: Card[]) => Card[])) {
    if (typeof newCards === 'function') {
      setCards(newCards);
    } else {
      setCards(newCards);
    }
  }

  // Persist all card positions after drag ends
  async function persistCardPositions(affectedCards: Card[]) {
    setIsSaving(true);
    try {
      for (const card of affectedCards) {
        const { error } = await supabase
          .from('cards')
          .update({ list_id: card.list_id, position: card.position })
          .eq('id', card.id);

        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to persist card positions');
      refreshCards(); // Refresh on error
    } finally {
      setIsSaving(false);
    }
  }

  return {
    cards,
    loading,
    error,
    isSaving,
    getCardsForList,
    addCard,
    updateCard,
    deleteCard,
    moveCardToList,
    reorderCardsInList,
    setCardsOptimistic,
    persistCardPositions,
    refreshCards,
  };
}
