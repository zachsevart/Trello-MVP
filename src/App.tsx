import { Board } from './components/Board';
import './App.css';

/**
 * App Component - Root of the application
 */
function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Trello MVP</h1>
      </header>
      <main className="board-container">
        <Board />
      </main>
    </div>
  );
}

export default App;
