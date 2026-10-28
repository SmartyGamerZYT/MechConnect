# MechConnect — Complete Product Requirements Document

Oct 28, 2026 · @Jayashree

## Executive Summary

MechConnect is a two-sided marketplace that connects industrial companies experiencing machine breakdowns with certified mechanics and field technicians — in minutes, not days.

When a critical machine fails on a factory floor, every hour of downtime translates directly into lost revenue, delayed shipments, and mounting operational pressure. The current process of calling manufacturers, searching for local contacts, or waiting days for a specialist is broken. MechConnect fixes this by giving companies a single platform to post a breakdown job — with machine type, photos, and urgency level — and instantly notifying nearby, skill-matched mechanics who can apply, negotiate, and get hired on the same day.

The model mirrors the on-demand hiring flow popularised by Urban Company, but is purpose-built for industrial machinery repair across sectors including manufacturing, logistics, food processing, energy, and construction.

**Platform at a Glance**

| Dimension | Detail |
| --- | --- |
| Model | Two-sided marketplace (B2B + Gig) |
| Primary sectors | Manufacturing, Logistics, Food Processing, Energy, Construction |
| Job types | Emergency (< 1 hr), Same Day, Scheduled |
| Core loop | Post job → Auto-match → Chat & Negotiate → Hire → Pay → Review |
| Revenue model | Commission per completed job + optional premium listings |
| Phase 1 target | Tier 1 and Tier 2 industrial cities |

## Problem Statement

When a critical machine breaks down at a factory or industrial facility, production halts within minutes. The current process — calling the manufacturer's service team, searching for a local technician, or waiting days for a specialist — is slow, expensive, and unreliable. Skilled mechanics exist in every region but are invisible to companies that need them urgently. There is no structured platform where industrial companies can discover vetted, skill-matched repair professionals and hire them on the same day.

**Key Pain Points**

| Pain Point | Impact |
| --- | --- |
| Average unplanned downtime per breakdown | 4–8 hours of halted production |
| No central mechanic directory | Companies rely on word-of-mouth, which doesn't scale |
| Manufacturer service teams are slow | Often days to schedule an on-site visit |
| Mechanics lack consistent job leads | Skilled technicians sit idle with no structured channel |
| No pricing or accountability framework | Disputes over price and quality with no recourse |
| Emergency hiring is chaotic | No SLA, no tracking, no proof of credentials in real time |

**The Opportunity**

India alone has over 250,000 registered manufacturing units and an estimated 2+ million skilled industrial technicians who work independently or in small teams. The gap between supply and demand is massive — the problem is visibility and trust, not the availability of skilled workers. MechConnect bridges this gap with a structured, transparent, on-demand platform.

## Target Users & Personas

**Persona 1 — The Operations Manager (Company Side)** Runs a mid-size manufacturing or logistics facility. When a machine goes down, they are responsible for getting it back up. They need someone fast, qualified, and trustworthy. They don't have time to browse portfolios — they need to post a job and see candidates immediately. Comfort with mobile and desktop. High urgency sensitivity.

**Persona 2 — The Freelance Mechanic / Field Technician** A skilled technician — CNC operator, hydraulics specialist, electrical panel expert, compressor mechanic — who works independently or takes side contracts. They want consistent job leads matching their skill set without relying on personal networks. They want to showcase past work and earn more by building a strong profile. Primarily mobile. Moderate urgency sensitivity.

**Persona 3 — The Small Repair Company / Team Lead** Runs a 2–10 person repair team. Posts team availability, takes on larger jobs, and assigns team members. Wants volume of jobs and the ability to build long-term contracts with companies. Comfortable on both mobile and desktop. Low-to-moderate urgency sensitivity.

| Attribute | Company (Poster) | Mechanic (Provider) | Repair Team |
| --- | --- | --- | --- |
| Primary need | Fast, qualified repair | Steady, skill-matched work | Volume jobs + team coordination |
| Urgency sensitivity | Very high | Moderate | Low–Moderate |
| Key trust signal | Ratings, certifications | Portfolio, past jobs | Team size, past contracts |
| Device preference | Desktop / Tablet | Mobile | Mobile + Desktop |
| Payment expectation | Pay after confirmed quality | Fast payout after job | Milestone-based payments |

