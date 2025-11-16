import { addRetroColumn, updateRetroColumn, deleteRetroColumn, getActiveRetroMeetingBySessionId, verifyRetroAdminToken } from '../../../../lib/db';

export default async function handler(req, res) {
  const { sessionId } = req.query;

  if (req.method === 'POST') {
    try {
      const { title, adminToken } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      if (!adminToken) {
        return res.status(403).json({ error: 'Admin token is required' });
      }

      const isValid = await verifyRetroAdminToken(sessionId, adminToken);
      if (!isValid) {
        return res.status(403).json({ error: 'Invalid admin token' });
      }
      
      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Column title is required' });
      }

      const meeting = await getActiveRetroMeetingBySessionId(sessionId);
      if (!meeting) {
        return res.status(404).json({ error: 'No active retro meeting found' });
      }

      const column = await addRetroColumn(meeting.id, title.trim());
      
      return res.status(200).json(column);
    } catch (error) {
      console.error('Error adding retro column:', error);
      return res.status(500).json({ error: 'Failed to add retro column' });
    }
  }
  
  if (req.method === 'PUT') {
    try {
      const { columnId, title, adminToken } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      if (!adminToken) {
        return res.status(403).json({ error: 'Admin token is required' });
      }

      const isValid = await verifyRetroAdminToken(sessionId, adminToken);
      if (!isValid) {
        return res.status(403).json({ error: 'Invalid admin token' });
      }
      
      if (!columnId) {
        return res.status(400).json({ error: 'Column ID is required' });
      }
      
      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Column title is required' });
      }

      const column = await updateRetroColumn(columnId, title.trim());
      
      return res.status(200).json(column);
    } catch (error) {
      console.error('Error updating retro column:', error);
      return res.status(500).json({ error: 'Failed to update retro column' });
    }
  }
  
  if (req.method === 'DELETE') {
    try {
      const { columnId, adminToken } = req.body;
      const queryColumnId = parseInt(req.query.columnId);
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      if (!adminToken) {
        return res.status(403).json({ error: 'Admin token is required' });
      }

      const isValid = await verifyRetroAdminToken(sessionId, adminToken);
      if (!isValid) {
        return res.status(403).json({ error: 'Invalid admin token' });
      }

      const columnIdToDelete = columnId || queryColumnId;
      
      if (!columnIdToDelete || isNaN(columnIdToDelete)) {
        return res.status(400).json({ error: 'Valid column ID is required' });
      }

      await deleteRetroColumn(columnIdToDelete);
      
      return res.status(200).json({ message: 'Column deleted successfully' });
    } catch (error) {
      console.error('Error deleting retro column:', error);
      return res.status(500).json({ error: 'Failed to delete retro column' });
    }
  }
  
  res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

