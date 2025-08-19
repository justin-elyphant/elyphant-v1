-- Fix wishlist data consistency by migrating data from profiles.wishlists JSONB to proper wishlists table
-- This addresses the core issue where Dua has wishlists in profiles.wishlists but not in the actual wishlists table

DO $$
DECLARE
    profile_record RECORD;
    wishlist_record JSONB;
    new_wishlist_id UUID;
BEGIN
    -- Loop through all profiles that have wishlists in their JSONB column but no records in the wishlists table
    FOR profile_record IN 
        SELECT p.id, p.wishlists
        FROM profiles p
        WHERE p.wishlists IS NOT NULL 
        AND jsonb_array_length(p.wishlists) > 0
        AND NOT EXISTS (
            SELECT 1 FROM wishlists w WHERE w.user_id = p.id
        )
    LOOP
        -- For each profile, migrate their wishlists from JSONB to proper table records
        FOR wishlist_record IN SELECT * FROM jsonb_array_elements(profile_record.wishlists)
        LOOP
            -- Generate new UUID for the wishlist
            new_wishlist_id := gen_random_uuid();
            
            -- Insert wishlist into proper wishlists table
            INSERT INTO wishlists (
                id,
                user_id,
                title,
                description,
                is_public,
                category,
                tags,
                priority,
                created_at,
                updated_at
            ) VALUES (
                new_wishlist_id,
                profile_record.id,
                COALESCE((wishlist_record->>'title')::text, 'My Wishlist'),
                (wishlist_record->>'description')::text,
                COALESCE((wishlist_record->>'is_public')::boolean, true), -- Default to public for friends to see
                (wishlist_record->>'category')::text,
                CASE 
                    WHEN wishlist_record->'tags' IS NOT NULL THEN 
                        (SELECT array_agg(value::text) FROM jsonb_array_elements_text(wishlist_record->'tags'))
                    ELSE NULL
                END,
                COALESCE((wishlist_record->>'priority')::integer, 1),
                COALESCE((wishlist_record->>'created_at')::timestamp with time zone, NOW()),
                COALESCE((wishlist_record->>'updated_at')::timestamp with time zone, NOW())
            );
            
            -- If there are items in the wishlist, migrate them too
            IF wishlist_record->'items' IS NOT NULL AND jsonb_array_length(wishlist_record->'items') > 0 THEN
                INSERT INTO wishlist_items (
                    id,
                    wishlist_id,
                    product_id,
                    title,
                    name,
                    brand,
                    price,
                    image_url,
                    created_at
                )
                SELECT 
                    gen_random_uuid(),
                    new_wishlist_id,
                    (item->>'product_id')::integer,
                    COALESCE((item->>'title')::text, (item->>'name')::text, 'Wishlist Item'),
                    (item->>'name')::text,
                    (item->>'brand')::text,
                    CASE 
                        WHEN item->>'price' ~ '^[0-9]+\.?[0-9]*$' THEN (item->>'price')::numeric
                        ELSE NULL
                    END,
                    (item->>'image_url')::text,
                    COALESCE((item->>'created_at')::timestamp with time zone, NOW())
                FROM jsonb_array_elements(wishlist_record->'items') AS item;
            END IF;
            
            RAISE NOTICE 'Migrated wishlist "%" for user %', 
                COALESCE((wishlist_record->>'title')::text, 'My Wishlist'), 
                profile_record.id;
        END LOOP;
        
        -- Clear the JSONB column now that data is properly stored
        UPDATE profiles SET wishlists = NULL WHERE id = profile_record.id;
        
        RAISE NOTICE 'Completed migration for user %', profile_record.id;
    END LOOP;
    
    RAISE NOTICE 'Wishlist data migration completed successfully';
END $$;