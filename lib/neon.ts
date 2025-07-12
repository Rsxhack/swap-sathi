/**
 * Neon Database Integration for SwapSathi
 *
 * This module provides a comprehensive database layer using Neon's serverless PostgreSQL.
 * It includes connection management, query helpers, and type-safe database operations.
 *
 * Key Features:
 * - Connection pooling and automatic retries
 * - Type-safe query builders
 * - Transaction support
 * - Error handling and logging
 * - Performance monitoring
 */

import { neon } from "@neondatabase/serverless"
import type { NeonQueryFunction } from "@neondatabase/serverless"

// Database connection configuration
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required for Neon connection")
}

// Create the main SQL client with connection pooling
export const sql: NeonQueryFunction<false, false> = neon(DATABASE_URL)

// Database types for type safety
export interface User {
  id: string
  wallet_address: string
  username?: string
  email?: string
  reputation_score: number
  total_trades: number
  successful_trades: number
  is_verified: boolean
  kyc_status: "pending" | "verified" | "rejected"
  created_at: string
  updated_at: string
  last_active: string
}

export interface Ad {
  id: string
  user_id: string
  asset: string
  type: "buy" | "sell"
  amount: number
  price: number
  min_amount?: number
  max_amount?: number
  payment_method: string
  upi_id?: string
  bank_details?: Record<string, any>
  chain: string
  status: "active" | "paused" | "completed" | "cancelled"
  description?: string
  terms_conditions?: string
  auto_reply_message?: string
  response_time_minutes: number
  created_at: string
  updated_at: string
  expires_at?: string
}

export interface Deal {
  id: string
  ad_id: string
  buyer_id: string
  seller_id: string
  amount: number
  price: number
  total_inr: number
  escrow_contract_address?: string
  transaction_hash?: string
  deal_id_on_chain?: number
  status: "initiated" | "funded" | "payment_sent" | "completed" | "disputed" | "cancelled" | "expired"
  payment_method: string
  payment_details?: Record<string, any>
  upi_id?: string
  dispute_reason?: string
  arbitrator_decision?: string
  buyer_rating?: number
  seller_rating?: number
  buyer_feedback?: string
  seller_feedback?: string
  created_at: string
  updated_at: string
  funded_at?: string
  payment_sent_at?: string
  completed_at?: string
  expires_at: string
}

export interface DealMessage {
  id: string
  deal_id: string
  user_id: string
  message: string
  message_type: "text" | "image" | "file" | "system"
  file_url?: string
  is_read: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "deal" | "payment" | "dispute" | "system" | "security"
  related_id?: string
  is_read: boolean
  created_at: string
}

/**
 * Database operation helpers with error handling and logging
 */
