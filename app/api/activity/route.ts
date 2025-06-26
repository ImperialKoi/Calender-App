import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/middleware"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const { activityType, activityDetails } = await req.json()
    const { db } = await connectToDatabase()

    await db.collection("user_activity_log").insertOne({
      userId: new ObjectId(user.userId),
      activityType,
      activityDetails,
      timestamp: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Log activity error:", error)
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 })
  }
})
