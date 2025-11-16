import { getActiveStoryBySessionId, createStoryForSession, verifyAdminToken } from '../../../../lib/db';

export default async function handler(req, res) {
  const { sessionId } = req.query;

  if (req.method === 'GET') {
    try {
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const story = await getActiveStoryBySessionId(sessionId);
      
      if (!story) {
        return res.status(200).json({ 
          description: '',
          id: null 
        });
      }
      
      return res.status(200).json({
        id: story.id,
        description: story.description,
        lastUpdated: new Date(story.updatedAt).getTime()
      });
    } catch (error) {
      console.error('Error getting story:', error);
      return res.status(500).json({ error: 'Failed to get story' });
    }
  }
  
  if (req.method === 'POST') {
    try {
      const { description, adminToken } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      // Verify admin token
      if (!adminToken) {
        return res.status(403).json({ error: 'Admin token is required to create stories' });
      }

      const isValid = await verifyAdminToken(sessionId, adminToken);
      if (!isValid) {
        return res.status(403).json({ error: 'Invalid admin token' });
      }
      
      if (!description || !description.trim()) {
        return res.status(400).json({ error: 'Story description is required' });
      }
      
      const story = await createStoryForSession(sessionId, description.trim());
      
      return res.status(200).json({
        id: story.id,
        description: story.description,
        message: 'Story created successfully'
      });
    } catch (error) {
      console.error('Error creating story:', error);
      return res.status(500).json({ error: 'Failed to create story' });
    }
  }
  
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

