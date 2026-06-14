# FormFill AI — Chrome Extension

AI-powered form autofill: verify your identity, store your profile in MongoDB, and let **Sarvam AI** intelligently map your data to any web form.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Chrome Extension                         │
│                                                             │
│  ┌──────────┐   ┌─────────────────┐   ┌─────────────────┐  │
│  │  Popup   │──▶│ Background SW   │   │ Content Script  │  │
│  │  UI/Auth │   │ Tab management  │   │ Extract forms   │  │
│  └──────────┘   └─────────────────┘   │ Fill forms      │  │
│       │                               └────────▲────────┘  │
│       │ fetch                                   │ message   │
│       ▼                                         │           │
└───────┼─────────────────────────────────────────┼───────────┘
        │                                         │
        ▼                                         │
┌───────────────────────────────────┐             │
│         Node.js Backend           │             │
│                                   │◀────────────┘
│  POST /api/auth/login             │  fillMap returned
│  POST /api/auth/register          │  to content script
│  GET  /api/auth/me                │
│  GET  /api/profile                │
│  PUT  /api/profile                │
│  POST /api/autofill/analyze       │
│                   │               │
│                   ▼               │
│          Sarvam AI (sarvam-m)     │
│          analyzeAndMapFields()    │
│                   │               │
│                   ▼               │
│             MongoDB Atlas         │
│          (User + Profile)         │
└───────────────────────────────────┘
```

## Project Structure

```
formfill-ai/
├── backend/                    ← Node.js + Express API
│   ├── middleware/
│   │   └── auth.js             ← JWT auth middleware
│   ├── models/
│   │   └── User.js             ← Mongoose User + Profile schema
│   ├── routes/
│   │   ├── auth.js             ← Register / Login / Me
│   │   ├── profile.js          ← Get / Update profile
│   │   └── autofill.js         ← Sarvam AI autofill endpoint
│   ├── services/
│   │   └── sarvamService.js    ← Sarvam AI integration
│   ├── server.js               ← Express app entry point
│   ├── package.json
│   └── .env.example            ← Copy to .env and fill in values
│
└── extension/                  ← Chrome MV3 Extension
    ├── manifest.json
    ├── popup/
    │   ├── popup.html
    │   ├── popup.css
    │   └── popup.js
    ├── content/
    │   └── content.js          ← Form extraction + filling
    ├── background/
    │   └── service_worker.js   ← Tab management
    └── assets/
        ├── icon16.png          ← Add your icons here
        ├── icon48.png
        └── icon128.png
```

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | Random secret, min 32 chars |
| `SARVAM_API_KEY` | From https://dashboard.sarvam.ai |
| `ALLOWED_ORIGIN` | Your Chrome extension origin (fill after step 2) |

```bash
npm run dev     # development (nodemon)
# or
npm start       # production
```

### 2. Load the Chrome Extension

1. Open `chrome://extensions/`
2. Enable **Developer Mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Copy the **Extension ID** shown on the card
6. Update `.env` → `ALLOWED_ORIGIN=chrome-extension://YOUR_EXTENSION_ID`
7. Restart the backend

### 3. Add Icons

Place PNG icons in `extension/assets/`:
- `icon16.png` (16×16)
- `icon48.png` (48×48)
- `icon128.png` (128×128)

Use any icon generator or placeholder images.

---

## Usage

1. Click the **FormFill AI** extension icon
2. **Register** or **Sign In**
3. Click **✎ Edit Profile Data** and fill in your details (name, email, phone, address, etc.)
4. Navigate to any page with a form
5. Click **✦ Autofill This Page**
6. Sarvam AI maps your profile to the form fields and fills them automatically ✓

---

## API Reference

### Auth

```
POST /api/auth/register
Body: { name, email, password }
Response: { token, user }

POST /api/auth/login
Body: { email, password }
Response: { token, user }

GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { user }
```

### Profile

```
GET /api/profile
Headers: Authorization: Bearer <token>
Response: { profile }

PUT /api/profile
Headers: Authorization: Bearer <token>
Body: { name, email, phone, dob, gender, address, city, state,
        pincode, country, linkedin, github, occupation, company, pan, aadhaar }
Response: { profile, message }
```

### Autofill

```
POST /api/autofill/analyze
Headers: Authorization: Bearer <token>
Body: {
  pageUrl: "https://...",
  pageTitle: "...",
  forms: [ { formIndex: 0, fields: [ { selector, fieldType, labelText, ... } ] } ]
}
Response: {
  fillMap: { "#first_name": "Ashirwad", "input[name=email]": "..." },
  fieldsCount: 5,
  message: "Sarvam AI mapped 5 fields."
}
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Extension | Chrome MV3, Vanilla JS |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| AI | Sarvam AI (`sarvam-m`) |
| Auth | JWT + bcrypt |
| Security | Helmet, CORS, Rate limiting |

---

## Security Notes

- Passwords are bcrypt-hashed (cost 12)
- JWT tokens expire in 7 days
- Rate limiting: 100 req/15 min globally, 20 req/15 min on auth routes
- PAN/Aadhaar stored as plain text — consider field-level encryption for production
- CORS restricted to your extension origin in production
