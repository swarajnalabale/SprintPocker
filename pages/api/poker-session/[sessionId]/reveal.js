import { getActiveStoryBySessionId, getSession, revealVotes, verifyAdminToken } from '../../../../lib/db';

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

    const { adminToken } = req.body;

    if (!adminToken) {
      return res.status(403).json({ error: 'Admin token is required' });
    }

    const isValid = await verifyAdminToken(sessionId, adminToken);
    if (!isValid) {
      return res.status(403).json({ error: 'Invalid admin token' });
    }

    const story = await getActiveStoryBySessionId(sessionId);
    
    if (!story) {
      return res.status(400).json({ error: 'No active story found' });
    }
    
    const session = await getSession(story.id);
    
    if (session.isRevealed) {
      return res.status(200).json({ 
        message: 'Votes are already revealed',
        isRevealed: true 
      });
    }
    
    await revealVotes(story.id);
    
    return res.status(200).json({
      message: 'Votes revealed successfully',
      isRevealed: true
    });
  } catch (error) {
    console.error('Error revealing votes:', error);
    return res.status(500).json({ error: 'Failed to reveal votes' });
  }
}

