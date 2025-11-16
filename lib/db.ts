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

