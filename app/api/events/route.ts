import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/middleware"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { db } = await connectToDatabase()

    const events = await db
      .collection("events")
      .find({ userId: new ObjectId(user.userId) })
      .sort({ startTime: 1 })
      .toArray()

    const formattedEvents = events.map((event) => ({
      id: event._id.toString(),
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      color: event.color,
      attendees: event.attendees,
    }))

    return NextResponse.json(formattedEvents)
  } catch (error) {
    console.error("Get events error:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const eventData = await req.json()
    const { db } = await connectToDatabase()

    const result = await db.collection("events").insertOne({
      userId: new ObjectId(user.userId),
      title: eventData.title,
      description: eventData.description,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      location: eventData.location,
      color: eventData.color,
      attendees: eventData.attendees,
      createdAt: new Date(),
    })

    return NextResponse.json({ id: result.insertedId })
  } catch (error) {
    console.error("Create event error:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
})
