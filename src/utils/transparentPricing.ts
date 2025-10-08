
import { supabase } from "@/integrations/supabase/client";

export interface PriceBreakdown {
  basePrice: number;
  displayPrice: number; // What customers see on product tiles (base price for now)
  giftingFee: number;
  giftingFeeName: string;
  giftingFeeDescription: string;
  total: number;
}

export const getTransparentPricing = async (basePrice: number): Promise<PriceBreakdown> => {
  try {
    const { data: settings } = await supabase
      .from('pricing_settings')
      .select('*')
      .eq('setting_name', 'default_gifting_fee')
      .eq('is_active', true)
      .single();

    const markupPercentage = settings?.markup_percentage || 10;
    const zincFee = settings?.zinc_per_order_fee || 1.00;
    
    // Combined fee: percentage markup + Zinc fulfillment fee
    const giftingFee = (basePrice * markupPercentage) / 100 + zincFee;

    return {
      basePrice,
      displayPrice: basePrice, // Show base price on marketplace, fees at checkout
      giftingFee,
      giftingFeeName: settings?.fee_display_name || 'Elyphant Gifting Fee',
      giftingFeeDescription: settings?.fee_description || 'Our Gifting Fee covers platform technology, fulfillment services, customer support, gift tracking, and curated shopping experience',
      total: basePrice + giftingFee
    };
  } catch (error) {
    console.error('Error fetching pricing settings:', error);
    
    // Fallback: 10% markup + $1.00 Zinc fee
    const giftingFee = (basePrice * 10) / 100 + 1.00;
    return {
      basePrice,
      displayPrice: basePrice,
      giftingFee,
      giftingFeeName: 'Elyphant Gifting Fee',
      giftingFeeDescription: 'Our Gifting Fee covers platform technology, fulfillment services, customer support, gift tracking, and curated shopping experience',
      total: basePrice + giftingFee
    };
  }
};

export const formatPriceBreakdown = (breakdown: PriceBreakdown, shippingCost: number = 0) => {
  return {
    basePrice: breakdown.basePrice,
    shippingCost,
    giftingFee: breakdown.giftingFee,
    giftingFeeName: breakdown.giftingFeeName,
    giftingFeeDescription: breakdown.giftingFeeDescription,
    grandTotal: breakdown.basePrice + breakdown.giftingFee + shippingCost
  };
};
