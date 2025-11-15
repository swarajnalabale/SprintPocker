import { useState } from 'react';
import './App.css';

function App() {
  const [votes, setVotes] = useState({});
  const [selectedVote, setSelectedVote] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [story, setStory] = useState('Implement user authentication feature');
  const [voterName, setVoterName] = useState('');

  // Fibonacci sequence with special cards
  const votingCards = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, '?', '☕'];

  const handleVote = (card) => {
    if (!voterName.trim()) {
      alert('Please enter your name first!');
      return;
    }
    setVotes(prev => ({
      ...prev,
      [voterName]: card
    }));
    setSelectedVote(card);
  };

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleReset = () => {
    setVotes({});
    setSelectedVote(null);
    setIsRevealed(false);
    setVoterName('');
  };

  const handleNewStory = () => {
    setVotes({});
    setSelectedVote(null);
    setIsRevealed(false);
    setVoterName('');
    setStory('');
  };

  const calculateAverage = () => {
    const numericVotes = Object.values(votes).filter(v => typeof v === 'number');
    if (numericVotes.length === 0) return 0;
    const sum = numericVotes.reduce((a, b) => a + b, 0);
    return (sum / numericVotes.length).toFixed(1);
  };

  const getVoteCounts = () => {
    const counts = {};
    Object.values(votes).forEach(vote => {
      counts[vote] = (counts[vote] || 0) + 1;
    });
    return counts;
  };

  return (
    <div className="App">
      <div className="sprint-poker-container">
        <header className="header">
          <h1>🎯 Sprint Poker</h1>
          <p className="subtitle">Vote on story points for your tasks</p>
        </header>

        <div className="story-section">
          <label htmlFor="story-input">Current Story:</label>
          <input
            id="story-input"
            type="text"
            className="story-input"
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Enter story description..."
          />
        </div>

        <div className="voter-section">
          <input
            type="text"
            className="voter-name-input"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            placeholder="Enter your name..."
            disabled={isRevealed}
          />
        </div>

        <div className="voting-cards">
          {votingCards.map((card, index) => (
            <button
              key={index}
              className={`vote-card ${selectedVote === card ? 'selected' : ''} ${isRevealed ? 'revealed' : ''}`}
              onClick={() => !isRevealed && handleVote(card)}
              disabled={isRevealed || !voterName.trim()}
            >
              {card}
            </button>
          ))}
        </div>

        <div className="actions">
          <button 
            className="action-btn reveal-btn" 
            onClick={handleReveal}
            disabled={Object.keys(votes).length === 0 || isRevealed}
          >
            {isRevealed ? 'Results Revealed' : 'Reveal Votes'}
          </button>
          <button 
            className="action-btn reset-btn" 
            onClick={handleReset}
          >
            Reset Votes
          </button>
          <button 
            className="action-btn new-story-btn" 
            onClick={handleNewStory}
          >
            New Story
          </button>
        </div>

        {isRevealed && (
          <div className="results-section">
            <h2>Voting Results</h2>
            <div className="results-grid">
              <div className="result-item">
                <span className="result-label">Total Votes:</span>
                <span className="result-value">{Object.keys(votes).length}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Average:</span>
                <span className="result-value">{calculateAverage()}</span>
              </div>
            </div>
            
            <div className="vote-breakdown">
              <h3>Vote Breakdown</h3>
              <div className="vote-counts">
                {Object.entries(getVoteCounts()).map(([vote, count]) => (
                  <div key={vote} className="vote-count-item">
                    <span className="vote-value">{vote}</span>
                    <span className="vote-count">{count} vote{count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="individual-votes">
              <h3>Individual Votes</h3>
              <div className="votes-list">
                {Object.entries(votes).map(([name, vote]) => (
                  <div key={name} className="vote-entry">
                    <span className="voter-name">{name}:</span>
                    <span className="vote-display">{vote}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!isRevealed && Object.keys(votes).length > 0 && (
          <div className="waiting-message">
            <p>Waiting for all votes... ({Object.keys(votes).length} vote{Object.keys(votes).length !== 1 ? 's' : ''} submitted)</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