## Core Features — Company Side

### 1. Company Profile

- Register with company name, industry type, location, and types of machines operated
- Verified company badge after document upload (GST / trade license)
- Multiple employee accounts under one company profile
- Trusted Mechanic List: save preferred mechanics for fast repeat-hire

### 2. Job Posting (Under 2 Minutes)

- Select machine type from a structured taxonomy (CNC, hydraulic press, compressor, electrical panel, conveyor belt, boiler, etc.)
- Add machine brand, model number, and fault description
- Attach photos or a short video of the issue
- Set urgency: **Emergency** (< 1 hr response SLA), **Same Day**, or **Scheduled**
- Pin the exact on-site location via map
- Optionally set a budget or leave open for mechanic proposals

### 3. Mechanic Discovery

- Browse mechanic profiles filtered by: machine type, distance, rating, availability status, and completed job count
- View full mechanic profile: skills, certifications, portfolio of past repairs, and reviews
- Save mechanics to a Trusted List for repeat hire
- View live map of nearby available mechanics (availability status only, not live GPS trail)

### 4. Auto-Matching

- System instantly notifies the top 5 skill-matched, nearby, available mechanics when a job is posted
- Emergency jobs restrict auto-match to mechanics rated 4.0+ and marked Available Now
- Direct Hire: company can skip matching and invite a trusted mechanic directly

### 5. Job Management Dashboard

- See all active, pending, and completed jobs in one view
- Real-time status: Mechanic Assigned → On the Way → Working → Completed
- Digital job card per completed job: what was repaired, parts used, time taken
- Download invoices and job reports as PDF

### 6. Ratings & Reviews

- Rate mechanic after job on: punctuality, quality of work, and communication
- Written review visible on mechanic's public profile
- Flag or dispute a job outcome through the in-app dispute flow

### 7. Emergency Mode

- One-tap Emergency Post that auto-notifies all available mechanics within 20 km matching the machine type
- SLA target: first mechanic response within 10 minutes

## Core Features — Mechanic / Technician Side

### 1. Professional Profile

- Name, photo, city/area, and years of experience
- Skill tags: machine types, brands, and repair categories they specialise in
- Certifications: upload ITI, diploma, or manufacturer training certificates
- Service radius: set the maximum distance they're willing to travel
- Portfolio: add past completed jobs with photos, machine type, description, and outcome

### 2. Availability Toggle

- Set status: **Available Now** / **Available from \[Time\]** / **Not Available**
- Set working hours and days in advance
- Go offline instantly during active jobs

### 3. Job Feed (List & Map View)

- See all nearby open jobs matching their registered skill set
- Filter by: distance, machine type, urgency level, and budget range
- Switch between list view and map view — jobs shown as colour-coded pins
- Tap a job pin to see full details and apply in one tap

### 4. Job Application & Proposal

- Apply to a job with an introductory message and a proposed price
- Counter-offer if the company sets a fixed budget
- Accept a company's direct hire invite
- View full job detail before applying: machine type, issue, photos, location, urgency

### 5. Earnings Dashboard

- Total earnings by week, month, and year
- Pending vs. released payments
- Commission deducted clearly shown per job
- Payout history with bank transfer status
- Export earnings report as PDF

### 6. Notifications

- Instant alert when a new job matching skills is posted nearby
- Alert when a company views the mechanic's profile
- Alert when a direct hire invite is received
- Job status updates and payment confirmations

### 7. Team Management (for Repair Team Leads)

- Create a team and invite team members
- Assign team members to specific jobs
- Team profile shown to companies for larger, multi-person jobs
- Track individual team member earnings and job history

## Map Feature

The map is a core discovery surface for mechanics — not just a location tag. It gives field technicians a spatial, at-a-glance view of all open jobs near them and lets them pick work the way a driver picks a ride.

### Mechanic Map View

- Full-screen map (Google Maps or Mapbox) centred on the mechanic's current GPS location
- Every open nearby job is pinned with a colour-coded urgency marker:
  - 🔴 **Red pin** — Emergency (< 1 hr SLA)
  - 🟠 **Orange pin** — Same Day
  - 🟢 **Green pin** — Scheduled
