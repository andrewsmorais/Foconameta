-- Reset password for Rian Rocha De Morais to '1234'
-- This is done via admin function since we need auth.admin access

-- First, let's verify the user exists
SELECT id, email FROM auth.users WHERE id = 'dfe7b443-bd3b-4475-a714-725077e77f2c';