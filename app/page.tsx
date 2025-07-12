import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { ArrowRight, Shield, Zap, Users } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SS</span>
            </div>
            <span className="text-xl font-bold text-gray-900">SwapSathi</span>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          SwapSathi
          <span className="block text-3xl text-blue-600 mt-2">INR Se Crypto Tak</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          India's most secure P2P crypto trading platform. Trade directly with other users, settle payments via UPI, and
          enjoy on-chain escrow protection.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/ads">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Browse Ads <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/post-ad">
            <Button size="lg" variant="outline">
              Post Your Ad
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure Escrow</h3>
              <p className="text-gray-600">Smart contracts protect your crypto until payment is confirmed</p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Instant UPI</h3>
              <p className="text-gray-600">Fast INR settlements via UPI, IMPS, and bank transfers</p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">P2P Trading</h3>
              <p className="text-gray-600">Set your own prices and trade directly with other users</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
          <p className="text-xl mb-8 opacity-90">Connect your wallet and join thousands of traders on SwapSathi</p>
          <ConnectButton />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 SwapSathi. Built for the Indian crypto community.</p>
        </div>
      </footer>
    </div>
  )
}
