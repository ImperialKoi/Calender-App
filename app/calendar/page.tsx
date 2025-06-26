"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Settings,
  Menu,
  Clock,
  MapPin,
  Users,
  Calendar,
  Pause,
  Sparkles,
  X,
  LogOut,
  Edit,
  Trash2,
} from "lucide-react"
import { useDragAndDrop } from "@/hooks/useDragAndDrop"

interface Event {
  id: string | number
  title: string
  startTime: string
  endTime: string
  color: string
  date: Date
  description: string
  location: string
  attendees: string[]
  organizer: string
}

const logActivity = async (activityType: string, details: any) => {
  try {
    await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityType, activityDetails: details }),
    })
  } catch (error) {
    console.error("Error logging activity:", error)
  }
}

export default function CalendarPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [showAIPopup, setShowAIPopup] = useState(false)
  const [typedText, setTypedText] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  const calendarRef = useRef<HTMLDivElement>(null)

  // Calendar state
  const [currentView, setCurrentView] = useState("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [quickCreatePosition, setQuickCreatePosition] = useState({ x: 0, y: 0 })
  const [quickCreateTime, setQuickCreateTime] = useState({ hour: 9, date: new Date() })
  const [newEvent, setNewEvent] = useState({
    title: "",
    startTime: "09:00",
    endTime: "10:00",
    date: new Date(),
    description: "",
    location: "",
    attendees: "",
    color: "bg-blue-500",
  })
  const [editEvent, setEditEvent] = useState({
    id: "",
    title: "",
    startTime: "09:00",
    endTime: "10:00",
    date: new Date(),
    description: "",
    location: "",
    attendees: "",
    color: "bg-blue-500",
  })
  const [quickEvent, setQuickEvent] = useState({
    title: "",
    description: "",
  })

  // AI Chat state
  const [showAIChat, setShowAIChat] = useState(false)
  const [aiMessages, setAiMessages] = useState<any[]>([])
  const [aiInput, setAiInput] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)

  // Calendar events state
  const [events, setEvents] = useState<Event[]>([])

  // Initialize drag and drop hook
  const { isDragging, startDrag, activeDropZone } = useDragAndDrop({
    events,
    setEvents,
    currentDate,
    logActivity,
    calendarRef,
  })

  // Settings state
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    backgroundImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
    backgroundOpacity: 0.8,
    blurIntensity: 0.5,
    theme: "light",
  })

  const loadEvents = async () => {
    try {
      const response = await fetch("/api/events")
      if (!response.ok) throw new Error("Failed to load events")

      const data = await response.json()
      const formattedEvents = data.map((event: any) => ({
        id: event._id || event.id, // Use MongoDB _id first, fallback to id
        title: event.title,
        startTime: new Date(event.startTime).toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
        endTime: new Date(event.endTime).toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
        color: event.color || "bg-blue-500",
        date: new Date(event.startTime),
        description: event.description || "",
        location: event.location || "",
        attendees: event.attendees || [],
        organizer: "You",
      }))

      setEvents(formattedEvents)
    } catch (error) {
      console.error("Error loading events:", error)
    }
  }

  const saveEventToMongoDB = async (eventData: any) => {
    try {
      const startDateTime = new Date(eventData.date)
      const [startHour, startMinute] = eventData.startTime.split(":")
      startDateTime.setHours(Number.parseInt(startHour), Number.parseInt(startMinute))

      const endDateTime = new Date(eventData.date)
      const [endHour, endMinute] = eventData.endTime.split(":")
      endDateTime.setHours(Number.parseInt(endHour), Number.parseInt(endMinute))

      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventData.title,
          description: eventData.description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          location: eventData.location,
          color: eventData.color,
          attendees: Array.isArray(eventData.attendees)
            ? eventData.attendees
            : eventData.attendees.split(",").map((a: string) => a.trim()),
        }),
      })

      if (!response.ok) throw new Error("Failed to save event")

      const data = await response.json()

      await logActivity("event_created", {
        event_title: eventData.title,
        event_date: startDateTime.toISOString(),
      })

      return data
    } catch (error) {
      console.error("Error saving event:", error)
      throw error
    }
  }

  const updateEventInMongoDB = async (eventId: string | number, eventData: any) => {
    try {
      console.log("Updating event with data:", eventData)

      // Ensure we have valid time values
      const startTime = eventData.startTime || "09:00"
      const endTime = eventData.endTime || "10:00"

      // Validate time format
      if (!startTime.includes(":") || !endTime.includes(":")) {
        console.error("Invalid time format:", { startTime, endTime })
        throw new Error("Invalid time format")
      }

      // Use the provided date or the existing event date
      let eventDate = eventData.date

      // Handle different date formats
      if (!eventDate) {
        eventDate = new Date()
      } else if (typeof eventDate === "string") {
        eventDate = new Date(eventDate)
      } else if (!(eventDate instanceof Date)) {
        eventDate = new Date(eventDate)
      }

      // Validate the date
      if (isNaN(eventDate.getTime())) {
        console.error("Invalid date:", eventData.date)
        throw new Error("Invalid date provided")
      }

      // Create new Date objects for start and end times
      const startDateTime = new Date(eventDate)
      const endDateTime = new Date(eventDate)

      // Parse and validate time components
      const [startHour, startMinute] = startTime.split(":")
      const [endHour, endMinute] = endTime.split(":")

      const startHourNum = Number.parseInt(startHour, 10)
      const startMinuteNum = Number.parseInt(startMinute, 10)
      const endHourNum = Number.parseInt(endHour, 10)
      const endMinuteNum = Number.parseInt(endMinute, 10)

      // Validate time components
      if (isNaN(startHourNum) || isNaN(startMinuteNum) || isNaN(endHourNum) || isNaN(endMinuteNum)) {
        console.error("Invalid time components:", { startTime, endTime })
        throw new Error("Invalid time components")
      }

      if (
        startHourNum < 0 ||
        startHourNum > 23 ||
        startMinuteNum < 0 ||
        startMinuteNum > 59 ||
        endHourNum < 0 ||
        endHourNum > 23 ||
        endMinuteNum < 0 ||
        endMinuteNum > 59
      ) {
        console.error("Time components out of range:", { startTime, endTime })
        throw new Error("Time components out of range")
      }

      // Set the time components
      startDateTime.setHours(startHourNum, startMinuteNum, 0, 0)
      endDateTime.setHours(endHourNum, endMinuteNum, 0, 0)

      // Validate the final DateTime objects
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        console.error("Invalid DateTime objects created:", { startDateTime, endDateTime })
        throw new Error("Invalid DateTime objects")
      }

      console.log("Validated DateTime objects:", {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
      })

      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventData.title,
          description: eventData.description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          location: eventData.location,
          color: eventData.color,
          attendees: Array.isArray(eventData.attendees)
            ? eventData.attendees
            : eventData.attendees?.split(",").map((a: string) => a.trim()) || [],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Update error response:", errorText)
        throw new Error("Failed to update event")
      }

      await logActivity("event_updated", {
        event_id: eventId,
        event_title: eventData.title,
      })

      return await response.json()
    } catch (error) {
      console.error("Error updating event:", error)
      throw error
    }
  }

  const deleteEventFromMongoDB = async (eventId: string | number) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete event")

      await logActivity("event_deleted", {
        event_id: eventId,
      })

      return await response.json()
    } catch (error) {
      console.error("Error deleting event:", error)
      throw error
    }
  }

  const handleSignOut = async () => {
    await logActivity("user_logout", {})
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
  }

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isDragging) {
      setSelectedEvent(event)
    }
  }

  const handleEditEvent = (event: Event) => {
    setEditEvent({
      id: event.id.toString(),
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      date: event.date,
      description: event.description,
      location: event.location,
      attendees: Array.isArray(event.attendees) ? event.attendees.join(", ") : "",
      color: event.color,
    })
    setSelectedEvent(null)
    setShowEditModal(true)
  }

  const handleDeleteEvent = async (eventId: string | number) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteEventFromMongoDB(eventId)
        setEvents((prev) => prev.filter((e) => e.id !== eventId))
        setSelectedEvent(null)
      } catch (error) {
        console.error("Error deleting event:", error)
        alert("Failed to delete event. Please try again.")
      }
    }
  }

  const saveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings)
    localStorage.setItem("calendar-settings", JSON.stringify(newSettings))
  }

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem("calendar-settings")
      if (saved) {
        const parsedSettings = JSON.parse(saved)
        setSettings(parsedSettings)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  // Use effects
  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    document.body.dataset.theme = settings.theme
  }, [settings.theme])

  const addEventsToCalendar = async (eventsData: any[]) => {
    try {
      for (const eventData of eventsData) {
        // Convert day number to actual date
        const startOfWeek = getStartOfWeek(currentDate)
        const eventDate = new Date(startOfWeek)
        eventDate.setDate(startOfWeek.getDate() + (eventData.day - 1))

        const newEventData = {
          title: eventData.title,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          color: eventData.color || "bg-blue-500",
          date: eventDate,
          description: eventData.description || "",
          location: eventData.location || "TBD",
          attendees: eventData.attendees || [],
        }

        await saveEventToMongoDB(newEventData)
      }

      // Reload events from database
      await loadEvents()
    } catch (error) {
      console.error("Error adding events:", error)
    }
  }

  const updateEventsInCalendar = async (updatedEventsData: any[]) => {
    try {
      for (const eventData of updatedEventsData) {
        // Find the existing event
        const existingEvent = events.find((e) => e.id.toString() === eventData.id)
        if (!existingEvent) {
          console.error("Event not found for update:", eventData.id)
          continue
        }

        // Handle day conversion if provided by AI
        let eventDate = existingEvent.date
        if (eventData.day !== undefined) {
          // Convert day number (1-7) to actual date within current week
          const startOfWeek = getStartOfWeek(currentDate)
          eventDate = new Date(startOfWeek)
          eventDate.setDate(startOfWeek.getDate() + (eventData.day - 1))
          console.log(`Converting day ${eventData.day} to date:`, eventDate)
        } else if (eventData.date) {
          eventDate = new Date(eventData.date)
        }

        // Prepare the update data, preserving existing values if not provided
        const updateData = {
          title: eventData.title || existingEvent.title,
          startTime: eventData.startTime || existingEvent.startTime,
          endTime: eventData.endTime || existingEvent.endTime,
          description: eventData.description !== undefined ? eventData.description : existingEvent.description,
          location: eventData.location !== undefined ? eventData.location : existingEvent.location,
          attendees: eventData.attendees !== undefined ? eventData.attendees : existingEvent.attendees,
          color: eventData.color || existingEvent.color,
          date: eventDate,
        }

        console.log("Updating event with processed data:", updateData)

        await updateEventInMongoDB(eventData.id, updateData)
      }

      // Reload events from database
      await loadEvents()
    } catch (error) {
      console.error("Error updating events:", error)
      throw error
    }
  }

  const addEventToCalendar = async (eventData: any) => {
    try {
      // Convert day number to actual date
      const startOfWeek = getStartOfWeek(currentDate)
      const eventDate = new Date(startOfWeek)
      eventDate.setDate(startOfWeek.getDate() + (eventData.day - 1))

      const newEventData = {
        title: eventData.title,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        color: eventData.color || "bg-blue-500",
        date: eventDate,
        description: eventData.description || "",
        location: eventData.location || "TBD",
        attendees: eventData.attendees || [],
      }

      await saveEventToMongoDB(newEventData)
      await loadEvents()
    } catch (error) {
      console.error("Error adding event:", error)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await saveEventToMongoDB({
        ...newEvent,
        attendees: newEvent.attendees.length ? newEvent.attendees.split(",").map((a) => a.trim()) : [],
      })

      await loadEvents()
      setShowCreateModal(false)
      setNewEvent({
        title: "",
        startTime: "09:00",
        endTime: "10:00",
        date: new Date(),
        description: "",
        location: "",
        attendees: "",
        color: "bg-blue-500",
      })
    } catch (error) {
      console.error("Error creating event:", error)
    }
  }

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateEventInMongoDB(editEvent.id, {
        ...editEvent,
        attendees: editEvent.attendees.length ? editEvent.attendees.split(",").map((a) => a.trim()) : [],
      })

      await loadEvents()
      setShowEditModal(false)
      setEditEvent({
        id: "",
        title: "",
        startTime: "09:00",
        endTime: "10:00",
        date: new Date(),
        description: "",
        location: "",
        attendees: "",
        color: "bg-blue-500",
      })
    } catch (error) {
      console.error("Error updating event:", error)
      alert("Failed to update event. Please try again.")
    }
  }

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickEvent.title.trim()) return

    try {
      const startHour = quickCreateTime.hour.toString().padStart(2, "0")
      const endHour = (quickCreateTime.hour + 1).toString().padStart(2, "0")

      await saveEventToMongoDB({
        title: quickEvent.title,
        startTime: `${startHour}:00`,
        endTime: `${endHour}:00`,
        date: quickCreateTime.date,
        description: quickEvent.description,
        location: "",
        attendees: [],
        color: "bg-blue-500",
      })

      await loadEvents()
      setShowQuickCreate(false)
      setQuickEvent({ title: "", description: "" })
    } catch (error) {
      console.error("Error creating quick event:", error)
    }
  }

  const handleCalendarClick = (e: React.MouseEvent, hour: number, date: Date) => {
    if (currentView !== "week" || isDragging) return

    e.stopPropagation()

    // Get the calendar container position
    const calendarContainer = document.querySelector(".calendar-content")
    const rect = calendarContainer?.getBoundingClientRect()

    if (!rect) return

    // Calculate position relative to the viewport
    const x = Math.min(e.clientX - 150, window.innerWidth - 350) // Ensure popup stays on screen
    const y = Math.min(e.clientY - 50, window.innerHeight - 250)

    setQuickCreatePosition({ x, y })
    setQuickCreateTime({ hour, date })
    setShowQuickCreate(true)
  }

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiInput.trim()) return

    const userMessage = { role: "user", content: aiInput.trim() }
    setAiMessages((prev) => [...prev, userMessage])
    setAiInput("")
    setIsAiLoading(true)

    try {
      // Filter out any empty messages before sending
      const validMessages = [...aiMessages, userMessage].filter(
        (msg) => msg && msg.content && msg.content.trim().length > 0,
      )

      const response = await fetch("/api/ai-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: validMessages,
          currentDate: currentDate.toISOString(),
          events: events.map((event) => ({
            id: event.id,
            title: event.title,
            startTime: event.startTime,
            endTime: event.endTime,
            date: event.date.toISOString(),
            description: event.description,
            location: event.location,
            attendees: event.attendees,
            color: event.color,
          })),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error:", errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Non-JSON response:", text)
        throw new Error("Server returned non-JSON response")
      }

      const data = await response.json()

      // Handle multiple events
      if (data.eventsAdded && data.eventsData) {
        await addEventsToCalendar(data.eventsData)
        await logActivity("ai_events_created", {
          event_count: data.eventsData.length,
          user_input: userMessage.content,
        })
      }
      // Handle single event (backward compatibility)
      else if (data.eventAdded && data.eventData) {
        await addEventToCalendar(data.eventData)
        await logActivity("ai_event_created", {
          event_title: data.eventData.title,
          user_input: userMessage.content,
        })
      }
      // Handle event updates
      else if (data.eventsUpdated && data.updatedEvents) {
        await updateEventsInCalendar(data.updatedEvents)
        await logActivity("ai_events_updated", {
          event_count: data.updatedEvents.length,
          user_input: userMessage.content,
        })
      }
      // Handle event deletions
      else if (data.eventsDeleted && data.deletedEventIds) {
        for (const eventId of data.deletedEventIds) {
          await deleteEventFromMongoDB(eventId)
        }
        setEvents((prev) => prev.filter((e) => !data.deletedEventIds.includes(e.id)))
        await logActivity("ai_events_deleted", {
          event_count: data.deletedEventIds.length,
          user_input: userMessage.content,
        })
      }

      setAiMessages((prev) => [...prev, { role: "assistant", content: data.message }])
    } catch (error) {
      console.error("Error:", error)
      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error processing your request. Please try again with a different message.",
        },
      ])
    } finally {
      setIsAiLoading(false)
    }
  }

  // Helper functions for calendar navigation
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  const getWeekDates = (date: Date) => {
    const startOfWeek = getStartOfWeek(date)
    const dates = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      dates.push(day)
    }
    return dates
  }

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + direction * 7)
    setCurrentDate(newDate)
  }

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })
  }

  // Get current week dates
  const weekDates = getWeekDates(currentDate)
  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
  const timeSlots = Array.from({ length: 24 }, (_, i) => i) // 0:00 to 23:00

  // Helper function to check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }

  // Helper function to calculate event position and height
  const calculateEventStyle = (startTime: string, endTime: string) => {
    const start = Number.parseInt(startTime.split(":")[0]) + Number.parseInt(startTime.split(":")[1]) / 60
    const end = Number.parseInt(endTime.split(":")[0]) + Number.parseInt(endTime.split(":")[1]) / 60
    const top = start * 60 // 60px per hour
    const height = (end - start) * 60
    return { top: `${top}px`, height: `${height}px` }
  }

  // Get events for current week
  const getEventsForDate = (date: Date) => {
    return events.filter((event) => isSameDay(event.date, date))
  }

  // Month view functions
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const generateMonthDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, date: null })
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      days.push({ day, date })
    }

    return days
  }

  const monthDays = generateMonthDays()

  // Mini calendar logic
  const generateMiniCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth())
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth())
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  const miniCalendarDays = generateMiniCalendar()

  // Sample my calendars
  const myCalendars = [
    { name: "My Calendar", color: "bg-blue-500" },
    { name: "Work", color: "bg-green-500" },
    { name: "Personal", color: "bg-purple-500" },
    { name: "Family", color: "bg-orange-500" },
  ]

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  // Format time for display
  const formatTime = (hour: number) => {
    if (hour === 0) return "12 AM"
    if (hour === 12) return "12 PM"
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`
  }

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (!response.ok) {
          router.push("/login")
          return
        }
        const data = await response.json()
        setUser(data.user)
        setLoading(false)

        // Load user's events
        await loadEvents()

        // Log activity
        await logActivity("page_visit", { page: "calendar" })
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (!loading) {
      setIsLoaded(true)

      // Show AI popup after 3 seconds
      const popupTimer = setTimeout(() => {
        setShowAIPopup(true)
      }, 3000)

      return () => clearTimeout(popupTimer)
    }
  }, [loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <Image
        src={settings.backgroundImage || "/placeholder.svg"}
        alt="Beautiful background"
        fill
        className="object-cover transition-all duration-500"
        style={{
          opacity: settings.backgroundOpacity,
          filter: `blur(${settings.blurIntensity * 2}px)`,
        }}
        priority
      />

      {/* Navigation */}
      <header
        className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-6 opacity-0 ${isLoaded ? "animate-fade-in" : ""}`}
        style={{ animationDelay: "0.2s" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            <Menu className="h-6 w-6 text-white" />
          </button>
          <span className="text-2xl font-semibold text-white drop-shadow-lg">Calendar</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
            <input
              type="text"
              placeholder="Search"
              className="rounded-full bg-white/10 backdrop-blur-sm pl-10 pr-4 py-2 text-white placeholder:text-white/70 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <button onClick={() => setShowSettings(true)} className="hover:bg-white/10 p-2 rounded-lg transition-colors">
            <Settings className="h-6 w-6 text-white drop-shadow-md" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-md">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <button
              onClick={handleSignOut}
              className="text-white/70 hover:text-white transition-colors p-2"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative h-screen w-full pt-20 flex">
        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? "w-64" : "w-0"} h-full bg-white/10 backdrop-blur-lg shadow-xl border-r border-white/20 rounded-tr-3xl opacity-0 ${isLoaded ? "animate-fade-in" : ""} flex flex-col justify-between transition-all duration-300 overflow-hidden`}
          style={{ animationDelay: "0.4s" }}
        >
          <div className="p-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="mb-6 flex items-center justify-center gap-2 rounded-full bg-blue-500 px-4 py-3 text-white w-full hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create</span>
            </button>

            {/* Mini Calendar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">{formatMonth(currentDate)}</h3>
                <div className="flex gap-1">
                  <button onClick={() => navigateMonth(-1)} className="p-1 rounded-full hover:bg-white/20">
                    <ChevronLeft className="h-4 w-4 text-white" />
                  </button>
                  <button onClick={() => navigateMonth(1)} className="p-1 rounded-full hover:bg-white/20">
                    <ChevronRight className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                  <div key={i} className="text-xs text-white/70 font-medium py-1">
                    {day}
                  </div>
                ))}

                {miniCalendarDays.map((day, i) => (
                  <div
                    key={i}
                    className={`text-xs rounded-full w-7 h-7 flex items-center justify-center cursor-pointer ${
                      day && isSameDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), currentDate)
                        ? "bg-blue-500 text-white"
                        : "text-white hover:bg-white/20"
                    } ${!day ? "invisible" : ""}`}
                    onClick={() => {
                      if (day) {
                        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                        setCurrentDate(newDate)
                      }
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* My Calendars */}
            <div>
              <h3 className="text-white font-medium mb-3">My calendars</h3>
              <div className="space-y-2">
                {myCalendars.map((cal, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-sm ${cal.color}`}></div>
                    <span className="text-white text-sm">{cal.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Chat Button */}
          <div className="p-4">
            <button
              onClick={() => setShowAIChat(true)}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 w-14 h-14 flex items-center justify-center"
            >
              <Sparkles className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Calendar View */}
        <div
          className={`flex-1 flex flex-col opacity-0 ${isLoaded ? "animate-fade-in" : ""}`}
          style={{ animationDelay: "0.6s" }}
        >
          {/* Calendar Controls */}
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <div className="flex items-center gap-4">
              <button
                onClick={goToToday}
                className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
              >
                Today
              </button>
              <div className="flex">
                <button
                  onClick={() => (currentView === "week" ? navigateWeek(-1) : navigateMonth(-1))}
                  className="p-2 text-white hover:bg-white/10 rounded-l-md transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => (currentView === "week" ? navigateWeek(1) : navigateMonth(1))}
                  className="p-2 text-white hover:bg-white/10 rounded-r-md transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <h2 className="text-xl font-semibold text-white">
                {currentView === "week" ? formatDate(currentDate) : formatMonth(currentDate)}
              </h2>
            </div>

            <div className="flex items-center gap-2 rounded-md p-1">
              <button
                onClick={() => setCurrentView("week")}
                className={`px-3 py-1 rounded transition-colors ${currentView === "week" ? "bg-white/20" : "hover:bg-white/10"} text-white text-sm`}
              >
                Week
              </button>
              <button
                onClick={() => setCurrentView("month")}
                className={`px-3 py-1 rounded transition-colors ${currentView === "month" ? "bg-white/20" : "hover:bg-white/10"} text-white text-sm`}
              >
                Month
              </button>
            </div>
          </div>

          {/* Calendar Content */}
          <div className="flex-1 overflow-auto p-4 calendar-content flex flex-col">
            <div className="bg-white/20 rounded-xl border border-white/20 shadow-xl flex-1 h-max">
              {currentView === "week" ? (
                <div ref={calendarRef} className="h-full relative">
                  {/* Week Header */}
                  <div className="grid grid-cols-8 border-b border-white/20">
                    <div className="p-2 text-center text-white/50 text-xs"></div>
                    {weekDates.map((date, i) => (
                      <div key={i} className="p-2 text-center border-l border-white/20">
                        <div className="text-xs text-white/70 font-medium">{weekDays[i]}</div>
                        <div
                          className={`text-lg font-medium mt-1 text-white ${
                            isSameDay(date, new Date())
                              ? "bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                              : ""
                          }`}
                        >
                          {date.getDate()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Time Grid */}
                  <div className="grid grid-cols-8">
                    {/* Time Labels */}
                    <div className="text-white/70">
                      {timeSlots.map((time, i) => (
                        <div key={i} className="h-[60px] border-b border-white/10 pr-2 text-right text-xs">
                          {formatTime(time)}
                        </div>
                      ))}
                    </div>

                    {/* Days Columns */}
                    {weekDates.map((date, dayIndex) => (
                      <div key={dayIndex} className="border-l border-white/20 relative">
                        {timeSlots.map((hour, timeIndex) => (
                          <div
                            key={timeIndex}
                            className="h-[60px] border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors duration-150"
                            onClick={(e) => handleCalendarClick(e, hour, date)}
                          ></div>
                        ))}

                        {/* Events */}
                        {getEventsForDate(date).map((event, i) => {
                          const eventStyle = calculateEventStyle(event.startTime, event.endTime)
                          return (
                            <div
                              key={i}
                              id={`event-${event.id}`}
                              className={`absolute ${event.color} rounded-md p-2 text-white text-xs shadow-md cursor-move transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.02] select-none`}
                              style={{
                                ...eventStyle,
                                left: "4px",
                                right: "4px",
                              }}
                              onClick={(e) => handleEventClick(event, e)}
                              onMouseDown={(e) => startDrag(e, event)}
                            >
                              <div className="font-medium">{event.title}</div>
                              <div className="opacity-80 text-[10px] mt-1">{`${event.startTime} - ${event.endTime}`}</div>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Month View */
                <div className="h-full">
                  {/* Month Header */}
                  <div className="grid grid-cols-7 border-b border-white/20">
                    {weekDays.map((day, i) => (
                      <div key={i} className="p-2 text-center">
                        <div className="text-sm text-white/70 font-medium">{day}</div>
                      </div>
                    ))}
                  </div>

                  {/* Month Grid */}
                  <div className="grid grid-cols-7 grid-rows-6 h-[calc(100%-40px)]">
                    {monthDays.map((dayObj, i) => (
                      <div
                        key={i}
                        className={`border border-white/10 p-1 min-h-[100px] ${
                          dayObj.day && isSameDay(dayObj.date, new Date()) ? "bg-blue-500/10" : ""
                        }`}
                      >
                        {dayObj.day && (
                          <>
                            <div
                              className={`text-sm font-medium mb-1 ${
                                isSameDay(dayObj.date, new Date())
                                  ? "bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-white"
                                  : "text-white"
                              }`}
                            >
                              {dayObj.day}
                            </div>
                            <div className="space-y-1 overflow-y-auto max-h-[80px]">
                              {getEventsForDate(dayObj.date).map((event, j) => (
                                <div
                                  key={j}
                                  className={`${event.color} text-white text-xs p-1 rounded truncate cursor-pointer transition-colors duration-150 hover:opacity-80`}
                                  onClick={(e) => handleEventClick(event, e)}
                                >
                                  {event.startTime} {event.title}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Create Popup - Fixed positioning */}
        {showQuickCreate && (
          <div
            className="fixed z-50 bg-white rounded-lg shadow-xl p-4 min-w-[300px] border border-gray-200"
            style={{
              left: quickCreatePosition.x,
              top: quickCreatePosition.y,
            }}
          >
            <form onSubmit={handleQuickCreate} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={quickEvent.title}
                  onChange={(e) => setQuickEvent({ ...quickEvent, title: e.target.value })}
                  placeholder="Event title"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                  required
                />
              </div>
              <div>
                <textarea
                  value={quickEvent.description}
                  onChange={(e) => setQuickEvent({ ...quickEvent, description: e.target.value })}
                  placeholder="Description (optional)"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
                />
              </div>
              <div className="text-sm text-gray-600">
                {quickCreateTime.date.toLocaleDateString()} at {formatTime(quickCreateTime.hour)}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickCreate(false)}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        )}

        {/* AI Chat Interface */}
        {showAIChat && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="w-[500px] h-[600px] bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-white/20">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Calendar Assistant
                </h3>
                <button
                  onClick={() => setShowAIChat(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {aiMessages.length === 0 && (
                  <div className="text-white/70 text-center py-8">
                    <p>Hi! I can help you add, edit, or delete events in your calendar.</p>
                    <p className="text-sm mt-2">
                      Try saying: "Schedule a team meeting at 2 PM tomorrow", "Move my lunch meeting to 1 PM", "Delete
                      the client call on Friday", or "Move my project review to next Monday at 3 PM"
                    </p>
                  </div>
                )}

                {aiMessages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === "user" ? "bg-blue-500 text-white" : "bg-white/20 text-white"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/20 text-white p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Thinking...
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleAiSubmit} className="p-4 border-t border-white/20">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Tell me about your meetings..."
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isAiLoading}
                  />
                  <button
                    type="submit"
                    disabled={isAiLoading || !aiInput.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Event Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="w-[500px] bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Create New Event</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-white text-sm mb-1">Event Title</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Meeting title"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm mb-1">Start Time</label>
                    <input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm mb-1">End Time</label>
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm mb-1">Date</label>
                  <input
                    type="date"
                    value={newEvent.date.toISOString().split("T")[0]}
                    onChange={(e) => setNewEvent({ ...newEvent, date: new Date(e.target.value) })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm mb-1">Location</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Meeting location"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm mb-1">Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                    placeholder="Event description"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm mb-1">Attendees (comma separated)</label>
                  <input
                    type="text"
                    value={newEvent.attendees}
                    onChange={(e) => setNewEvent({ ...newEvent, attendees: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm mb-1">Color</label>
                  <select
                    value={newEvent.color}
                    onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bg-blue-500">Blue</option>
                    <option value="bg-green-500">Green</option>
                    <option value="bg-purple-500">Purple</option>
                    <option value="bg-yellow-500">Yellow</option>
                    <option value="bg-pink-500">Pink</option>
                    <option value="bg-indigo-500">Indigo</option>
                    <option value="bg-teal-500">Teal</option>
                    <option value="bg-orange-500">Orange</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Event Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="w-[500px] bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Edit Event</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateEvent} className="space-y-4">
                <div>
                  <label className="block text-white text-sm mb-1">Event Title</label>
                  <input
                    type="text"
                    value={editEvent.title}
                    onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Meeting title"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm mb-1">Start Time</label>
                    <input
                      type="time"
                      value={editEvent.startTime}
                      onChange={(e) => setEditEvent({ ...editEvent, startTime: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm mb-1">End Time</label>
                    <input
                      type="time"
                      value={editEvent.endTime}
                      onChange={(e) => setEditEvent({ ...editEvent, endTime: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm mb-1">Date</label>
                  <input
                    type="date"
                    value={editEvent.date.toISOString().split("T")[0]}
                    onChange={(e) => setEditEvent({ ...editEvent, date: new Date(e.target.value) })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm mb-1">Location</label>
                  <input
                    type="text"
                    value={editEvent.location}
                    onChange={(e) => setEditEvent({ ...editEvent, location: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Meeting location"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm mb-1">Description</label>
                  <textarea
                    value={editEvent.description}
                    onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                    placeholder="Event description"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm mb-1">Attendees (comma separated)</label>
                  <input
                    type="text"
                    value={editEvent.attendees}
                    onChange={(e) => setEditEvent({ ...editEvent, attendees: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm mb-1">Color</label>
                  <select
                    value={editEvent.color}
                    onChange={(e) => setEditEvent({ ...editEvent, color: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bg-blue-500">Blue</option>
                    <option value="bg-green-500">Green</option>
                    <option value="bg-purple-500">Purple</option>
                    <option value="bg-yellow-500">Yellow</option>
                    <option value="bg-pink-500">Pink</option>
                    <option value="bg-indigo-500">Indigo</option>
                    <option value="bg-teal-500">Teal</option>
                    <option value="bg-orange-500">Orange</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Update Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${selectedEvent.color} p-6 rounded-lg shadow-xl max-w-md w-full mx-4`}>
              <h3 className="text-2xl font-bold mb-4 text-white">{selectedEvent.title}</h3>
              <div className="space-y-3 text-white">
                <p className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  {`${selectedEvent.startTime} - ${selectedEvent.endTime}`}
                </p>
                <p className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  {selectedEvent.location}
                </p>
                <p className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  {selectedEvent.date.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="flex items-start">
                  <Users className="mr-2 h-5 w-5 mt-1" />
                  <span>
                    <strong>Attendees:</strong>
                    <br />
                    {selectedEvent.attendees.join(", ") || "No attendees"}
                  </span>
                </p>
                <p>
                  <strong>Organizer:</strong> {selectedEvent.organizer}
                </p>
                <p>
                  <strong>Description:</strong> {selectedEvent.description}
                </p>
              </div>
              <div className="mt-6 flex justify-between">
                <div className="flex gap-2">
                  <button
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded transition-colors flex items-center gap-2"
                    onClick={() => handleEditEvent(selectedEvent)}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    className="bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded transition-colors flex items-center gap-2"
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
                <button
                  className="bg-white text-gray-800 px-4 py-2 rounded hover:bg-gray-100 transition-colors"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="w-[600px] max-h-[80vh] bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <h3 className="text-xl font-semibold text-white">Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Background Selection */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Background Image</h4>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {[
                      {
                        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
                        name: "Mountain Vista",
                      },
                      {
                        url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2070&auto=format&fit=crop",
                        name: "Forest Path",
                      },
                      {
                        url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2070&auto=format&fit=crop",
                        name: "Lake Reflection",
                      },
                      {
                        url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=2070&auto=format&fit=crop",
                        name: "Ocean Waves",
                      },
                      {
                        url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=2070&auto=format&fit=crop",
                        name: "City Skyline",
                      },
                      {
                        url: "https://images.unsplash.com/photo-1447433819943-74a20887a81e?q=80&w=2070&auto=format&fit=crop",
                        name: "Galaxy Night",
                      },
                      {
                        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop&sat=-100",
                        name: "Monochrome",
                      },
                      {
                        url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=2070&auto=format&fit=crop",
                        name: "Golden Gate Bridge",
                      },
                      {
                        url: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=2070&auto=format&fit=crop",
                        name: "Starry Night",
                      },
                      {
                        url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=2070&auto=format&fit=crop",
                        name: "Desert Peace",
                      },
                      {
                        url: "https://images.unsplash.com/photo-1500964757637-c85e8a162699?q=80&w=2070&auto=format&fit=crop",
                        name: "Golden Hour",
                      },
                      {
                        url: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=2070&auto=format&fit=crop",
                        name: "Flower Field",
                      },
                    ].map((bg, index) => (
                      <div
                        key={index}
                        className={`relative h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          settings.backgroundImage === bg.url
                            ? "border-blue-400 ring-2 ring-blue-400/50"
                            : "border-white/20 hover:border-white/40"
                        }`}
                        onClick={() => saveSettings({ ...settings, backgroundImage: bg.url })}
                      >
                        <img src={bg.url || "/placeholder.svg"} alt={bg.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-end">
                          <span className="text-white text-xs p-2 font-medium">{bg.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Background Opacity */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Background Opacity</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Opacity</span>
                      <span className="text-white font-medium">{Math.round(settings.backgroundOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={settings.backgroundOpacity}
                      onChange={(e) =>
                        saveSettings({ ...settings, backgroundOpacity: Number.parseFloat(e.target.value) })
                      }
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>

                {/* Blur Intensity */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Background Blur</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Blur Intensity</span>
                      <span className="text-white font-medium">{Math.round(settings.blurIntensity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.blurIntensity}
                      onChange={(e) => saveSettings({ ...settings, blurIntensity: Number.parseFloat(e.target.value) })}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>

                {/* Theme Selection */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Interface Theme</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: "light", name: "Light Mode", preview: "bg-white/20" },
                      { value: "dark", name: "Dark Mode", preview: "bg-black/40" },
                    ].map((theme) => (
                      <div
                        key={theme.value}
                        className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${
                          settings.theme === theme.value
                            ? "border-blue-400 ring-2 ring-blue-400/50"
                            : "border-white/20 hover:border-white/40"
                        } ${theme.preview}`}
                        onClick={() => saveSettings({ ...settings, theme: theme.value })}
                      >
                        <div className="text-white font-medium">{theme.name}</div>
                        <div className="text-white/70 text-sm mt-1">
                          {theme.value === "light" ? "Brighter interface elements" : "Darker interface elements"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reset to Defaults */}
                <div className="pt-4 border-t border-white/20">
                  <button
                    onClick={() => {
                      const defaultSettings = {
                        backgroundImage:
                          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
                        backgroundOpacity: 0.8,
                        blurIntensity: 0.5,
                        theme: "light",
                      }
                      saveSettings(defaultSettings)
                    }}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Click outside to close quick create */}
        {showQuickCreate && <div className="fixed inset-0 z-40" onClick={() => setShowQuickCreate(false)} />}
      </main>
    </div>
  )
}
