-- Create user roles enum type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'frontdesk', 'doctor', 'nurse', 'accountant');
    END IF;
END$$;

-- Add role column to auth.users metadata if it doesn't exist
-- Note: Supabase stores user metadata in raw_user_meta_data column

-- Create a function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text AS $$
BEGIN
    RETURN (
        SELECT raw_user_meta_data->>'role'
        FROM auth.users
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to set user role
CREATE OR REPLACE FUNCTION public.set_user_role(user_id uuid, user_role text)
RETURNS void AS $$
BEGIN
    UPDATE auth.users
    SET raw_user_meta_data = 
        CASE 
            WHEN raw_user_meta_data IS NULL THEN 
                jsonb_build_object('role', user_role)
            ELSE 
                raw_user_meta_data || jsonb_build_object('role', user_role)
        END
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create users table for additional user information
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    full_name text,
    role text NOT NULL DEFAULT 'frontdesk',
    department text,
    phone text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view all users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Only admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        (SELECT get_user_role(auth.uid())) = 'admin' OR
        auth.uid() IS NULL -- Allow initial setup
    );

CREATE POLICY "Only admins can update users" ON public.users
    FOR UPDATE USING (
        (SELECT get_user_role(auth.uid())) = 'admin'
    );

CREATE POLICY "Only admins can delete users" ON public.users
    FOR DELETE USING (
        (SELECT get_user_role(auth.uid())) = 'admin'
    );

-- Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;

-- Create a trigger to sync auth.users with public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, role, full_name)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'role', 'frontdesk'),
        COALESCE(new.raw_user_meta_data->>'full_name', new.email)
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert frontdesk user (password will be 'frontdesk123')
-- Note: You need to run this through Supabase dashboard or use their API
-- Here's the SQL to create the user after it's created in auth.users:

/*
To create a frontdesk user:
1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User"
3. Enter:
   - Email: frontdesk@hospital.com
   - Password: frontdesk123
4. After creating, run this SQL to set the role:
*/

-- After creating the user in Supabase Auth, get the user ID and run:
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_build_object('role', 'frontdesk', 'full_name', 'Front Desk Staff')
-- WHERE email = 'frontdesk@hospital.com';

-- Also insert into public.users table
-- INSERT INTO public.users (id, email, role, full_name, department, is_active)
-- SELECT 
--     id,
--     'frontdesk@hospital.com',
--     'frontdesk',
--     'Front Desk Staff',
--     'Reception',
--     true
-- FROM auth.users
-- WHERE email = 'frontdesk@hospital.com'
-- ON CONFLICT (id) DO NOTHING;

-- Create a view for easier user management
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.department,
    u.phone,
    u.is_active,
    u.created_at,
    au.last_sign_in_at
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id;

-- Grant permissions on the view
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;