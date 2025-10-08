
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PricingSetting {
  id: string;
  setting_name: string;
  markup_percentage: number;
  zinc_per_order_fee?: number;
  fee_display_name: string;
  fee_description: string | null;
  is_active: boolean;
  applies_to: string;
  created_at: string;
  updated_at: string;
}

export const usePricingSettings = () => {
  const [settings, setSettings] = useState<PricingSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching pricing settings:', error);
      toast.error('Failed to load pricing settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (id: string, updates: Partial<PricingSetting>) => {
    try {
      const { error } = await supabase
        .from('pricing_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      await fetchSettings();
      toast.success('Pricing settings updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating pricing settings:', error);
      toast.error('Failed to update pricing settings');
      return false;
    }
  };

  const getDefaultGiftingFee = () => {
    return settings.find(s => s.setting_name === 'default_gifting_fee' && s.is_active);
  };

  const calculatePriceBreakdown = (basePrice: number, shippingCost: number = 0) => {
    const defaultFee = getDefaultGiftingFee();
    const markupPercentage = defaultFee?.markup_percentage || 10;
    const zincFee = defaultFee?.zinc_per_order_fee || 1.00;
    
    // Combined fee: percentage markup + Zinc fulfillment fee
    const giftingFee = (basePrice * markupPercentage) / 100 + zincFee;
    
    return {
      basePrice,
      shippingCost,
      giftingFee,
      giftingFeeName: defaultFee?.fee_display_name || 'Elyphant Gifting Fee',
      giftingFeeDescription: defaultFee?.fee_description || '',
      total: basePrice + shippingCost + giftingFee
    };
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    updateSetting,
    getDefaultGiftingFee,
    calculatePriceBreakdown,
    refetch: fetchSettings
  };
};
