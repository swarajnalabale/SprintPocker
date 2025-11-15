import { getActiveStory, getSession, revealVotes } from '../../lib/db';

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

