-- Drop the old trigger that was causing race conditions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function to read role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from user metadata, default to 'farmer' if not specified
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'farmer'::app_role
  );
  
  -- Insert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create NFT levels table for farmers
CREATE TABLE IF NOT EXISTS public.nft_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level integer NOT NULL UNIQUE,
  investors_required integer NOT NULL,
  rarity text NOT NULL,
  image_url text,
  benefits text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create farmer NFTs table
CREATE TABLE IF NOT EXISTS public.farmer_nfts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nft_level_id uuid REFERENCES public.nft_levels(id) NOT NULL,
  token_id text,
  minted_at timestamp with time zone DEFAULT now(),
  investor_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, nft_level_id)
);

-- Enable RLS on NFT tables
ALTER TABLE public.nft_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_nfts ENABLE ROW LEVEL SECURITY;

-- RLS policies for nft_levels (everyone can view)
CREATE POLICY "Anyone can view NFT levels"
ON public.nft_levels FOR SELECT
USING (true);

-- RLS policies for farmer_nfts
CREATE POLICY "Users can view their own NFTs"
ON public.farmer_nfts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Farmers can insert their own NFTs"
ON public.farmer_nfts FOR INSERT
WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'farmer'::app_role));

CREATE POLICY "Admins can view all NFTs"
ON public.farmer_nfts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert the 3 NFT levels
INSERT INTO public.nft_levels (name, level, investors_required, rarity, benefits) VALUES
('Bronze Farmer Badge', 1, 3, 'Common', 'Access to basic analytics and 5% bonus on carbon credits'),
('Silver Farmer Badge', 2, 6, 'Rare', 'Priority support, 10% bonus on carbon credits, and early access to new features'),
('Gold Farmer Badge', 3, 10, 'Legendary', 'VIP support, 15% bonus on carbon credits, exclusive marketplace features, and premium analytics')
ON CONFLICT DO NOTHING;