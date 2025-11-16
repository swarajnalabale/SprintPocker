import { getActiveRetroMeeting, createRetroMeeting } from '../../../lib/db';

const DEFAULT_COLUMNS = [
  'What went Well',
  "What didn't went well",
  'What can be improved?'
];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const meeting = await getActiveRetroMeeting();
      
      if (!meeting) {
        // Create a new meeting with default columns if none exists
        const newMeeting = await createRetroMeeting(DEFAULT_COLUMNS);
        return res.status(200).json(newMeeting);
      }
      
      return res.status(200).json(meeting);
    } catch (error) {
      console.error('Error getting retro meeting:', error);
      return res.status(500).json({ error: 'Failed to get retro meeting' });
    }
  }
  
  if (req.method === 'POST') {
    try {
      const { columns } = req.body;
      const columnsToCreate = columns && columns.length > 0 
        ? columns 
        : DEFAULT_COLUMNS;
      
      const meeting = await createRetroMeeting(columnsToCreate);
      
      return res.status(200).json(meeting);
    } catch (error) {
      console.error('Error creating retro meeting:', error);
      return res.status(500).json({ error: 'Failed to create retro meeting' });
    }
  }
  
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

