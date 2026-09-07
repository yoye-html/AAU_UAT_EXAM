-- run this in the Supabase SQL Editor

-- 1. Create the Proctoring Captures table
CREATE TABLE public.proctoring_captures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  storage_path text NOT NULL,
  user_agent text,
  question_number integer,
  captured_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the Exam Results table
CREATE TABLE public.exam_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid, -- Optional, if implementing authentication
  score integer NOT NULL,
  total_questions integer NOT NULL,
  time_taken integer NOT NULL, -- in seconds
  answers jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Storage Bucket Setup
-- Create a public bucket named "exam-proctoring" via the Supabase Dashboard, or via SQL if possible.
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-proctoring', 'exam-proctoring', true);

-- Enable RLS (Row Level Security) if desired, though API route uses Service Role (bypasses RLS)
-- Here we'll just allow all for the Service Role in the bucket, which is default.

