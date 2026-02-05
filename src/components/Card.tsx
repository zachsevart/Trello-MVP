import { useState, useRef, useEffect } from 'react';
import type { Card as CardType, List, Label } from '../types';
import { CardModal } from './CardModal';
import './Card.css';

interface CardProps {
  card: CardType;
  lists: List[];
  labels: Label[];
  cardLabels: Label[];
  onUpdate: (updates: Partial<Pick<CardType, 'title' | 'description' | 'story_points' | 'due_date' | 'is_complete' | 'checklist'>>) => void;
  onDelete: () => void;
  onMove: (targetListId: string) => void;
  onToggleLabel: (labelId: string) => void;
  onUpdateLabel: (labelId: string, updates: Partial<Pick<Label, 'name' | 'color'>>) => void;
  onModalChange?: (isOpen: boolean) => void;
}

interface MenuPosition {
  top: number;
  left: number;
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
  onUpdateLabel,
  onModalChange,
}: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(card.title);
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showLabelMenu, setShowLabelMenu] = useState(false);
  const [showDetailsMenu, setShowDetailsMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ top: 0, left: 0 });
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editedLabelName, setEditedLabelName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAnyMenuOpen = showMenu || showMoveMenu || showLabelMenu || showDetailsMenu;

  function openModal() {
    setShowModal(true);
    onModalChange?.(true);
  }

  function closeModal() {
    setShowModal(false);
    onModalChange?.(false);
  }

  // Close menus when clicking outside
  useEffect(() => {
    if (!isAnyMenuOpen) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        menuButtonRef.current && !menuButtonRef.current.contains(target)
      ) {
        setShowMenu(false);
        setShowMoveMenu(false);
        setShowLabelMenu(false);
        setShowDetailsMenu(false);
        setEditingLabelId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAnyMenuOpen]);

  function openMenu(setter: (v: boolean) => void) {
    if (menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.right - 220, // menu width is 220px
      });
    }
    setter(true);
  }

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

  function toggleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    onUpdate({ is_complete: !card.is_complete });
  }

  function startEditingLabel(label: Label, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingLabelId(label.id);
    setEditedLabelName(label.name || '');
  }

  function handleLabelNameSubmit(labelId: string) {
    if (editedLabelName !== labels.find(l => l.id === labelId)?.name) {
      onUpdateLabel(labelId, { name: editedLabelName });
    }
    setEditingLabelId(null);
  }

  function handleLabelNameKeyDown(e: React.KeyboardEvent, labelId: string) {
    if (e.key === 'Enter') {
      handleLabelNameSubmit(labelId);
    } else if (e.key === 'Escape') {
      setEditingLabelId(null);
    }
  }

  return (
    <div className={`card ${card.is_complete ? 'card-complete' : ''}`} onClick={() => openModal()}>
      {/* Labels */}
      {cardLabels.length > 0 && (
        <div className="card-labels">
          {cardLabels.map((label) => (
            <span
              key={label.id}
              className="card-label"
              style={{ backgroundColor: label.color }}
              title={label.name || 'Unnamed label'}
            >
              {label.name && <span className="card-label-text">{label.name}</span>}
            </span>
          ))}
        </div>
      )}

      {/* Card content row with checkbox */}
      <div className="card-content-row">
        {/* Checkbox */}
        <button
          className={`card-checkbox ${card.is_complete ? 'checked' : ''}`}
          onClick={toggleComplete}
          title={card.is_complete ? 'Mark incomplete' : 'Mark complete'}
        >
          {card.is_complete && <span className="checkmark">✓</span>}
        </button>

        {/* Title */}
        {isEditing ? (
          <input
            type="text"
            className="card-title-input"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleTitleKeyDown}
            onClick={(e) => e.stopPropagation()}
            size={Math.max(1, editedTitle.length)}
            autoFocus
          />
        ) : (
          <p
            className="card-title"
            onClick={(e) => {
              e.stopPropagation();
              setEditedTitle(card.title);
              setIsEditing(true);
            }}
          >
            {card.title}
          </p>
        )}
      </div>

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
        ref={menuButtonRef}
        className="card-menu-btn"
        onClick={(e) => {
          e.stopPropagation();
          if (!showMenu) {
            openMenu(setShowMenu);
          } else {
            setShowMenu(false);
          }
        }}
      >
        ···
      </button>

      {/* Actions Menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className="card-menu"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => { openModal(); setShowMenu(false); }}>
            Open Card
          </button>
          <button onClick={() => { openMenu(setShowLabelMenu); setShowMenu(false); }}>
            Labels
          </button>
          <button onClick={() => { openMenu(setShowDetailsMenu); setShowMenu(false); }}>
            Edit Details
          </button>
          <button onClick={() => { openMenu(setShowMoveMenu); setShowMenu(false); }}>
            Move
          </button>
          <button onClick={() => { onDelete(); setShowMenu(false); }}>
            Delete
          </button>
        </div>
      )}

      {/* Move Menu */}
      {showMoveMenu && (
        <div
          ref={menuRef}
          className="card-menu"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onClick={(e) => e.stopPropagation()}
        >
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
        <div
          ref={menuRef}
          className="card-menu card-label-menu"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="card-menu-header">
            Labels
            <button className="card-menu-close" onClick={() => setShowLabelMenu(false)}>✕</button>
          </div>
          {labels.map((label) => {
            const isActive = cardLabels.some((cl) => cl.id === label.id);
            const isEditingThis = editingLabelId === label.id;
            return (
              <div key={label.id} className={`label-option ${isActive ? 'active' : ''}`}>
                <button
                  className="label-toggle-btn"
                  onClick={() => onToggleLabel(label.id)}
                >
                  <span className="label-color" style={{ backgroundColor: label.color }} />
                  {isEditingThis ? (
                    <input
                      type="text"
                      className="label-name-input"
                      value={editedLabelName}
                      onChange={(e) => setEditedLabelName(e.target.value)}
                      onBlur={() => handleLabelNameSubmit(label.id)}
                      onKeyDown={(e) => handleLabelNameKeyDown(e, label.id)}
                      onClick={(e) => e.stopPropagation()}
                      size={Math.max(1, editedLabelName.length)}
                      autoFocus
                    />
                  ) : (
                    <span className="label-name">{label.name || 'Click pencil to name'}</span>
                  )}
                  {isActive && <span className="label-check">✓</span>}
                </button>
                <button
                  className="label-edit-btn"
                  onClick={(e) => startEditingLabel(label, e)}
                  title="Edit label name"
                >
                  ✎
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Menu (Story Points & Due Date) */}
      {showDetailsMenu && (
        <div
          ref={menuRef}
          className="card-menu card-details-menu"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onClick={(e) => e.stopPropagation()}
        >
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

      {/* Card Modal */}
      {showModal && (
        <CardModal
          card={card}
          lists={lists}
          labels={labels}
          cardLabels={cardLabels}
          onClose={closeModal}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onToggleLabel={onToggleLabel}
          onUpdateLabel={onUpdateLabel}
        />
      )}
    </div>
  );
}
