import { PrismaClient } from "@prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  })
  
  // Only extend with Accelerate if we have the connection string
  if (process.env.PRISMA_ACCELERATE_URL) {
    return client.$extends(withAccelerate())
  }
  
  return client
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export default prisma

