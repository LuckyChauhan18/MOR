const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

// Load env from one level up
dotenv.config({ path: path.join(__dirname, '../.env') });

const promote = async (username) => {
  if (!username) {
    console.error('Usage: node promoteAdmin.js <username>');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const user = await User.findOneAndUpdate(
      { username },
      { role: 'admin' },
      { new: true }
    );

    if (user) {
      console.log(`SUCCESS: User "${username}" is now an admin.`);
      console.log(`Updated User object:`, {
        id: user._id,
        username: user.username,
        role: user.role
      });
    } else {
      console.log(`ERROR: User "${username}" not found.`);
    }

    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
};

promote(process.argv[2]);
