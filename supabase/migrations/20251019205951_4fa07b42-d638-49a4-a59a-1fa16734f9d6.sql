-- Add transaction tracking to purchases table
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS hedera_transaction_id TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed'));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_purchases_investor_id ON purchases(investor_id);
CREATE INDEX IF NOT EXISTS idx_purchases_farm_id ON purchases(farm_id);

-- Enable realtime for purchases
ALTER PUBLICATION supabase_realtime ADD TABLE purchases;