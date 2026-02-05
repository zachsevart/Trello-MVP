import { useState, useRef, useEffect } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { SortableCard } from './SortableCard';
import { AddCard } from './AddCard';
import type { List as ListType, Label, Card as CardType } from '../types';
import './List.css';

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
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const isCollapsed = list.is_collapsed ?? false;

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
              <button onClick={() => { onDelete(); setShowMenu(false); }}>
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
              items={cards.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {cards.map((card) => (
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
