# SwapSathi - INR Se Crypto Tak

SwapSathi is a secure P2P crypto trading platform designed specifically for Indian users. It combines the best of Binance P2P and OLX-style marketplace functionality with on-chain escrow smart contracts for maximum security.

## 🚀 Features

- **Wallet-Based Authentication**: No email/password required - connect with MetaMask or WalletConnect
- **P2P Marketplace**: Post buy/sell ads at your own prices
- **Secure Escrow**: Smart contracts protect crypto during trades
- **INR Settlements**: Off-chain payments via UPI, IMPS, Bank Transfer
- **Multi-Chain Support**: BSC, Base, and Ethereum networks
- **Real-time Trading**: Instant deal creation and management

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Web3**: Wagmi, RainbowKit, Ethers.js
- **Backend**: Supabase (Database + Auth)
- **Smart Contracts**: Solidity, OpenZeppelin
- **Deployment**: Vercel (Frontend), Supabase (Backend)

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- WalletConnect Project ID
- MetaMask or compatible wallet

## 🔧 Installation & Setup

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/yourusername/swapsathi.git
cd swapsathi
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
# or
yarn install
\`\`\`

### 3. Environment Configuration

Copy the example environment file:

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

Fill in your environment variables:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Smart Contract Configuration  
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BSC_RPC_URL=https://bsc-dataseed.binance.org/
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org

# WalletConnect Project ID
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
\`\`\`

### 4. Supabase Setup

1. Create a new Supabase project
2. Run the SQL script from \`scripts/01-create-tables.sql\` in your Supabase SQL editor
3. Enable Row Level Security (RLS) policies
4. Get your project URL and anon key from Settings > API

### 5. Smart Contract Deployment

Deploy the escrow contract to BSC Testnet or Base:

\`\`\`bash
# Install Hardhat (if not already installed)
npm install --save-dev hardhat

# Compile contracts
npx hardhat compile

# Deploy to BSC Testnet
npx hardhat run scripts/deploy.js --network bsc-testnet

# Deploy to Base Goerli
npx hardhat run scripts/deploy.js --network base-goerli
\`\`\`

### 6. Run Development Server

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Database (Supabase)

1. Your Supabase project is already live
2. Ensure RLS policies are properly configured
3. Monitor usage in Supabase dashboard

### Smart Contracts

Deploy to mainnet when ready:

\`\`\`bash
# BSC Mainnet
npx hardhat run scripts/deploy.js --network bsc

# Base Mainnet  
npx hardhat run scripts/deploy.js --network base
\`\`\`

## 📖 How It Works

### For Buyers
1. Browse available sell ads
2. Click "Buy with Escrow" on desired ad
3. Smart contract locks seller's crypto
4. Send INR payment via UPI/Bank transfer
5. Confirm payment sent
6. Seller confirms INR received
7. Smart contract releases crypto to buyer

### For Sellers
1. Post a sell ad with your price
2. Wait for buyer to initiate deal
3. Smart contract locks your crypto
4. Receive INR payment notification
5. Verify payment in your account
6. Confirm payment received
7. Smart contract releases crypto to buyer

### Security Features
- **Escrow Protection**: Crypto locked in smart contract
- **Timeout Mechanism**: 24-hour deal expiration
- **Dispute Resolution**: Arbitrator can resolve conflicts
- **Reputation System**: Track user trading history
- **Emergency Refund**: Automatic refund for expired deals

## 🔐 Security Considerations

- Never share private keys or seed phrases
- Verify payment before confirming receipt
- Use the dispute mechanism if issues arise
- Start with small amounts for new traders
- Always double-check wallet addresses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Create an issue on GitHub
- Join our Telegram community
- Email: support@swapsathi.com

## 🗺 Roadmap

- [ ] Mobile app (React Native)
- [ ] More payment methods (PayTM, PhonePe)
- [ ] Advanced trading features
- [ ] Multi-language support
- [ ] API for third-party integrations
- [ ] Staking and yield farming

---

**Disclaimer**: This is experimental software. Use at your own risk. Always verify transactions and never trade more than you can afford to lose.
