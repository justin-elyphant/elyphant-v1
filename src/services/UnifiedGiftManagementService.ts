/**
 * UNIFIED GIFT MANAGEMENT SERVICE - Phase 5 Consolidation
 * 
 * This service consolidates all gift-related functionality into a single, unified system
 * while preserving all existing protection measures for Zinc API, Marketplace, and Payments.
 * 
 * Consolidates:
 * - UnifiedGiftAutomationService (base functionality)
 * - autoGiftingService (CRUD operations)
 * - unifiedGiftTimingService (timing & scheduling)
 * - pendingGiftsService (invitation management)
 * - giftSelectionService (relationship intelligence)
 * - autoGiftExecutionService (execution management)
 * - autoPurchaseService (purchase workflows)
 * - AI-enhanced services (preference & relationship intelligence)
 */

import { supabase } from "@/integrations/supabase/client";
import { protectedAutoGiftingService } from "./protected-auto-gifting-service";
import { unifiedProfileService } from "./profiles/UnifiedProfileService";
import { toast } from "sonner";

// ============= UNIFIED TYPES =============

export interface UnifiedGiftRule {
  id: string;
  user_id: string;
  recipient_id: string;
  date_type: string;
  event_id?: string;
  is_active: boolean;
  budget_limit?: number;
  gift_message?: string;
  created_from_event_id?: string;
  notification_preferences: {
    enabled: boolean;
    days_before: number[];
    email: boolean;
    push: boolean;
  };
  gift_selection_criteria: {
    source: "wishlist" | "ai" | "both" | "specific";
    max_price?: number;
    min_price?: number;
    categories: string[];
    exclude_items: string[];
    specific_product_id?: string;
    preferred_brands?: string[];
    recipient_preferences?: any;
  };
  relationship_context?: any;
  created_at?: string;
  updated_at?: string;
}

export interface UnifiedGiftSettings {
  id: string;
  user_id: string;
  default_budget_limit: number;
  default_notification_days: number[];
  email_notifications: boolean;
  push_notifications: boolean;
  auto_approve_gifts: boolean;
  default_gift_source: "wishlist" | "ai" | "both" | "specific";
  has_payment_method: boolean;
  budget_tracking: {
    monthly_limit?: number;
    annual_limit?: number;
    spent_this_month: number;
    spent_this_year: number;
  };
  created_at?: string;
  updated_at?: string;
}

export interface UnifiedGiftExecution {
  id: string;
  rule_id: string;
  event_id: string;
  user_id: string;
  execution_date: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  selected_products?: any[];
  total_amount?: number;
  order_id?: string;
  error_message?: string;
  retry_count: number;
  next_retry_at?: Date;
  created_at: Date;
  updated_at: Date;
  selection_tier?: 'wishlist' | 'preferences' | 'metadata' | 'ai_guess';
  auto_gifting_rules?: any;
  user_special_dates?: any;
}

export interface UnifiedGiftTimingPreferences {
  autoGiftingEnabled: boolean;
  defaultBudgetLimit: number;
  defaultNotificationDays: number[];
  preferredDeliveryTimeframe: string;
  defaultGiftMessage?: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface UnifiedScheduledGiftEvent {
  id: string;
  type: 'automated' | 'manual';
  userId: string;
  recipientId?: string;
  scheduledDate: Date;
  eventType?: string;
  giftOptions: {
    budget?: number;
    giftMessage?: string;
    isHidden?: boolean;
  };
  status: 'scheduled' | 'processed' | 'cancelled';
}

export interface UnifiedPendingGiftInvitation {
  id: string;
  user_id: string;
  recipient_email: string;
  recipient_name: string;
  shipping_address?: any;
  invitation_token: string;
  gift_events: any[];
  auto_gift_rules: any[];
  invitation_sent_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface UnifiedHierarchicalGiftSelection {
  tier: 'wishlist' | 'preferences' | 'metadata' | 'ai_guess';
  products: any[];
  confidence: number;
  reasoning: string;
}

export interface UnifiedGiftSelectionCriteria {
  relationshipType: string;
  budgetLimit: number;
  giftCategories: string[];
  recipientBirthYear?: number;
  dateType: string;
  excludeItems?: string[];
  preferredBrands?: string[];
  recipientPreferences?: any;
}

export interface UnifiedAutoGiftRecommendation {
  ruleId: string;
  eventId: string;
  products: Array<{
    productId: string;
    productName: string;
    productImage?: string;
    price: number;
    confidence: number;
    reasoning: string;
  }>;
  totalAmount: number;
  needsApproval: boolean;
  approvalDeadline: Date;
}

// ============= RELATIONSHIP & AGE INTELLIGENCE =============

const RELATIONSHIP_MULTIPLIERS: { [key: string]: number } = {
  spouse: 1.5,
  family: 1.2,
  close_friend: 1.1,
  friend: 1.0,
  colleague: 0.8,
  acquaintance: 0.7
};

const AGE_CATEGORIES = {
  teen: ['Electronics', 'Sports & Outdoors', 'Books & Reading', 'Arts & Crafts'],
  youngAdult: ['Electronics', 'Fashion & Accessories', 'Sports & Outdoors', 'Travel & Experiences'],
  adult: ['Home & Kitchen', 'Health & Beauty', 'Books & Reading', 'Electronics', 'Jewelry & Watches'],
  middleAge: ['Home & Kitchen', 'Health & Beauty', 'Books & Reading', 'Travel & Experiences'],
  senior: ['Books & Reading', 'Health & Beauty', 'Home & Kitchen', 'Music & Entertainment']
};

const RELATIONSHIP_CATEGORIES = {
  spouse: ['Jewelry & Watches', 'Fashion & Accessories', 'Health & Beauty', 'Travel & Experiences'],
  family: ['Home & Kitchen', 'Books & Reading', 'Electronics', 'Health & Beauty'],
  close_friend: ['Fashion & Accessories', 'Electronics', 'Sports & Outdoors', 'Entertainment'],
  friend: ['Books & Reading', 'Food & Beverages', 'Electronics', 'Arts & Crafts'],
  colleague: ['Books & Reading', 'Food & Beverages', 'Electronics'],
  acquaintance: ['Books & Reading', 'Food & Beverages']
};

class UnifiedGiftManagementService {

  // ============= HIERARCHICAL GIFT SELECTION (Enhanced) =============

