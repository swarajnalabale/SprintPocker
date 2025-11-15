import { createStory, resetVotes, getActiveStory } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
  
  try {
    const { description } = req.body;
    
    // If description is provided, create new story
    // Otherwise, just reset the current story's votes
    if (description && description.trim()) {
      const storyId = await createStory(description.trim());
      await resetVotes(storyId);
      
      return res.status(200).json({
        message: 'New story created and votes reset',
        storyId: storyId,
        description: description.trim()
      });
    } else {
      // Just reset votes for current story
      const story = await getActiveStory();
      
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

