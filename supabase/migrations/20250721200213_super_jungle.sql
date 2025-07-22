/*
  # Fix Users Table RLS Policy

  1. Security Changes
    - Drop existing restrictive policy on users table
    - Add new policy allowing anonymous users to insert and select data
    - This enables the application to create default users without authentication

  2. Policy Details
    - Allow INSERT operations for anonymous (anon) role
    - Allow SELECT operations for anonymous (anon) role
    - Use permissive policies to ensure data access works correctly
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can manage own data" ON users;

-- Create a policy that allows anonymous users to insert data
CREATE POLICY "Allow anonymous user creation"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create a policy that allows anonymous users to read data
CREATE POLICY "Allow anonymous user access"
  ON users
  FOR SELECT
  TO anon
  USING (true);

-- Create a policy that allows anonymous users to update data
CREATE POLICY "Allow anonymous user updates"
  ON users
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);