import { getActiveStoryBySessionId, resetVotes, verifyAdminToken, getSession } from '../../../../lib/db';

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
    
    await resetVotes(story.id);
    
    // Get the updated session to return the timestamp
    const session = await getSession(story.id);
    
    return res.status(200).json({
      message: 'Votes reset successfully',
      lastUpdated: new Date(session.updatedAt).getTime(),
      isRevealed: session.isRevealed
    });
  } catch (error) {
    console.error('Error resetting votes:', error);
    return res.status(500).json({ error: 'Failed to reset votes' });
  }
}

