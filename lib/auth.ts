import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { connectToDatabase } from "./mongodb"
import { ObjectId } from "mongodb"

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set")
}

const JWT_SECRET = process.env.JWT_SECRET

export interface User {
  _id: ObjectId
  email: string
  password: string
  createdAt: Date
}

export async function createUser(email: string, password: string) {
  const { db } = await connectToDatabase()

  // Check if user already exists
  const existingUser = await db.collection("users").findOne({ email })
  if (existingUser) {
    throw new Error("User already exists")
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create user
  const result = await db.collection("users").insertOne({
    email,
    password: hashedPassword,
    createdAt: new Date(),
  })

  return result.insertedId
}

export async function authenticateUser(email: string, password: string) {
  const { db } = await connectToDatabase()

  // Find user
  const user = await db.collection("users").findOne({ email })
  if (!user) {
    throw new Error("Invalid credentials")
  }

  // Check password
  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    throw new Error("Invalid credentials")
  }

  return user
}

export async function getUserById(userId: string) {
  const { db } = await connectToDatabase()

  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
  return user
}

export function generateToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return decoded
  } catch (error) {
    return null
  }
}
