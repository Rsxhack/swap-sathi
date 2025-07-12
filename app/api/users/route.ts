/**
 * User API Routes for SwapSathi
 * Handles user authentication, profile management, and wallet verification
 */

import { type NextRequest, NextResponse } from "next/server"
import { SwapSathiDB } from "@/lib/database"
import { verifyWalletSignature } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    const user = await SwapSathiDB.getUserByWallet(walletAddress)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Don't expose sensitive information
    const { email, ...publicUser } = user

    return NextResponse.json({ user: publicUser })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, signature, message, userData = {} } = body

    if (!walletAddress || !signature || !message) {
      return NextResponse.json({ error: "Wallet address, signature, and message are required" }, { status: 400 })
    }

    // Verify wallet signature for authentication
    const isValidSignature = await verifyWalletSignature(walletAddress, signature, message)

    if (!isValidSignature) {
      return NextResponse.json({ error: "Invalid wallet signature" }, { status: 401 })
    }

    // Create or update user
    const user = await SwapSathiDB.createOrUpdateUser(walletAddress, userData)

    // Create notification for new users
    if (user.total_trades === 0) {
      await SwapSathiDB.createNotification({
        user_id: user.id,
        title: "Welcome to SwapSathi!",
        message: "Start trading crypto securely with our P2P platform. Your first trade awaits!",
        type: "system",
        is_read: false,
      })
    }

    return NextResponse.json({
      user,
      message: "User authenticated successfully",
    })
  } catch (error) {
    console.error("Error creating/updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, userData } = body

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    const user = await SwapSathiDB.createOrUpdateUser(walletAddress, userData)

    return NextResponse.json({
      user,
      message: "User updated successfully",
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
