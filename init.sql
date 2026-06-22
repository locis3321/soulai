-- SoulAI Database Initialization Script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    avatar_url TEXT,
    birth_date DATE,
    birth_time TIME,
    birth_place VARCHAR(255),
    language VARCHAR(10) DEFAULT 'en',
    subscription_tier VARCHAR(20) DEFAULT 'free',
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    zodiac_sign VARCHAR(50),
    rising_sign VARCHAR(50),
    moon_sign VARCHAR(50),
    life_path_number INTEGER,
    bazi_data JSONB,
    ziwei_data JSONB,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create mood_checkins table
CREATE TABLE IF NOT EXISTS mood_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mood VARCHAR(50) NOT NULL,
    note TEXT,
    energy_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create journals table
CREATE TABLE IF NOT EXISTS journals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    mood VARCHAR(50),
    tags TEXT[],
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tarot_readings table
CREATE TABLE IF NOT EXISTS tarot_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question TEXT,
    spread_type VARCHAR(50) NOT NULL,
    cards JSONB NOT NULL,
    reading_text TEXT,
    is_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create astrology_readings table
CREATE TABLE IF NOT EXISTS astrology_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reading_type VARCHAR(50) NOT NULL,
    birth_data JSONB NOT NULL,
    reading_text TEXT,
    chart_data JSONB,
    is_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    advisor_key VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id VARCHAR(255) UNIQUE,
    plan_id VARCHAR(50),
    period VARCHAR(20) DEFAULT 'monthly',
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CNY',
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    stripe_payment_id VARCHAR(255),
    provider_transaction_id VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    auto_renew BOOLEAN DEFAULT true,
    payment_id UUID REFERENCES payments(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_activity table for analytics
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_checkins_user_id ON mood_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_checkins_created_at ON mood_checkins(created_at);
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON journals(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_created_at ON journals(created_at);
CREATE INDEX IF NOT EXISTS idx_tarot_readings_user_id ON tarot_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_astrology_readings_user_id ON astrology_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);

-- Create community_posts table
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create community_comments table
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create community_likes table
CREATE TABLE IF NOT EXISTS community_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- Create community_bookmarks table
CREATE TABLE IF NOT EXISTS community_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- Create practitioners table
CREATE TABLE IF NOT EXISTS practitioners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    avatar TEXT,
    specialties TEXT[],
    rating DECIMAL(3,2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    experience_years INTEGER DEFAULT 0,
    location VARCHAR(255),
    price_per_session DECIMAL(10,2),
    bio TEXT,
    languages TEXT[],
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    practitioner_id UUID REFERENCES practitioners(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    consultation_mode VARCHAR(20) DEFAULT 'text',
    status VARCHAR(20) DEFAULT 'pending',
    payment_id UUID REFERENCES payments(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create practitioner_reviews table
CREATE TABLE IF NOT EXISTS practitioner_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practitioner_id UUID REFERENCES practitioners(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for community and marketplace
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_post_id ON community_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_bookmarks_user_id ON community_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_practitioner_id ON bookings(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_practitioner_reviews_practitioner_id ON practitioner_reviews(practitioner_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journals_updated_at
    BEFORE UPDATE ON journals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development
-- Note: sample users have no password_hash; register via POST /api/auth/register to create login-capable accounts
INSERT INTO users (id, email, name, birth_date, birth_time, birth_place, language) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'test@soulai.com', 'Test User', '1990-01-15', '14:30:00', 'Bangkok, Thailand', 'en'),
    ('550e8400-e29b-41d4-a716-446655440001', 'luna@soulai.com', 'Luna Seeker', '1988-06-20', '09:15:00', 'Ho Chi Minh City, Vietnam', 'vi'),
    ('550e8400-e29b-41d4-a716-446655440002', 'zen@soulai.com', 'Zen Master', '1995-03-10', '18:45:00', 'Chiang Mai, Thailand', 'th')
ON CONFLICT (id) DO NOTHING;

-- Insert sample user profiles
INSERT INTO user_profiles (user_id, zodiac_sign, rising_sign, moon_sign, life_path_number) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'Capricorn', 'Aries', 'Cancer', 7),
    ('550e8400-e29b-41d4-a716-446655440001', 'Gemini', 'Leo', 'Scorpio', 3),
    ('550e8400-e29b-41d4-a716-446655440002', 'Pisces', 'Virgo', 'Taurus', 9)
ON CONFLICT DO NOTHING;

-- Insert sample mood check-ins
INSERT INTO mood_checkins (user_id, mood, note, energy_score) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'calm', 'Feeling peaceful after meditation', 85),
    ('550e8400-e29b-41d4-a716-446655440000', 'happy', 'Great day at work', 92),
    ('550e8400-e29b-41d4-a716-446655440001', 'neutral', 'Regular day', 70),
    ('550e8400-e29b-41d4-a716-446655440002', 'calm', 'Deep breathing exercises helped', 88)
ON CONFLICT DO NOTHING;
