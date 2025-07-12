/**
 * Individual Ad API Routes
 * Handles operations for specific advertisements
 */

import { type NextRequest, NextResponse } from "next/server"
import { SwapSathiDB } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ad = await SwapSathiDB.getAdById(params.id)

    if (!ad) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 })
    }

    return NextResponse.json({ ad })
  } catch (error) {
    console.error("Error fetching ad:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
