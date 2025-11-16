import { createPokerSession } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const session = await createPokerSession();
    
    return res.status(200).json({
      sessionId: session.sessionId,
      adminToken: session.adminToken,
      message: 'Session created successfully'
    });
  } catch (error) {
    console.error('Error creating poker session:', error);
    return res.status(500).json({ error: 'Failed to create poker session' });
  }
}

