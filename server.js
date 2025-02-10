// index.js (modified for SQLite)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDB, setupSchema } = require('./models/post');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database initialization
let db;
initializeDB().then(async (database) => {
    db = database;
    await setupSchema(db);
    console.log('SQLite database connected and schema initialized');
});

// Routes
// Get all posts with comments
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await db.all(`
      SELECT posts.*, 
      json_group_array(json_object(
        'id', comments.id,
        'text', comments.text,
        'username', comments.username,
        'createdAt', comments.createdAt
      )) AS comments
      FROM posts
      LEFT JOIN comments ON posts.id = comments.postId
      GROUP BY posts.id
      ORDER BY posts.createdAt DESC
    `);

        // Parse JSON fields
        const parsedPosts = posts.map(post => ({
            ...post,
            comments: JSON.parse(post.comments),
            likedBy: JSON.parse(post.likedBy)
        }));

        res.json(parsedPosts);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching posts' });
    }
});

// Create new post
app.post('/api/posts', async (req, res) => {
    try {
        const post = {
            id: require('uuid').v4(),
            ...req.body,
            createdAt: new Date().toISOString()
        };

        await db.run(
            `INSERT INTO posts (id, title, description, username, createdAt) 
       VALUES (?, ?, ?, ?, ?)`,
            [post.id, post.title, post.description, post.username, post.createdAt]
        );

        res.status(201).json(post);
    } catch (error) {
        res.status(400).json({ error: 'Error creating post' });
    }
});

// Update post (comments, likes, likedBy)
app.patch('/api/posts/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const { comments, likes, likedBy } = req.body;

        // Update likes and likedBy
        if (likes !== undefined || likedBy !== undefined) {
            await db.run(
                `UPDATE posts SET likes = ?, likedBy = ? WHERE id = ?`,
                [likes, JSON.stringify(likedBy), postId]
            );
        }

        // Handle single comment addition
        if (comments && comments.length > 0) {
            const stmt = await db.prepare(
                `INSERT INTO comments (id, postId, text, username, createdAt)
           VALUES (?, ?, ?, ?, ?)`
            );

            // Only process new comments
            for (const comment of comments) {
                // Check if comment already exists
                const existing = await db.get(
                    `SELECT id FROM comments WHERE id = ?`,
                    [comment.id]
                );

                if (!existing) {
                    await stmt.run([
                        comment.id,
                        postId,
                        comment.text,
                        comment.username,
                        comment.createdAt || new Date().toISOString()
                    ]);
                }
            }
            await stmt.finalize();
        }

        // Return updated post data
        const post = await db.get(`SELECT * FROM posts WHERE id = ?`, [postId]);
        const postComments = await db.all(
            `SELECT * FROM comments WHERE postId = ? ORDER BY createdAt DESC`,
            [postId]
        );

        res.json({
            ...post,
            likedBy: JSON.parse(post.likedBy),
            comments: postComments
        });
    } catch (error) {
        res.status(400).json({ error: 'Error updating post' });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});