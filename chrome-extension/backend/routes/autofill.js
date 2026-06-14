const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { analyzeAndMapFields } = require('../services/sarvamService');

const router = express.Router();

// POST /api/autofill/analyze
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { pageUrl, pageTitle, forms } = req.body;

    if (!forms || !Array.isArray(forms) || forms.length === 0) {
      return res.status(400).json({ message: 'No form data provided.' });
    }

    // Fetch user's profile from MongoDB
    const user = await User.findOne({ email: req.user.email });
    const profile = user.profile.toObject ? user.profile.toObject() : user.profile;

    // Check if profile has any data
    const hasProfileData = Object.values(profile).some(v => v && v.toString().trim() !== '');
    if (!hasProfileData) {
      return res.status(422).json({
        message: 'Your profile is empty. Please fill in your profile data first.',
      });
    }

    // Call Sarvam AI to analyze and map fields
    const fillMap = await analyzeAndMapFields({
      pageUrl: pageUrl || 'unknown',
      pageTitle: pageTitle || 'unknown',
      forms,
      profile,
    });

    const fieldsCount = Object.keys(fillMap).length;
    res.json({
      fillMap,
      fieldsCount,
      message: `Sarvam AI mapped ${fieldsCount} field${fieldsCount !== 1 ? 's' : ''}.`,
    });
  } catch (err) {
    console.error('[Autofill] Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
