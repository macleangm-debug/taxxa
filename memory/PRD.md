# TAXXA - Tax Compliance Incentive Platform

## Original Problem Statement
Build a web version of TAXXA - a Tax Compliance Incentive Platform (lottery system) that incentivizes citizens to request receipts by scanning QR codes to enter prize draws.

## Features Implemented

### Core Features
1. **Analytics Dashboard** - User activity charts, scan trends, win probability
2. **Gamification System**
   - Streaks with multipliers (3-day: 1.1x, 7-day: 1.2x)
   - Badge system (11 badges: First Scan, Streak milestones, Referral badges)
   - Leaderboard rankings
3. **Social Features** - Share on Twitter, Facebook, WhatsApp
4. **Multi-language Support** - Full i18n framework (English, Swahili, French)
5. **Advanced Prize System** - Weekly draws with tiered prizes, entry multipliers

### User Flows
- Landing page with value proposition
- Registration with phone OTP verification
- Login with JWT authentication
- Dashboard with stats, streak, upcoming draws
- Receipt scanner (test mode with QR generation)
- Draws page with active/upcoming/completed tabs
- Leaderboard with rankings
- Referral system with shareable codes
- Profile with badges, history, settings

## Architecture

### Tech Stack
- **Frontend**: React 18, Tailwind CSS, i18next, Recharts
- **Backend**: FastAPI, Motor (MongoDB async driver)
- **Database**: MongoDB
- **Auth**: JWT with bcrypt password hashing

### API Endpoints
- Auth: /api/auth/register, /api/auth/verify-otp, /api/auth/create-password, /api/auth/login
- Scan: /api/scan, /api/scan/history
- Draws: /api/draws, /api/draws/active
- User: /api/user/stats, /api/user/profile
- Gamification: /api/badges, /api/streaks, /api/leaderboard
- Referral: /api/referral/stats, /api/referral/list
- Social: /api/social/share-token, /api/challenges
- Analytics: /api/analytics/overview

## What's Been Implemented (Jan 2026)
- [x] Full React web application with responsive design
- [x] Phone OTP registration flow
- [x] JWT authentication
- [x] Receipt scanning with mock revenue authority
- [x] Streak system with multipliers (1.1x-1.2x)
- [x] Badge awarding system
- [x] Leaderboard
- [x] Referral system
- [x] i18n framework (EN/SW/FR)
- [x] Social sharing (Twitter/Facebook/WhatsApp)
- [x] Analytics dashboard with charts

## Backlog

### P0 (Critical)
- [ ] Payment integration for prize disbursement (M-Pesa, etc.)

### P1 (High Priority)
- [ ] Real QR code camera scanning (currently test mode only)
- [ ] Push notifications for draw reminders
- [ ] Admin dashboard for tax authority
- [ ] Real Revenue Authority API integration

### P2 (Medium Priority)
- [ ] Instant win scratch cards
- [ ] Challenge friends feature
- [ ] More badge types
- [ ] SMS notifications

### P3 (Low Priority)
- [ ] Dark mode theme
- [ ] PWA offline support
- [ ] Export scan history

## User Personas
1. **Primary**: Citizens (18-55) who shop regularly and want to win prizes
2. **Secondary**: Tax Authority administrators managing draws
3. **Tertiary**: Merchants seeing their receipt stats

## Next Tasks
1. Set up payment integration (M-Pesa) for prize disbursement
2. Implement real QR camera scanning
3. Add admin dashboard
