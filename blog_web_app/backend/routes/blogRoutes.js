const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController'); // Changed to import the whole object
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/stats', blogController.getBlogs); // We'll update controller to handle stats or add new function
router.get('/dashboard-stats', protect, admin, blogController.getBlogStats);
router.get('/agent-status', protect, admin, blogController.getAgentStatus);
router.get('/user-activity', protect, blogController.getUserActivity);
router.post('/agent-status', blogController.updateAgentStatus);
router.post('/trigger-agent', protect, admin, blogController.triggerAgentBlog);
router.get('/', blogController.getBlogs);
router.get('/:slug', blogController.getBlogBySlug);
router.post('/', protect, blogController.createBlog);
router.post('/:id/like', protect, blogController.likeBlog);
router.post('/:id/dislike', protect, blogController.dislikeBlog);
router.post('/:id/comment', protect, blogController.addComment);
router.post('/:id/ask', blogController.askQuestion);
router.post('/agent', blogController.createAgentBlog);
router.delete('/:id', protect, blogController.deleteBlog);

module.exports = router;
