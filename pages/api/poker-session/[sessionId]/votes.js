import { getActiveStoryBySessionId, getVotes, submitVote, getSession } from '../../../../lib/db';

export default async function handler(req, res) {
  const { sessionId } = req.query;

  if (req.method === 'GET') {
    try {
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const story = await getActiveStoryBySessionId(sessionId);
      
      if (!story) {
        return res.status(200).json({ votes: {}, isRevealed: false });
      }
      
      const votes = await getVotes(story.id);
      const session = await getSession(story.id);
      
      // Convert array to object format
      const votesObj = {};
      votes.forEach(v => {
        votesObj[v.voterName] = v.voteValue;
      });
      
      // Get the latest vote timestamp for change detection
      const latestVoteTime = votes.length > 0 
        ? Math.max(...votes.map(v => new Date(v.createdAt).getTime()))
        : 0;
      const sessionUpdateTime = new Date(session.updatedAt).getTime();
      
      return res.status(200).json({
        votes: votesObj,
        isRevealed: session.isRevealed,
        lastUpdated: Math.max(latestVoteTime, sessionUpdateTime),
        voteCount: votes.length
      });
    } catch (error) {
      console.error('Error getting votes:', error);
      return res.status(500).json({ error: 'Failed to get votes' });
    }
  }
  
  if (req.method === 'POST') {
    try {
      const { voterName, voteValue } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }
      
      if (!voterName || !voterName.trim()) {
        return res.status(400).json({ error: 'Voter name is required' });
      }
      
      if (voteValue === undefined || voteValue === null) {
        return res.status(400).json({ error: 'Vote value is required' });
      }
      
      const story = await getActiveStoryBySessionId(sessionId);
      
      if (!story) {
        return res.status(400).json({ error: 'No active story. Please wait for admin to create a story.' });
      }
      
      const session = await getSession(story.id);
      
      if (session.isRevealed) {
        return res.status(400).json({ error: 'Votes have already been revealed. Cannot vote now.' });
      }
      
      await submitVote(story.id, voterName.trim(), String(voteValue));
      
      return res.status(200).json({
        message: 'Vote submitted successfully',
        voterName: voterName.trim(),
        voteValue: String(voteValue)
      });
    } catch (error) {
      console.error('Error submitting vote:', error);
      return res.status(500).json({ error: 'Failed to submit vote' });
    }
  }
  
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

