-- 012: Booking payment tracking + review IP tracking + anomaly support

-- Add payment tracking to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Add IP tracking to practitioner_reviews for anomaly detection
ALTER TABLE practitioner_reviews ADD COLUMN IF NOT EXISTS user_ip VARCHAR(45);

-- Review anomaly flags (for system-detected issues)
ALTER TABLE practitioner_reviews ADD COLUMN IF NOT EXISTS is_anomaly BOOLEAN DEFAULT false;
ALTER TABLE practitioner_reviews ADD COLUMN IF NOT EXISTS anomaly_reason TEXT;

-- Indexes for anomaly queries
CREATE INDEX IF NOT EXISTS idx_reviews_user_id_created ON practitioner_reviews(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON practitioner_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
