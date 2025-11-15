import "dotenv/config"
import prisma from "../lib/prisma"

async function testDatabase() {
  console.log("🔍 Testing Prisma Postgres connection...\n")

  try {
    // Test 1: Check connection
    await prisma.$connect()
    console.log("✅ Connected to database!")

    // Test 2: Check if tables exist by querying
    console.log("\n📋 Checking database tables...")
    
    const storiesCount = await prisma.story.count()
    console.log(`✅ Stories table: ${storiesCount} record(s)`)

    const votesCount = await prisma.vote.count()
    console.log(`✅ Votes table: ${votesCount} record(s)`)

    const sessionsCount = await prisma.session.count()
    console.log(`✅ Sessions table: ${sessionsCount} record(s)`)

    // Test 3: Create a test story
    console.log("\n📝 Creating a test story...")
    const testStory = await prisma.story.create({
      data: {
        description: "Test Story - Database Connection Test",
        isActive: false, // Set to false so it doesn't interfere with app
      },
    })
    console.log("✅ Created test story:", testStory)

    // Test 4: Create a test vote
    console.log("\n📝 Creating a test vote...")
    const testVote = await prisma.vote.create({
      data: {
        storyId: testStory.id,
        voterName: "Test Voter",
        voteValue: "5",
      },
    })
    console.log("✅ Created test vote:", testVote)

    // Test 5: Create a test session
    console.log("\n📝 Creating a test session...")
    const testSession = await prisma.session.create({
      data: {
        storyId: testStory.id,
        isRevealed: false,
      },
    })
    console.log("✅ Created test session:", testSession)

    // Clean up test data
    console.log("\n🧹 Cleaning up test data...")
    await prisma.vote.delete({ where: { id: testVote.id } })
    await prisma.session.delete({ where: { id: testSession.id } })
    await prisma.story.delete({ where: { id: testStory.id } })
    console.log("✅ Test data cleaned up")

    console.log("\n🎉 All tests passed! Your database is working perfectly.\n")
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()

