/**
 * Authentication utilities for wallet-based login
 * Handles signature verification and session management
 */

import { ethers } from "ethers"

/**
 * Verify wallet signature for authentication
 */
export async function verifyWalletSignature(
  walletAddress: string,
  signature: string,
  message: string,
): Promise<boolean> {
  try {
    // Recover the address from the signature
    const recoveredAddress = ethers.verifyMessage(message, signature)

    // Compare addresses (case-insensitive)
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase()
  } catch (error) {
    console.error("Error verifying wallet signature:", error)
    return false
  }
}

/**
 * Generate authentication message for wallet signing
 */
export function generateAuthMessage(walletAddress: string, timestamp: number): string {
  return `SwapSathi Authentication

Wallet: ${walletAddress}
Timestamp: ${timestamp}
Nonce: ${Math.random().toString(36).substring(7)}

By signing this message, you agree to authenticate with SwapSathi.`
}

/**
 * Validate authentication timestamp (prevent replay attacks)
 */
export function isValidTimestamp(timestamp: number, maxAgeMinutes = 5): boolean {
  const now = Date.now()
  const maxAge = maxAgeMinutes * 60 * 1000 // Convert to milliseconds

  return Math.abs(now - timestamp) <= maxAge
}
