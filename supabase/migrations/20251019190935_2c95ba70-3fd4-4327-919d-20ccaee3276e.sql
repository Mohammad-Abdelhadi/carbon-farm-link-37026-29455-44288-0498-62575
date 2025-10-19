-- Fix the trigger to not interfere with role selection during registration
-- The trigger should only act as a fallback for external auth methods, not manual registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated trigger function that waits before inserting default role
-- This gives the registration process time to insert the selected role first
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Wait for the registration transaction to complete
  -- If a role was inserted during registration, this will find it
  -- Otherwise, insert the default 'farmer' role
  PERFORM pg_sleep(0.1); -- Small delay to let registration complete
  
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'farmer'::app_role);
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();