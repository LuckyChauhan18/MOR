const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');
const redis = require('redis');
const mongoose = require('mongoose');

// Redis Client Setup
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect()
  .then(() => console.log('✅ Redis Connected'))
  .catch(err => console.error('❌ Redis Connection Error (Continuing without cache):', err.message));

const CACHE_KEY = 'blog_list_cache';

// In-memory store for agent status (shared across requests)
let currentAgentStatus = {
  status: 'idle', // idle, running, completed, error
  node: '',
  topic: '',
  lastUpdate: null
};

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public
const getBlogs = async (req, res) => {
  try {
    // 1. Try to fetch from Redis Cache
    try {
      const cachedBlogs = await redisClient.get(CACHE_KEY);
      if (cachedBlogs) {
        console.log('Blogs fetched from Redis Cache');
        return res.json(JSON.parse(cachedBlogs));
      }
    } catch (cacheError) {
      console.error('Redis Cache Get Error:', cacheError);
    }

    const blogs = await Blog.find()
      .select('title slug summary content author categories isAgentGenerated bannerImage date createdAt')
      .sort({ createdAt: -1 });

    console.log('Blogs fetched from MongoDB:', blogs.length);

    // 3. Save to Redis Cache (expires in 1 hour)
    try {
      await redisClient.set(CACHE_KEY, JSON.stringify(blogs), {
        EX: 3600 // 1 hour
      });
    } catch (cacheError) {
      console.error('Redis Cache Set Error:', cacheError);
    }

    res.json(blogs);
  } catch (error) {
    console.error('GET Blogs Error:', error);
    res.status(500).json({ message: 'Server Error', details: error.message });
  }
};

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
const getBlogBySlug = async (req, res) => {
  try {
    const slug = req.params.slug?.trim();

    if (!slug) {
      return res.status(400).json({ message: 'Invalid blog slug' });
    }

    const blog = await Blog.findOne({ slug })
      .lean();              // Return plain JS object (faster)

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json(blog);
  } catch (error) {
    console.error('Get Blog By Slug Error:', error);
    res.status(500).json({
      message: 'Server Error',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};


// @desc    Create blog manually (User)
// @route   POST /api/blogs
// @access  Private (Authenticated Users)
const createBlog = async (req, res) => {
  try {
    const { title, content, categories, summary, bannerImage } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Please add title and content' });
    }

    const blog = await Blog.create({
      title,
      content,
      categories,
      summary,
      bannerImage,
      author: req.user.username,
      isAgentGenerated: false
    });

    // Clear blog list cache
    await redisClient.del(CACHE_KEY).catch(console.error);

    // Background indexing
    triggerRAGIndexing(blog._id, content);

    res.status(201).json(blog);
  } catch (error) {
    console.error('Create Blog Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A blog with this title already exists. Please choose a different title.' });
    }
    res.status(500).json({ message: 'Server error during blog creation', error: error.message });
  }
};

