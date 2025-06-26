import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/middleware"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export const PUT = withAuth(async (req: NextRequest, user, context) => {
  try {
    const { params } = context
    const eventData = await req.json()
    const { db } = await connectToDatabase()

    // Ensure we have a valid ObjectId
    let eventObjectId
    try {
      eventObjectId = new ObjectId(params.id)
    } catch (error) {
      console.error("Invalid ObjectId:", params.id)
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    const result = await db.collection("events").updateOne(
      {
        _id: eventObjectId,
        userId: new ObjectId(user.userId),
      },
      {
        $set: {
          ...eventData,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update event error:", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
})

export const DELETE = withAuth(async (req: NextRequest, user, context) => {
  try {
    const { params } = context
    const { db } = await connectToDatabase()

    // Ensure we have a valid ObjectId
    let eventObjectId
    try {
      eventObjectId = new ObjectId(params.id)
    } catch (error) {
      console.error("Invalid ObjectId:", params.id)
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    const result = await db.collection("events").deleteOne({
      _id: eventObjectId,
      userId: new ObjectId(user.userId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete event error:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
})
