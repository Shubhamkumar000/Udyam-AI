-- PostgreSQL Database Schema for Udyan AI
-- Run this to configure target tables in your cloud or local instance

CREATE DATABASE udyan_db;
\c udyan_db;

-- 1. Users Table (Integration with Supabase Auth or custom JWT)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Business Profiles Table
CREATE TABLE business_profiles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    gstin VARCHAR(15),
    fssai_number VARCHAR(14),
    trade_license_number VARCHAR(50),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    pan VARCHAR(10),
    aadhaar VARCHAR(14),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Licenses Table
CREATE TABLE licenses (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'GST', 'FSSAI', 'Trade License', etc.
    license_number VARCHAR(100) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    authority VARCHAR(255) NOT NULL,
    confidence_score NUMERIC(3,2) DEFAULT 0.00,
    portal_url TEXT,
    status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Expiring Soon', 'Expired'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. License Documents Table (For OCR inputs & file storage links)
CREATE TABLE license_documents (
    id SERIAL PRIMARY KEY,
    license_id INTEGER REFERENCES licenses(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    raw_ocr_text TEXT,
    confidence NUMERIC(3,2)
);

-- 5. Renewal Checklists Table (For generating step checklists)
CREATE TABLE renewal_checklists (
    id SERIAL PRIMARY KEY,
    license_type VARCHAR(50) UNIQUE NOT NULL,
    checklist_steps TEXT[] NOT NULL,
    required_documents TEXT[] NOT NULL,
    risks TEXT NOT NULL
);

-- 6. Notifications Log Table (Resend smart alerts log)
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    license_id INTEGER REFERENCES licenses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'email',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Sent' -- 'Sent', 'Failed', 'Pending'
);

-- 7. Government Portal Links Database Table
CREATE TABLE portal_links (
    id SERIAL PRIMARY KEY,
    license_type VARCHAR(50) UNIQUE NOT NULL,
    portal_name VARCHAR(100) NOT NULL,
    official_url TEXT NOT NULL,
    notes TEXT
);

-- 8. AI Chat History Table
CREATE TABLE chat_history (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    language VARCHAR(5) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Compliance Scores Table (Historical log of business standing)
CREATE TABLE compliance_scores (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    recorded_at DATE DEFAULT CURRENT_DATE
);

-- Insert Default Portal Metadata
INSERT INTO portal_links (license_type, portal_name, official_url, notes) VALUES
('GST', 'GST Portal', 'https://services.gst.gov.in/services/login', 'Filing of GSTR-1, GSTR-3B and revocations'),
('FSSAI', 'Food License Portal', 'https://foodlicenseportal.org/Home/renew?gad_source=1&gad_campaignid=23038392925&gbraid=0AAAAACzocouD9ojWtNfBiCtpWM2iev4Kp&gclid=Cj0KCQjw_7PRBhDcARIsAMjV7jnDkAkl_H_guWUD_Spud_xBdQ1LIoXh2ZWCh0R9HprCRjXePuHlHIcaAj4YEALw_wcB', 'FSSAI registrations and renewals portal'),
('Trade License', 'Karnataka Municipal Portal', 'https://bbmp.gov.in', 'Bruhat Bengaluru Mahanagara Palike trade license renewals'),
('Shop & Establishment', 'e-Karmika Karnataka', 'https://ekarmika.karnataka.gov.in/', 'Shop & establishment renewal registrations'),
('Fire NOC', 'Karnataka Fire & Emergency Services', 'https://kfireservices.gov.in/', 'No Objection Certificate approvals and safety audits');
