const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public (In production, you might want this protected once first admin is created)
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  const userExists = await User.findOne({ $or: [{ username }, { email }] });

  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Check if this is the first user
  const adminExists = await User.exists({ role: 'admin' });
  const role = adminExists ? 'editor' : 'admin';


  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    role,
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user.id,
      username: user.username,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