// @desc    Create blog via AI Agent
// @route   POST /api/blogs/agent
// @access  Private (Agent Secret Key)
const createAgentBlog = async (req, res) => {
  try {
    const secretKey = req.headers['x-agent-key'];
    if (secretKey !== process.env.AGENT_SECRET_KEY) {
      return res.status(401).json({ message: 'Unauthorized Agent Access' });
    }

    const { title, content, categories, author, date, bannerImage } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Missing blog components' });
    }

    // Check if blog already exists by title/date to avoid duplicates
    const existing = await Blog.findOne({ title, date: date || new Date().toISOString().split('T')[0] });
    if (existing) {
      return res.status(200).json({ message: 'Blog already exists', blog: existing });
    }

    const blog = await Blog.create({
      title,
      content,
      categories,
      author: author || 'AI Blog Agent',
      date: date || Date.now(),
      isAgentGenerated: true,
      bannerImage
    });

    // Clear blog list cache
    await redisClient.del(CACHE_KEY).catch(console.error);

    // Background indexing
    triggerRAGIndexing(blog._id, content);

    res.status(201).json({
      message: 'Blog published successfully by Agent',
      blog
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBlogStats = async (req, res) => {
  try {
    // Run all queries in parallel for better performance
    const [totalBlogs, blogStats, commentCounts] = await Promise.all([
      Blog.countDocuments(),
      Blog.aggregate([
        {
          $project: {
            title: 1,
            likes: { $size: { $ifNull: ["$likes", []] } },
            dislikes: { $size: { $ifNull: ["$dislikes", []] } }
          }
        },
        { $sort: { likes: -1 } }
      ]),
      Comment.aggregate([
        { $group: { _id: '$blog', comments: { $sum: 1 } } }
      ])
    ]);

    // Merge comment counts into blog stats
    const commentMap = {};
    commentCounts.forEach(c => { commentMap[c._id.toString()] = c.comments; });
    const detailedStats = blogStats.map(b => ({
      ...b,
      comments: commentMap[b._id.toString()] || 0
    }));

    res.json({ totalBlogs, detailedStats });
  } catch (error) {
    console.error('Error fetching blog stats:', error);
    res.status(500).json({
      message: 'Error fetching stats',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};


const likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const userId = req.user._id.toString();

    // Remove from dislikes (if exists)
    blog.dislikes = blog.dislikes.filter(
      id => id.toString() !== userId
    );

    const alreadyLiked = blog.likes.some(
      id => id.toString() === userId
    );

    if (alreadyLiked) {
      // Toggle off (Unlike)
      blog.likes = blog.likes.filter(
        id => id.toString() !== userId
      );
    } else {
      blog.likes.push(req.user._id);
    }

    await blog.save();

    return res.status(200).json({
      message: alreadyLiked ? "Blog unliked" : "Blog liked",
      likesCount: blog.likes.length,
      dislikesCount: blog.dislikes.length,
      blog
    });

  } catch (error) {
    console.error("Like Blog Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


const dislikeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const userId = req.user._id;

    // Remove from likes if present
    blog.likes = blog.likes.filter(id => id.toString() !== userId.toString());

    if (blog.dislikes.includes(userId)) {
      // Toggle off
      blog.dislikes = blog.dislikes.filter(id => id.toString() !== userId.toString());
    } else {
      blog.dislikes.push(userId);
    }

    await blog.save();
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Check if user is admin OR the author of the blog
    if (req.user.role !== 'admin' && blog.author !== req.user.username) {
      return res.status(403).json({ message: 'Not authorized to delete this blog' });
    }

    // Delete blog and all its comments
    await Promise.all([
      Blog.deleteOne({ _id: req.params.id }),
      Comment.deleteMany({ blog: req.params.id })
    ]);

    // Clear blog list cache
    await redisClient.del(CACHE_KEY).catch(console.error);

    res.json({ message: 'Blog removed successfully' });
  } catch (error) {
    console.error('Delete Blog Error:', error);
    res.status(500).json({ message: 'Server Error', details: error.message });
  }
};

const getUserActivity = async (req, res) => {
  try {
    const username = req.user.username;
    const userId = req.user._id;

    // Fetch user's own posts, liked posts, disliked posts, and comments in parallel
    const [ownPosts, likedPosts, dislikedPosts, comments] = await Promise.all([
      Blog.find({ author: username }).sort({ createdAt: -1 }),
      Blog.find({ likes: userId }).sort({ createdAt: -1 }),
      Blog.find({ dislikes: userId }).sort({ createdAt: -1 }),
      Comment.find({ user: userId })
        .populate('blog', 'title slug')
        .sort({ createdAt: -1 })
    ]);

    // Group comments by blog
    const blogMap = {};
    comments.forEach(c => {
      if (!c.blog) return; // blog may have been deleted
      const blogId = c.blog._id.toString();
      if (!blogMap[blogId]) {
        blogMap[blogId] = {
          _id: blogId,
          blogTitle: c.blog.title,
          blogSlug: c.blog.slug,
          comments: []
        };
      }
      blogMap[blogId].comments.push({
        _id: c._id,
        text: c.text,
        date: c.date
      });
    });
    const userComments = Object.values(blogMap);

    res.json({ ownPosts, likedPosts, dislikedPosts, userComments });
  } catch (error) {
    console.error('Get User Activity Error:', error);
    res.status(500).json({ message: 'Server Error', details: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text is required' });

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const comment = await Comment.create({
      blog: req.params.id,
      user: req.user._id,
      username: req.user.username,
      text
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get comments for a blog
// @route   GET /api/blogs/:id/comments
// @access  Public
const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ blog: req.params.id })
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const triggerAgentBlog = async (req, res) => {
  const { topic } = req.body;
  const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://127.0.0.1:8000';

  console.log(`🚀 Triggering Agent for topic: ${topic || 'Trending AI News'} using URL: ${AGENT_SERVICE_URL}`);

  try {
    // Send background request to agent service
    await axios.post(`${AGENT_SERVICE_URL}/generate`, { topic: topic || 'Trending AI News' });
    res.status(202).json({ message: 'Agent triggered successfully tokens. It may take a few minutes to publish.' });
  } catch (error) {
    console.error(`❌ Agent Trigger Error: ${error.message}`);
    res.status(500).json({ message: 'Failed to trigger agent microservice' });
  }
};

const updateAgentStatus = async (req, res) => {
  const secretKey = req.headers['x-agent-key'];
  if (secretKey !== process.env.AGENT_SECRET_KEY) {
    return res.status(401).json({ message: 'Unauthorized status update' });
  }

  const { status, node, topic } = req.body;
  currentAgentStatus = {
    status: status || currentAgentStatus.status,
    node: node || '',
    topic: topic || currentAgentStatus.topic,
    lastUpdate: new Date()
  };

  // Clear topic when transitioning to idle/published
  if (status === 'idle') {
    currentAgentStatus.topic = '';
  }

  res.json({ success: true });
};

const getAgentStatus = async (req, res) => {
  res.json(currentAgentStatus);
};

const triggerRAGIndexing = async (blogId, text) => {
  const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://127.0.0.1:8000';

  console.log(`🧠 Requesting RAG indexing for blog ${blogId} from microservice...`);

  try {
    const { data } = await axios.post(`${AGENT_SERVICE_URL}/index`, { blog_id: blogId, text });
    if (data.success) {
      await Blog.findByIdAndUpdate(blogId, { ragIndexed: true });
      console.log(`✅ Blog ${blogId} indexed in Qdrant successfully.`);
    }
  } catch (err) {
    console.error('Failed to index blog via microservice:', err.message);
  }
};

const askQuestion = async (req, res) => {
  try {
    console.log(`DEBUG: askQuestion called with ID: ${req.params.id}`);

    // Validate ObjectId to prevent CastError
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid blog ID format' });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    if (!blog.ragIndexed) {
      return res.status(400).json({ message: 'AI is still processing this blog. Please try again in a moment.' });
    }

    const { question } = req.body;
    const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://127.0.0.1:8000';

    console.log(`🤖 Requesting AI Answer for blog ${req.params.id}...`);

    try {
      // Direct communication with agent microservice (Docker / production)
      const { data } = await axios.post(`${AGENT_SERVICE_URL}/query`, {
        blog_id: req.params.id,
        question
      }, { timeout: 30000 });
      return res.json({ answer: data.answer });
    } catch (serviceErr) {
      console.error(`AI Service Error (${AGENT_SERVICE_URL}):`, serviceErr.message);

      let errorMessage = 'AI Assistant is currently busy or unreachable. Please try again in a moment.';
      if (serviceErr.code === 'ECONNREFUSED' || serviceErr.code === 'ENOTFOUND') {
        errorMessage = 'AI Agent Service is offline. Please ensure the agent-service container is running.';
      } else if (serviceErr.code === 'ETIMEDOUT') {
        errorMessage = 'AI timed out while thinking. Please try a simpler question.';
      }

      return res.status(503).json({
        message: errorMessage,
        details: serviceErr.response?.data || serviceErr.message
      });
    }
  } catch (error) {
    console.error('AI Query Error:', error.message);
    res.status(500).json({ message: 'AI failed to answer question' });
  }
};

module.exports = {
  getBlogs,
  getBlogBySlug,
  createBlog,
  createAgentBlog,
  getBlogStats,
  triggerAgentBlog,
  updateAgentStatus,
  getAgentStatus,
  likeBlog,
  dislikeBlog,
  addComment,
  getComments,
  deleteBlog,
  askQuestion,
  getUserActivity
};
