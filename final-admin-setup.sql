-- Complete SQL script to add admin role to shelod@gmail.com and mpetalebo@outlook.com

-- Step 1: Update existing user_profiles or insert new ones
INSERT INTO user_profiles (
  id, 
  email, 
  full_name, 
  role
)
VALUES 
  (
    '4634a1e3-cccd-4cba-9c04-691e34623e66', 
    'shelod@gmail.com', 
    'Shelod Admin', 
    'admin'
  ),
  (
    'd14d1378-5347-4a6a-b5b8-b33c891abc2b', 
    'mpetalebo@outlook.com', 
    'Mpeta Admin', 
    'admin'
  )
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin', 
  email = EXCLUDED.email, 
  full_name = EXCLUDED.full_name;

-- Step 2: Add entries to portal_user_roles (only user_id and role)
INSERT INTO portal_user_roles (user_id, role)
VALUES 
  ('4634a1e3-cccd-4cba-9c04-691e34623e66', 'admin'),
  ('d14d1378-5347-4a6a-b5b8-b33c891abc2b', 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';

-- Step 3: Update auth.users metadata for both users
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE id IN (
  '4634a1e3-cccd-4cba-9c04-691e34623e66', 
  'd14d1378-5347-4a6a-b5b8-b33c891abc2b'
);

-- Step 4: Verify the changes
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'role' as auth_role,
  up.role as profile_role,
  pur.role as portal_role
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN portal_user_roles pur ON u.id = pur.user_id
WHERE u.email IN ('shelod@gmail.com', 'mpetalebo@outlook.com');
