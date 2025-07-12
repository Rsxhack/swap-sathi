/**
 * Ads API Routes for SwapSathi
 * Handles CRUD operations for buy/sell advertisements
 */

import { type NextRequest, NextResponse } from "next/server"
import { SwapSathiDB } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      asset: searchParams.get("asset") || undefined,
      type: (searchParams.get("type") as "buy" | "sell") || undefined,
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      paymentMethod: searchParams.get("paymentMethod") || undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
      offset: searchParams.get("offset") ? Number(searchParams.get("offset")) : 0,
    }

    const ads = await SwapSathiDB.getActiveAds(filters)

    return NextResponse.json({
      ads,
      total: ads.length,
      filters,
    })
  } catch (error) {
    console.error("Error fetching ads:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      walletAddress,
      asset,
      type,
      amount,
      price,
      minAmount,
      maxAmount,
      paymentMethod,
      upiId,
      chain,
      description,
      termsConditions,
      autoReplyMessage,
    } = body

    // Validation
    if (!walletAddress || !asset || !type || !amount || !price || !paymentMethod || !chain) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (amount <= 0 || price <= 0) {
      return NextResponse.json({ error: "Amount and price must be positive" }, { status: 400 })
    }

    if (minAmount && minAmount > amount) {
      return NextResponse.json({ error: "Minimum amount cannot be greater than total amount" }, { status: 400 })
    }

    if (maxAmount && maxAmount > amount) {
      return NextResponse.json({ error: "Maximum amount cannot be greater than total amount" }, { status: 400 })
    }

    // Get user
    const user = await SwapSathiDB.getUserByWallet(walletAddress)
    if (!user) {
      return NextResponse.json({ error: "User not found. Please connect your wallet first." }, { status: 404 })
    }

    // Create ad
    const adData = {
      user_id: user.id,
      asset,
      type,
      amount: Number(amount),
      price: Number(price),
      min_amount: minAmount ? Number(minAmount) : undefined,
      max_amount: maxAmount ? Number(maxAmount) : undefined,
      payment_method: paymentMethod,
      upi_id: upiId,
      chain,
      description,
      terms_conditions: termsConditions,
      auto_reply_message: autoReplyMessage,
      response_time_minutes: 30,
      status: "active" as const,
    }

    const ad = await SwapSathiDB.createAd(adData)

    // Create notification
    await SwapSathiDB.createNotification({
      user_id: user.id,
      title: "Ad Posted Successfully",
      message: `Your ${type} ad for ${amount} ${asset} is now live!`,
      type: "system",
      related_id: ad.id,
      is_read: false,
    })

    return NextResponse.json({
      ad,
      message: "Ad created successfully",
    })
  } catch (error) {
    console.error("Error creating ad:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
