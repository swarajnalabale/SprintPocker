import { getRetroSessionBySessionId, verifyRetroAdminToken } from '../../../lib/db';

export default async function handler(req, res) {
  const { sessionId, adminToken: queryAdminToken } = req.query;
  const { adminToken: bodyAdminToken } = req.body || {};
  const adminToken = queryAdminToken || bodyAdminToken;

  if (req.method === 'GET') {
    try {
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const session = await getRetroSessionBySessionId(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Check if user is admin
      const isAdmin = adminToken ? await verifyRetroAdminToken(sessionId, adminToken) : false;

      return res.status(200).json({
        sessionId: session.sessionId,
        hasActiveMeeting: session.meetings && session.meetings.length > 0,
        activeMeeting: session.meetings && session.meetings.length > 0 ? session.meetings[0] : null,
        isAdmin,
      });
    } catch (error) {
      console.error('Error getting retro session:', error);
      return res.status(500).json({ error: 'Failed to get retro session' });
    }
  }

  if (req.method === 'POST') {
    // Verify admin token
    try {
      if (!sessionId || !adminToken) {
        return res.status(400).json({ error: 'Session ID and admin token are required' });
      }

      const isValid = await verifyRetroAdminToken(sessionId, adminToken);
      
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

