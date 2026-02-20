const mongoose = require('mongoose');
const slugify = require('slugify');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  content: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
  },
  author: {
    type: String,
    default: 'AI Blog Agent',
  },
  categories: {
    type: [String],
    default: ['Uncategorized'],
  },
  isAgentGenerated: {
    type: Boolean,
    default: true,
  },
  bannerImage: {
    type: String, // URL or path
  },
  date: {
    type: Date,
    default: Date.now,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  ragIndexed: { type: Boolean, default: false }
}, { timestamps: true });

// Pre-save middleware to generate slug
blogSchema.pre('validate', function () {
  if (this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
});

module.exports = mongoose.model('Blog', blogSchema);
