-- Phase 3.5a: Add 'shopper' to the app_role enum
-- Must be done in a separate transaction from usage

ALTER TYPE public.app_role ADD VALUE 'shopper';