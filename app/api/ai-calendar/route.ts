import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText, tool } from "ai"
import { z } from "zod"

// Create Google provider instance with API key
const google = createGoogleGenerativeAI({
  apiKey: "AIzaSyBcRHVum6MvZr1Mxkc5P0lQt_BTgAhuoB8", // Use environment variable instead of hardcoded key
})

export async function POST(req: Request) {
  try {
    const { messages, currentDate, events } = await req.json()

    // Validate and filter messages
    const validMessages = messages
      .filter((msg: any) => msg && msg.content && msg.content.trim().length > 0)
      .map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content.trim(),
      }))

    if (validMessages.length === 0) {
      return Response.json({
        message: "Please provide a valid message.",
        eventsAdded: false,
      })
    }

    console.log("Valid messages:", validMessages)
    console.log("Current events:", events)

    // Create a summary of existing events for the AI
    const eventsSummary =
      events && events.length > 0
        ? events
            .map(
              (event: any) =>
                `"${event.title}" on ${new Date(event.date).toLocaleDateString()} at ${event.startTime}-${event.endTime} (ID: ${event.id})`,
            )
            .join(", ")
        : "No existing events"

    const result = await generateText({
      model: google("gemini-1.5-flash"),
      messages: validMessages,
      system: `You are a helpful calendar assistant. You can help users add, edit, and delete events in their calendar.

Current date and time: ${currentDate}
Existing events: ${eventsSummary}

You have access to the following tools:
1. addCalendarEvents - Create new events
2. updateCalendarEvents - Edit existing events  
3. deleteCalendarEvents - Delete events

When a user mentions meetings or events, extract ALL of them and create multiple events if needed. For each event, extract:
- Title/subject of the meeting
- Date and time (convert relative dates like "tomorrow", "next Monday" to actual dates)
- Duration or end time (if not specified, assume 1 hour)
- Location (if mentioned)
- Attendees (if mentioned)

For the day field, use 1-7 where:
1 = Sunday, 2 = Monday, 3 = Tuesday, 4 = Wednesday, 5 = Thursday, 6 = Friday, 7 = Saturday

For editing/moving events:
- Users can reference events by title, time, or description
- When editing, preserve existing data unless specifically changed
- Allow partial updates (e.g., just changing time or title)
- For moving events to different days, ALWAYS provide the day field (1-7)
- For moving events to different times on same day, provide startTime and endTime
- When user says "move to Friday" or "reschedule to Monday", use the day field

Examples of day conversions:
- "Move to Monday" → day: 2
- "Reschedule to Friday" → day: 6  
- "Change to next Tuesday" → day: 3
- "Move to tomorrow" → calculate the day number for tomorrow

For deleting events:
- Users can reference events by title, time, or description
- Confirm which events match the deletion criteria

IMPORTANT: 
- If the user doesn't specify a time period (e.g. Schedule a meeting at 7:00 PM on sunday) default it to 1 hour.
- When moving events between days, ALWAYS include the day field in the update
- When moving events to different times on the same day, include startTime and endTime

Always be helpful and confirm what you've added, updated, or deleted in the calendar.`,
      tools: {
        addCalendarEvents: tool({
          description: "Add one or more events to the user's calendar",
          parameters: z.object({
            events: z
              .array(
                z.object({
                  title: z.string().describe("The title or subject of the meeting"),
                  startTime: z.string().describe("Start time in HH:MM format (24-hour)"),
                  endTime: z.string().describe("End time in HH:MM format (24-hour)"),
                  day: z.number().min(1).max(7).describe("Day of the week (1=Sunday, 7=Saturday)"),
                  description: z.string().optional().describe("Additional details about the meeting"),
                  location: z.string().optional().describe("Meeting location"),
                  attendees: z.array(z.string()).optional().describe("List of attendees"),
                  color: z.string().optional().describe("Color class for the event (e.g., bg-blue-500)"),
                }),
              )
              .describe("Array of events to create"),
          }),
          execute: async (params) => {
            console.log("Add events tool executed with params:", params)
            return params
          },
        }),
        updateCalendarEvents: tool({
          description: "Update existing events in the user's calendar",
          parameters: z.object({
            events: z
              .array(
                z.object({
                  id: z.string().describe("The ID of the event to update"),
                  title: z.string().optional().describe("New title for the event"),
                  startTime: z.string().optional().describe("New start time in HH:MM format (24-hour)"),
                  endTime: z.string().optional().describe("New end time in HH:MM format (24-hour)"),
                  day: z.number().min(1).max(7).optional().describe("New day of the week (1=Sunday, 7=Saturday)"),
                  description: z.string().optional().describe("New description for the event"),
                  location: z.string().optional().describe("New location for the event"),
                  attendees: z.array(z.string()).optional().describe("New list of attendees"),
                  color: z.string().optional().describe("New color class for the event"),
                }),
              )
              .describe("Array of events to update"),
          }),
          execute: async (params) => {
            console.log("Update events tool executed with params:", params)
            return params
          },
        }),
        deleteCalendarEvents: tool({
          description: "Delete events from the user's calendar",
          parameters: z.object({
            eventIds: z.array(z.string()).describe("Array of event IDs to delete"),
          }),
          execute: async (params) => {
            console.log("Delete events tool executed with params:", params)
            return params
          },
        }),
      },
    })

    console.log("AI Result:", JSON.stringify(result, null, 2))

    // Check if a tool was called
    if (result.toolCalls && result.toolCalls.length > 0) {
      const toolCall = result.toolCalls[0]
      console.log("Tool call:", JSON.stringify(toolCall, null, 2))

      if (toolCall.toolName === "addCalendarEvents") {
        const eventsData = toolCall.args
        console.log("Events data:", eventsData)

        if (!eventsData || !eventsData.events || !Array.isArray(eventsData.events)) {
          throw new Error("Invalid events data received from AI")
        }

        const validEvents = eventsData.events.filter(
          (event) => event.title && event.startTime && event.endTime && event.day,
        )

        if (validEvents.length === 0) {
          throw new Error("No valid events found in the request")
        }

        const eventsWithColors = validEvents.map((event) => ({
          ...event,
          color: event.color || getRandomColor(),
        }))

        const eventCount = eventsWithColors.length
        const eventTitles = eventsWithColors.map((event) => `"${event.title}"`).join(", ")

        let message
        if (eventCount === 1) {
          const event = eventsWithColors[0]
          message = `Perfect! I've added ${eventTitles} to your calendar for ${getDayName(event.day)} at ${event.startTime}-${event.endTime}.`
        } else {
          message = `Great! I've added ${eventCount} events to your calendar: ${eventTitles}. All events have been scheduled successfully!`
        }

        return Response.json({
          message,
          eventsAdded: true,
          eventsData: eventsWithColors,
          eventCount,
        })
      }

      if (toolCall.toolName === "updateCalendarEvents") {
        const updatedEventsData = toolCall.args
        console.log("Updated events data:", updatedEventsData)

        if (!updatedEventsData || !updatedEventsData.events || !Array.isArray(updatedEventsData.events)) {
          throw new Error("Invalid updated events data received from AI")
        }

        // Process the updates to convert day numbers to actual dates if needed
        const processedEvents = updatedEventsData.events.map((event: any) => {
          const updatedEvent = { ...event }

          // If day is provided, convert it to a date
          if (event.day) {
            const currentWeekStart = getStartOfWeek(new Date(currentDate))
            const newDate = new Date(currentWeekStart)
            newDate.setDate(currentWeekStart.getDate() + (event.day - 1))
            updatedEvent.date = newDate.toISOString()
          }

          return updatedEvent
        })

        const eventCount = processedEvents.length
        const eventTitles = processedEvents.map((event) => `"${event.title || "Event"}"`).join(", ")

        const message =
          eventCount === 1
            ? `I've updated ${eventTitles} in your calendar.`
            : `I've updated ${eventCount} events in your calendar: ${eventTitles}.`

        return Response.json({
          message,
          eventsUpdated: true,
          updatedEvents: processedEvents,
          eventCount,
        })
      }

      if (toolCall.toolName === "deleteCalendarEvents") {
        const deleteData = toolCall.args
        console.log("Delete events data:", deleteData)

        if (!deleteData || !deleteData.eventIds || !Array.isArray(deleteData.eventIds)) {
          throw new Error("Invalid delete events data received from AI")
        }

        const eventCount = deleteData.eventIds.length
        const message =
          eventCount === 1
            ? `I've deleted the event from your calendar.`
            : `I've deleted ${eventCount} events from your calendar.`

        return Response.json({
          message,
          eventsDeleted: true,
          deletedEventIds: deleteData.eventIds,
          eventCount,
        })
      }
    }

    return Response.json({
      message:
        result.text ||
        "I understand you want to manage your calendar. Could you please provide more details about what you'd like to do?",
      eventsAdded: false,
    })
  } catch (error) {
    console.error("AI Calendar Error:", error)

    if (error.message && error.message.includes("contents.parts must not be empty")) {
      return Response.json(
        {
          message: "There was an issue processing your message. Please try rephrasing your request.",
          eventsAdded: false,
        },
        { status: 400 },
      )
    }

    return Response.json(
      {
        message: "Sorry, I encountered an error processing your request. Please try again.",
        eventsAdded: false,
      },
      { status: 500 },
    )
  }
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

function getDayName(dayNumber: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  return days[dayNumber - 1] || "Unknown"
}

function getRandomColor(): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}