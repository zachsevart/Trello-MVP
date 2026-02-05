import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { List } from '../types';

export function useLists(boardId: string | undefined) {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    if (!boardId) return;

    try {
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });

      if (error) throw error;
      setLists(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lists');
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

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
    }
  }

  return {
    lists,
    loading,
    error,
    addList,
    updateList,
    deleteList,
    reorderLists,
    refreshLists: fetchLists,
  };
}
