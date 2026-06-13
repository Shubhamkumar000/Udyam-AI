const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-Memory state store for instant startup/demo without DB installation
let businessProfile = {
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
};

let licenses = [
  {
    id: "lic-1",
    type: "GST",
    license_number: "29ABCDE1234F1Z5",
    business_name: "Spice Route Restaurant",
    owner_name: "Rahul Sharma",
    issue_date: "2021-06-15",
    expiry_date: "2028-06-14",
    authority: "Central Board of Indirect Taxes and Customs (CBIC)",
    confidence_score: 0.98,
    portal_url: "https://services.gst.gov.in/services/login",
    status: "Active"
  },
  {
    id: "lic-2",
    type: "FSSAI",
    license_number: "21224009000123",
    business_name: "Spice Route Restaurant",
    owner_name: "Rahul Sharma",
    issue_date: "2023-01-10",
    expiry_date: "2027-01-09",
    authority: "Food Safety and Standards Authority of India (FSSAI)",
    confidence_score: 0.95,
    portal_url: "https://foscos.fssai.gov.in/",
    status: "Active"
  },
  {
    id: "lic-3",
    type: "Trade License",
    license_number: "TL-KAR-2024-8972",
    business_name: "Spice Route Restaurant",
    owner_name: "Rahul Sharma",
    issue_date: "2024-03-25",
    expiry_date: "2026-06-28", // June 28, 2026 (Expiring soon relative to current time)
    authority: "Bruhat Bengaluru Mahanagara Palike (BBMP)",
    confidence_score: 0.92,
    portal_url: "https://bbmp.gov.in",
    status: "Expiring Soon"
  },
  {
    id: "lic-4",
    type: "Shop & Establishment",
    license_number: "SE-KAR-98721",
    business_name: "Spice Route Restaurant",
    owner_name: "Rahul Sharma",
    issue_date: "2022-09-01",
    expiry_date: "2029-08-31",
    authority: "Department of Labour, Government of Karnataka",
    confidence_score: 0.94,
    portal_url: "https://ekarmika.karnataka.gov.in/",
    status: "Active"
  },
  {
    id: "lic-5",
    type: "Fire NOC",
    license_number: "FNOC-BBMP-2022-441",
    business_name: "Spice Route Restaurant",
    owner_name: "Rahul Sharma",
    issue_date: "2022-06-03",
    expiry_date: "2026-06-03", // June 3, 2026 (Expired relative to June 13, 2026)
    authority: "Karnataka State Fire & Emergency Services",
    confidence_score: 0.89,
    portal_url: "https://kfireservices.gov.in/",
    status: "Expired"
  }
];

// POST /upload-license & POST /ocr
app.post('/api/upload-license', (req, res) => {
  const newLic = {
    id: `lic-${Date.now()}`,
    ...req.body
  };
  licenses.push(newLic);
  res.status(201).json(newLic);
});

app.post('/api/ocr', (req, res) => {
  // Simulated backend OCR response
  res.status(200).json({
    status: "success",
    raw_text: "FOOD SAFETY AND STANDARDS AUTHORITY OF INDIA... Reg No 21224009000123... Spice Route Restaurant..."
  });
});

// POST /ai-extract (Mock Sarvam AI prompt parse)
app.post('/api/ai-extract', (req, res) => {
  res.status(200).json({
    license_type: "FSSAI",
    license_number: "21224009000123",
    business_name: "Spice Route Restaurant",
    owner_name: "Rahul Sharma",
    issue_date: "2023-01-10",
    expiry_date: "2027-01-09",
    authority: "Food Safety and Standards Authority of India",
    confidence_score: 0.96
  });
});

// GET /licenses
app.get('/api/licenses', (req, res) => {
  res.json(licenses);
});

app.delete('/api/licenses/:id', (req, res) => {
  licenses = licenses.filter(l => l.id !== req.params.id);
  res.status(200).json({ status: "success" });
});

// GET /dashboard
app.get('/api/dashboard', (req, res) => {
  const activeCount = licenses.filter(l => l.status === 'Active').length;
  const expiringCount = licenses.filter(l => l.status === 'Expiring Soon').length;
  const expiredCount = licenses.filter(l => l.status === 'Expired').length;
  res.json({
    total_licenses: licenses.length,
    active_licenses: activeCount,
    expiring_soon: expiringCount,
    expired_licenses: expiredCount
  });
});

// GET /compliance-score
app.get('/api/compliance-score', (req, res) => {
  let score = 100;
  licenses.forEach(l => {
    if (l.status === 'Expiring Soon') score -= 10;
    if (l.status === 'Expired') score -= 25;
  });
  res.json({ score: Math.max(0, score) });
});

// POST /chat (Sarvam AI Bot query route)
app.post('/api/chat', (req, res) => {
  const { question, language } = req.body;
  res.json({
    answer: `Simulated Sarvam AI advisory answer for query: "${question}" in language: "${language || 'en'}"`
  });
});

// POST /renewal-checklist
app.post('/api/renewal-checklist', (req, res) => {
  const { type } = req.body;
  res.json({
    type,
    steps: ["Verify profile details", "Open Portal", "Review inputs", "Make Fee Payment"],
    documents: ["PAN card", "Previous license copy", "Address declaration"]
  });
});

// GET /portal-links
app.get('/api/portal-links', (req, res) => {
  res.json([
    { license_type: "GST", name: "GST Portal", url: "https://services.gst.gov.in/services/login" },
    { license_type: "FSSAI", name: "FoSCoS Food Safety Portal", url: "https://foscos.fssai.gov.in/" },
    { license_type: "Trade License", name: "BBMP Municipal Portal", url: "https://bbmp.gov.in" }
  ]);
});

// GET & PUT /business-profile
app.get('/api/business-profile', (req, res) => {
  res.json(businessProfile);
});

app.put('/api/business-profile', (req, res) => {
  businessProfile = { ...businessProfile, ...req.body };
  res.json(businessProfile);
});

// Server boot log
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`  UDYAN AI API SERVER - BOOTED SUCCESSFULLY        `);
  console.log(`  Local Endpoint: http://localhost:${PORT}          `);
  console.log(`===================================================`);
});

/*
  NOTE FOR PRODUCTION POSTGRES CONNECTIONS:
  To switch this server to write to a real PostgreSQL instance, configure dotenv:
  
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  Then replace endpoints with database transactions, for example:
  app.get('/api/licenses', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM licenses');
      res.json(result.rows);
    } catch(err) {
      res.status(500).json({ error: err.message });
    }
  });
*/