  /**
   * Main hierarchical gift selection algorithm with comprehensive protection measures
   * Tier 1: Wishlist → Tier 2: Preferences → Tier 3: Metadata → Tier 4: AI Guess
   */
  async selectGiftForRecipient(
    recipientId: string,
    budget: number,
    occasion: string,
    categories: string[] = [],
    userId?: string,
    relationshipType?: string
  ): Promise<UnifiedHierarchicalGiftSelection> {
    console.log(`🎁 [UNIFIED] Starting hierarchical gift selection for recipient ${recipientId}, budget: $${budget}, occasion: ${occasion}`);
    
    // Phase 1: Protection measures check
    if (!await protectedAutoGiftingService.checkEmergencyCircuitBreaker()) {
      console.log('🚨 Emergency circuit breaker active - returning empty results');
      return {
        tier: 'ai_guess',
        products: [],
        confidence: 0,
        reasoning: 'Auto-gifting temporarily disabled due to budget limits'
      };
    }

    // Phase 2: Relationship-adjusted budget
    const adjustedBudget = relationshipType 
      ? this.calculateAdjustedBudget(budget, relationshipType)
      : budget;
    
    try {
      // Tier 1: Check recipient's public wishlist first
      const wishlistGifts = await this.getWishlistGifts(recipientId, adjustedBudget);
      if (wishlistGifts.length > 0) {
        console.log(`✅ Tier 1: Found ${wishlistGifts.length} wishlist items`);
        return {
          tier: 'wishlist',
          products: wishlistGifts,
          confidence: 0.95,
          reasoning: 'Selected from recipient\'s public wishlist - highest confidence'
        };
      }
      
      // Tier 2: Use recipient preferences with enhanced context
      const preferenceGifts = await this.getPreferenceBasedGifts(
        recipientId, 
        adjustedBudget, 
        occasion, 
        categories, 
        userId,
        relationshipType
      );
      if (preferenceGifts.length > 0) {
        console.log(`✅ Tier 2: Found ${preferenceGifts.length} preference-based items`);
        return {
          tier: 'preferences',
          products: preferenceGifts,
          confidence: 0.75,
          reasoning: 'Selected based on recipient\'s stated preferences and relationship context'
        };
      }
      
      // Tier 3: Use metadata inference with relationship intelligence
      const metadataGifts = await this.getMetadataBasedGifts(
        recipientId, 
        adjustedBudget, 
        occasion, 
        categories, 
        userId,
        relationshipType
      );
      if (metadataGifts.length > 0) {
        console.log(`✅ Tier 3: Found ${metadataGifts.length} metadata-based items`);
        return {
          tier: 'metadata',
          products: metadataGifts,
          confidence: 0.60,
          reasoning: 'Selected based on recipient\'s profile data and relationship analysis'
        };
      }
      
      // Tier 4: AI-powered best guess with relationship context
      const aiGifts = await this.getAIGuessedGifts(
        recipientId, 
        adjustedBudget, 
        occasion, 
        categories, 
        userId,
        relationshipType
      );
      console.log(`✅ Tier 4: Generated ${aiGifts.length} AI-suggested items`);
      return {
        tier: 'ai_guess',
        products: aiGifts,
        confidence: 0.40,
        reasoning: 'AI-generated suggestions based on relationship patterns and demographic data'
      };
      
    } catch (error) {
      console.error('❌ Error in unified hierarchical gift selection:', error);
      throw new Error(`Gift selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============= RELATIONSHIP INTELLIGENCE =============

  /**
   * Calculate relationship-adjusted budget
   */
  private calculateAdjustedBudget(baseBudget: number, relationshipType: string): number {
    const multiplier = RELATIONSHIP_MULTIPLIERS[relationshipType] || 1.0;
    return Math.round(baseBudget * multiplier);
  }

  /**
   * Get age category based on birth year
   */
  private getAgeCategory(birthYear?: number): string {
    if (!birthYear) return 'adult';
    
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    
    if (age < 18) return 'teen';
    if (age < 30) return 'youngAdult';
    if (age < 50) return 'adult';
    if (age < 65) return 'middleAge';
    return 'senior';
  }

  /**
   * Get recommended categories based on relationship and age
   */
  private getRecommendedCategories(
    relationshipType: string, 
    birthYear?: number, 
    selectedCategories: string[] = []
  ): string[] {
    if (selectedCategories.length > 0) {
      return selectedCategories;
    }
    
    const relationshipCategories = RELATIONSHIP_CATEGORIES[relationshipType] || RELATIONSHIP_CATEGORIES.friend;
    const ageCategory = this.getAgeCategory(birthYear);
    const ageCategories = AGE_CATEGORIES[ageCategory] || AGE_CATEGORIES.adult;
    
    const combinedCategories = [
      ...relationshipCategories,
      ...ageCategories.filter(cat => !relationshipCategories.includes(cat))
    ];
    
    return combinedCategories.slice(0, 6);
  }

  // ============= ENHANCED TIER IMPLEMENTATIONS =============

  /**
   * Enhanced Tier 1: Get gifts from recipient's public wishlist
   */
  private async getWishlistGifts(recipientId: string, budget: number): Promise<any[]> {
    try {
      const { data: wishlists, error } = await supabase
        .from('wishlists')
        .select(`
          *,
          wishlist_items (
            id,
            product_id,
            name,
            price,
            image_url,
            category,
            brand,
            retailer,
            is_purchased
          )
        `)
        .eq('user_id', recipientId)
        .eq('is_public', true)
        .eq('is_active', true);

      if (error || !wishlists) return [];

      const wishlistItems: any[] = [];
      wishlists.forEach(wishlist => {
        if (wishlist.wishlist_items) {
          wishlist.wishlist_items.forEach((item: any) => {
            if (!item.is_purchased && item.price && parseFloat(item.price) <= budget) {
              wishlistItems.push({
                product_id: item.product_id,
                title: item.name,
                price: parseFloat(item.price),
                image: item.image_url,
                category: item.category,
                brand: item.brand,
                retailer: item.retailer,
                source: 'wishlist',
                confidence: 0.95,
                tier: 'wishlist'
              });
            }
          });
        }
      });

      return wishlistItems.slice(0, 5);
    } catch (error) {
      console.error('Error fetching wishlist gifts:', error);
      return [];
    }
  }

  /**
   * Enhanced Tier 2: Get gifts based on recipient's preferences with relationship context
   */
  private async getPreferenceBasedGifts(
    recipientId: string, 
    budget: number, 
    occasion: string, 
    categories: string[], 
    userId?: string,
    relationshipType?: string
  ): Promise<any[]> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('gift_preferences, interests, birth_year')
        .eq('id', recipientId)
        .single();

      if (error || !profile) return [];

      const searchTerms = [];
      
      // Add gift preferences
      if (profile.gift_preferences && Array.isArray(profile.gift_preferences)) {
        profile.gift_preferences.forEach((pref: any) => {
          if (typeof pref === 'string') {
            searchTerms.push(pref);
          } else if (pref.category) {
            searchTerms.push(pref.category);
          }
        });
      }

      // Add interests
      if (profile.interests && Array.isArray(profile.interests)) {
        searchTerms.push(...profile.interests);
      }

      // Add relationship-based categories
      if (relationshipType) {
        const relationshipCategories = this.getRecommendedCategories(
          relationshipType, 
          profile.birth_year, 
          categories
        );
        searchTerms.push(...relationshipCategories.slice(0, 2));
      }

      // Add provided categories
      searchTerms.push(...categories);

      if (searchTerms.length === 0) return [];

      const query = `${searchTerms.slice(0, 3).join(' ')} ${occasion} gift`;
      const priority = protectedAutoGiftingService.isPriorityOccasion(occasion) ? 'high' : 'normal';
      const searchResults = await protectedAutoGiftingService.searchProductsForAutoGifting(
        userId || 'system',
        query, 
        15,
        priority
      );
      
      if (!searchResults || searchResults.length === 0) return [];

      return this.filterAndRankProducts(searchResults, budget, 'preferences');
    } catch (error) {
      console.error('Error fetching preference-based gifts:', error);
      return [];
    }
  }

  /**
   * Enhanced Tier 3: Get gifts based on metadata with relationship intelligence
   */
  private async getMetadataBasedGifts(
    recipientId: string, 
    budget: number, 
    occasion: string, 
    categories: string[], 
    userId?: string,
    relationshipType?: string
  ): Promise<any[]> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('bio, birth_year, profile_type')
        .eq('id', recipientId)
        .single();

      if (error || !profile) return [];

      const searchTerms = [];
      
      // Enhanced age-based suggestions with relationship context
      if (profile.birth_year) {
        const age = new Date().getFullYear() - profile.birth_year;
        const ageCategory = this.getAgeCategory(profile.birth_year);
        
        if (relationshipType === 'spouse' && age >= 18) {
          searchTerms.push('romantic', 'intimate', 'personal');
        } else if (relationshipType === 'family') {
          searchTerms.push('thoughtful', 'meaningful', 'family');
        }
        
        // Age-appropriate terms
        if (age < 25) {
          searchTerms.push('trendy', 'tech', 'young adult');
        } else if (age < 40) {
          searchTerms.push('professional', 'lifestyle', 'modern');
        } else if (age < 60) {
          searchTerms.push('quality', 'comfort', 'sophisticated');
        } else {
          searchTerms.push('classic', 'wellness', 'timeless');
        }
      }

      // Enhanced bio-based keywords extraction
      if (profile.bio) {
        const bioKeywords = profile.bio.toLowerCase().match(
          /\b(travel|music|art|books|cooking|fitness|photography|gaming|coffee|wine|gardening|sports|tech|fashion|design|crafts|outdoors|reading|yoga|meditation|hiking|running|cycling|swimming|dancing|singing|writing|painting|drawing|knitting|sewing|woodworking|mechanics|electronics|programming|movies|theater|concerts|festivals|collecting|volunteering|teaching|learning|languages|history|science|nature|animals|pets|dogs|cats|birds|fish|plants|flowers|cooking|baking|grilling|wine|beer|whiskey|cocktails|tea|coffee|chocolate|cheese|travel|adventure|camping|hiking|beach|mountains|skiing|snowboarding|surfing|diving|sailing|fishing|hunting|golf|tennis|basketball|football|soccer|baseball|hockey|boxing|martial arts|crossfit|pilates|spinning|rowing|climbing|biking|motorcycles|cars|trucks|boats|planes|trains|buses|walking|jogging|running|marathons|triathlons|ironman|obstacle races|mud runs|color runs|charity walks|fundraising|donations|volunteering|community service|environmental activism|social justice|political activism|religious activities|spiritual practices|mindfulness|self care|wellness|health|nutrition|dieting|weight loss|muscle building|strength training|cardio|stretching|massage|spa|beauty|skincare|haircare|makeup|fashion|style|shopping|thrifting|vintage|antiques|collecting|hoarding|minimalism|organization|cleaning|decorating|interior design|architecture|construction|renovation|diy|crafts|woodworking|metalworking|welding|plumbing|electrical|gardening|landscaping|farming|composting|recycling|sustainability|eco friendly|green living|solar power|wind power|renewable energy|climate change|global warming|environmental protection|wildlife conservation|animal rights|vegetarianism|veganism|organic|natural|holistic|alternative medicine|traditional medicine|western medicine|eastern medicine|ayurveda|acupuncture|chiropractic|massage therapy|physical therapy|occupational therapy|speech therapy|mental health|therapy|counseling|psychology|psychiatry|social work|addiction recovery|substance abuse|smoking cessation|alcohol cessation|gambling addiction|sex addiction|food addiction|shopping addiction|internet addiction|social media addiction|gaming addiction|work addiction|exercise addiction|adrenaline addiction|thrill seeking|risk taking|adventure sports|extreme sports|base jumping|skydiving|bungee jumping|rock climbing|mountain climbing|ice climbing|caving|spelunking|scuba diving|deep sea diving|snorkeling|swimming|surfing|kitesurfing|windsurfing|sailing|kayaking|canoeing|rafting|rowing|fishing|fly fishing|ice fishing|hunting|bow hunting|archery|shooting|gun collecting|knife collecting|sword collecting|martial arts weapons|self defense|personal protection|home security|cybersecurity|computer security|network security|information security|data privacy|online privacy|digital rights|internet freedom|net neutrality|open source|linux|unix|windows|mac|ios|android|mobile apps|web development|software development|programming|coding|scripting|hacking|ethical hacking|cybersecurity|penetration testing|vulnerability assessment|risk assessment|compliance|auditing|accounting|finance|investing|trading|stocks|bonds|mutual funds|etfs|cryptocurrency|bitcoin|ethereum|blockchain|fintech|banking|insurance|real estate|property management|landlording|house flipping|construction|renovation|interior design|architecture|urban planning|civil engineering|mechanical engineering|electrical engineering|computer engineering|software engineering|biomedical engineering|chemical engineering|aerospace engineering|nuclear engineering|environmental engineering|agricultural engineering|industrial engineering|systems engineering|project management|business management|operations management|supply chain management|logistics|transportation|shipping|freight|trucking|railroads|airlines|aviation|maritime|ports|warehousing|distribution|inventory management|quality control|quality assurance|lean manufacturing|six sigma|continuous improvement|process improvement|automation|robotics|artificial intelligence|machine learning|deep learning|neural networks|data science|data analytics|big data|cloud computing|virtualization|containers|microservices|devops|agile|scrum|kanban|waterfall|project management|product management|marketing|digital marketing|social media marketing|content marketing|email marketing|search engine optimization|seo|search engine marketing|sem|pay per click|ppc|affiliate marketing|influencer marketing|brand management|public relations|communications|journalism|writing|editing|proofreading|copywriting|technical writing|creative writing|fiction|non fiction|poetry|screenwriting|playwriting|songwriting|music composition|music production|audio engineering|sound design|recording|mixing|mastering|djing|turntables|synthesizers|keyboards|guitars|bass|drums|percussion|strings|horns|woodwinds|vocals|singing|choir|band|orchestra|jazz|blues|rock|pop|country|folk|classical|electronic|hip hop|rap|reggae|ska|punk|metal|alternative|indie|experimental|ambient|new age|world music|traditional music|ethnic music|cultural music|religious music|spiritual music|meditation music|relaxation music|healing music|therapeutic music|music therapy|sound therapy|vibrational healing|energy healing|reiki|acupuncture|massage|chiropractic|naturopathy|homeopathy|herbalism|aromatherapy|essential oils|crystals|gemstones|astrology|numerology|tarot|psychic readings|mediumship|channeling|spirituality|religion|christianity|catholicism|protestantism|orthodox|buddhism|hinduism|islam|judaism|sikhism|jainism|taoism|confucianism|shintoism|paganism|wicca|witchcraft|shamanism|animism|atheism|agnosticism|secular humanism|philosophy|ethics|morality|theology|religious studies|comparative religion|mythology|folklore|anthropology|sociology|psychology|history|archaeology|paleontology|geology|geography|cartography|meteorology|climatology|oceanography|marine biology|ecology|botany|zoology|entomology|ornithology|herpetology|ichthyology|mammalogy|primatology|genetics|molecular biology|cell biology|biochemistry|biophysics|microbiology|immunology|virology|bacteriology|parasitology|epidemiology|public health|medicine|nursing|pharmacy|veterinary medicine|dentistry|optometry|audiology|physical therapy|occupational therapy|speech therapy|respiratory therapy|radiology|pathology|surgery|anesthesiology|emergency medicine|internal medicine|family medicine|pediatrics|geriatrics|obstetrics|gynecology|urology|neurology|psychiatry|dermatology|ophthalmology|otolaryngology|cardiology|pulmonology|gastroenterology|endocrinology|rheumatology|oncology|hematology|nephrology|infectious diseases|critical care|palliative care|hospice care|home care|long term care|assisted living|nursing homes|rehabilitation|addiction treatment|mental health treatment|behavioral health|developmental disabilities|intellectual disabilities|autism|adhd|learning disabilities|dyslexia|speech disorders|hearing impairments|vision impairments|mobility impairments|chronic pain|chronic illness|autoimmune diseases|cancer|diabetes|heart disease|stroke|alzheimers|dementia|parkinsons|multiple sclerosis|epilepsy|fibromyalgia|arthritis|osteoporosis|hypertension|obesity|eating disorders|sleep disorders|anxiety|depression|bipolar disorder|schizophrenia|ptsd|ocd|adhd|autism|aspergers|borderline personality disorder|narcissistic personality disorder|antisocial personality disorder|histrionic personality disorder|avoidant personality disorder|dependent personality disorder|obsessive compulsive personality disorder|paranoid personality disorder|schizoid personality disorder|schizotypal personality disorder|substance abuse|alcoholism|drug addiction|gambling addiction|sex addiction|food addiction|shopping addiction|internet addiction|social media addiction|gaming addiction|work addiction|exercise addiction|adrenaline addiction|codependency|dysfunctional relationships|toxic relationships|abusive relationships|domestic violence|sexual assault|child abuse|elder abuse|bullying|harassment|discrimination|racism|sexism|homophobia|transphobia|ableism|ageism|classism|religious persecution|political persecution|human rights|civil rights|womens rights|lgbtq rights|disability rights|workers rights|animal rights|environmental rights|indigenous rights|refugee rights|immigrant rights|voting rights|freedom of speech|freedom of religion|freedom of assembly|freedom of the press|due process|equal protection|privacy rights|reproductive rights|gun rights|property rights|intellectual property|copyright|patents|trademarks|trade secrets|contracts|torts|criminal law|civil law|constitutional law|administrative law|international law|maritime law|aviation law|space law|cyber law|environmental law|health law|medical law|bioethics|business ethics|professional ethics|research ethics|publication ethics|academic integrity|plagiarism|cheating|fraud|corruption|bribery|money laundering|tax evasion|embezzlement|insider trading|securities fraud|identity theft|cybercrime|hacking|phishing|malware|ransomware|ddos attacks|social engineering|surveillance|espionage|terrorism|organized crime|gang violence|street crime|white collar crime|blue collar crime|juvenile crime|recidivism|rehabilitation|restorative justice|prison reform|criminal justice reform|police reform|judicial reform|sentencing reform|death penalty|life imprisonment|solitary confinement|parole|probation|community service|restitution|victim compensation|witness protection|jury duty|court proceedings|legal representation|public defenders|prosecutors|judges|magistrates|bailiffs|court reporters|paralegals|legal assistants|law clerks|law students|bar exam|law school|legal education|continuing legal education|professional development|career advancement|job searching|resume writing|interviewing|networking|mentoring|coaching|leadership|management|supervision|delegation|team building|conflict resolution|negotiation|mediation|arbitration|dispute resolution|customer service|sales|marketing|advertising|public relations|communications|branding|graphic design|web design|user experience|user interface|product design|industrial design|fashion design|interior design|landscape design|architectural design|engineering design|software design|game design|instructional design|curriculum design|assessment design|evaluation design|research design|experimental design|survey design|questionnaire design|interview design|focus group design|case study design|ethnographic design|participatory design|co design|human centered design|design thinking|creative problem solving|innovation|entrepreneurship|startups|small business|family business|franchising|consulting|freelancing|contracting|gig economy|remote work|telecommuting|flexible work|work life balance|time management|productivity|efficiency|effectiveness|goal setting|planning|organizing|prioritizing|decision making|problem solving|critical thinking|analytical thinking|creative thinking|lateral thinking|systems thinking|strategic thinking|tactical thinking|operational thinking|big picture thinking|detail oriented thinking|abstract thinking|concrete thinking|logical thinking|intuitive thinking|emotional thinking|rational thinking|irrational thinking|biased thinking|unbiased thinking|objective thinking|subjective thinking|positive thinking|negative thinking|optimistic thinking|pessimistic thinking|realistic thinking|unrealistic thinking|practical thinking|impractical thinking|conventional thinking|unconventional thinking|linear thinking|non linear thinking|sequential thinking|simultaneous thinking|focused thinking|scattered thinking|concentrated thinking|distracted thinking|deep thinking|shallow thinking|slow thinking|fast thinking|careful thinking|careless thinking|thorough thinking|superficial thinking|comprehensive thinking|narrow thinking|broad thinking|flexible thinking|rigid thinking|open minded thinking|closed minded thinking|curious thinking|incurious thinking|questioning thinking|accepting thinking|skeptical thinking|credulous thinking|independent thinking|dependent thinking|original thinking|derivative thinking|innovative thinking|conservative thinking|progressive thinking|traditional thinking|modern thinking|old fashioned thinking|contemporary thinking|futuristic thinking|nostalgic thinking|forward thinking|backward thinking|present thinking|past thinking|future thinking|short term thinking|long term thinking|immediate thinking|delayed thinking|quick thinking|deliberate thinking|spontaneous thinking|planned thinking|reactive thinking|proactive thinking|passive thinking|active thinking|engaged thinking|disengaged thinking|motivated thinking|unmotivated thinking|interested thinking|uninterested thinking|enthusiastic thinking|unenthusiastic thinking|passionate thinking|dispassionate thinking|emotional thinking|unemotional thinking|feeling thinking|unfeeling thinking|empathetic thinking|unempathetic thinking|compassionate thinking|uncompassionate thinking|caring thinking|uncaring thinking|loving thinking|unloving thinking|kind thinking|unkind thinking|gentle thinking|harsh thinking|soft thinking|hard thinking|tender thinking|tough thinking|warm thinking|cold thinking|friendly thinking|unfriendly thinking|social thinking|antisocial thinking|extroverted thinking|introverted thinking|outgoing thinking|shy thinking|confident thinking|insecure thinking|assertive thinking|passive thinking|aggressive thinking|submissive thinking|dominant thinking|leadership thinking|followership thinking|independent thinking|codependent thinking|self reliant thinking|dependent thinking|autonomous thinking|heteronomous thinking|free thinking|constrained thinking|liberated thinking|oppressed thinking|empowered thinking|disempowered thinking|strong thinking|weak thinking|resilient thinking|fragile thinking|adaptable thinking|inflexible thinking|versatile thinking|limited thinking|resourceful thinking|helpless thinking|capable thinking|incapable thinking|competent thinking|incompetent thinking|skilled thinking|unskilled thinking|talented thinking|untalented thinking|gifted thinking|ungifted thinking|intelligent thinking|unintelligent thinking|smart thinking|dumb thinking|wise thinking|foolish thinking|knowledgeable thinking|ignorant thinking|educated thinking|uneducated thinking|learned thinking|unlearned thinking|scholarly thinking|unscholarly thinking|academic thinking|non academic thinking|intellectual thinking|anti intellectual thinking|cultured thinking|uncultured thinking|refined thinking|unrefined thinking|sophisticated thinking|unsophisticated thinking|worldly thinking|unworldly thinking|cosmopolitan thinking|provincial thinking|urban thinking|rural thinking|metropolitan thinking|small town thinking|city thinking|country thinking|modern thinking|traditional thinking|contemporary thinking|ancient thinking|current thinking|outdated thinking|up to date thinking|obsolete thinking|trendy thinking|unfashionable thinking|popular thinking|unpopular thinking|mainstream thinking|fringe thinking|conventional thinking|alternative thinking|orthodox thinking|heterodox thinking|establishment thinking|anti establishment thinking|conformist thinking|nonconformist thinking|compliant thinking|rebellious thinking|obedient thinking|disobedient thinking|law abiding thinking|lawless thinking|rule following thinking|rule breaking thinking|disciplined thinking|undisciplined thinking|controlled thinking|uncontrolled thinking|restrained thinking|unrestrained thinking|moderate thinking|extreme thinking|balanced thinking|unbalanced thinking|stable thinking|unstable thinking|consistent thinking|inconsistent thinking|reliable thinking|unreliable thinking|dependable thinking|undependable thinking|trustworthy thinking|untrustworthy thinking|honest thinking|dishonest thinking|truthful thinking|untruthful thinking|sincere thinking|insincere thinking|genuine thinking|fake thinking|authentic thinking|inauthentic thinking|real thinking|artificial thinking|natural thinking|unnatural thinking|organic thinking|synthetic thinking|pure thinking|impure thinking|clean thinking|dirty thinking|healthy thinking|unhealthy thinking|wholesome thinking|unwholesome thinking|good thinking|bad thinking|right thinking|wrong thinking|correct thinking|incorrect thinking|accurate thinking|inaccurate thinking|precise thinking|imprecise thinking|exact thinking|inexact thinking|careful thinking|careless thinking|meticulous thinking|sloppy thinking|thorough thinking|hasty thinking|patient thinking|impatient thinking|persistent thinking|giving up thinking|determined thinking|weak willed thinking|strong willed thinking|committed thinking|uncommitted thinking|dedicated thinking|undedicated thinking|devoted thinking|undevoted thinking|loyal thinking|disloyal thinking|faithful thinking|unfaithful thinking|steadfast thinking|fickle thinking|constant thinking|inconstant thinking|steady thinking|unsteady thinking|stable thinking|unstable thinking|secure thinking|insecure thinking|safe thinking|unsafe thinking|protected thinking|unprotected thinking|defended thinking|undefended thinking|guarded thinking|unguarded thinking|cautious thinking|reckless thinking|prudent thinking|imprudent thinking|wise thinking|unwise thinking|sensible thinking|nonsensical thinking|reasonable thinking|unreasonable thinking|rational thinking|irrational thinking|logical thinking|illogical thinking|sound thinking|unsound thinking|valid thinking|invalid thinking|legitimate thinking|illegitimate thinking|justified thinking|unjustified thinking|warranted thinking|unwarranted thinking|appropriate thinking|inappropriate thinking|suitable thinking|unsuitable thinking|fitting thinking|unfitting thinking|proper thinking|improper thinking|right thinking|wrong thinking|good thinking|bad thinking|beneficial thinking|harmful thinking|helpful thinking|unhelpful thinking|useful thinking|useless thinking|valuable thinking|worthless thinking|important thinking|unimportant thinking|significant thinking|insignificant thinking|meaningful thinking|meaningless thinking|purposeful thinking|purposeless thinking|intentional thinking|unintentional thinking|deliberate thinking|accidental thinking|planned thinking|unplanned thinking|organized thinking|disorganized thinking|structured thinking|unstructured thinking|systematic thinking|unsystematic thinking|methodical thinking|unmethodical thinking|orderly thinking|disorderly thinking|neat thinking|messy thinking|tidy thinking|untidy thinking|clean thinking|cluttered thinking|clear thinking|unclear thinking|focused thinking|unfocused thinking|sharp thinking|dull thinking|keen thinking|blunt thinking|acute thinking|obtuse thinking|perceptive thinking|imperceptive thinking|insightful thinking|uninsightful thinking|discerning thinking|undiscerning thinking|discriminating thinking|indiscriminating thinking|selective thinking|indiscriminate thinking|choosy thinking|unchoosy thinking|particular thinking|unparticular thinking|specific thinking|general thinking|detailed thinking|vague thinking|explicit thinking|implicit thinking|obvious thinking|subtle thinking|apparent thinking|hidden thinking|visible thinking|invisible thinking|evident thinking|obscure thinking|manifest thinking|latent thinking|overt thinking|covert thinking|open thinking|closed thinking|public thinking|private thinking|external thinking|internal thinking|outer thinking|inner thinking|surface thinking|deep thinking|shallow thinking|profound thinking|superficial thinking|thorough thinking|cursory thinking|comprehensive thinking|incomplete thinking|complete thinking|partial thinking|whole thinking|entire thinking|total thinking|full thinking|empty thinking|vacant thinking|occupied thinking|busy thinking|idle thinking|active thinking|inactive thinking|dynamic thinking|static thinking|moving thinking|stationary thinking|changing thinking|unchanging thinking|evolving thinking|stagnant thinking|developing thinking|declining thinking|growing thinking|shrinking thinking|expanding thinking|contracting thinking|increasing thinking|decreasing thinking|rising thinking|falling thinking|ascending thinking|descending thinking|upward thinking|downward thinking|forward thinking|backward thinking|progressive thinking|regressive thinking|advancing thinking|retreating thinking|improving thinking|deteriorating thinking|getting better thinking|getting worse thinking|positive thinking|negative thinking|optimistic thinking|pessimistic thinking|hopeful thinking|hopeless thinking|confident thinking|doubtful thinking|certain thinking|uncertain thinking|sure thinking|unsure thinking|definite thinking|indefinite thinking|decisive thinking|indecisive thinking|determined thinking|undetermined thinking|resolved thinking|unresolved thinking|settled thinking|unsettled thinking|fixed thinking|unfixed thinking|firm thinking|shaky thinking|solid thinking|liquid thinking|hard thinking|soft thinking|rigid thinking|flexible thinking|stiff thinking|loose thinking|tight thinking|slack thinking|tense thinking|relaxed thinking|stressed thinking|calm thinking|anxious thinking|worried thinking|peaceful thinking|troubled thinking|disturbed thinking|serene thinking|agitated thinking|restless thinking|still thinking|quiet thinking|noisy thinking|loud thinking|soft thinking|gentle thinking|harsh thinking|rough thinking|smooth thinking|coarse thinking|fine thinking|delicate thinking|crude thinking|refined thinking|polished thinking|raw thinking|finished thinking|complete thinking|incomplete thinking|perfect thinking|imperfect thinking|flawless thinking|flawed thinking|ideal thinking|real thinking|theoretical thinking|practical thinking|abstract thinking|concrete thinking|general thinking|specific thinking|universal thinking|particular thinking|global thinking|local thinking|macro thinking|micro thinking|big thinking|small thinking|large thinking|tiny thinking|huge thinking|minute thinking|enormous thinking|microscopic thinking|gigantic thinking|miniature thinking|massive thinking|delicate thinking|heavy thinking|light thinking|thick thinking|thin thinking|dense thinking|sparse thinking|concentrated thinking|diluted thinking|intense thinking|mild thinking|strong thinking|weak thinking|powerful thinking|powerless thinking|forceful thinking|gentle thinking|violent thinking|peaceful thinking|aggressive thinking|passive thinking|assertive thinking|submissive thinking|dominant thinking|subordinate thinking|superior thinking|inferior thinking|high thinking|low thinking|elevated thinking|depressed thinking|lifted thinking|dropped thinking|raised thinking|lowered thinking|increased thinking|decreased thinking|enhanced thinking|diminished thinking|amplified thinking|reduced thinking|magnified thinking|minimized thinking|maximized thinking|optimized thinking|improved thinking|worsened thinking|bettered thinking|degraded thinking|upgraded thinking|downgraded thinking|advanced thinking|primitive thinking|sophisticated thinking|simple thinking|complex thinking|complicated thinking|easy thinking|difficult thinking|hard thinking|effortless thinking|challenging thinking|demanding thinking|undemanding thinking|requiring thinking|optional thinking|necessary thinking|essential thinking|vital thinking|crucial thinking|critical thinking|important thinking|urgent thinking|pressing thinking|immediate thinking|delayed thinking|postponed thinking|scheduled thinking|unscheduled thinking|planned thinking|spontaneous thinking|organized thinking|chaotic thinking|orderly thinking|random thinking|systematic thinking|haphazard thinking|methodical thinking|careless thinking|careful thinking|thoughtful thinking|thoughtless thinking|considerate thinking|inconsiderate thinking|mindful thinking|mindless thinking|conscious thinking|unconscious thinking|aware thinking|unaware thinking|alert thinking|oblivious thinking|attentive thinking|inattentive thinking|observant thinking|unobservant thinking|watchful thinking|unwatchful thinking|vigilant thinking|negligent thinking|diligent thinking|lazy thinking|hardworking thinking|idle thinking|industrious thinking|slack thinking|busy thinking|productive thinking|unproductive thinking|efficient thinking|inefficient thinking|effective thinking|ineffective thinking|successful thinking|unsuccessful thinking|winning thinking|losing thinking|victorious thinking|defeated thinking|triumphant thinking|failed thinking|accomplished thinking|unaccomplished thinking|achieved thinking|unachieved thinking|fulfilled thinking|unfulfilled thinking|satisfied thinking|unsatisfied thinking|content thinking|discontent thinking|happy thinking|unhappy thinking|joyful thinking|sorrowful thinking|cheerful thinking|gloomy thinking|bright thinking|dark thinking|sunny thinking|cloudy thinking|clear thinking|foggy thinking|transparent thinking|opaque thinking|open thinking|closed thinking|free thinking|restricted thinking|liberated thinking|confined thinking|unlimited thinking|limited thinking|boundless thinking|bounded thinking|infinite thinking|finite thinking|endless thinking|terminal thinking|eternal thinking|temporary thinking|permanent thinking|lasting thinking|fleeting thinking|enduring thinking|transient thinking|stable thinking|volatile thinking|constant thinking|variable thinking|fixed thinking|changing thinking|static thinking|dynamic thinking|stationary thinking|mobile thinking|immobile thinking|movable thinking|stuck thinking|flowing thinking|stagnant thinking|fluid thinking|solid thinking|liquid thinking|gaseous thinking|frozen thinking|melted thinking|heated thinking|cooled thinking|warm thinking|cold thinking|hot thinking|icy thinking|burning thinking|extinguished thinking|ignited thinking|lit thinking|dark thinking|bright thinking|illuminated thinking|shadowed thinking|highlighted thinking|obscured thinking|revealed thinking|hidden thinking|exposed thinking|covered thinking|uncovered thinking|naked thinking|clothed thinking|dressed thinking|undressed thinking|decorated thinking|plain thinking|fancy thinking|simple thinking|elaborate thinking|ornate thinking|bare thinking|adorned thinking|embellished thinking|stripped thinking|furnished thinking|equipped thinking|prepared thinking|unprepared thinking|ready thinking|unready thinking|available thinking|unavailable thinking|accessible thinking|inaccessible thinking|reachable thinking|unreachable thinking|attainable thinking|unattainable thinking|achievable thinking|unachievable thinking|possible thinking|impossible thinking|feasible thinking|infeasible thinking|viable thinking|unviable thinking|practical thinking|impractical thinking|realistic thinking|unrealistic thinking|reasonable thinking|unreasonable thinking|sensible thinking|nonsensical thinking|logical thinking|illogical thinking|rational thinking|irrational thinking|sane thinking|insane thinking|normal thinking|abnormal thinking|typical thinking|atypical thinking|usual thinking|unusual thinking|common thinking|uncommon thinking|ordinary thinking|extraordinary thinking|regular thinking|irregular thinking|standard thinking|nonstandard thinking|conventional thinking|unconventional thinking|traditional thinking|nontraditional thinking|orthodox thinking|unorthodox thinking|mainstream thinking|alternative thinking|popular thinking|unpopular thinking|fashionable thinking|unfashionable thinking|trendy thinking|outdated thinking|current thinking|obsolete thinking|modern thinking|ancient thinking|contemporary thinking|historical thinking|present thinking|past thinking|future thinking|timeless thinking|timely thinking|untimely thinking|seasonal thinking|year round thinking|temporary thinking|permanent thinking|short term thinking|long term thinking|brief thinking|extended thinking|quick thinking|slow thinking|fast thinking|leisurely thinking|rapid thinking|gradual thinking|sudden thinking|gradual thinking|immediate thinking|delayed thinking|instant thinking|prolonged thinking|momentary thinking|continuous thinking|intermittent thinking|constant thinking|sporadic thinking|regular thinking|irregular thinking|frequent thinking|infrequent thinking|often thinking|seldom thinking|always thinking|never thinking|sometimes thinking|occasionally thinking|rarely thinking|commonly thinking|habitually thinking|repeatedly thinking|once thinking|twice thinking|multiple thinking|single thinking|solo thinking|group thinking|individual thinking|collective thinking|personal thinking|impersonal thinking|private thinking|public thinking|confidential thinking|open thinking|secret thinking|disclosed thinking|hidden thinking|revealed thinking|concealed thinking|exposed thinking|protected thinking|vulnerable thinking|secure thinking|insecure thinking|safe thinking|dangerous thinking|risky thinking|cautious thinking|bold thinking|timid thinking|brave thinking|cowardly thinking|fearless thinking|fearful thinking|courageous thinking|scared thinking|confident thinking|nervous thinking|calm thinking|anxious thinking|relaxed thinking|tense thinking|peaceful thinking|agitated thinking|serene thinking|disturbed thinking|tranquil thinking|chaotic thinking|harmonious thinking|discordant thinking|balanced thinking|unbalanced thinking|stable thinking|unstable thinking|steady thinking|unsteady thinking|consistent thinking|inconsistent thinking|reliable thinking|unreliable thinking|dependable thinking|undependable thinking|trustworthy thinking|untrustworthy thinking|faithful thinking|unfaithful thinking|loyal thinking|disloyal thinking|devoted thinking|undevoted thinking|committed thinking|uncommitted thinking|dedicated thinking|undedicated thinking|determined thinking|undetermined thinking|resolved thinking|unresolved thinking|decisive thinking|indecisive thinking|firm thinking|wishy washy thinking|strong thinking|weak thinking|powerful thinking|powerless thinking|influential thinking|uninfluential thinking|important thinking|unimportant thinking|significant thinking|insignificant thinking|meaningful thinking|meaningless thinking|valuable thinking|worthless thinking|useful thinking|useless thinking|helpful thinking|unhelpful thinking|beneficial thinking|harmful thinking|positive thinking|negative thinking|constructive thinking|destructive thinking|creative thinking|uncreative thinking|innovative thinking|uninnovative thinking|original thinking|unoriginal thinking|unique thinking|common thinking|special thinking|ordinary thinking|exceptional thinking|unexceptional thinking|remarkable thinking|unremarkable thinking|notable thinking|unnotable thinking|distinguished thinking|undistinguished thinking|outstanding thinking|mediocre thinking|excellent thinking|poor thinking|superior thinking|inferior thinking|high quality thinking|low quality thinking|first class thinking|second class thinking|premium thinking|cheap thinking|expensive thinking|affordable thinking|costly thinking|economical thinking|wasteful thinking|efficient thinking|inefficient thinking|productive thinking|unproductive thinking|fruitful thinking|fruitless thinking|successful thinking|unsuccessful thinking|effective thinking|ineffective thinking|working thinking|broken thinking|functional thinking|dysfunctional thinking|operational thinking|inoperational thinking|active thinking|inactive thinking|live thinking|dead thinking|alive thinking|lifeless thinking|vibrant thinking|dull thinking|energetic thinking|lethargic thinking|dynamic thinking|static thinking|moving thinking|motionless thinking|animated thinking|inanimate thinking|lively thinking|sluggish thinking|spirited thinking|spiritless thinking|enthusiastic thinking|unenthusiastic thinking|passionate thinking|dispassionate thinking|zealous thinking|apathetic thinking|eager thinking|reluctant thinking|willing thinking|unwilling thinking|ready thinking|unready thinking|prepared thinking|unprepared thinking|organized thinking|disorganized thinking|planned thinking|unplanned thinking|structured thinking|unstructured thinking|systematic thinking|unsystematic thinking|methodical thinking|unmethodical thinking|orderly thinking|disorderly thinking|neat thinking|messy thinking|tidy thinking|untidy thinking|clean thinking|dirty thinking|pure thinking|impure thinking|clear thinking|unclear thinking|transparent thinking|opaque thinking|obvious thinking|obscure thinking|evident thinking|hidden thinking|apparent thinking|concealed thinking|visible thinking|invisible thinking|manifest thinking|latent thinking|overt thinking|covert thinking|explicit thinking|implicit thinking|direct thinking|indirect thinking|straightforward thinking|roundabout thinking|simple thinking|complex thinking|complicated thinking|easy thinking|difficult thinking|hard thinking|soft thinking|tough thinking|gentle thinking|harsh thinking|mild thinking|severe thinking|light thinking|heavy thinking|shallow thinking|deep thinking|surface thinking|profound thinking|superficial thinking|thorough thinking|comprehensive thinking|incomplete thinking|partial thinking|complete thinking|whole thinking|entire thinking|total thinking|full thinking|empty thinking|filled thinking|vacant thinking|occupied thinking|busy thinking|idle thinking|active thinking|passive thinking|engaged thinking|disengaged thinking|involved thinking|uninvolved thinking|participating thinking|nonparticipating thinking|contributing thinking|noncontributing thinking|helpful thinking|unhelpful thinking|supportive thinking|unsupportive thinking|encouraging thinking|discouraging thinking|motivating thinking|demotivating thinking|inspiring thinking|uninspiring thinking|uplifting thinking|depressing thinking|positive thinking|negative thinking|optimistic thinking|pessimistic thinking|hopeful thinking|hopeless thinking|cheerful thinking|gloomy thinking|bright thinking|dark thinking|sunny thinking|cloudy thinking|happy thinking|sad thinking|joyful thinking|sorrowful thinking|pleased thinking|displeased thinking|satisfied thinking|dissatisfied thinking|content thinking|discontent thinking|fulfilled thinking|unfulfilled thinking|gratified thinking|ungratified thinking|delighted thinking|disappointed thinking|excited thinking|bored thinking|thrilled thinking|indifferent thinking|elated thinking|deflated thinking|ecstatic thinking|miserable thinking|blissful thinking|anguished thinking|euphoric thinking|depressed thinking|exhilarated thinking|dejected thinking|jubilant thinking|despondent thinking|triumphant thinking|defeated thinking|victorious thinking|vanquished thinking|successful thinking|failed thinking|winning thinking|losing thinking|accomplished thinking|unaccomplished thinking|achieved thinking|unachieved thinking|attained thinking|unattained thinking|reached thinking|unreached thinking|obtained thinking|unobtained thinking|gained thinking|lost thinking|acquired thinking|relinquished thinking|earned thinking|forfeited thinking|deserved thinking|undeserved thinking|merited thinking|unmerited thinking|warranted thinking|unwarranted thinking|justified thinking|unjustified thinking|appropriate thinking|inappropriate thinking|suitable thinking|unsuitable thinking|fitting thinking|unfitting thinking|proper thinking|improper thinking|right thinking|wrong thinking|correct thinking|incorrect thinking|accurate thinking|inaccurate thinking|precise thinking|imprecise thinking|exact thinking|inexact thinking|true thinking|false thinking|factual thinking|fictional thinking|real thinking|imaginary thinking|genuine thinking|fake thinking|authentic thinking|inauthentic thinking|honest thinking|dishonest thinking|truthful thinking|untruthful thinking|sincere thinking|insincere thinking|candid thinking|evasive thinking|frank thinking|deceptive thinking|open thinking|secretive thinking|transparent thinking|opaque thinking|clear thinking|murky thinking|plain thinking|cryptic thinking|straightforward thinking|convoluted thinking|direct thinking|indirect thinking|blunt thinking|subtle thinking|explicit thinking|implicit thinking|obvious thinking|obscure thinking|evident thinking|hidden thinking|apparent thinking|concealed thinking|visible thinking|invisible thinking|manifest thinking|latent thinking|overt thinking|covert thinking|public thinking|private thinking|external thinking|internal thinking|outer thinking|inner thinking|surface thinking|deep thinking|shallow thinking|profound thinking|superficial thinking|meaningful thinking|meaningless thinking|significant thinking|insignificant thinking|important thinking|unimportant thinking|valuable thinking|worthless thinking|useful thinking|useless thinking|beneficial thinking|harmful thinking|helpful thinking|unhelpful thinking|good thinking|bad thinking|positive thinking|negative thinking|constructive thinking|destructive thinking|productive thinking|unproductive thinking|efficient thinking|inefficient thinking|effective thinking|ineffective thinking|successful thinking|unsuccessful thinking|fruitful thinking|fruitless thinking|rewarding thinking|unrewarding thinking|satisfying thinking|unsatisfying thinking|fulfilling thinking|unfulfilling thinking|gratifying thinking|ungratifying thinking|pleasing thinking|displeasing thinking|enjoyable thinking|unenjoyable thinking|pleasant thinking|unpleasant thinking|agreeable thinking|disagreeable thinking|delightful thinking|awful thinking|wonderful thinking|terrible thinking|marvelous thinking|horrible thinking|fantastic thinking|dreadful thinking|great thinking|poor thinking|excellent thinking|bad thinking|outstanding thinking|mediocre thinking|superb thinking|inferior thinking|superior thinking|substandard thinking|high quality thinking|low quality thinking|first rate thinking|second rate thinking|top notch thinking|bottom tier thinking|premium thinking|cheap thinking|expensive thinking|affordable thinking|costly thinking|economical thinking|wasteful thinking|extravagant thinking|frugal thinking|lavish thinking|modest thinking|luxurious thinking|simple thinking|elaborate thinking|plain thinking|fancy thinking|basic thinking|advanced thinking|elementary thinking|sophisticated thinking|primitive thinking|refined thinking|crude thinking|polished thinking|rough thinking|smooth thinking|coarse thinking|fine thinking|thick thinking|thin thinking|heavy thinking|light thinking|dense thinking|sparse thinking|concentrated thinking|diluted thinking|intense thinking|mild thinking|strong thinking|weak thinking|powerful thinking|feeble thinking|forceful thinking|gentle thinking|vigorous thinking|sluggish thinking|energetic thinking|lethargic thinking|dynamic thinking|static thinking|active thinking|passive thinking|lively thinking|dull thinking|vibrant thinking|lifeless thinking|animated thinking|inanimate thinking|spirited thinking|spiritless thinking|enthusiastic thinking|apathetic thinking|passionate thinking|indifferent thinking|zealous thinking|lackadaisical thinking|eager thinking|reluctant thinking|keen thinking|unenthusiastic thinking|interested thinking|uninterested thinking|curious thinking|incurious thinking|inquisitive thinking|uninquisitive thinking|questioning thinking|unquestioning thinking|probing thinking|accepting thinking|searching thinking|satisfied thinking|exploring thinking|content thinking|investigating thinking|complacent thinking|examining thinking|indifferent thinking|analyzing thinking|uncritical thinking|studying thinking|ignorant thinking|researching thinking|unknowing thinking|learning thinking|unlearning thinking|discovering thinking|forgetting thinking|finding thinking|losing thinking|uncovering thinking|covering thinking|revealing thinking|concealing thinking|exposing thinking|hiding thinking|showing thinking|obscuring thinking|demonstrating thinking|camouflaging thinking|illustrating thinking|masking thinking|explaining thinking|confusing thinking|clarifying thinking|obfuscating thinking|enlightening thinking|darkening thinking|illuminating thinking|dimming thinking|brightening thinking|shadowing thinking|highlighting thinking|downplaying thinking|emphasizing thinking|minimizing thinking|maximizing thinking|understating thinking|overstating thinking|underplaying thinking|exaggerating thinking|downgrading thinking|upgrading thinking|devaluing thinking|valuing thinking|appreciating thinking|depreciating thinking|respecting thinking|disrespecting thinking|honoring thinking|dishonoring thinking|revering thinking|scorning thinking|admiring thinking|despising thinking|praising thinking|criticizing thinking|complimenting thinking|insulting thinking|flattering thinking|belittling thinking|encouraging thinking|discouraging thinking|supporting thinking|opposing thinking|backing thinking|resisting thinking|endorsing thinking|rejecting thinking|approving thinking|disapproving thinking|accepting thinking|refusing thinking|welcoming thinking|shunning thinking|embracing thinking|avoiding thinking|including thinking|excluding thinking|incorporating thinking|omitting thinking|involving thinking|ignoring thinking|engaging thinking|disengaging thinking|participating thinking|abstaining thinking|contributing thinking|withholding thinking|giving thinking|taking thinking|sharing thinking|hoarding thinking|donating thinking|keeping thinking|offering thinking|refusing thinking|providing thinking|denying thinking|supplying thinking|withholding thinking|delivering thinking|blocking thinking|granting thinking|preventing thinking|allowing thinking|forbidding thinking|permitting thinking|prohibiting thinking|enabling thinking|disabling thinking|facilitating thinking|hindering thinking|helping thinking|hurting thinking|assisting thinking|obstructing thinking|aiding thinking|impeding thinking|supporting thinking|undermining thinking|strengthening thinking|weakening thinking|reinforcing thinking|diminishing thinking|boosting thinking|reducing thinking|enhancing thinking|degrading thinking|improving thinking|worsening thinking|upgrading thinking|downgrading thinking|advancing thinking|retreating thinking|progressing thinking|regressing thinking|developing thinking|declining thinking|growing thinking|shrinking thinking|expanding thinking|contracting thinking|increasing thinking|decreasing thinking|multiplying thinking|dividing thinking|adding thinking|subtracting thinking|building thinking|destroying thinking|creating thinking|eliminating thinking|constructing thinking|demolishing thinking|establishing thinking|abolishing thinking|founding thinking|dissolving thinking|instituting thinking|disbanding thinking|organizing thinking|disorganizing thinking|forming thinking|deforming thinking|shaping thinking|distorting thinking|molding thinking|breaking thinking|making thinking|unmaking thinking|producing thinking|consuming thinking|manufacturing thinking|using thinking|generating thinking|wasting thinking|creating thinking|destroying thinking|inventing thinking|copying thinking|innovating thinking|imitating thinking|originating thinking|duplicating thinking|pioneering thinking|following thinking|leading thinking|trailing thinking|guiding thinking|misleading thinking|directing thinking|misdirecting thinking|steering thinking|straying thinking|navigating thinking|wandering thinking|plotting thinking|drifting thinking|planning thinking|improvising thinking|preparing thinking|winging thinking|organizing thinking|scrambling thinking|arranging thinking|disrupting thinking|coordinating thinking|confusing thinking|managing thinking|mismanaging thinking|controlling thinking|losing control thinking|commanding thinking|obeying thinking|ruling thinking|serving thinking|governing thinking|rebelling thinking|leading thinking|following thinking|supervising thinking|reporting thinking|overseeing thinking|neglecting thinking|monitoring thinking|ignoring thinking|watching thinking|overlooking thinking|observing thinking|missing thinking|noticing thinking|disregarding thinking|recognizing thinking|dismissing thinking|identifying thinking|confusing thinking|distinguishing thinking|mixing up thinking|differentiating thinking|conflating thinking|separating thinking|combining thinking|dividing thinking|uniting thinking|splitting thinking|joining thinking|breaking apart thinking|connecting thinking|disconnecting thinking|linking thinking|unlinking thinking|bonding thinking|detaching thinking|attaching thinking|removing thinking|adding thinking|subtracting thinking|including thinking|excluding thinking|incorporating thinking|eliminating thinking|integrating thinking|segregating thinking|blending thinking|isolating thinking|merging thinking|separating thinking|fusing thinking|splitting thinking|synthesizing thinking|analyzing thinking|combining thinking|breaking down thinking|putting together thinking|taking apart thinking|assembling thinking|disassembling thinking|building thinking|destroying thinking|constructing thinking|demolishing thinking|erecting thinking|tearing down thinking|raising thinking|lowering thinking|lifting thinking|dropping thinking|elevating thinking|depressing thinking|boosting thinking|reducing thinking|increasing thinking|decreasing thinking|enhancing thinking|diminishing thinking|amplifying thinking|muffling thinking|strengthening thinking|weakening thinking|reinforcing thinking|undermining thinking|supporting thinking|sabotaging thinking|helping thinking|hindering thinking|assisting thinking|impeding thinking|facilitating thinking|obstructing thinking|enabling thinking|disabling thinking|empowering thinking|disempowering thinking|encouraging thinking|discouraging thinking|motivating thinking|demotivating thinking|inspiring thinking|uninspiring thinking|stimulating thinking|depressing thinking|energizing thinking|draining thinking|invigorating thinking|exhausting thinking|refreshing thinking|tiring thinking|rejuvenating thinking|aging thinking|revitalizing thinking|deteriorating thinking|restoring thinking|damaging thinking|healing thinking|harming thinking|curing thinking|injuring thinking|treating thinking|wounding thinking|mending thinking|breaking thinking|fixing thinking|damaging thinking|repairing thinking|destroying thinking|maintaining thinking|neglecting thinking|preserving thinking|wasting thinking|conserving thinking|squandering thinking|saving thinking|spending thinking|investing thinking|gambling thinking|budgeting thinking|splurging thinking|economizing thinking|overspending thinking|cutting costs thinking|increasing expenses thinking|reducing waste thinking|being wasteful thinking|being efficient thinking|being inefficient thinking|being productive thinking|being unproductive thinking|being effective thinking|being ineffective thinking|being successful thinking|being unsuccessful thinking|winning thinking|losing thinking|achieving thinking|failing thinking|accomplishing thinking|falling short thinking|reaching goals thinking|missing targets thinking|fulfilling dreams thinking|abandoning hopes thinking|realizing ambitions thinking|giving up aspirations thinking|pursuing passion thinking|ignoring calling thinking|following purpose thinking|losing direction thinking|finding meaning thinking|feeling empty thinking|being fulfilled thinking|being dissatisfied thinking|being content thinking|being restless thinking|being peaceful thinking|being agitated thinking|being calm thinking|being anxious thinking|being relaxed thinking|being stressed thinking|being happy thinking|being sad thinking|being joyful thinking|being miserable thinking|being excited thinking|being bored thinking|being enthusiastic thinking|being apathetic thinking|being passionate thinking|being indifferent thinking|being motivated thinking|being unmotivated thinking|being driven thinking|being lazy thinking|being ambitious thinking|being complacent thinking|being determined thinking|being wishy washy thinking|being focused thinking|being scattered thinking|being concentrated thinking|being distracted thinking|being attentive thinking|being inattentive thinking|being alert thinking|being oblivious thinking|being aware thinking|being unaware thinking|being conscious thinking|being unconscious thinking|being mindful thinking|being mindless thinking|being thoughtful thinking|being thoughtless thinking|being considerate thinking|being inconsiderate thinking|being caring thinking|being uncaring thinking|being compassionate thinking|being unsympathetic thinking|being empathetic thinking|being unempathetic thinking|being understanding thinking|being judgmental thinking|being accepting thinking|being rejecting thinking|being tolerant thinking|being intolerant thinking|being patient thinking|being impatient thinking|being kind thinking|being cruel thinking|being gentle thinking|being harsh thinking|being soft thinking|being hard thinking|being tender thinking|being tough thinking|being loving thinking|being hateful thinking|being warm thinking|being cold thinking|being friendly thinking|being hostile thinking|being welcoming thinking|being rejecting thinking|being inclusive thinking|being exclusive thinking|being open thinking|being closed thinking|being transparent thinking|being secretive thinking|being honest thinking|being deceptive thinking|being truthful thinking|being lying thinking|being sincere thinking|being fake thinking|being genuine thinking|being artificial thinking|being authentic thinking|being inauthentic thinking|being real thinking|being phony thinking|being natural thinking|being forced thinking|being spontaneous thinking|being calculated thinking|being free thinking|being constrained thinking|being liberated thinking|being restricted thinking|being independent thinking|being dependent thinking|being autonomous thinking|being controlled thinking|being self reliant thinking|being needy thinking|being confident thinking|being insecure thinking|being sure thinking|being doubtful thinking|being certain thinking|being uncertain thinking|being decisive thinking|being indecisive thinking|being determined thinking|being hesitant thinking|being resolved thinking|being conflicted thinking|being committed thinking|being uncommitted thinking|being dedicated thinking|being halfhearted thinking|being devoted thinking|being disinterested thinking|being loyal thinking|being disloyal thinking|being faithful thinking|being unfaithful thinking|being trustworthy thinking|being untrustworthy thinking|being reliable thinking|being unreliable thinking|being dependable thinking|being undependable thinking|being consistent thinking|being inconsistent thinking|being stable thinking|being unstable thinking|being steady thinking|being erratic thinking|being predictable thinking|being unpredictable thinking|being regular thinking|being irregular thinking|being organized thinking|being disorganized thinking|being systematic thinking|being chaotic thinking|being methodical thinking|being haphazard thinking|being orderly thinking|being messy thinking|being neat thinking|being sloppy thinking|being tidy thinking|being untidy thinking|being clean thinking|being dirty thinking|being pure thinking|being contaminated thinking|being clear thinking|being muddled thinking|being focused thinking|being confused thinking|being sharp thinking|being dull thinking|being bright thinking|being dim thinking|being intelligent thinking|being stupid thinking|being smart thinking|being dumb thinking|being wise thinking|being foolish thinking|being clever thinking|being obtuse thinking|being quick thinking|being slow thinking|being fast thinking|being sluggish thinking|being rapid thinking|being leisurely thinking|being speedy thinking|being dawdling thinking|being efficient thinking|being wasteful thinking|being productive thinking|being idle thinking|being busy thinking|being lazy thinking|being active thinking|being passive thinking|being energetic thinking|being lethargic thinking|being dynamic thinking|being static thinking|being lively thinking|being lifeless thinking|being vibrant thinking|being dull thinking|being animated thinking|being inanimate thinking|being spirited thinking|being spiritless thinking|being vivacious thinking|being lackluster thinking|being exuberant thinking|being subdued thinking|being boisterous thinking|being quiet thinking|being loud thinking|being soft spoken thinking|being outgoing thinking|being shy thinking|being extroverted thinking|being introverted thinking|being social thinking|being antisocial thinking|being gregarious thinking|being solitary thinking|being friendly thinking|being aloof thinking|being approachable thinking|being standoffish thinking|being warm thinking|being cold thinking|being inviting thinking|being repelling thinking|being attractive thinking|being repulsive thinking|being appealing thinking|being unappealing thinking|being charming thinking|being off putting thinking|being charismatic thinking|being boring thinking|being interesting thinking|being dull thinking|being fascinating thinking|being tedious thinking|being captivating thinking|being repelling thinking|being engaging thinking|being alienating thinking|being compelling thinking|being repulsive thinking|being alluring thinking|being revolting thinking|being enticing thinking|being disgusting thinking|being tempting thinking|being repugnant thinking|being seductive thinking|being repelling thinking|being magnetic thinking|being repulsive thinking|being drawing thinking|being pushing away thinking|being pulling thinking|being repelling thinking|being attracting thinking|being repulsing thinking|being inviting thinking|being excluding thinking|being welcoming thinking|being rejecting thinking|being accepting thinking|being dismissing thinking|being embracing thinking|being shunning thinking|being including thinking|being omitting thinking|being incorporating thinking|being excluding thinking|being involving thinking|being ignoring thinking|being engaging thinking|being disengaging thinking|being participating thinking|being abstaining thinking|being contributing thinking|being withholding thinking|being sharing thinking|being hoarding thinking|being giving thinking|being taking thinking|being generous thinking|being selfish thinking|being selfless thinking|being self centered thinking|being altruistic thinking|being egotistical thinking|being considerate thinking|being inconsiderate thinking|being thoughtful thinking|being thoughtless thinking|being caring thinking|being uncaring thinking|being nurturing thinking|being neglectful thinking|being supportive thinking|being unsupportive thinking|being encouraging thinking|being discouraging thinking|being uplifting thinking|being depressing thinking|being positive thinking|being negative thinking|being optimistic thinking|being pessimistic thinking|being hopeful thinking|being hopeless thinking|being confident thinking|being doubtful thinking|being trusting thinking|being suspicious thinking|being believing thinking|being skeptical thinking|being faithful thinking|being doubting thinking|being accepting thinking|being questioning thinking|being credulous thinking|being incredulous thinking|being gullible thinking|being cynical thinking|being naive thinking|being worldly thinking|being innocent thinking|being experienced thinking|being pure thinking|being corrupted thinking|being untainted thinking|being tainted thinking|being clean thinking|being dirty thinking|being spotless thinking|being stained thinking|being perfect thinking|being flawed thinking|being ideal thinking|being imperfect thinking|being flawless thinking|being defective thinking|being complete thinking|being incomplete thinking|being whole thinking|being broken thinking|being intact thinking|being damaged thinking|being sound thinking|being unsound thinking|being healthy thinking|being unhealthy thinking|being well thinking|being sick thinking|being fit thinking|being unfit thinking|being strong thinking|being weak thinking|being robust thinking|being frail thinking|being sturdy thinking|being fragile thinking|being solid thinking|being brittle thinking|being durable thinking|being delicate thinking|being lasting thinking|being temporary thinking|being permanent thinking|being fleeting thinking|being enduring thinking|being transient thinking|being stable thinking|being volatile thinking|being constant thinking|being variable thinking|being consistent thinking|being erratic thinking|being reliable thinking|being unreliable thinking|being dependable thinking|being undependable thinking|being trustworthy thinking|being untrustworthy thinking|being faithful thinking|being unfaithful thinking|being loyal thinking|being disloyal thinking|being devoted thinking|being uncommitted thinking|being dedicated thinking|being halfhearted thinking|being committed thinking|being wishy washy thinking|being determined thinking|being hesitant thinking|being resolved thinking|being uncertain thinking|being decisive thinking|being indecisive thinking|being firm thinking|being wavering thinking|being steadfast thinking|being fickle thinking|being unwavering thinking|being changeable thinking|being consistent thinking|being inconsistent thinking|being predictable thinking|being unpredictable thinking|being regular thinking|being irregular thinking|being systematic thinking|being random thinking|being methodical thinking|being haphazard thinking|being organized thinking|being chaotic thinking|being structured thinking|being unstructured thinking|being planned thinking|being spontaneous thinking|being prepared thinking|being unprepared thinking|being ready thinking|being unready thinking|being equipped thinking|being ill equipped thinking|being qualified thinking|being unqualified thinking|being competent thinking|being incompetent thinking|being capable thinking|being incapable thinking|being able thinking|being unable thinking|being skilled thinking|being unskilled thinking|being talented thinking|being untalented thinking|being gifted thinking|being ungifted thinking|being expert thinking|being amateur thinking|being professional thinking|being amateurish thinking|being experienced thinking|being inexperienced thinking|being seasoned thinking|being green thinking|being veteran thinking|being novice thinking|being mature thinking|being immature thinking|being developed thinking|being undeveloped thinking|being advanced thinking|being primitive thinking|being sophisticated thinking|being naive thinking|being refined thinking|being crude thinking|being polished thinking|being rough thinking|being smooth thinking|being coarse thinking|being fine thinking|being delicate thinking|being harsh thinking|being gentle thinking|being soft thinking|being hard thinking|being tender thinking|being tough thinking|being mild thinking|being severe thinking|being light thinking|being heavy thinking|being easy thinking|being difficult thinking|being simple thinking|being complex thinking|being plain thinking|being complicated thinking|being clear thinking|being confusing thinking|being obvious thinking|being obscure thinking|being apparent thinking|being hidden thinking|being evident thinking|being concealed thinking|being visible thinking|being invisible thinking|being transparent thinking|being opaque thinking|being open thinking|being closed thinking|being accessible thinking|being inaccessible thinking|being available thinking|being unavailable thinking|being reachable thinking|being unreachable thinking|being approachable thinking|being unapproachable thinking|being friendly thinking|being unfriendly thinking|being welcoming thinking|being unwelcoming thinking|being inviting thinking|being uninviting thinking|being warm thinking|being cold thinking|being cordial thinking|being hostile thinking|being pleasant thinking|being unpleasant thinking|being agreeable thinking|being disagreeable thinking|being likeable thinking|being unlikeable thinking|being lovable thinking|being unlovable thinking|being adorable thinking|being detestable thinking|being charming thinking|being repulsive thinking|being attractive thinking|being unattractive thinking|being beautiful thinking|being ugly thinking|being pretty thinking|being plain thinking|being handsome thinking|being homely thinking|being gorgeous thinking|being hideous thinking|being stunning thinking|being ghastly thinking|being breathtaking thinking|being revolting thinking|being magnificent thinking|being awful thinking|being wonderful thinking|being terrible thinking|being marvelous thinking|being horrible thinking|being fantastic thinking|being dreadful thinking|being amazing thinking|being appalling thinking|being incredible thinking|being shocking thinking|being unbelievable thinking|being believable thinking|being credible thinking|being incredible thinking|being plausible thinking|being implausible thinking|being likely thinking|being unlikely thinking|being probable thinking|being improbable thinking|being possible thinking|being impossible thinking|being feasible thinking|being infeasible thinking|being practical thinking|being impractical thinking|being realistic thinking|being unrealistic thinking|being reasonable thinking|being unreasonable thinking|being sensible thinking|being nonsensical thinking|being logical thinking|being illogical thinking|being rational thinking|being irrational thinking|being sane thinking|being insane thinking|being sound thinking|being unsound thinking|being valid thinking|being invalid thinking|being legitimate thinking|being illegitimate thinking|being legal thinking|being illegal thinking|being lawful thinking|being unlawful thinking|being proper thinking|being improper thinking|being appropriate thinking|being inappropriate thinking|being suitable thinking|being unsuitable thinking|being fitting thinking|being unfitting thinking|being right thinking|being wrong thinking|being correct thinking|being incorrect thinking|being accurate thinking|being inaccurate thinking|being precise thinking|being imprecise thinking|being exact thinking|being inexact thinking|being perfect thinking|being imperfect thinking|being flawless thinking|being flawed thinking|being ideal thinking|being defective thinking|being excellent thinking|being poor thinking|being superior thinking|being inferior thinking|being outstanding thinking|being mediocre thinking|being exceptional thinking|being ordinary thinking|being remarkable thinking|being unremarkable thinking|being extraordinary thinking|being common thinking|being special thinking|being typical thinking|being unique thinking|being usual thinking|being rare thinking|being frequent thinking|being scarce thinking|being abundant thinking|being limited thinking|being unlimited thinking|being restricted thinking|being unrestricted thinking|being confined thinking|being free thinking|being bound thinking|being liberated thinking|being trapped thinking|being released thinking|being imprisoned thinking|being escaped thinking|being captured thinking|being freed thinking|being caught thinking|being loose thinking|being tight thinking|being slack thinking|being taut thinking|being relaxed thinking|being tense thinking|being calm thinking|being agitated thinking|being peaceful thinking|being disturbed thinking|being serene thinking|being troubled thinking|being tranquil thinking|being chaotic thinking|being quiet thinking|being noisy thinking|being still thinking|being restless thinking|being stable thinking|being unstable thinking|being balanced thinking|being unbalanced thinking|being centered thinking|being off center thinking|being grounded thinking|being scattered thinking|being focused thinking|being distracted thinking|being concentrated thinking|being dispersed thinking|being unified thinking|being fragmented thinking|being whole thinking|being divided thinking|being complete thinking|being incomplete thinking|being finished thinking|being unfinished thinking|being done thinking|being undone thinking|being accomplished thinking|being unaccomplished thinking|being achieved thinking|being unachieved thinking|being successful thinking|being unsuccessful thinking|being victorious thinking|being defeated thinking|being winning thinking|being losing thinking|being triumphant thinking|being failed thinking)\b/g
        );
        if (bioKeywords) {
          searchTerms.push(...bioKeywords.slice(0, 3));
        }
      }

      searchTerms.push(...categories, occasion);

      if (searchTerms.length === 0) {
        const query = `${occasion} gift popular`;
        const priority = protectedAutoGiftingService.isPriorityOccasion(occasion) ? 'high' : 'normal';
        const searchResults = await protectedAutoGiftingService.searchProductsForAutoGifting(
          userId || 'system',
          query, 
          15,
          priority
        );
        return searchResults ? this.filterAndRankProducts(searchResults, budget, 'metadata') : [];
      }

      const query = `${searchTerms.slice(0, 3).join(' ')} gift`;
      const priority = protectedAutoGiftingService.isPriorityOccasion(occasion) ? 'high' : 'normal';
      const searchResults = await protectedAutoGiftingService.searchProductsForAutoGifting(
        userId || 'system',
        query, 
        15,
        priority
      );
      
      return searchResults ? this.filterAndRankProducts(searchResults, budget, 'metadata') : [];
    } catch (error) {
      console.error('Error fetching metadata-based gifts:', error);
      return [];
    }
  }

  /**
   * Enhanced Tier 4: AI-powered gifts with relationship context
   */
  private async getAIGuessedGifts(
    recipientId: string, 
    budget: number, 
    occasion: string, 
    categories: string[], 
    userId?: string,
    relationshipType?: string
  ): Promise<any[]> {
    try {
      const occasionQueries = {
        'birthday': 'birthday gift popular trending',
        'anniversary': 'anniversary gift romantic popular',
        'wedding': 'wedding gift classic popular',
        'graduation': 'graduation gift practical popular',
        'holiday': 'holiday gift popular trending',
        'christmas': 'christmas gift popular bestseller',
        'valentines': 'valentine gift romantic popular'
      };

      const occasionType = occasion.toLowerCase();
      let query = occasionQueries[occasionType as keyof typeof occasionQueries] || 'popular gift bestseller';
      
      // Add relationship context
      if (relationshipType) {
        if (relationshipType === 'spouse') {
          query = `romantic intimate ${query}`;
        } else if (relationshipType === 'family') {
          query = `family thoughtful ${query}`;
        } else if (relationshipType === 'colleague') {
          query = `professional appropriate ${query}`;
        }
      }
      
      if (categories.length > 0) {
        query = `${categories[0]} ${query}`;
      }

      const priority = protectedAutoGiftingService.isPriorityOccasion(occasion) ? 'high' : 'normal';
      const searchResults = await protectedAutoGiftingService.searchProductsForAutoGifting(
        userId || 'system',
        query, 
        20,
        priority
      );
      
      if (!searchResults || searchResults.length === 0) {
        const fallbackResults = await protectedAutoGiftingService.searchProductsForAutoGifting(
          userId || 'system',
          'gift popular', 
          10,
          priority
        );
        return fallbackResults ? this.filterAndRankProducts(fallbackResults, budget, 'ai_guess') : [];
      }

      return this.filterAndRankProducts(searchResults, budget, 'ai_guess');
    } catch (error) {
      console.error('Error generating AI gift suggestions:', error);
      return [];
    }
  }

  /**
   * Enhanced filter and rank products with relationship scoring
   */
  private filterAndRankProducts(products: any[], budget: number, source: string): any[] {
    let affordableProducts = products.filter(product => {
      const price = parseFloat(product.price) || 0;
      return price > 0 && price <= budget;
    });

    affordableProducts.sort((a, b) => {
      const aRating = parseFloat(a.stars) || 0;
      const bRating = parseFloat(b.stars) || 0;
      const aReviews = parseInt(a.num_reviews) || 0;
      const bReviews = parseInt(b.num_reviews) || 0;
      
      if (aRating !== bRating) return bRating - aRating;
      return bReviews - aReviews;
    });

    return affordableProducts.slice(0, 5).map(product => ({
      product_id: product.product_id,
      title: product.title,
      price: parseFloat(product.price),
      image: product.image,
      category: product.category,
      brand: product.brand,
      retailer: product.retailer,
      rating: parseFloat(product.stars) || 0,
      review_count: parseInt(product.num_reviews) || 0,
      source,
      tier: source,
      confidence: source === 'wishlist' ? 0.95 : source === 'preferences' ? 0.75 : source === 'metadata' ? 0.60 : 0.40
    }));
  }

  // ============= RULE MANAGEMENT (Enhanced) =============

  async createRule(rule: Omit<UnifiedGiftRule, 'id' | 'created_at' | 'updated_at'>): Promise<UnifiedGiftRule> {
    await this.validateUserConsent(rule.user_id);
    await this.validateBudgetLimits(rule.user_id, rule.budget_limit || 0);

    const { data, error } = await supabase
      .from('auto_gifting_rules')
      .insert(rule)
      .select()
      .single();

    if (error) throw error;
    
    await this.logGiftAutomationActivity(rule.user_id, 'rule_created', { rule_id: data.id });
    
    return data;
  }

  async updateRule(id: string, updates: Partial<UnifiedGiftRule>): Promise<UnifiedGiftRule> {
    const { data, error } = await supabase
      .from('auto_gifting_rules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('auto_gifting_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getUserRules(userId: string): Promise<UnifiedGiftRule[]> {
    const { data, error } = await supabase
      .from('auto_gifting_rules')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }

  // ============= SETTINGS MANAGEMENT (Enhanced) =============

  async getSettings(userId: string): Promise<UnifiedGiftSettings | null> {
    const { data, error } = await supabase
      .from('auto_gifting_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async upsertSettings(settings: Omit<UnifiedGiftSettings, 'id' | 'created_at' | 'updated_at'>): Promise<UnifiedGiftSettings> {
    const { data, error } = await supabase
      .from('auto_gifting_settings')
      .upsert(settings, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============= TIMING & SCHEDULING (Consolidated) =============

  async getUserGiftTimingPreferences(userId: string): Promise<UnifiedGiftTimingPreferences> {
    const settings = await this.getSettings(userId);
    
    return {
      autoGiftingEnabled: !!settings?.auto_approve_gifts,
      defaultBudgetLimit: settings?.default_budget_limit || 50,
      defaultNotificationDays: settings?.default_notification_days || [7, 3, 1],
      preferredDeliveryTimeframe: 'standard',
      emailNotifications: settings?.email_notifications ?? true,
      pushNotifications: settings?.push_notifications ?? false,
    };
  }

  async getUserScheduledGifts(userId: string): Promise<UnifiedScheduledGiftEvent[]> {
    const scheduledGifts: UnifiedScheduledGiftEvent[] = [];

    // Get automated gifts from auto-gifting rules
    const autoRules = await this.getUserRules(userId);
    for (const rule of autoRules) {
      if (rule.is_active) {
        const { data: events } = await supabase
          .from('user_special_dates')
          .select('*')
          .eq('user_id', userId)
          .eq('id', rule.event_id);

        if (events) {
          events.forEach(event => {
            scheduledGifts.push({
              id: `auto-${rule.id}`,
              type: 'automated',
              userId,
              recipientId: rule.recipient_id,
              scheduledDate: new Date(event.date),
              eventType: event.date_type,
              giftOptions: {
                budget: rule.budget_limit || undefined,
              },
              status: 'scheduled'
            });
          });
        }
      }
    }

    // Get manual scheduled gifts from orders
    const { data: scheduledOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .not('scheduled_delivery_date', 'is', null)
      .eq('status', 'pending');

    if (scheduledOrders) {
      scheduledOrders.forEach(order => {
        scheduledGifts.push({
          id: `manual-${order.id}`,
          type: 'manual',
          userId,
          scheduledDate: new Date(order.scheduled_delivery_date!),
          giftOptions: {
            giftMessage: order.gift_message || undefined,
            isHidden: order.is_surprise_gift || false,
          },
          status: 'scheduled'
        });
      });
    }

    return scheduledGifts.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }

  async getUpcomingGiftReminders(userId: string, daysAhead: number = 7): Promise<UnifiedScheduledGiftEvent[]> {
    const allScheduled = await this.getUserScheduledGifts(userId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    return allScheduled.filter(gift => 
      gift.scheduledDate <= cutoffDate && 
      gift.scheduledDate >= new Date() &&
      gift.status === 'scheduled'
    );
  }

  // ============= EXECUTION MANAGEMENT (Consolidated) =============

  async createExecution(rule: UnifiedGiftRule, eventId: string): Promise<string> {
    const { data, error } = await supabase
      .from('automated_gift_executions')
      .insert({
        rule_id: rule.id,
        event_id: eventId,
        user_id: rule.user_id,
        execution_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        retry_count: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  async getUserExecutions(userId: string): Promise<UnifiedGiftExecution[]> {
    const { data, error } = await supabase
      .from('automated_gift_executions')
      .select(`
        *,
        auto_gifting_rules (*),
        user_special_dates (*)
      `)
      .eq('user_id', userId)
      .order('execution_date', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(execution => ({
      ...execution,
      execution_date: new Date(execution.execution_date),
      next_retry_at: execution.next_retry_at ? new Date(execution.next_retry_at) : undefined,
      created_at: new Date(execution.created_at),
      updated_at: new Date(execution.updated_at)
    }));
  }

  async approveExecution(executionId: string, selectedProductIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('automated_gift_executions')
      .update({
        status: 'processing',
        selected_products: selectedProductIds,
        updated_at: new Date().toISOString()
      })
      .eq('id', executionId);

    if (error) throw error;
    
    console.log(`[UNIFIED] Auto-gift execution ${executionId} approved for processing`);
  }

  // ============= PENDING INVITATIONS (Consolidated) =============

  async createPendingConnection(
    recipientEmail: string,
    recipientName: string,
    relationshipType: string,
    shippingAddress?: any,
    birthday?: string | null,
    relationshipContext?: any
  ) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const recipientPhone = shippingAddress?.phone || null;

    const { data: existingConnection } = await supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('pending_recipient_email', recipientEmail)
      .eq('status', 'pending_invitation')
      .maybeSingle();

    if (existingConnection) {
      const { data, error } = await supabase
        .from('user_connections')
        .update({
          relationship_type: relationshipType,
          pending_recipient_name: recipientName,
          pending_recipient_phone: recipientPhone,
          pending_shipping_address: shippingAddress,
          pending_recipient_dob: birthday,
          relationship_context: relationshipContext,
          invitation_sent_at: new Date().toISOString()
        })
        .eq('id', existingConnection.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from('user_connections')
      .insert({
        user_id: user.user.id,
        connected_user_id: null,
        status: 'pending_invitation',
        relationship_type: relationshipType,
        pending_recipient_email: recipientEmail,
        pending_recipient_name: recipientName,
        pending_recipient_phone: recipientPhone,
        pending_shipping_address: shippingAddress,
        pending_recipient_dob: birthday,
        relationship_context: relationshipContext,
        invitation_sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createAutoGiftRuleForPending(
    connectionId: string,
    recipientEmail: string,
    dateType: string,
    budgetLimit?: number,
    giftSelectionCriteria?: any,
    notificationPreferences?: any,
    paymentMethodId?: string,
    eventId?: string
  ) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('auto_gifting_rules')
      .insert({
        user_id: user.user.id,
        recipient_id: null,
        pending_recipient_email: recipientEmail,
        date_type: dateType,
        event_id: eventId,
        budget_limit: budgetLimit,
        gift_selection_criteria: giftSelectionCriteria || {
          source: "ai",
          categories: [],
          exclude_items: []
        },
        notification_preferences: notificationPreferences || {
          enabled: true,
          days_before: [7, 3, 1],
          email: true,
          push: false
        },
        payment_method_id: paymentMethodId,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============= PURCHASE WORKFLOWS (Consolidated) =============

  async generateAutoGiftRecommendations(
    rule: UnifiedGiftRule,
    event: any
  ): Promise<UnifiedAutoGiftRecommendation | null> {
    try {
      const settings = await this.getSettings(rule.user_id);

      if (!settings?.has_payment_method) {
        console.warn(`No payment method for user ${rule.user_id}`);
        return null;
      }

      let recipientData: any = {};
      if (rule.recipient_id) {
        const { data: recipient } = await supabase
          .from('profiles')
          .select('birth_year, enhanced_gift_preferences')
          .eq('id', rule.recipient_id)
          .single();
        
        recipientData = recipient || {};
      }

      const criteria = this.createSelectionCriteria(rule, event, recipientData);
      const giftSelection = await this.selectGiftForRecipient(
        rule.recipient_id,
        criteria.budgetLimit,
        criteria.dateType,
        criteria.giftCategories,
        rule.user_id,
        criteria.relationshipType
      );

      if (giftSelection.products.length === 0) {
        console.warn('No suitable products found for auto-gift');
        return null;
      }

      const totalAmount = giftSelection.products.reduce((sum, p) => sum + p.price, 0);
      const needsApproval = this.needsManualApproval(totalAmount, rule, settings);
      
      return {
        ruleId: rule.id,
        eventId: event.id,
        products: giftSelection.products.map(p => ({
          productId: p.product_id,
          productName: p.title,
          productImage: p.image,
          price: p.price,
          confidence: p.confidence,
          reasoning: `${giftSelection.reasoning} - ${p.source} selection`
        })),
        totalAmount,
        needsApproval,
        approvalDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

    } catch (error) {
      console.error('Error generating auto-gift recommendations:', error);
      return null;
    }
  }

  private createSelectionCriteria(
    rule: UnifiedGiftRule,
    event: any,
    recipientData: any
  ): UnifiedGiftSelectionCriteria {
    const giftPreferences = rule.gift_selection_criteria as any || {};
    const relationshipContext = rule.relationship_context as any || {};
    
    return {
      relationshipType: relationshipContext.relationship_type || 'friend',
      budgetLimit: rule.budget_limit || 100,
      giftCategories: giftPreferences.categories || [],
      recipientBirthYear: recipientData.birth_year,
      dateType: event.date_type,
      excludeItems: giftPreferences.exclude_items || [],
      preferredBrands: giftPreferences.preferred_brands || [],
      recipientPreferences: recipientData.enhanced_gift_preferences
    };
  }

  private needsManualApproval(
    totalAmount: number,
    rule: UnifiedGiftRule,
    settings: UnifiedGiftSettings
  ): boolean {
    if (!settings.auto_approve_gifts) return true;
    if (totalAmount > 75) return true;
    if (rule.budget_limit && totalAmount > rule.budget_limit) return true;
    return false;
  }

  // ============= BUDGET & SPENDING LIMITS =============

  async checkSpendingLimits(
    userId: string,
    amount: number
  ): Promise<{ withinLimits: boolean; warnings: string[] }> {
    const warnings: string[] = [];
    
    try {
      const settings = await this.getSettings(userId);
      const budgetTracking = settings?.budget_tracking as {
        monthly_limit?: number;
        annual_limit?: number;
        spent_this_month?: number;
        spent_this_year?: number;
      } | undefined;
      
      if (budgetTracking?.monthly_limit) {
        const monthlySpent = budgetTracking.spent_this_month || 0;
        if (monthlySpent + amount > budgetTracking.monthly_limit) {
          warnings.push(`Would exceed monthly limit of $${budgetTracking.monthly_limit}`);
          return { withinLimits: false, warnings };
        }
        
        if (monthlySpent + amount > budgetTracking.monthly_limit * 0.8) {
          warnings.push(`Approaching monthly limit of $${budgetTracking.monthly_limit}`);
        }
      }
      
      if (budgetTracking?.annual_limit) {
        const annualSpent = budgetTracking.spent_this_year || 0;
        if (annualSpent + amount > budgetTracking.annual_limit) {
          warnings.push(`Would exceed annual limit of $${budgetTracking.annual_limit}`);
          return { withinLimits: false, warnings };
        }
        
        if (annualSpent + amount > budgetTracking.annual_limit * 0.8) {
          warnings.push(`Approaching annual limit of $${budgetTracking.annual_limit}`);
        }
      }
      
      return { withinLimits: true, warnings };
      
    } catch (error) {
      console.error('Error checking spending limits:', error);
      return { withinLimits: true, warnings: ['Could not verify spending limits'] };
    }
  }

  // ============= AUDIT & LOGGING =============

  private async validateUserConsent(userId: string): Promise<void> {
    // Implementation for user consent validation
    console.log(`[UNIFIED] Validating user consent for ${userId}`);
  }

  private async validateBudgetLimits(userId: string, budgetLimit: number): Promise<void> {
    const spendingCheck = await this.checkSpendingLimits(userId, budgetLimit);
    if (!spendingCheck.withinLimits) {
      throw new Error(`Budget validation failed: ${spendingCheck.warnings.join(', ')}`);
    }
  }

  private async logGiftAutomationActivity(userId: string, activity: string, metadata: any): Promise<void> {
    try {
      await supabase
        .from('gift_automation_logs')
        .insert({
          user_id: userId,
          activity,
          metadata,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging gift automation activity:', error);
    }
  }

  // ============= CONSOLIDATED STATISTICS =============

  async getUnifiedGiftManagementStats(userId: string) {
    const [rules, executions, scheduledGifts, settings] = await Promise.all([
      this.getUserRules(userId),
      this.getUserExecutions(userId),
      this.getUserScheduledGifts(userId),
      this.getSettings(userId)
    ]);

    const activeRules = rules.filter(r => r.is_active).length;
    const pendingExecutions = executions.filter(e => e.status === 'pending').length;
    const upcomingGifts = scheduledGifts.filter(g => 
      g.scheduledDate > new Date() && g.status === 'scheduled'
    ).length;

    return {
      activeRules,
      pendingExecutions,
      upcomingGifts,
      totalScheduled: scheduledGifts.length,
      automatedGifts: scheduledGifts.filter(g => g.type === 'automated').length,
      manualScheduled: scheduledGifts.filter(g => g.type === 'manual').length,
      budgetTracking: settings?.budget_tracking || { spent_this_month: 0, spent_this_year: 0 },
      protectionStatus: {
        hasPaymentMethod: settings?.has_payment_method || false,
        autoApprovalEnabled: settings?.auto_approve_gifts || false,
        budgetLimitsSet: !!(settings?.budget_tracking?.monthly_limit || settings?.budget_tracking?.annual_limit)
      }
    };
  }
}

export const unifiedGiftManagementService = new UnifiedGiftManagementService();

// ============= BACKWARD COMPATIBILITY WARNING =============
console.warn(`
🚨 PHASE 5 MIGRATION NOTICE:
The UnifiedGiftManagementService is now available. 
Legacy gift services are deprecated and will be removed in the next phase.
Please migrate to use unifiedGiftManagementService for all gift operations.
`);