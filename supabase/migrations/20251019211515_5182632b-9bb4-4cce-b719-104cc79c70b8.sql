-- Add wallet_address to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN wallet_address text;

-- Add index for faster lookups
CREATE INDEX idx_user_roles_wallet ON public.user_roles(wallet_address);

-- Update RLS policy to allow users to update their wallet address
CREATE POLICY "Users can update their wallet address"
ON public.user_roles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);