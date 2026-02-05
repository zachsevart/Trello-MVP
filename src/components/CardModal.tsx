import { useState, useEffect, useRef } from 'react';
import type { Card as CardType, List, Label, ChecklistItem } from '../types';
import './CardModal.css';

interface CardModalProps {
  card: CardType;
  lists: List[];
  labels: Label[];
  cardLabels: Label[];
  onClose: () => void;
  onUpdate: (updates: Partial<Pick<CardType, 'title' | 'description' | 'story_points' | 'due_date' | 'is_complete' | 'checklist'>>) => void;
  onDelete: () => void;
  onToggleLabel: (labelId: string) => void;
  onUpdateLabel: (labelId: string, updates: Partial<Pick<Label, 'name' | 'color'>>) => void;
}

export function CardModal({
  card,
  lists,
  labels,
  cardLabels,
  onClose,
  onUpdate,
  onDelete,
  onToggleLabel,
  onUpdateLabel,
}: CardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(card.checklist || []);
  const [newItemText, setNewItemText] = useState('');
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editedLabelName, setEditedLabelName] = useState('');
  const labelPickerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (showLabelPicker) {
          setShowLabelPicker(false);
        } else {
          onClose();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showLabelPicker]);

  // Close label picker when clicking outside
  useEffect(() => {
    if (!showLabelPicker) return;

    function handleClickOutside(e: MouseEvent) {
      if (labelPickerRef.current && !labelPickerRef.current.contains(e.target as Node)) {
        setShowLabelPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLabelPicker]);

  function handleTitleSubmit() {
    if (title.trim() && title !== card.title) {
      onUpdate({ title: title.trim() });
    }
    setIsEditingTitle(false);
  }

  function handleDescriptionSubmit() {
    if (description !== card.description) {
      onUpdate({ description });
    }
    setIsEditingDescription(false);
  }

  function handleAddChecklistItem() {
    if (!newItemText.trim()) return;

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newItemText.trim(),
      checked: false,
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    onUpdate({ checklist: updated });
    setNewItemText('');
  }

  function handleToggleChecklistItem(itemId: string) {
    const updated = checklist.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    setChecklist(updated);
    onUpdate({ checklist: updated });
  }

  function handleDeleteChecklistItem(itemId: string) {
    const updated = checklist.filter(item => item.id !== itemId);
    setChecklist(updated);
    onUpdate({ checklist: updated });
  }

  function handleChecklistKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleAddChecklistItem();
    }
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

  const completedCount = checklist.filter(item => item.checked).length;
  const totalCount = checklist.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Title */}
        <div className="modal-header">
          {isEditingTitle ? (
            <input
              type="text"
              className="modal-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
            />
          ) : (
            <h2 className="modal-title" onClick={() => setIsEditingTitle(true)}>
              {card.title}
            </h2>
          )}
          <p className="modal-list-info">
            in list <strong>{lists.find(l => l.id === card.list_id)?.name}</strong>
          </p>
        </div>

        <div className="modal-body">
          {/* Left Column */}
          <div className="modal-main">
            {/* Labels */}
            {cardLabels.length > 0 && (
              <div className="modal-section">
                <h3 className="modal-section-title">Labels</h3>
                <div className="modal-labels">
                  {cardLabels.map((label) => (
                    <span
                      key={label.id}
                      className="modal-label"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name || ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="modal-section">
              <h3 className="modal-section-title">Description</h3>
              {isEditingDescription ? (
                <div className="description-edit">
                  <textarea
                    className="modal-description-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a more detailed description..."
                    autoFocus
                  />
                  <div className="description-actions">
                    <button className="btn-save" onClick={handleDescriptionSubmit}>Save</button>
                    <button className="btn-cancel" onClick={() => {
                      setDescription(card.description || '');
                      setIsEditingDescription(false);
                    }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div
                  className="modal-description"
                  onClick={() => setIsEditingDescription(true)}
                >
                  {description || 'Add a more detailed description...'}
                </div>
              )}
            </div>

            {/* Checklist */}
            <div className="modal-section">
              <h3 className="modal-section-title">Checklist</h3>

              {/* Progress bar */}
              {totalCount > 0 && (
                <div className="checklist-progress">
                  <span className="progress-text">{Math.round(progressPercent)}%</span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Checklist items */}
              <div className="checklist-items">
                {checklist.map((item) => (
                  <div key={item.id} className="checklist-item">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleToggleChecklistItem(item.id)}
                      className="checklist-checkbox"
                    />
                    <span className={`checklist-text ${item.checked ? 'checked' : ''}`}>
                      {item.text}
                    </span>
                    <button
                      className="checklist-delete"
                      onClick={() => handleDeleteChecklistItem(item.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new item */}
              <div className="checklist-add">
                <input
                  type="text"
                  className="checklist-add-input"
                  placeholder="Add an item..."
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={handleChecklistKeyDown}
                />
                <button className="checklist-add-btn" onClick={handleAddChecklistItem}>
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="modal-sidebar">
            <div className="sidebar-section">
              <h4 className="sidebar-title">Add to card</h4>
              <div className="sidebar-btn-wrapper" ref={labelPickerRef}>
                <button
                  className="sidebar-btn"
                  onClick={() => setShowLabelPicker(!showLabelPicker)}
                >
                  Labels
                </button>
                {showLabelPicker && (
                  <div className="label-picker">
                    {labels.map((label) => {
                      const isActive = cardLabels.some((cl) => cl.id === label.id);
                      const isEditing = editingLabelId === label.id;
                      return (
                        <div key={label.id} className={`label-picker-item ${isActive ? 'active' : ''}`}>
                          <button
                            className="label-picker-toggle"
                            onClick={() => onToggleLabel(label.id)}
                          >
                            <span
                              className="label-picker-color"
                              style={{ backgroundColor: label.color }}
                            />
                            {isEditing ? (
                              <input
                                type="text"
                                className="label-picker-input"
                                value={editedLabelName}
                                onChange={(e) => setEditedLabelName(e.target.value)}
                                onBlur={() => handleLabelNameSubmit(label.id)}
                                onKeyDown={(e) => handleLabelNameKeyDown(e, label.id)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                              />
                            ) : (
                              <span className="label-picker-name">{label.name || 'Unnamed'}</span>
                            )}
                            {isActive && <span className="label-picker-check">✓</span>}
                          </button>
                          <button
                            className="label-picker-edit"
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
              </div>
            </div>

            <div className="sidebar-section">
              <h4 className="sidebar-title">Details</h4>
              <div className="sidebar-field">
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
              <div className="sidebar-field">
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

            <div className="sidebar-section">
              <h4 className="sidebar-title">Actions</h4>
              <button
                className="sidebar-btn sidebar-btn-danger"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
              >
                Delete Card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
