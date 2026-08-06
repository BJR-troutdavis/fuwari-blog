-- Supabase PostgreSQL Database Schema for Fuwari Blog

-- Create Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  draft BOOLEAN DEFAULT false,
  description TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  category TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  lang TEXT DEFAULT 'en',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Allow public read access for published posts
CREATE POLICY "Allow public read access" ON public.posts
  FOR SELECT USING (draft = false);

-- Allow authenticated users to create/update/delete posts
CREATE POLICY "Allow write for authenticated users" ON public.posts
  FOR ALL USING (auth.role() = 'authenticated');