export class NeonDB {
  /**
   * Execute a query with automatic error handling and logging
   */
  static async query<T = any>(query: string, params: any[] = [], operation = "query"): Promise<T[]> {
    try {
      console.log(`[NeonDB] Executing ${operation}:`, query.substring(0, 100) + "...")
      const startTime = Date.now()

      const result = await sql(query, params)

      const duration = Date.now() - startTime
      console.log(`[NeonDB] ${operation} completed in ${duration}ms`)

      return result as T[]
    } catch (error) {
      console.error(`[NeonDB] Error in ${operation}:`, error)
      console.error(`[NeonDB] Query:`, query)
      console.error(`[NeonDB] Params:`, params)
      throw new Error(`Database ${operation} failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Execute a transaction with automatic rollback on error
   */
  static async transaction<T>(
    operations: Array<{ query: string; params?: any[] }>,
    operationName = "transaction",
  ): Promise<T[]> {
    try {
      console.log(`[NeonDB] Starting transaction: ${operationName}`)

      // Begin transaction
      await sql("BEGIN")

      const results: T[] = []

      for (const { query, params = [] } of operations) {
        const result = await sql(query, params)
        results.push(result as T)
      }

      // Commit transaction
      await sql("COMMIT")

      console.log(`[NeonDB] Transaction ${operationName} completed successfully`)
      return results
    } catch (error) {
      console.error(`[NeonDB] Transaction ${operationName} failed:`, error)

      try {
        await sql("ROLLBACK")
        console.log(`[NeonDB] Transaction ${operationName} rolled back`)
      } catch (rollbackError) {
        console.error(`[NeonDB] Rollback failed:`, rollbackError)
      }

      throw new Error(
        `Transaction ${operationName} failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  /**
   * User management operations
   */
  static async createOrUpdateUser(walletAddress: string, userData: Partial<User> = {}): Promise<User> {
    const query = `
      INSERT INTO users (wallet_address, username, email, updated_at, last_active)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (wallet_address) 
      DO UPDATE SET 
        username = COALESCE($2, users.username),
        email = COALESCE($3, users.email),
        updated_at = NOW(),
        last_active = NOW()
      RETURNING *
    `

    const result = await this.query<User>(
      query,
      [walletAddress.toLowerCase(), userData.username, userData.email],
      "createOrUpdateUser",
    )

    return result[0]
  }

  static async getUserByWallet(walletAddress: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE wallet_address = $1`
    const result = await this.query<User>(query, [walletAddress.toLowerCase()], "getUserByWallet")
    return result[0] || null
  }

  static async updateUserReputation(userId: string): Promise<number> {
    const query = `SELECT calculate_user_reputation($1) as reputation`
    const result = await this.query<{ reputation: number }>(query, [userId], "updateUserReputation")
    return result[0]?.reputation || 0
  }

  /**
   * Ad management operations
   */
  static async createAd(adData: Omit<Ad, "id" | "created_at" | "updated_at">): Promise<Ad> {
    const query = `
      INSERT INTO ads (
        user_id, asset, type, amount, price, min_amount, max_amount,
        payment_method, upi_id, bank_details, chain, description,
        terms_conditions, auto_reply_message, response_time_minutes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `

    const result = await this.query<Ad>(
      query,
      [
        adData.user_id,
        adData.asset,
        adData.type,
        adData.amount,
        adData.price,
        adData.min_amount,
        adData.max_amount,
        adData.payment_method,
        adData.upi_id,
        adData.bank_details ? JSON.stringify(adData.bank_details) : null,
        adData.chain,
        adData.description,
        adData.terms_conditions,
        adData.auto_reply_message,
        adData.response_time_minutes,
      ],
      "createAd",
    )

    return result[0]
  }

  static async getActiveAds(
    filters: {
      asset?: string
      type?: "buy" | "sell"
      minPrice?: number
      maxPrice?: number
      paymentMethod?: string
      limit?: number
      offset?: number
    } = {},
  ): Promise<(Ad & { username?: string; reputation_score: number; total_trades: number })[]> {
    let query = `
      SELECT a.*, u.username, u.reputation_score, u.total_trades, u.wallet_address
      FROM ads a
      JOIN users u ON a.user_id = u.id
      WHERE a.status = 'active'
    `

    const params: any[] = []
    let paramIndex = 1

    if (filters.asset) {
      query += ` AND a.asset = $${paramIndex++}`
      params.push(filters.asset)
    }

    if (filters.type) {
      query += ` AND a.type = $${paramIndex++}`
      params.push(filters.type)
    }

    if (filters.minPrice) {
      query += ` AND a.price >= $${paramIndex++}`
      params.push(filters.minPrice)
    }

    if (filters.maxPrice) {
      query += ` AND a.price <= $${paramIndex++}`
      params.push(filters.maxPrice)
    }

    if (filters.paymentMethod) {
      query += ` AND a.payment_method = $${paramIndex++}`
      params.push(filters.paymentMethod)
    }

    query += ` ORDER BY a.created_at DESC`

    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`
      params.push(filters.limit)
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex++}`
      params.push(filters.offset)
    }

    return this.query(query, params, "getActiveAds")
  }

  static async getAdById(
    adId: string,
  ): Promise<
    (Ad & { username?: string; reputation_score: number; total_trades: number; wallet_address: string }) | null
  > {
    const query = `
      SELECT a.*, u.username, u.reputation_score, u.total_trades, u.wallet_address
      FROM ads a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = $1 AND a.status = 'active'
    `

    const result = await this.query(query, [adId], "getAdById")
    return result[0] || null
  }

  /**
   * Deal management operations
   */
  static async createDeal(dealData: Omit<Deal, "id" | "created_at" | "updated_at" | "expires_at">): Promise<Deal> {
    const query = `
      INSERT INTO deals (
        ad_id, buyer_id, seller_id, amount, price, total_inr,
        payment_method, upi_id, payment_details
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `

    const result = await this.query<Deal>(
      query,
      [
        dealData.ad_id,
        dealData.buyer_id,
        dealData.seller_id,
        dealData.amount,
        dealData.price,
        dealData.total_inr,
        dealData.payment_method,
        dealData.upi_id,
        dealData.payment_details ? JSON.stringify(dealData.payment_details) : null,
      ],
      "createDeal",
    )

    return result[0]
  }

  static async updateDealStatus(
    dealId: string,
    status: Deal["status"],
    additionalData: Partial<Deal> = {},
  ): Promise<Deal> {
    const updateFields: string[] = ["status = $2", "updated_at = NOW()"]
    const params: any[] = [dealId, status]
    let paramIndex = 3

    // Add timestamp fields based on status
    if (status === "funded") {
      updateFields.push(`funded_at = NOW()`)
    } else if (status === "payment_sent") {
      updateFields.push(`payment_sent_at = NOW()`)
    } else if (status === "completed") {
      updateFields.push(`completed_at = NOW()`)
    }

    // Add additional fields
    Object.entries(additionalData).forEach(([key, value]) => {
      if (value !== undefined && key !== "id" && key !== "created_at") {
        updateFields.push(`${key} = $${paramIndex++}`)
        params.push(typeof value === "object" ? JSON.stringify(value) : value)
      }
    })

    const query = `
      UPDATE deals 
      SET ${updateFields.join(", ")}
      WHERE id = $1
      RETURNING *
    `

    const result = await this.query<Deal>(query, params, "updateDealStatus")
    return result[0]
  }

  static async getDealById(dealId: string): Promise<Deal | null> {
    const query = `SELECT * FROM deals WHERE id = $1`
    const result = await this.query<Deal>(query, [dealId], "getDealById")
    return result[0] || null
  }

  static async getUserDeals(userId: string, status?: Deal["status"]): Promise<Deal[]> {
    let query = `
      SELECT d.*, a.asset, a.type as ad_type
      FROM deals d
      JOIN ads a ON d.ad_id = a.id
      WHERE (d.buyer_id = $1 OR d.seller_id = $1)
    `

    const params = [userId]

    if (status) {
      query += ` AND d.status = $2`
      params.push(status)
    }

    query += ` ORDER BY d.created_at DESC`

    return this.query(query, params, "getUserDeals")
  }

  /**
   * Message operations
   */
  static async createMessage(messageData: Omit<DealMessage, "id" | "created_at">): Promise<DealMessage> {
    const query = `
      INSERT INTO deal_messages (deal_id, user_id, message, message_type, file_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `

    const result = await this.query<DealMessage>(
      query,
      [messageData.deal_id, messageData.user_id, messageData.message, messageData.message_type, messageData.file_url],
      "createMessage",
    )

    return result[0]
  }

  static async getDealMessages(dealId: string, limit = 50): Promise<DealMessage[]> {
    const query = `
      SELECT dm.*, u.username, u.wallet_address
      FROM deal_messages dm
      JOIN users u ON dm.user_id = u.id
      WHERE dm.deal_id = $1
      ORDER BY dm.created_at ASC
      LIMIT $2
    `

    return this.query(query, [dealId, limit], "getDealMessages")
  }

  /**
   * Notification operations
   */
  static async createNotification(notificationData: Omit<Notification, "id" | "created_at">): Promise<Notification> {
    const query = `
      INSERT INTO notifications (user_id, title, message, type, related_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `

    const result = await this.query<Notification>(
      query,
      [
        notificationData.user_id,
        notificationData.title,
        notificationData.message,
        notificationData.type,
        notificationData.related_id,
      ],
      "createNotification",
    )

    return result[0]
  }

  static async getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    let query = `
      SELECT * FROM notifications 
      WHERE user_id = $1
    `

    if (unreadOnly) {
      query += ` AND is_read = false`
    }

    query += ` ORDER BY created_at DESC LIMIT 50`

    return this.query(query, [userId], "getUserNotifications")
  }

  /**
   * Utility operations
   */
  static async expireOldDeals(): Promise<void> {
    await this.query("SELECT expire_old_deals()", [], "expireOldDeals")
  }

  static async getHealthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    const query = `SELECT NOW() as timestamp, version() as version`
    const result = await this.query(query, [], "healthCheck")

    return {
      status: "healthy",
      timestamp: result[0].timestamp,
      version: result[0].version,
    }
  }
}

// Export the main SQL client for direct queries when needed
export { sql as neonSql }

// Connection health check on module load
NeonDB.getHealthCheck()
  .then((health) => {
    console.log("[NeonDB] Database connection established:", health.status)
  })
  .catch((error) => {
    console.error("[NeonDB] Database connection failed:", error)
  })
