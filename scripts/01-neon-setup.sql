-- SwapSathi Neon Database Schema
-- This script sets up the complete database schema for Neon PostgreSQL

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing and security functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (wallet-based authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
);

-- Ads table for buy/sell listings
CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    asset TEXT NOT NULL, -- BTC, ETH, USDT, etc.
    type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
    amount DECIMAL(18, 8) NOT NULL CHECK (amount > 0),
    price DECIMAL(12, 2) NOT NULL CHECK (price > 0), -- INR price
    min_amount DECIMAL(18, 8) CHECK (min_amount > 0),
    max_amount DECIMAL(18, 8) CHECK (max_amount >= min_amount),
    payment_method TEXT NOT NULL,
    upi_id TEXT,
    bank_details JSONB, -- Store bank account details securely
    chain TEXT NOT NULL DEFAULT 'BSC',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    description TEXT,
    terms_conditions TEXT,
    auto_reply_message TEXT,
    response_time_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Deals table (escrow transactions)
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    payment_details JSONB, -- Store payment proof, UPI transaction ID, etc.
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
);

-- Deal messages table (chat between buyer/seller)
CREATE TABLE IF NOT EXISTS deal_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    file_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment methods table for user preferences
CREATE TABLE IF NOT EXISTS user_payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    method_type TEXT NOT NULL CHECK (method_type IN ('UPI', 'Bank Transfer', 'IMPS', 'PayTM', 'PhonePe')),
    method_details JSONB NOT NULL, -- Store UPI ID, bank details, etc.
    is_verified BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dispute resolution table
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    initiated_by UUID REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT,
    evidence_urls TEXT[], -- Array of evidence file URLs
    arbitrator_id UUID REFERENCES users(id),
    resolution TEXT,
    resolved_in_favor_of UUID REFERENCES users(id),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- User sessions for tracking active connections
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    wallet_signature TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification system
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deal', 'payment', 'dispute', 'system', 'security')),
    related_id UUID, -- Can reference deal_id, dispute_id, etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_reputation ON users(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_ads_asset_type ON ads(asset, type);
CREATE INDEX IF NOT EXISTS idx_ads_status_created ON ads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_buyer_seller ON deals(buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_messages_deal_id ON deal_messages(deal_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status, created_at DESC);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_ads_search ON ads(asset, type, status, price);
CREATE INDEX IF NOT EXISTS idx_deals_user_status ON deals(buyer_id, seller_id, status);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON user_payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate user reputation
CREATE OR REPLACE FUNCTION calculate_user_reputation(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_completed_deals INTEGER;
    positive_ratings INTEGER;
    reputation INTEGER;
BEGIN
    -- Count total completed deals
    SELECT COUNT(*) INTO total_completed_deals
    FROM deals 
    WHERE (buyer_id = user_uuid OR seller_id = user_uuid) 
    AND status = 'completed';
    
    -- Count positive ratings (4-5 stars)
    SELECT COUNT(*) INTO positive_ratings
    FROM deals 
    WHERE ((buyer_id = user_uuid AND seller_rating >= 4) 
           OR (seller_id = user_uuid AND buyer_rating >= 4))
    AND status = 'completed';
    
    -- Calculate reputation score (0-100)
    IF total_completed_deals = 0 THEN
        reputation := 0;
    ELSE
        reputation := ROUND((positive_ratings::DECIMAL / total_completed_deals) * 100);
    END IF;
    
    -- Update user reputation
    UPDATE users 
    SET reputation_score = reputation,
        total_trades = total_completed_deals,
        successful_trades = positive_ratings
    WHERE id = user_uuid;
    
    RETURN reputation;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically expire deals
CREATE OR REPLACE FUNCTION expire_old_deals()
RETURNS void AS $$
BEGIN
    UPDATE deals 
    SET status = 'expired'
    WHERE status IN ('initiated', 'funded', 'payment_sent')
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a view for active ads with user information
CREATE OR REPLACE VIEW active_ads_with_users AS
SELECT 
    a.*,
    u.username,
    u.reputation_score,
    u.total_trades,
    u.wallet_address,
    (a.amount * a.price) as total_value
FROM ads a
JOIN users u ON a.user_id = u.id
WHERE a.status = 'active'
ORDER BY a.created_at DESC;

-- Create a view for deal statistics
CREATE OR REPLACE VIEW deal_statistics AS
SELECT 
    u.id as user_id,
    u.username,
    u.wallet_address,
    COUNT(d.id) as total_deals,
    COUNT(CASE WHEN d.status = 'completed' THEN 1 END) as completed_deals,
    COUNT(CASE WHEN d.status = 'disputed' THEN 1 END) as disputed_deals,
    AVG(CASE WHEN d.buyer_id = u.id THEN d.seller_rating END) as avg_rating_as_buyer,
    AVG(CASE WHEN d.seller_id = u.id THEN d.buyer_rating END) as avg_rating_as_seller,
    SUM(CASE WHEN d.status = 'completed' THEN d.total_inr ELSE 0 END) as total_volume_inr
FROM users u
LEFT JOIN deals d ON (u.id = d.buyer_id OR u.id = d.seller_id)
GROUP BY u.id, u.username, u.wallet_address;

-- Insert sample data for testing (optional)
-- Uncomment the following lines for development/testing

/*
-- Sample users
INSERT INTO users (wallet_address, username, reputation_score, total_trades) VALUES
('0x742d35cc6634c0532925a3b8d4c9db96590c6c8c', 'CryptoTrader1', 85, 25),
('0x8ba1f109551bd432803012645hac136c30c6213c', 'BTCMaster', 92, 45),
('0x1234567890123456789012345678901234567890', 'EthereumFan', 78, 15);

-- Sample ads
INSERT INTO ads (user_id, asset, type, amount, price, payment_method, upi_id, chain) VALUES
((SELECT id FROM users WHERE username = 'CryptoTrader1'), 'BTC', 'sell', 0.1, 4500000, 'UPI', 'trader1@upi', 'BSC'),
((SELECT id FROM users WHERE username = 'BTCMaster'), 'ETH', 'buy', 2.5, 180000, 'Bank Transfer', NULL, 'Base'),
((SELECT id FROM users WHERE username = 'EthereumFan'), 'USDT', 'sell', 1000, 84, 'UPI', 'ethfan@paytm', 'BSC');
*/

-- Grant necessary permissions (adjust based on your user setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;

COMMENT ON TABLE users IS 'User accounts with wallet-based authentication';
COMMENT ON TABLE ads IS 'Buy/sell advertisements posted by users';
COMMENT ON TABLE deals IS 'Active trading deals with escrow protection';
COMMENT ON TABLE deal_messages IS 'Chat messages between deal participants';
COMMENT ON TABLE user_payment_methods IS 'User payment method preferences';
COMMENT ON TABLE disputes IS 'Dispute resolution system';
COMMENT ON TABLE notifications IS 'User notification system';
COMMENT ON FUNCTION calculate_user_reputation(UUID) IS 'Calculates and updates user reputation based on completed deals';
COMMENT ON FUNCTION expire_old_deals() IS 'Automatically expires deals that have exceeded their timeout';
