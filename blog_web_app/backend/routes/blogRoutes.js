const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { protect, admin } = require('../middleware/authMiddleware');

// ─── Public Endpoints ────────────────────────────────────────────

/**
 * @swagger
 * /api/blogs:
 *   get:
 *     summary: Get all blogs
 *     description: Returns a list of all blogs, sorted by newest first. Results are cached in Redis for 1 hour.
 *     tags: [Blogs]
 *     responses:
 *       200:
 *         description: A list of blogs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Blog'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', blogController.getBlogs);

/**
 * @swagger
 * /api/blogs/stats:
 *   get:
 *     summary: Get blog stats (public)
 *     description: Returns the same data as GET /api/blogs — a list of all blogs.
 *     tags: [Blogs]
 *     responses:
 *       200:
 *         description: A list of blogs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Blog'
 */
router.get('/stats', blogController.getBlogs);

/**
 * @swagger
 * /api/blogs/user-activity:
 *   get:
 *     summary: Get user activity
 *     description: Returns the authenticated user's own posts, liked posts, disliked posts, and comments.
 *     tags: [Social]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User activity data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserActivity'
 *       401:
 *         description: Not authorized
 */
router.get('/user-activity', protect, blogController.getUserActivity);

/**
 * @swagger
 * /api/blogs/dashboard-stats:
 *   get:
 *     summary: Get dashboard statistics (Admin)
 *     description: Returns total blog count and detailed per-blog stats (likes, dislikes, comments). Admin only.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Blog statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlogStats'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as admin
 */


/**
 * @swagger
 * /api/blogs/{slug}:
 *   get:
 *     summary: Get a single blog by slug
 *     description: Fetches a blog post using its URL-friendly slug. Excludes heavy ragData.
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The URL slug of the blog
 *         example: introduction-to-ai
 *     responses:
 *       200:
 *         description: The blog post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blog'
 *       400:
 *         description: Invalid blog slug
 *       404:
 *         description: Blog not found
 */
// ─── Admin and Special Endpoints (Must be above /:slug) ───────────

router.get('/agent-status', protect, admin, blogController.getAgentStatus);
router.post('/trigger-agent', protect, admin, blogController.triggerAgentBlog);
router.post('/agent-status', blogController.updateAgentStatus);
router.get('/dashboard-stats', protect, admin, blogController.getBlogStats);

// ─── Parameterized Endpoints ─────────────────────────────────────

router.get('/:slug', blogController.getBlogBySlug);


/**
 * @swagger
 * /api/blogs/{id}/comments:
 *   get:
 *     summary: Get comments for a blog
 *     description: Returns all comments for a specific blog, sorted by newest first.
 *     tags: [Social]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       500:
 *         description: Server error
 */
router.get('/:id/comments', blogController.getComments);

// ─── Authenticated Endpoints ─────────────────────────────────────

/**
 * @swagger
 * /api/blogs:
 *   post:
 *     summary: Create a new blog (manual)
 *     description: Creates a blog post as the authenticated user. Clears the Redis cache and triggers RAG indexing in the background.
 *     tags: [Blogs]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: My First Blog
 *               content:
 *                 type: string
 *                 example: '<p>This is the body of my blog post.</p>'
 *               summary:
 *                 type: string
 *                 example: A short summary
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['Technology', 'AI']
 *               bannerImage:
 *                 type: string
 *                 example: https://example.com/image.jpg
 *     responses:
 *       201:
 *         description: Blog created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blog'
 *       400:
 *         description: Missing title/content or duplicate title
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, blogController.createBlog);

/**
 * @swagger
 * /api/blogs/{id}/like:
 *   post:
 *     summary: Like or unlike a blog
 *     description: Toggles the like status for the authenticated user. If already liked, it unlikes. Also removes any existing dislike.
 *     tags: [Social]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 likesCount:
 *                   type: integer
 *                 dislikesCount:
 *                   type: integer
 *                 blog:
 *                   $ref: '#/components/schemas/Blog'
 *       404:
 *         description: Blog not found
 *       401:
 *         description: Not authorized
 */
router.post('/:id/like', protect, blogController.likeBlog);

/**
 * @swagger
 * /api/blogs/{id}/dislike:
 *   post:
 *     summary: Dislike or un-dislike a blog
 *     description: Toggles the dislike status for the authenticated user. Also removes any existing like.
 *     tags: [Social]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Dislike toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blog'
 *       404:
 *         description: Blog not found
 *       401:
 *         description: Not authorized
 */
