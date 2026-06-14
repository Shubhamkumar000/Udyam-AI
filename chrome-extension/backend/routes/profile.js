const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const ALLOWED_PROFILE_FIELDS = [
  'name', 'email', 'phone', 'dob', 'gender',
  'address', 'city', 'state', 'pincode', 'country',
  'linkedin', 'github', 'occupation', 'company',
  'pan', 'aadhaar',
];

// GET /api/profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ profile: user.profile || {} });
  } catch (err) {
    console.error('[Profile GET] Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/profile
router.put('/', authMiddleware, async (req, res) => {
  try {
    console.log('[Profile PUT] Body received:', JSON.stringify(req.body));

    const updates = {};
    ALLOWED_PROFILE_FIELDS.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[`profile.${field}`] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid profile fields provided.' });
    }

    console.log('[Profile PUT] Applying updates:', JSON.stringify(updates));

    const user = await User.findOneAndUpdate(
      { email: req.user.email },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found.' });

    console.log('[Profile PUT] Updated profile:', JSON.stringify(user.profile));
    res.json({ profile: user.profile, message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('[Profile PUT] Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
