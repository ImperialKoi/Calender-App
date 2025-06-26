import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /calendar, /login)
  const path = request.nextUrl.pathname

  // Define paths that are considered public (accessible without authentication)
  const isPublicPath = path === "/" || path === "/login"

  // Get the token from the cookies
  const token = request.cookies.get("auth-token")?.value || ""

  // If the user is on a public path and has a token, redirect to calendar
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/calendar", request.nextUrl))
  }

  // If the user is on a protected path and doesn't have a token, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/login", request.nextUrl))
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
