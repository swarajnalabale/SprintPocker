import { getPokerSessionBySessionId, verifyAdminToken } from '../../../lib/db';

export default async function handler(req, res) {
  const { sessionId, adminToken: queryAdminToken } = req.query;
  const { adminToken: bodyAdminToken } = req.body || {};
  const adminToken = queryAdminToken || bodyAdminToken;

  if (req.method === 'GET') {
    try {
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const session = await getPokerSessionBySessionId(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Check if user is admin
      const isAdmin = adminToken ? await verifyAdminToken(sessionId, adminToken) : false;

      return res.status(200).json({
        sessionId: session.sessionId,
        hasActiveStory: session.stories && session.stories.length > 0,
        activeStory: session.stories && session.stories.length > 0 ? {
          id: session.stories[0].id,
          description: session.stories[0].description,
        } : null,
        isAdmin,
      });
    } catch (error) {
      console.error('Error getting poker session:', error);
      return res.status(500).json({ error: 'Failed to get poker session' });
    }
  }

  if (req.method === 'POST') {
    // Verify admin token
    try {
      if (!sessionId || !adminToken) {
        return res.status(400).json({ error: 'Session ID and admin token are required' });
      }

      const isValid = await verifyAdminToken(sessionId, adminToken);
      
      return res.status(200).json({
        isValid,
      });
    } catch (error) {
      console.error('Error verifying admin token:', error);
      return res.status(500).json({ error: 'Failed to verify admin token' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

