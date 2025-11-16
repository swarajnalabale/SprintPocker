import prisma from "./prisma"

// Helper functions using Prisma
export async function getActiveStory() {
  try {
    const story = await prisma.story.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    })
    return story
  } catch (error) {
    console.error("Error getting active story:", error)
    throw error
  }
}

export async function createStory(description: string) {
  try {
    // Deactivate all existing stories
    await prisma.story.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    // Create new story
    const story = await prisma.story.create({
      data: {
        description: description.trim(),
        isActive: true,
      },
    })

    return story.id
  } catch (error) {
    console.error("Error creating story:", error)
    throw error
  }
}

export async function getVotes(storyId: number) {
  try {
    const votes = await prisma.vote.findMany({
      where: { storyId },
      select: {
        voterName: true,
        voteValue: true,
        createdAt: true,
      },
    })
    return votes
  } catch (error) {
    console.error("Error getting votes:", error)
    throw error
  }
}

export async function submitVote(storyId: number, voterName: string, voteValue: string) {
  try {
    const vote = await prisma.vote.upsert({
      where: {
        storyId_voterName: {
          storyId,
          voterName: voterName.trim(),
        },
      },
      update: {
        voteValue: String(voteValue),
      },
      create: {
        storyId,
        voterName: voterName.trim(),
        voteValue: String(voteValue),
      },
    })
    return vote
  } catch (error) {
    console.error("Error submitting vote:", error)
    throw error
  }
}

export async function getSession(storyId: number) {
  try {
    let session = await prisma.session.findUnique({
      where: { storyId },
    })

    if (!session) {
      session = await prisma.session.create({
        data: {
          storyId,
          isRevealed: false,
        },
      })
    }

    return session
  } catch (error) {
    console.error("Error getting session:", error)
    throw error
  }
}

export async function revealVotes(storyId: number) {
  try {
    await prisma.session.upsert({
      where: { storyId },
      update: { isRevealed: true },
      create: {
        storyId,
        isRevealed: true,
      },
    })
  } catch (error) {
    console.error("Error revealing votes:", error)
    throw error
  }
}

export async function resetVotes(storyId: number) {
  try {
    // Delete all votes for the story
    await prisma.vote.deleteMany({
      where: { storyId },
    })

    // Reset session reveal status
    await prisma.session.upsert({
      where: { storyId },
      update: { isRevealed: false },
      create: {
        storyId,
        isRevealed: false,
      },
    })
  } catch (error) {
    console.error("Error resetting votes:", error)
    throw error
  }
}

