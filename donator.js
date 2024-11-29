const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.envD' });

const app = express();
const port = process.env.PORT || 3006;

// Middleware
app.use(express.json());
app.use(express.static('public')); // Serve static files from "public"
const cors = require('cors');
app.use(cors()); // Enable CORS for all requests

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Database connection error:', err));

// Donation Schema (New schema for donation data)
const donationSchema = new mongoose.Schema({
    yearsOfCloth: { type: String, required: true },
    originalCost: { type: String, required: true },
    genderOfCloth: { type: String, required: true },
    description: { type: String, required: true },
    imageLink: { type: String, required: true },
});

const Donation = mongoose.model('Donation', donationSchema);

// Login API (No changes to this part)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide both email and password' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        res.json({
            message: 'Login successful',
            user: { fullName: user.fullName, email: user.email },
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// Donation API (New API endpoint)
app.post('/api/donate', async (req, res) => {
    const { yearsOfCloth, originalCost, genderOfCloth, description, imageLink } = req.body;

    if (!yearsOfCloth || !originalCost || !genderOfCloth || !description || !imageLink) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Create a new donation entry
        const donation = new Donation({
            yearsOfCloth,
            originalCost,
            genderOfCloth,
            description,
            imageLink
        });

        // Save the donation to the database
        await donation.save();

        // Respond with success
        res.status(200).json({ message: 'Donation received successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// Start the Server
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));