import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Board } from '../types';

const DEFAULT_BOARD_NAME = 'My Board';
const LAST_BOARD_KEY = 'last-board-id';

export function useBoard() {
  const [board, setBoard] = useState<Board | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBoards();
  }, []);

  async function fetchBoards() {
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setBoards(data);

        // Try to restore last opened board
        const lastBoardId = localStorage.getItem(LAST_BOARD_KEY);
        const lastBoard = lastBoardId ? data.find(b => b.id === lastBoardId) : null;
        setBoard(lastBoard || data[0]);
      } else {
        // Create a default board if none exists
        const newBoard = await createBoard(DEFAULT_BOARD_NAME);
        if (newBoard) {
          setBoards([newBoard]);
          setBoard(newBoard);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch boards');
    } finally {
      setLoading(false);
    }
  }

  async function createBoard(name: string): Promise<Board | null> {
    try {
      const { data, error } = await supabase
        .from('boards')
        .insert({ name })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create board');
      return null;
    }
  }

  async function updateBoardName(newName: string) {
    if (!board) return;

    // Optimistic update
    const previousBoard = board;
    setBoard({ ...board, name: newName });
    setBoards(boards.map(b => b.id === board.id ? { ...b, name: newName } : b));

    try {
      const { error } = await supabase
        .from('boards')
        .update({ name: newName })
        .eq('id', board.id);

      if (error) throw error;
    } catch (err) {
      // Rollback on error
      setBoard(previousBoard);
      setBoards(boards.map(b => b.id === board.id ? previousBoard : b));
      setError(err instanceof Error ? err.message : 'Failed to update board');
    }
  }

  function switchBoard(boardId: string) {
    const selectedBoard = boards.find(b => b.id === boardId);
    if (selectedBoard) {
      setBoard(selectedBoard);
      localStorage.setItem(LAST_BOARD_KEY, boardId);
    }
  }

  async function addBoard(name: string) {
    const newBoard = await createBoard(name);
    if (newBoard) {
      setBoards([...boards, newBoard]);
      setBoard(newBoard);
      localStorage.setItem(LAST_BOARD_KEY, newBoard.id);
    }
    return newBoard;
  }

  async function deleteBoard(boardId: string) {
    // Don't allow deleting the last board
    if (boards.length <= 1) {
      setError('Cannot delete the last board');
      return;
    }

    const previousBoards = boards;
    const deletingCurrent = board?.id === boardId;

    // Optimistic update
    const updatedBoards = boards.filter(b => b.id !== boardId);
    setBoards(updatedBoards);

    // If deleting current board, switch to another one
    if (deletingCurrent && updatedBoards.length > 0) {
      setBoard(updatedBoards[0]);
      localStorage.setItem(LAST_BOARD_KEY, updatedBoards[0].id);
    }

    try {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', boardId);

      if (error) throw error;
    } catch (err) {
      // Rollback
      setBoards(previousBoards);
      if (deletingCurrent) {
        setBoard(previousBoards.find(b => b.id === boardId) || null);
      }
      setError(err instanceof Error ? err.message : 'Failed to delete board');
    }
  }

  return {
    board,
    boards,
    loading,
    error,
    updateBoardName,
    switchBoard,
    addBoard,
    deleteBoard,
    refreshBoards: fetchBoards,
  };
}
