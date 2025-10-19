-- Create purchases table to track investor purchases
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  price_per_ton DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Investors can view their own purchases
CREATE POLICY "Investors can view their own purchases"
ON public.purchases
FOR SELECT
USING (auth.uid() = investor_id);

-- Investors can create purchases
CREATE POLICY "Investors can create purchases"
ON public.purchases
FOR INSERT
WITH CHECK (auth.uid() = investor_id AND has_role(auth.uid(), 'investor'));

-- Farmers can view purchases of their farms
CREATE POLICY "Farmers can view purchases of their farms"
ON public.purchases
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.farms
    WHERE farms.id = purchases.farm_id
    AND farms.user_id = auth.uid()
  )
);

-- Admins can view all purchases
CREATE POLICY "Admins can view all purchases"
ON public.purchases
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create index for better performance
CREATE INDEX idx_purchases_investor ON public.purchases(investor_id);
CREATE INDEX idx_purchases_farm ON public.purchases(farm_id);