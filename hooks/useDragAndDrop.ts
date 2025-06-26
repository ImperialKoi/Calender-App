"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"

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

interface UseDragAndDropProps {
  events: Event[]
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>
  currentDate: Date
  logActivity: (activityType: string, details: any) => Promise<void>
  calendarRef: React.RefObject<HTMLDivElement>
}

interface DropZone {
  dayIndex: number
  hour: number
  rect: DOMRect
}

export function useDragAndDrop({ events, setEvents, currentDate, logActivity, calendarRef }: UseDragAndDropProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [activeDropZone, setActiveDropZone] = useState<DropZone | null>(null)

  // Use refs to avoid stale closures
  const dragStateRef = useRef({
    draggedEvent: null as Event | null,
    ghostElement: null as HTMLElement | null,
    dropZones: [] as DropZone[],
    eventDuration: 1,
    originalElement: null as HTMLElement | null,
  })

  const updateEventInMongoDB = async (eventId: string | number, eventData: any) => {
    try {
      const startTime = eventData.startTime || "09:00"
      const endTime = eventData.endTime || "10:00"

      if (!startTime.includes(":") || !endTime.includes(":")) {
        throw new Error("Invalid time format")
      }

      let eventDate = eventData.date
      if (!eventDate) {
        eventDate = new Date()
      } else if (typeof eventDate === "string") {
        eventDate = new Date(eventDate)
      } else if (!(eventDate instanceof Date)) {
        eventDate = new Date(eventDate)
      }

      if (isNaN(eventDate.getTime())) {
        throw new Error("Invalid date provided")
      }

      const startDateTime = new Date(eventDate)
      const endDateTime = new Date(eventDate)

      const [startHour, startMinute] = startTime.split(":")
      const [endHour, endMinute] = endTime.split(":")

      const startHourNum = Number.parseInt(startHour, 10)
      const startMinuteNum = Number.parseInt(startMinute, 10)
      const endHourNum = Number.parseInt(endHour, 10)
      const endMinuteNum = Number.parseInt(endMinute, 10)

      if (isNaN(startHourNum) || isNaN(startMinuteNum) || isNaN(endHourNum) || isNaN(endMinuteNum)) {
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
        throw new Error("Time components out of range")
      }

      startDateTime.setHours(startHourNum, startMinuteNum, 0, 0)
      endDateTime.setHours(endHourNum, endMinuteNum, 0, 0)

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error("Invalid DateTime objects")
      }

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

  const createDropZones = () => {
    if (!calendarRef.current) return []

    const zones: DropZone[] = []
    const calendarRect = calendarRef.current.getBoundingClientRect()
    const scrollTop = calendarRef.current.scrollTop || 0

    // Account for the calendar container's scroll position
    const dayColumnWidth = calendarRect.width / 8
    const timeColumnWidth = dayColumnWidth
    const hourHeight = 60
    const headerHeight = 60 // Height of the week header

    console.log("Calendar rect:", calendarRect)
    console.log("Scroll top:", scrollTop)

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      for (let hour = 0; hour < 24; hour++) {
        const x = timeColumnWidth + dayIndex * dayColumnWidth
        const y = headerHeight + hour * hourHeight - scrollTop

        zones.push({
          dayIndex,
          hour,
          rect: new DOMRect(calendarRect.left + x, calendarRect.top + y, dayColumnWidth, hourHeight),
        })
      }
    }

    console.log("Created zones for hours 0-23, days 0-6")
    return zones
  }

  const createGhostElement = (event: Event) => {
    const ghost = document.createElement("div")
    ghost.className = `${event.color} rounded-md p-2 text-white text-xs shadow-lg opacity-80 pointer-events-none fixed z-[9999]`
    ghost.style.width = "150px"
    ghost.style.height = `${dragStateRef.current.eventDuration * 60}px`

    ghost.innerHTML = `
      <div class="font-medium">${event.title}</div>
      <div class="opacity-80 text-[10px] mt-1">${event.startTime} - ${event.endTime}</div>
    `

    document.body.appendChild(ghost)
    return ghost
  }

  const updateGhostPosition = (x: number, y: number) => {
    if (dragStateRef.current.ghostElement) {
      dragStateRef.current.ghostElement.style.left = `${x - 75}px`
      dragStateRef.current.ghostElement.style.top = `${y - 20}px`
    }
  }

  const findActiveDropZone = (x: number, y: number): DropZone | null => {
    return (
      dragStateRef.current.dropZones.find(
        (zone) => x >= zone.rect.left && x <= zone.rect.right && y >= zone.rect.top && y <= zone.rect.bottom,
      ) || null
    )
  }

  const cleanupDrag = () => {
    // Remove ghost element
    if (dragStateRef.current.ghostElement) {
      dragStateRef.current.ghostElement.remove()
      dragStateRef.current.ghostElement = null
    }

    // Remove drop zone indicators
    const indicators = calendarRef.current?.querySelectorAll(".drop-zone-indicator")
    indicators?.forEach((indicator) => indicator.remove())

    // Restore original event
    if (dragStateRef.current.originalElement) {
      dragStateRef.current.originalElement.style.opacity = "1"
      dragStateRef.current.originalElement.style.pointerEvents = "auto"
      dragStateRef.current.originalElement = null
    }

    // Reset state
    setIsDragging(false)
    setActiveDropZone(null)
    dragStateRef.current.draggedEvent = null
    dragStateRef.current.dropZones = []
  }

  const startDrag = useCallback(
    (e: React.MouseEvent, event: Event) => {
      e.preventDefault()
      e.stopPropagation()

      console.log("Starting drag for event:", event.title)

      // Calculate event duration
      const startHour = Number.parseInt(event.startTime.split(":")[0])
      const endHour = Number.parseInt(event.endTime.split(":")[0])
      dragStateRef.current.eventDuration = Math.max(1, endHour - startHour)

      // Set up drag state
      setIsDragging(true)
      dragStateRef.current.draggedEvent = event

      // Create ghost element
      dragStateRef.current.ghostElement = createGhostElement(event)
      updateGhostPosition(e.clientX, e.clientY)

      // Create drop zones with current scroll position
      dragStateRef.current.dropZones = createDropZones()
      console.log("Created drop zones:", dragStateRef.current.dropZones.length)

      // Hide original event
      const originalElement = document.getElementById(`event-${event.id}`)
      if (originalElement) {
        originalElement.style.opacity = "0.3"
        originalElement.style.pointerEvents = "none"
        dragStateRef.current.originalElement = originalElement
      }

      // Show drop zone indicators
      dragStateRef.current.dropZones.forEach((zone, index) => {
        const indicator = document.createElement("div")
        indicator.className =
          "drop-zone-indicator absolute border-blue-400 bg-blue-100/20 opacity-30 transition-all duration-200 pointer-events-none rounded"
        indicator.style.left = `${zone.rect.left - calendarRef.current!.getBoundingClientRect().left + 4}px`
        indicator.style.top = `${zone.rect.top - calendarRef.current!.getBoundingClientRect().top}px`
        indicator.style.width = `${zone.rect.width - 8}px`
        indicator.style.height = `${zone.rect.height}px`
        indicator.style.zIndex = "10"
        indicator.setAttribute("data-zone-index", index.toString())
        calendarRef.current?.appendChild(indicator)
      })

      // Store current active drop zone in ref instead of state
      let currentActiveDropZone: DropZone | null = null

      const handleMouseMove = (moveEvent: MouseEvent) => {
        updateGhostPosition(moveEvent.clientX, moveEvent.clientY)

        const zone = findActiveDropZone(moveEvent.clientX, moveEvent.clientY)

        if (zone !== currentActiveDropZone) {
          currentActiveDropZone = zone
          setActiveDropZone(zone)

          console.log("Active drop zone changed:", zone ? `Day ${zone.dayIndex}, Hour ${zone.hour}` : "none")

          // Update drop zone highlighting
          const indicators = calendarRef.current?.querySelectorAll(".drop-zone-indicator")
          indicators?.forEach((indicator, index) => {
            const isActive = zone && dragStateRef.current.dropZones[index] === zone
            if (isActive) {
              indicator.classList.remove("border-blue-400", "bg-blue-100/20", "opacity-30")
              indicator.classList.add("border-green-400", "bg-green-100/30", "opacity-60")
            } else {
              indicator.classList.remove("border-green-400", "bg-green-100/30", "opacity-60")
              indicator.classList.add("border-blue-400", "bg-blue-100/20", "opacity-30")
            }
          })
        }
      }

      const handleMouseUp = async (upEvent: MouseEvent) => {
        console.log("Mouse up - ending drag")

        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)

        const finalDropZone = currentActiveDropZone // Use the ref value, not state
        const draggedEventRef = dragStateRef.current.draggedEvent

        console.log(
          "Final drop zone:",
          finalDropZone ? `Day ${finalDropZone.dayIndex}, Hour ${finalDropZone.hour}` : "none",
        )
        console.log("Dragged event:", draggedEventRef?.title)

        if (!draggedEventRef || !finalDropZone) {
          console.log("No valid drop - cleaning up")
          cleanupDrag()
          return
        }

        try {
          console.log("Processing drop...")

          // Calculate new date and time
          const weekDates = getWeekDates(currentDate)
          const newDate = weekDates[finalDropZone.dayIndex]

          if (newDate) {
            const newStartTime = `${finalDropZone.hour.toString().padStart(2, "0")}:00`
            const newEndTime = `${(finalDropZone.hour + dragStateRef.current.eventDuration).toString().padStart(2, "0")}:00`

            console.log("New event details:", {
              newDate: newDate.toDateString(),
              newStartTime,
              newEndTime,
            })

            // Show loading state
            if (dragStateRef.current.originalElement) {
              dragStateRef.current.originalElement.style.opacity = "0.5"
              dragStateRef.current.originalElement.innerHTML = `
              <div class="font-medium">Updating...</div>
              <div class="opacity-80 text-[10px] mt-1">Please wait</div>
            `
            }

            // Update in database
            console.log("Updating event in database...")
            await updateEventInMongoDB(draggedEventRef.id, {
              ...draggedEventRef,
              date: newDate,
              startTime: newStartTime,
              endTime: newEndTime,
            })

            console.log("Database update successful, updating local state...")

            // Update local state
            setEvents((prevEvents) => {
              const updatedEvents = prevEvents.map((e) =>
                e.id === draggedEventRef.id ? { ...e, date: newDate, startTime: newStartTime, endTime: newEndTime } : e,
              )
              console.log("Local state updated")
              return updatedEvents
            })

            console.log("Event move completed successfully")
          }
        } catch (error) {
          console.error("Error updating event position:", error)
          // Show error feedback
          if (dragStateRef.current.originalElement) {
            dragStateRef.current.originalElement.style.backgroundColor = "#ef4444"
            setTimeout(() => {
              if (dragStateRef.current.originalElement) {
                dragStateRef.current.originalElement.style.backgroundColor = ""
              }
            }, 1000)
          }
        } finally {
          cleanupDrag()
        }
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [currentDate, setEvents, logActivity, calendarRef],
  )

  return {
    isDragging,
    startDrag,
    activeDropZone,
  }
}
