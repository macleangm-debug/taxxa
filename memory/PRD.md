# Taxxa Enterprise Platform - PRD

## Original Problem Statement
Pull and preview the Taxxa repository from GitHub, then implement an interactive landing page with presentation mode for Tax Authority demos.

## User Updates
1. Correct "15+ countries" stat to accurate "10+ countries"
2. Add Case Studies section with real country examples
3. Add live receipt scanner demo for visitors
4. Add African countries (Tanzania, Kenya) for demos
5. Create full-screen presentation mode
6. Add configurable prize amounts in local currencies (TZS, KES)
7. Add admin dashboard preview with compliance rates
8. Add side-by-side citizen ↔ authority view

## Architecture
- **Frontend**: Expo/React Native Web (port 3000)
- **Backend**: FastAPI (port 8001)
- **Database**: MongoDB

## Core Requirements (Static)
- Enterprise landing page for tax authorities
- Interactive API playground
- Receipt scanner demo
- Case studies with real results
- Contact form for demo requests
- Presentation mode for live demos

## What's Been Implemented

### 2026-02-11 - Session 1
- ✅ Pulled Taxxa repo from GitHub
- ✅ Configured Expo to run on port 3000
- ✅ Created interactive landing page

### 2026-02-11 - Session 2
- ✅ Updated stats to "10+ countries" (accurate)
- ✅ Added 6 real case studies (Taiwan, Portugal, Slovakia, Brazil, Italy, Panama)
- ✅ Added live receipt scanner demo with African samples

### 2026-02-11 - Session 3
- ✅ **Presentation Demo Mode** at /presentation-demo
  - Tanzania (TZS) with TRA integration
  - Kenya (KES) with KRA integration
  - Country switcher in header
  - Prize configuration modal
  - Fullscreen toggle button
  
- ✅ **Citizen App Demo**
  - Phone mockup with local merchants
  - Scanning animation flow
  - Verification with tax authority
  - Lottery entries earned display
  
- ✅ **Admin Dashboard Demo**
  - Live data indicators
  - Scans today counter
  - VAT revenue display
  - Compliance gauge with target
  - Prize pool overview
  - Live transaction feed
  
- ✅ **Side-by-Side View**
  - Citizen mobile app on left
  - Tax authority dashboard on right
  - Real-time transaction sync
  - Shows both perspectives simultaneously

## Prioritized Backlog

### P0 (Critical)
- None remaining

### P1 (High)
- Add more African countries (Uganda, Rwanda, Ghana, Nigeria)
- Connect to real backend APIs

### P2 (Medium)
- Add actual camera-based QR scanning
- Add PDF report generation for demos
- Add email functionality for contact form

## Demo URLs
- Landing Page: /landing
- Presentation Mode: /presentation-demo

## How to Demo
1. Go to /presentation-demo
2. Select country (Tanzania or Kenya)
3. Choose demo view:
   - **Citizen App Demo**: Show mobile scanning experience
   - **Admin Dashboard**: Show authority analytics
   - **Side-by-Side**: Show both simultaneously
4. Use "Prizes" button to configure prize pools
5. Use fullscreen button for clean presentation
