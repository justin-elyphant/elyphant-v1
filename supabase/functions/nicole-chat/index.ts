import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📨 Nicole chat request received");
    const requestData = await req.json();
    console.log("Enhanced Nicole chat request with CTA button system:", JSON.stringify(requestData, null, 2));

    const { message, context, enhancedFeatures } = requestData;

    if (!message) {
      throw new Error('Message is required');
    }

    // Validate required environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log("Sending Enhanced Zinc API request to OpenAI with CTA button system");

    // Extract conversation history from context
    const conversationHistory = context?.previousMessages || [];
    const isDynamicGreeting = message === '__START_DYNAMIC_CHAT__';
    console.log(`🎯 Dynamic greeting mode: ${isDynamicGreeting}`);
    console.log(`👤 Current user ID: ${context?.currentUserId || 'not provided'}`);

    // Initialize Supabase client for user profile lookup
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user profile for personalization
    let userProfile = null;
    if (context?.currentUserId) {
      try {
        console.log(`🔍 Looking up user profile for ID: ${context.currentUserId}`);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, username, gift_preferences, data_sharing_settings, wishlists')
          .eq('id', context.currentUserId)
          .single();
        
        if (profileError) {
          console.error('❌ Error querying user profile:', profileError);
        } else if (profileData) {
          userProfile = profileData;
          console.log('✅ User profile loaded for personalization:', { 
            id: profileData.id, 
            name: profileData.name,
            username: profileData.username,
            hasInterests: !!profileData.gift_preferences && profileData.gift_preferences.length > 0,
            hasWishlists: !!profileData.wishlists && profileData.wishlists.length > 0
          });
          
          // Store profile data for later interest and wishlist extraction
          if (profileData.gift_preferences && profileData.data_sharing_settings) {
            userProfile.storedInterests = profileData.gift_preferences.map((pref: any) => {
              if (typeof pref === 'string') return pref;
              if (typeof pref === 'object' && pref.category) return pref.category;
              return '';
            }).filter(Boolean);
            userProfile.giftPrefsSharing = profileData.data_sharing_settings?.gift_preferences;
          }

          // Store wishlist data for later extraction
          if (profileData.wishlists && profileData.data_sharing_settings) {
            userProfile.storedWishlists = profileData.wishlists;
            userProfile.wishlistsSharing = profileData.data_sharing_settings?.gift_preferences; // Using gift_preferences privacy for wishlists
          }
        } else {
          console.log('⚠️ No profile data found for user ID:', context.currentUserId);
        }
      } catch (profileError) {
        console.error('❌ Exception loading user profile:', profileError);
      }
    } else {
      console.log('⚠️ No currentUserId provided in context');
    }

    // Build enriched context with user connections awareness
    let enrichedContext = { ...(context || {}) } as any;
    try {
      if (enrichedContext.currentUserId) {
        const uid = enrichedContext.currentUserId as string;
        console.log(`🔗 Fetching connections for user: ${uid}`);
        const { data: connections, error: connError } = await supabase
          .from('user_connections')
          .select('id, user_id, connected_user_id, status, relationship_type')
          .or(`user_id.eq.${uid},connected_user_id.eq.${uid}`)
          .eq('status', 'accepted');

        if (connError) {
          console.error('❌ Error loading connections:', connError);
        }

        const otherIds = Array.from(new Set((connections || []).map((c: any) => c.user_id === uid ? c.connected_user_id : c.user_id)));

        const profilesMap = new Map<string, any>();
        if (otherIds.length) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, username')
            .in('id', otherIds);
          if (profilesError) {
            console.error('❌ Error loading profiles for connections:', profilesError);
          } else {
            profiles?.forEach((p: any) => profilesMap.set(p.id, p));
          }
        }

        const userConnections = (connections || []).map((c: any) => {
          const otherId = c.user_id === uid ? c.connected_user_id : c.user_id;
          const p = profilesMap.get(otherId);
          return {
            userId: otherId,
            name: p?.name || null,
            username: p?.username || null,
            relationshipType: c.relationship_type,
            status: c.status
          };
        });

        enrichedContext.userConnections = userConnections;
        enrichedContext.hasConnections = userConnections.length > 0;

        // Extract user stored interests if privacy allows
        if (userProfile?.storedInterests && userProfile?.giftPrefsSharing) {
          const giftPrefsSharing = userProfile.giftPrefsSharing;
          // Allow access to interests if sharing is public or friends (Nicole is acting as user's assistant)
          if (giftPrefsSharing === 'public' || giftPrefsSharing === 'friends') {
            if (userProfile.storedInterests.length > 0) {
              enrichedContext.userStoredInterests = userProfile.storedInterests;
              console.log('✅ User stored interests loaded:', userProfile.storedInterests);
            }
          } else {
            console.log('🔒 User interests access restricted by privacy settings');
          }
        }

        // Extract user wishlists if privacy allows
        if (userProfile?.storedWishlists && userProfile?.wishlistsSharing) {
          const wishlistsSharing = userProfile.wishlistsSharing;
          // Allow access to wishlists if sharing is public or friends (Nicole is acting as user's assistant)
          if (wishlistsSharing === 'public' || wishlistsSharing === 'friends') {
            if (userProfile.storedWishlists.length > 0) {
              const wishlistSummary = userProfile.storedWishlists.map((wishlist: any) => ({
                id: wishlist.id,
                title: wishlist.title || 'Untitled Wishlist',
                itemCount: wishlist.items?.length || 0,
                isPublic: wishlist.is_public || false
              }));
              enrichedContext.userWishlists = wishlistSummary;
              enrichedContext.hasWishlists = true;
              console.log('✅ User wishlists loaded:', wishlistSummary);
            }
          } else {
            console.log('🔒 User wishlists access restricted by privacy settings');
          }
        }

        // Try to detect if the message mentions one of the connections by name (avoid pronoun false-positives)
        const PRONOUN_STOPWORDS = new Set(['his','her','their','them','him','she','he','theirs','hers','herself','himself','someone','anyone','they']);
        const candidates: string[] = [];
        if (typeof enrichedContext.recipient === 'string') {
          const r = String(enrichedContext.recipient).toLowerCase().trim();
          if (r && !PRONOUN_STOPWORDS.has(r)) candidates.push(enrichedContext.recipient);
        }
        
        // Enhanced pattern matching for connection detection including connection status queries
        const nameMatches = [
          message.match(/friend\s+([A-Za-z][A-Za-z'-]+)/i),
          message.match(/\bfor\s+([A-Z][a-zA-Z'-]+)/),
          // New patterns for connection status queries
          message.match(/connected\s+to\s+([A-Za-z][A-Za-z'\s-]+?)(?:\s|$|\?)/i),
          message.match(/connection\s+(?:with|to)\s+([A-Za-z][A-Za-z'\s-]+?)(?:\s|$|\?)/i),
          message.match(/(?:am\s+I|I'm)\s+connected\s+to\s+([A-Za-z][A-Za-z'\s-]+?)(?:\s|$|\?)/i),
          message.match(/check\s+connection\s+(?:with|to)?\s*([A-Za-z][A-Za-z'\s-]+?)(?:\s|$|\?)/i),
          message.match(/see\s+if.*connected.*to\s+([A-Za-z][A-Za-z'\s-]+?)(?:\s|$|\?)/i)
        ];
        
        for (const match of nameMatches) {
          if (match?.[1]) {
            const extractedName = match[1].trim();
            const n = extractedName.toLowerCase();
            if (!PRONOUN_STOPWORDS.has(n)) candidates.push(extractedName);
          }
        }

        const normalize = (s: string) => s.toLowerCase().trim();
        const detectedMatches = userConnections.filter((uc: any) => {
          const full = uc.name || '';
          const first = full.split(' ')[0] || '';
          const uname = uc.username || '';
          return candidates.some(c => {
            const n = normalize(c);
            return (normalize(first) === n) || normalize(full).includes(n) || normalize(uname).includes(n);
          });
        });

        // Check if this is a connection status query
        const isConnectionQuery = /\b(connected|connection)\b/i.test(message) && 
                                 /(see if|check|am I|I'm|status|with|to)\b/i.test(message);
        
        if (detectedMatches.length) {
          enrichedContext.mentionedConnection = detectedMatches[0];
          enrichedContext.detectedConnections = detectedMatches;
          enrichedContext.isConnectionStatusQuery = isConnectionQuery;
          console.log('✅ Detected mentioned connection:', enrichedContext.mentionedConnection);
          
          // Fetch full recipient profile data for context awareness
          try {
            const recipientUserId = detectedMatches[0].userId;
            console.log(`🔍 Fetching recipient profile data for: ${detectedMatches[0].name} (${recipientUserId})`);
            
            const { data: recipientProfile, error: recipientError } = await supabase
              .from('profiles')
              .select(`
                id, name, username, gift_preferences, data_sharing_settings, interests,
                wishlists:wishlists(id, title, is_public, items:wishlist_items(id, product_id, title)),
                special_dates:user_special_dates(id, date, date_type)
              `)
              .eq('id', recipientUserId)
              .single();

            if (recipientError) {
              console.error('❌ Error fetching recipient profile:', recipientError);
            } else if (recipientProfile) {
              console.log('✅ Recipient profile loaded for context awareness');
              
              // Check privacy settings and extract available data
              const recipientContext: any = {
                name: recipientProfile.name,
                username: recipientProfile.username,
                hasProfile: true
              };

              // Extract interests from both interests field and gift_preferences based on privacy settings
              let extractedInterests: string[] = [];
              
              // First check the interests field directly
              if (recipientProfile.interests && Array.isArray(recipientProfile.interests)) {
                extractedInterests = recipientProfile.interests;
                console.log('✅ Recipient interests loaded from interests field:', extractedInterests);
              }
              
              // Also check gift_preferences if available and no direct interests
              if (extractedInterests.length === 0 && recipientProfile.gift_preferences && recipientProfile.data_sharing_settings?.gift_preferences) {
                const sharingLevel = recipientProfile.data_sharing_settings.gift_preferences;
                if (sharingLevel === 'public' || sharingLevel === 'friends') {
                  extractedInterests = recipientProfile.gift_preferences.map((pref: any) => {
                    if (typeof pref === 'string') return pref;
                    if (typeof pref === 'object' && pref.category) return pref.category;
                    return '';
                  }).filter(Boolean);
                  console.log('✅ Recipient interests loaded from gift_preferences:', extractedInterests);
                }
              }
              
              if (extractedInterests.length > 0) {
                recipientContext.interests = extractedInterests;
              }

              // Extract wishlist data based on privacy
              if (recipientProfile.wishlists?.length > 0) {
                const publicWishlists = recipientProfile.wishlists.filter((w: any) => w.is_public);
                const friendsWishlists = recipientProfile.wishlists; // Connected users can see all wishlists
                
                // Use appropriate wishlist set based on connection
                const availableWishlists = friendsWishlists; // Since they're connected
                if (availableWishlists.length > 0) {
                  recipientContext.wishlists = availableWishlists.map((w: any) => ({
                    id: w.id,
                    title: w.title || 'Untitled Wishlist',
                    itemCount: w.items?.length || 0,
                    isPublic: w.is_public
                  }));
                  console.log('✅ Recipient wishlists loaded:', recipientContext.wishlists);
                }
              }

              // Extract special dates (birthdays, etc.)
              if (recipientProfile.special_dates?.length > 0) {
                recipientContext.specialDates = recipientProfile.special_dates.map((date: any) => ({
                  type: date.date_type,
                  date: date.date
                }));
                console.log('✅ Recipient special dates loaded:', recipientContext.specialDates);
              }

              // Store the enriched recipient profile data
              enrichedContext.recipientProfile = recipientContext;
            }
          } catch (error) {
            console.error('❌ Exception fetching recipient profile data:', error);
          }
          
          if (isConnectionQuery) {
            console.log('🔍 Connection status query detected for:', enrichedContext.mentionedConnection.name);
          }
        } else {
          console.log('ℹ️ No direct connection match detected from message.');
          
          // If it's a connection query but no match found, check for name extraction from candidates
          if (isConnectionQuery && candidates.length > 0) {
            enrichedContext.isConnectionStatusQuery = true;
            enrichedContext.queryTargetName = candidates[0];
            console.log('🔍 Connection status query detected for unconnected user:', candidates[0]);
          }
        }
      }
    } catch (e) {
      console.error('❌ Exception while enriching context with connections:', e);
    }

    // Early: handle privacy-aware birthday questions directly (skip OpenAI)
    const lowerMsg = (message || '').toLowerCase();

    const levenshtein = (a: string, b: string) => {
      const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
      for (let i = 0; i <= a.length; i++) dp[i][0] = i;
      for (let j = 0; j <= b.length; j++) dp[0][j] = j;
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + cost
          );
        }
      }
      return dp[a.length][b.length];
    };

    const isBirthdayIntent = (text: string) => {
      if (!text) return false;
      // Fast paths for common variants and synonyms
      if (/\b(birthday|bday|b-day|dob|date of birth|born day)\b/i.test(text)) return true;
      // Fuzzy tolerance for misspellings like "brithday"
      const tokens = text.split(/[^a-z]+/i).filter(Boolean);
      for (const t of tokens) {
        const w = t.toLowerCase();
        if (w.length >= 5) {
          const d = levenshtein(w, 'birthday');
          if (d <= 2) return true;
        }
      }
      return false;
    };

    const mentionsBirthday = isBirthdayIntent(lowerMsg);

    // Resolve target connection if birthday is asked
    if (mentionsBirthday) {
      console.log('🎯 Special date intent detected: birthday');
      let target = (enrichedContext as any)?.mentionedConnection || (enrichedContext as any)?.detectedConnections?.[0] || null;

      // Fallback: try to parse "<name>'s birthday" or "birthday of <name>"
      if (!target && Array.isArray((enrichedContext as any)?.userConnections)) {
        const possessive = message.match(/([A-Za-z][A-Za-z'-]+)\s*'s\s+birthday/i);
        const ofForm = message.match(/birthday\s+of\s+([A-Za-z][A-Za-z'-]+)/i);
        const rawName = (possessive?.[1] || ofForm?.[1])?.toLowerCase();
        if (rawName) {
          const match = (enrichedContext as any).userConnections.find((uc: any) => {
            const full = (uc.name || '').toLowerCase();
            const first = full.split(' ')[0] || '';
            const uname = (uc.username || '').toLowerCase();
            return first === rawName || full.includes(rawName) || uname === rawName;
          });
          if (match) target = match;
        }
      }

      if (target?.userId && (enrichedContext as any)?.currentUserId) {
        // Fetch target profile
        const { data: targetProfile, error: targetErr } = await supabase
          .from('profiles')
          .select('id, name, dob, data_sharing_settings')
          .eq('id', target.userId)
          .maybeSingle();

        if (targetErr) {
          console.error('❌ Error loading target profile for birthday:', targetErr);
        }

        const viewerId = (enrichedContext as any).currentUserId as string;
        const privacy = (targetProfile as any)?.data_sharing_settings?.dob || 'friends';

        // Privacy check helper
        let allowed = false;
        if (targetProfile?.id === viewerId) {
          allowed = true;
        } else if (privacy === 'public') {
          allowed = true;
        } else if (privacy === 'friends') {
          const { data: connRes, error: connErr } = await supabase
            .rpc('are_users_connected', { user_id_1: viewerId, user_id_2: targetProfile?.id });
          if (connErr) {
            console.error('❌ Error checking connection status:', connErr);
          }
          allowed = Boolean(connRes);
        } else {
          // 'private' or unknown
          allowed = false;
        }

        // Format dob as "Month Day" with robust parsing
        const formatMonthDay = (dob?: string | null): string | null => {
          if (!dob) return null;
          try {
            const raw = String(dob).trim();
            console.log(`📅 Formatting DOB raw: ${raw}`);
            if (!raw) return null;

            const months = [
              'January','February','March','April','May','June',
              'July','August','September','October','November','December'
            ];
            const monthMap: Record<string, number> = {
              jan:1, january:1,
              feb:2, february:2,
              mar:3, march:3,
              apr:4, april:4,
              may:5,
              jun:6, june:6,
              jul:7, july:7,
              aug:8, august:8,
              sep:9, sept:9, september:9,
              oct:10, october:10,
              nov:11, november:11,
              dec:12, december:12
            };

            let s = raw;
            const tIndex = s.indexOf('T');
            if (tIndex > 0) s = s.slice(0, tIndex);

            let m: number | null = null;
            let d: number | null = null;

            // Word month forms: "Feb 19" / "February 19" or "19 Feb"
            const word = s.replace(',', '').trim();
            let match = word.match(/^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})$/i);
            if (!match) {
              match = word.match(/^(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)$/i);
              if (match) {
                const dd = parseInt(match[1], 10);
                const mm = monthMap[match[2].toLowerCase() as keyof typeof monthMap];
                d = isNaN(dd) ? null : dd;
                m = mm || null;
              }
            } else {
              const mm = monthMap[match[1].toLowerCase() as keyof typeof monthMap];
              const dd = parseInt(match[2], 10);
              m = mm || null;
              d = isNaN(dd) ? null : dd;
            }

            // Delimited numeric forms: "MM-DD", "MM/DD", "YYYY-MM-DD", "YYYY/MM/DD"
            if (m === null || d === null) {
              const parts = s.split(/[-\/]/).filter(Boolean);
              if (parts.length === 2) {
                const mm = parseInt(parts[0], 10);
                const dd = parseInt(parts[1], 10);
                m = isNaN(mm) ? null : mm;
                d = isNaN(dd) ? null : dd;
              } else if (parts.length === 3) {
                if (/^\d{4}$/.test(parts[0])) {
                  const mm = parseInt(parts[1], 10);
                  const dd = parseInt(parts[2], 10);
                  m = isNaN(mm) ? null : mm;
                  d = isNaN(dd) ? null : dd;
                } else {
                  const mm = parseInt(parts[0], 10);
                  const dd = parseInt(parts[1], 10);
                  m = isNaN(mm) ? null : mm;
                  d = isNaN(dd) ? null : dd;
                }
              }
            }

            // Compact numeric forms: "YYYYMMDD" or "MMDD"
            if (m === null || d === null) {
              if (/^\d{8}$/.test(s)) {
                const mm = parseInt(s.slice(4, 6), 10);
                const dd = parseInt(s.slice(6, 8), 10);
                m = isNaN(mm) ? null : mm;
                d = isNaN(dd) ? null : dd;
              } else if (/^\d{4}$/.test(s)) {
                const mm = parseInt(s.slice(0, 2), 10);
                const dd = parseInt(s.slice(2, 4), 10);
                m = isNaN(mm) ? null : mm;
                d = isNaN(dd) ? null : dd;
              }
            }

            if (m && d && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
              return `${months[m - 1]} ${d}`;
            }
            return null;
          } catch (_) {
            return null;
          }
        };

        let reply: string;
        if (allowed && targetProfile?.dob) {
          const pretty = formatMonthDay(targetProfile.dob);
          if (pretty) {
            reply = `${target?.name || 'Your connection'}'s birthday is ${pretty}.`;
            console.log('🎉 Birthday found and shareable:', { targetId: targetProfile.id, pretty });
          } else {
            reply = `I couldn't parse ${target?.name ? target.name + "'s" : 'their'} birthday.`;
            console.log('⚠️ Unable to format DOB string:', targetProfile?.dob);
          }
        } else if (!allowed) {
          reply = "I can’t share that due to privacy settings.";
          console.log('🔒 Privacy check: blocked');
        } else {
          reply = `I don’t have a birthday on file for ${target?.name || 'that person'}.`;
          console.log('ℹ️ No birthday on file');
        }

        const directPayload = {
          message: reply,
          context: { ...(enrichedContext as any) },
          capability: (enrichedContext as any)?.capability || 'conversation',
          actions: ['chat'],
          showSearchButton: false,
          showProductTiles: false,
          metadata: {
            confidence: 0.95,
            suggestedFollowups: [],
            connectionMatch: target || null
          }
        };

        return new Response(JSON.stringify(directPayload), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Extract user's first name for personalization
    const userFirstName = userProfile?.name?.split(' ')[0] || null;
    console.log(`👋 User first name for greeting: ${userFirstName || 'not found'}`);

    // Enhanced budget parsing function
    const parseBudgetFromMessage = (message: string, currentContext: any) => {
      const budgetPatterns = [
        /\$(\d+(?:,\d+)?)\s*(?:to|[-–])\s*\$(\d+(?:,\d+)?)/i,
        /(\d+(?:,\d+)?)\s*(?:to|[-–])\s*(\d+(?:,\d+)?)\s*(?:dollars?|bucks?|\$)/i,
        /budget.*?\$(\d+(?:,\d+)?)/i,
        /around\s*\$(\d+(?:,\d+)?)/i,
        /under\s*\$(\d+(?:,\d+)?)/i,
        /less\s+than\s*\$(\d+(?:,\d+)?)/i,
        /up\s+to\s*\$(\d+(?:,\d+)?)/i,
        /maximum.*?\$(\d+(?:,\d+)?)/i,
        /max.*?\$(\d+(?:,\d+)?)/i
      ];

      let budget = currentContext?.budget;
      
      for (const pattern of budgetPatterns) {
        const match = message.match(pattern);
        if (match) {
          if (match[2]) {
            const min = parseInt(match[1].replace(',', ''));
            const max = parseInt(match[2].replace(',', ''));
            budget = [min, max];
            console.log(`Budget range detected: $${min}-$${max}`);
            break;
          } else if (match[1]) {
            const amount = parseInt(match[1].replace(',', ''));
            if (message.toLowerCase().includes('under') || message.toLowerCase().includes('less than') || message.toLowerCase().includes('up to') || message.toLowerCase().includes('max')) {
              budget = [0, amount];
              console.log(`Maximum budget detected: up to $${amount}`);
            } else {
              budget = [amount * 0.8, amount * 1.2];
              console.log(`Approximate budget detected: around $${amount}`);
            }
            break;
          }
        }
      }
      
      return budget;
    };

    // Sophisticated system prompt with comprehensive context integration and personalization
    const systemPrompt = `You are Nicole, a warm and intelligent gift advisor. You understand gifting psychology, have access to marketplace data, connection insights, and user preferences.

PERSONALIZATION:
- User's First Name: ${userFirstName ? `"${userFirstName}"` : 'Not available - use casual fallback'}
- CRITICAL: Always use the user's first name "${userFirstName || 'Hey'}" in greetings and throughout conversation
- If no first name available, use casual alternatives like "Hey there!" or "Hi!"
- Make every interaction feel personal and warm, never formal or GPT-ish
- Reference their name naturally in responses

PERSONALITY: Super casual, friendly, enthusiastic about gifts, knowledgeable about trends, conversational but focused. NEVER formal or robotic.

CORE MISSION: Transform gift-giving from stressful to delightful through intelligent recommendations.

ENHANCED CAPABILITIES:
- Connection Integration: Access to user's friends/family for personalized recommendations
- Connection Status Queries: Can check if user is connected to specific people
- Wishlist Analysis: Deep insights into recipient preferences and interests
- Multi-category Search: Sophisticated product discovery across categories
- Auto-gifting Intelligence: Proactive gift suggestions with timing optimization
- Brand Recognition: Advanced brand preference detection and matching

CONVERSATION INTELLIGENCE:
- Detect auto-gifting intent early in conversation
- Understand relationship contexts and gift appropriateness
- Recognize occasions and timing preferences
- Build comprehensive recipient profiles through conversation
- Handle connection status queries with clear responses

CONNECTION STATUS QUERIES:
When user asks about connections (e.g. "Can you see if I'm connected to [Name]?"):
- Check user's connections for exact or partial name matches
- If connected: "Yes! You're connected to [Name]. Would you like me to help you find a gift for them?"
- If not connected: "I don't see [Name] in your connections. You can search for them in the Social Hub to send a connection request, or I can help you find gifts for them anyway!"
- Always offer to help with gift-giving regardless of connection status
- Be helpful and positive, never just give a yes/no answer

AUTO-GIFT CONVERSATION FLOW (when auto-gifting intent detected):
1. GREETING → assess auto-gifting vs one-time gift intent
2. RECIPIENT_ANALYSIS → who needs auto-gifting setup
3. OCCASION_MAPPING → what events to automate  
4. BUDGET_OPTIMIZATION → intelligent budget recommendations
5. PREFERENCE_CAPTURE → recipient interests and style
6. CONFIRMATION → auto-gift rule summary and activation

Key Auto-Gift Triggers:
- "never want to forget"
- "always remember"  
- "automatically"
- "every year/month"
- "remind me"
- "set up recurring"

Auto-Gift Response Examples:
- "I can set up auto-gifting so you never miss [occasion] for [name]!"
- "Let me help you automate gifts for [name] - what occasions matter most?"
- "Perfect! I've set up auto-gifting for [name]. I'll handle [occasion] gifts within your $[budget] budget using their preferences."
- Provide summary and next steps

REGULAR GIFT ADVISOR FLOW (when NOT auto-gifting):
1. GREETING → gather basic needs
2. RECIPIENT_IDENTIFICATION → determine who the gift is for
3. OCCASION_CONTEXT → understand the celebration or reason
4. RELATIONSHIP_ASSESSMENT → gauge closeness and appropriateness
5. BUDGET_DISCUSSION → establish spending comfort zone
6. INTEREST_DISCOVERY → uncover recipient's preferences, hobbies, style
7. RECOMMENDATION_GENERATION → suggest specific products with reasoning
8. REFINEMENT → adjust based on feedback and preferences

ENHANCED CTA BUTTON SYSTEM:
Show search button when these conditions are met:
1. Has recipient information (specific person or general recipient type)
2. Has occasion OR specific interests/categories identified  
3. Has budget range OR can infer reasonable budget
4. Has gathered enough context for meaningful product search

CTA Logic Examples:
✅ SHOW: "birthday gift for my sister who loves art, $50-100 budget"
✅ SHOW: "housewarming gift for coworker, around $30"  
✅ SHOW: "anniversary gift for wife who likes jewelry and wine"
❌ DON'T SHOW: just "looking for a gift" (too vague)
❌ DON'T SHOW: just "birthday coming up" (no recipient context)

CONVERSATION CONTEXT TRACKING:
- Recipient: person or relationship type
- Occasion: celebration, holiday, milestone, just because
- Budget: range, maximum, or general tier (budget/mid-range/luxury)
- Interests: hobbies, passions, style preferences, brands
- Relationship: closeness level affects appropriateness
- Timeline: urgency affects recommendations

USER STORED INTERESTS & WISHLIST CONTEXT AWARENESS:
${enrichedContext?.userStoredInterests?.length > 0 ? `
- User's stored interests from profile: ${JSON.stringify(enrichedContext.userStoredInterests)}
- IMPORTANT: Use these stored interests for personalized suggestions and reference them when making recommendations
- Cross-reference stored interests with conversation mentions for better context
- If no interests mentioned in conversation, proactively suggest based on stored interests
` : '- No stored interests available from user profile (privacy restricted or empty)'}

${enrichedContext?.userWishlists?.length > 0 ? `
- User's existing wishlists: ${JSON.stringify(enrichedContext.userWishlists)}
- IMPORTANT: Reference user's existing wishlists when making suggestions
- Can suggest adding items to specific wishlists by name
- Use wishlist data to understand user's gifting patterns and preferences
- If user has empty wishlists, acknowledge and offer to help populate them
` : '- No wishlists available from user profile (privacy restricted or empty)'}

RECIPIENT PROFILE CONTEXT AWARENESS:
${enrichedContext?.recipientProfile ? `
- Recipient Profile: ${enrichedContext.recipientProfile.name} (@${enrichedContext.recipientProfile.username})
- IMPORTANT: When user asks about recipient's interests or preferences, reference this data
${enrichedContext.recipientProfile.interests?.length > 0 ? `
- Recipient's Known Interests: ${JSON.stringify(enrichedContext.recipientProfile.interests)}
- Use these interests to make contextually aware gift suggestions
- Reference specific interests when explaining recommendations
` : '- No known interests for recipient (privacy restricted or not shared)'}
${enrichedContext.recipientProfile.wishlists?.length > 0 ? `
- Recipient's Wishlists: ${JSON.stringify(enrichedContext.recipientProfile.wishlists)}
- IMPORTANT: When suggesting gifts, mention if items align with their wishlist categories
- Can suggest browsing their wishlist for specific ideas
` : '- No accessible wishlists for recipient (privacy restricted or empty)'}
${enrichedContext.recipientProfile.specialDates?.length > 0 ? `
- Recipient's Special Dates: ${JSON.stringify(enrichedContext.recipientProfile.specialDates)}
- Use this information for occasion-based recommendations and timing
` : '- No special dates available for recipient'}
` : '- No recipient profile data available (no connection mentioned or privacy restricted)'}

SOPHISTICATED CONTEXT VARIABLES:
    ${enrichedContext ? `
- Current recipient: ${enrichedContext.recipient || 'Not specified'}
- Current occasion: ${enrichedContext.occasion || 'Not specified'}  
- Current interests: ${JSON.stringify(enrichedContext.interests || [])}
- User's stored interests: ${JSON.stringify(enrichedContext.userStoredInterests || [])}
- Current brands mentioned: ${JSON.stringify(enrichedContext.detectedBrands || [])}
- Current budget: ${enrichedContext.budget ? `$${enrichedContext.budget[0]}-${enrichedContext.budget[1]}` : 'Not specified'}
- Previous conversation context: ${enrichedContext.previousContext || 'None'}
- User connections available: ${enrichedContext.userConnections?.length || 0}
- User wishlists available: ${enrichedContext.userWishlists?.length || 0}
- User has wishlists: ${enrichedContext.hasWishlists || false}
- User wishlist details: ${enrichedContext.userWishlists ? JSON.stringify(enrichedContext.userWishlists) : 'None'}
- Detected connection match: ${enrichedContext.mentionedConnection?.name || 'None'}
    ` : 'No context provided'}

SOPHISTICATED RESPONSE GUIDELINES:
1. Always be warm, helpful, and enthusiastic about gift-giving
2. Ask follow-up questions to gather missing context efficiently  
3. Provide specific, actionable gift suggestions when possible
4. Explain reasoning behind recommendations
5. Offer alternatives and variations
6. Show excitement about helping create meaningful gift experiences
7. Use natural, conversational language that builds rapport
8. Reference the user's name frequently to maintain personal connection

CONTEXT AWARENESS RULES:
- If recipient is specified, focus on their known preferences
- If occasion is mentioned, tailor suggestions appropriately
- If budget is given, respect those constraints strictly
- If relationship type is known, adjust intimacy level of suggestions
- If timeline is mentioned, factor in delivery considerations

CONVERSATION STATE MANAGEMENT:
- Track what information has been gathered vs still needed
- Build upon previous conversation context seamlessly
- Remember user preferences and patterns across the session
- Gradually build more sophisticated recipient profiles

ADVANCED INTELLIGENCE INTEGRATION:
    - Connection data: "${enrichedContext?.userConnections ? `User has ${enrichedContext.userConnections.length} connections` : 'No connection data'}"
    - Wishlist insights: "${enrichedContext?.userWishlists ? `User has ${enrichedContext.userWishlists.length} wishlists: ${enrichedContext.userWishlists.map(w => `"${w.title}" (${w.itemCount} items)`).join(', ')}` : 'No wishlist data'}"
    - Wishlist engagement: "${enrichedContext?.hasWishlists ? 'User actively creates wishlists - can reference and suggest adding items' : 'User has no wishlists - offer to help create or populate wishlists'}"
    - Dynamic greeting mode: ${isDynamicGreeting ? 'YES - This is a greeting response' : 'NO - Regular conversation'}

STRICT RULE: If hasAskedPickQuestion is YES, DO NOT ask about picking gifts yourself vs handling everything. Move to the next phase.
DYNAMIC GREETING RULE: If dynamic greeting mode is YES, start with a casual, friendly greeting using "${userFirstName ? `Hey ${userFirstName}!` : 'Hey there!'}" and naturally transition into conversation. NEVER use formal phrases like "Hello there! I'm so excited..." - always be casual and natural.

CTA CONTEXT AWARENESS: 
- Selected Intent: ${context?.selectedIntent || 'Not specified'}
- Source: ${context?.source || 'Not specified'}
- If selectedIntent is "giftor" and source is "hero_cta", greet with gift-focused message like "Hey ${userFirstName}! I see you want to start gifting! Who are you shopping for today?"
- If selectedIntent is "giftor", tailor conversation toward gift-giving assistance
- Always acknowledge the user's intent when available

CASUAL LANGUAGE RULE: Always use casual, friendly language. Say "Hey!" not "Hello!", "I'm Nicole" not "I'm so excited to help", "What's up?" not "How may I assist you today?". Keep it conversational and natural, never formal or GPT-ish.

PERSONALIZATION RULE: Use the user's name "${userFirstName || 'there'}" naturally in conversation, but don't repeat it excessively. Only use their name for greetings, important moments, or when it feels natural in conversation flow.

PROACTIVE ENGAGEMENT GUIDELINES:
- When birthday information is shared, suggest scheduling or auto-gifting
- After interests are discovered, suggest search or budget setting  
- When full context is gathered, suggest starting the search
- Always guide users toward the next logical step in their gift-giving journey

PROACTIVE ENGAGEMENT RULES:
- When birthday information is shared, immediately suggest scheduling or auto-gifting
- After interests are discovered, suggest search or budget setting
- When full context is gathered, suggest starting the search
- When connections are mentioned, offer gift exploration or auto-gifting setup
- Always provide clear next steps rather than leaving conversations hanging`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: isDynamicGreeting ? `Start a casual, friendly greeting conversation. ${userFirstName ? `The user's first name is "${userFirstName}" - greet them with "Hey ${userFirstName}!"` : 'No first name available - use "Hey there!" as greeting'}. ${enrichedContext?.selectedIntent === 'giftor' ? `IMPORTANT: The user clicked "Start Gifting" so acknowledge this with something like "I see you want to start gifting! Who are you shopping for?" after the greeting.` : ''} Be casual and natural, never formal.` : message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content;

    if (!aiMessage) {
      throw new Error('No response from OpenAI');
    }

    console.log("✅ AI Response generated:", aiMessage.substring(0, 100) + "...");

    // Context completion analysis for proactive action suggestions
    const analyzeContextCompletion = (context: any, userMessage: string) => {
      const hasRecipient = Boolean(context.recipient || context.mentionedConnection?.name);
      const hasOccasion = Boolean(context.occasion);
      const hasInterests = Boolean(context.interests?.length > 0);
      const hasBudget = Boolean(context.budget);
      const hasBirthday = /birthday/i.test(userMessage) || context.occasion === 'birthday';
      const hasConnectionInfo = Boolean(context.mentionedConnection);

      // Birthday context completion - suggest scheduling after birthday is shared
      if (hasBirthday && hasRecipient && !context.actionSuggested) {
        return {
          shouldSuggestAction: true,
          actionType: 'birthday_scheduling',
          actionPrompt: `Perfect! Now that I know when ${context.mentionedConnection?.name || context.recipient || 'their'} birthday is, would you like me to help you schedule a gift for them? I can either help you pick something specific, or set up auto-gifting so I handle everything for you each year!`,
          nextSteps: ['schedule_gift', 'setup_auto_gifting', 'pick_specific_gift']
        };
      }

      // Interest discovery completion - suggest search when enough context gathered
      if (hasRecipient && hasInterests && !hasBudget && !context.actionSuggested) {
        return {
          shouldSuggestAction: true,
          actionType: 'interest_discovery',
          actionPrompt: `Great! Based on their interests in ${context.interests?.slice(0, 2).join(' and ')}, I can find some perfect gift options. What's your budget range so I can show you the best matches?`,
          nextSteps: ['set_budget', 'show_options_anyway']
        };
      }

      // Full context completion - ready to search
      if (hasRecipient && (hasOccasion || hasInterests) && hasBudget && !context.actionSuggested) {
        return {
          shouldSuggestAction: true,
          actionType: 'full_context',
          actionPrompt: `Perfect! I have everything I need - recipient, ${hasOccasion ? 'occasion' : 'interests'}, and budget. Ready to find the perfect gift?`,
          nextSteps: ['start_search', 'refine_context']
        };
      }

      // Connection discovery completion - suggest gift exploration
      if (hasConnectionInfo && !context.actionSuggested) {
        return {
          shouldSuggestAction: true,
          actionType: 'connection_discovery',
          actionPrompt: `Since you're connected to ${context.mentionedConnection.name}, I can help you find a gift for them! What's the occasion, or should I help you set up auto-gifting for their upcoming events?`,
          nextSteps: ['find_occasion', 'setup_auto_gifting', 'browse_interests']
        };
      }

      return { shouldSuggestAction: false };
    };

    // Enhanced context parsing with sophisticated intelligence
    const updatedContext = {
      ...enrichedContext,
      currentUserId: enrichedContext?.currentUserId,
      conversationPhase: isDynamicGreeting ? 'greeting_completed' : (enrichedContext?.conversationPhase || 'active'),
      capability: enrichedContext?.capability || 'conversation'
    };

    // Apply context completion analysis
    const contextAnalysis = analyzeContextCompletion(updatedContext, message);
    if (contextAnalysis.shouldSuggestAction) {
      updatedContext.actionSuggested = true;
      updatedContext.suggestedAction = contextAnalysis;
    }

    // Parse and extract context from AI message and user message
    const combinedMessage = `${message} ${aiMessage}`.toLowerCase();
    
    // Enhanced budget parsing
    updatedContext.budget = parseBudgetFromMessage(combinedMessage, enrichedContext);

    // Enhanced recipient parsing
    if (!updatedContext.recipient) {
      const recipientPatterns = [
        /(?:for|gift for) (?:my )?(\w+(?:\s+\w+)?)/i,
        /(?:giving|buying|getting) (?:(?:my|a) )?(\w+) (?:a|an|some)/i,
        /(\w+)'s (?:birthday|anniversary|graduation)/i
      ];
      const stopwords = new Set([
        'gift','present','something','anything',
        'his','her','their','them','him','she','he','someone','anyone',
        'hi','hey'
      ]);
      
      for (const pattern of recipientPatterns) {
        const match = combinedMessage.match(pattern);
        if (match && match[1]) {
          const recipient = match[1].trim();
          const candidate = recipient.toLowerCase();
          if (!stopwords.has(candidate) && candidate.length > 2) {
            updatedContext.recipient = recipient;
            break;
          }
        }
      }
    }

    // Enhanced occasion parsing
    if (!updatedContext.occasion) {
      const occasionPatterns = [
        /\b(birthday|anniversary|graduation|wedding|christmas|valentine|mother's day|father's day|housewarming|baby shower|retirement)\b/i,
        /\b(holiday|celebration|special occasion|milestone)\b/i
      ];
      
      for (const pattern of occasionPatterns) {
        const match = combinedMessage.match(pattern);
        if (match) {
          updatedContext.occasion = match[1];
          break;
        }
      }
    }

    // Enhanced interest parsing
    if (!updatedContext.interests) updatedContext.interests = [];
    const interestPatterns = [
      /(?:loves?|likes?|enjoys?|into|interested in|passionate about) ([^,.!?]+)/gi,
      /(?:hobbies?|interests?) (?:include|are) ([^,.!?]+)/gi,
      /really into ([^,.!?]+)/gi
    ];
    
    for (const pattern of interestPatterns) {
      let match;
      while ((match = pattern.exec(combinedMessage)) !== null) {
        const interests = match[1].split(/\s+and\s+|\s*,\s*/).map(i => i.trim()).filter(i => i.length > 2);
        updatedContext.interests.push(...interests);
      }
    }

    // Remove duplicates from interests
    updatedContext.interests = [...new Set(updatedContext.interests)];

    // Enhanced brand detection
    if (!updatedContext.detectedBrands) updatedContext.detectedBrands = [];
    const brandPatterns = [
      /\b(apple|nike|adidas|gucci|prada|coach|louis vuitton|chanel|tiffany|rolex|omega|sony|samsung|microsoft|amazon|google|tesla|bmw|mercedes|audi|starbucks|disney)\b/gi
    ];
    
    for (const pattern of brandPatterns) {
      let match;
      while ((match = pattern.exec(combinedMessage)) !== null) {
        if (!updatedContext.detectedBrands.includes(match[1].toLowerCase())) {
          updatedContext.detectedBrands.push(match[1].toLowerCase());
        }
      }
    }

    // Enhanced CTA button logic with comprehensive context analysis
    const hasRecipient = Boolean(updatedContext.recipient);
    const hasOccasionOrAge = Boolean(updatedContext.occasion || updatedContext.exactAge);
    const hasInterestsOrBrands = Boolean(
      (updatedContext.interests && updatedContext.interests.length > 0) || 
      (updatedContext.detectedBrands && updatedContext.detectedBrands.length > 0)
    );
    const hasBudget = Boolean(updatedContext.budget);
    
    // More sophisticated context evaluation
    const hasMinimumContext = hasRecipient && (hasOccasionOrAge || hasInterestsOrBrands);
    
    // Check if AI indicates readiness for search
    const aiIndicatesReady = /(?:ready to search|find (?:products|gifts)|search for|look for items|browse (?:products|gifts)|show (?:me )?(?:some )?(?:options|products|gifts))/i.test(aiMessage);
    
    // Check if user wants to see product suggestions after interests discussion
    const wantsProductSuggestions = /(?:yes.*show.*suggestions|show.*me.*suggestions|see.*suggestions|view.*suggestions|display.*products|show.*products)/i.test(message);
    
    const showSearchButton = hasMinimumContext || (hasBudget && hasInterestsOrBrands) || aiIndicatesReady;
    const showProductTiles = wantsProductSuggestions && hasInterestsOrBrands;

    console.log("CTA Button Logic:", {
      hasRecipient,
      hasOccasionOrAge, 
      hasInterestsOrBrands,
      hasBudget,
      hasMinimumContext,
      aiIndicatesReady,
      wantsProductSuggestions,
      showSearchButton,
      showProductTiles,
      context: {
        recipient: updatedContext.recipient,
        occasion: updatedContext.occasion,
        exactAge: updatedContext.exactAge,
        interests: updatedContext.interests,
        brands: updatedContext.detectedBrands,
        budget: updatedContext.budget
      }
    });

    const actions: string[] = ['chat'];
    if (showSearchButton) actions.push('search');
    if (updatedContext?.mentionedConnection) {
      actions.push('find_gifts_for_connection', 'setup_auto_gifting', 'view_wishlist');
    }

    // Remove automatic action prompt appending to prevent concatenated responses
    // Let Nicole handle follow-up suggestions naturally in her AI-generated response
    let finalMessage = aiMessage;

    // Generate search query for product tiles if needed
    let searchQuery;
    if (showProductTiles && updatedContext.interests) {
      searchQuery = updatedContext.interests.join(' ') + 
        (updatedContext.detectedBrands ? ' ' + updatedContext.detectedBrands.join(' ') : '') +
        (updatedContext.recipient ? ` gifts for ${updatedContext.recipient}` : '');
    }

    const responsePayload = {
      message: finalMessage,
      context: updatedContext,
      capability: updatedContext.capability,
      actions,
      showSearchButton,
      showProductTiles,
      searchQuery,
      metadata: {
        confidence: showSearchButton ? 0.8 : 0.4,
        suggestedFollowups: showSearchButton ? 
          [
            `Find gifts for ${updatedContext?.mentionedConnection?.name || 'them'}`,
            'Set up auto-gifting',
            'Show me gift options'
          ] :
          contextAnalysis.shouldSuggestAction ?
            contextAnalysis.nextSteps.map(step => step.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())) :
            [
              "Tell me more about the recipient",
              "What's the occasion?",
              "What's your budget?"
            ],
        connectionMatch: updatedContext?.mentionedConnection || null,
        suggestedAction: contextAnalysis.shouldSuggestAction ? contextAnalysis : null
      }
    };

    console.log("Enhanced Zinc API OpenAI response with CTA button system received");

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in nicole-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: "I'm sorry, I encountered an error. Please try again!",
      context: {},
      showSearchButton: false,
      showProductTiles: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
