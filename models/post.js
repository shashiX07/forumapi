const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Note: The schema creation should be done manually in Supabase SQL Editor:
/*
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
  description TEXT NOT NULL CHECK (length(description) <= 2000),
  likes INTEGER DEFAULT 0 CHECK (likes >= 0),
  liked_by JSONB DEFAULT '[]'::jsonb,
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (length(text) <= 500),
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX posts_created_at_idx ON posts(created_at);
CREATE INDEX comments_post_id_idx ON comments(post_id);
*/

module.exports = { supabase };