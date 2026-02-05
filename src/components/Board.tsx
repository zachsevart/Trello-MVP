import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useBoard } from '../hooks/useBoard';
import { useLists } from '../hooks/useLists';
import { useLabels } from '../hooks/useLabels';
import { useBoardCards } from '../hooks/useBoardCards';
import { List } from './List';
import { Card } from './Card';
import { SortableList } from './SortableList';
import { AddList } from './AddList';
import type { Card as CardType, List as ListType } from '../types';
import './Board.css';

const BACKGROUND_OPTIONS = [
  { id: 'none', name: 'None', url: null },
  { id: 'mountains', name: 'Mountains', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80' },
  { id: 'ocean', name: 'Ocean', url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1920&q=80' },
  { id: 'forest', name: 'Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80' },
  { id: 'city', name: 'City', url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&q=80' },
  { id: 'desert', name: 'Desert', url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1920&q=80' },
];

type DragType = 'list' | 'card' | null;

export function Board() {
  const { board, boards, loading, updateBoardName, switchBoard, addBoard, deleteBoard } = useBoard();
  const { lists, loading: listsLoading, addList, updateList, deleteList, reorderLists, isSaving: isListsSaving } = useLists(board?.id);
  const { labels, toggleCardLabel, getCardLabels, updateLabel } = useLabels(board?.id);

  const listIds = useMemo(() => lists.map((l) => l.id), [lists]);
  const {
    cards,
    getCardsForList,
    addCard,
    updateCard,
    deleteCard,
    setCardsOptimistic,
    persistCardPositions,
    isSaving: isCardsSaving,
  } = useBoardCards(board?.id, listIds);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);

  // Drag state
  const [dragType, setDragType] = useState<DragType>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const boardMenuRef = useRef<HTMLDivElement>(null);
  const boardMenuButtonRef = useRef<HTMLButtonElement>(null);

  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const wasSavingRef = useRef(false);

  const isSaving = isListsSaving || isCardsSaving;

  // Show "Saved" indicator briefly after saving completes
  useEffect(() => {
    if (wasSavingRef.current && !isSaving) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 1500);
      wasSavingRef.current = false;
      return () => clearTimeout(timer);
    }
    if (isSaving) {
      wasSavingRef.current = true;
    }
  }, [isSaving]);

  // Load background when board changes
  useEffect(() => {
    if (board?.id) {
      const savedBg = localStorage.getItem(`board-background-${board.id}`);
      setBackgroundUrl(savedBg);
    }
  }, [board?.id]);

  // Persist background to localStorage per board
  useEffect(() => {
    if (!board?.id) return;

    if (backgroundUrl) {
      localStorage.setItem(`board-background-${board.id}`, backgroundUrl);
    } else {
      localStorage.removeItem(`board-background-${board.id}`);
    }
  }, [backgroundUrl, board?.id]);

  // dnd-kit sensors - disabled when modal is open
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isModalOpen ? Infinity : 8, // Infinity prevents activation when modal open
      },
    })
  );

  // Determine if dragged item is a list or card
  function getDragType(id: string): DragType {
    if (lists.some((l) => l.id === id)) return 'list';
    if (cards.some((c) => c.id === id)) return 'card';
    return null;
  }

  // Find which list contains a card
  function findListContainingCard(cardId: string): string | null {
    const card = cards.find((c) => c.id === cardId);
    return card?.list_id || null;
  }

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    const type = getDragType(id);
    setDragType(type);

    if (type === 'list') {
      setActiveListId(id);
      setActiveCardId(null);
    } else if (type === 'card') {
      setActiveCardId(id);
      setActiveListId(null);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || dragType !== 'card') return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeListId = findListContainingCard(activeId);
    let overListId = findListContainingCard(overId);

    // If over is a list (not a card), use that list
    if (!overListId && lists.some((l) => l.id === overId)) {
      overListId = overId;
    }

    if (!activeListId || !overListId || activeListId === overListId) return;

    // Moving card to different list
    setCardsOptimistic((prevCards: CardType[]) => {
      const activeCard = prevCards.find((c) => c.id === activeId);
      if (!activeCard) return prevCards;

      // Remove from old list, add to new list
      const filtered = prevCards.filter((c) => c.id !== activeId);
      const overListCards = filtered.filter((c) => c.list_id === overListId);
      const overCard = prevCards.find((c) => c.id === overId);

      let newPosition = overListCards.length;
      if (overCard) {
        newPosition = overListCards.findIndex((c) => c.id === overId);
        if (newPosition === -1) newPosition = overListCards.length;
      }

      const updatedCard = { ...activeCard, list_id: overListId, position: newPosition };

      // Insert at position
      const newCards = [...filtered];
      const insertIndex = newCards.findIndex(
        (c) => c.list_id === overListId && c.position >= newPosition
      );

      if (insertIndex === -1) {
        newCards.push(updatedCard);
      } else {
        newCards.splice(insertIndex, 0, updatedCard);
      }

      return newCards;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setDragType(null);
    setActiveListId(null);
    setActiveCardId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const type = getDragType(activeId);

    if (type === 'list') {
      // Reorder lists
      const oldIndex = lists.findIndex((l) => l.id === activeId);
      const newIndex = lists.findIndex((l) => l.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(lists, oldIndex, newIndex);
        reorderLists(reordered);
      }
    } else if (type === 'card') {
      // Reorder/move cards
      const activeCard = cards.find((c) => c.id === activeId);
      if (!activeCard) return;

      const activeListId = activeCard.list_id;
      let overListId = findListContainingCard(overId);

      // If dropped on a list directly
      if (!overListId && lists.some((l) => l.id === overId)) {
        overListId = overId;
      }

      if (!overListId) overListId = activeListId;

      const listCards = cards
        .filter((c) => c.list_id === overListId)
        .sort((a, b) => a.position - b.position);

      const oldIndex = listCards.findIndex((c) => c.id === activeId);
      const newIndex = listCards.findIndex((c) => c.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(listCards, oldIndex, newIndex);
        const updatedCards = reordered.map((card, index) => ({
          ...card,
          position: index,
        }));

        // Update state
        const otherCards = cards.filter((c) => c.list_id !== overListId);
        setCardsOptimistic([...otherCards, ...updatedCards]);

        // Persist to database
        persistCardPositions(updatedCards);
      } else if (activeListId !== overListId) {
        // Card moved to different list - persist the change
        const updatedCard = cards.find((c) => c.id === activeId);
        if (updatedCard) {
          persistCardPositions([updatedCard]);
        }
      }
    }
  }

  const activeList = activeListId ? lists.find((l) => l.id === activeListId) : null;
  const activeCard = activeCardId ? cards.find((c) => c.id === activeCardId) : null;

  // Close settings when clicking outside
  useEffect(() => {
    if (!showSettings) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        settingsRef.current && !settingsRef.current.contains(target) &&
        settingsButtonRef.current && !settingsButtonRef.current.contains(target)
      ) {
        setShowSettings(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  // Close board menu when clicking outside
  useEffect(() => {
    if (!showBoardMenu) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        boardMenuRef.current && !boardMenuRef.current.contains(target) &&
        boardMenuButtonRef.current && !boardMenuButtonRef.current.contains(target)
      ) {
        setShowBoardMenu(false);
        setIsCreatingBoard(false);
        setNewBoardName('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBoardMenu]);

  async function handleCreateBoard() {
    if (!newBoardName.trim()) return;
    await addBoard(newBoardName.trim());
    setNewBoardName('');
    setIsCreatingBoard(false);
    setShowBoardMenu(false);
  }

  function handleCreateBoardKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleCreateBoard();
    } else if (e.key === 'Escape') {
      setIsCreatingBoard(false);
      setNewBoardName('');
    }
  }

  function handleNameClick() {
    if (board) {
      setEditedName(board.name);
      setIsEditingName(true);
    }
  }

  function handleNameSubmit() {
    if (editedName.trim() && editedName !== board?.name) {
      updateBoardName(editedName.trim());
    }
    setIsEditingName(false);
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  }

  if (loading) {
    return (
      <div className="board">
        <div className="board-loading">Loading board...</div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="board">
        <div className="board-error">Failed to load board</div>
      </div>
    );
  }

  const boardStyle = backgroundUrl ? {
    backgroundImage: `url(${backgroundUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : undefined;

  return (
    <div className={`board ${backgroundUrl ? 'has-background' : ''}`} style={boardStyle}>
      <div className="board-header">
        {isEditingName ? (
          <input
            type="text"
            className="board-name-input"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleNameKeyDown}
            autoFocus
          />
        ) : (
          <h2 className="board-name" onClick={handleNameClick}>
            {board.name}
          </h2>
        )}

        <div className="board-switcher">
          <button
            ref={boardMenuButtonRef}
            className="board-menu-trigger"
            onClick={() => setShowBoardMenu(!showBoardMenu)}
          >
            Boards <span className="dropdown-arrow">▾</span>
          </button>
          {showBoardMenu && (
            <div ref={boardMenuRef} className="board-menu">
              <div className="board-menu-header">
                Your Boards
              </div>
              <div className="board-menu-list">
                {boards.map((b) => (
                  <div
                    key={b.id}
                    className={`board-menu-item ${b.id === board.id ? 'active' : ''}`}
                  >
                    <button
                      className="board-menu-item-name"
                      onClick={() => {
                        switchBoard(b.id);
                        setShowBoardMenu(false);
                      }}
                    >
                      {b.name}
                    </button>
                    {boards.length > 1 && (
                      <button
                        className="board-menu-item-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBoard(b.id);
                        }}
                        title="Delete board"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="board-menu-footer">
                {isCreatingBoard ? (
                  <div className="create-board-input">
                    <input
                      type="text"
                      placeholder="Board name..."
                      value={newBoardName}
                      onChange={(e) => setNewBoardName(e.target.value)}
                      onKeyDown={handleCreateBoardKeyDown}
                      autoFocus
                    />
                    <button onClick={handleCreateBoard}>Create</button>
                  </div>
                ) : (
                  <button
                    className="create-board-btn"
                    onClick={() => setIsCreatingBoard(true)}
                  >
                    + Create new board
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="board-header-spacer" />

        {(isSaving || showSaved) && (
          <div className={`save-indicator ${isSaving ? 'saving' : 'saved'}`}>
            {isSaving ? 'Saving...' : 'Saved'}
          </div>
        )}

        <div className="board-settings-container">
          <button
            ref={settingsButtonRef}
            className="board-settings-btn"
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙
          </button>
          {showSettings && (
            <div ref={settingsRef} className="board-settings-menu">
              <div className="settings-header">
                Background
                <button className="settings-close" onClick={() => setShowSettings(false)}>✕</button>
              </div>
              <div className="background-options">
                {BACKGROUND_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    className={`background-option ${backgroundUrl === option.url ? 'active' : ''}`}
                    onClick={() => {
                      setBackgroundUrl(option.url);
                      setShowSettings(false);
                    }}
                  >
                    {option.url ? (
                      <img src={option.url} alt={option.name} />
                    ) : (
                      <span className="no-bg">∅</span>
                    )}
                    <span className="bg-name">{option.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {listsLoading ? (
        <div className="board-lists">
          <div className="board-loading">Loading...</div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="board-lists">
            <SortableContext
              items={lists.map((l) => l.id)}
              strategy={horizontalListSortingStrategy}
            >
              {lists.map((list) => (
                <SortableList key={list.id} id={list.id}>
                  <List
                    list={list}
                    lists={lists}
                    labels={labels}
                    cards={getCardsForList(list.id)}
                    onUpdate={updateList}
                    onDelete={() => deleteList(list.id)}
                    onAddCard={(title) => addCard(list.id, title)}
                    onUpdateCard={updateCard}
                    onDeleteCard={deleteCard}
                    getCardLabels={getCardLabels}
                    toggleCardLabel={toggleCardLabel}
                    updateLabel={updateLabel}
                    onModalChange={setIsModalOpen}
                  />
                </SortableList>
              ))}
            </SortableContext>
            <AddList onAdd={addList} />
          </div>

          <DragOverlay>
          {activeList && (
            <div className="list-drag-overlay">
              <List
                list={activeList}
                lists={lists}
                labels={labels}
                cards={getCardsForList(activeList.id)}
                onUpdate={() => {}}
                onDelete={() => {}}
                onAddCard={() => {}}
                onUpdateCard={() => {}}
                onDeleteCard={() => {}}
                getCardLabels={getCardLabels}
                toggleCardLabel={() => {}}
                updateLabel={() => {}}
                onModalChange={() => {}}
              />
            </div>
          )}
          {activeCard && (
            <div className="card-drag-overlay">
              <Card
                card={activeCard}
                lists={lists}
                labels={labels}
                cardLabels={getCardLabels(activeCard.id)}
                onUpdate={() => {}}
                onDelete={() => {}}
                onMove={() => {}}
                onToggleLabel={() => {}}
                onUpdateLabel={() => {}}
              />
            </div>
          )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
