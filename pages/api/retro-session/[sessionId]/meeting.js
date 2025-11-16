import { getActiveRetroMeetingBySessionId, createRetroMeetingForSession, updateRetroMeetingTitle, verifyRetroAdminToken } from '../../../../lib/db';

const DEFAULT_COLUMNS = [
  'What went Well',
  "What didn't went well",
  'What can be improved?'
];

export default async function handler(req, res) {
  const { sessionId } = req.query;

  if (req.method === 'GET') {
    try {
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const meeting = await getActiveRetroMeetingBySessionId(sessionId);
      
      if (!meeting) {
        return res.status(200).json(null);
      }
      
      return res.status(200).json(meeting);
    } catch (error) {
      console.error('Error getting retro meeting:', error);
      return res.status(500).json({ error: 'Failed to get retro meeting' });
    }
  }
  
  if (req.method === 'POST') {
    try {
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const { columns, adminToken, title } = req.body;

      if (!adminToken) {
        return res.status(403).json({ error: 'Admin token is required' });
      }

      const isValid = await verifyRetroAdminToken(sessionId, adminToken);
      if (!isValid) {
        return res.status(403).json({ error: 'Invalid admin token' });
      }

      const columnsToCreate = columns && columns.length > 0 
        ? columns 
        : DEFAULT_COLUMNS;
      
      const meetingTitle = title && title.trim() 
        ? title.trim() 
        : "🔄 Retro Meeting";
      
      const meeting = await createRetroMeetingForSession(sessionId, columnsToCreate, meetingTitle);
      
      return res.status(200).json(meeting);
    } catch (error) {
      console.error('Error creating retro meeting:', error);
      return res.status(500).json({ error: 'Failed to create retro meeting' });
    }
  }

  if (req.method === 'PUT') {
    try {
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const { title, adminToken } = req.body;

      if (!adminToken) {
        return res.status(403).json({ error: 'Admin token is required' });
      }

      const isValid = await verifyRetroAdminToken(sessionId, adminToken);
      if (!isValid) {
        return res.status(403).json({ error: 'Invalid admin token' });
      }

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Meeting title is required' });
      }

      const meeting = await getActiveRetroMeetingBySessionId(sessionId);
      if (!meeting) {
        return res.status(404).json({ error: 'No active meeting found' });
      }

      const updatedMeeting = await updateRetroMeetingTitle(meeting.id, title.trim());
      
      return res.status(200).json(updatedMeeting);
    } catch (error) {
      console.error('Error updating retro meeting title:', error);
      return res.status(500).json({ error: 'Failed to update meeting title' });
    }
  }
  
  res.setHeader('Allow', ['GET', 'POST', 'PUT']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

