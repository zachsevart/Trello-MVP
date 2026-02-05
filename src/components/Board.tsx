import './Board.css';

/**
 * Board Component
 *
 * Main container for the Trello board.
 * TODO: Implement board fetching and list rendering
 */
export function Board() {
  return (
    <div className="board">
      <div className="board-header">
        <h2 className="board-name">My Board</h2>
      </div>
      <div className="board-lists">
        {/* Lists will be rendered here */}
        <p style={{ color: 'white', padding: '20px' }}>
          Board component initialized. Lists coming soon.
        </p>
      </div>
    </div>
  );
}
