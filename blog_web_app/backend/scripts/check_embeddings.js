const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Blog = require('../models/Blog');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const all = await Blog.find({}, 'title ragData');
    console.log(`Total Blogs: ${all.length}`);

    all.forEach(b => {
      const count = b.ragData ? b.ragData.length : 0;
      console.log(`- [${count}] ${b.title} (${b._id})`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
