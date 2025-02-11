require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { supabase } = require('./models/post');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/posts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        comments (
          id,
          text,
          username,
          created_at
        )
      `)
      .order('created_at', { ascending: false })
      .order('created_at', { foreignTable: 'comments', ascending: false });

    if (error) throw error;

    const posts = data.map(post => ({
      ...post,
      createdAt: post.created_at,
      likedBy: post.liked_by,
      comments: post.comments.map(comment => ({
        ...comment,
        createdAt: comment.created_at
      }))
    }));

    res.json(posts);
  } catch (error) {
    console.error('GET /api/posts error:', error);
    res.status(500).json({ 
      error: 'Error fetching posts',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { title, description, username } = req.body;
    if (!title || !description || !username) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        title,
        description,
        username,
        liked_by: []
      })
      .single();

    if (error) throw error;

    res.status(201).json({
      ...post,
      createdAt: post.created_at,
      likedBy: post.liked_by
    });
  } catch (error) {
    console.error('POST /api/posts error:', error);
    res.status(400).json({ 
      error: 'Error creating post',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

app.patch('/api/posts/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const { likes, likedBy } = req.body;

    const { data: updatedPost, error } = await supabase
      .from('posts')
      .update({
        likes,
        liked_by: likedBy
      })
      .eq('id', postId)
      .single();

    if (error) throw error;

    res.json({
      ...updatedPost,
      createdAt: updatedPost.created_at,
      likedBy: updatedPost.liked_by
    });
  } catch (error) {
    console.error('PATCH /api/posts error:', error);
    res.status(400).json({ 
      error: 'Error updating post',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    const { post_id, text, username } = req.body;
    if (!post_id || !text || !username) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        post_id,
        text,
        username
      })
      .single();

    if (error) throw error;

    res.status(201).json({
      ...comment,
      createdAt: comment.created_at
    });
  } catch (error) {
    console.error('POST /api/comments error:', error);
    res.status(400).json({ 
      error: 'Error creating comment',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});