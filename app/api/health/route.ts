/**
 * Health Check API Route
 * Monitors database connectivity and system status
 */

import { NextResponse } from "next/server"
import { SwapSathiDB } from "@/lib/database"

export async function GET() {
  try {
    const health = await SwapSathiDB.getHealthCheck()

    return NextResponse.json({
      status: "healthy",
      database: health.status,
      timestamp: health.timestamp,
      version: "SwapSathi v1.0.0",
      uptime: process.uptime(),
    })
  } catch (error) {
    console.error("Health check failed:", error)

    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
