import { addRetroColumn, updateRetroColumn, deleteRetroColumn, getActiveRetroMeeting } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { title } = req.body;
      
      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Column title is required' });
      }

      const meeting = await getActiveRetroMeeting();
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
      const { columnId, title } = req.body;
      
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
      const columnId = parseInt(req.query.columnId || req.body?.columnId);
      
      if (!columnId || isNaN(columnId)) {
        return res.status(400).json({ error: 'Valid column ID is required' });
      }

      await deleteRetroColumn(columnId);
      
      return res.status(200).json({ message: 'Column deleted successfully' });
    } catch (error) {
      console.error('Error deleting retro column:', error);
      return res.status(500).json({ error: 'Failed to delete retro column' });
    }
  }
  
  res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

