import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Retro.module.css';

export default function Retro() {
  const router = useRouter();
  const { sessionId: urlSessionId } = router.query;
  
  const [sessionId, setSessionId] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [meeting, setMeeting] = useState(null);
  const [columns, setColumns] = useState([]);
  const [authorName, setAuthorName] = useState('');
  const [editingColumn, setEditingColumn] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingMeetingTitle, setEditingMeetingTitle] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [joinSessionId, setJoinSessionId] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('🔄 Retro Meeting');
  const pollingIntervalRef = useRef(null);

  // Initialize session from URL only (no auto-redirect)
  useEffect(() => {
    // Clean up old currentSessionId from localStorage to prevent auto-redirect
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentRetroSessionId');
    }

    if (urlSessionId) {
      const storedAdminToken = localStorage.getItem(`retroAdminToken_${urlSessionId}`);
      setSessionId(urlSessionId);
      if (storedAdminToken) {
        setAdminToken(storedAdminToken);
        setIsAdmin(true);
      }
    } else {
      // Clear any existing session state when on /retro without sessionId
      setSessionId('');
      setAdminToken('');
      setIsAdmin(false);
    }
  }, [urlSessionId]);

  // Fetch meeting data
  const fetchMeeting = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`/api/retro-session/${sessionId}/meeting`);
      const data = await response.json();
      if (data) {
        setMeeting(data);
        setColumns(data.columns || []);
        setMeetingTitle(data.title || '🔄 Retro Meeting');
      } else {
        setMeeting(null);
        setColumns([]);
        setMeetingTitle('🔄 Retro Meeting');
      }
    } catch (error) {
      console.error('Error fetching retro meeting:', error);
    }
  };

  // Fetch session info
  const fetchSessionInfo = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`/api/retro-session/${sessionId}?adminToken=${adminToken}`);
      const data = await response.json();
      
      if (response.ok) {
        setIsAdmin(data.isAdmin || false);
        if (data.activeMeeting) {
          setMeeting(data.activeMeeting);
          setColumns(data.activeMeeting.columns || []);
          setMeetingTitle(data.activeMeeting.title || '🔄 Retro Meeting');
        }
      }
    } catch (error) {
      console.error('Error fetching session info:', error);
    }
  };

  // Set up polling when session is available
  useEffect(() => {
    if (!sessionId) return;

    // Initial fetch
    fetchSessionInfo();
    fetchMeeting();

    // Set up polling every 5 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchMeeting();
    }, 5000);

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [sessionId]);

  // Create new session
  const handleCreateSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/retro-session/create', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (response.ok) {
        const newSessionId = data.sessionId;
        const newAdminToken = data.adminToken;
        
        // Store admin token in localStorage
        localStorage.setItem(`retroAdminToken_${newSessionId}`, newAdminToken);
        
        setSessionId(newSessionId);
        setAdminToken(newAdminToken);
        setIsAdmin(true);
        
        // Update URL first
        router.push(`/retro?sessionId=${newSessionId}`, undefined, { shallow: true });
        
        // Don't auto-create meeting - let admin set title first
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

  // Create meeting for session
  const createMeeting = async (sessionId, adminToken, title = '🔄 Retro Meeting') => {
    try {
      const response = await fetch(`/api/retro-session/${sessionId}/meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminToken: adminToken,
          title: title.trim() || '🔄 Retro Meeting',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMeeting(data);
        setColumns(data.columns || []);
        setMeetingTitle(data.title || '🔄 Retro Meeting');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
    }
  };

  // Handle update meeting title
  const handleUpdateMeetingTitle = async (newTitle) => {
    if (!isAdmin || !sessionId) return;
    if (!newTitle.trim()) {
      alert('Meeting title cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/retro-session/${sessionId}/meeting`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          adminToken: adminToken,
        }),
      });

      if (response.ok) {
        setMeetingTitle(newTitle.trim());
        setEditingMeetingTitle(false);
        await fetchMeeting();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update meeting title');
      }
    } catch (error) {
      console.error('Error updating meeting title:', error);
      alert('Failed to update meeting title. Please try again.');
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
    router.push(`/retro?sessionId=${trimmedSessionId}`);
  };

  // Handle terminate session
  const handleTerminateSession = () => {
    if (confirm('Are you sure you want to leave this session? You will need to join again to access it.')) {
      // Clear localStorage
      if (sessionId) {
        localStorage.removeItem(`retroAdminToken_${sessionId}`);
      }
      localStorage.removeItem('currentRetroSessionId');
      
      // Clear state
      setSessionId('');
      setAdminToken('');
      setIsAdmin(false);
      setMeeting(null);
      setColumns([]);
      setAuthorName('');
      
      // Redirect to /retro without sessionId
      router.push('/retro', undefined, { shallow: true });
    }
  };

  // Handle add column (admin only)
  const handleAddColumn = async () => {
    if (!isAdmin) return;
    if (!newColumnTitle.trim()) {
      alert('Please enter a column title');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/retro-session/${sessionId}/columns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newColumnTitle.trim(),
          adminToken: adminToken,
        }),
      });

      if (response.ok) {
        setNewColumnTitle('');
        setShowAddColumn(false);
        await fetchMeeting();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add column');
      }
    } catch (error) {
      console.error('Error adding column:', error);
      alert('Failed to add column. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle update column (admin only)
  const handleUpdateColumn = async (columnId, newTitle) => {
    if (!isAdmin) return;
    if (!newTitle.trim()) {
      alert('Column title cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/retro-session/${sessionId}/columns`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          columnId,
          title: newTitle.trim(),
          adminToken: adminToken,
        }),
      });

      if (response.ok) {
        setEditingColumn(null);
        await fetchMeeting();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update column');
      }
    } catch (error) {
      console.error('Error updating column:', error);
      alert('Failed to update column. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete column (admin only)
  const handleDeleteColumn = async (columnId) => {
    if (!isAdmin) return;
    if (!confirm('Are you sure you want to delete this column? All items in it will be deleted.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/retro-session/${sessionId}/columns`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          columnId,
          adminToken: adminToken,
        }),
      });

      if (response.ok) {
        await fetchMeeting();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete column');
      }
    } catch (error) {
      console.error('Error deleting column:', error);
      alert('Failed to delete column. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle add item
  const handleAddItem = async (columnId, content) => {
    if (!content.trim()) {
      alert('Please enter item content');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/retro-session/${sessionId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          columnId,
          content: content.trim(),
          authorName: authorName.trim() || 'Anonymous',
        }),
      });

      if (response.ok) {
        await fetchMeeting();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle update item
  const handleUpdateItem = async (itemId, newContent) => {
    if (!newContent.trim()) {
      alert('Item content cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/retro-session/${sessionId}/items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          content: newContent.trim(),
        }),
      });

      if (response.ok) {
        setEditingItem(null);
        await fetchMeeting();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update item');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete item
  const handleDeleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/retro-session/${sessionId}/items?itemId=${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMeeting();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copySessionLink = () => {
    const url = `${window.location.origin}/retro?sessionId=${sessionId}`;
    navigator.clipboard.writeText(url);
    alert('Session link copied to clipboard!');
  };

  // Show create/join session UI if no session
  if (!sessionId) {
    return (
      <div className={styles.App}>
        <div className={styles.retroContainer}>
          <header className={styles.header}>
            <h1>🔄 Retro Meeting</h1>
            <p className={styles.subtitle}>Create or join a session to start</p>
          </header>

          <div className={styles.sessionActions}>
            <div className={styles.sessionCard}>
              <h2>Create New Session</h2>
              <p>Start a new retro meeting as admin</p>
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

  // Show retro board interface
  return (
    <div className={styles.App}>
      <div className={styles.retroContainer}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerLeft}>
              {editingMeetingTitle && isAdmin ? (
                <input
                  type="text"
                  className={styles.meetingTitleInput}
                  defaultValue={meetingTitle}
                  onBlur={(e) => {
                    if (e.target.value !== meetingTitle) {
                      handleUpdateMeetingTitle(e.target.value);
                    } else {
                      setEditingMeetingTitle(false);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.target.blur();
                    } else if (e.key === 'Escape') {
                      setEditingMeetingTitle(false);
                    }
                  }}
                  autoFocus
                  disabled={isLoading}
                />
              ) : (
                <h1
                  className={styles.meetingTitle}
                  onClick={() => isAdmin && setEditingMeetingTitle(true)}
                  title={isAdmin ? "Click to edit" : ""}
                  style={{ cursor: isAdmin ? 'pointer' : 'default' }}
                >
                  {meetingTitle}
                </h1>
              )}
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

        {!meeting && isAdmin && (
          <div className={styles.createMeetingSection}>
            <p>Set a title and create your retro meeting to get started!</p>
            <div className={styles.createMeetingForm}>
              <input
                type="text"
                className={styles.meetingTitleInput}
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="Enter meeting title..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    createMeeting(sessionId, adminToken, meetingTitle);
                  }
                }}
                disabled={isLoading}
              />
              <button
                className={styles.createMeetingBtn}
                onClick={() => createMeeting(sessionId, adminToken, meetingTitle)}
                disabled={isLoading || !meetingTitle.trim()}
              >
                Create Meeting
              </button>
            </div>
          </div>
        )}

        {!meeting && !isAdmin && (
          <div className={styles.waitingMessage}>
            <p>Waiting for admin to create a meeting...</p>
          </div>
        )}

        {meeting && (
          <>
            <div className={styles.board}>
              {columns.map((column) => (
                <div key={column.id} className={styles.column}>
                  <div className={styles.columnHeader}>
                    {editingColumn === column.id && isAdmin ? (
                      <input
                        type="text"
                        className={styles.columnTitleInput}
                        defaultValue={column.title}
                        onBlur={(e) => {
                          if (e.target.value !== column.title) {
                            handleUpdateColumn(column.id, e.target.value);
                          } else {
                            setEditingColumn(null);
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.target.blur();
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <>
                        <h2
                          className={styles.columnTitle}
                          onClick={() => isAdmin && setEditingColumn(column.id)}
                          title={isAdmin ? "Click to edit" : ""}
                          style={{ cursor: isAdmin ? 'pointer' : 'default' }}
                        >
                          {column.title}
                        </h2>
                        {isAdmin && (
                          <button
                            className={styles.deleteColumnBtn}
                            onClick={() => handleDeleteColumn(column.id)}
                            disabled={isLoading}
                            title="Delete column"
                          >
                            ×
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <div className={styles.itemsList}>
                    {column.items && column.items.map((item) => (
                      <div key={item.id} className={styles.item}>
                        {editingItem === item.id ? (
                          <textarea
                            className={styles.itemContentInput}
                            defaultValue={item.content}
                            onBlur={(e) => {
                              if (e.target.value !== item.content) {
                                handleUpdateItem(item.id, e.target.value);
                              } else {
                                setEditingItem(null);
                              }
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) {
                                e.target.blur();
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <>
                            <div
                              className={styles.itemContent}
                              onClick={() => setEditingItem(item.id)}
                              title="Click to edit"
                            >
                              {item.content}
                            </div>
                            <div className={styles.itemMeta}>
                              <span className={styles.itemAuthor}>{item.authorName}</span>
                              <button
                                className={styles.deleteItemBtn}
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={isLoading}
                                title="Delete item"
                              >
                                ×
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <ItemInput
                    columnId={column.id}
                    onAdd={handleAddItem}
                    disabled={isLoading}
                  />
                </div>
              ))}

              {isAdmin && (
                showAddColumn ? (
                  <div className={styles.addColumnForm}>
                    <input
                      type="text"
                      className={styles.newColumnInput}
                      value={newColumnTitle}
                      onChange={(e) => setNewColumnTitle(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddColumn();
                        } else if (e.key === 'Escape') {
                          setShowAddColumn(false);
                          setNewColumnTitle('');
                        }
                      }}
                      placeholder="Enter column title..."
                      autoFocus
                      disabled={isLoading}
                    />
                    <div className={styles.addColumnActions}>
                      <button
                        className={styles.addColumnBtn}
                        onClick={handleAddColumn}
                        disabled={isLoading || !newColumnTitle.trim()}
                      >
                        Add
                      </button>
                      <button
                        className={styles.cancelColumnBtn}
                        onClick={() => {
                          setShowAddColumn(false);
                          setNewColumnTitle('');
                        }}
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className={styles.addColumnButton}
                    onClick={() => setShowAddColumn(true)}
                    disabled={isLoading}
                  >
                    + Add Column
                  </button>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ItemInput component for adding new items
function ItemInput({ columnId, onAdd, disabled }) {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (content.trim()) {
      onAdd(columnId, content);
      setContent('');
    }
  };

  return (
    <div className={styles.itemInput}>
      <textarea
        className={styles.itemTextarea}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && e.ctrlKey) {
            handleSubmit();
          }
        }}
        placeholder="Add a new item... (Ctrl+Enter to submit)"
        disabled={disabled}
        rows={3}
      />
      <button
        className={styles.addItemBtn}
        onClick={handleSubmit}
        disabled={disabled || !content.trim()}
      >
        Add Item
      </button>
    </div>
  );
}