- Tap any pin to open a job card overlay: machine type, issue summary, budget range, distance, and an Apply button
- Filter pins by: machine type, max distance radius (5 / 10 / 20 / 50 km), urgency, and minimum budget
- Real-time refresh: new jobs appear as pins as they are posted; applied jobs turn grey
- Mechanic's own live location dot shown (requires location permission)

### Company Map View

- Companies confirm the exact on-site pin location when posting a job
- After posting, companies can optionally see a live view of mechanics who are nearby and marked Available (privacy: shows availability dot only, not live GPS trail)
- Mechanics en route to a confirmed job share live location with the company (opt-in, active during the job window only)

### Job Card Overlay (On Pin Tap)

| Field | Content |
| --- | --- |
| Machine type | e.g. Hydraulic Press – Parker brand |
| Urgency | Emergency / Same Day / Scheduled |
| Distance | 3.2 km away |
| Budget | ₹1,500–₹3,000 (or Open) |
| Posted | 4 minutes ago |
| Action | Apply Now / View Full Details |

### Technical Requirements

- Maps SDK: Google Maps Platform or Mapbox GL JS
- Location updates: WebSocket push for real-time pin refresh (< 5 second delay)
- Clustering: group dense job pins at lower zoom levels; expand on zoom in
- Offline fallback: last cached map tile shown with a connectivity warning banner
- Distance calculation: Haversine formula on the backend; displayed to users in km
- Dark tile set to match platform UI (`#121212` background)

## Chat & Negotiation

Every job has a dedicated chat thread between the company and the mechanic(s) who applied. Chat opens as soon as a mechanic applies and closes 24 hours after job completion.

### Chat Features

- Real-time messaging via WebSocket (Socket.io or Firebase Realtime Database)
- Share images and documents (machine manuals, schematics, warranties) directly in chat
- Read receipts and typing indicators
- Message timestamps
- Chat history persists and is downloadable as PDF for both parties
- Pinned Quote Card visible at the top of chat once a deal is agreed

### Negotiation Flow

1. Mechanic applies with a proposed price and an availability window
2. Company can **Accept**, **Counter-Offer**, or **Decline**
3. Counter-offer flow: company proposes a revised price → mechanic accepts or counter-proposes (max 3 rounds)
4. Once both parties agree: a **Quote Card** is auto-generated in chat — a locked summary of the agreed scope, price, and start time
5. Both parties tap **Confirm** on the Quote Card to officially lock the job
6. After confirmation, payment is pre-authorised (held, not charged yet) and released to the mechanic upon job completion

### Quote Card Contents

| Field | Detail |
| --- | --- |
| Job ID | Unique reference number |
| Agreed price | Final negotiated amount |
| Scope summary | As described by the company |
| Agreed start date/time | Confirmed window |
| Mechanic & company name | Both parties identified |
| Confirmation timestamps | Both confirmation times recorded |

## Smart Matching & Discovery

The platform must surface the right mechanic for each job without requiring the company to manually search. Matching runs automatically when a job is posted and powers the job feed shown to mechanics.

### Matching Algorithm Inputs

| Signal | Weight | Notes |
| --- | --- | --- |
| Machine type match | High | Exact skill tag must match |
| Distance from job site | High | Prefer mechanics within 20 km |
| Availability status | High | Only Available Now for Emergency jobs |
| Rating score | Medium | Minimum 4.0 required for Emergency jobs |
| Completed jobs count | Medium | More completed = higher placement |
| Response rate | Low | Mechanics who frequently don't respond rank lower |
| Repeat hire flag | High | Company's Trusted List mechanics shown first |

### Discovery Modes

- **Auto-match**: System selects top 5 mechanics and notifies them instantly when a job is posted
- **Browse**: Company manually browses and filters the mechanic directory
- **Direct Hire**: Company picks a mechanic from their Trusted List and sends a direct invite
- **Open Posting**: Job is public — any matching mechanic can apply (shown in their feed and on the map)

### Machine Type Taxonomy (Sample)

- CNC Machines (Lathe, Milling, Turning)
- Hydraulic Systems (Press, Cylinder, Pump)
- Pneumatic Systems
- Electrical Panels & PLCs (Siemens, Allen-Bradley, Fanuc)
- Compressors (Screw, Piston, Centrifugal)
- Conveyor & Material Handling
- Boilers & Heat Exchangers
- Industrial Generators
- Welding Equipment
- HVAC & Refrigeration (Industrial)
- Packaging Machinery
- Industrial Robots & Automation

