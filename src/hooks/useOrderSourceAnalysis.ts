import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OrderSourceAnalysis, AutoGiftExecution, ApprovalToken } from '@/types/orderSource';
import { ZincOrder } from '@/components/marketplace/zinc/types';
import { resolveOrderItemImage } from '@/services/orderImageResolutionService';

export const useOrderSourceAnalysis = (order: ZincOrder) => {
  const [analysis, setAnalysis] = useState<OrderSourceAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const analyzeOrderSource = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if this is an auto-gift order
        const { data: autoGiftExecution, error: executionError } = await supabase
          .from('automated_gift_executions')
          .select(`
            *,
            auto_gifting_rules!inner(
              recipient_id,
              gift_message
            )
          `)
          .eq('order_id', order.id)
          .single();

        if (executionError && executionError.code !== 'PGRST116') {
          console.error('Error fetching auto gift execution:', executionError);
        }

        if (autoGiftExecution) {
          // This is an auto-gift order
          const aiSource = autoGiftExecution.ai_agent_source as any;
          const isAIGenerated = aiSource?.agent === 'nicole';
          
          // Get approval information
          const { data: approvalToken } = await supabase
            .from('email_approval_tokens')
            .select('*')
            .eq('execution_id', autoGiftExecution.id)
            .single();

          // Get recipient information with privacy check
          let recipientInfo = undefined;
          if (autoGiftExecution.auto_gifting_rules?.recipient_id) {
            const { data: recipient } = await supabase
              .from('profiles')
              .select('id, name, first_name, last_name')
              .eq('id', autoGiftExecution.auto_gifting_rules.recipient_id)
              .single();

            if (recipient) {
              recipientInfo = {
                id: recipient.id,
                name: recipient.name || `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim() || 'Recipient',
                canShow: true // Could add privacy logic here
              };
            }
          }

          // Resolve product images for selected products
          let selectedProducts = undefined;
          if (autoGiftExecution.selected_products && Array.isArray(autoGiftExecution.selected_products)) {
            selectedProducts = await Promise.all(
              autoGiftExecution.selected_products.map(async (product: any) => {
                const imageResult = await resolveOrderItemImage(product);
                return {
                  productId: product.product_id || product.id,
                  name: product.product_name || product.name || 'Product',
                  image: imageResult.imageUrl,
                  price: Number(product.price || 0),
                  confidence: product.confidence || aiSource?.confidence_score
                };
              })
            );
          }

          const sourceAnalysis: OrderSourceAnalysis = {
            sourceType: isAIGenerated ? 'ai_auto_gift' : 'auto_gift',
            recipientInfo,
            aiAttribution: isAIGenerated ? {
              agent: 'nicole',
              confidence: aiSource?.confidence_score || 0,
              discoveryMethod: aiSource?.discovery_method || 'unknown'
            } : undefined,
            approvalInfo: approvalToken ? {
              status: approvalToken.approved_at ? 'manually_approved' : 'auto_approved',
              approvedAt: approvalToken.approved_at,
              approvedVia: approvalToken.approved_via
            } : {
              status: 'auto_approved'
            },
            selectedProducts,
            giftMessage: autoGiftExecution.auto_gifting_rules?.gift_message,
            executionId: autoGiftExecution.id
          };

          setAnalysis(sourceAnalysis);
        } else {
          // Check if this is a scheduled order
          const scheduledDate = (order as any).scheduled_delivery_date;
          
          if (scheduledDate) {
            setAnalysis({
              sourceType: 'scheduled',
              scheduledDate
            });
          } else {
            // Standard order
            setAnalysis({
              sourceType: 'standard'
            });
          }
        }
      } catch (err) {
        console.error('Error analyzing order source:', err);
        setError('Failed to analyze order source');
        // Fallback to standard order
        setAnalysis({
          sourceType: 'standard'
        });
      } finally {
        setLoading(false);
      }
    };

    if (order?.id) {
      analyzeOrderSource();
    }
  }, [order?.id]);

  return { analysis, loading, error };
};