// Retro Meeting Helper Functions
export async function getActiveRetroMeeting() {
  try {
    const meeting = await prisma.retroMeeting.findFirst({
      where: { isActive: true },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            items: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return meeting
  } catch (error) {
    console.error("Error getting active retro meeting:", error)
    throw error
  }
}

export async function createRetroMeeting(defaultColumns: string[] = []) {
  try {
    // Deactivate all existing meetings
    await prisma.retroMeeting.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    // Create new meeting with default columns
    const meeting = await prisma.retroMeeting.create({
      data: {
        isActive: true,
        columns: {
          create: defaultColumns.map((title, index) => ({
            title,
            order: index,
          })),
        },
      },
      include: {
        columns: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return meeting
  } catch (error) {
    console.error("Error creating retro meeting:", error)
    throw error
  }
}

export async function addRetroColumn(retroMeetingId: number, title: string) {
  try {
    // Get the max order value
    const maxOrder = await prisma.retroColumn.findFirst({
      where: { retroMeetingId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const newOrder = maxOrder ? maxOrder.order + 1 : 0

    const column = await prisma.retroColumn.create({
      data: {
        retroMeetingId,
        title: title.trim(),
        order: newOrder,
      },
    })

    return column
  } catch (error) {
    console.error("Error adding retro column:", error)
    throw error
  }
}

export async function updateRetroColumn(columnId: number, title: string) {
  try {
    const column = await prisma.retroColumn.update({
      where: { id: columnId },
      data: { title: title.trim() },
    })
    return column
  } catch (error) {
    console.error("Error updating retro column:", error)
    throw error
  }
}

export async function deleteRetroColumn(columnId: number) {
  try {
    await prisma.retroColumn.delete({
      where: { id: columnId },
    })
  } catch (error) {
    console.error("Error deleting retro column:", error)
    throw error
  }
}

export async function addRetroItem(
  retroMeetingId: number,
  columnId: number,
  content: string,
  authorName: string
) {
  try {
    const item = await prisma.retroItem.create({
      data: {
        retroMeetingId,
        columnId,
        content: content.trim(),
        authorName: authorName.trim(),
      },
    })
    return item
  } catch (error) {
    console.error("Error adding retro item:", error)
    throw error
  }
}

export async function updateRetroItem(itemId: number, content: string) {
  try {
    const item = await prisma.retroItem.update({
      where: { id: itemId },
      data: { content: content.trim() },
    })
    return item
  } catch (error) {
    console.error("Error updating retro item:", error)
    throw error
  }
}

export async function deleteRetroItem(itemId: number) {
  try {
    await prisma.retroItem.delete({
      where: { id: itemId },
    })
  } catch (error) {
    console.error("Error deleting retro item:", error)
    throw error
  }
}

// Retro Session Helper Functions
export async function createRetroSession() {
  try {
    // Generate unique sessionId (8 character alphanumeric)
    const generateSessionId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }

    // Generate admin token (32 character random string)
    const generateAdminToken = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }

    let sessionId = generateSessionId();
    let existingSession = await prisma.retroSession.findUnique({
      where: { sessionId },
    });

    // Ensure unique sessionId
    while (existingSession) {
      sessionId = generateSessionId();
      existingSession = await prisma.retroSession.findUnique({
        where: { sessionId },
      });
    }

    const adminToken = generateAdminToken();

    const session = await prisma.retroSession.create({
      data: {
        sessionId,
        adminToken,
      },
    })

    return session
  } catch (error) {
    console.error("Error creating retro session:", error)
    throw error
  }
}

export async function getRetroSessionBySessionId(sessionId: string) {
  try {
    const session = await prisma.retroSession.findUnique({
      where: { sessionId },
      include: {
        meetings: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            columns: {
              orderBy: { order: 'asc' },
              include: {
                items: {
                  orderBy: { createdAt: 'asc' },
                },
              },
            },
          },
        },
      },
    })
    return session
  } catch (error) {
    console.error("Error getting retro session:", error)
    throw error
  }
}

export async function verifyRetroAdminToken(sessionId: string, token: string) {
  try {
    const session = await prisma.retroSession.findUnique({
      where: { sessionId },
      select: { adminToken: true },
    })

    if (!session) {
      return false
    }

    return session.adminToken === token
  } catch (error) {
    console.error("Error verifying retro admin token:", error)
    return false
  }
}

export async function getActiveRetroMeetingBySessionId(sessionId: string) {
  try {
    const session = await prisma.retroSession.findUnique({
      where: { sessionId },
      include: {
        meetings: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            columns: {
              orderBy: { order: 'asc' },
              include: {
                items: {
                  orderBy: { createdAt: 'asc' },
                },
              },
            },
          },
        },
      },
    })

    if (!session || !session.meetings || session.meetings.length === 0) {
      return null
    }

    return session.meetings[0]
  } catch (error) {
    console.error("Error getting active retro meeting by session:", error)
    throw error
  }
}

export async function createRetroMeetingForSession(sessionId: string, defaultColumns: string[] = [], meetingTitle: string = "🔄 Retro Meeting") {
  try {
    const session = await prisma.retroSession.findUnique({
      where: { sessionId },
    })

    if (!session) {
      throw new Error("Session not found")
    }

    // Deactivate all existing meetings in this session
    await prisma.retroMeeting.updateMany({
      where: { 
        retroSessionId: session.id,
        isActive: true 
      },
      data: { isActive: false },
    })

    // Create new meeting with default columns
    const meeting = await prisma.retroMeeting.create({
      data: {
        retroSessionId: session.id,
        title: meetingTitle.trim() || "🔄 Retro Meeting",
        isActive: true,
        columns: {
          create: defaultColumns.map((title, index) => ({
            title,
            order: index,
          })),
        },
      },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            items: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    })

    return meeting
  } catch (error) {
    console.error("Error creating retro meeting for session:", error)
    throw error
  }
}

export async function updateRetroMeetingTitle(meetingId: number, title: string) {
  try {
    const meeting = await prisma.retroMeeting.update({
      where: { id: meetingId },
      data: { title: title.trim() },
    })
    return meeting
  } catch (error) {
    console.error("Error updating retro meeting title:", error)
    throw error
  }
}

// Poker Session Helper Functions
export async function createPokerSession() {
  try {
    // Generate unique sessionId (8 character alphanumeric)
    const generateSessionId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }

    // Generate admin token (32 character random string)
    const generateAdminToken = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }

    let sessionId = generateSessionId();
    let existingSession = await prisma.pokerSession.findUnique({
      where: { sessionId },
    });

    // Ensure unique sessionId
    while (existingSession) {
      sessionId = generateSessionId();
      existingSession = await prisma.pokerSession.findUnique({
        where: { sessionId },
      });
    }

    const adminToken = generateAdminToken();

    const session = await prisma.pokerSession.create({
      data: {
        sessionId,
        adminToken,
      },
    })

    return session
  } catch (error) {
    console.error("Error creating poker session:", error)
    throw error
  }
}

export async function getPokerSessionBySessionId(sessionId: string) {
  try {
    const session = await prisma.pokerSession.findUnique({
      where: { sessionId },
      include: {
        stories: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })
    return session
  } catch (error) {
    console.error("Error getting poker session:", error)
    throw error
  }
}

export async function verifyAdminToken(sessionId: string, token: string) {
  try {
    const session = await prisma.pokerSession.findUnique({
      where: { sessionId },
      select: { adminToken: true },
    })

    if (!session) {
      return false
    }

    return session.adminToken === token
  } catch (error) {
    console.error("Error verifying admin token:", error)
    return false
  }
}

export async function getActiveStoryBySessionId(sessionId: string) {
  try {
    const session = await prisma.pokerSession.findUnique({
      where: { sessionId },
      include: {
        stories: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!session || !session.stories || session.stories.length === 0) {
      return null
    }

    return session.stories[0]
  } catch (error) {
    console.error("Error getting active story by session:", error)
    throw error
  }
}

export async function createStoryForSession(sessionId: string, description: string) {
  try {
    const session = await prisma.pokerSession.findUnique({
      where: { sessionId },
    })

    if (!session) {
      throw new Error("Session not found")
    }

    // Deactivate all existing stories in this session
    await prisma.story.updateMany({
      where: { 
        pokerSessionId: session.id,
        isActive: true 
      },
      data: { isActive: false },
    })

    // Create new story
    const story = await prisma.story.create({
      data: {
        pokerSessionId: session.id,
        description: description.trim(),
        isActive: true,
      },
    })

    return story
  } catch (error) {
    console.error("Error creating story for session:", error)
    throw error
  }
}

