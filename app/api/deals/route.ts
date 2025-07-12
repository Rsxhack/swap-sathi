/**
 * Deals API Routes for SwapSathi
 * Handles deal creation, updates, and management
 */

import { type NextRequest, NextResponse } from "next/server"
import { SwapSathiDB } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")
    const status = searchParams.get("status") as any

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    const user = await SwapSathiDB.getUserByWallet(walletAddress)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const deals = await SwapSathiDB.getUserDeals(user.id, status)

    return NextResponse.json({ deals })
  } catch (error) {
    console.error("Error fetching deals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adId, buyerWallet, amount, paymentMethod, upiId } = body

    // Validation
    if (!adId || !buyerWallet || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 })
    }

    // Get ad details
    const ad = await SwapSathiDB.getAdById(adId)
    if (!ad) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 })
    }

    // Get buyer
    const buyer = await SwapSathiDB.getUserByWallet(buyerWallet)
    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found. Please connect your wallet first." }, { status: 404 })
    }

    // Prevent self-trading
    if (ad.user_id === buyer.id) {
      return NextResponse.json({ error: "Cannot trade with yourself" }, { status: 400 })
    }

    // Validate amount constraints
    if (ad.min_amount && amount < ad.min_amount) {
      return NextResponse.json({ error: `Minimum amount is ${ad.min_amount} ${ad.asset}` }, { status: 400 })
    }

    if (ad.max_amount && amount > ad.max_amount) {
      return NextResponse.json({ error: `Maximum amount is ${ad.max_amount} ${ad.asset}` }, { status: 400 })
    }

    if (amount > ad.amount) {
      return NextResponse.json({ error: `Available amount is only ${ad.amount} ${ad.asset}` }, { status: 400 })
    }

    // Determine buyer and seller based on ad type
    const buyerId = ad.type === "sell" ? buyer.id : ad.user_id
    const sellerId = ad.type === "sell" ? ad.user_id : buyer.id

    // Create deal
    const dealData = {
      ad_id: adId,
      buyer_id: buyerId,
      seller_id: sellerId,
      amount: Number(amount),
      price: ad.price,
      total_inr: Number(amount) * ad.price,
      payment_method: paymentMethod || ad.payment_method,
      upi_id: upiId || ad.upi_id,
      status: "initiated" as const,
    }

    const deal = await SwapSathiDB.createDeal(dealData)

    // Create notifications for both parties
    await Promise.all([
      SwapSathiDB.createNotification({
        user_id: buyerId,
        title: "Deal Created",
        message: `Deal created for ${amount} ${ad.asset} at ₹${ad.price}`,
        type: "deal",
        related_id: deal.id,
        is_read: false,
      }),
      SwapSathiDB.createNotification({
        user_id: sellerId,
        title: "New Deal Request",
        message: `Someone wants to ${ad.type === "sell" ? "buy" : "sell"} ${amount} ${ad.asset}`,
        type: "deal",
        related_id: deal.id,
        is_read: false,
      }),
    ])

    return NextResponse.json({
      deal,
      message: "Deal created successfully",
    })
  } catch (error) {
    console.error("Error creating deal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
