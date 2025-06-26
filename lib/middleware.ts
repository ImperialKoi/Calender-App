import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "./auth"

export function withAuth(handler: (req: NextRequest, user: { userId: string }, context: any) => Promise<Response>) {
  return async (req: NextRequest, context: any) => {
    const token = req.cookies.get("auth-token")?.value || req.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    return handler(req, user, context)
  }
}
