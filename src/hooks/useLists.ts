import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { List } from '../types';

export function useLists(boardId: string | undefined) {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    if (!boardId) {
      setLists([]);
      setLoading(false);
      return;
    }

    // Clear old data and show loading immediately
    setLists([]);
    setLoading(true);

    // Track this fetch to avoid race conditions
    const fetchId = ++fetchIdRef.current;

    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('lists')
          .select('*')
          .eq('board_id', boardId)
          .order('position', { ascending: true });

        // Only update if this is still the latest fetch
        if (fetchId !== fetchIdRef.current) return;

        if (error) throw error;
        setLists(data || []);
      } catch (err) {
        if (fetchId !== fetchIdRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch lists');
      } finally {
        if (fetchId === fetchIdRef.current) {
          setLoading(false);
        }
      }
    }

    fetchData();
  }, [boardId]);

  async function refreshLists() {
    if (!boardId) return;

    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .eq('board_id', boardId)
      .order('position', { ascending: true });

    if (!error && data) {
      setLists(data);
    }
  }

  async function addList(name: string) {
    if (!boardId) return;

    const position = lists.length;
    const tempId = `temp-${Date.now()}`;

    // Optimistic update
    const newList: List = {
      id: tempId,
      board_id: boardId,
      name,
      position,
      is_collapsed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLists([...lists, newList]);

    try {
      const { data, error } = await supabase
        .from('lists')
        .insert({ board_id: boardId, name, position })
        .select()
        .single();

      if (error) throw error;

      // Replace temp with real data
      setLists(prev => prev.map(l => l.id === tempId ? data : l));
    } catch (err) {
      // Rollback
      setLists(prev => prev.filter(l => l.id !== tempId));
      setError(err instanceof Error ? err.message : 'Failed to add list');
    }
  }

  async function updateList(listId: string, updates: Partial<Pick<List, 'name' | 'is_collapsed'>>) {
    const previousLists = lists;

    // Optimistic update
    setLists(lists.map(l => l.id === listId ? { ...l, ...updates } : l));

    try {
      const { error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', listId);

      if (error) throw error;
    } catch (err) {
      setLists(previousLists);
      setError(err instanceof Error ? err.message : 'Failed to update list');
    }
  }

  async function deleteList(listId: string) {
    const previousLists = lists;

    // Optimistic update
    setLists(lists.filter(l => l.id !== listId));

    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId);

      if (error) throw error;
    } catch (err) {
      setLists(previousLists);
      setError(err instanceof Error ? err.message : 'Failed to delete list');
    }
  }

  async function reorderLists(reorderedLists: List[]) {
    const previousLists = lists;

    // Optimistic update
    setLists(reorderedLists);
    setIsSaving(true);

    try {
      const updates = reorderedLists.map((list, index) => ({
        id: list.id,
        position: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('lists')
          .update({ position: update.position })
          .eq('id', update.id);

        if (error) throw error;
      }
    } catch (err) {
      setLists(previousLists);
      setError(err instanceof Error ? err.message : 'Failed to reorder lists');
    } finally {
      setIsSaving(false);
    }
  }

  return {
    lists,
    loading,
    error,
    isSaving,
    addList,
    updateList,
    deleteList,
    reorderLists,
    refreshLists,
  };
}
