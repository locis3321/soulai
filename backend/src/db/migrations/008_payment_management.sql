-- 008: Payment management — callback logs, refunds, failure reasons

-- Add failure reason and refund tracking to payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_status VARCHAR(20) DEFAULT 'none';

-- Payment callback logs (raw webhook payloads for dispute resolution)
CREATE TABLE IF NOT EXISTS payment_callback_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL,
    raw_body TEXT,
    result VARCHAR(20) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refunds table (tracks refund lifecycle: pending → completed/rejected)
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    admin_user_id UUID REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by UUID REFERENCES admin_users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_callback_logs_payment_id ON payment_callback_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_callback_logs_created_at ON payment_callback_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON refunds(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_refund_status ON payments(refund_status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON payments(payment_status);
