require('dotenv').config();
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn("Could not set DNS servers:", e);
}
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'udyam_super_secret_key_12345';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/udyam_db';

app.use(cors());
app.use(express.json());

// Set up local file uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });
const { analyzeComplianceRisk, analyzeSingleLicense } = require('./riskEngine');

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB database.'))
  .catch(err => console.error('MongoDB database connection error:', err));

// ==========================================
// MONGOOSE SCHEMAS & MODELS
// ==========================================

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const BusinessProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  businessName: { type: String, default: '' },
  ownerName: { type: String, default: '' },
  email: { type: String, default: '' },
  mobile: { type: String, default: '' },
  gstin: { type: String, default: '' },
  fssai_number: { type: String, default: '' },
  trade_license_number: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  district: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  pan: { type: String, default: '' },
  aadhaar: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

const OnboardingAnswersSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  businessSector: { type: String, default: '' },
  employeeCountRange: { type: String, default: '' },
  annualRevenueRange: { type: String, default: '' },
  locationCount: { type: String, default: '' },
  premisesType: { type: String, default: '' },
  dailyFootfall: { type: String, default: '' },
  businessOperations: { type: [String], default: [] },
  hazardousMaterials: { type: String, default: '' },
  existingLicenses: { type: [String], default: [] },
  compliancePriority: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

const LicenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  businessName: { type: String, default: '' },
  ownerName: { type: String, default: '' },
  issueDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  authority: { type: String, default: '' },
  confidenceScore: { type: Number, default: 1.0 },
  portalUrl: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Expiring Soon', 'Expired'], default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

const DocumentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  docType: { type: String, enum: ['Aadhaar', 'PAN', 'License'], required: true },
  rawOcrText: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now }
});

const ComplianceProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  complianceScore: { type: Number, default: 100 },
  riskLevel: { type: String, default: 'Low Risk' },
  requiredLicenses: { type: [String], default: [] },
  existingLicenses: { type: [String], default: [] },
  missingLicenses: { type: [String], default: [] },
  expiringLicenses: { type: [String], default: [] },
  expiredLicenses: { type: [String], default: [] },
  upcomingRenewals: { type: mongoose.Schema.Types.Mixed, default: [] },
  complianceInsights: { type: [String], default: [] },
  recommendedActions: { type: [String], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

const ReminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  licenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'License' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Sent', 'Completed'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const BusinessProfile = mongoose.model('BusinessProfile', BusinessProfileSchema);
const OnboardingAnswers = mongoose.model('OnboardingAnswers', OnboardingAnswersSchema);
const License = mongoose.model('License', LicenseSchema);
const Document = mongoose.model('Document', DocumentSchema);
const ComplianceProfile = mongoose.model('ComplianceProfile', ComplianceProfileSchema);
const Reminder = mongoose.model('Reminder', ReminderSchema);

// ==========================================
// MIDDLEWARES
// ==========================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// ==========================================
// COMPLIANCE ENGINE IMPLEMENTATION
// ==========================================

async function recalculateCompliance(userId) {
  const onboarding = await OnboardingAnswers.findOne({ userId });
  const sector = onboarding ? onboarding.businessSector : '';

  const licenses = await License.find({ userId });
  const today = new Date("2026-06-13"); // Mock Current Date

  // 1. Map sector to required licenses
  let requiredLicenses = [];
  if (sector === 'Restaurant / Food Service') {
    requiredLicenses = ['FSSAI', 'GST', 'Trade License', 'Fire NOC', 'Shop & Establishment', 'Eating House License'];
  } else if (sector === 'Manufacturing Unit') {
    requiredLicenses = ['Factory License', 'Pollution Consent', 'Fire NOC', 'GST', 'Trade License'];
  } else if (sector === 'Pharmacy / Medical Store') {
    requiredLicenses = ['Drug License', 'GST', 'Trade License', 'Shop & Establishment'];
  } else if (sector === 'Hospital / Clinic') {
    requiredLicenses = ['Clinical Establishment License', 'Biomedical Waste Authorization', 'Fire NOC', 'GST'];
  } else if (sector === 'Hotel / Resort') {
    requiredLicenses = ['FSSAI', 'Fire NOC', 'Trade License', 'GST', 'Shop & Establishment'];
  } else if (sector === 'Educational Institution') {
    requiredLicenses = ['Education Board Affiliation', 'Fire NOC', 'Building Safety Certificate', 'Trade License'];
  }

  // 2. Assess license states
  const expiredLicensesList = [];
  const expiringLicensesList = [];
  const activeLicensesList = [];

  for (const l of licenses) {
    const expDate = new Date(l.expiryDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      l.status = 'Expired';
      expiredLicensesList.push(l.type);
    } else if (diffDays <= 60) {
      l.status = 'Expiring Soon';
      expiringLicensesList.push(l.type);
    } else {
      l.status = 'Active';
      activeLicensesList.push(l.type);
    }
    await l.save();
  }

  const uploadedTypes = licenses.map(l => l.type);
  const existingLicenses = requiredLicenses.filter(type => uploadedTypes.includes(type));
  const missingLicenses = requiredLicenses.filter(type => !uploadedTypes.includes(type));

  // 3. Compliance Score Calculation
  // Start score = 100
  // Subtract 15 for each missing required license
  // Subtract 10 for each expiring license
  // Subtract 25 for each expired license
  let score = 100;
  score -= missingLicenses.length * 15;
  
  licenses.forEach(l => {
    if (l.status === 'Expiring Soon') score -= 10;
    if (l.status === 'Expired') score -= 25;
  });
  score = Math.max(0, score);

  // 4. Compliance Risk Levels
  let riskLevel = 'Low Risk';
  if (score >= 90) riskLevel = 'Low Risk';
  else if (score >= 70) riskLevel = 'Medium Risk';
  else if (score >= 50) riskLevel = 'High Risk';
  else riskLevel = 'Critical Risk';

  // 5. Build Renewal Calendar
  const upcomingRenewals = licenses
    .filter(l => l.status === 'Expired' || l.status === 'Expiring Soon')
    .map(l => ({
      licenseId: l._id,
      type: l.type,
      expiryDate: l.expiryDate,
      status: l.status,
      daysRemaining: Math.ceil((new Date(l.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }))
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  // 6. Generate Insights & Actions
  const complianceInsights = [];
  const recommendedActions = [];

  if (missingLicenses.length > 0) {
    complianceInsights.push(`Your business is missing ${missingLicenses.length} required regulatory licenses for the ${sector || 'selected'} sector.`);
    missingLicenses.forEach(lic => {
      recommendedActions.push(`Apply for ${lic} License on the official portal to secure operation standing.`);
    });
  } else if (sector) {
    complianceInsights.push(`Excellent! Your business possesses all ${requiredLicenses.length} required licenses for the ${sector} sector.`);
  }

  licenses.forEach(l => {
    if (l.status === 'Expired') {
      complianceInsights.push(`Critical: Your ${l.type} license (No: ${l.licenseNumber}) expired on ${l.expiryDate.toISOString().split('T')[0]}.`);
      recommendedActions.push(`Begin ${l.type} renewal on official portal. Pay fine surcharges immediately.`);
    } else if (l.status === 'Expiring Soon') {
      const days = Math.ceil((new Date(l.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      complianceInsights.push(`Warning: Your ${l.type} license (No: ${l.licenseNumber}) expires in ${days} days.`);
      recommendedActions.push(`Prepare documents and submit renewal application for ${l.type}.`);
    }
  });

  await ComplianceProfile.findOneAndUpdate(
    { userId },
    {
      complianceScore: score,
      riskLevel,
      requiredLicenses,
      existingLicenses,
      missingLicenses,
      expiringLicenses: expiringLicensesList,
      expiredLicenses: expiredLicensesList,
      upcomingRenewals,
      complianceInsights,
      recommendedActions,
      updatedAt: new Date()
    },
    { upsert: true, new: true }
  );

  // Create notifications/reminders
  await Reminder.deleteMany({ userId, status: 'Pending' });
  for (const l of licenses) {
    if (l.status === 'Expired' || l.status === 'Expiring Soon') {
      const dueDate = new Date(l.expiryDate);
      await Reminder.create({
        userId,
        licenseId: l._id,
        title: `${l.type} Renewal Alert`,
        message: l.status === 'Expired'
          ? `Your ${l.type} license has expired. Compliance standing is Critical.`
          : `Your ${l.type} license expires in ${Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days.`,
        dueDate,
        status: 'Pending'
      });
    }
  }
}

// ==========================================
// ROUTE HANDLERS
// ==========================================

// 1. Auth Routing
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, fullName } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'User with this email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, fullName });
    
    // Seed blank business profile
    await BusinessProfile.create({ userId: user._id, email: user.email, ownerName: user.fullName });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, email: user.email, fullName: user.fullName } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

    // Check onboarding answers completeness
    const onboarding = await OnboardingAnswers.findOne({ userId: user._id });
    const onboardingCompleted = !!(onboarding && onboarding.businessSector);

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { id: user._id, email: user.email, fullName: user.fullName },
      onboardingCompleted
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Identity Verification & OCR Uploads
app.post('/api/identity/upload', authenticateToken, upload.fields([{ name: 'aadhaar' }, { name: 'pan' }]), async (req, res) => {
  try {
    const files = req.files;
    const { phone, fullName, address, panNumber } = req.body;

    if (!files) return res.status(400).json({ error: 'Files are required for upload' });

    const results = {};

    // Handle Aadhaar
    if (files.aadhaar && files.aadhaar[0]) {
      const file = files.aadhaar[0];
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
      
      // Save Document metadata
      await Document.create({
        userId: req.user.id,
        fileName: file.originalname,
        fileUrl,
        docType: 'Aadhaar',
        rawOcrText: `AADHAAR CARD - GOVT OF INDIA\nName: ${fullName || req.user.fullName || 'Rahul Sharma'}\nAddress: ${address || 'MG Road, Bengaluru, Karnataka - 560001'}\nUID: 1234-5678-9012`
      });

      results.aadhaar = {
        url: fileUrl,
        extracted: {
          full_name: fullName || req.user.fullName || 'Rahul Sharma',
          address: address || "MG Road, Bengaluru, Karnataka - 560001"
        }
      };
    }

    // Handle PAN
    if (files.pan && files.pan[0]) {
      const file = files.pan[0];
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
      
      // Save Document metadata
      await Document.create({
        userId: req.user.id,
        fileName: file.originalname,
        fileUrl,
        docType: 'PAN',
        rawOcrText: `INCOME TAX DEPARTMENT - GOVT OF INDIA\nPAN CARD\nName: ${fullName || req.user.fullName || 'Rahul Sharma'}\nPAN: ${panNumber || 'ABCDE1234F'}`
      });

      results.pan = {
        url: fileUrl,
        extracted: {
          pan_number: panNumber || "ABCDE1234F"
        }
      };
    }

    // Parse address parts if provided
    let city = '';
    let state = '';
    let pincode = '';
    if (address) {
      const parts = address.split(',').map(p => p.trim());
      // Try to find pincode
      const pinMatch = address.match(/\d{6}/);
      if (pinMatch) pincode = pinMatch[0];
      
      // Guess city and state from parts
      if (parts.length >= 2) {
        city = parts[parts.length - 2];
        const statePart = parts[parts.length - 1];
        state = statePart.replace(pincode, '').trim().replace(/-$/, '').trim();
      } else {
        city = 'Bengaluru';
        state = 'Karnataka';
      }
    }

    // Update business profile with phone & OCR outputs
    const updatedProfile = await BusinessProfile.findOneAndUpdate(
      { userId: req.user.id },
      {
        mobile: phone || '',
        aadhaar: results.aadhaar ? "1234-5678-9012" : "",
        pan: panNumber || (results.pan ? "ABCDE1234F" : ""),
        ownerName: fullName || req.user.fullName || '',
        address: address || '',
        city: city || (results.aadhaar ? "Bengaluru" : ""),
        state: state || (results.aadhaar ? "Karnataka" : ""),
        pincode: pincode || (results.aadhaar ? "560001" : ""),
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      status: "success",
      extracted: {
        full_name: fullName || req.user.fullName || 'Rahul Sharma',
        address: address || "",
        pan_number: panNumber || ""
      },
      profile: updatedProfile
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Real Sarvam AI KYC Document Data Extraction Route
app.post('/api/ai-extract-identity', authenticateToken, async (req, res) => {
  const { rawAadhaarText, rawPanText } = req.body;
  
  console.log('\n--- AI KYC Extraction Triggered ---');
  console.log('Aadhaar OCR Text length:', rawAadhaarText?.length || 0);
  console.log('PAN OCR Text length:', rawPanText?.length || 0);
  console.log('Sarvam API Key present:', !!process.env.SARVAM_API_KEY);
  
  let fullName = 'Rahul Sharma';
  let address = 'MG Road, Bengaluru, Karnataka - 560001';
  let panNumber = 'ABCDE1234F';
  
  if (process.env.SARVAM_API_KEY && (rawAadhaarText || rawPanText)) {
    try {
      const prompt = `You are a document extraction AI. Extract the document owner's full name, address, and PAN card number from the raw OCR text below.
      
Aadhaar Document OCR Text:
"""
${rawAadhaarText || 'None'}
"""

PAN Card Document OCR Text:
"""
${rawPanText || 'None'}
"""

Respond ONLY with a JSON object in this format (do not include any markdown code blocks, backticks, or other text outside of the JSON object):
{
  "fullName": "Name extracted from Aadhaar/PAN",
  "address": "Address extracted from Aadhaar",
  "panNumber": "PAN number extracted from PAN card"
}

If you cannot extract a field, use the default mock values.`;

      const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': process.env.SARVAM_API_KEY
        },
        body: JSON.stringify({
          model: 'sarvam-105b',
          messages: [
            { role: 'system', content: 'You are an extraction assistant.' },
            { role: 'user', content: prompt }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const contentStr = data.choices[0].message.content.trim();
        console.log('Sarvam AI raw response:\n', contentStr);
        const jsonStr = contentStr.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        if (parsed.fullName) fullName = parsed.fullName;
        if (parsed.address) address = parsed.address;
        if (parsed.panNumber) panNumber = parsed.panNumber;
      } else {
        console.error('Sarvam AI request failed. Status:', response.status, await response.text());
      }
    } catch (e) {
      console.error("Failed to run Sarvam extraction on KYC:", e);
    }
  } else {
    console.log('Skipping Sarvam call: No API Key or empty OCR inputs.');
  }

  console.log('Returning Extracted Data:', { fullName, address, panNumber });
  res.json({ fullName, address, panNumber });
});

// Real Sarvam AI License Document Data Extraction Route
app.post('/api/ai-extract-license', authenticateToken, async (req, res) => {
  const { rawText, licenseType } = req.body;
  
  console.log('\n--- AI License Extraction Triggered ---');
  console.log('License Type:', licenseType);
  console.log('OCR Text length:', rawText?.length || 0);
  console.log('Sarvam API Key present:', !!process.env.SARVAM_API_KEY);
  
  let licenseNumber = `REG-${Math.floor(100000 + Math.random() * 900000)}`;
  let businessName = 'Spice Route Restaurant';
  let ownerName = 'Rahul Sharma';
  let issueDate = '2023-01-10';
  let expiryDate = '2027-01-09';
  let authority = 'Government Registry Board';
  
  // Set defaults based on type
  if (licenseType === 'GST') {
    licenseNumber = '29ABCDE1234F1Z5';
    authority = 'Central Board of Indirect Taxes and Customs (CBIC)';
    issueDate = '2021-06-15';
    expiryDate = '2028-06-14';
  } else if (licenseType === 'FSSAI') {
    licenseNumber = '21224009000123';
    authority = 'Food Safety and Standards Authority of India (FSSAI)';
    issueDate = '2023-01-10';
    expiryDate = '2027-01-09';
  } else if (licenseType === 'Trade License') {
    licenseNumber = 'TL-KAR-2024-8972';
    authority = 'Bruhat Bengaluru Mahanagara Palike (BBMP)';
    issueDate = '2024-03-25';
    expiryDate = '2026-06-28';
  } else if (licenseType === 'Fire NOC') {
    licenseNumber = 'FNOC-BBMP-2022-441';
    authority = 'State Fire & Emergency Services';
    issueDate = '2022-06-03';
    expiryDate = '2026-06-03';
  }

  if (process.env.SARVAM_API_KEY && rawText) {
    try {
      const prompt = `You are a document extraction AI. Extract the following details for a ${licenseType} certificate from the raw OCR text below:
- License/Registration Number
- Business/Firm Name
- Owner/Proprietor Name
- Issue Date (YYYY-MM-DD format)
- Expiry Date (YYYY-MM-DD format)
- Issuing Authority

OCR Text:
"""
${rawText}
"""

Respond ONLY with a JSON object in this format (do not include any markdown code blocks, backticks, or other text outside of the JSON object):
{
  "licenseNumber": "extracted number",
  "businessName": "extracted business name",
  "ownerName": "extracted owner name",
  "issueDate": "extracted issue date in YYYY-MM-DD format",
  "expiryDate": "extracted expiry date in YYYY-MM-DD format",
  "authority": "extracted issuing authority"
}

If any field is missing, use the default mock values.`;

      const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': process.env.SARVAM_API_KEY
        },
        body: JSON.stringify({
          model: 'sarvam-105b',
          messages: [
            { role: 'system', content: 'You are an extraction assistant.' },
            { role: 'user', content: prompt }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const contentStr = data.choices[0].message.content.trim();
        console.log('Sarvam AI raw response:\n', contentStr);
        const jsonStr = contentStr.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        if (parsed.licenseNumber) licenseNumber = parsed.licenseNumber;
        if (parsed.businessName) businessName = parsed.businessName;
        if (parsed.ownerName) ownerName = parsed.ownerName;
        if (parsed.issueDate) issueDate = parsed.issueDate;
        if (parsed.expiryDate) expiryDate = parsed.expiryDate;
        if (parsed.authority) authority = parsed.authority;
      } else {
        console.error('Sarvam AI request failed. Status:', response.status, await response.text());
      }
    } catch (e) {
      console.error("Failed to run Sarvam extraction on license:", e);
    }
  } else {
    console.log('Skipping Sarvam call: No API Key or empty OCR inputs.');
  }

  console.log('Returning Extracted Data:', { licenseNumber, businessName, ownerName, issueDate, expiryDate, authority });
  res.json({ licenseNumber, businessName, ownerName, issueDate, expiryDate, authority });
});

// 3. Business Profile & Onboarding Wizard APIs
app.get('/api/business-profile', async (req, res) => {
  let userId;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (err) {}
  }

  try {
    let profile;
    if (userId) {
      profile = await BusinessProfile.findOne({ userId });
    } else {
      profile = await BusinessProfile.findOne().sort({ updatedAt: -1 });
    }

    if (!profile) {
      return res.json({
        business_name: "Spice Route Restaurant",
        owner_name: "Rahul Sharma",
        email: "rahul@spiceroute.in",
        mobile: "9876543210",
        gstin: "29ABCDE1234F1Z5",
        fssai_number: "21224009000123",
        trade_license_number: "TL-KAR-2024-8972",
        address: "MG Road, Bengaluru",
        city: "Bengaluru",
        district: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        pan: "ABCDE1234F",
        aadhaar: "1234-5678-9012"
      });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/business-profile', authenticateToken, async (req, res) => {
  try {
    const profile = await BusinessProfile.findOneAndUpdate(
      { userId: req.user.id },
      { ...req.body, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    // Sync to compliance profile as well
    await recalculateCompliance(req.user.id);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/onboarding', authenticateToken, async (req, res) => {
  try {
    const answers = await OnboardingAnswers.findOneAndUpdate(
      { userId: req.user.id },
      { ...req.body, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    // Also populate details in business profile if set in request
    if (req.body.businessName || req.body.business_name) {
      await BusinessProfile.findOneAndUpdate(
        { userId: req.user.id },
        { 
          businessName: req.body.businessName || req.body.business_name,
          updatedAt: new Date()
        }
      );
    }

    await recalculateCompliance(req.user.id);
    res.json({ status: "success", answers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/onboarding', authenticateToken, async (req, res) => {
  try {
    const answers = await OnboardingAnswers.findOne({ userId: req.user.id });
    res.json(answers || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Licenses API
app.get('/api/licenses', authenticateToken, async (req, res) => {
  try {
    const licenses = await License.find({ userId: req.user.id });
    res.json(licenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload-license', authenticateToken, upload.single('licenseFile'), async (req, res) => {
  try {
    let fileUrl = '';
    if (req.file) {
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      await Document.create({
        userId: req.user.id,
        fileName: req.file.originalname,
        fileUrl,
        docType: 'License',
        rawOcrText: `Uploaded license document details`
      });
    }

    let portalUrl = req.body.portal_url || req.body.portalUrl;
    if (!portalUrl) {
      const type = req.body.type;
      if (type === 'FSSAI') {
        portalUrl = 'https://foodlicenseportal.org/Home/renew?gad_source=1&gad_campaignid=23038392925&gbraid=0AAAAACzocouD9ojWtNfBiCtpWM2iev4Kp&gclid=Cj0KCQjw_7PRBhDcARIsAMjV7jnDkAkl_H_guWUD_Spud_xBdQ1LIoXh2ZWCh0R9HprCRjXePuHlHIcaAj4YEALw_wcB';
      } else if (type === 'GST') {
        portalUrl = 'https://services.gst.gov.in/services/login';
      } else if (type === 'Trade License') {
        portalUrl = 'https://bbmp.gov.in';
      } else if (type === 'Shop & Establishment') {
        portalUrl = 'https://ekarmika.karnataka.gov.in/';
      } else if (type === 'Fire NOC') {
        portalUrl = 'https://kfireservices.gov.in/';
      } else {
        portalUrl = 'https://india.gov.in';
      }
    }

    const newLic = await License.create({
      userId: req.user.id,
      type: req.body.type,
      licenseNumber: req.body.license_number || req.body.licenseNumber,
      businessName: req.body.business_name || req.body.businessName || '',
      ownerName: req.body.owner_name || req.body.ownerName || '',
      issueDate: req.body.issue_date || req.body.issueDate || new Date(),
      expiryDate: req.body.expiry_date || req.body.expiryDate || new Date(),
      authority: req.body.authority || '',
      confidenceScore: req.body.confidence_score || req.body.confidenceScore || 0.95,
      portalUrl
    });

    // Also sync business profile numbers
    const updateFields = {};
    if (newLic.type === 'GST') updateFields.gstin = newLic.licenseNumber;
    if (newLic.type === 'FSSAI') updateFields.fssai_number = newLic.licenseNumber;
    if (newLic.type === 'Trade License') updateFields.trade_license_number = newLic.licenseNumber;
    if (Object.keys(updateFields).length > 0) {
      await BusinessProfile.findOneAndUpdate({ userId: req.user.id }, updateFields);
    }

    await recalculateCompliance(req.user.id);
    res.status(201).json(newLic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/licenses/:id', authenticateToken, async (req, res) => {
  try {
    await License.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    await recalculateCompliance(req.user.id);
    res.status(200).json({ status: "success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Compliance Profile & Dashboard API
app.get('/api/compliance-profile', authenticateToken, async (req, res) => {
  try {
    await recalculateCompliance(req.user.id);
    const profile = await ComplianceProfile.findOne({ userId: req.user.id });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Compliance Risk Engine
app.get('/api/compliance-risk', authenticateToken, async (req, res) => {
  try {
    await recalculateCompliance(req.user.id);

    const licenses = await License.find({ userId: req.user.id });
    const onboarding = await OnboardingAnswers.findOne({ userId: req.user.id });
    const businessProfile = await BusinessProfile.findOne({ userId: req.user.id });

    const report = analyzeComplianceRisk({
      licenses,
      onboarding: onboarding || {},
      businessProfile: businessProfile || {},
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/compliance-risk/license/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const licenses = await License.find({ userId: req.user.id, type });
    const onboarding = await OnboardingAnswers.findOne({ userId: req.user.id });

    if (licenses.length === 0) {
      const { detectMissingLicenses, estimateMissingLicenseImpact, SECTOR_REQUIRED_LICENSES } = require('./riskEngine');
      const sector = onboarding?.businessSector || '';
      const uploadedTypes = (await License.find({ userId: req.user.id })).map((l) => l.type);
      const missing = detectMissingLicenses(sector, uploadedTypes).find((m) => m.licenseType === type);

      if (missing || (SECTOR_REQUIRED_LICENSES[sector] || []).includes(type)) {
        const impact = missing || estimateMissingLicenseImpact(type);
        return res.json({
          licenseType: type,
          status: 'MISSING',
          riskLevel: impact.risk === 'HIGH' ? 'HIGH' : 'MEDIUM',
          urgency: impact.risk,
          daysUntilExpiry: null,
          daysSinceExpiry: null,
          estimatedPenalty: {
            min: impact.penaltyEstimate.min,
            max: impact.penaltyEstimate.max,
            formatted: impact.penaltyEstimate.formatted,
            confidence: 70,
          },
          recommendedAction: impact.recommendedAction,
          legalConsequences: impact.legalConsequences,
          potentialImpact: impact.potentialImpact,
        });
      }

      return res.status(404).json({ error: 'License not found' });
    }

    const assessment = analyzeSingleLicense(licenses[0], onboarding || {});
    res.json(assessment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const licensesList = await License.find({ userId: req.user.id });
    const profile = await ComplianceProfile.findOne({ userId: req.user.id });

    const activeCount = licensesList.filter(l => l.status === 'Active').length;
    const expiringCount = licensesList.filter(l => l.status === 'Expiring Soon').length;
    const expiredCount = licensesList.filter(l => l.status === 'Expired').length;

    res.json({
      total_licenses: licensesList.length,
      active_licenses: activeCount,
      expiring_soon: expiringCount,
      expired_licenses: expiredCount,
      score: profile ? profile.complianceScore : 100,
      riskLevel: profile ? profile.riskLevel : 'Low Risk'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. AI Advisory Assistant Route
app.post('/api/chat', authenticateToken, async (req, res) => {
  const { question, language } = req.body;
  if (!question) return res.status(400).json({ error: 'Question is required' });

  try {
    // Gather context
    const profile = await BusinessProfile.findOne({ userId: req.user.id });
    const onboarding = await OnboardingAnswers.findOne({ userId: req.user.id });
    const compliance = await ComplianceProfile.findOne({ userId: req.user.id });
    const licensesList = await License.find({ userId: req.user.id });

    const contextSummary = `
User Profile:
- Business Name: ${profile?.businessName || 'N/A'}
- Sector: ${onboarding?.businessSector || 'N/A'}
- Score: ${compliance?.complianceScore ?? 100}
- Risk Level: ${compliance?.riskLevel || 'Low Risk'}
- Missing Licenses: ${compliance?.missingLicenses?.join(', ') || 'None'}
- Expired Licenses: ${compliance?.expiredLicenses?.join(', ') || 'None'}
- Expiring Licenses: ${compliance?.expiringLicenses?.join(', ') || 'None'}
- Existing Licenses: ${licensesList.map(l => `${l.type} (${l.licenseNumber})`).join(', ') || 'None'}
`;

    // Call Sarvam AI Chat API if API key is present, otherwise use local fallback
    let answer = '';
    let success = false;

    if (process.env.SARVAM_API_KEY) {
      try {
        const systemPrompt = `You are Udyan AI Compliance copilot, a helpful compliance advisor for Indian businesses.
Respond in ${language === 'hi' ? 'Hindi' : language === 'kn' ? 'Kannada' : language === 'te' ? 'Telugu' : language === 'ta' ? 'Tamil' : 'English'}.
Here is the user's business compliance status:
${contextSummary}

Please answer the user's question accurately, professionally, and contextually based on their business profile and Indian municipal/government compliance regulations. Keep the response concise and formatted in markdown.`;

        const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': process.env.SARVAM_API_KEY
          },
          body: JSON.stringify({
            model: 'sarvam-105b',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: question }
            ]
          })
        });

        if (response.ok) {
          const chatData = await response.json();
          if (chatData && chatData.choices && chatData.choices[0] && chatData.choices[0].message) {
            answer = chatData.choices[0].message.content;
            success = true;
          }
        } else {
          console.error('Sarvam AI API request failed with status:', response.status, await response.text());
        }
      } catch (err) {
        console.error('Error contacting Sarvam AI API, falling back to offline advisor:', err);
      }
    }

    if (!success) {
      // Offline fallback adviser logic
      const qUpper = question.toUpperCase();
      if (qUpper.includes('WHAT LICENSES DO I NEED') || qUpper.includes('REQUIRED')) {
        answer = `Based on your business sector **${onboarding?.businessSector || 'N/A'}**, you require the following licenses:
${compliance?.requiredLicenses?.map(lic => `- **${lic}**`).join('\n') || '- GST\n- FSSAI\n- Trade License\n- Fire NOC'}.`;
      } else if (qUpper.includes('MISSING') || qUpper.includes('WHAT LICENSES ARE MISSING')) {
        if (compliance?.missingLicenses && compliance.missingLicenses.length > 0) {
          answer = `You are currently missing **${compliance.missingLicenses.length}** required licenses:
${compliance.missingLicenses.map(lic => `- **${lic}**`).join('\n')}
Please apply for these licenses immediately on the government portals to avoid business penalties.`;
        } else {
          answer = `You have no missing licenses! All required documents for **${onboarding?.businessSector || 'N/A'}** are uploaded and active.`;
        }
      } else if (qUpper.includes('PENALTIES') || qUpper.includes('PENALTY')) {
        answer = `Operating without active licenses carries significant penalties:
- **FSSAI Expired**: Flat ₹100/day penalty starting from expiry date. Fines up to ₹5,00,005 for safety violations.
- **GST Inactive**: Deactivation of GSTIN, blockage of E-way bills, 10% tax penalty or flat ₹10,000.
- **Trade License Expired**: Premises sealing and 50% surcharge fine on municipal fee.
- **Fire NOC Missing**: Instant suspension of eating/commercial license, liability and invalid insurance.`;
      } else if (qUpper.includes('UPCOMING') || qUpper.includes('RENEWALS') || qUpper.includes('EXPIRING')) {
        if (compliance?.upcomingRenewals && compliance.upcomingRenewals.length > 0) {
          answer = `Here are your upcoming renewals:
${compliance.upcomingRenewals.map(l => `- **${l.type}**: Expires in ${l.daysRemaining} days (Date: ${new Date(l.expiryDate).toDateString()})`).join('\n')}`;
        } else {
          answer = `You have no upcoming license renewals. All your uploaded licenses are active and valid for over 60 days.`;
        }
      } else if (qUpper.includes('IMPROVE') || qUpper.includes('SCORE')) {
        answer = `Your current Compliance Health Score is **${compliance?.complianceScore ?? 100}/100**. Here is how you can improve it:
${compliance?.missingLicenses?.map(lic => `- Upload the missing **${lic}** license (-15 points deduction)`).join('\n') || ''}
${licensesList.filter(l => l.status === 'Expired').map(l => `- Renew the expired **${l.type}** license (-25 points deduction)`).join('\n') || ''}
${licensesList.filter(l => l.status === 'Expiring Soon').map(l => `- Renew the expiring **${l.type}** license (-10 points deduction)`).join('\n') || ''}
Once these licenses are uploaded and active, your score will revert back to a clean **100/100 (Low Risk)**.`;
      } else if (qUpper.includes('DOCUMENTS') || qUpper.includes('RENEWAL DOCUMENTS')) {
        answer = `To renew your licenses, you generally require:
1. **FSSAI**: Original certificate, owner Aadhaar/PAN, rent/lease deed, list of items/menu.
2. **GST**: REG-06 certificate, bank passbook, authorized signatory board resolution.
3. **Trade License**: Previous trade certificate, latest property tax receipt, NOC from building owner.
4. **Fire NOC**: Compliance report of safety installations, layouts, refilling certificate of fire extinguishers.`;
      } else {
        answer = `I have reviewed your compliance profile for **${profile?.businessName || 'Spice Route Restaurant'}**.
Regarding your question "${question}":
This is a compliance copilot response. Please make sure that your **${compliance?.missingLicenses?.join(', ') || 'missing licenses'}** are renewed or registered on official portals. You currently have a compliance score of **${compliance?.complianceScore ?? 100}** which falls in the **${compliance?.riskLevel || 'Low Risk'}** band.`;
      }
    }

    res.json({
      answer,
      context: contextSummary
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Meta portals
app.get('/api/portal-links', (req, res) => {
  res.json([
    { license_type: "GST", name: "GST Portal", url: "https://services.gst.gov.in/services/login" },
    { license_type: "FSSAI", name: "Food License Portal", url: "https://foodlicenseportal.org/Home/renew?gad_source=1&gad_campaignid=23038392925&gbraid=0AAAAACzocouD9ojWtNfBiCtpWM2iev4Kp&gclid=Cj0KCQjw_7PRBhDcARIsAMjV7jnDkAkl_H_guWUD_Spud_xBdQ1LIoXh2ZWCh0R9HprCRjXePuHlHIcaAj4YEALw_wcB" },
    { license_type: "Trade License", name: "BBMP Municipal Portal", url: "https://bbmp.gov.in" },
    { license_type: "Shop & Establishment", name: "Labour e-Karmika Portal", url: "https://ekarmika.karnataka.gov.in/" },
    { license_type: "Fire NOC", name: "Fire Services Portal", url: "https://kfireservices.gov.in/" }
  ]);
});

// Boot server (only for local development)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`  UDYAMAI MONGO-API SERVER - RUNNING SUCCESS       `);
    console.log(`  Local Address: http://localhost:${PORT}           `);
    console.log(`===================================================`);
  });
}

// Export for Vercel serverless function
module.exports = app;
