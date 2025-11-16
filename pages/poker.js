import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/App.module.css';

export default function Poker() {
  const router = useRouter();
  const { sessionId: urlSessionId } = router.query;
  
  const [sessionId, setSessionId] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [votes, setVotes] = useState({});
  const [selectedVote, setSelectedVote] = useState(null);
  const [pendingVote, setPendingVote] = useState(null); // Vote selected but not yet submitted
  const [isRevealed, setIsRevealed] = useState(false);
  const [story, setStory] = useState('');
  const [savedStory, setSavedStory] = useState(''); // Track the saved story from server
  const [voterName, setVoterName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [isUpdatingStory, setIsUpdatingStory] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [joinSessionId, setJoinSessionId] = useState('');
  const pollingIntervalRef = useRef(null);
  const skipNextStoryPollRef = useRef(false); // Flag to skip next story poll after update
  const lastVoteUpdateRef = useRef(0); // Track last vote update timestamp
  const lastStoryUpdateRef = useRef(0); // Track last story update timestamp
  const lastVoteCountRef = useRef(0); // Track last vote count
  const needsVoteCheckRef = useRef(false); // Flag to check votes immediately
  const needsStoryCheckRef = useRef(false); // Flag to check story immediately
  const isStoryInputFocusedRef = useRef(false); // Track if story input is focused

  // Fibonacci sequence with special cards
  const votingCards = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, '?', '☕'];

  // Initialize session from URL only (no auto-redirect)
  useEffect(() => {
    // Clean up old currentSessionId from localStorage to prevent auto-redirect
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentSessionId');
    }

    if (urlSessionId) {
      const storedAdminToken = localStorage.getItem(`adminToken_${urlSessionId}`);
      setSessionId(urlSessionId);
      if (storedAdminToken) {
        setAdminToken(storedAdminToken);
        setIsAdmin(true);
      }
    } else {
      // Clear any existing session state when on /poker without sessionId
      setSessionId('');
      setAdminToken('');
      setIsAdmin(false);
    }
  }, [urlSessionId]);

  // Fetch session info
  const fetchSessionInfo = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`/api/poker-session/${sessionId}?adminToken=${adminToken}`);
      const data = await response.json();
      
      if (response.ok) {
        setIsAdmin(data.isAdmin || false);
        if (data.activeStory) {
          const storyDescription = data.activeStory.description || '';
          setStory(storyDescription);
          setSavedStory(storyDescription); // Update saved story
        } else {
          setStory('');
          setSavedStory('');
        }
      }
    } catch (error) {
      console.error('Error fetching session info:', error);
    }
  };

  // Fetch story from API (only if changed)
  const fetchStory = async (force = false) => {
    if (!sessionId) return;
    
    // Skip if we just updated (to avoid overwriting)
    if (skipNextStoryPollRef.current && !force) {
      skipNextStoryPollRef.current = false;
      return;
    }
    
    // Skip if user is currently typing in the story input
    if (isStoryInputFocusedRef.current && !force) {
      return;
    }
    
    try {
      const response = await fetch(`/api/poker-session/${sessionId}/story`);
      const data = await response.json();
      
      // Only update if story has changed (check timestamp or content)
      const storyUpdated = data.lastUpdated || 0;
      if (force || storyUpdated > lastStoryUpdateRef.current || !data.id) {
        // Only update if the server story is different from current local story
        // This prevents overwriting user input
        const serverStory = data.description || '';
        if (force || serverStory !== story) {
          if (data.description) {
            setStory(data.description);
            setSavedStory(data.description); // Update saved story
          } else {
            setStory('');
            setSavedStory('');
          }
          lastStoryUpdateRef.current = storyUpdated;
          needsStoryCheckRef.current = false;
        }
      }
    } catch (error) {
      console.error('Error fetching story:', error);
    }
  };

  // Fetch votes from API (only if changed)
  const fetchVotes = async (force = false) => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`/api/poker-session/${sessionId}/votes`);
      const data = await response.json();
      
      // Only update if votes have changed (check timestamp or vote count)
      const voteUpdated = data.lastUpdated || 0;
      const voteCount = data.voteCount || 0;
      
      if (force || voteUpdated > lastVoteUpdateRef.current || voteCount !== lastVoteCountRef.current) {
        setVotes(data.votes || {});
        setIsRevealed(data.isRevealed || false);
        
        // Update selected vote if user has voted
        if (voterName && data.votes && data.votes[voterName]) {
          setSelectedVote(data.votes[voterName]);
          setPendingVote(null); // Clear pending vote if already submitted
        } else if (!data.votes || !data.votes[voterName]) {
          setSelectedVote(null);
        }
        
        lastVoteUpdateRef.current = voteUpdated;
        lastVoteCountRef.current = voteCount;
        needsVoteCheckRef.current = false;
      }
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  // Set up smart polling when session is available
  useEffect(() => {
    if (!sessionId) return;

    // Initial fetch (force to get initial state)
    fetchSessionInfo();
    fetchStory(true);
    fetchVotes(true);

    // Smart polling - only check when needed
    pollingIntervalRef.current = setInterval(() => {
      // Always check votes if not revealed (people might be voting)
      if (!isRevealed) {
        fetchVotes();
      } else if (needsVoteCheckRef.current) {
        // Check votes if flag is set (after reveal/reset)
        fetchVotes();
      }
      
      // Always check story periodically (admin might have updated)
      // This ensures voters see story updates
      fetchStory();
      
      // Clear flags after checking
      if (needsStoryCheckRef.current) {
        needsStoryCheckRef.current = false;
      }
      if (needsVoteCheckRef.current) {
        needsVoteCheckRef.current = false;
      }
    }, 5000); // Check every 5 seconds (balance between responsiveness and efficiency)

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [sessionId, isRevealed]);

  // Helper to trigger immediate vote check (called after actions)
  const triggerVoteCheck = () => {
    needsVoteCheckRef.current = true;
    fetchVotes(true);
  };

  // Helper to trigger immediate story check (called after actions)
  const triggerStoryCheck = () => {
    needsStoryCheckRef.current = true;
    fetchStory(true);
  };

  // Update polling when voterName changes
  useEffect(() => {
    if (sessionId) {
      fetchVotes();
    }
  }, [voterName, sessionId]);

  // Create new session
  const handleCreateSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/poker-session/create', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (response.ok) {
        const newSessionId = data.sessionId;
        const newAdminToken = data.adminToken;
        
        // Store admin token in localStorage (but not currentSessionId to avoid auto-redirect)
        localStorage.setItem(`adminToken_${newSessionId}`, newAdminToken);
        
        setSessionId(newSessionId);
        setAdminToken(newAdminToken);
        setIsAdmin(true);
        setShowCreateSession(false);
        
        // Update URL
        router.push(`/poker?sessionId=${newSessionId}`, undefined, { shallow: true });
      } else {
        alert(data.error || 'Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Join existing session
  const handleJoinSession = () => {
    if (!joinSessionId.trim()) {
      alert('Please enter a session ID');
      return;
    }
    
    const trimmedSessionId = joinSessionId.trim().toUpperCase();
    // Don't store in localStorage to avoid auto-redirect
    router.push(`/poker?sessionId=${trimmedSessionId}`);
  };

  // Select a vote card (but don't submit yet)
  const handleSelectVote = (card) => {
    if (!voterName.trim()) {
      alert('Please enter your name first!');
      return;
    }

    if (isRevealed) {
      return;
    }

    setPendingVote(card);
  };

  // Submit the selected vote
  const handleSubmitVote = async () => {
    if (!pendingVote) {
      return;
    }

    if (!voterName.trim()) {
      alert('Please enter your name first!');
      return;
    }

    if (!sessionId) {
      alert('Please join or create a session first');
      return;
    }

    setIsSubmittingVote(true);
    try {
      const response = await fetch(`/api/poker-session/${sessionId}/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voterName: voterName.trim(),
          voteValue: pendingVote
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSelectedVote(pendingVote);
        setPendingVote(null);
        // Trigger immediate vote check for all users
        triggerVoteCheck();
      } else {
        alert(data.error || 'Failed to submit vote');
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert('Failed to submit vote. Please try again.');
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleStoryUpdate = async () => {
    if (!sessionId || !isAdmin) return;
    if (!story.trim()) {
      return;
    }

    setIsUpdatingStory(true);
    const storyToUpdate = story.trim();
    
    try {
      // Call API first and wait for response
      const response = await fetch(`/api/poker-session/${sessionId}/story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: storyToUpdate,
          adminToken: adminToken
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update story state after successful API call
        setStory(storyToUpdate);
        setSavedStory(storyToUpdate); // Update saved story after successful update
        
        // Reset votes after story is updated
        setVotes({});
        setSelectedVote(null);
        setIsRevealed(false);
        setPendingVote(null);
        lastVoteCountRef.current = 0;
        lastVoteUpdateRef.current = 0;
        
        // Skip next story poll to avoid overwriting
        skipNextStoryPollRef.current = true;
        
        // Trigger immediate checks for all users
        triggerStoryCheck();
        triggerVoteCheck();
      } else {
        alert(data.error || 'Failed to update story');
        // Revert to server state
        await fetchStory(true);
      }
    } catch (error) {
      console.error('Error updating story:', error);
      alert('Failed to update story. Please try again.');
      // Revert to server state
      await fetchStory(true);
    } finally {
      setIsUpdatingStory(false);
    }
  };

  const handleReveal = async () => {
    if (!sessionId || !isAdmin) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/poker-session/${sessionId}/reveal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminToken: adminToken
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsRevealed(true);
        // Trigger immediate vote check after reveal
        triggerVoteCheck();
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
    if (!sessionId || !isAdmin) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/poker-session/${sessionId}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminToken: adminToken
        })
      });

      if (response.ok) {
        setVotes({});
        setSelectedVote(null);
        setIsRevealed(false);
        lastVoteCountRef.current = 0;
        lastVoteUpdateRef.current = 0;
        // Trigger immediate vote check after reset
        triggerVoteCheck();
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
    if (!sessionId || !isAdmin) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/poker-session/${sessionId}/new-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: story.trim() || '',
          adminToken: adminToken
        })
      });

      if (response.ok) {
        setVotes({});
        setSelectedVote(null);
        setIsRevealed(false);
        lastVoteCountRef.current = 0;
        lastVoteUpdateRef.current = 0;
        if (!story.trim()) {
          setStory('');
          setSavedStory(''); // Update saved story when cleared
        } else {
          // If story was provided, it will be updated by the fetchStory call
          // But we should update savedStory to match current story
          setSavedStory(story.trim());
        }
        // Trigger immediate checks after new story
        triggerStoryCheck();
        triggerVoteCheck();
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

  const copySessionLink = () => {
    const url = `${window.location.origin}/poker?sessionId=${sessionId}`;
    navigator.clipboard.writeText(url);
    alert('Session link copied to clipboard!');
  };

  const handleTerminateSession = () => {
    if (confirm('Are you sure you want to leave this session? You will need to join again to access it.')) {
      // Clear localStorage
      if (sessionId) {
        localStorage.removeItem(`adminToken_${sessionId}`);
      }
      localStorage.removeItem('currentSessionId');
      
      // Clear state
      setSessionId('');
      setAdminToken('');
      setIsAdmin(false);
      setVotes({});
      setSelectedVote(null);
      setPendingVote(null);
      setStory('');
      setSavedStory('');
      setVoterName('');
      setIsRevealed(false);
      
      // Redirect to /poker without sessionId
      router.push('/poker', undefined, { shallow: true });
    }
  };

  const calculateAverage = () => {
    const numericVotes = Object.values(votes)
      .map(v => {
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

  // Show create/join session UI if no session
  if (!sessionId) {
    return (
      <div className={styles.App}>
        <div className={styles.sprintPokerContainer}>
          <header className={styles.header}>
            <h1>🎯 Sprint Poker</h1>
            <p className={styles.subtitle}>Create or join a session to start voting</p>
          </header>

          <div className={styles.sessionActions}>
            <div className={styles.sessionCard}>
              <h2>Create New Session</h2>
              <p>Start a new voting session as admin</p>
              <button
                className={styles.createSessionBtn}
                onClick={handleCreateSession}
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Session'}
              </button>
            </div>

            <div className={styles.sessionCard}>
              <h2>Join Session</h2>
              <p>Enter a session ID to join</p>
              <input
                type="text"
                className={styles.joinSessionInput}
                value={joinSessionId}
                onChange={(e) => setJoinSessionId(e.target.value.toUpperCase())}
                placeholder="Enter Session ID (e.g., ABC12345)"
                maxLength={8}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinSession();
                  }
                }}
              />
              <button
                className={styles.joinSessionBtn}
                onClick={handleJoinSession}
                disabled={isLoading || !joinSessionId.trim()}
              >
                Join Session
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show poker interface
  return (
    <div className={styles.App}>
      <div className={styles.sprintPokerContainer}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1>🎯 Sprint Poker</h1>
              <p className={styles.subtitle}>Session: {sessionId}</p>
              {isAdmin && (
                <div className={styles.adminBadge}>
                  <span>👑 Admin</span>
                </div>
              )}
            </div>
            <button
              className={styles.terminateSessionBtn}
              onClick={handleTerminateSession}
              title="Leave this session"
            >
              Leave Session
            </button>
          </div>
        </header>

        {isAdmin && (
          <div className={styles.sessionInfo}>
            <p>Share this link with participants:</p>
            <div className={styles.sessionLink}>
              <code>{window.location.href}</code>
              <button onClick={copySessionLink} className={styles.copyBtn}>
                Copy Link
              </button>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className={styles.storySection}>
            <label htmlFor="story-input">Current Story:</label>
            <div className={styles.storyInputContainer}>
              <input
                id="story-input"
                type="text"
                className={styles.storyInput}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                onFocus={() => {
                  isStoryInputFocusedRef.current = true;
                }}
                onBlur={() => {
                  isStoryInputFocusedRef.current = false;
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleStoryUpdate();
                  }
                }}
                placeholder="Enter story description..."
                disabled={isUpdatingStory}
              />
              <button
                className={styles.updateStoryBtn}
                onClick={handleStoryUpdate}
                disabled={isUpdatingStory || !story.trim() || story.trim() === savedStory.trim()}
              >
                {isUpdatingStory ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        )}

        {!isAdmin && story && (
          <div className={styles.storyDisplay}>
            <h3>Current Story:</h3>
            <p>{story}</p>
          </div>
        )}

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
              className={`${styles.voteCard} ${pendingVote === card ? styles.pending : ''} ${selectedVote === card ? styles.selected : ''} ${isRevealed ? styles.revealed : ''}`}
              onClick={() => !isRevealed && handleSelectVote(card)}
              disabled={isRevealed || !voterName.trim() || isSubmittingVote}
            >
              {card}
            </button>
          ))}
        </div>

        {pendingVote !== null && !isRevealed && !selectedVote && voterName.trim() && (
          <div className={styles.submitVoteSection}>
            <p className={styles.selectedVoteText}>Selected: <strong>{pendingVote}</strong></p>
            <button
              className={styles.submitVoteBtn}
              onClick={handleSubmitVote}
              disabled={isSubmittingVote}
            >
              {isSubmittingVote ? 'Submitting...' : 'Submit Vote'}
            </button>
            <button
              className={styles.cancelVoteBtn}
              onClick={() => setPendingVote(null)}
              disabled={isSubmittingVote}
            >
              Cancel
            </button>
          </div>
        )}

        {isAdmin && (
          <div className={styles.actions}>
            <button 
              className={`${styles.actionBtn} ${styles.revealBtn}`}
              onClick={handleReveal}
              disabled={Object.keys(votes).length === 0 || isRevealed || isLoading || isUpdatingStory}
            >
              {isRevealed ? 'Results Revealed' : 'Reveal Votes'}
            </button>
            <button 
              className={`${styles.actionBtn} ${styles.resetBtn}`}
              onClick={handleReset}
              disabled={isLoading || isUpdatingStory}
            >
              Reset Votes
            </button>
            <button 
              className={`${styles.actionBtn} ${styles.newStoryBtn}`}
              onClick={handleNewStory}
              disabled={isLoading || isUpdatingStory}
            >
              New Story
            </button>
          </div>
        )}

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
