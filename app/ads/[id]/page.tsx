"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
// Remove: import { supabase } from "@/lib/supabase"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Shield, User, Clock, DollarSign } from "lucide-react"

interface Ad {
  id: string
  asset: string
  type: "buy" | "sell"
  amount: number
  price: number
  min_amount: number | null
  max_amount: number | null
  payment_method: string
  upi_id: string | null
  chain: string
  description: string | null
  users: {
    id: string
    username: string | null
    wallet_address: string
    reputation_score: number
    total_trades: number
  }
  created_at: string
}

export default function AdDetailPage() {
  const params = useParams()
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const [ad, setAd] = useState<Ad | null>(null)
  const [loading, setLoading] = useState(true)
  const [dealAmount, setDealAmount] = useState("")
  const [creatingDeal, setCreatingDeal] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchAd()
    }
  }, [params.id])

  const fetchAd = async () => {
    try {
      const response = await fetch(`/api/ads/${params.id}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch ad")
      }

      setAd(result.ad)
    } catch (error) {
      console.error("Error fetching ad:", error)
      toast({
        title: "Ad not found",
        description: "This ad may have been removed or is no longer active",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleStartDeal = async () => {
    if (!isConnected || !address || !ad) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to start a deal",
        variant: "destructive",
      })
      return
    }

    if (!dealAmount || Number.parseFloat(dealAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(dealAmount)
    if (ad.min_amount && amount < ad.min_amount) {
      toast({
        title: "Amount too low",
        description: `Minimum amount is ${ad.min_amount} ${ad.asset}`,
        variant: "destructive",
      })
      return
    }

    if (ad.max_amount && amount > ad.max_amount) {
      toast({
        title: "Amount too high",
        description: `Maximum amount is ${ad.max_amount} ${ad.asset}`,
        variant: "destructive",
      })
      return
    }

    setCreatingDeal(true)

    try {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adId: ad.id,
          buyerWallet: address,
          amount: amount,
          paymentMethod: ad.payment_method,
          upiId: ad.upi_id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create deal")
      }

      toast({
        title: "Deal created successfully!",
        description: "You can now proceed with the escrow contract",
      })

      // Redirect to deal page (you would implement this)
      // router.push(`/deals/${result.deal.id}`)
    } catch (error) {
      console.error("Error creating deal:", error)
      toast({
        title: "Error creating deal",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
    } finally {
      setCreatingDeal(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading ad details...</div>
      </div>
    )
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <h2 className="text-xl font-semibold mb-2">Ad Not Found</h2>
            <p className="text-gray-600">This ad may have been removed or is no longer active.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOwnAd = isConnected && address && ad.users.wallet_address.toLowerCase() === address.toLowerCase()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Ad Details */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={ad.type === "buy" ? "default" : "secondary"} className="text-lg px-3 py-1">
                        {ad.type.toUpperCase()}
                      </Badge>
                      <h1 className="text-3xl font-bold">{ad.asset}</h1>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Price per {ad.asset}</p>
                      <p className="text-2xl font-bold text-green-600">₹{ad.price.toLocaleString()}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Amount Details */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Available Amount</p>
                      <p className="text-lg font-semibold">
                        {ad.amount} {ad.asset}
                      </p>
                    </div>
                    {ad.min_amount && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Min Amount</p>
                        <p className="text-lg font-semibold">
                          {ad.min_amount} {ad.asset}
                        </p>
                      </div>
                    )}
                    {ad.max_amount && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Max Amount</p>
                        <p className="text-lg font-semibold">
                          {ad.max_amount} {ad.asset}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Payment Details */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Payment Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                        <p className="font-semibold">{ad.payment_method}</p>
                      </div>
                      {ad.upi_id && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">UPI ID</p>
                          <p className="font-semibold">{ad.upi_id}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Blockchain</p>
                        <p className="font-semibold">{ad.chain}</p>
                      </div>
                    </div>
                  </div>

                  {ad.description && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Description</h3>
                        <p className="text-gray-700">{ad.description}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Trader Info & Action */}
            <div className="space-y-6">
              {/* Trader Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Trader Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="font-semibold">{ad.users.username || "Anonymous"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Trades</p>
                    <p className="font-semibold">{ad.users.total_trades}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reputation Score</p>
                    <p className="font-semibold">{ad.users.reputation_score}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Wallet</p>
                    <p className="font-mono text-xs break-all">
                      {ad.users.wallet_address.slice(0, 6)}...{ad.users.wallet_address.slice(-4)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Action Card */}
              {!isOwnAd && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Start Secure Deal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isConnected ? (
                      <>
                        <div>
                          <Label htmlFor="dealAmount">Amount ({ad.asset})</Label>
                          <Input
                            id="dealAmount"
                            type="number"
                            step="0.00000001"
                            placeholder="Enter amount"
                            value={dealAmount}
                            onChange={(e) => setDealAmount(e.target.value)}
                          />
                          {dealAmount && (
                            <p className="text-sm text-gray-500 mt-1">
                              Total: ₹{(Number.parseFloat(dealAmount) * ad.price).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <Button onClick={handleStartDeal} className="w-full" disabled={creatingDeal}>
                          {creatingDeal
                            ? "Creating Deal..."
                            : ad.type === "sell"
                              ? "Buy with Escrow"
                              : "Sell with Escrow"}
                        </Button>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Your crypto will be secured in smart contract
                          </p>
                          <p className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            INR payment settled off-chain via {ad.payment_method}
                          </p>
                          <p className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            24-hour timeout for deal completion
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-4">Connect your wallet to start trading</p>
                        <ConnectButton />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {isOwnAd && (
                <Card>
                  <CardContent className="text-center p-6">
                    <p className="text-gray-600">This is your ad</p>
                    <Button variant="outline" className="mt-2 bg-transparent">
                      Edit Ad
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
