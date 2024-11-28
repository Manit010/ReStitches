const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcryptjs');
require('dotenv').config(); // Load environment variables

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

const app = express();
const port = process.env.PORT || 3002;

// Middleware to parse JSON requests
app.use(express.json());

// User Schema
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true }, // Combine first and last name into full name
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// User Model
const User = mongoose.model('User', userSchema);

// Registration Endpoint
app.post('/api/users', async (req, res) => {
  const { fullName, email, password, confirmPassword, userType } = req.body;

  // Validate required fields
  if (!fullName || !email || !password || !confirmPassword || userType === undefined) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  //validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    const result = await user.save();
    res.status(201).json({ message: 'User registered successfully', userId: result._id });
  } catch (error) {
    console.error('Error saving user data:', error);
    res.status(500).json({ message: 'Error saving user data', error });
  }
});

// Endpoint to fetch all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude the password from the response
    res.status(200).json(users);
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({ message: 'Error retrieving users', error });
  }
});

// Endpoint to fetch a single user by email
app.get('/api/users/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email }, '-password'); // Exclude the password from the response
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error retrieving user:', error);
    res.status(500).json({ message: 'Error retrieving user', error });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
