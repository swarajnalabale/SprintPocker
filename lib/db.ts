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