### Mechanic Feed Ranking

Mechanics see jobs in their feed ranked by: proximity, urgency level, budget, and their match score. Mechanics who apply quickly and have high acceptance rates are rewarded with higher placement in future auto-matches.

## Payments & Commission Model

### Payment Flow

1. Company pre-authorises payment after confirming the Quote Card (amount held, not charged)
2. Mechanic completes the job and marks it as Done
3. Company confirms job completion or raises a dispute within 24 hours
4. If no dispute is raised, payment is automatically released to the mechanic
5. Platform deducts its commission before releasing the remainder to the mechanic
6. Auto-generated invoice sent to both parties via email and in-app

### Payment Types

- **Standard Payment**: Full amount released upon job completion
- **Milestone Payments**: For longer jobs, split into agreed checkpoints (e.g., 40% on start, 60% on completion)
- **Tip**: Optional tip feature for outstanding service

### Commission Structure

| Tier | Platform Commission | Notes |
| --- | --- | --- |
| Standard jobs | 12–15% | Default for all jobs |
| Emergency jobs | 10% | Reduced commission to encourage fast response |
| Premium mechanic (verified + 50+ jobs) | 10% | Loyalty reduction |
| Repair team (> 3 members) | 8% | Volume incentive |

### Payout

- Mechanics receive payment via bank transfer (NEFT/IMPS) within 24–48 hours after job completion
- Minimum payout threshold: ₹500
- Payout history and commission breakdown visible in the earnings dashboard

### In-App Wallet (Phase 2)

- Mechanics can hold earnings in a platform wallet
- Use wallet balance to purchase platform credits for profile boosts or premium listings

## Verification & Trust System

Trust is the platform's core differentiator. Both companies and mechanics go through structured verification before being allowed to transact.

### Mechanic Verification Tiers

| Badge | Requirements | Visibility |
| --- | --- | --- |
| Basic | Phone + Aadhaar verified | Profile active, can apply |
| Certified | Upload ITI / Diploma certificate | Certified badge on profile |
| Background Checked | 3rd-party BGC completed | BGC badge shown prominently |
| Skill Tested | Platform skill assessment passed | Score visible on profile |
| Top Mechanic | 4.5+ rating, 50+ jobs, BGC | Top Mechanic badge + priority ranking |

### Company Verification

- GST number verification or trade license upload
- Verified Company badge displayed on all job postings
- Unverified companies can post jobs but are ranked lower in mechanic feeds

### Review & Rating System

- Star rating (1–5) after every job: punctuality, work quality, and communication rated separately
- Written review visible on public profile
- Minimum 4.0 average required for Emergency job eligibility
- Mechanics can also rate companies (visible to other mechanics only)

### Dispute Resolution

- Company raises a dispute within 24 hours of job completion
- Both parties submit evidence (photos, chat transcript, job report)
- Admin mediates and resolves within 48 hours
- Repeated disputes flagged; fraudulent accounts banned

### Platform Safety Rules

- Mechanics cannot contact companies outside the platform for 6 months after a job
- All payments must go through the platform — off-platform transactions violate terms
- Background check badge required to take Emergency jobs above ₹10,000

## Notifications

### For Mechanics

- **New job alert**: Instant push notification when a job matching skills is posted nearby
- **Direct hire invite**: Alert when a company sends a personal invite
- **Profile view alert**: Notification when a company views their profile
- **Application status**: Alert when a company accepts, declines, or counter-offers
- **Job confirmed**: Alert when Quote Card is confirmed by both parties
- **Payment released**: Confirmation when payment is transferred
- **Review received**: Alert when a company leaves a rating

### For Companies

- **Mechanic applied**: Alert when a mechanic applies to a posted job
- **Job status updates**: Mechanic Assigned → On the Way → Working → Completed
- **Mechanic on the way**: Push + estimated arrival time
- **Counter-offer received**: Alert when a mechanic proposes a different price
- **Job completed**: Prompt to confirm completion and leave a review
- **Payment confirmation**: Receipt after payment is processed
- **Emergency response**: Notified when the first mechanic accepts an Emergency job

