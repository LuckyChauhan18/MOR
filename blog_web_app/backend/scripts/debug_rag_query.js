const mongoose = require('mongoose');
const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');
const Blog = require('../models/Blog');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const blog = await Blog.findOne({ ragData: { $exists: true, $not: { $size: 0 } } });
    if (!blog) {
      console.log('No indexed blog found');
      process.exit(0);
    }

    console.log(`Testing blog: ${blog.title}`);
    const question = "What is this blog about?";
    const pythonScript = path.join(__dirname, 'rag_service.py');
    const condaEnv = process.env.CONDA_ENV_NAME || 'blogGenration';

    console.log(`Running Python: conda run -n ${condaEnv} python ${pythonScript} query`);
    const py = spawn('conda', ['run', '-n', condaEnv, 'python', pythonScript, 'query']);

    const payload = JSON.stringify({ rag_data: blog.ragData, question });
    py.stdin.write(payload);
    py.stdin.end();

    py.stdout.on('data', (data) => {
      console.log(`STDOUT: ${data.toString()}`);
    });

    py.stderr.on('data', (data) => {
      console.error(`STDERR: ${data.toString()}`);
    });

    py.on('close', (code) => {
      console.log(`Process exited with code ${code}`);
      process.exit(0);
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

test();
