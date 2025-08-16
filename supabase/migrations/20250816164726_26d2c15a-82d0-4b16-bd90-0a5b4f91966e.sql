-- Update handle_new_user function to use new friend-first defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    name, 
    email, 
    username,
    data_sharing_settings
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'username', LOWER(REPLACE(COALESCE(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', 'user'), ' ', ''))),
    jsonb_build_object(
      'dob', 'friends',
      'shipping_address', 'friends', 
      'gift_preferences', 'public',
      'email', 'friends'
    )
  );
  RETURN new;
END;
$$;