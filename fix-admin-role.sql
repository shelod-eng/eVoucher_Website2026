-- Add admin role to shelod@gmail.com and mpetalebo@outlook.com

-- Update user_profiles for both users
INSERT INTO user_profiles (id, email, full_name, role)
VALUES 
  ('4634a1e3-cccd-4cba-9c04-691e34623e66', 'shelod@gmail.com', 'Shelod Admin', 'admin'),
  ('d14d1378-5347-4a6a-b5b8-b33c891abc2b', 'mpetalebo@outlook.com', 'Mpeta Admin', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin', email = EXCLUDED.email, full_name = EXCLUDED.full_name;

-- Add to portal_user_roles (if table exists)
INSERT INTO portal_user_roles (user_id, role)
VALUES 
  ('4634a1e3-cccd-4cba-9c04-691e34623e66', 'admin'),
  ('d14d1378-5347-4a6a-b5b8-b33c891abc2b', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Update auth user metadata for both users
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE id IN ('4634a1e3-cccd-4cba-9c04-691e34623e66', 'd14d1378-5347-4a6a-b5b8-b33c891abc2b');
