/**
 * Vercel Postgres Database Integration for SwapSathi
 *
 * This module provides a comprehensive database layer using Vercel's integrated PostgreSQL.
 * It includes connection management, query helpers, and type-safe database operations.
 *
 * Key Features:
 * - Automatic connection pooling via Vercel
 * - Type-safe query builders
 * - Transaction support
 * - Error handling and logging
 * - Built-in security features
 */

import { sql } from "@vercel/postgres"

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
export class SwapSathiDB {
  /**
   * Execute a query with automatic error handling and logging
   */
  static async query<T = any>(query: string, params: any[] = [], operation = "query"): Promise<T[]> {
    try {
      console.log(`[SwapSathiDB] Executing ${operation}:`, query.substring(0, 100) + "...")
      const startTime = Date.now()

      // Use Vercel Postgres with parameterized queries
      const result = await sql.query(query, params)

      const duration = Date.now() - startTime
      console.log(`[SwapSathiDB] ${operation} completed in ${duration}ms`)

      return result.rows as T[]
    } catch (error) {
      console.error(`[SwapSathiDB] Error in ${operation}:`, error)
      console.error(`[SwapSathiDB] Query:`, query)
      console.error(`[SwapSathiDB] Params:`, params)
      throw new Error(`Database ${operation} failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Initialize database tables if they don't exist
   */
  static async initializeTables(): Promise<void> {
    try {
      console.log("[SwapSathiDB] Initializing database tables...")

      // Create users table
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          wallet_address TEXT UNIQUE NOT NULL,
          username TEXT,
          email TEXT,
          reputation_score INTEGER DEFAULT 0,
          total_trades INTEGER DEFAULT 0,
          successful_trades INTEGER DEFAULT 0,
          is_verified BOOLEAN DEFAULT FALSE,
          kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `

      // Create ads table
      await sql`
        CREATE TABLE IF NOT EXISTS ads (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          asset TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
          amount DECIMAL(18, 8) NOT NULL CHECK (amount > 0),
          price DECIMAL(12, 2) NOT NULL CHECK (price > 0),
          min_amount DECIMAL(18, 8) CHECK (min_amount > 0),
          max_amount DECIMAL(18, 8) CHECK (max_amount >= min_amount),
          payment_method TEXT NOT NULL,
          upi_id TEXT,
          bank_details JSONB,
          chain TEXT NOT NULL DEFAULT 'BSC',
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
          description TEXT,
          terms_conditions TEXT,
          auto_reply_message TEXT,
          response_time_minutes INTEGER DEFAULT 30,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE
        )
      `

      // Create deals table
      await sql`
        CREATE TABLE IF NOT EXISTS deals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
          buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
          seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
          amount DECIMAL(18, 8) NOT NULL CHECK (amount > 0),
          price DECIMAL(12, 2) NOT NULL CHECK (price > 0),
          total_inr DECIMAL(12, 2) NOT NULL CHECK (total_inr > 0),
          escrow_contract_address TEXT,
          transaction_hash TEXT,
          deal_id_on_chain INTEGER,
          status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'funded', 'payment_sent', 'completed', 'disputed', 'cancelled', 'expired')),
          payment_method TEXT NOT NULL,
          payment_details JSONB,
          upi_id TEXT,
          dispute_reason TEXT,
          arbitrator_decision TEXT,
          buyer_rating INTEGER CHECK (buyer_rating >= 1 AND buyer_rating <= 5),
          seller_rating INTEGER CHECK (seller_rating >= 1 AND seller_rating <= 5),
          buyer_feedback TEXT,
          seller_feedback TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          funded_at TIMESTAMP WITH TIME ZONE,
          payment_sent_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
        )
      `

      // Create deal messages table
      await sql`
        CREATE TABLE IF NOT EXISTS deal_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
          file_url TEXT,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `

      // Create notifications table
      await sql`
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('deal', 'payment', 'dispute', 'system', 'security')),
          related_id UUID,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `

      // Create indexes for better performance
      await sql`CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address)`
      await sql`CREATE INDEX IF NOT EXISTS idx_ads_asset_type ON ads(asset, type)`
      await sql`CREATE INDEX IF NOT EXISTS idx_ads_status_created ON ads(status, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status)`
      await sql`CREATE INDEX IF NOT EXISTS idx_deals_buyer_seller ON deals(buyer_id, seller_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_deal_messages_deal_id ON deal_messages(deal_id, created_at)`
      await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC)`

      console.log("[SwapSathiDB] Database tables initialized successfully")
    } catch (error) {
      console.error("[SwapSathiDB] Error initializing tables:", error)
      throw error
    }
  }

  /**
   * User management operations
   */
  static async createOrUpdateUser(walletAddress: string, userData: Partial<User> = {}): Promise<User> {
    const result = await sql`
      INSERT INTO users (wallet_address, username, email, updated_at, last_active)
      VALUES (${walletAddress.toLowerCase()}, ${userData.username || null}, ${userData.email || null}, NOW(), NOW())
      ON CONFLICT (wallet_address) 
      DO UPDATE SET 
        username = COALESCE(${userData.username || null}, users.username),
        email = COALESCE(${userData.email || null}, users.email),
        updated_at = NOW(),
        last_active = NOW()
      RETURNING *
    `

    return result.rows[0] as User
  }

  static async getUserByWallet(walletAddress: string): Promise<User | null> {
    const result = await sql`SELECT * FROM users WHERE wallet_address = ${walletAddress.toLowerCase()}`
    return (result.rows[0] as User) || null
  }

  static async updateUserReputation(userId: string): Promise<number> {
    // Calculate reputation based on completed deals and ratings
    const result = await sql`
      WITH reputation_calc AS (
        SELECT 
          COUNT(*) as total_completed_deals,
          COUNT(CASE WHEN 
            (buyer_id = ${userId} AND seller_rating >= 4) OR 
            (seller_id = ${userId} AND buyer_rating >= 4) 
          THEN 1 END) as positive_ratings
        FROM deals 
        WHERE (buyer_id = ${userId} OR seller_id = ${userId}) 
        AND status = 'completed'
      )
      UPDATE users 
      SET 
        reputation_score = CASE 
          WHEN (SELECT total_completed_deals FROM reputation_calc) = 0 THEN 0
          ELSE ROUND((SELECT positive_ratings FROM reputation_calc)::DECIMAL / (SELECT total_completed_deals FROM reputation_calc) * 100)
        END,
        total_trades = (SELECT total_completed_deals FROM reputation_calc),
        successful_trades = (SELECT positive_ratings FROM reputation_calc)
      WHERE id = ${userId}
      RETURNING reputation_score
    `

    return result.rows[0]?.reputation_score || 0
  }

  /**
   * Ad management operations
   */
  static async createAd(adData: Omit<Ad, "id" | "created_at" | "updated_at">): Promise<Ad> {
    const result = await sql`
      INSERT INTO ads (
        user_id, asset, type, amount, price, min_amount, max_amount,
        payment_method, upi_id, bank_details, chain, description,
        terms_conditions, auto_reply_message, response_time_minutes
      )
      VALUES (
        ${adData.user_id}, ${adData.asset}, ${adData.type}, ${adData.amount}, ${adData.price},
        ${adData.min_amount || null}, ${adData.max_amount || null}, ${adData.payment_method},
        ${adData.upi_id || null}, ${adData.bank_details ? JSON.stringify(adData.bank_details) : null},
        ${adData.chain}, ${adData.description || null}, ${adData.terms_conditions || null},
        ${adData.auto_reply_message || null}, ${adData.response_time_minutes}
      )
      RETURNING *
    `

    return result.rows[0] as Ad
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
    const result = await sql`
      SELECT a.*, u.username, u.reputation_score, u.total_trades, u.wallet_address
      FROM ads a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ${adId} AND a.status = 'active'
    `

    return result.rows[0] || null
  }

  /**
   * Deal management operations
   */
  static async createDeal(dealData: Omit<Deal, "id" | "created_at" | "updated_at" | "expires_at">): Promise<Deal> {
    const result = await sql`
      INSERT INTO deals (
        ad_id, buyer_id, seller_id, amount, price, total_inr,
        payment_method, upi_id, payment_details
      )
      VALUES (
        ${dealData.ad_id}, ${dealData.buyer_id}, ${dealData.seller_id}, ${dealData.amount},
        ${dealData.price}, ${dealData.total_inr}, ${dealData.payment_method},
        ${dealData.upi_id || null}, ${dealData.payment_details ? JSON.stringify(dealData.payment_details) : null}
      )
      RETURNING *
    `

    return result.rows[0] as Deal
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
    const result = await sql`SELECT * FROM deals WHERE id = ${dealId}`
    return (result.rows[0] as Deal) || null
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
    const result = await sql`
      INSERT INTO deal_messages (deal_id, user_id, message, message_type, file_url)
      VALUES (${messageData.deal_id}, ${messageData.user_id}, ${messageData.message}, 
              ${messageData.message_type || "text"}, ${messageData.file_url || null})
      RETURNING *
    `

    return result.rows[0] as DealMessage
  }

  static async getDealMessages(dealId: string, limit = 50): Promise<DealMessage[]> {
    const result = await sql`
      SELECT dm.*, u.username, u.wallet_address
      FROM deal_messages dm
      JOIN users u ON dm.user_id = u.id
      WHERE dm.deal_id = ${dealId}
      ORDER BY dm.created_at ASC
      LIMIT ${limit}
    `

    return result.rows as DealMessage[]
  }

  /**
   * Notification operations
   */
  static async createNotification(notificationData: Omit<Notification, "id" | "created_at">): Promise<Notification> {
    const result = await sql`
      INSERT INTO notifications (user_id, title, message, type, related_id)
      VALUES (${notificationData.user_id}, ${notificationData.title}, ${notificationData.message},
              ${notificationData.type}, ${notificationData.related_id || null})
      RETURNING *
    `

    return result.rows[0] as Notification
  }

  static async getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    if (unreadOnly) {
      const result = await sql`
        SELECT * FROM notifications 
        WHERE user_id = ${userId} AND is_read = false
        ORDER BY created_at DESC 
        LIMIT 50
      `
      return result.rows as Notification[]
    } else {
      const result = await sql`
        SELECT * FROM notifications 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC 
        LIMIT 50
      `
      return result.rows as Notification[]
    }
  }

  /**
   * Utility operations
   */
  static async expireOldDeals(): Promise<void> {
    await sql`
      UPDATE deals 
      SET status = 'expired'
      WHERE status IN ('initiated', 'funded', 'payment_sent')
      AND expires_at < NOW()
    `
  }

  static async getHealthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    const result = await sql`SELECT NOW() as timestamp, version() as version`

    return {
      status: "healthy",
      timestamp: result.rows[0].timestamp,
      version: result.rows[0].version,
    }
  }
}

// Initialize database tables on module load
SwapSathiDB.initializeTables()
  .then(() => {
    console.log("[SwapSathiDB] Database initialized successfully")
  })
  .catch((error) => {
    console.error("[SwapSathiDB] Database initialization failed:", error)
  })

// Export the main SQL client for direct queries when needed
export { sql }
