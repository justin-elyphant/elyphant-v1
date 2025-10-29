import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🔄 Starting interests consolidation migration...')

    // Get all profiles where gift_preferences exists but interests is null/empty
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, gift_preferences, interests')
      .not('gift_preferences', 'is', null)

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError)
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📊 Found ${profiles?.length || 0} profiles to process`)

    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const profile of profiles || []) {
      try {
        // Skip if interests already populated
        if (profile.interests && Array.isArray(profile.interests) && profile.interests.length > 0) {
          skippedCount++
          continue
        }

        // Extract categories from gift_preferences
        const interests: string[] = []
        
        if (Array.isArray(profile.gift_preferences)) {
          profile.gift_preferences.forEach((pref: any) => {
            if (typeof pref === 'string') {
              interests.push(pref)
            } else if (pref && pref.category) {
              interests.push(pref.category)
            }
          })
        }

        // Only update if we extracted interests
        if (interests.length > 0) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ interests })
            .eq('id', profile.id)

          if (updateError) {
            console.error(`Error updating profile ${profile.id}:`, updateError)
            errorCount++
          } else {
            console.log(`✅ Migrated ${interests.length} interests for profile ${profile.id}`)
            migratedCount++
          }
        } else {
          skippedCount++
        }
      } catch (error) {
        console.error(`Error processing profile ${profile.id}:`, error)
        errorCount++
      }
    }

    const summary = {
      success: true,
      message: 'Interests consolidation migration completed',
      stats: {
        totalProcessed: profiles?.length || 0,
        migrated: migratedCount,
        skipped: skippedCount,
        errors: errorCount
      }
    }

    console.log('📈 Migration summary:', summary)

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Migration error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
