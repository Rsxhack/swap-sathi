"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter } from "lucide-react"
import Link from "next/link"

interface Ad {
  id: string
  asset: string
  type: "buy" | "sell"
  amount: number
  price: number
  payment_method: string
  users: {
    username: string
    reputation_score: number
    total_trades: number
  }
  created_at: string
}

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    asset: "",
    type: "",
    search: "",
  })

  useEffect(() => {
    fetchAds()
  }, [filters])

  const fetchAds = async () => {
    setLoading(true)
    try {
      const ads = await fetch(
        `/api/ads?${new URLSearchParams({
          ...(filters.asset && { asset: filters.asset }),
          ...(filters.type && { type: filters.type }),
          ...(filters.search && { search: filters.search }),
        })}`,
      )

      const response = await ads.json()
      if (response.ads) {
        setAds(response.ads)
      }
    } catch (error) {
      console.error("Error fetching ads:", error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Browse Ads</h1>
          <Link href="/post-ad">
            <Button>Post New Ad</Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <Select value={filters.asset} onValueChange={(value) => setFilters({ ...filters, asset: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                  <SelectItem value="USDT">Tether (USDT)</SelectItem>
                  <SelectItem value="BNB">BNB</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Buy/Sell" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="buy">Buy Orders</SelectItem>
                  <SelectItem value="sell">Sell Orders</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchAds} variant="outline">
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ads Grid */}
        {loading ? (
          <div className="text-center py-8">Loading ads...</div>
        ) : (
          <div className="grid gap-6">
            {ads.map((ad) => (
              <Card key={ad.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant={ad.type === "buy" ? "default" : "secondary"}>{ad.type.toUpperCase()}</Badge>
                        <span className="text-2xl font-bold">{ad.asset}</span>
                        <span className="text-gray-500">{ad.users?.username || "Anonymous"}</span>
                        <Badge variant="outline">{ad.users?.total_trades || 0} trades</Badge>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Amount</p>
                          <p className="font-semibold">
                            {ad.amount} {ad.asset}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Price</p>
                          <p className="font-semibold">₹{ad.price.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Payment</p>
                          <p className="font-semibold">{ad.payment_method}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600 mb-2">
                        ₹{(ad.amount * ad.price).toLocaleString()}
                      </p>
                      <Link href={`/ads/${ad.id}`}>
                        <Button>{ad.type === "buy" ? "Sell to User" : "Buy from User"}</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {ads.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No ads found matching your criteria</p>
                <Link href="/post-ad">
                  <Button>Post the First Ad</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
