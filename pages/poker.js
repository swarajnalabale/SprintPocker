import { useState, useEffect, useRef } from 'react';
import styles from '../styles/App.module.css';

export default function Poker() {
  const [votes, setVotes] = useState({});
  const [selectedVote, setSelectedVote] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [story, setStory] = useState('');
  const [voterName, setVoterName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const pollingIntervalRef = useRef(null);

  // Fibonacci sequence with special cards
  const votingCards = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, '?', '☕'];

  // Fetch story from API
  const fetchStory = async () => {
    try {
      const response = await fetch('/api/story');
      const data = await response.json();
      if (data.description) {
        setStory(data.description);
      }
    } catch (error) {
      console.error('Error fetching story:', error);
    }
  };

  // Fetch votes from API
  const fetchVotes = async () => {
    try {
      const response = await fetch('/api/votes');
      const data = await response.json();
      setVotes(data.votes || {});
      setIsRevealed(data.isRevealed || false);
      
      // Update selected vote if user has voted
      if (voterName && data.votes && data.votes[voterName]) {
        setSelectedVote(data.votes[voterName]);
      } else if (!data.votes || !data.votes[voterName]) {
        setSelectedVote(null);
      }
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  // Set up polling
  useEffect(() => {
    // Initial fetch
    fetchStory();
    fetchVotes();

    // Set up polling every 2 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchVotes();
    }, 2000);

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Update polling when voterName changes
  useEffect(() => {
    fetchVotes();
  }, [voterName]);

  const handleVote = async (card) => {
    if (!voterName.trim()) {
      alert('Please enter your name first!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voterName: voterName.trim(),
          voteValue: card
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSelectedVote(card);
        // Fetch updated votes
        await fetchVotes();
      } else {
        alert(data.error || 'Failed to submit vote');
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert('Failed to submit vote. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoryUpdate = async () => {
    if (!story.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: story.trim()
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Reset votes when story is updated
        setVotes({});
        setSelectedVote(null);
        setIsRevealed(false);
        await fetchVotes();
      } else {
        alert(data.error || 'Failed to update story');
      }
    } catch (error) {
      console.error('Error updating story:', error);
      alert('Failed to update story. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReveal = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/reveal', {
        method: 'POST'
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsRevealed(true);
        await fetchVotes();
      } else {
        alert(data.error || 'Failed to reveal votes');
      }
    } catch (error) {
      console.error('Error revealing votes:', error);
      alert('Failed to reveal votes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/reset', {
        method: 'POST'
      });

      if (response.ok) {
        setVotes({});
        setSelectedVote(null);
        setIsRevealed(false);
        await fetchVotes();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reset votes');
      }
    } catch (error) {
      console.error('Error resetting votes:', error);
      alert('Failed to reset votes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewStory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/new-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: story.trim() || ''
        })
      });

      if (response.ok) {
        setVotes({});
        setSelectedVote(null);
        setIsRevealed(false);
        if (!story.trim()) {
          setStory('');
        }
        await fetchStory();
        await fetchVotes();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create new story');
      }
    } catch (error) {
      console.error('Error creating new story:', error);
      alert('Failed to create new story. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAverage = () => {
    const numericVotes = Object.values(votes)
      .map(v => {
        // Convert string numbers to numbers, filter out non-numeric values
        const num = typeof v === 'string' ? parseFloat(v) : v;
        return !isNaN(num) && typeof num === 'number' ? num : null;
      })
      .filter(v => v !== null);
    
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
    <div className={styles.App}>
      <div className={styles.sprintPokerContainer}>
        <header className={styles.header}>
          <h1>🎯 Sprint Poker</h1>
          <p className={styles.subtitle}>Vote on story points for your tasks</p>
        </header>

        <div className={styles.storySection}>
          <label htmlFor="story-input">Current Story:</label>
          <div className={styles.storyInputContainer}>
            <input
              id="story-input"
              type="text"
              className={styles.storyInput}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              onBlur={handleStoryUpdate}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleStoryUpdate();
                }
              }}
              placeholder="Enter story description..."
              disabled={isLoading}
            />
            <button
              className={styles.updateStoryBtn}
              onClick={handleStoryUpdate}
              disabled={isLoading || !story.trim()}
            >
              Update
            </button>
          </div>
        </div>

        <div className={styles.voterSection}>
          <input
            type="text"
            className={styles.voterNameInput}
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            placeholder="Enter your name..."
            disabled={isRevealed}
          />
        </div>

        <div className={styles.votingCards}>
          {votingCards.map((card, index) => (
            <button
              key={index}
              className={`${styles.voteCard} ${selectedVote === card ? styles.selected : ''} ${isRevealed ? styles.revealed : ''}`}
              onClick={() => !isRevealed && handleVote(card)}
              disabled={isRevealed || !voterName.trim() || isLoading}
            >
              {card}
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <button 
            className={`${styles.actionBtn} ${styles.revealBtn}`}
            onClick={handleReveal}
            disabled={Object.keys(votes).length === 0 || isRevealed || isLoading}
          >
            {isRevealed ? 'Results Revealed' : 'Reveal Votes'}
          </button>
          <button 
            className={`${styles.actionBtn} ${styles.resetBtn}`}
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset Votes
          </button>
          <button 
            className={`${styles.actionBtn} ${styles.newStoryBtn}`}
            onClick={handleNewStory}
            disabled={isLoading}
          >
            New Story
          </button>
        </div>

        {isRevealed && (
          <div className={styles.resultsSection}>
            <h2>Voting Results</h2>
            <div className={styles.resultsGrid}>
              <div className={styles.resultItem}>
                <span className={styles.resultLabel}>Total Votes:</span>
                <span className={styles.resultValue}>{Object.keys(votes).length}</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultLabel}>Average:</span>
                <span className={styles.resultValue}>{calculateAverage()}</span>
              </div>
            </div>
            
            <div className={styles.voteBreakdown}>
              <h3>Vote Breakdown</h3>
              <div className={styles.voteCounts}>
                {Object.entries(getVoteCounts()).map(([vote, count]) => (
                  <div key={vote} className={styles.voteCountItem}>
                    <span className={styles.voteValue}>{vote}</span>
                    <span className={styles.voteCount}>{count} vote{count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.individualVotes}>
              <h3>Individual Votes</h3>
              <div className={styles.votesList}>
                {Object.entries(votes).map(([name, vote]) => (
                  <div key={name} className={styles.voteEntry}>
                    <span className={styles.voterName}>{name}:</span>
                    <span className={styles.voteDisplay}>{vote}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!isRevealed && Object.keys(votes).length > 0 && (
          <div className={styles.waitingMessage}>
            <p>Waiting for all votes... ({Object.keys(votes).length} vote{Object.keys(votes).length !== 1 ? 's' : ''} submitted)</p>
          </div>
        )}
      </div>
    </div>
  );
}

