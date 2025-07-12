"use client"

import type React from "react"

import { useState } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { ConnectButton } from "@rainbow-me/rainbowkit"

export default function PostAdPage() {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    asset: "",
    type: "sell",
    amount: "",
    price: "",
    minAmount: "",
    maxAmount: "",
    paymentMethod: "",
    upiId: "",
    chain: "BSC",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to post an ad",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/ads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: address,
          asset: formData.asset,
          type: formData.type,
          amount: formData.amount,
          price: formData.price,
          minAmount: formData.minAmount,
          maxAmount: formData.maxAmount,
          paymentMethod: formData.paymentMethod,
          upiId: formData.upiId,
          chain: formData.chain,
          description: formData.description,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to post ad")
      }

      toast({
        title: "Ad posted successfully!",
        description: "Your ad is now live and visible to other traders",
      })

      // Reset form
      setFormData({
        asset: "",
        type: "sell",
        amount: "",
        price: "",
        minAmount: "",
        maxAmount: "",
        paymentMethod: "",
        upiId: "",
        chain: "BSC",
        description: "",
      })
    } catch (error) {
      console.error("Error posting ad:", error)
      toast({
        title: "Error posting ad",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Connect Wallet</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4 text-gray-600">Please connect your wallet to post an ad</p>
            <ConnectButton />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Post New Ad</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Ad Type */}
              <div>
                <Label>Ad Type</Label>
                <RadioGroup
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="buy" id="buy" />
                    <Label htmlFor="buy">I want to BUY crypto</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sell" id="sell" />
                    <Label htmlFor="sell">I want to SELL crypto</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Asset */}
              <div>
                <Label htmlFor="asset">Cryptocurrency</Label>
                <Select value={formData.asset} onValueChange={(value) => setFormData({ ...formData, asset: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cryptocurrency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    <SelectItem value="USDT">Tether (USDT)</SelectItem>
                    <SelectItem value="BNB">BNB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount and Price */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.00000001"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price per unit (INR)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Min/Max Amount */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minAmount">Min Amount (Optional)</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    step="0.00000001"
                    placeholder="0.00"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxAmount">Max Amount (Optional)</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    step="0.00000001"
                    placeholder="0.00"
                    value={formData.maxAmount}
                    onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="IMPS">IMPS</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="PayTM">PayTM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* UPI ID */}
              {formData.paymentMethod === "UPI" && (
                <div>
                  <Label htmlFor="upiId">UPI ID</Label>
                  <Input
                    id="upiId"
                    placeholder="yourname@upi"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  />
                </div>
              )}

              {/* Chain */}
              <div>
                <Label htmlFor="chain">Blockchain</Label>
                <Select value={formData.chain} onValueChange={(value) => setFormData({ ...formData, chain: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blockchain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BSC">Binance Smart Chain (BSC)</SelectItem>
                    <SelectItem value="Base">Base</SelectItem>
                    <SelectItem value="Ethereum">Ethereum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add any additional terms or conditions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Total Value Display */}
              {formData.amount && formData.price && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{(Number.parseFloat(formData.amount) * Number.parseFloat(formData.price)).toLocaleString()}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Posting Ad..." : "Post Ad"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
