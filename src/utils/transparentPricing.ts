
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

    const markupPercentage = settings?.markup_percentage || 15;
    const giftingFee = (basePrice * markupPercentage) / 100;

    return {
      basePrice,
      displayPrice: basePrice, // Show base price on marketplace, fees at checkout
      giftingFee,
      giftingFeeName: settings?.fee_display_name || 'Gifting Fee',
      giftingFeeDescription: settings?.fee_description || 'Platform service fee',
      total: basePrice + giftingFee
    };
  } catch (error) {
    console.error('Error fetching pricing settings:', error);
    
    // Fallback to default 15% markup
    const giftingFee = (basePrice * 15) / 100;
    return {
      basePrice,
      displayPrice: basePrice,
      giftingFee,
      giftingFeeName: 'Gifting Fee',
      giftingFeeDescription: 'Platform service fee',
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
