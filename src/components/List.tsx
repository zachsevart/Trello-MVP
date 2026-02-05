import { useState } from 'react';
import { useCards } from '../hooks/useCards';
import { Card } from './Card';
import { AddCard } from './AddCard';
import type { List as ListType, Label } from '../types';
import './List.css';

interface ListProps {
  list: ListType;
  lists: ListType[];
  labels: Label[];
  onUpdate: (listId: string, updates: Partial<Pick<ListType, 'name' | 'is_collapsed'>>) => void;
  onDelete: () => void;
  onCardMove: () => void;
  getCardLabels: (cardId: string) => Label[];
  toggleCardLabel: (cardId: string, labelId: string) => void;
  refreshTrigger: number;
}

export function List({
  list,
  lists,
  labels,
  onUpdate,
  onDelete,
  onCardMove,
  getCardLabels,
  toggleCardLabel,
  refreshTrigger,
}: ListProps) {
  const { cards, addCard, updateCard, deleteCard, moveCard } = useCards(list.id, refreshTrigger);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(list.name);
  const [showMenu, setShowMenu] = useState(false);

  const isCollapsed = list.is_collapsed ?? false;

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

  function handleMoveCard(cardId: string, targetListId: string) {
    const targetList = lists.find(l => l.id === targetListId);
    if (targetList) {
      moveCard(cardId, targetListId, 0);
      onCardMove();
    }
  }

  return (
    <div className={`list ${isCollapsed ? 'list-collapsed' : ''}`}>
      <div className="list-header">
        <button className="list-collapse-btn" onClick={toggleCollapse}>
          {isCollapsed ? '>' : 'v'}
        </button>

        {isEditingName ? (
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
            className="list-title"
            onClick={() => {
              setEditedName(list.name);
              setIsEditingName(true);
            }}
          >
            {list.name}
          </h3>
        )}

        <div className="list-menu-container">
          <button className="list-menu-btn" onClick={() => setShowMenu(!showMenu)}>
            ...
          </button>
          {showMenu && (
            <div className="list-menu">
              <button onClick={() => { onDelete(); setShowMenu(false); }}>
                Delete list
              </button>
            </div>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="list-content">
            {cards.map((card) => (
              <Card
                key={card.id}
                card={card}
                lists={lists}
                labels={labels}
                cardLabels={getCardLabels(card.id)}
                onUpdate={(updates) => updateCard(card.id, updates)}
                onDelete={() => deleteCard(card.id)}
                onMove={(targetListId) => handleMoveCard(card.id, targetListId)}
                onToggleLabel={(labelId) => toggleCardLabel(card.id, labelId)}
              />
            ))}
          </div>
          <div className="list-footer">
            <AddCard onAdd={addCard} />
          </div>
        </>
      )}
    </div>
  );
}
