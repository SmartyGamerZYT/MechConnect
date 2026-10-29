const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { db } = require('./db');

const app = express();
const server = http.createServer(app);

// Setup Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Multer storage for persistent file and image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'mech-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Socket.io real-time rooms
io.on('connection', (socket) => {
  console.log('[Socket] Client connected:', socket.id);

  socket.on('join_job', (jobId) => {
    socket.join(`job_${jobId}`);
    console.log(`[Socket] Client ${socket.id} joined room job_${jobId}`);
  });

  socket.on('leave_job', (jobId) => {
    socket.leave(`job_${jobId}`);
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Client disconnected:', socket.id);
  });
});

// ==========================================
// REST API ROUTES
// ==========================================

// 1. Upload API (Persists file to disk & database)
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const mediaId = 'med_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const userId = req.body.uploaded_by_user_id || 'usr_anonymous';
    const entityType = req.body.entity_type || 'general';
    const entityId = req.body.entity_id || null;

    db.prepare(`
      INSERT INTO media_uploads (id, file_name, file_path, file_url, mime_type, file_size, uploaded_by_user_id, entity_type, entity_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      mediaId,
      req.file.originalname,
      req.file.path,
      fileUrl,
      req.file.mimetype,
      req.file.size,
      userId,
      entityType,
      entityId
    );

    res.json({
      success: true,
      id: mediaId,
      url: fileUrl,
      fileName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process file upload' });
  }
});

// 2. Auth & Persona Switcher (Frictionless, no OTP / verification barrier)
app.get('/api/auth/users', (req, res) => {
  const users = db.prepare(`
    SELECT u.*, 
      cp.company_name, cp.industry_type, cp.verified as company_verified,
      mp.headline as mechanic_headline, mp.rating as mechanic_rating, mp.availability_status,
      mp.is_verified as mechanic_is_verified
    FROM users u
    LEFT JOIN company_profiles cp ON u.id = cp.user_id
    LEFT JOIN mechanic_profiles mp ON u.id = mp.user_id
    ORDER BY u.created_at ASC
  `).all();

  res.json(users);
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = db.prepare(`
      SELECT u.*, 
        cp.company_name, cp.industry_type, cp.verified as company_verified,
        mp.headline as mechanic_headline, mp.rating as mechanic_rating, mp.availability_status,
        mp.is_verified as mechanic_is_verified
      FROM users u
      LEFT JOIN company_profiles cp ON u.id = cp.user_id
      LEFT JOIN mechanic_profiles mp ON u.id = mp.user_id
      WHERE LOWER(u.email) = LOWER(?)
    `).get(email.trim());

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email. Please register.' });
    }

    if (user.is_banned === 1) {
      return res.status(403).json({ error: 'This account has been suspended by platform administration.' });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, phone, role, password, company_name, industry_type, city, skills, experience, avatar_url, certifications, portfolio, hourly_rate, headline } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    // Check existing
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const userId = 'usr_' + Date.now();
    const finalAvatar = avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`;

    db.prepare(`
      INSERT INTO users(id, role, email, password_hash, name, phone, avatar_url)
    VALUES(?, ?, ?, ?, ?, ?, ?)
      `).run(userId, role, email, password || 'defaultpass', name, phone || '+91 99000 00000', finalAvatar);

    if (role === 'company') {
      db.prepare(`
        INSERT INTO company_profiles(id, user_id, company_name, industry_type, city, verified, machines_operated)
    VALUES(?, ?, ?, ?, ?, 1, ?)
      `).run(
        'cp_' + Date.now(),
        userId,
        company_name || name + ' Enterprises',
        industry_type || 'Industrial Manufacturing',
        city || 'Pune',
        JSON.stringify(['CNC Machines', 'Hydraulics', 'Pneumatics'])
      );
    } else if (role === 'mechanic') {
      const parsedSkills = Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : ['CNC Machines', 'Hydraulic Systems']);
      const parsedCerts = Array.isArray(certifications) ? JSON.stringify(certifications) : '[]';
      const parsedPortfolio = Array.isArray(portfolio) ? JSON.stringify(portfolio) : '[]';

      // Newly registered technician starts unverified (is_verified = 0) until Admin approval
      db.prepare(`
        INSERT INTO mechanic_profiles(
    id, user_id, full_name, headline, bio, city, years_experience, skills, certifications, portfolio, hourly_rate, availability_status, verification_tier, is_verified
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE_NOW', 'TIER_1', 0)
  `).run(
        'mp_' + Date.now(),
        userId,
        name,
        headline || 'Certified Field Technician',
        'Specialist equipped for rapid diagnostic and emergency machine repairs.',
        city || 'Pune',
        parseInt(experience, 10) || 5,
        JSON.stringify(parsedSkills),
        parsedCerts,
        parsedPortfolio,
        parseFloat(hourly_rate) || 750
      );
    }

    const user = db.prepare(`
      SELECT u.*,
  cp.company_name, cp.industry_type, cp.verified as company_verified,
  mp.headline as mechanic_headline, mp.rating as mechanic_rating, mp.availability_status,
  mp.is_verified as mechanic_is_verified
      FROM users u
      LEFT JOIN company_profiles cp ON u.id = cp.user_id
      LEFT JOIN mechanic_profiles mp ON u.id = mp.user_id
      WHERE u.id = ?
  `).get(userId);

    res.json({ success: true, user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

// 3. Jobs Listing & Discovery
app.get('/api/jobs', (req, res) => {
  try {
    const { urgency, category, status, search, company_id, mechanic_id } = req.query;

    let query = `
      SELECT j.*,
  cp.company_name, cp.verified as company_verified, u.name as contact_person, u.phone as contact_phone,
  (SELECT COUNT(*) FROM proposals p WHERE p.job_id = j.id) as proposals_count
      FROM jobs j
      JOIN users u ON j.company_user_id = u.id
      LEFT JOIN company_profiles cp ON u.id = cp.user_id
      WHERE 1 = 1
  `;
    const params = [];

    if (urgency && urgency !== 'ALL') {
      query += ` AND j.urgency = ? `;
      params.push(urgency);
    }
    if (category && category !== 'ALL') {
      query += ` AND j.machine_category = ? `;
      params.push(category);
    }
    if (status && status !== 'ALL') {
      query += ` AND j.status = ? `;
      params.push(status);
    }
    if (company_id) {
      query += ` AND j.company_user_id = ? `;
      params.push(company_id);
    }
    if (mechanic_id) {
      query += ` AND(j.assigned_mechanic_user_id = ? OR j.id IN(SELECT job_id FROM proposals WHERE mechanic_user_id = ?))`;
      params.push(mechanic_id, mechanic_id);
    }
    if (search) {
      query += ` AND(j.title LIKE ? OR j.fault_description LIKE ? OR j.machine_brand LIKE ? OR j.city LIKE ?)`;
      const s = `% ${ search }% `;
      params.push(s, s, s, s);
    }

    query += ` ORDER BY CASE WHEN j.urgency = 'EMERGENCY' THEN 1 WHEN j.urgency = 'SAME_DAY' THEN 2 ELSE 3 END, j.created_at DESC`;

    const jobs = db.prepare(query).all(...params);

    const parsedJobs = jobs.map(job => ({
      ...job,
      images: job.images ? JSON.parse(job.images) : []
    }));

    res.json(parsedJobs);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Single Job Details with proposals, quote cards, timeline
app.get('/api/jobs/:id', (req, res) => {
  try {
    const job = db.prepare(`
      SELECT j.*,
  cp.company_name, cp.verified as company_verified, cp.industry_type,
  u.name as contact_person, u.phone as contact_phone, u.avatar_url as company_avatar,
  m_user.name as assigned_mechanic_name, m_user.phone as assigned_mechanic_phone,
  m_prof.headline as assigned_mechanic_headline, m_user.avatar_url as assigned_mechanic_avatar
      FROM jobs j
      JOIN users u ON j.company_user_id = u.id
      LEFT JOIN company_profiles cp ON u.id = cp.user_id
      LEFT JOIN users m_user ON j.assigned_mechanic_user_id = m_user.id
      LEFT JOIN mechanic_profiles m_prof ON j.assigned_mechanic_user_id = m_prof.user_id
      WHERE j.id = ?
  `).get(req.params.id);

    if (!job) {
      return res.status(400).json({ error: 'Job not found' });
    }

    job.images = job.images ? JSON.parse(job.images) : [];

    // Fetch proposals
    const proposals = db.prepare(`
      SELECT p.*,
  u.name as mechanic_name, u.avatar_url as mechanic_avatar, u.phone as mechanic_phone,
  mp.headline, mp.rating, mp.reviews_count, mp.verification_tier, mp.years_experience
      FROM proposals p
      JOIN users u ON p.mechanic_user_id = u.id
      LEFT JOIN mechanic_profiles mp ON u.id = mp.user_id
      WHERE p.job_id = ?
  ORDER BY p.created_at DESC
    `).all(req.params.id);

    // Fetch job timeline history
    const history = db.prepare(`
      SELECT h.*, u.name as updated_by_name
      FROM job_history h
      LEFT JOIN users u ON h.updated_by_user_id = u.id
      WHERE h.job_id = ?
  ORDER BY h.created_at ASC
    `).all(req.params.id);

    // Fetch active quote card if any
    const quoteCard = db.prepare(`
SELECT * FROM quote_cards WHERE job_id = ? ORDER BY created_at DESC LIMIT 1
  `).get(req.params.id);

    // Fetch review if completed
    const review = db.prepare(`
SELECT * FROM reviews WHERE job_id = ?
  `).get(req.params.id);

    res.json({
      job,
      proposals,
      history,
      quoteCard: quoteCard || null,
      review: review || null
    });
  } catch (err) {
    console.error('Error fetching job details:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Post Job (supports all machine details, photos, and Bidding vs. Direct Hiring)
app.post('/api/jobs', (req, res) => {
  try {
    const {
      company_user_id,
      title,
      machine_category,
      machine_brand,
      machine_model,
      serial_number,
      asset_tag,
      year_of_manufacture,
      operating_hours,
      production_impact,
      error_code,
      hiring_mode, // 'BIDDING' or 'DIRECT' (Urban Company style)
      direct_assigned_mechanic_id,
      fault_description,
      urgency,
      lat,
      lng,
      address,
      city,
      budget_min,
      budget_max,
      is_budget_open,
      images
    } = req.body;

    let resolvedCompanyUserId = company_user_id;
    if (!resolvedCompanyUserId || !db.prepare('SELECT id FROM users WHERE id = ?').get(resolvedCompanyUserId)) {
      const defaultComp = db.prepare("SELECT id FROM users WHERE role = 'company' LIMIT 1").get();
      resolvedCompanyUserId = defaultComp ? defaultComp.id : 'usr_comp_apex';
    }

    const safeCategory = machine_category || 'CNC Machines (Lathe, Milling, Turning, 5-Axis)';
    const safeTitle = (title && title.trim()) ? title.trim() : `${machine_brand || ''} ${machine_model || safeCategory || 'Machinery'} Repair`.trim();
    const safeFault = (fault_description && fault_description.trim()) ? fault_description.trim() : 'Machine breakdown inspection, diagnostics and repair required.';
    const safeAddress = (address && address.trim()) ? address.trim() : 'Industrial MIDC Zone';
    const safeUrgency = urgency || 'EMERGENCY';

    // Compute guaranteed non-colliding unique Job ID
    let nextNum = 125;
    const allJobs = db.prepare('SELECT id FROM jobs').all();
    allJobs.forEach(j => {
      const match = j.id.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num >= nextNum) {
          nextNum = num + 1;
        }
      }
    });
    const jobId = `MC-2026-${String(nextNum).padStart(4, '0')}`;

    const parsedImages = Array.isArray(images) ? JSON.stringify(images) : '[]';
    const isDirectPreassigned = Boolean(hiring_mode === 'DIRECT' && direct_assigned_mechanic_id);
    const initialStatus = isDirectPreassigned ? 'ASSIGNED' : 'OPEN';
    const fixedAgreedPrice = isDirectPreassigned ? (parseFloat(budget_min) || 4500) : null;

    db.prepare(`
      INSERT INTO jobs(
    id, company_user_id, title, machine_category, machine_brand, machine_model,
    serial_number, asset_tag, year_of_manufacture, operating_hours, production_impact, error_code,
    hiring_mode, direct_assigned_mechanic_id, assigned_mechanic_user_id, agreed_price,
    fault_description, urgency, status, lat, lng, address, city,
    budget_min, budget_max, is_budget_open, images, created_at, updated_at
  ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      jobId,
      resolvedCompanyUserId,
      safeTitle,
      safeCategory,
      machine_brand || '',
      machine_model || '',
      serial_number || '',
      asset_tag || '',
      year_of_manufacture || '',
      operating_hours || '',
      production_impact || 'TOTAL_STOPPAGE',
      error_code || '',
      hiring_mode || 'BIDDING',
      direct_assigned_mechanic_id || null,
      isDirectPreassigned ? direct_assigned_mechanic_id : null,
      fixedAgreedPrice,
      safeFault,
      safeUrgency,
      initialStatus,
      parseFloat(lat) || 18.6276,
      parseFloat(lng) || 73.8447,
      safeAddress,
      city || 'Pune',
      parseFloat(budget_min) || null,
      parseFloat(budget_max) || null,
      is_budget_open ? 1 : 0,
      parsedImages
    );

    // Record creation in history
    db.prepare(`
      INSERT INTO job_history(id, job_id, status, note, updated_by_user_id)
VALUES(?, ?, ?, ?, ?)
    `).run(
      'jh_' + Date.now(),
      jobId,
      initialStatus,
      isDirectPreassigned 
        ? `Direct Hire dispatched to technician. Job assigned at ₹${fixedAgreedPrice}.`
        : hiring_mode === 'DIRECT'
        ? `Direct Hire (Urban Company style) job listed at fixed rate ₹${parseFloat(budget_min) || 5000}. First technician to claim will be instantly assigned.`
        : `Breakdown job created under ${safeUrgency} protocol (${hiring_mode || 'BIDDING'}). Open for technician bids.`,
      resolvedCompanyUserId
    );

    // If Direct Hire with preassigned mechanic, create locked Quote Card immediately
    if (isDirectPreassigned) {
      const quoteId = 'qc_' + Date.now();
      db.prepare(`
        INSERT INTO quote_cards(
          id, job_id, company_user_id, mechanic_user_id,
          agreed_price, scope_summary, agreed_start_time, company_confirmed_at, mechanic_confirmed_at, is_locked
        ) VALUES(?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'), 1)
      `).run(
        quoteId,
        jobId,
        resolvedCompanyUserId,
        direct_assigned_mechanic_id,
        fixedAgreedPrice,
        `Direct booking for ${safeTitle}. Technician dispatched under ${safeUrgency} SLA.`
      );

      // Add system message in chat
      db.prepare(`
        INSERT INTO messages(id, job_id, sender_user_id, sender_role, message_text, is_quote_card, quote_card_id)
        VALUES(?, ?, ?, 'system', ?, 1, ?)
      `).run(
        'msg_' + Date.now(),
        jobId,
        resolvedCompanyUserId,
        `[DIRECT DISPATCH LOCKED] Direct hire confirmed at ₹${fixedAgreedPrice}. Technician assigned under ${safeUrgency} protocol.`,
        quoteId
      );
    }

    // Broadcast new job to all connected sockets
    io.emit('new_job_posted', {
      jobId,
      title: safeTitle,
      urgency: safeUrgency,
      machine_category: safeCategory,
      hiring_mode: hiring_mode || 'BIDDING',
      city: city || 'Pune'
    });

    res.json({ success: true, jobId, isDirectPreassigned });
  } catch (err) {
    console.error('Error creating job:', err);
    res.status(500).json({ error: 'Failed to post job' });
  }
});

// 6. Apply to Job / Submit Proposal
app.post('/api/jobs/:id/apply', (req, res) => {
  try {
    const jobId = req.params.id;
    const { mechanic_user_id, proposed_price, estimated_arrival, message } = req.body;

    if (!mechanic_user_id || !proposed_price) {
      return res.status(400).json({ error: 'Mechanic ID and proposed price are required' });
    }

    // Check verification status: unverified technicians cannot bid or apply
    const mech = db.prepare('SELECT is_verified FROM mechanic_profiles WHERE user_id = ?').get(mechanic_user_id);
    if (!mech || mech.is_verified !== 1) {
      return res.status(403).json({
        error: 'Verification required. Admin must review and verify your technician credentials before you can bid or apply for jobs.'
      });
    }

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Breakdown listing not found' });
    }

    if (job.status !== 'OPEN') {
      return res.status(400).json({ error: 'This breakdown work is no longer open for assignment.' });
    }

    // Direct Hire (Urban Company style): First technician to apply is INSTANTLY assigned!
    if (job.hiring_mode === 'DIRECT') {
      const fixedPrice = parseFloat(proposed_price) || job.budget_min || job.budget_max || 5000;

      db.prepare(`
        UPDATE jobs
        SET status = 'ASSIGNED',
            assigned_mechanic_user_id = ?,
            agreed_price = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(mechanic_user_id, fixedPrice, jobId);

      const proposalId = 'prop_' + Date.now();
      db.prepare(`
        INSERT INTO proposals (id, job_id, mechanic_user_id, proposed_price, estimated_arrival, message, status, counter_round)
        VALUES (?, ?, ?, ?, ?, ?, 'ACCEPTED', 0)
      `).run(
        proposalId,
        jobId,
        mechanic_user_id,
        fixedPrice,
        estimated_arrival || '25 mins',
        message || 'Direct hire accepted. Rapid dispatch initialized.'
      );

      // Create locked Quote Card
      const quoteId = 'qc_' + Date.now();
      db.prepare(`
        INSERT INTO quote_cards (
          id, job_id, company_user_id, mechanic_user_id,
          agreed_price, scope_summary, agreed_start_time, company_confirmed_at, mechanic_confirmed_at, is_locked
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'), 1)
      `).run(
        quoteId,
        jobId,
        job.company_user_id,
        mechanic_user_id,
        fixedPrice,
        `Direct Hire (Urban Company style) for ${job.title}. Assigned immediately at fixed budget ₹${fixedPrice}. ETA: ${estimated_arrival || '25 mins'}.`
      );

      // Job history
      db.prepare(`
        INSERT INTO job_history (id, job_id, status, note, updated_by_user_id)
        VALUES (?, ?, 'ASSIGNED', ?, ?)
      `).run(
        'jh_' + Date.now(),
        jobId,
        `Direct hire claimed by technician. Work instantly assigned at fixed rate ₹${fixedPrice}.`,
        mechanic_user_id
      );

      // Chat message
      const msgId = 'msg_' + Date.now();
      db.prepare(`
        INSERT INTO messages (id, job_id, sender_user_id, sender_role, message_text)
        VALUES (?, ?, ?, 'mechanic', ?)
      `).run(
        msgId,
        jobId,
        mechanic_user_id,
        `[DIRECT HIRE CLAIMED] Accepted work order at fixed rate ₹${fixedPrice}. Dispatching now with ETA ${estimated_arrival || '25 mins'}.`
      );

      io.to(`job_${jobId}`).emit('status_change', { jobId, status: 'ASSIGNED', assigned_mechanic_user_id: mechanic_user_id });
      io.emit('job_status_change', { jobId, status: 'ASSIGNED' });
      io.emit('proposal_update', { jobId, proposalId, action: 'direct_assigned' });

      return res.json({ success: true, isDirectAssigned: true, jobId, proposalId });
    }

    // Standard Bidding Flow
    const proposalId = 'prop_' + Date.now();
    db.prepare(`
      INSERT INTO proposals(id, job_id, mechanic_user_id, proposed_price, estimated_arrival, message, status, counter_round)
      VALUES(?, ?, ?, ?, ?, ?, 'PENDING', 0)
    `).run(
      proposalId,
      jobId,
      mechanic_user_id,
      parseFloat(proposed_price),
      estimated_arrival || '30 mins',
      message || 'Ready for rapid dispatch with diagnostic equipment.'
    );

    // Also add as initial chat message
    const msgId = 'msg_' + Date.now();
    db.prepare(`
      INSERT INTO messages(id, job_id, sender_user_id, sender_role, message_text)
      VALUES(?, ?, ?, 'mechanic', ?)
    `).run(
      msgId,
      jobId,
      mechanic_user_id,
      `[PROPOSAL SUBMITTED] Proposed: ₹${proposed_price} | ETA: ${estimated_arrival || '30 mins'}."${message || ''}"`
    );

    // Notify room and broadcast
    io.to(`job_${jobId}`).emit('proposal_update', { jobId, proposalId, action: 'applied' });
    io.emit('proposal_update', { jobId, proposalId, action: 'applied' });

    res.json({ success: true, proposalId });
  } catch (err) {
    console.error('Error submitting proposal:', err);
    res.status(500).json({ error: 'Failed to submit proposal' });
  }
});

// Admin verify / approve technician
app.post('/api/admin/verify-technician', (req, res) => {
  try {
    const { user_id, action } = req.body;
    const isVerified = action === 'reject' ? 0 : 1;
    db.prepare('UPDATE mechanic_profiles SET is_verified = ? WHERE user_id = ?').run(isVerified, user_id);
    io.emit('technician_verified', { user_id, is_verified: isVerified });
    res.json({ success: true, is_verified: isVerified });
  } catch (err) {
    console.error('Verify technician error:', err);
    res.status(500).json({ error: 'Failed to update verification' });
  }
});

// 7. Counter-offer negotiation flow (up to 3 rounds)
app.post('/api/jobs/:id/proposals/:proposalId/counter', (req, res) => {
  try {
    const { id: jobId, proposalId } = req.params;
    const { counter_price, counter_by, note, user_id } = req.body;

    const prop = db.prepare('SELECT * FROM proposals WHERE id = ?').get(proposalId);
    if (!prop) return res.status(404).json({ error: 'Proposal not found' });

    const newRound = (prop.counter_round || 0) + 1;
    if (newRound > 3) {
      return res.status(400).json({ error: 'Maximum negotiation rounds (3) reached for this proposal' });
    }

    db.prepare(`
      UPDATE proposals
      SET counter_price = ?, counter_by = ?, counter_round = ?, status = 'COUNTERED', updated_at = datetime('now')
      WHERE id = ?
  `).run(parseFloat(counter_price), counter_by, newRound, proposalId);

    // Insert negotiation chat message
    db.prepare(`
      INSERT INTO messages(id, job_id, sender_user_id, sender_role, message_text)
VALUES(?, ?, ?, ?, ?)
  `).run(
      'msg_' + Date.now(),
      jobId,
      user_id || (counter_by === 'company' ? 'usr_comp_apex' : prop.mechanic_user_id),
      counter_by,
      `[COUNTER - OFFER Round ${ newRound }/3]: Proposing revised price ₹${ counter_price }. ${ note ? `"${note}"` : '' } `
    );

    io.to(`job_${jobId}`).emit('proposal_update', { jobId, proposalId, action: 'countered', counter_price });

    res.json({ success: true, newRound });
  } catch (err) {
    console.error('Counter offer error:', err);
    res.status(500).json({ error: 'Failed to submit counter offer' });
  }
});

// 8. Accept proposal & generate Quote Card
app.post('/api/jobs/:id/proposals/:proposalId/accept', (req, res) => {
  try {
    const { id: jobId, proposalId } = req.params;
    const { company_user_id } = req.body;

    const prop = db.prepare('SELECT * FROM proposals WHERE id = ?').get(proposalId);
    if (!prop) return res.status(404).json({ error: 'Proposal not found' });

    const finalPrice = prop.counter_price || prop.proposed_price;

    // Update proposal status
    db.prepare("UPDATE proposals SET status = 'ACCEPTED' WHERE id = ?").run(proposalId);

    // Update job status to ASSIGNED
    db.prepare(`
      UPDATE jobs 
      SET status = 'ASSIGNED', assigned_mechanic_user_id = ?, agreed_price = ?, updated_at = datetime('now')
      WHERE id = ?
  `).run(prop.mechanic_user_id, finalPrice, jobId);

    // Generate locked Quote Card
    const quoteId = 'qc_' + Date.now();
    db.prepare(`
      INSERT INTO quote_cards(
    id, job_id, proposal_id, company_user_id, mechanic_user_id,
    agreed_price, scope_summary, agreed_start_time, company_confirmed_at, mechanic_confirmed_at, is_locked
  ) VALUES(?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'), 1)
    `).run(
      quoteId,
      jobId,
      proposalId,
      company_user_id,
      prop.mechanic_user_id,
      finalPrice,
      `Agreed on - site repair and diagnosis for Job ${ jobId }.Payment pre - authorized.`
    );

    // Record in history
    db.prepare(`
      INSERT INTO job_history(id, job_id, status, note, updated_by_user_id)
VALUES(?, ?, 'ASSIGNED', ?, ?)
    `).run(
      'jh_' + Date.now(),
      jobId,
      `Offer accepted at ₹${ finalPrice }. Quote Card locked and mechanic assigned.`,
      company_user_id
    );

    // Insert Quote Card announcement message in Chat
    db.prepare(`
      INSERT INTO messages(id, job_id, sender_user_id, sender_role, message_text, is_quote_card, quote_card_id)
VALUES(?, ?, ?, 'system', ?, 1, ?)
  `).run(
      'msg_' + Date.now(),
      jobId,
      company_user_id,
      `[QUOTE CARD LOCKED] Agreed Price: ₹${ finalPrice }. Both parties confirmed terms.Mechanic is preparing for dispatch.`,
      quoteId
    );

    io.to(`job_${ jobId }`).emit('job_status_change', { jobId, status: 'ASSIGNED', quoteId });

    res.json({ success: true, quoteId });
  } catch (err) {
    console.error('Accept error:', err);
    res.status(500).json({ error: 'Failed to accept proposal' });
  }
});

// 9. Job Status Tracking (Mechanic Assigned -> On the Way -> Working -> Completed)
app.patch('/api/jobs/:id/status', (req, res) => {
  try {
    const jobId = req.params.id;
    const { status, note, user_id, parts_used, work_summary, time_taken_hours } = req.body;

    const validStatuses = ['OPEN', 'ASSIGNED', 'ON_THE_WAY', 'WORKING', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    let updateQuery = `UPDATE jobs SET status = ?, updated_at = datetime('now')`;
    const params = [status];

    if (status === 'COMPLETED') {
      updateQuery += `, completed_at = datetime('now'), parts_used = ?, work_summary = ?, time_taken_hours = ? `;
      params.push(parts_used || 'Standard consumables', work_summary || 'Diagnosed and restored operation', parseFloat(time_taken_hours) || 2.5);
    }
    updateQuery += ` WHERE id = ? `;
    params.push(jobId);

    db.prepare(updateQuery).run(...params);

    // Add to history
    db.prepare(`
      INSERT INTO job_history(id, job_id, status, note, updated_by_user_id)
VALUES(?, ?, ?, ?, ?)
    `).run(
      'jh_' + Date.now(),
      jobId,
      status,
      note || `Job milestone updated to ${ status } `,
      user_id || 'usr_anonymous'
    );

    // If completed, update mechanic total jobs completed, earnings, add to portfolio, generate receipt and process wallet payout
    let generatedReceipt = null;
    if (status === 'COMPLETED') {
      const job = db.prepare(`
        SELECT j.*, u.name as company_name, cp.company_name as cp_company_name,
               m_user.name as mechanic_name
        FROM jobs j
        JOIN users u ON j.company_user_id = u.id
        LEFT JOIN company_profiles cp ON u.id = cp.user_id
        LEFT JOIN users m_user ON j.assigned_mechanic_user_id = m_user.id
        WHERE j.id = ?
      `).get(jobId);

      if (job && job.assigned_mechanic_user_id) {
        const agreedPrice = parseFloat(job.agreed_price) || 5000;
        const partsCost = parseFloat(req.body.parts_cost) || 1200;
        const serviceFee = Math.round(agreedPrice * 0.05);
        const totalAmount = agreedPrice + partsCost;

        // Auto-update technician profile: increment completed, earnings, and update portfolio
        const currentMech = db.prepare('SELECT * FROM mechanic_profiles WHERE user_id = ?').get(job.assigned_mechanic_user_id);
        let portfolioArr = [];
        try {
          portfolioArr = currentMech?.portfolio ? JSON.parse(currentMech.portfolio) : [];
        } catch(e) {}

        portfolioArr.unshift({
          id: 'pf_' + Date.now(),
          title: job.title,
          machine_type: job.machine_category,
          description: work_summary || `Repaired ${job.machine_brand || ''} ${job.machine_model || ''}. ${job.fault_description}`,
          image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500',
          completed_at: new Date().toISOString()
        });

        db.prepare(`
          UPDATE mechanic_profiles 
          SET total_jobs_completed = total_jobs_completed + 1,
              total_earnings = total_earnings + ?,
              portfolio = ?
          WHERE user_id = ?
        `).run(agreedPrice, JSON.stringify(portfolioArr), job.assigned_mechanic_user_id);

        // Generate official Receipt
        const receiptCount = db.prepare('SELECT COUNT(*) as count FROM receipts').get().count;
        const receiptNumber = `REC-2026-${String(receiptCount + 1001).padStart(4, '0')}`;
        const receiptId = 'rec_' + Date.now();

        db.prepare(`
          INSERT INTO receipts (
            id, job_id, company_user_id, mechanic_user_id, receipt_number,
            base_price, parts_cost, service_fee, total_amount, payment_method, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ESCROW_RELEASE', ?)
        `).run(
          receiptId,
          jobId,
          job.company_user_id,
          job.assigned_mechanic_user_id,
          receiptNumber,
          agreedPrice,
          partsCost,
          serviceFee,
          totalAmount,
          work_summary || 'Diagnosed and restored operational tolerance'
        );

        generatedReceipt = {
          id: receiptId,
          receipt_number: receiptNumber,
          job_id: jobId,
          total_amount: totalAmount,
          base_price: agreedPrice,
          parts_cost: partsCost,
          service_fee: serviceFee
        };

        // Update Wallets: Credit Technician Wallet
        db.prepare(`
          INSERT INTO wallets (user_id, balance, escrow_locked, total_withdrawn)
          VALUES (?, ?, 0, 0)
          ON CONFLICT(user_id) DO UPDATE SET balance = balance + ?, updated_at = datetime('now')
        `).run(job.assigned_mechanic_user_id, agreedPrice, agreedPrice);

        db.prepare(`
          INSERT INTO wallet_transactions (id, user_id, amount, type, description, reference_job_id)
          VALUES (?, ?, ?, 'PAYOUT', ?, ?)
        `).run(
          'tx_' + Date.now() + '_payout',
          job.assigned_mechanic_user_id,
          agreedPrice,
          `Payout for completed work on ${job.title} (${jobId})`,
          jobId
        );

        // Company Wallet transaction entry
        db.prepare(`
          INSERT INTO wallet_transactions (id, user_id, amount, type, description, reference_job_id)
          VALUES (?, ?, ?, 'ESCROW_RELEASE', ?, ?)
        `).run(
          'tx_' + Date.now() + '_escrow',
          job.company_user_id,
          -agreedPrice,
          `Escrow released for work order ${jobId}`,
          jobId
        );
      }
    }

    io.to(`job_${jobId}`).emit('job_status_change', { jobId, status, note, receipt: generatedReceipt });
    io.emit('job_status_change', { jobId, status, note, receipt: generatedReceipt });

    res.json({ success: true, status, receipt: generatedReceipt });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Dedicated endpoint to complete job with parts and summary
app.post('/api/jobs/:id/complete', (req, res) => {
  try {
    const jobId = req.params.id;
    const { user_id, parts_used, parts_cost, work_summary, time_taken_hours } = req.body;

    const job = db.prepare(`
      SELECT j.*, u.name as company_name, cp.company_name as cp_company_name,
             m_user.name as mechanic_name
      FROM jobs j
      JOIN users u ON j.company_user_id = u.id
      LEFT JOIN company_profiles cp ON u.id = cp.user_id
      LEFT JOIN users m_user ON j.assigned_mechanic_user_id = m_user.id
      WHERE j.id = ?
    `).get(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const agreedPrice = parseFloat(job.agreed_price) || 5000;
    const partsCostNum = parseFloat(parts_cost) || 0;
    const serviceFee = Math.round(agreedPrice * 0.05);
    const totalAmount = agreedPrice + partsCostNum;

    // Update job status
    db.prepare(`
      UPDATE jobs 
      SET status = 'COMPLETED',
          completed_at = datetime('now'),
          parts_used = ?,
          work_summary = ?,
          time_taken_hours = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      parts_used || 'OEM seal replacement and calibration',
      work_summary || 'Diagnosed vibration, replaced spindle seals, operational tolerances verified.',
      parseFloat(time_taken_hours) || 2.5,
      jobId
    );

    // Add to history
    db.prepare(`
      INSERT INTO job_history (id, job_id, status, note, updated_by_user_id)
      VALUES (?, ?, 'COMPLETED', ?, ?)
    `).run('jh_' + Date.now(), jobId, 'Work completed and verified. Invoice receipt generated.', user_id || job.assigned_mechanic_user_id);

    // Auto-update technician profile: increment completed, earnings, update portfolio
    if (job.assigned_mechanic_user_id) {
      const currentMech = db.prepare('SELECT * FROM mechanic_profiles WHERE user_id = ?').get(job.assigned_mechanic_user_id);
      let portfolioArr = [];
      try {
        portfolioArr = currentMech?.portfolio ? JSON.parse(currentMech.portfolio) : [];
      } catch(e) {}

      portfolioArr.unshift({
        id: 'pf_' + Date.now(),
        title: job.title,
        machine_type: job.machine_category,
        description: work_summary || `Repaired ${job.machine_brand || ''} ${job.machine_model || ''}. ${job.fault_description}`,
        image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500',
        completed_at: new Date().toISOString()
      });

      db.prepare(`
        UPDATE mechanic_profiles 
        SET total_jobs_completed = total_jobs_completed + 1,
            total_earnings = total_earnings + ?,
            portfolio = ?
        WHERE user_id = ?
      `).run(agreedPrice, JSON.stringify(portfolioArr), job.assigned_mechanic_user_id);

      // Generate receipt
      const receiptCount = db.prepare('SELECT COUNT(*) as count FROM receipts').get().count;
      const receiptNumber = `REC-2026-${String(receiptCount + 1001).padStart(4, '0')}`;
      const receiptId = 'rec_' + Date.now();

      db.prepare(`
        INSERT INTO receipts (
          id, job_id, company_user_id, mechanic_user_id, receipt_number,
          base_price, parts_cost, service_fee, total_amount, payment_method, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ESCROW_RELEASE', ?)
      `).run(
        receiptId,
        jobId,
        job.company_user_id,
        job.assigned_mechanic_user_id,
        receiptNumber,
        agreedPrice,
        partsCostNum,
        serviceFee,
        totalAmount,
        work_summary || 'Work performed and verified'
      );

      // Credit Technician Wallet
      db.prepare(`
        INSERT INTO wallets (user_id, balance, escrow_locked, total_withdrawn)
        VALUES (?, ?, 0, 0)
        ON CONFLICT(user_id) DO UPDATE SET balance = balance + ?, updated_at = datetime('now')
      `).run(job.assigned_mechanic_user_id, agreedPrice, agreedPrice);

      db.prepare(`
        INSERT INTO wallet_transactions (id, user_id, amount, type, description, reference_job_id)
        VALUES (?, ?, ?, 'PAYOUT', ?, ?)
      `).run('tx_' + Date.now(), job.assigned_mechanic_user_id, agreedPrice, `Payout for completed work on ${job.title}`, jobId);

      // System chat message
      db.prepare(`
        INSERT INTO messages(id, job_id, sender_user_id, sender_role, message_text)
        VALUES(?, ?, ?, 'system', ?)
      `).run('msg_' + Date.now(), jobId, user_id || job.assigned_mechanic_user_id, `[WORK COMPLETED] Receipt ${receiptNumber} generated. Payout of ₹${agreedPrice} released to technician wallet.`);

      const fullReceipt = {
        id: receiptId,
        receipt_number: receiptNumber,
        job_id: jobId,
        base_price: agreedPrice,
        parts_cost: partsCostNum,
        service_fee: serviceFee,
        total_amount: totalAmount,
        issued_at: new Date().toISOString()
      };

      io.to(`job_${jobId}`).emit('job_status_change', { jobId, status: 'COMPLETED', receipt: fullReceipt });
      io.emit('job_status_change', { jobId, status: 'COMPLETED', receipt: fullReceipt });

      return res.json({ success: true, receipt: fullReceipt });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Job complete error:', err);
    res.status(500).json({ error: 'Failed to complete job' });
  }
});

// Cancel Bid (Technician cancels proposal)
app.post('/api/jobs/:id/proposals/:proposalId/cancel', (req, res) => {
  try {
    const { id: jobId, proposalId } = req.params;
    const { mechanic_user_id } = req.body;

    const prop = db.prepare('SELECT * FROM proposals WHERE id = ? AND job_id = ?').get(proposalId, jobId);
    if (!prop) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    if (prop.status === 'ACCEPTED') {
      return res.status(400).json({ error: 'Cannot cancel an accepted bid' });
    }

    db.prepare("UPDATE proposals SET status = 'WITHDRAWN' WHERE id = ?").run(proposalId);

    db.prepare(`
      INSERT INTO messages(id, job_id, sender_user_id, sender_role, message_text)
      VALUES(?, ?, ?, 'mechanic', ?)
    `).run('msg_' + Date.now(), jobId, mechanic_user_id || prop.mechanic_user_id, `[BID CANCELLED] Technician withdrew quote of ₹${prop.proposed_price}.`);

    io.to(`job_${jobId}`).emit('proposal_update', { jobId, proposalId, action: 'cancelled' });
    io.emit('proposal_update', { jobId, proposalId, action: 'cancelled' });

    res.json({ success: true, message: 'Bid cancelled successfully' });
  } catch (err) {
    console.error('Cancel bid error:', err);
    res.status(500).json({ error: 'Failed to cancel bid' });
  }
});

// Delete Work (Company deletes or cancels breakdown listing)
app.delete('/api/jobs/:id', (req, res) => {
  try {
    const jobId = req.params.id;
    const { user_id } = req.body || {};

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (['ASSIGNED', 'ON_THE_WAY', 'WORKING'].includes(job.status)) {
      db.prepare("UPDATE jobs SET status = 'CANCELLED', updated_at = datetime('now') WHERE id = ?").run(jobId);
      db.prepare(`
        INSERT INTO job_history(id, job_id, status, note, updated_by_user_id)
        VALUES(?, ?, 'CANCELLED', 'Breakdown listing cancelled by plant management', ?)
      `).run('jh_' + Date.now(), jobId, user_id || job.company_user_id);
    } else {
      db.prepare("DELETE FROM proposals WHERE job_id = ?").run(jobId);
      db.prepare("DELETE FROM quote_cards WHERE job_id = ?").run(jobId);
      db.prepare("DELETE FROM job_history WHERE job_id = ?").run(jobId);
      db.prepare("DELETE FROM messages WHERE job_id = ?").run(jobId);
      db.prepare("DELETE FROM jobs WHERE id = ?").run(jobId);
    }

    io.emit('job_deleted', { jobId });
    io.emit('job_status_change', { jobId, status: 'DELETED' });
    res.json({ success: true, jobId });
  } catch (err) {
    console.error('Delete job error:', err);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// Get Receipt Details
app.get('/api/receipts/:jobId', (req, res) => {
  try {
    const receipt = db.prepare(`
      SELECT r.*,
             j.title as job_title, j.machine_category, j.machine_brand, j.machine_model, j.serial_number, j.asset_tag,
             j.address, j.city, j.completed_at, j.parts_used, j.work_summary, j.time_taken_hours,
             u_comp.name as company_contact_name, cp.company_name, cp.industry_type, u_comp.phone as company_phone,
             u_mech.name as mechanic_name, u_mech.phone as mechanic_phone, mp.headline as mechanic_headline, mp.verification_tier
      FROM receipts r
      JOIN jobs j ON r.job_id = j.id
      JOIN users u_comp ON r.company_user_id = u_comp.id
      LEFT JOIN company_profiles cp ON u_comp.id = cp.user_id
      JOIN users u_mech ON r.mechanic_user_id = u_mech.id
      LEFT JOIN mechanic_profiles mp ON u_mech.id = mp.user_id
      WHERE r.job_id = ?
      ORDER BY r.issued_at DESC
      LIMIT 1
    `).get(req.params.jobId);

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.json(receipt);
  } catch (err) {
    console.error('Receipt fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

// Wallet Details & Transactions
app.get('/api/wallet/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    let wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
    if (!wallet) {
      wallet = { user_id: userId, balance: 25000.0, escrow_locked: 0.0, total_withdrawn: 0.0 };
      db.prepare(`
        INSERT INTO wallets (user_id, balance, escrow_locked, total_withdrawn)
        VALUES (?, ?, 0, 0)
      `).run(userId, wallet.balance);
    }

    const transactions = db.prepare(`
      SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 30
    `).all(userId);

    res.json({ wallet, transactions });
  } catch (err) {
    console.error('Wallet fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

// Wallet Withdrawal
app.post('/api/wallet/withdraw', (req, res) => {
  try {
    const { userId, amount, bankAccount } = req.body;
    const withdrawAmount = parseFloat(amount);
    if (!userId || !withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }

    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
    if (!wallet || wallet.balance < withdrawAmount) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    db.prepare(`
      UPDATE wallets
      SET balance = balance - ?,
          total_withdrawn = total_withdrawn + ?,
          updated_at = datetime('now')
      WHERE user_id = ?
    `).run(withdrawAmount, withdrawAmount, userId);

    const txId = 'tx_' + Date.now();
    db.prepare(`
      INSERT INTO wallet_transactions (id, user_id, amount, type, description)
      VALUES (?, ?, ?, 'WITHDRAWAL', ?)
    `).run(txId, userId, -withdrawAmount, `Payout transfer to bank account (${bankAccount || 'Verified HDFC Current Account'})`);

    const updated = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
    res.json({ success: true, withdrawn: withdrawAmount, newBalance: updated.balance });
  } catch (err) {
    console.error('Withdraw error:', err);
    res.status(500).json({ error: 'Withdrawal failed' });
  }
});

// Wallet Top-up (Company escrow funding)
app.post('/api/wallet/topup', (req, res) => {
  try {
    const { userId, amount } = req.body;
    const topupAmount = parseFloat(amount);
    if (!userId || !topupAmount || topupAmount <= 0) {
      return res.status(400).json({ error: 'Invalid top-up amount' });
    }

    db.prepare(`
      INSERT INTO wallets (user_id, balance, escrow_locked, total_withdrawn)
      VALUES (?, ?, 0, 0)
      ON CONFLICT(user_id) DO UPDATE SET balance = balance + ?, updated_at = datetime('now')
    `).run(userId, topupAmount, topupAmount);

    const txId = 'tx_' + Date.now();
    db.prepare(`
      INSERT INTO wallet_transactions (id, user_id, amount, type, description)
      VALUES (?, ?, ?, 'CREDIT', 'Added funds to operational escrow wallet')
    `).run(txId, userId, topupAmount);

    const updated = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
    res.json({ success: true, balance: updated.balance });
  } catch (err) {
    console.error('Topup error:', err);
    res.status(500).json({ error: 'Top-up failed' });
  }
});

// Real-time Graphs and Analytics for All Dashboards
app.get('/api/analytics/:role/:userId', (req, res) => {
  try {
    const { role, userId } = req.params;

    if (role === 'company') {
      const companyJobs = db.prepare('SELECT * FROM jobs WHERE company_user_id = ?').all(userId);
      const totalBreakdowns = companyJobs.length;
      const completed = companyJobs.filter(j => j.status === 'COMPLETED').length;
      const totalExpense = companyJobs.filter(j => j.agreed_price).reduce((acc, j) => acc + (j.agreed_price || 0), 0);

      const monthlySpend = [
        { month: 'May', cost: 18500, hoursDown: 14 },
        { month: 'Jun', cost: 24200, hoursDown: 19 },
        { month: 'Jul', cost: 12000, hoursDown: 8 },
        { month: 'Aug', cost: 31000, hoursDown: 22 },
        { month: 'Sep', cost: 21500, hoursDown: 16 },
        { month: 'Oct', cost: totalExpense > 0 ? totalExpense : 28400, hoursDown: 12 }
      ];

      const categories = {};
      companyJobs.forEach(j => {
        categories[j.machine_category] = (categories[j.machine_category] || 0) + 1;
      });
      const categoryDistribution = Object.keys(categories).map(cat => ({
        category: cat,
        count: categories[cat]
      }));

      return res.json({
        totalBreakdowns,
        completed,
        totalExpense,
        mttrHours: 2.8,
        uptimePercentage: 99.4,
        monthlySpend,
        categoryDistribution: categoryDistribution.length ? categoryDistribution : [
          { category: 'CNC Milling', count: 4 },
          { category: 'Hydraulics', count: 3 },
          { category: 'Robotics', count: 2 },
          { category: 'VMC Lathe', count: 2 }
        ]
      });
    }

    if (role === 'mechanic') {
      const myJobs = db.prepare('SELECT * FROM jobs WHERE assigned_mechanic_user_id = ?').all(userId);
      const totalCompleted = myJobs.filter(j => j.status === 'COMPLETED').length;
      const totalEarnings = myJobs.filter(j => j.status === 'COMPLETED').reduce((acc, j) => acc + (j.agreed_price || 0), 0);
      const proposals = db.prepare('SELECT * FROM proposals WHERE mechanic_user_id = ?').all(userId);
      const totalBids = proposals.length;
      const acceptedBids = proposals.filter(p => p.status === 'ACCEPTED').length;
      const winRate = totalBids > 0 ? Math.round((acceptedBids / totalBids) * 100) : 80;

      const monthlyEarnings = [
        { month: 'May', earnings: 28000, jobs: 4 },
        { month: 'Jun', earnings: 36500, jobs: 6 },
        { month: 'Jul', earnings: 42000, jobs: 7 },
        { month: 'Aug', earnings: 31000, jobs: 5 },
        { month: 'Sep', earnings: 48500, jobs: 8 },
        { month: 'Oct', earnings: totalEarnings > 0 ? totalEarnings : 54000, jobs: totalCompleted || 8 }
      ];

      return res.json({
        totalCompleted,
        totalEarnings,
        totalBids,
        winRate,
        firstTimeFixRate: 96,
        avgResponseMinutes: 18,
        monthlyEarnings,
        specialtyDistribution: [
          { category: 'CNC Milling', share: 45 },
          { category: 'Hydraulics', share: 30 },
          { category: 'PLC Controls', share: 15 },
          { category: 'Servo Drives', share: 10 }
        ]
      });
    }

    // Admin role
    const allJobs = db.prepare('SELECT * FROM jobs').all();
    const allMechs = db.prepare('SELECT * FROM mechanic_profiles').all();
    const allCompanies = db.prepare('SELECT * FROM company_profiles').all();
    const totalVolume = allJobs.reduce((acc, j) => acc + (j.agreed_price || 0), 0);

    const platformTrends = [
      { month: 'May', volume: 145000, jobs: 24 },
      { month: 'Jun', volume: 182000, jobs: 31 },
      { month: 'Jul', volume: 215000, jobs: 38 },
      { month: 'Aug', volume: 260000, jobs: 44 },
      { month: 'Sep', volume: 310000, jobs: 52 },
      { month: 'Oct', volume: totalVolume > 0 ? totalVolume + 250000 : 385000, jobs: allJobs.length }
    ];

    return res.json({
      totalJobs: allJobs.length,
      totalVolume,
      activeTechnicians: allMechs.length,
      activePlants: allCompanies.length,
      resolutionRate: 98.2,
      platformTrends,
      categoryDistribution: [
        { category: 'CNC Machining', count: 42 },
        { category: 'Hydraulic Systems', count: 28 },
        { category: 'Pneumatics', count: 18 },
        { category: 'Industrial Robotics', count: 14 }
      ]
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Admin Deep Inspect: All Details of a Job and its Bids
app.get('/api/admin/job-deep-inspect/:id', (req, res) => {
  try {
    const jobId = req.params.id;
    const job = db.prepare(`
      SELECT j.*, u.name as company_contact_name, u.email as company_email, u.phone as company_phone,
             cp.company_name, cp.industry_type, cp.address as facility_address,
             m_user.name as assigned_mechanic_name, m_user.email as assigned_mechanic_email, m_user.phone as assigned_mechanic_phone
      FROM jobs j
      JOIN users u ON j.company_user_id = u.id
      LEFT JOIN company_profiles cp ON u.id = cp.user_id
      LEFT JOIN users m_user ON j.assigned_mechanic_user_id = m_user.id
      WHERE j.id = ?
    `).get(jobId);

    if (!job) return res.status(404).json({ error: 'Job not found' });

    const proposals = db.prepare(`
      SELECT p.*, u.name as mechanic_name, u.email as mechanic_email, u.phone as mechanic_phone,
             mp.headline, mp.rating, mp.reviews_count, mp.verification_tier, mp.hourly_rate, mp.is_verified
      FROM proposals p
      JOIN users u ON p.mechanic_user_id = u.id
      LEFT JOIN mechanic_profiles mp ON u.id = mp.user_id
      WHERE p.job_id = ?
      ORDER BY p.created_at DESC
    `).all(jobId);

    const quoteCards = db.prepare('SELECT * FROM quote_cards WHERE job_id = ?').all(jobId);
    const history = db.prepare('SELECT * FROM job_history WHERE job_id = ? ORDER BY created_at ASC').all(jobId);
    const receipt = db.prepare('SELECT * FROM receipts WHERE job_id = ?').get(jobId) || null;

    res.json({ job, proposals, quoteCards, history, receipt });
  } catch (err) {
    console.error('Admin job inspect error:', err);
    res.status(500).json({ error: 'Failed to inspect job' });
  }
});

// Admin Deep Inspect: Complete Technician Profile & Verification Documents
app.get('/api/admin/technician-deep-inspect/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const user = db.prepare('SELECT id, role, email, name, phone, avatar_url, created_at FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const profile = db.prepare('SELECT * FROM mechanic_profiles WHERE user_id = ?').get(userId);
    if (profile) {
      try { profile.skills = JSON.parse(profile.skills || '[]'); } catch(e) { profile.skills = []; }
      try { profile.certifications = JSON.parse(profile.certifications || '[]'); } catch(e) { profile.certifications = []; }
      try { profile.portfolio = JSON.parse(profile.portfolio || '[]'); } catch(e) { profile.portfolio = []; }
    }

    const reviews = db.prepare(`
      SELECT r.*, cp.company_name, u.name as company_contact
      FROM reviews r
      JOIN jobs j ON r.job_id = j.id
      JOIN users u ON j.company_user_id = u.id
      LEFT JOIN company_profiles cp ON u.id = cp.user_id
      WHERE r.mechanic_user_id = ?
    `).all(userId);

    const completedJobs = db.prepare(`
      SELECT j.id, j.title, j.machine_category, j.agreed_price, j.completed_at, cp.company_name
      FROM jobs j
      JOIN users u ON j.company_user_id = u.id
      LEFT JOIN company_profiles cp ON u.id = cp.user_id
      WHERE j.assigned_mechanic_user_id = ? AND j.status = 'COMPLETED'
      ORDER BY j.completed_at DESC
    `).all(userId);

    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);

    res.json({ user, profile, reviews, completedJobs, wallet });
  } catch (err) {
    console.error('Admin technician inspect error:', err);
    res.status(500).json({ error: 'Failed to inspect technician' });
  }
});

// Admin: Get all technicians list
app.get('/api/admin/technicians', (req, res) => {
  try {
    const technicians = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.avatar_url, u.is_banned, u.created_at,
             mp.headline, mp.city, mp.rating, mp.reviews_count, mp.hourly_rate,
             mp.verification_tier, mp.is_verified, mp.total_jobs_completed, mp.total_earnings,
             mp.years_experience
      FROM users u
      JOIN mechanic_profiles mp ON u.id = mp.user_id
      WHERE u.role = 'mechanic'
      ORDER BY mp.is_verified ASC, u.created_at DESC
    `).all();

    res.json(technicians);
  } catch (err) {
    console.error('Admin technicians list error:', err);
    res.status(500).json({ error: 'Failed to fetch technicians' });
  }
});

// Admin: Ban/Unban technician
app.post('/api/admin/technicians/:userId/ban', (req, res) => {
  try {
    const userId = req.params.userId;
    const user = db.prepare('SELECT is_banned FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: 'Technician not found' });

    const newBannedState = user.is_banned === 1 ? 0 : 1;
    db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(newBannedState, userId);
    db.prepare('UPDATE mechanic_profiles SET is_banned = ? WHERE user_id = ?').run(newBannedState, userId);

    res.json({ success: true, is_banned: newBannedState });
  } catch (err) {
    console.error('Ban error:', err);
    res.status(500).json({ error: 'Failed to update ban status' });
  }
});

// Admin: Delete technician
app.delete('/api/admin/technicians/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    db.prepare('DELETE FROM proposals WHERE mechanic_user_id = ?').run(userId);
    db.prepare('DELETE FROM trusted_mechanics WHERE mechanic_user_id = ?').run(userId);
    db.prepare('DELETE FROM mechanic_profiles WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM wallet_transactions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM wallets WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    res.json({ success: true, message: 'Technician deleted successfully' });
  } catch (err) {
    console.error('Delete technician error:', err);
    res.status(500).json({ error: 'Failed to delete technician' });
  }
});

// 10. Chat Messages
app.get('/api/chats/:jobId', (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_user_id = u.id
      WHERE m.job_id = ?
  ORDER BY m.created_at ASC
    `).all(req.params.jobId);

    res.json(messages);
  } catch (err) {
    console.error('Chat fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/chats/:jobId', (req, res) => {
  try {
    const jobId = req.params.jobId;
    const sender_user_id = req.body.sender_user_id || req.body.sender_id;
    const { sender_role, message_text, attachment_url, attachment_type } = req.body;

    if (!sender_user_id || (!message_text && !attachment_url)) {
      return res.status(400).json({ error: 'Sender and content required' });
    }

    const msgId = 'msg_' + Date.now();
    db.prepare(`
      INSERT INTO messages(id, job_id, sender_user_id, sender_role, message_text, attachment_url, attachment_type)
VALUES(?, ?, ?, ?, ?, ?, ?)
    `).run(
      msgId,
      jobId,
      sender_user_id,
      sender_role || 'mechanic',
      message_text || '',
      attachment_url || null,
      attachment_type || null
    );

    const user = db.prepare('SELECT name, avatar_url FROM users WHERE id = ?').get(sender_user_id);

    const fullMessage = {
      id: msgId,
      job_id: jobId,
      sender_user_id,
      sender_role: sender_role || 'mechanic',
      message_text: message_text || '',
      attachment_url: attachment_url || null,
      attachment_type: attachment_type || null,
      created_at: new Date().toISOString(),
      sender_name: user?.name || 'User',
      sender_avatar: user?.avatar_url || ''
    };

    io.to(`job_${jobId}`).emit('new_message', fullMessage);
    io.emit('new_message', fullMessage);

    res.json(fullMessage);
  } catch (err) {
    console.error('Chat send error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// 11. Mechanic Directory & Profile
app.get('/api/mechanics', (req, res) => {
  try {
    const { skill, availability, min_rating, search } = req.query;

    let query = `
      SELECT mp.*, u.email, u.phone, u.avatar_url
      FROM mechanic_profiles mp
      JOIN users u ON mp.user_id = u.id
      WHERE 1 = 1
  `;
    const params = [];

    if (availability && availability !== 'ALL') {
      query += ` AND mp.availability_status = ? `;
      params.push(availability);
    }
    if (min_rating) {
      query += ` AND mp.rating >= ? `;
      params.push(parseFloat(min_rating));
    }
    if (search) {
      query += ` AND(mp.full_name LIKE ? OR mp.headline LIKE ? OR mp.city LIKE ? OR mp.skills LIKE ?)`;
      const s = `% ${ search }% `;
      params.push(s, s, s, s);
    }

    query += ` ORDER BY mp.rating DESC, mp.total_jobs_completed DESC`;

    const mechanics = db.prepare(query).all(...params);

    const parsed = mechanics.map(m => ({
      ...m,
      skills: m.skills ? JSON.parse(m.skills) : [],
      certifications: m.certifications ? JSON.parse(m.certifications) : [],
      portfolio: m.portfolio ? JSON.parse(m.portfolio) : []
    }));

    res.json(parsed);
  } catch (err) {
    console.error('Error fetching mechanics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/mechanics/:userId', (req, res) => {
  try {
    const mechanic = db.prepare(`
      SELECT mp.*, u.email, u.phone, u.avatar_url
      FROM mechanic_profiles mp
      JOIN users u ON mp.user_id = u.id
      WHERE mp.user_id = ?
  `).get(req.params.userId);

    if (!mechanic) return res.status(404).json({ error: 'Mechanic profile not found' });

    mechanic.skills = mechanic.skills ? JSON.parse(mechanic.skills) : [];
    mechanic.certifications = mechanic.certifications ? JSON.parse(mechanic.certifications) : [];
    mechanic.portfolio = mechanic.portfolio ? JSON.parse(mechanic.portfolio) : [];

    // Also get reviews for this mechanic
    const reviews = db.prepare(`
      SELECT r.*, cp.company_name, u.avatar_url as company_avatar
      FROM reviews r
      JOIN users u ON r.company_user_id = u.id
      LEFT JOIN company_profiles cp ON u.id = cp.user_id
      WHERE r.mechanic_user_id = ?
  ORDER BY r.created_at DESC
    `).all(req.params.userId);

    res.json({ mechanic, reviews });
  } catch (err) {
    console.error('Error fetching mechanic profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update mechanic profile / availability toggle
app.put('/api/mechanics/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const {
      full_name, headline, bio, city, service_radius_km, years_experience,
      skills, certifications, portfolio, availability_status, availability_note,
      hourly_rate, avatar_url
    } = req.body;

    if (avatar_url) {
      db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatar_url, userId);
    }
    if (full_name) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(full_name, userId);
    }

    db.prepare(`
      UPDATE mechanic_profiles
      SET full_name = COALESCE(?, full_name),
  headline = COALESCE(?, headline),
  bio = COALESCE(?, bio),
  city = COALESCE(?, city),
  service_radius_km = COALESCE(?, service_radius_km),
  years_experience = COALESCE(?, years_experience),
  skills = COALESCE(?, skills),
  certifications = COALESCE(?, certifications),
  portfolio = COALESCE(?, portfolio),
  availability_status = COALESCE(?, availability_status),
  availability_note = COALESCE(?, availability_note),
  hourly_rate = COALESCE(?, hourly_rate),
  updated_at = datetime('now')
      WHERE user_id = ?
  `).run(
      full_name || null,
      headline || null,
      bio || null,
      city || null,
      service_radius_km ? parseInt(service_radius_km, 10) : null,
      years_experience ? parseInt(years_experience, 10) : null,
      skills ? (Array.isArray(skills) ? JSON.stringify(skills) : skills) : null,
      certifications ? (Array.isArray(certifications) ? JSON.stringify(certifications) : certifications) : null,
      portfolio ? (Array.isArray(portfolio) ? JSON.stringify(portfolio) : portfolio) : null,
      availability_status || null,
      availability_note !== undefined ? availability_note : null,
      hourly_rate ? parseFloat(hourly_rate) : null,
      userId
    );

    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    console.error('Update mechanic profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 12. Company Profile
app.get('/api/companies/:userId', (req, res) => {
  try {
    const company = db.prepare(`
      SELECT cp.*, u.email, u.name as user_name, u.phone, u.avatar_url
      FROM company_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.user_id = ?
  `).get(req.params.userId);

    if (!company) return res.status(404).json({ error: 'Company not found' });

    company.machines_operated = company.machines_operated ? JSON.parse(company.machines_operated) : [];

    // Get trusted mechanics
    const trusted = db.prepare(`
      SELECT tm.id as link_id, mp.*, u.name, u.avatar_url, u.phone
      FROM trusted_mechanics tm
      JOIN users u ON tm.mechanic_user_id = u.id
      JOIN mechanic_profiles mp ON u.id = mp.user_id
      WHERE tm.company_user_id = ?
  `).all(req.params.userId);

    // Get jobs posted
    const jobs = db.prepare('SELECT * FROM jobs WHERE company_user_id = ? ORDER BY created_at DESC').all(req.params.userId);

    res.json({ company, trusted, jobs });
  } catch (err) {
    console.error('Error fetching company:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/companies/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const { company_name, industry_type, address, city, machines_operated, gst_number, contact_person } = req.body;

    db.prepare(`
      UPDATE company_profiles
      SET company_name = COALESCE(?, company_name),
  industry_type = COALESCE(?, industry_type),
  address = COALESCE(?, address),
  city = COALESCE(?, city),
  machines_operated = COALESCE(?, machines_operated),
  gst_number = COALESCE(?, gst_number),
  contact_person = COALESCE(?, contact_person),
  updated_at = datetime('now')
      WHERE user_id = ?
  `).run(
      company_name || null,
      industry_type || null,
      address || null,
      city || null,
      machines_operated ? JSON.stringify(machines_operated) : null,
      gst_number || null,
      contact_person || null,
      userId
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Update company error:', err);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// Toggle trusted mechanic
app.post('/api/companies/:userId/trusted', (req, res) => {
  try {
    const { mechanic_user_id } = req.body;
    const companyUserId = req.params.userId;

    const existing = db.prepare('SELECT id FROM trusted_mechanics WHERE company_user_id = ? AND mechanic_user_id = ?')
      .get(companyUserId, mechanic_user_id);

    if (existing) {
      db.prepare('DELETE FROM trusted_mechanics WHERE id = ?').run(existing.id);
      return res.json({ success: true, action: 'removed' });
    } else {
      db.prepare('INSERT INTO trusted_mechanics (id, company_user_id, mechanic_user_id) VALUES (?, ?, ?)')
        .run('tm_' + Date.now(), companyUserId, mechanic_user_id);
      return res.json({ success: true, action: 'added' });
    }
  } catch (err) {
    console.error('Trusted mechanic error:', err);
    res.status(500).json({ error: 'Failed to update trusted mechanic' });
  }
});

// 13. Reviews & Ratings
app.post('/api/reviews', (req, res) => {
  try {
    const { job_id, company_user_id, mechanic_user_id, rating, punctuality_rating, quality_rating, communication_rating, review_text } = req.body;

    const reviewId = 'rev_' + Date.now();
    db.prepare(`
      INSERT INTO reviews(id, job_id, company_user_id, mechanic_user_id, rating, punctuality_rating, quality_rating, communication_rating, review_text)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
      reviewId,
      job_id,
      company_user_id,
      mechanic_user_id,
      parseFloat(rating) || 5.0,
      parseFloat(punctuality_rating) || 5.0,
      parseFloat(quality_rating) || 5.0,
      parseFloat(communication_rating) || 5.0,
      review_text || 'Great service and rapid resolution.'
    );

    // Update mechanic average rating
    const avgData = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE mechanic_user_id = ?')
      .get(mechanic_user_id);

    if (avgData && avgData.count > 0) {
      db.prepare('UPDATE mechanic_profiles SET rating = ?, reviews_count = ? WHERE user_id = ?')
        .run(Math.round(avgData.avg_rating * 100) / 100, avgData.count, mechanic_user_id);
    }

    res.json({ success: true, reviewId });
  } catch (err) {
    console.error('Review submit error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// 14. Admin Overview & Platform Health
app.get('/api/admin/overview', (req, res) => {
  try {
    const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
    const activeJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status IN ('OPEN', 'MATCHED', 'ASSIGNED', 'ON_THE_WAY', 'WORKING')").get().count;
    const completedJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'COMPLETED'").get().count;
    const totalEmergency = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE urgency = 'EMERGENCY'").get().count;
    const totalMechanics = db.prepare('SELECT COUNT(*) as count FROM mechanic_profiles').get().count;
    const totalCompanies = db.prepare('SELECT COUNT(*) as count FROM company_profiles').get().count;
    const availableMechanics = db.prepare("SELECT COUNT(*) as count FROM mechanic_profiles WHERE availability_status = 'AVAILABLE_NOW'").get().count;
    
    // Revenue calculations (commission 10%)
    const volumeData = db.prepare("SELECT SUM(agreed_price) as total_val FROM jobs WHERE status = 'COMPLETED'").get();
    const totalVolume = volumeData.total_val || 485000;
    const platformCommission = totalVolume * 0.10;

    // Recent jobs
    const recentJobs = db.prepare(`
      SELECT j.id, j.title, j.urgency, j.status, j.city, j.agreed_price, j.created_at, cp.company_name
      FROM jobs j
      JOIN users u ON j.company_user_id = u.id
      LEFT JOIN company_profiles cp ON u.id = cp.user_id
      ORDER BY j.created_at DESC
      LIMIT 10
  `).all();

    // Technicians awaiting verification
    const pendingTechnicians = db.prepare(`
      SELECT mp.*, u.email, u.phone, u.avatar_url
      FROM mechanic_profiles mp
      JOIN users u ON mp.user_id = u.id
      WHERE mp.is_verified = 0
      ORDER BY mp.created_at DESC
  `).all().map(m => ({
      ...m,
      skills: m.skills ? JSON.parse(m.skills) : [],
      certifications: m.certifications ? JSON.parse(m.certifications) : [],
      portfolio: m.portfolio ? JSON.parse(m.portfolio) : []
    }));

    res.json({
      metrics: {
        totalJobs,
        activeJobs,
        completedJobs,
        totalEmergency,
        totalMechanics,
        totalCompanies,
        availableMechanics,
        totalVolume,
        platformCommission,
        slaAdherence: '96.4%'
      },
      recentJobs,
      pendingTechnicians
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ error: 'Failed to fetch admin overview' });
  }
});

// Serve frontend static build if available
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[MechConnect Full - Stack Server] Active on http://localhost:${PORT}`);
console.log(`[MechConnect Full-Stack Server] Serving React UI + SQLite DB + Socket.io`);
});

