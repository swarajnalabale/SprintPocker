import { useState, useEffect, useRef } from 'react';
import styles from '../styles/Retro.module.css';

export default function Retro() {
  const [meeting, setMeeting] = useState(null);
  const [columns, setColumns] = useState([]);
  const [authorName, setAuthorName] = useState('');
  const [editingColumn, setEditingColumn] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pollingIntervalRef = useRef(null);

  // Fetch meeting data
  const fetchMeeting = async () => {
    try {
      const response = await fetch('/api/retro/meeting');
      const data = await response.json();
      setMeeting(data);
      setColumns(data.columns || []);
    } catch (error) {
      console.error('Error fetching retro meeting:', error);
    }
  };

  // Set up polling
  useEffect(() => {
    // Initial fetch
    fetchMeeting();

    // Set up polling every 2 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchMeeting();
    }, 2000);

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Handle add column
  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) {
      alert('Please enter a column title');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/retro/columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newColumnTitle.trim(),
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

  // Handle update column
  const handleUpdateColumn = async (columnId, newTitle) => {
    if (!newTitle.trim()) {
      alert('Column title cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/retro/columns', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          columnId,
          title: newTitle.trim(),
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

  // Handle delete column
  const handleDeleteColumn = async (columnId) => {
    if (!confirm('Are you sure you want to delete this column? All items in it will be deleted.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/retro/columns?columnId=${columnId}`, {
        method: 'DELETE',
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
    if (!authorName.trim()) {
      alert('Please enter your name first!');
      return;
    }

    if (!content.trim()) {
      alert('Please enter item content');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/retro/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          columnId,
          content: content.trim(),
          authorName: authorName.trim(),
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
      const response = await fetch('/api/retro/items', {
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
      const response = await fetch(`/api/retro/items?itemId=${itemId}`, {
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

  return (
    <div className={styles.App}>
      <div className={styles.retroContainer}>
        <header className={styles.header}>
          <h1>🔄 Retro Meeting</h1>
          <p className={styles.subtitle}>Share your thoughts and feedback</p>
        </header>

        <div className={styles.authorSection}>
          <input
            type="text"
            className={styles.authorNameInput}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Enter your name..."
            disabled={isLoading}
          />
        </div>

        <div className={styles.board}>
          {columns.map((column) => (
            <div key={column.id} className={styles.column}>
              <div className={styles.columnHeader}>
                {editingColumn === column.id ? (
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
                      onClick={() => setEditingColumn(column.id)}
                      title="Click to edit"
                    >
                      {column.title}
                    </h2>
                    <button
                      className={styles.deleteColumnBtn}
                      onClick={() => handleDeleteColumn(column.id)}
                      disabled={isLoading}
                      title="Delete column"
                    >
                      ×
                    </button>
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
                disabled={isLoading || !authorName.trim()}
              />
            </div>
          ))}

          {showAddColumn ? (
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
          )}
        </div>
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

