import { useState } from 'react';
import './AddCard.css';

interface AddCardProps {
  onAdd: (title: string) => void;
}

export function AddCard({ onAdd }: AddCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle('');
    }
  }

  function handleCancel() {
    setTitle('');
    setIsAdding(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      handleCancel();
    }
  }

  if (!isAdding) {
    return (
      <button className="add-card-button" onClick={() => setIsAdding(true)}>
        + Add a card
      </button>
    );
  }

  return (
    <form className="add-card-form" onSubmit={handleSubmit}>
      <textarea
        className="add-card-input"
        placeholder="Enter a title for this card..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        rows={3}
      />
      <div className="add-card-actions">
        <button type="submit" className="add-card-submit">
          Add card
        </button>
        <button type="button" className="add-card-cancel" onClick={handleCancel}>
          ✕
        </button>
      </div>
    </form>
  );
}
