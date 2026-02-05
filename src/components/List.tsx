import { useState, useRef, useEffect, useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { SortableCard } from './SortableCard';
import { AddCard } from './AddCard';
import type { List as ListType, Label, Card as CardType } from '../types';
import './List.css';

type SortOption = 'position' | 'story_points_asc' | 'story_points_desc' | 'due_date_asc' | 'due_date_desc';

interface ListProps {
  list: ListType;
  lists: ListType[];
  labels: Label[];
  cards: CardType[];
  onUpdate: (listId: string, updates: Partial<Pick<ListType, 'name' | 'is_collapsed'>>) => void;
  onDelete: () => void;
  onAddCard: (title: string) => void;
  onUpdateCard: (cardId: string, updates: Partial<Pick<CardType, 'title' | 'description' | 'story_points' | 'due_date' | 'is_complete' | 'checklist'>>) => void;
  onDeleteCard: (cardId: string) => void;
  getCardLabels: (cardId: string) => Label[];
  toggleCardLabel: (cardId: string, labelId: string) => void;
  updateLabel: (labelId: string, updates: Partial<Pick<Label, 'name' | 'color'>>) => void;
  onModalChange: (isOpen: boolean) => void;
}

export function List({
  list,
  lists,
  labels,
  cards,
  onUpdate,
  onDelete,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  getCardLabels,
  toggleCardLabel,
  updateLabel,
  onModalChange,
}: ListProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(list.name);
  const [showMenu, setShowMenu] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('position');
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const isCollapsed = list.is_collapsed ?? false;

  // Sort cards based on selected option
  const sortedCards = useMemo(() => {
    const cardsCopy = [...cards];

    switch (sortBy) {
      case 'story_points_asc':
        return cardsCopy.sort((a, b) => {
          if (a.story_points == null && b.story_points == null) return 0;
          if (a.story_points == null) return 1;
          if (b.story_points == null) return -1;
          return a.story_points - b.story_points;
        });
      case 'story_points_desc':
        return cardsCopy.sort((a, b) => {
          if (a.story_points == null && b.story_points == null) return 0;
          if (a.story_points == null) return 1;
          if (b.story_points == null) return -1;
          return b.story_points - a.story_points;
        });
      case 'due_date_asc':
        return cardsCopy.sort((a, b) => {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });
      case 'due_date_desc':
        return cardsCopy.sort((a, b) => {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
        });
      case 'position':
      default:
        return cardsCopy.sort((a, b) => a.position - b.position);
    }
  }, [cards, sortBy]);

  // Make list a droppable area for cards
  const { setNodeRef } = useDroppable({
    id: list.id,
  });

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        menuButtonRef.current && !menuButtonRef.current.contains(target)
      ) {
        setShowMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  function handleNameSubmit() {
    if (editedName.trim() && editedName !== list.name) {
      onUpdate(list.id, { name: editedName.trim() });
    }
    setIsEditingName(false);
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditedName(list.name);
      setIsEditingName(false);
    }
  }

  function toggleCollapse() {
    onUpdate(list.id, { is_collapsed: !isCollapsed });
  }

  const cardCount = cards.length;

  // Calculate height based on cards: header(40) + cards(65 each) + footer(50) + padding(24)
  const listHeight = Math.max(150, 114 + cardCount * 65);

  return (
    <div
      className={`list ${isCollapsed ? 'list-collapsed' : ''}`}
      style={isCollapsed ? { height: `${listHeight}px` } : undefined}
    >
      <div className="list-header">
        <button className="list-collapse-btn" onClick={toggleCollapse} title={isCollapsed ? 'Expand list' : 'Collapse list'}>
          {isCollapsed ? '»' : '«'}
        </button>

        {isEditingName && !isCollapsed ? (
          <input
            type="text"
            className="list-title-input"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleNameKeyDown}
            autoFocus
          />
        ) : (
          <h3
            className={`list-title ${isCollapsed ? 'list-title-collapsed' : ''}`}
            onClick={() => {
              if (!isCollapsed) {
                setEditedName(list.name);
                setIsEditingName(true);
              }
            }}
          >
            {list.name}
          </h3>
        )}

        <div className="list-menu-container">
          <button ref={menuButtonRef} className="list-menu-btn" onClick={() => setShowMenu(!showMenu)}>
            ···
          </button>
          {showMenu && (
            <div ref={menuRef} className="list-menu">
              <div className="list-menu-section">
                <span className="list-menu-label">Sort by</span>
                <button
                  className={sortBy === 'position' ? 'active' : ''}
                  onClick={() => { setSortBy('position'); }}
                >
                  Manual (Position)
                </button>
                <button
                  className={sortBy === 'story_points_asc' ? 'active' : ''}
                  onClick={() => { setSortBy('story_points_asc'); }}
                >
                  Story Points ↑
                </button>
                <button
                  className={sortBy === 'story_points_desc' ? 'active' : ''}
                  onClick={() => { setSortBy('story_points_desc'); }}
                >
                  Story Points ↓
                </button>
                <button
                  className={sortBy === 'due_date_asc' ? 'active' : ''}
                  onClick={() => { setSortBy('due_date_asc'); }}
                >
                  Due Date ↑
                </button>
                <button
                  className={sortBy === 'due_date_desc' ? 'active' : ''}
                  onClick={() => { setSortBy('due_date_desc'); }}
                >
                  Due Date ↓
                </button>
              </div>
              <div className="list-menu-divider" />
              <button className="list-menu-delete" onClick={() => { onDelete(); setShowMenu(false); }}>
                Delete list
              </button>
            </div>
          )}
        </div>
      </div>

      {isCollapsed ? (
        <div className="list-collapsed-content">
          <span className="list-card-count">{cardCount}</span>
        </div>
      ) : (
        <>
          <div className="list-content" ref={setNodeRef}>
            <SortableContext
              items={sortedCards.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortedCards.map((card) => (
                <SortableCard
                  key={card.id}
                  card={card}
                  lists={lists}
                  labels={labels}
                  cardLabels={getCardLabels(card.id)}
                  onUpdate={(updates) => onUpdateCard(card.id, updates)}
                  onDelete={() => onDeleteCard(card.id)}
                  onMove={() => {}} // Move via drag now
                  onToggleLabel={(labelId) => toggleCardLabel(card.id, labelId)}
                  onUpdateLabel={updateLabel}
                  onModalChange={onModalChange}
                />
              ))}
            </SortableContext>
          </div>
          <div className="list-footer">
            <AddCard onAdd={onAddCard} />
          </div>
        </>
      )}
    </div>
  );
}
