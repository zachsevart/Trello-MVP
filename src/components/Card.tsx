import { useState } from 'react';
import type { Card as CardType, List, Label } from '../types';
import './Card.css';

interface CardProps {
  card: CardType;
  lists: List[];
  labels: Label[];
  cardLabels: Label[];
  onUpdate: (updates: Partial<Pick<CardType, 'title' | 'description' | 'story_points' | 'due_date'>>) => void;
  onDelete: () => void;
  onMove: (targetListId: string) => void;
  onToggleLabel: (labelId: string) => void;
}

export function Card({
  card,
  lists,
  labels,
  cardLabels,
  onUpdate,
  onDelete,
  onMove,
  onToggleLabel,
}: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(card.title);
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showLabelMenu, setShowLabelMenu] = useState(false);
  const [showDetailsMenu, setShowDetailsMenu] = useState(false);

  function handleTitleSubmit() {
    if (editedTitle.trim() && editedTitle !== card.title) {
      onUpdate({ title: editedTitle.trim() });
    }
    setIsEditing(false);
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditedTitle(card.title);
      setIsEditing(false);
    }
  }

  function isOverdue(): boolean {
    if (!card.due_date) return false;
    return new Date(card.due_date) < new Date();
  }

  function formatDueDate(): string {
    if (!card.due_date) return '';
    const date = new Date(card.due_date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="card">
      {/* Labels */}
      {cardLabels.length > 0 && (
        <div className="card-labels">
          {cardLabels.map((label) => (
            <span
              key={label.id}
              className="card-label"
              style={{ backgroundColor: label.color }}
              title={label.name}
            />
          ))}
        </div>
      )}

      {/* Title */}
      {isEditing ? (
        <input
          type="text"
          className="card-title-input"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onBlur={handleTitleSubmit}
          onKeyDown={handleTitleKeyDown}
          autoFocus
        />
      ) : (
        <p
          className="card-title"
          onClick={() => {
            setEditedTitle(card.title);
            setIsEditing(true);
          }}
        >
          {card.title}
        </p>
      )}

      {/* Badges */}
      <div className="card-badges">
        {card.story_points != null && (
          <span className="card-badge card-badge-points">
            {card.story_points} pts
          </span>
        )}
        {card.due_date && (
          <span className={`card-badge card-badge-date ${isOverdue() ? 'overdue' : ''}`}>
            {formatDueDate()}
          </span>
        )}
      </div>

      {/* Actions Menu Button */}
      <button
        className="card-menu-btn"
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
      >
        ...
      </button>

      {/* Actions Menu */}
      {showMenu && (
        <div className="card-menu" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { setShowLabelMenu(true); setShowMenu(false); }}>
            Labels
          </button>
          <button onClick={() => { setShowDetailsMenu(true); setShowMenu(false); }}>
            Edit Details
          </button>
          <button onClick={() => { setShowMoveMenu(true); setShowMenu(false); }}>
            Move
          </button>
          <button onClick={() => { onDelete(); setShowMenu(false); }}>
            Delete
          </button>
        </div>
      )}

      {/* Move Menu */}
      {showMoveMenu && (
        <div className="card-menu" onClick={(e) => e.stopPropagation()}>
          <div className="card-menu-header">
            Move to list
            <button className="card-menu-close" onClick={() => setShowMoveMenu(false)}>✕</button>
          </div>
          {lists
            .filter((l) => l.id !== card.list_id)
            .map((list) => (
              <button
                key={list.id}
                onClick={() => {
                  onMove(list.id);
                  setShowMoveMenu(false);
                }}
              >
                {list.name}
              </button>
            ))}
        </div>
      )}

      {/* Labels Menu */}
      {showLabelMenu && (
        <div className="card-menu card-label-menu" onClick={(e) => e.stopPropagation()}>
          <div className="card-menu-header">
            Labels
            <button className="card-menu-close" onClick={() => setShowLabelMenu(false)}>✕</button>
          </div>
          {labels.map((label) => {
            const isActive = cardLabels.some((cl) => cl.id === label.id);
            return (
              <button
                key={label.id}
                className={`label-option ${isActive ? 'active' : ''}`}
                onClick={() => onToggleLabel(label.id)}
              >
                <span className="label-color" style={{ backgroundColor: label.color }} />
                <span className="label-name">{label.name || 'No name'}</span>
                {isActive && <span className="label-check">✓</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Details Menu (Story Points & Due Date) */}
      {showDetailsMenu && (
        <div className="card-menu card-details-menu" onClick={(e) => e.stopPropagation()}>
          <div className="card-menu-header">
            Edit Details
            <button className="card-menu-close" onClick={() => setShowDetailsMenu(false)}>✕</button>
          </div>
          <div className="card-detail-field">
            <label>Story Points</label>
            <input
              type="number"
              min="0"
              value={card.story_points ?? ''}
              onChange={(e) => {
                const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
                onUpdate({ story_points: value });
              }}
            />
          </div>
          <div className="card-detail-field">
            <label>Due Date</label>
            <input
              type="date"
              value={card.due_date ? card.due_date.split('T')[0] : ''}
              onChange={(e) => {
                const value = e.target.value || null;
                onUpdate({ due_date: value });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
