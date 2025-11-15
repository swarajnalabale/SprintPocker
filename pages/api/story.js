import { getActiveStory, createStory } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const story = await getActiveStory();
      
      if (!story) {
        return res.status(200).json({ 
          description: '',
          id: null 
        });
      }
      
      return res.status(200).json({
        id: story.id,
        description: story.description
      });
    } catch (error) {
      console.error('Error getting story:', error);
      return res.status(500).json({ error: 'Failed to get story' });
    }
  }
  
  if (req.method === 'POST') {
    try {
      const { description } = req.body;
      
      if (!description || !description.trim()) {
        return res.status(400).json({ error: 'Story description is required' });
      }
      
      const storyId = await createStory(description.trim());
      
      return res.status(200).json({
        id: storyId,
        description: description.trim(),
        message: 'Story created successfully'
      });
    } catch (error) {
      console.error('Error creating story:', error);
      return res.status(500).json({ error: 'Failed to create story' });
    }
  }
  
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

