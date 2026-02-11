const Blog = require('../models/Blog');
const { spawn } = require('child_process');
const path = require('path');

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
    const blogs = await Blog.find().sort({ createdAt: -1 });
    console.log('Blogs fetched:', blogs.length);
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
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
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
    const totalBlogs = await Blog.countDocuments();
    const blogs = await Blog.find({}, 'title likes dislikes comments');

    const detailedStats = blogs.map(b => ({
      id: b._id,
      title: b.title,
      likes: b.likes.length,
      dislikes: b.dislikes.length,
      comments: b.comments.length
    })).sort((a, b) => b.likes - a.likes);

    res.json({ totalBlogs, detailedStats });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

const likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const userId = req.user._id;

    // Remote from dislikes if present
    blog.dislikes = blog.dislikes.filter(id => id.toString() !== userId.toString());

    if (blog.likes.includes(userId)) {
      // Toggle off
      blog.likes = blog.likes.filter(id => id.toString() !== userId.toString());
    } else {
      blog.likes.push(userId);
    }

    await blog.save();
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    await Blog.deleteOne({ _id: req.params.id });
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

    // Fetch user's own posts
    const ownPosts = await Blog.find({ author: username }).sort({ createdAt: -1 });

    // Fetch liked posts
    const likedPosts = await Blog.find({ likes: userId }).sort({ createdAt: -1 });

    // Fetch disliked posts
    const dislikedPosts = await Blog.find({ dislikes: userId }).sort({ createdAt: -1 });

    // Fetch blogs where user has commented
    const blogsWithUserComments = await Blog.find({
      'comments.user': userId
    }).sort({ updatedAt: -1 });

    const userComments = blogsWithUserComments.map(blog => ({
      _id: blog._id,
      blogTitle: blog.title,
      blogSlug: blog.slug,
      comments: blog.comments
        .filter(c => c.user.toString() === userId.toString())
        .map(c => ({
          _id: c._id,
          text: c.text,
          date: c.date
        }))
    }));

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

    const comment = {
      user: req.user._id,
      username: req.user.username,
      text,
      date: new Date()
    };

    blog.comments.push(comment);
    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const triggerAgentBlog = async (req, res) => {
  const axios = require('axios');
  const { topic } = req.body;
  const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://agent-service:8000';

  console.log(`🚀 Triggering Agent for topic: ${topic || 'Trending AI News'}`);

  try {
    // Send background request to agent service
    axios.post(`${AGENT_SERVICE_URL}/generate`, { topic: topic || 'Trending AI News' });
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
  const axios = require('axios');
  const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://agent-service:8000';

  console.log(`🧠 Requesting RAG indexing for blog ${blogId} from microservice...`);

  try {
    const { data } = await axios.post(`${AGENT_SERVICE_URL}/index`, { blog_id: blogId, text });
    if (data.rag_data) {
      await Blog.findByIdAndUpdate(blogId, { ragData: data.rag_data });
      console.log(`✅ Blog ${blogId} indexed successfully via microservice.`);
    }
  } catch (err) {
    console.error('Failed to index blog via microservice:', err.message);
  }
};

const askQuestion = async (req, res) => {
  try {
    const axios = require('axios');
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    if (!blog.ragData || blog.ragData.length === 0) {
      return res.status(400).json({ message: 'AI is still processing this blog. Please try again in a moment.' });
    }

    const { question } = req.body;
    const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://agent-service:8000';

    console.log(`🤖 Requesting AI Answer for blog ${req.params.id} from microservice...`);

    const { data } = await axios.post(`${AGENT_SERVICE_URL}/query`, {
      rag_data: blog.ragData,
      question
    });

    res.json({ answer: data.answer });
  } catch (error) {
    console.error('AI Query Error:', error.message);
    res.status(500).json({ message: 'AI failed to answer question via microservice' });
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
  deleteBlog,
  askQuestion,
  getUserActivity
};
