import './List.css';

/**
 * List Component
 *
 * Displays a single list column with cards.
 * TODO: Implement card rendering and CRUD operations
 */
export function List() {
  return (
    <div className="list">
      <div className="list-header">
        <h3 className="list-title">Sample List</h3>
      </div>
      <div className="list-content">
        {/* Cards will be rendered here */}
      </div>
    </div>
  );
}
