-- Phase 1: Enhanced Data Utilization - Expand Gift Preferences Structure
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS enhanced_gift_preferences jsonb DEFAULT '{
  "disliked_categories": [],
  "preferred_price_ranges": {
    "birthday": {"min": 25, "max": 100},
    "anniversary": {"min": 50, "max": 200},
    "holiday": {"min": 20, "max": 150},
    "graduation": {"min": 30, "max": 300}
  },
  "gift_timing_preferences": {
    "delivery_preference": "on_time",
    "advance_notice_days": 3
  },
  "brand_preferences": [],
  "brand_dislikes": [],
  "occasion_preferences": {},
  "relationship_budget_modifiers": {
    "family": 1.5,
    "close_friend": 1.2,
    "friend": 1.0,
    "colleague": 0.8,
    "acquaintance": 0.6
  }
}'::jsonb;

-- Enhanced AI Interaction Data Learning
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS enhanced_ai_interaction_data jsonb DEFAULT '{
  "suggestion_success_rate": 0,
  "successful_suggestions": [],
  "unsuccessful_suggestions": [],
  "search_patterns": [],
  "conversation_preferences": {
    "preferred_flow": "detailed",
    "typical_session_length": "medium",
    "preferred_interaction_style": "conversational"
  },
  "recipient_interest_combinations": [],
  "learned_preferences": {},
  "optimization_insights": []
}'::jsonb;

-- Enhanced Gifting History Analytics
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS enhanced_gifting_history jsonb DEFAULT '{
  "seasonal_patterns": {},
  "category_success_rates": {},
  "recipient_type_preferences": {},
  "feedback_data": [],
  "return_exchange_history": [],
  "timing_success_patterns": {},
  "budget_efficiency_metrics": {},
  "relationship_gift_history": {}
}'::jsonb;

-- Phase 2: Smart Auto-Gifting Enhancements
ALTER TABLE auto_gifting_rules 
ADD COLUMN IF NOT EXISTS relationship_context jsonb DEFAULT '{
  "closeness_level": 5,
  "relationship_duration_months": 12,
  "interaction_frequency": "regular",
  "special_considerations": []
}'::jsonb,
ADD COLUMN IF NOT EXISTS recipient_lifestyle_factors jsonb DEFAULT '{
  "life_stage": "adult",
  "current_situation": "stable",
  "interests_evolution": [],
  "lifestyle_changes": []
}'::jsonb,
ADD COLUMN IF NOT EXISTS seasonal_adjustment_factors jsonb DEFAULT '{
  "holiday_multiplier": 1.2,
  "birthday_month_boost": 1.1,
  "seasonal_preferences": {},
  "timing_optimizations": {}
}'::jsonb,
ADD COLUMN IF NOT EXISTS success_metrics jsonb DEFAULT '{
  "past_gift_success_rate": 0,
  "recipient_satisfaction_score": 0,
  "budget_efficiency": 0,
  "timing_accuracy": 0
}'::jsonb;

-- Enhanced Auto-Gifting Settings for Context-Aware Budget Intelligence
ALTER TABLE auto_gifting_settings 
ADD COLUMN IF NOT EXISTS dynamic_budget_intelligence jsonb DEFAULT '{
  "relationship_budget_scaling": true,
  "historical_spending_analysis": {},
  "occasion_specific_budgets": {},
  "group_gift_detection": true,
  "budget_optimization_insights": []
}'::jsonb,
ADD COLUMN IF NOT EXISTS predictive_suggestions jsonb DEFAULT '{
  "upcoming_event_anticipation": true,
  "optimal_timing_suggestions": {},
  "category_prediction_model": {},
  "proactive_assistance_enabled": true
}'::jsonb;

-- Phase 3: Enhanced Suggestion Engine Support
CREATE TABLE IF NOT EXISTS ai_suggestion_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  insight_type text NOT NULL,
  insight_data jsonb NOT NULL DEFAULT '{}',
  confidence_score numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable RLS for ai_suggestion_insights
ALTER TABLE ai_suggestion_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own AI insights" ON ai_suggestion_insights
FOR ALL USING (auth.uid() = user_id);

-- Cross-Reference Intelligence Table
CREATE TABLE IF NOT EXISTS gift_intelligence_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recipient_id uuid,
  intelligence_type text NOT NULL,
  cache_data jsonb NOT NULL DEFAULT '{}',
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for gift_intelligence_cache
ALTER TABLE gift_intelligence_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own gift intelligence cache" ON gift_intelligence_cache
FOR ALL USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_suggestion_insights_user_type ON ai_suggestion_insights(user_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_gift_intelligence_cache_user_recipient ON gift_intelligence_cache(user_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_gift_intelligence_cache_expires ON gift_intelligence_cache(expires_at);

-- Update timestamp triggers
CREATE TRIGGER IF NOT EXISTS update_ai_suggestion_insights_updated_at
  BEFORE UPDATE ON ai_suggestion_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_gift_intelligence_cache_updated_at
  BEFORE UPDATE ON gift_intelligence_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();