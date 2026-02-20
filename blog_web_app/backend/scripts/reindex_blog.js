const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://agent-service:8000';
const BLOG_ID = '699757e18616dabb23524c7d';

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to DB');
  try {
    const blog = await mongoose.connection.db.collection('blogs').findOne({ _id: new mongoose.Types.ObjectId(BLOG_ID) });
    if (!blog) {
      console.log('Blog not found');
      process.exit(1);
    }

    console.log(`Indexing blog: ${blog.title}`);
    console.log(`Service URL: ${AGENT_SERVICE_URL}`);

    try {
      const { data } = await axios.post(`${AGENT_SERVICE_URL}/index`, {
        blog_id: BLOG_ID,
        text: blog.content
      });
      console.log('Agent response:', data);

      if (data.success) {
        await mongoose.connection.db.collection('blogs').updateOne(
          { _id: new mongoose.Types.ObjectId(BLOG_ID) },
          { $set: { ragIndexed: true } }
        );
        console.log('Successfully updated ragIndexed: true');
      } else {
        console.log('Agent reported failure');
      }
    } catch (err) {
      console.error('Indexing failed:', err.message);
      if (err.response) console.error(err.response.data);
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
});