router.post('/:id/dislike', protect, blogController.dislikeBlog);

/**
 * @swagger
 * /api/blogs/{id}/comment:
 *   post:
 *     summary: Add a comment to a blog
 *     description: Adds a text comment by the authenticated user to the specified blog.
 *     tags: [Social]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: Great article, thanks for sharing!
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Comment text is required
 *       404:
 *         description: Blog not found
 *       401:
 *         description: Not authorized
 */
router.post('/:id/comment', protect, blogController.addComment);

/**
 * @swagger
 * /api/blogs/{id}/ask:
 *   post:
 *     summary: Ask an AI question about a blog
 *     description: Sends a natural language question about a specific blog to the AI agent service, which uses RAG data to generate an answer.
 *     tags: [AI Agent]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 example: What are the main points of this article?
 *     responses:
 *       200:
 *         description: AI-generated answer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *       400:
 *         description: AI has not finished processing this blog yet
 *       404:
 *         description: Blog not found
 *       500:
 *         description: AI service error
 */
router.post('/:id/ask', protect, blogController.askQuestion);

/**
 * @swagger
 * /api/blogs/{id}:
 *   delete:
 *     summary: Delete a blog
 *     description: Deletes a blog post. Allowed for admins or the blog author. Clears the Redis cache.
 *     tags: [Blogs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Blog removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Blog removed successfully
 *       403:
 *         description: Not authorized to delete this blog
 *       404:
 *         description: Blog not found
 *       401:
 *         description: Not authorized
 */
router.delete('/:id', protect, blogController.deleteBlog);

// ─── Admin-Only Endpoints ────────────────────────────────────────

/**
 * @swagger
 * /api/blogs/agent-status:
 *   get:
 *     summary: Get AI agent status (Admin)
 *     description: Returns the current status of the AI blog generation agent.
 *     tags: [AI Agent]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current agent status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AgentStatus'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as admin
 */


/**
 * @swagger
 * /api/blogs/trigger-agent:
 *   post:
 *     summary: Trigger AI agent to generate a blog (Admin)
 *     description: Sends a request to the agent microservice to generate a new blog on the specified topic.
 *     tags: [AI Agent]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic:
 *                 type: string
 *                 example: Trending AI News
 *                 description: Topic for the AI to write about. Defaults to "Trending AI News".
 *     responses:
 *       202:
 *         description: Agent triggered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as admin
 *       500:
 *         description: Failed to trigger agent
 */


// ─── Agent-Internal Endpoints ────────────────────────────────────

/**
 * @swagger
 * /api/blogs/agent-status:
 *   post:
 *     summary: Update agent status (Agent Internal)
 *     description: Called by the agent microservice to push status updates. Requires the x-agent-key header.
 *     tags: [AI Agent]
 *     parameters:
 *       - in: header
 *         name: x-agent-key
 *         required: true
 *         schema:
 *           type: string
 *         description: Secret key for agent authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [idle, running, completed, error]
 *               node:
 *                 type: string
 *               topic:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 *       401:
 *         description: Unauthorized
 */


/**
 * @swagger
 * /api/blogs/agent:
 *   post:
 *     summary: Create a blog via AI Agent (Agent Internal)
 *     description: Endpoint for the AI agent microservice to publish generated blogs. Requires the x-agent-key header for authentication.
 *     tags: [AI Agent]
 *     parameters:
 *       - in: header
 *         name: x-agent-key
 *         required: true
 *         schema:
 *           type: string
 *         description: Secret key for agent authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: The Future of Large Language Models
 *               content:
 *                 type: string
 *                 example: '<p>Generated blog content...</p>'
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['AI', 'LLM']
 *               author:
 *                 type: string
 *                 example: AI Blog Agent
 *               date:
 *                 type: string
 *                 format: date
 *                 example: '2026-02-18'
 *               bannerImage:
 *                 type: string
 *                 example: https://example.com/banner.jpg
 *     responses:
 *       201:
 *         description: Blog published successfully by agent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 blog:
 *                   $ref: '#/components/schemas/Blog'
 *       200:
 *         description: Blog already exists (duplicate)
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */
router.post('/agent', blogController.createAgentBlog);

module.exports = router;
