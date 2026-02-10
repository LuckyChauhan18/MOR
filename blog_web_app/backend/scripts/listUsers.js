const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}, 'username email role');
    console.log('--- Existing Users ---');
    users.forEach(u => {
      console.log(`Username: ${u.username}, Email: ${u.email}, Role: ${u.role}`);
    });
    console.log('----------------------');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

listUsers();
