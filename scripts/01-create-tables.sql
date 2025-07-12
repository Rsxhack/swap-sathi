-- SwapSathi Database Schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (wallet-based authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT,
    reputation_score INTEGER DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ads table
CREATE TABLE ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    asset TEXT NOT NULL, -- BTC, ETH, USDT, etc.
    type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
    amount DECIMAL(18, 8) NOT NULL,
    price DECIMAL(10, 2) NOT NULL, -- INR price
    min_amount DECIMAL(18, 8),
    max_amount DECIMAL(18, 8),
    payment_method TEXT NOT NULL, -- UPI, Bank Transfer, etc.
    upi_id TEXT,
    chain TEXT NOT NULL, -- BSC, Base, etc.
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deals table (escrow transactions)
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(18, 8) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total_inr DECIMAL(10, 2) NOT NULL,
    escrow_contract_address TEXT,
    transaction_hash TEXT,
    status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'funded', 'payment_sent', 'completed', 'disputed', 'cancelled')),
    payment_method TEXT NOT NULL,
    upi_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deal messages table (chat between buyer/seller)
CREATE TABLE deal_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_ads_asset ON ads(asset);
CREATE INDEX idx_ads_type ON ads(type);
CREATE INDEX idx_ads_status ON ads(status);
CREATE INDEX idx_ads_created_at ON ads(created_at DESC);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_users_wallet_address ON users(wallet_address);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Anyone can view active ads" ON ads FOR SELECT USING (status = 'active');
CREATE POLICY "Users can manage own ads" ON ads FOR ALL USING (user_id IN (SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'));

CREATE POLICY "Deal participants can view deals" ON deals FOR SELECT USING (
    buyer_id IN (SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address') OR
    seller_id IN (SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address')
);

CREATE POLICY "Deal participants can view messages" ON deal_messages FOR SELECT USING (
    deal_id IN (
        SELECT id FROM deals WHERE 
        buyer_id IN (SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address') OR
        seller_id IN (SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address')
    )
);
