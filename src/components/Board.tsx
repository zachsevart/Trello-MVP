import { useState } from 'react';
import { useBoard } from '../hooks/useBoard';
import { useLists } from '../hooks/useLists';
import { useLabels } from '../hooks/useLabels';
import { List } from './List';
import { AddList } from './AddList';
import './Board.css';

export function Board() {
  const { board, boards, loading, updateBoardName, switchBoard } = useBoard();
  const { lists, addList, updateList, deleteList } = useLists(board?.id);
  const { labels, toggleCardLabel, getCardLabels } = useLabels(board?.id);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  function triggerRefresh() {
    setRefreshTrigger(prev => prev + 1);
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

  return (
    <div className="board">
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
          <select
            value={board.id}
            onChange={(e) => switchBoard(e.target.value)}
            className="board-select"
          >
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="board-lists">
        {lists.map((list) => (
          <List
            key={list.id}
            list={list}
            lists={lists}
            labels={labels}
            onUpdate={updateList}
            onDelete={() => deleteList(list.id)}
            onCardMove={triggerRefresh}
            getCardLabels={getCardLabels}
            toggleCardLabel={toggleCardLabel}
            refreshTrigger={refreshTrigger}
          />
        ))}
        <AddList onAdd={addList} />
      </div>
    </div>
  );
}
