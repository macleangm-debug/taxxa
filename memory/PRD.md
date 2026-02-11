# Taxxa Enterprise Platform - PRD

## Original Problem Statement
Build a tax compliance lottery platform with presentation demo capabilities and configurable draw settings.

## Architecture
- **Frontend**: Expo/React Native Web (port 3000)
- **Backend**: FastAPI (port 8001)
- **Database**: MongoDB

## What's Been Implemented

### Landing Page (/landing)
- Interactive hero with animated counters
- Case studies from 6 countries (Tanzania, Kenya, Taiwan, Portugal, Brazil, Slovakia)
- Live scanner demo with African samples
- API Playground
- Contact form

### Presentation Demo (/presentation-demo)
- Country switcher: Tanzania 🇹🇿 & Kenya 🇰🇪
- **Citizen App Demo**: Phone mockup with local merchants & currency
- **Admin Dashboard**: Live stats, compliance gauge, prize pools
- **Side-by-Side View**: Citizen ↔ Authority real-time sync
- Prize configuration modal
- Fullscreen mode

### Draw Configuration (/draw-setup) - NEW
Complete lottery configuration system with 5 tabs:

**1. Basic Info**
- Draw name, type (weekly/monthly/quarterly/special)
- Country selection (Tanzania, Kenya, Uganda, Rwanda)
- Prize pool configuration (TZS/KES/UGX/RWF)

**2. Entry Calculation Methods**
- **Fixed Per Receipt**: Award fixed entries per scan
- **Amount-Based**: 1 entry per X amount spent + base entries
- **Tiered Brackets**: Configurable amount tiers with increasing entries
- **VAT-Based**: Entries based on VAT paid

**3. Bonus Multipliers**
- **First Scan of Day**: 1.5x - 3x multiplier
- **Weekend Bonus**: 1.25x - 2x for Sat/Sun
- **Streak Bonus**: Reward daily scanning (3-30 day streaks)
- **Merchant Category**: Different multipliers by category (Groceries, Electronics, Fuel, Healthcare, Education)

**4. Entry Caps**
- Per Receipt: Max 20 entries (configurable)
- Per Day: Max 50 entries (configurable)
- Per Week: Max 200 entries (configurable)

**5. Advanced Settings**
- Minimum receipt amount (TZS 1,000)
- Require verified merchant (EFD/ETR)
- Receipt validity period (24h - 7d)

**Preview & Test**
- Real-time entry calculation preview
- Shows breakdown: base entries, multiplier, bonuses applied
- Configuration summary

## Demo URLs
- Landing: https://taxxa-calc.preview.emergentagent.com/landing
- Presentation: https://taxxa-calc.preview.emergentagent.com/presentation-demo
- Draw Setup: https://taxxa-calc.preview.emergentagent.com/draw-setup

## Prioritized Backlog

### P0 - None remaining

### P1 - High
- Connect draw configuration to backend database
- Add user authentication for admin access
- Add more African countries

### P2 - Medium
- PDF export for configurations
- Scheduled draws with automated winner selection
- Real QR scanning integration
