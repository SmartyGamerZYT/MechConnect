const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'mechconnect.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for high performance and durability
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL, -- 'company', 'mechanic', 'admin'
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS company_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  industry_type TEXT,
  address TEXT,
  city TEXT,
  lat REAL,
  lng REAL,
  machines_operated TEXT, -- JSON array
  gst_number TEXT,
  verified INTEGER DEFAULT 1,
  contact_person TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mechanic_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  headline TEXT,
  bio TEXT,
  city TEXT,
  lat REAL,
  lng REAL,
  service_radius_km INTEGER DEFAULT 35,
  years_experience INTEGER DEFAULT 5,
  skills TEXT, -- JSON array of strings
  certifications TEXT, -- JSON array of { title, issuer, year, doc_url }
  portfolio TEXT, -- JSON array of { id, title, machine_type, description, image_url, date }
  availability_status TEXT DEFAULT 'AVAILABLE_NOW', -- 'AVAILABLE_NOW', 'AVAILABLE_SOON', 'NOT_AVAILABLE'
  availability_note TEXT,
  hourly_rate REAL DEFAULT 650,
  rating REAL DEFAULT 4.8,
  reviews_count INTEGER DEFAULT 0,
  total_jobs_completed INTEGER DEFAULT 0,
  total_earnings REAL DEFAULT 0,
  verification_tier TEXT DEFAULT 'TIER_3_CERTIFIED', -- 'TIER_1', 'TIER_2', 'TIER_3_CERTIFIED'
  is_team_lead INTEGER DEFAULT 0,
  team_name TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trusted_mechanics (
  id TEXT PRIMARY KEY,
  company_user_id TEXT NOT NULL,
  mechanic_user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mechanic_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(company_user_id, mechanic_user_id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  company_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  machine_category TEXT NOT NULL,
  machine_brand TEXT,
  machine_model TEXT,
  serial_number TEXT,
  asset_tag TEXT,
  year_of_manufacture TEXT,
  operating_hours TEXT,
  production_impact TEXT DEFAULT 'TOTAL_STOPPAGE', -- 'TOTAL_STOPPAGE', 'PARTIAL_HALT', 'QUALITY_DEFECT'
  error_code TEXT,
  hiring_mode TEXT DEFAULT 'BIDDING', -- 'BIDDING' or 'DIRECT'
  direct_assigned_mechanic_id TEXT,
  fault_description TEXT NOT NULL,
  urgency TEXT NOT NULL, -- 'EMERGENCY', 'SAME_DAY', 'SCHEDULED'
  status TEXT DEFAULT 'OPEN', -- 'OPEN', 'MATCHED', 'ASSIGNED', 'ON_THE_WAY', 'WORKING', 'COMPLETED', 'CANCELLED'
  lat REAL,
  lng REAL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  budget_min REAL,
  budget_max REAL,
  is_budget_open INTEGER DEFAULT 0,
  images TEXT, -- JSON array of image URLs
  assigned_mechanic_user_id TEXT,
  agreed_price REAL,
  scheduled_date TEXT,
  parts_used TEXT,
  work_summary TEXT,
  time_taken_hours REAL,
  invoice_pdf_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (company_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_mechanic_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  mechanic_user_id TEXT NOT NULL,
  proposed_price REAL NOT NULL,
  estimated_arrival TEXT,
  message TEXT,
  status TEXT DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'COUNTERED', 'DECLINED'
  counter_price REAL,
  counter_by TEXT, -- 'company' or 'mechanic'
  counter_round INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (mechanic_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quote_cards (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  proposal_id TEXT,
  company_user_id TEXT NOT NULL,
  mechanic_user_id TEXT NOT NULL,
  agreed_price REAL NOT NULL,
  scope_summary TEXT,
  agreed_start_time TEXT,
  company_confirmed_at TEXT,
  mechanic_confirmed_at TEXT,
  is_locked INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (company_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mechanic_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_history (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  updated_by_user_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  sender_user_id TEXT NOT NULL,
  sender_role TEXT NOT NULL, -- 'company', 'mechanic', 'admin', 'system'
  message_text TEXT NOT NULL,
  attachment_url TEXT,
  attachment_type TEXT,
  is_quote_card INTEGER DEFAULT 0,
  quote_card_id TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  company_user_id TEXT NOT NULL,
  mechanic_user_id TEXT NOT NULL,
  rating REAL NOT NULL,
  punctuality_rating REAL,
  quality_rating REAL,
  communication_rating REAL,
  review_text TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (company_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mechanic_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS media_uploads (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  mime_type TEXT,
  file_size INTEGER,
  uploaded_by_user_id TEXT,
  entity_type TEXT, -- 'job', 'chat', 'portfolio', 'cert', 'avatar'
  entity_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  raised_by_user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'OPEN', -- 'OPEN', 'IN_REVIEW', 'RESOLVED'
  resolution_notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wallets (
  user_id TEXT PRIMARY KEY,
  balance REAL DEFAULT 0.0,
  escrow_locked REAL DEFAULT 0.0,
  total_withdrawn REAL DEFAULT 0.0,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL, -- 'CREDIT', 'DEBIT', 'ESCROW_LOCK', 'ESCROW_RELEASE', 'PAYOUT', 'WITHDRAWAL'
  description TEXT,
  reference_job_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  company_user_id TEXT NOT NULL,
  mechanic_user_id TEXT NOT NULL,
  receipt_number TEXT UNIQUE NOT NULL,
  base_price REAL NOT NULL,
  parts_cost REAL DEFAULT 0.0,
  service_fee REAL DEFAULT 0.0,
  total_amount REAL NOT NULL,
  payment_method TEXT DEFAULT 'ESCROW_RELEASE',
  issued_at TEXT DEFAULT (datetime('now')),
  notes TEXT,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);
`);

// Safe migrations for jobs table
const jobColumnsToAdd = [
  "ALTER TABLE jobs ADD COLUMN hiring_mode TEXT DEFAULT 'BIDDING'",
  "ALTER TABLE jobs ADD COLUMN serial_number TEXT",
  "ALTER TABLE jobs ADD COLUMN asset_tag TEXT",
  "ALTER TABLE jobs ADD COLUMN year_of_manufacture TEXT",
  "ALTER TABLE jobs ADD COLUMN operating_hours TEXT",
  "ALTER TABLE jobs ADD COLUMN production_impact TEXT DEFAULT 'TOTAL_STOPPAGE'",
  "ALTER TABLE jobs ADD COLUMN error_code TEXT",
  "ALTER TABLE jobs ADD COLUMN direct_assigned_mechanic_id TEXT"
];

for (const alterSql of jobColumnsToAdd) {
  try {
    db.exec(alterSql);
  } catch (err) {
    // Column already exists, safe to ignore
  }
}

// Migration for mechanic_profiles: is_verified
try {
  db.exec("ALTER TABLE mechanic_profiles ADD COLUMN is_verified INTEGER DEFAULT 0");
  // Seed established mechanics as verified
  db.exec("UPDATE mechanic_profiles SET is_verified = 1 WHERE user_id IN ('usr_mech_rajesh', 'usr_mech_vikram', 'usr_team_precision')");
} catch (e) {
  // Already exists
}

// Migration for is_banned
try {
  db.exec("ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0");
} catch (e) {}
try {
  db.exec("ALTER TABLE mechanic_profiles ADD COLUMN is_banned INTEGER DEFAULT 0");
} catch (e) {}

// Ensure all users have a wallet
try {
  const allUsers = db.prepare('SELECT id, role FROM users').all();
  for (const u of allUsers) {
    const existing = db.prepare('SELECT user_id FROM wallets WHERE user_id = ?').get(u.id);
    if (!existing) {
      const initialBalance = u.role === 'company' ? 75000.0 : u.role === 'mechanic' ? 24500.0 : 0.0;
      db.prepare(`
        INSERT INTO wallets (user_id, balance, escrow_locked, total_withdrawn)
        VALUES (?, ?, 0, 0)
      `).run(u.id, initialBalance);

      db.prepare(`
        INSERT INTO wallet_transactions (id, user_id, amount, type, description)
        VALUES (?, ?, ?, 'CREDIT', 'Opening industrial account balance')
      `).run('tx_' + Math.random().toString(36).substring(2, 9), u.id, initialBalance);
    }
  }
} catch (e) {
  console.error('Wallet init error:', e);
}

// Seed function to populate rich demo dataset if empty
function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return;

  console.log('[Database] Seeding initial industrial dataset for MechConnect...');

  // Users
  const users = [
    {
      id: 'usr_comp_apex',
      role: 'company',
      email: 'operations@apexmfg.com',
      name: 'Jayant Patel (Apex Heavy Machining)',
      phone: '+91 98230 44551',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_comp_vanguard',
      role: 'company',
      email: 'plant@vanguardlogistics.in',
      name: 'Priya Rao (Vanguard Logistics Hub)',
      phone: '+91 98190 22334',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_mech_rajesh',
      role: 'mechanic',
      email: 'rajesh.cnc@mechconnect.pro',
      name: 'Rajesh Sharma',
      phone: '+91 98200 11223',
      avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_mech_vikram',
      role: 'mechanic',
      email: 'vikram.plc@mechconnect.pro',
      name: 'Vikramaditya Solanki',
      phone: '+91 98450 77889',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_mech_anil',
      role: 'mechanic',
      email: 'anil.hydraulics@mechconnect.pro',
      name: 'Anil Deshmukh',
      phone: '+91 97654 33221',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_team_precision',
      role: 'mechanic',
      email: 'sunil@precisionrepairs.com',
      name: 'Sunil Verma (Precision Tech Squad)',
      phone: '+91 98901 99887',
      avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_admin_ops',
      role: 'admin',
      email: 'admin@mechconnect.io',
      name: 'MechConnect Operations Controller',
      phone: '+91 80000 12345',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    }
  ];

  const insertUser = db.prepare('INSERT INTO users (id, role, email, name, phone, avatar_url) VALUES (?, ?, ?, ?, ?, ?)');
  for (const u of users) {
    insertUser.run(u.id, u.role, u.email, u.name, u.phone, u.avatar_url);
  }

  // Company Profiles
  const insertCompany = db.prepare(`
    INSERT INTO company_profiles (id, user_id, company_name, industry_type, address, city, lat, lng, machines_operated, gst_number, verified, contact_person)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCompany.run(
    'cp_apex',
    'usr_comp_apex',
    'Apex Heavy Machining & Fabrication Ltd.',
    'Heavy Engineering & Automotive Parts',
    'Plot 42, Bhosari MIDC Industrial Zone',
    'Pune',
    18.6276,
    73.8447,
    JSON.stringify(['CNC 5-Axis Milling', 'CNC Lathe VTL-600', 'Hydraulic 400T Press', 'Atlas Copco GA-75 Compressor']),
    '27AABCA1234D1ZP',
    1,
    'Jayant Patel (Operations VP)'
  );

  insertCompany.run(
    'cp_vanguard',
    'usr_comp_vanguard',
    'Vanguard Logistics & Automated Sorting Hub',
    'Supply Chain & Warehousing',
    'Sector 8, Logistics Park, Bhiwandi',
    'Mumbai',
    19.2967,
    73.0631,
    JSON.stringify(['Conveyor Sortation Belts', 'Hydraulic Scissor Docks', 'Ingersoll Rand Compressors', 'Diesel Genset 500kVA']),
    '27XYZP9876E1Z2',
    1,
    'Priya Rao (Facility Manager)'
  );

  // Mechanic Profiles
  const insertMechanic = db.prepare(`
    INSERT INTO mechanic_profiles (
      id, user_id, full_name, headline, bio, city, lat, lng, service_radius_km, years_experience,
      skills, certifications, portfolio, availability_status, availability_note, hourly_rate,
      rating, reviews_count, total_jobs_completed, total_earnings, verification_tier, is_team_lead, team_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMechanic.run(
    'mp_rajesh',
    'usr_mech_rajesh',
    'Rajesh Sharma',
    'Master CNC & Precision Machinery Specialist',
    'Over 14 years resolving acute spindle breakdowns, servo axis drifts, hydraulic tool clamp failures, and Fanuc/Siemens controller errors across Western India factories.',
    'Pune',
    18.6186,
    73.8320,
    45,
    14,
    JSON.stringify(['CNC Machines', 'Hydraulic Systems', 'Spindle Alignment', 'Siemens Sinumerik', 'Fanuc Robodrill', 'Haas VF-3']),
    JSON.stringify([
      { title: 'National Trade Certificate (NTC) Machinist & CNC Specialist', issuer: 'Govt ITI Aundh', year: '2010', doc_url: '/docs/iti_cert.pdf' },
      { title: 'Advanced High-Precision Spindle Balancing & Reconditioning', issuer: 'DMG Mori Academy', year: '2018', doc_url: '/docs/dmg_cert.pdf' }
    ]),
    JSON.stringify([
      { id: 'p1', title: '5-Axis DMG Mori Spindle Re-bearing & Runout Calibration', machine_type: 'CNC Machines', description: 'Emergency spindle seizure restored on factory floor within 4.5 hours with < 2 micron runout.', image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80', date: '2026-09-12' },
      { id: 'p2', title: 'Hydraulic Tool Clamping Pressure Booster Overhaul', machine_type: 'Hydraulic Systems', description: 'Replaced ruptured diaphragm, tuned relief valve to 140 bar, eliminating false tool ejects.', image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80', date: '2026-10-04' }
    ]),
    'AVAILABLE_NOW',
    'Tool van equipped with dial gauges, vibration analyzer & metric pullers. Ready for emergency dispatch.',
    850,
    4.94,
    142,
    142,
    348500,
    'TIER_3_CERTIFIED',
    0,
    null
  );

  insertMechanic.run(
    'mp_vikram',
    'usr_mech_vikram',
    'Vikramaditya Solanki',
    'Industrial Automation, PLC & Electrical Drives Expert',
    'Specialist in PLC troubleshooting (Siemens S7-1500, Allen-Bradley GuardLogix, Delta), servo drive synchronization, electrical panels, and emergency line halts.',
    'Pune',
    18.6410,
    73.8190,
    40,
    9,
    JSON.stringify(['Electrical Panels & PLCs', 'Servo Drives', 'Siemens TIA Portal', 'Allen-Bradley', 'VFD Inverters', 'Industrial Sensors']),
    JSON.stringify([
      { title: 'Certified Industrial Automation Engineer', issuer: 'Siemens SITRAIN Center', year: '2017', doc_url: '/docs/siemens_cert.pdf' }
    ]),
    JSON.stringify([
      { id: 'pv1', title: 'Bottle Packaging Line PLC Communication Hang Fix', machine_type: 'Electrical Panels & PLCs', description: 'Diagnosed Profinet packet collisions causing line safety trip; restored production within 45 mins.', image_url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&auto=format&fit=crop&q=80', date: '2026-10-18' }
    ]),
    'AVAILABLE_NOW',
    'Available for immediate on-site diagnostic & panel troubleshooting.',
    750,
    4.88,
    98,
    98,
    215000,
    'TIER_3_CERTIFIED',
    0,
    null
  );

  insertMechanic.run(
    'mp_anil',
    'usr_mech_anil',
    'Anil Deshmukh',
    'Heavy Hydraulics & Screw Compressor Specialist',
    'Over 7 years maintaining 100T-1000T hydraulic presses, oil coolers, vane pumps, and high-flow rotary screw compressors.',
    'Mumbai',
    19.2810,
    73.0480,
    30,
    7,
    JSON.stringify(['Hydraulic Systems', 'Compressors', 'Proportional Valves', 'Atlas Copco', 'Pneumatics']),
    JSON.stringify([
      { title: 'Diploma in Mechanical Engineering', issuer: 'Maharashtra State Board of Technical Education', year: '2019', doc_url: '/docs/msbte.pdf' }
    ]),
    JSON.stringify([
      { id: 'pa1', title: 'Rebuilt 250T Press Hydraulic Manifold Block', machine_type: 'Hydraulic Systems', description: 'Re-seated pilot poppets and flushed contaminated ISO VG 68 oil under pressure.', image_url: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=600&auto=format&fit=crop&q=80', date: '2026-08-22' }
    ]),
    'AVAILABLE_SOON',
    'Completing a scheduled compressor tune-up in Dombivli, free after 4:00 PM.',
    650,
    4.72,
    64,
    64,
    145000,
    'TIER_2',
    0,
    null
  );

  insertMechanic.run(
    'mp_precision',
    'usr_team_precision',
    'Sunil Verma (Precision Tech Squad)',
    'Full-Service Industrial Emergency Repair & Overhaul Team',
    '6-technician certified squad with heavy hydraulic jacks, mobile argon welding, laser alignment, and PLC programmers. We handle plant-level critical breakdowns and multi-day shutdowns.',
    'Pune',
    18.5900,
    73.7900,
    60,
    16,
    JSON.stringify(['CNC Machines', 'Hydraulic Systems', 'Conveyor & Material Handling', 'Industrial Generators', 'Boilers & Heat Exchangers']),
    JSON.stringify([
      { title: 'Authorized Industrial Plant Maintenance Contractor', issuer: 'MIDC Engineering Guild', year: '2015', doc_url: '/docs/midc_guild.pdf' }
    ]),
    JSON.stringify([
      { id: 'pp1', title: 'Overnight Conveyor Gearbox Breakdown Replacement', machine_type: 'Conveyor & Material Handling', description: 'Removed 1.2-ton broken helical gearbox and aligned new motor shaft before morning shift.', image_url: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=600&auto=format&fit=crop&q=80', date: '2026-09-30' }
    ]),
    'AVAILABLE_NOW',
    'Emergency squad truck on standby with generator & rigging gear.',
    1200,
    4.96,
    230,
    230,
    780000,
    'TIER_3_CERTIFIED',
    1,
    'Precision Industrial Field Response Squad'
  );

  // Trusted mechanic link
  db.prepare('INSERT INTO trusted_mechanics (id, company_user_id, mechanic_user_id) VALUES (?, ?, ?)')
    .run('tm_1', 'usr_comp_apex', 'usr_mech_rajesh');

  // Open & Active Jobs
  const insertJob = db.prepare(`
    INSERT INTO jobs (
      id, company_user_id, title, machine_category, machine_brand, machine_model, fault_description,
      urgency, status, lat, lng, address, city, budget_min, budget_max, is_budget_open,
      images, assigned_mechanic_user_id, agreed_price, scheduled_date, parts_used, work_summary, time_taken_hours, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Job 1: EMERGENCY OPEN BREAKDOWN
  insertJob.run(
    'MC-2026-0101',
    'usr_comp_apex',
    'CNC 5-Axis Milling Spindle Seizure & Error E-402',
    'CNC Machines',
    'Haas Automation',
    'VF-4SS Super Speed',
    'Main spindle stalled during roughing cycle with metallic grinding noise. Controller locked on E-402 (Inverter Overcurrent / Spindle Jam). Production of critical turbocharger housings completely halted. Need certified technician with spindle puller on site immediately.',
    'EMERGENCY',
    'OPEN',
    18.6276,
    73.8447,
    'Plot 42, Sector 10, Bhosari MIDC Industrial Area',
    'Pune',
    8000,
    15000,
    0,
    JSON.stringify([
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80'
    ]),
    null,
    null,
    null,
    null,
    null,
    null,
    new Date(Date.now() - 25 * 60 * 1000).toISOString() // 25 mins ago
  );

  // Job 2: SAME DAY - ASSIGNED & ON THE WAY
  insertJob.run(
    'MC-2026-0098',
    'usr_comp_apex',
    '400-Ton Hydraulic Stamping Press Cylinder Leak & Pressure Drop',
    'Hydraulic Systems',
    'Schuler / Rexroth',
    'HYS-400T',
    'Main ram cylinder leaking hydraulic fluid (ISO 46) at upper gland seal. Ram drifting downward during holding cycle. Pressure cannot exceed 110 bar instead of rated 280 bar.',
    'SAME_DAY',
    'ON_THE_WAY',
    18.6280,
    73.8450,
    'Bay 3, Fabrication Shop, Bhosari MIDC',
    'Pune',
    7500,
    12000,
    0,
    JSON.stringify([
      'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=800&auto=format&fit=crop&q=80'
    ]),
    'usr_mech_rajesh',
    9500,
    '2026-10-28',
    null,
    null,
    null,
    new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  );

  // Job 3: SAME DAY - OPEN in Mumbai
  insertJob.run(
    'MC-2026-0099',
    'usr_comp_vanguard',
    'Rotary Screw Compressor High Discharge Temp & Trip',
    'Compressors',
    'Atlas Copco',
    'GA-55 VSD+',
    'Compressor trips on Error 201 (Discharge Temp > 115°C) within 8 minutes of loading. Oil filter differential indicator popped red. Pneumatic tools on sorting lines losing required 7 bar air pressure.',
    'SAME_DAY',
    'OPEN',
    19.2967,
    73.0631,
    'Warehouse Unit 4, Logistics Boulevard, Bhiwandi',
    'Mumbai',
    4000,
    8000,
    0,
    JSON.stringify([
      'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&auto=format&fit=crop&q=80'
    ]),
    null,
    null,
    null,
    null,
    null,
    null,
    new Date(Date.now() - 75 * 60 * 1000).toISOString()
  );

  // Job 4: COMPLETED with Digital Job Card & Review
  insertJob.run(
    'MC-2026-0082',
    'usr_comp_apex',
    'Emergency PLC Bus Failure on Robotic Welding Cell',
    'Electrical Panels & PLCs',
    'Siemens',
    'S7-1500 + KUKA KRC4 Interface',
    'Profinet communication loop dropping intermittently causing safety curtain latching. Robotic cell down.',
    'EMERGENCY',
    'COMPLETED',
    18.6276,
    73.8447,
    'Plot 42, Bhosari MIDC Industrial Zone',
    'Pune',
    10000,
    16000,
    0,
    JSON.stringify([
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'
    ]),
    'usr_mech_vikram',
    12500,
    '2026-10-24',
    '1x Scalance Industrial Ethernet Switch, 2x M12 Shielded Patch Cables',
    'Traced packet loss to pinched Profinet cable on Axis 3 energy chain. Routed new high-flex shielded cable, updated switch firmware, verified 0 cyclic jitter.',
    2.8,
    new Date(Date.now() - 4 * 86400 * 1000).toISOString()
  );

  // Job History entries
  const insertHistory = db.prepare('INSERT INTO job_history (id, job_id, status, note, updated_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  insertHistory.run('jh_1', 'MC-2026-0101', 'OPEN', 'Emergency breakdown posted by Operations VP Jayant Patel', 'usr_comp_apex', new Date(Date.now() - 25 * 60 * 1000).toISOString());
  insertHistory.run('jh_2', 'MC-2026-0101', 'MATCHED', 'Auto-matched 3 certified CNC specialists within 15 km', 'usr_admin_ops', new Date(Date.now() - 24 * 60 * 1000).toISOString());

  insertHistory.run('jh_3', 'MC-2026-0098', 'OPEN', 'Breakdown posted with hydraulic cylinder photo', 'usr_comp_apex', new Date(Date.now() - 3 * 3600 * 1000).toISOString());
  insertHistory.run('jh_4', 'MC-2026-0098', 'ASSIGNED', 'Assigned to Rajesh Sharma after quote acceptance (₹9,500)', 'usr_comp_apex', new Date(Date.now() - 2 * 3600 * 1000).toISOString());
  insertHistory.run('jh_5', 'MC-2026-0098', 'ON_THE_WAY', 'Rajesh Sharma started trip with mobile hydraulic repair rig', 'usr_mech_rajesh', new Date(Date.now() - 40 * 60 * 1000).toISOString());

  insertHistory.run('jh_6', 'MC-2026-0082', 'OPEN', 'Job posted under Emergency SLA', 'usr_comp_apex', new Date(Date.now() - 4 * 86400 * 1000).toISOString());
  insertHistory.run('jh_7', 'MC-2026-0082', 'COMPLETED', 'Robotic cell successfully recommissioned. Tested for 30 cycles without error.', 'usr_mech_vikram', new Date(Date.now() - 4 * 86400 * 1000 + 3 * 3600 * 1000).toISOString());

  // Proposals on Job 1 (Emergency Spindle Jam)
  const insertProposal = db.prepare(`
    INSERT INTO proposals (id, job_id, mechanic_user_id, proposed_price, estimated_arrival, message, status, counter_price, counter_by, counter_round)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertProposal.run(
    'prop_101_rajesh',
    'MC-2026-0101',
    'usr_mech_rajesh',
    11500,
    '25 mins',
    'I have my van 4 km away at Bhosari Sector 7 with Haas spindle extractor & hydraulic bearing kit. Can arrive in 25 mins and begin disassembly.',
    'COUNTERED',
    10000,
    'company',
    1
  );

  insertProposal.run(
    'prop_101_precision',
    'MC-2026-0101',
    'usr_team_precision',
    14000,
    '30 mins',
    'Squad unit available with 2 senior CNC technicians. Includes complete dynamic runout test report and 30-day warranty.',
    'PENDING',
    null,
    null,
    0
  );

  // Quote card on Job 2
  const insertQuote = db.prepare(`
    INSERT INTO quote_cards (id, job_id, proposal_id, company_user_id, mechanic_user_id, agreed_price, scope_summary, agreed_start_time, company_confirmed_at, mechanic_confirmed_at, is_locked)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertQuote.run(
    'qc_0098',
    'MC-2026-0098',
    'prop_0098_rajesh',
    'usr_comp_apex',
    'usr_mech_rajesh',
    9500,
    'Disassemble cylinder gland, replace damaged polyurethane chevron seals, inspect chrome rod for scoring, re-pressurize to 280 bar proof test.',
    '2026-10-28 14:00',
    new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    1
  );

  // Messages in Chat for Job 1
  const insertMessage = db.prepare(`
    INSERT INTO messages (id, job_id, sender_user_id, sender_role, message_text, attachment_url, is_quote_card, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMessage.run(
    'msg_1',
    'MC-2026-0101',
    'usr_mech_rajesh',
    'mechanic',
    'Hello Jayant! I saw your Haas VF-4SS spindle error E-402 alert. Did you notice if the motor encoder is still responding, or is the spindle completely seized by hand?',
    null,
    0,
    1,
    new Date(Date.now() - 20 * 60 * 1000).toISOString()
  );

  insertMessage.run(
    'msg_2',
    'MC-2026-0101',
    'usr_comp_apex',
    'company',
    'Completely seized by hand Rajesh! We cannot rotate it even with a cheater bar. It jammed right as the 32mm endmill entered cast iron. Here is the control panel snapshot.',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    0,
    1,
    new Date(Date.now() - 17 * 60 * 1000).toISOString()
  );

  insertMessage.run(
    'msg_3',
    'MC-2026-0101',
    'usr_mech_rajesh',
    'mechanic',
    'Understood, the lower angular contact bearings have seized into the cartridge. I submitted an initial quote of ₹11,500. I can be there in 25 minutes with bearing pullers and replacement ceramic hybrid set.',
    null,
    0,
    1,
    new Date(Date.now() - 14 * 60 * 1000).toISOString()
  );

  insertMessage.run(
    'msg_4',
    'MC-2026-0101',
    'usr_comp_apex',
    'company',
    'Can we settle on ₹10,000 all inclusive of inspection and disassembly? We have replacement bearings in our tool crib.',
    null,
    0,
    0,
    new Date(Date.now() - 10 * 60 * 1000).toISOString()
  );

  // Review on Job 4
  const insertReview = db.prepare(`
    INSERT INTO reviews (id, job_id, company_user_id, mechanic_user_id, rating, punctuality_rating, quality_rating, communication_rating, review_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertReview.run(
    'rev_0082',
    'MC-2026-0082',
    'usr_comp_apex',
    'usr_mech_vikram',
    5.0,
    5.0,
    5.0,
    5.0,
    'Outstanding diagnostic work! Vikram identified the pinched Profinet cable that two previous technicians missed. He rewires cleanly and checked bus jitter on oscilloscope. Production running smooth.'
  );

  console.log('[Database] Seeded successfully!');
}

seedDatabase();

module.exports = { db };

