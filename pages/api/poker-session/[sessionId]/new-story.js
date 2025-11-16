import { createStoryForSession, resetVotes, getActiveStoryBySessionId, verifyAdminToken } from '../../../../lib/db';

export default async function handler(req, res) {
  const { sessionId } = req.query;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
  
  try {
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const { description, adminToken } = req.body;

    if (!adminToken) {
      return res.status(403).json({ error: 'Admin token is required' });
    }

    const isValid = await verifyAdminToken(sessionId, adminToken);
    if (!isValid) {
      return res.status(403).json({ error: 'Invalid admin token' });
    }
    
    // If description is provided, create new story
    // Otherwise, just reset the current story's votes
    if (description && description.trim()) {
      const story = await createStoryForSession(sessionId, description.trim());
      await resetVotes(story.id);
      
      return res.status(200).json({
        message: 'New story created and votes reset',
        storyId: story.id,
        description: story.description
      });
    } else {
      // Just reset votes for current story
      const story = await getActiveStoryBySessionId(sessionId);
      
      if (story) {
        await resetVotes(story.id);
      }
      
      return res.status(200).json({
        message: 'Votes reset for new story'
      });
    }
  } catch (error) {
    console.error('Error creating new story:', error);
    return res.status(500).json({ error: 'Failed to create new story' });
  }
}

