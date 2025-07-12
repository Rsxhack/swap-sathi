/**
 * Individual Deal API Routes
 * Handles specific deal operations and status updates
 */

import { type NextRequest, NextResponse } from "next/server"
import { SwapSathiDB } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deal = await SwapSathiDB.getDealById(params.id)

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    return NextResponse.json({ deal })
  } catch (error) {
    console.error("Error fetching deal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const {
      status,
      walletAddress,
      transactionHash,
      escrowContractAddress,
      dealIdOnChain,
      paymentDetails,
      rating,
      feedback,
    } = body

    if (!walletAddress || !status) {
      return NextResponse.json({ error: "Wallet address and status are required" }, { status: 400 })
    }

    // Get current deal
    const currentDeal = await SwapSathiDB.getDealById(params.id)
    if (!currentDeal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    // Get user
    const user = await SwapSathiDB.getUserByWallet(walletAddress)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify user is part of the deal
    if (user.id !== currentDeal.buyer_id && user.id !== currentDeal.seller_id) {
      return NextResponse.json({ error: "Unauthorized to update this deal" }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {}

    if (transactionHash) updateData.transaction_hash = transactionHash
    if (escrowContractAddress) updateData.escrow_contract_address = escrowContractAddress
    if (dealIdOnChain) updateData.deal_id_on_chain = dealIdOnChain
    if (paymentDetails) updateData.payment_details = paymentDetails

    // Handle ratings and feedback
    if (rating && feedback) {
      if (user.id === currentDeal.buyer_id) {
        updateData.seller_rating = rating
        updateData.seller_feedback = feedback
      } else {
        updateData.buyer_rating = rating
        updateData.buyer_feedback = feedback
      }
    }

    // Update deal
    const updatedDeal = await SwapSathiDB.updateDealStatus(params.id, status, updateData)

    // Create notification for the other party
    const otherUserId = user.id === currentDeal.buyer_id ? currentDeal.seller_id : currentDeal.buyer_id

    let notificationMessage = ""
    switch (status) {
      case "funded":
        notificationMessage = "Deal has been funded with escrow contract"
        break
      case "payment_sent":
        notificationMessage = "Payment has been sent. Please confirm receipt."
        break
      case "completed":
        notificationMessage = "Deal completed successfully!"
        // Update user reputations
        await Promise.all([
          SwapSathiDB.updateUserReputation(currentDeal.buyer_id),
          SwapSathiDB.updateUserReputation(currentDeal.seller_id),
        ])
        break
      case "disputed":
        notificationMessage = "Deal has been disputed. Arbitrator will review."
        break
      case "cancelled":
        notificationMessage = "Deal has been cancelled"
        break
    }

    if (notificationMessage) {
      await SwapSathiDB.createNotification({
        user_id: otherUserId,
        title: "Deal Update",
        message: notificationMessage,
        type: "deal",
        related_id: params.id,
        is_read: false,
      })
    }

    return NextResponse.json({
      deal: updatedDeal,
      message: "Deal updated successfully",
    })
  } catch (error) {
    console.error("Error updating deal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
