const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
console.log('Connecting to:', MONGO_URI);

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const Blog = mongoose.model('Blog', new mongoose.Schema({
      title: String,
      slug: String
    }, { collection: 'blogs' }));

    const blogs = await Blog.find({}, 'title slug');
    console.log(`Found ${blogs.length} blogs:`);
    blogs.forEach(b => console.log(`- ${b.title} (${b.slug})`));
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
