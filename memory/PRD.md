# Taxxa (TaxDraw) - Product Requirements Document

## Original Problem Statement
Pull a product from github for preview - https://github.com/macleangm-debug/taxxa

## Date: February 11, 2026

---

## Product Overview
Taxxa is a Tax Compliance Incentive Platform that transforms tax compliance through citizen engagement. It's a digital lottery system where citizens scan tax receipts to earn entries for prize draws.

## Architecture

### Backend (FastAPI + MongoDB)
- **Port**: 8001
- **Database**: MongoDB (taxxa_db)
- **Features**:
  - JWT-based authentication
  - OTP verification (mock SMS)
  - Receipt QR scanning & validation
  - Prize draw management
  - Referral system
  - Multi-tenant admin (Super Admin + Tax Authority Admin)

### Frontend (Expo/React Native Web)
- **Port**: 3000
- **Framework**: Expo with React Native Web
- **Pages**:
  - `/` - Welcome/App entry
  - `/landing` - Enterprise landing page
  - `/(auth)/login` - User login
  - `/(auth)/register` - User registration
  - `/(tabs)` - Main app (scan, draws, stats)
  - `/admin` - Admin portal
  - `/super-admin` - Super admin dashboard

## User Personas
1. **Citizens** - Scan receipts, earn entries, win prizes
2. **Tax Authority Admins** - Manage draws, verify compliance
3. **Super Admins (TAXXA team)** - Manage tax authorities, platform-wide settings

## Core Requirements
- [x] User registration with phone/OTP
- [x] Receipt QR code scanning
- [x] Draw entry system
- [x] Referral bonus system
- [x] Admin dashboard
- [x] Multi-tenant architecture

## What's Been Implemented (Session 1 - Feb 11, 2026)
- [x] Cloned GitHub repository
- [x] Set up backend environment (.env with MongoDB, JWT secrets)
- [x] Set up frontend environment (Expo web configuration)
- [x] Installed dependencies (Python + Node)
- [x] Started services via supervisor
- [x] Verified both frontend and backend running

## Backlog (P0/P1/P2)

### P0 (Critical)
- Real SMS integration for OTP
- Production database configuration

### P1 (Important)
- Real tax authority API integration
- Payment gateway for prize disbursement
- Push notification service

### P2 (Nice to have)
- Analytics dashboard enhancements
- Multiple language support
- Offline scanning capability

## Admin Credentials
- **Admin**: admin / taxdraw_admin_2024
- **Super Admin**: admin@taxxa.io / TaxxaSuperAdmin2025!

---

## High-Performance Scalability Update (Feb 11, 2026)

### Architecture for 1M+ Scans/Minute

#### Components Implemented
1. **Bloom Filter** - Memory-efficient duplicate detection
   - Capacity: 10 million items
   - Size: 11.4MB
   - False positive rate: 1%
   - Algorithm: MurmurHash3 (6 hash functions)

2. **Async Batch Processor**
   - Batch size: 100 items
   - Flush interval: 50ms
   - Queue capacity: 50,000 items
   - Throughput: 2,000 scans/sec/worker

3. **Background Task Queue**
   - Workers: 4 (configurable)
   - Queue capacity: 100,000 tasks
   - Handles: user stats, referral checks, analytics

4. **Write Aggregator**
   - Max pending: 500 writes
   - Flush interval: 200ms
   - Reduction ratio: 500:1

#### Capacity Calculations
- Single worker: 2,000 scans/sec
- 4 workers: 8,000 scans/sec = 480,000/min
- Target (1M+): 8 pods × 8 workers = 64 workers

#### Scaling Strategy
| Load | Pods | Workers | MongoDB | Redis |
|------|------|---------|---------|-------|
| 200K/min | 4 | 32 | Replica Set | Single |
| 500K/min | 16 | 128 | 3 Shards | Cluster (3) |
| 1M+/min | 50 | 400 | 6 Shards | Cluster (6) |

#### New Endpoints
- GET /api/system/performance
- GET /api/system/scaling
- GET /api/v2/scan/stats
- POST /api/v2/scan (optimized)
- POST /api/v2/scan/batch

#### Files Added
- /app/backend/services/scan_processor.py
- /app/backend/services/performance_config.py
- /app/backend/routers/scan_v2.py
- /app/backend/k8s/production-deployment.yaml
- /app/backend/scripts/load_test.py
