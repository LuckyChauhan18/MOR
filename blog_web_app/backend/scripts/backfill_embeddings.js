const mongoose = require('mongoose');
const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');
const Blog = require('../models/Blog');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const backfill = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('connected to MongoDB...');

    const blogs = await Blog.find({
      $or: [
        { ragData: { $exists: false } },
        { ragData: { $size: 0 } }
      ]
    });

    console.log(`Found ${blogs.length} blogs needing RAG indexing.`);

    for (const blog of blogs) {
      console.log(`🧠 Processing: "${blog.title}" (${blog._id})`);

      try {
        const ragData = await getEmbeddings(blog.content);
        blog.ragData = ragData;
        await blog.save();
        console.log(`✅ Success: ${blog.title}`);
      } catch (err) {
        console.error(`❌ Failed: ${blog.title}`, err.message);
      }
    }

    console.log('🎉 Backfill complete!');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error during backfill:', error);
    process.exit(1);
  }
};

const getEmbeddings = (text) => {
  return new Promise((resolve, reject) => {
    const fs = require('fs');
    const tempFile = path.join(__dirname, '..', 'data', `temp_backfill_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, text);

    const pythonScript = path.join(__dirname, 'rag_service.py');
    const condaEnv = process.env.CONDA_ENV_NAME || 'blogGenration';

    console.log(`DEBUG: Sending ${text.length} chars to Python via file...`);
    const py = spawn('conda', ['run', '-n', condaEnv, 'python', pythonScript, 'index', '--file', tempFile]);

    let result = '';
    py.stdout.on('data', (data) => { result += data.toString(); });
    py.stderr.on('data', (data) => { console.error(`PY DEBUG: ${data}`); });

    py.on('close', (code) => {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      if (code === 0) {
        try {
          resolve(JSON.parse(result));
        } catch (err) {
          reject(new Error('Failed to parse Python output'));
        }
      } else {
        reject(new Error(`Python process exited with code ${code}`));
      }
    });
  });
};

backfill();
