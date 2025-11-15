import { getActiveStory, resetVotes } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
  
  try {
    const story = await getActiveStory();
    
    if (!story) {
      return res.status(400).json({ error: 'No active story found' });
    }
    
    await resetVotes(story.id);
    
    return res.status(200).json({
      message: 'Votes reset successfully'
    });
  } catch (error) {
    console.error('Error resetting votes:', error);
    return res.status(500).json({ error: 'Failed to reset votes' });
  }
}

