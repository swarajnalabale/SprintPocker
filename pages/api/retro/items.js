import { addRetroItem, updateRetroItem, deleteRetroItem, getActiveRetroMeeting } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { columnId, content, authorName } = req.body;
      
      if (!columnId) {
        return res.status(400).json({ error: 'Column ID is required' });
      }
      
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Item content is required' });
      }
      
      if (!authorName || !authorName.trim()) {
        return res.status(400).json({ error: 'Author name is required' });
      }

      const meeting = await getActiveRetroMeeting();
      if (!meeting) {
        return res.status(404).json({ error: 'No active retro meeting found' });
      }

      const item = await addRetroItem(meeting.id, columnId, content.trim(), authorName.trim());
      
      return res.status(200).json(item);
    } catch (error) {
      console.error('Error adding retro item:', error);
      return res.status(500).json({ error: 'Failed to add retro item' });
    }
  }
  
  if (req.method === 'PUT') {
    try {
      const { itemId, content } = req.body;
      
      if (!itemId) {
        return res.status(400).json({ error: 'Item ID is required' });
      }
      
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Item content is required' });
      }

      const item = await updateRetroItem(itemId, content.trim());
      
      return res.status(200).json(item);
    } catch (error) {
      console.error('Error updating retro item:', error);
      return res.status(500).json({ error: 'Failed to update retro item' });
    }
  }
  
  if (req.method === 'DELETE') {
    try {
      const itemId = parseInt(req.query.itemId || req.body?.itemId);
      
      if (!itemId || isNaN(itemId)) {
        return res.status(400).json({ error: 'Valid item ID is required' });
      }

      await deleteRetroItem(itemId);
      
      return res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Error deleting retro item:', error);
      return res.status(500).json({ error: 'Failed to delete retro item' });
    }
  }
  
  res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