### Notification Channels

- Push notifications (mobile app)
- In-app notification centre
- SMS fallback for Emergency alerts (when app is not open)
- Email digest (daily summary of activity, optional)

### Notification Preferences

- Users can configure which alert types they receive and via which channels
- Mechanics can set quiet hours to suppress non-Emergency notifications
- Do Not Disturb mode available except for confirmed job status updates

## Admin Panel

The admin panel gives MechConnect's operations team full visibility and control over the platform.

### Mechanic Onboarding

- Review and approve/reject mechanic registrations with certificate review queue
- Trigger background check workflows
- View pending, approved, and banned mechanic accounts
- Manually upgrade mechanic tier badges

### Job Monitoring

- View all active jobs on a live map dashboard
- Filter by urgency, status, region, and machine type
- Intervene in stalled Emergency jobs (reassign or escalate)
- Access full chat transcript for any flagged job

### Dispute Management

- View all open disputes with evidence attached
- Mediate between company and mechanic
- Issue refunds or partial payments
- Mark resolution and notify both parties

### Revenue & Analytics

- Platform revenue by day, week, month (total, by region, by category)
- Commission earned per job type
- Active jobs count, completion rate, and average response time
- Top 10 mechanics by jobs completed and revenue generated
- Top 10 companies by jobs posted and spend
- Funnel analytics: job posted → mechanic applied → hired → completed → paid

### User Management

- Search any user (company or mechanic) by name, phone, city
- View full activity history per user
- Ban, suspend, or flag accounts for violations
- Send manual notifications or announcements to user segments

### Platform Configuration

- Update commission percentages by tier
- Configure Emergency SLA windows and geofences
- Manage machine type taxonomy (add/remove categories)
- Toggle platform features on/off (e.g., wallet, team management) by region

## Technical Architecture

### Frontend

- **Web App (Company)**: React.js — desktop and tablet primary, fully responsive
- **Mobile App (Mechanic)**: React Native — iOS and Android; primary interface for field technicians
- **Admin Panel**: React.js internal web dashboard

### Backend

- **API**: Node.js + Express.js (REST API) or NestJS for structured architecture
- **Realtime**: Socket.io for chat messaging, job status updates, and live map pin refresh
- **Authentication**: JWT with refresh tokens; phone OTP via Twilio/MSG91 for mechanic onboarding

### Database

- **Primary DB**: PostgreSQL — users, jobs, transactions, reviews, profiles
- **Caching**: Redis — session management, real-time availability status, job feed ranking
- **File Storage**: AWS S3 or Cloudflare R2 — profile photos, portfolio images, job photos, documents

### Maps & Location

- Google Maps Platform (Geocoding, Maps JS SDK, Distance Matrix) or Mapbox GL JS
- WebSocket push for real-time location and job pin updates (< 5s delay)
- Haversine formula on backend for distance calculations

### Payments

- **Payment Gateway**: Razorpay or Cashfree (India) for UPI, cards, net banking
- Payment hold and release flow via payment intent APIs
- Automated payouts to mechanic bank accounts via payout APIs

### Notifications

- **Push**: Firebase Cloud Messaging (FCM) for Android and iOS
- **SMS**: Twilio or MSG91 for Emergency alerts fallback
- **Email**: SendGrid or AWS SES for invoices and digests

### Infrastructure

- **Hosting**: AWS (EC2 + RDS + ElastiCache) or Render.com for rapid launch
- **CDN**: Cloudflare for static assets and global edge delivery
- **CI/CD**: GitHub Actions + Docker containers
- **Monitoring**: Sentry (error tracking), Datadog or New Relic (performance), Grafana (infra)

### Security

- HTTPS everywhere; TLS 1.3
- Data encrypted at rest (AES-256) and in transit
- PCI-DSS compliance delegated to Razorpay/Cashfree
- Rate limiting on all public APIs
- Role-based access control (RBAC) for admin vs. company vs. mechanic roles

### Scalability Targets (Phase 1)

| Metric | Target |
| --- | --- |
| Concurrent users | 5,000 |
| Jobs posted per day | 500 |
| Messages per second (chat) | 200 |
| Map pin refresh latency | < 5 seconds |
| API p95 response time | < 300ms |
