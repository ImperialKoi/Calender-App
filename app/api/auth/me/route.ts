import type { NextRequest } from "next/server"
import { withAuth } from "@/lib/middleware"
import { getUserById } from "@/lib/auth"

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const userData = await getUserById(user.userId)
    if (!userData) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    return Response.json({
      user: {
        id: userData._id,
        email: userData.email,
      },
    })
  } catch (error) {
    console.error("Get user error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
})
