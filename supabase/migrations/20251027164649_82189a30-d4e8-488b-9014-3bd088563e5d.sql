-- Create wishlist_item_purchases table to track which items have been purchased
CREATE TABLE public.wishlist_item_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wishlist_id UUID NOT NULL,
  item_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  purchaser_user_id UUID,
  purchaser_name TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  order_id UUID,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_paid NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wishlist_item_purchases ENABLE ROW LEVEL SECURITY;

-- Anyone can view purchase records (for badges and gift tracker)
CREATE POLICY "Anyone can view purchase records"
ON public.wishlist_item_purchases
FOR SELECT
USING (true);

-- Authenticated users can create purchase records
CREATE POLICY "Authenticated users can create purchase records"
ON public.wishlist_item_purchases
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Purchasers can update their own purchase records
CREATE POLICY "Purchasers can update their own purchases"
ON public.wishlist_item_purchases
FOR UPDATE
USING (auth.uid() = purchaser_user_id);

-- Purchasers can delete their own purchase records
CREATE POLICY "Purchasers can delete their own purchases"
ON public.wishlist_item_purchases
FOR DELETE
USING (auth.uid() = purchaser_user_id);

-- Create indexes for performance
CREATE INDEX idx_wishlist_item_purchases_wishlist_id ON public.wishlist_item_purchases(wishlist_id);
CREATE INDEX idx_wishlist_item_purchases_product_id ON public.wishlist_item_purchases(product_id);
CREATE INDEX idx_wishlist_item_purchases_item_id ON public.wishlist_item_purchases(item_id);
CREATE INDEX idx_wishlist_item_purchases_purchaser ON public.wishlist_item_purchases(purchaser_user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_wishlist_purchase_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_wishlist_item_purchases_updated_at
BEFORE UPDATE ON public.wishlist_item_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_wishlist_purchase_updated_at();