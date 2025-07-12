export const ESCROW_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS || ""

export const ESCROW_ABI = [
  "function createDeal(address _seller, address _token, uint256 _amount, uint256 _inrAmount) external returns (uint256)",
  "function fundDeal(uint256 _dealId) external",
  "function confirmPaymentSent(uint256 _dealId) external",
  "function confirmPaymentReceived(uint256 _dealId) external",
  "function initiateDispute(uint256 _dealId) external payable",
  "function cancelDeal(uint256 _dealId) external",
  "function emergencyRefund(uint256 _dealId) external",
  "function getDeal(uint256 _dealId) external view returns (tuple(uint256 dealId, address buyer, address seller, address token, uint256 amount, uint256 inrAmount, uint8 status, uint256 createdAt, uint256 expiresAt, bool sellerConfirmed, bool buyerConfirmed))",
  "event DealCreated(uint256 indexed dealId, address indexed buyer, address indexed seller, address token, uint256 amount, uint256 inrAmount)",
  "event DealFunded(uint256 indexed dealId, address indexed buyer)",
  "event PaymentSent(uint256 indexed dealId, address indexed buyer)",
  "event PaymentConfirmed(uint256 indexed dealId, address indexed seller)",
  "event DealCompleted(uint256 indexed dealId)",
  "event DealDisputed(uint256 indexed dealId, address indexed initiator)",
  "event DealCancelled(uint256 indexed dealId)",
]

export const TOKEN_ADDRESSES = {
  BSC: {
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    BTC: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
    ETH: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    BNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  },
  Base: {
    USDT: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    BTC: "0x0000000000000000000000000000000000000000", // Placeholder
    ETH: "0x4200000000000000000000000000000000000006",
    BNB: "0x0000000000000000000000000000000000000000", // Placeholder
  },
}

export function getTokenAddress(chain: string, asset: string): string {
  const chainTokens = TOKEN_ADDRESSES[chain as keyof typeof TOKEN_ADDRESSES]
  if (!chainTokens) return ""
  return chainTokens[asset as keyof typeof chainTokens] || ""
}
