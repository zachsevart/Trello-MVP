import { useState } from 'react';
import './AddList.css';

interface AddListProps {
  onAdd: (name: string) => void;
}

export function AddList({ onAdd }: AddListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
      setIsAdding(false);
    }
  }

  function handleCancel() {
    setName('');
    setIsAdding(false);
  }

  if (!isAdding) {
    return (
      <button className="add-list-button" onClick={() => setIsAdding(true)}>
        + Add another list
      </button>
    );
  }

  return (
    <form className="add-list-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="add-list-input"
        placeholder="Enter list title..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <div className="add-list-actions">
        <button type="submit" className="add-list-submit">
          Add list
        </button>
        <button type="button" className="add-list-cancel" onClick={handleCancel}>
          ✕
        </button>
      </div>
    </form>
  );
}
