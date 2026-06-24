CREATE UNIQUE INDEX IF NOT EXISTS idx_practitioner_reviews_booking_id_unique
ON practitioner_reviews(booking_id)
WHERE booking_id IS NOT NULL;
