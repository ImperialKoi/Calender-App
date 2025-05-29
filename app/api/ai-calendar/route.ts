import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText, tool } from "ai"
import { z } from "zod"

// Create Google provider instance with API key
const google = createGoogleGenerativeAI({
  apiKey: "AIzaSyBcRHVum6MvZr1Mxkc5P0lQt_BTgAhuoB8",
})

export async function POST(req: Request) {
  try {
    const { messages, currentDate } = await req.json()

    // Validate and filter messages
    const validMessages = messages
      .filter((msg) => msg && msg.content && msg.content.trim().length > 0)
      .map((msg) => ({
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

    const result = await generateText({
      model: google("gemini-1.5-flash"),
      messages: validMessages,
      system: `You are a helpful calendar assistant. You can help users add events to their calendar by extracting meeting details from natural language.

Current date and time: ${currentDate}

When a user mentions meetings or events, extract ALL of them and create multiple events if needed. For each event, extract:
- Title/subject of the meeting
- Date and time (convert relative dates like "tomorrow", "next Monday" to actual dates)
- Duration or end time (if not specified, assume 1 hour)
- Location (if mentioned)
- Attendees (if mentioned)

For the day field, use 1-7 where:
1 = Sunday, 2 = Monday, 3 = Tuesday, 4 = Wednesday, 5 = Thursday, 6 = Friday, 7 = Saturday

If the user mentions multiple events in one message, create separate events for each one. For example:
- "Schedule a team meeting at 2 PM tomorrow and a client call at 4 PM the day after"
- "I need to book lunch with Sarah on Monday at 12:30 and a project review on Wednesday at 3 PM"

Always be helpful and confirm what you've added to the calendar.`,
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
            console.log("Tool executed with params:", params)
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
        // Access the arguments directly from the tool call
        const eventsData = toolCall.args
        console.log("Events data:", eventsData)

        if (!eventsData || !eventsData.events || !Array.isArray(eventsData.events)) {
          throw new Error("Invalid events data received from AI")
        }

        // Validate each event has required fields
        const validEvents = eventsData.events.filter(
          (event) => event.title && event.startTime && event.endTime && event.day,
        )

        if (validEvents.length === 0) {
          throw new Error("No valid events found in the request")
        }

        // Add default colors to events that don't have one
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
    }

    return Response.json({
      message:
        result.text ||
        "I understand you want to schedule something. Could you please provide more details about the event?",
      eventsAdded: false,
    })
  } catch (error) {
    console.error("AI Calendar Error:", error)

    // More specific error handling
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
