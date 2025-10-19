-- Add price_per_ton column to farms table
ALTER TABLE public.farms 
ADD COLUMN price_per_ton DECIMAL(10, 2) NOT NULL DEFAULT 10.00;

-- Add comment for clarity
COMMENT ON COLUMN public.farms.price_per_ton IS 'Price per ton of CO2 in HBAR';