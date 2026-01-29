import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const isWeb = Platform.OS === 'web';

export default function DocumentationPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [activeSection, setActiveSection] = useState('quickstart');
  const [contactForm, setContactForm] = useState({
    name: '',
    organization: '',
    email: '',
    country: '',
    message: '',
  });

  const sections = [
    { id: 'quickstart', title: 'Quick Start', icon: 'rocket' },
    { id: 'receipt-api', title: 'Receipt API', icon: 'qr-code' },
    { id: 'webhooks', title: 'Webhooks', icon: 'git-branch' },
    { id: 'authentication', title: 'Authentication', icon: 'lock-closed' },
    { id: 'integration', title: 'Integration', icon: 'git-network' },
  ];

  const documentation: Record<string, any> = {
    'quickstart': {
      title: 'Quick Start Guide',
      description: 'Get up and running with Taxxa in minutes. No merchant setup required.',
      content: [
        {
          title: 'How It Works',
          description: 'Taxxa reads QR codes from tax receipts and validates them directly against your Revenue Authority database. Citizens scan using our app or any web browser.',
          code: `// The QR code contains all transaction data:
{
  "receipt_id": "KRA-2024-ABC123",
  "merchant_tin": "123456789",
  "amount": 5000,
  "tax": 800,
  "timestamp": "2024-01-15T10:30:00Z"
}

// We validate against YOUR database
// No merchant integration needed`,
        },
        {
          title: 'Base URL',
          description: 'All API requests go to your jurisdiction-specific endpoint.',
          code: `https://api.taxxa.gov/{jurisdiction}

Examples:
  Kenya:    https://api.taxxa.gov/ke
  Tanzania: https://api.taxxa.gov/tz
  Rwanda:   https://api.taxxa.gov/rw`,
        },
        {
          title: 'Authentication',
          description: 'Include your API key in all requests.',
          code: `Authorization: Bearer txa_live_your_api_key

// Key prefixes:
// txa_live_ = Production
// txa_test_ = Sandbox`,
        },
      ],
    },
    'receipt-api': {
      title: 'Receipt API v1',
      description: 'Three-step flow: Decode → Validate → Submit. All data comes from the QR code.',
      content: [
        {
          title: 'POST /api/v1/receipts/decode',
          description: 'Extract transaction data from QR code. Works with app scan or web upload.',
          code: `curl -X POST https://api.taxxa.gov/ke/api/v1/receipts/decode \\
  -H "Authorization: Bearer {api_key}" \\
  -d '{
    "qr_data": "KRA-2024-001-ABC123...",
    "source": "mobile_app" // or "web_browser"
  }'

// Response:
{
  "success": true,
  "data": {
    "receipt_number": "KRA-2024-001-ABC123",
    "merchant_tin": "123456789",
    "amount": 5000,
    "tax_amount": 800,
    "currency": "KES"
  }
}`,
        },
        {
          title: 'POST /api/v1/receipts/validate',
          description: 'Validate against Revenue Authority database. Check for duplicates and fraud.',
          code: `curl -X POST https://api.taxxa.gov/ke/api/v1/receipts/validate \\
  -H "Authorization: Bearer {api_key}" \\
  -d '{
    "receipt_number": "KRA-2024-001-ABC123"
  }'

// Response:
{
  "success": true,
  "data": {
    "is_valid": true,
    "validation_code": "VAL-789XYZ",
    "status": "verified_with_revenue_authority"
  }
}`,
        },
        {
          title: 'POST /api/v1/receipts/submit',
          description: 'Submit validated receipt to earn draw entries.',
          code: `curl -X POST https://api.taxxa.gov/ke/api/v1/receipts/submit \\
  -H "Authorization: Bearer {api_key}" \\
  -d '{
    "validation_code": "VAL-789XYZ",
    "user_id": "user_123"
  }'

// Response:
{
  "success": true,
  "data": {
    "entries_awarded": 1,
    "total_entries": 15,
    "next_draw": "2024-01-21T15:00:00Z"
  }
}`,
        },
      ],
    },
    'webhooks': {
      title: 'Webhooks',
      description: 'Real-time notifications to your systems when events occur.',
      content: [
        {
          title: 'Available Events',
          description: 'Subscribe to specific events based on your needs.',
          code: `// Draw Events
draw.created       // New draw created
draw.completed     // Winners selected

// Receipt Events
receipt.scanned    // New scan received
receipt.validated  // Passed RA validation  
receipt.rejected   // Failed validation

// Winner Events
winner.selected    // Prize winner chosen
prize.disbursed    // Prize paid out

// System Events
fraud.detected     // Suspicious activity`,
        },
        {
          title: 'Register Webhook',
          description: 'Set up your endpoint to receive events.',
          code: `curl -X POST https://api.taxxa.gov/ke/api/webhooks/endpoints \\
  -H "Authorization: Bearer {api_key}" \\
  -d '{
    "url": "https://your-system.gov/webhook",
    "events": ["receipt.validated", "winner.selected"],
    "secret": "your_webhook_secret"
  }'`,
        },
        {
          title: 'Webhook Payload',
          description: 'All payloads include HMAC signature for verification.',
          code: `// Example payload:
{
  "event": "receipt.validated",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "receipt_id": "KRA-2024-001-ABC123",
    "user_id": "user_123",
    "amount": 5000,
    "validation_status": "verified"
  },
  "signature": "sha256=abc123..."
}`,
        },
      ],
    },
    'authentication': {
      title: 'Authentication',
      description: 'Secure your integration with proper authentication.',
      content: [
        {
          title: 'API Keys',
          description: 'For server-to-server communication.',
          code: `// Include in request header:
Authorization: Bearer txa_live_abc123def456

// API Key Scopes:
// - receipts:read   - View receipts
// - receipts:write  - Submit receipts
// - draws:read      - View draws
// - draws:admin     - Manage draws
// - webhooks:manage - Configure webhooks`,
        },
        {
          title: 'JWT Tokens (Citizens)',
          description: 'Mobile app and web scanner authentication.',
          code: `// Login
POST /api/auth/login
{
  "phone_number": "+254700000001",
  "password": "user_password"
}

// Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 604800  // 7 days
}`,
        },
        {
          title: 'Webhook Verification',
          description: 'Always verify webhook signatures.',
          code: `import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(
        f"sha256={expected}",
        signature
    )`,
        },
      ],
    },
    'integration': {
      title: 'Revenue Authority Integration',
      description: 'How Taxxa connects directly to your existing systems.',
      content: [
        {
          title: 'Architecture Overview',
          description: 'Direct database validation - no merchant involvement.',
          code: `┌─────────────────────────────────────────────┐
│                CITIZEN                       │
│         (App or Web Browser)                │
└───────────────────┬─────────────────────────┘
                    │ Scan QR
                    ▼
┌─────────────────────────────────────────────┐
│              TAXXA PLATFORM                 │
│  • QR Decode                                │
│  • Fraud Detection                          │
│  • Draw Management                          │
└───────────────────┬─────────────────────────┘
                    │ Validate
                    ▼
┌─────────────────────────────────────────────┐
│        REVENUE AUTHORITY DATABASE           │
│  • Receipt Verification                     │
│  • Merchant Records                         │
│  • Transaction History                      │
└─────────────────────────────────────────────┘`,
        },
        {
          title: 'Integration Options',
          description: 'Choose the method that fits your infrastructure.',
          code: `// Option 1: API Integration
// We call your API to validate receipts
{
  "type": "api",
  "endpoint": "https://your-ra.gov/api/validate",
  "auth": "bearer_token"
}

// Option 2: Database Read Replica
// Read-only access to your receipt database
{
  "type": "database",
  "connection": "readonly_replica",
  "tables": ["receipts", "merchants"]
}

// Option 3: Batch File Exchange
// Periodic file sync for high-security environments
{
  "type": "batch",
  "format": "csv",
  "frequency": "hourly"
}`,
        },
        {
          title: 'Data We Send You',
          description: 'Complete visibility into citizen scanning behavior.',
          code: `// Daily Analytics Report
{
  "date": "2024-01-15",
  "total_scans": 45000,
  "unique_users": 28000,
  "receipts_validated": 42000,
  "duplicates_blocked": 1200,
  "fraud_alerts": 15,
  "top_regions": [...],
  "hourly_distribution": [...]
}`,
        },
      ],
    },
  };

  const currentDoc = documentation[activeSection];

  const handleSubmitInquiry = () => {
    alert('Thank you for your inquiry. Our team will contact you within 24-48 hours.');
    setShowContactModal(false);
    setContactForm({ name: '', organization: '', email: '', country: '', message: '' });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Navigation */}
      <View style={styles.nav}>
        <View style={styles.navContent}>
          <TouchableOpacity style={styles.logo} onPress={() => router.push('/landing')}>
            <View style={styles.logoIcon}>
              <Ionicons name="receipt" size={24} color="#fff" />
            </View>
            <Text style={styles.logoText}>Taxxa</Text>
            {!isMobile && (
              <View style={styles.logoBadgeDocs}>
                <Text style={styles.logoBadgeDocsText}>Docs</Text>
              </View>
            )}
          </TouchableOpacity>
          
          {!isMobile ? (
            <View style={styles.navLinks}>
              <TouchableOpacity style={styles.navLink} onPress={() => router.push('/solution')}>
                <Text style={styles.navLinkText}>Solution</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navLink} onPress={() => router.push('/how-it-works')}>
                <Text style={styles.navLinkText}>How It Works</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navLink} onPress={() => router.push('/case-studies')}>
                <Text style={styles.navLinkText}>Pilot Programs</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.navLink, styles.navLinkActive]} onPress={() => router.push('/documentation')}>
                <Text style={[styles.navLinkText, styles.navLinkTextActive]}>Documentation</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButtonPrimary} onPress={() => setShowContactModal(true)}>
                <Text style={styles.navButtonPrimaryText}>Request Demo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.mobileMenuButton} onPress={() => setShowMobileMenu(!showMobileMenu)}>
              <Ionicons name={showMobileMenu ? "close" : "menu"} size={28} color="#1E293B" />
            </TouchableOpacity>
          )}
        </View>
        
        {isMobile && showMobileMenu && (
          <View style={styles.mobileMenuDropdown}>
            <TouchableOpacity style={styles.mobileMenuItem} onPress={() => { setShowMobileMenu(false); router.push('/solution'); }}>
              <Text style={styles.mobileMenuItemText}>Solution</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mobileMenuItem} onPress={() => { setShowMobileMenu(false); router.push('/how-it-works'); }}>
              <Text style={styles.mobileMenuItemText}>How It Works</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mobileMenuItem} onPress={() => { setShowMobileMenu(false); router.push('/case-studies'); }}>
              <Text style={styles.mobileMenuItemText}>Pilot Programs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.mobileMenuItem, styles.mobileMenuItemActive]} onPress={() => setShowMobileMenu(false)}>
              <Text style={[styles.mobileMenuItemText, styles.mobileMenuItemTextActive]}>Documentation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mobileMenuCTA} onPress={() => { setShowMobileMenu(false); setShowContactModal(true); }}>
              <Text style={styles.mobileMenuCTAText}>Request Demo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Hero Section */}
      <LinearGradient colors={['#0F172A', '#1E3A5F', '#0F172A']} style={[styles.hero, isMobile && styles.heroMobile]}>
        <View style={[styles.heroContent, isMobile && styles.heroContentMobile]}>
          <View style={styles.heroBadge}>
            <Ionicons name="code-slash" size={14} color="#60A5FA" />
            <Text style={styles.heroBadgeText}>Developer Documentation</Text>
          </View>
          <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
            Build With{'\n'}
            <Text style={styles.heroTitleHighlight}>Confidence</Text>
          </Text>
          <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>
            Everything you need to integrate Taxxa with your Revenue Authority systems. 
            Direct database connection. No merchant setup required.
          </Text>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={[styles.mainContent, isMobile && styles.mainContentMobile]}>
        {/* Sidebar */}
        <View style={[styles.sidebar, isMobile && styles.sidebarMobile]}>
          {sections.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={[styles.sidebarItem, activeSection === section.id && styles.sidebarItemActive]}
              onPress={() => setActiveSection(section.id)}
            >
              <Ionicons name={section.icon as any} size={18} color={activeSection === section.id ? '#3B82F6' : '#64748B'} />
              <Text style={[styles.sidebarItemText, activeSection === section.id && styles.sidebarItemTextActive]}>
                {section.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={[styles.contentArea, isMobile && styles.contentAreaMobile]}>
          <Text style={styles.docTitle}>{currentDoc.title}</Text>
          <Text style={styles.docDescription}>{currentDoc.description}</Text>

          {currentDoc.content.map((item: any, index: number) => (
            <View key={index} style={styles.codeBlock}>
              <View style={styles.codeHeader}>
                <Text style={styles.codeHeaderTitle}>{item.title}</Text>
              </View>
              <Text style={styles.codeDescription}>{item.description}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.codeContainer}>
                <Text style={styles.codeText}>{item.code}</Text>
              </ScrollView>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Links */}
      <View style={styles.quickLinksSection}>
        <Text style={styles.quickLinksTitle}>Quick Links</Text>
        <View style={[styles.quickLinksGrid, isMobile && styles.quickLinksGridMobile]}>
          {[
            { title: 'API Status', icon: 'pulse', description: 'System health', color: '#10B981' },
            { title: 'Postman', icon: 'download', description: 'API collection', color: '#F59E0B' },
            { title: 'SDKs', icon: 'code-slash', description: 'Client libraries', color: '#3B82F6' },
            { title: 'Support', icon: 'help-circle', description: 'Get help', color: '#8B5CF6' },
          ].map((link, index) => (
            <TouchableOpacity key={index} style={[styles.quickLinkCard, isMobile && styles.quickLinkCardMobile]}>
              <View style={[styles.quickLinkIcon, { backgroundColor: link.color + '15' }]}>
                <Ionicons name={link.icon as any} size={24} color={link.color} />
              </View>
              <View>
                <Text style={styles.quickLinkTitle}>{link.title}</Text>
                <Text style={styles.quickLinkDescription}>{link.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={[styles.footerContent, isMobile && styles.footerContentMobile]}>
          <View style={styles.footerLogo}>
            <View style={styles.logoIcon}>
              <Ionicons name="receipt" size={20} color="#fff" />
            </View>
            <Text style={styles.footerLogoText}>Taxxa</Text>
          </View>
          <Text style={styles.footerText}>© 2025 Taxxa. Transforming tax compliance worldwide.</Text>
        </View>
      </View>

      {/* Contact Modal */}
      <Modal visible={showContactModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isMobile && styles.modalContentMobile]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request a Demo</Text>
              <TouchableOpacity onPress={() => setShowContactModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput style={styles.input} placeholder="Your name" placeholderTextColor="#64748B" value={contactForm.name} onChangeText={(text) => setContactForm({...contactForm, name: text})} />
              <Text style={styles.inputLabel}>Organization *</Text>
              <TextInput style={styles.input} placeholder="Tax Authority / Ministry" placeholderTextColor="#64748B" value={contactForm.organization} onChangeText={(text) => setContactForm({...contactForm, organization: text})} />
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput style={styles.input} placeholder="your.email@gov.xx" placeholderTextColor="#64748B" keyboardType="email-address" value={contactForm.email} onChangeText={(text) => setContactForm({...contactForm, email: text})} />
              <Text style={styles.inputLabel}>Country *</Text>
              <TextInput style={styles.input} placeholder="Your country" placeholderTextColor="#64748B" value={contactForm.country} onChangeText={(text) => setContactForm({...contactForm, country: text})} />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowContactModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSubmitInquiry}>
                <Text style={styles.modalSubmitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  // Navigation
  nav: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 16, paddingHorizontal: 24, position: isWeb ? 'sticky' as any : 'relative', top: 0, zIndex: 100 },
  navContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, alignSelf: 'center', width: '100%' },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 22, fontWeight: '700', color: '#1E293B' },
  logoBadgeDocs: { backgroundColor: '#1E293B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  logoBadgeDocsText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  navLinks: { flexDirection: 'row', alignItems: 'center', gap: 32 },
  navLink: { paddingVertical: 8 },
  navLinkActive: { borderBottomWidth: 2, borderBottomColor: '#3B82F6' },
  navLinkText: { fontSize: 15, color: '#64748B', fontWeight: '500' },
  navLinkTextActive: { color: '#3B82F6' },
  navButtonPrimary: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, backgroundColor: '#3B82F6' },
  navButtonPrimaryText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  mobileMenuButton: { padding: 8 },
  mobileMenuDropdown: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingVertical: 8, marginTop: 12 },
  mobileMenuItem: { paddingVertical: 14, paddingHorizontal: 16 },
  mobileMenuItemActive: { backgroundColor: '#EFF6FF' },
  mobileMenuItemText: { fontSize: 16, color: '#374151', fontWeight: '500' },
  mobileMenuItemTextActive: { color: '#3B82F6' },
  mobileMenuCTA: { backgroundColor: '#3B82F6', marginHorizontal: 16, marginTop: 8, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  mobileMenuCTAText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  // Hero
  hero: { paddingVertical: 60, paddingHorizontal: 24 },
  heroMobile: { paddingVertical: 40 },
  heroContent: { maxWidth: 800, alignSelf: 'center' },
  heroContentMobile: { alignItems: 'center' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 24 },
  heroBadgeText: { color: '#60A5FA', fontSize: 14, fontWeight: '600' },
  heroTitle: { fontSize: 48, fontWeight: '800', color: '#fff', marginBottom: 16, lineHeight: 56 },
  heroTitleMobile: { fontSize: 32, lineHeight: 40, textAlign: 'center' },
  heroTitleHighlight: { color: '#60A5FA' },
  heroSubtitle: { fontSize: 18, color: '#94A3B8', lineHeight: 28 },
  heroSubtitleMobile: { fontSize: 16, textAlign: 'center', lineHeight: 26 },
  // Main Content
  mainContent: { flexDirection: 'row', padding: 24, gap: 24, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  mainContentMobile: { flexDirection: 'column' },
  // Sidebar
  sidebar: { width: 220, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignSelf: 'flex-start' },
  sidebarMobile: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 8, marginBottom: 4 },
  sidebarItemActive: { backgroundColor: '#EFF6FF' },
  sidebarItemText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  sidebarItemTextActive: { color: '#3B82F6', fontWeight: '600' },
  // Content Area
  contentArea: { flex: 1 },
  contentAreaMobile: { width: '100%' },
  docTitle: { fontSize: 32, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  docDescription: { fontSize: 16, color: '#64748B', marginBottom: 32, lineHeight: 26 },
  // Code Block
  codeBlock: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  codeHeader: { backgroundColor: '#F8FAFC', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  codeHeaderTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  codeDescription: { fontSize: 14, color: '#64748B', padding: 16, paddingBottom: 8 },
  codeContainer: { backgroundColor: '#1E293B', padding: 16 },
  codeText: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13, color: '#E2E8F0', lineHeight: 22 },
  // Quick Links
  quickLinksSection: { padding: 40, backgroundColor: '#fff' },
  quickLinksTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B', textAlign: 'center', marginBottom: 24 },
  quickLinksGrid: { flexDirection: 'row', justifyContent: 'center', gap: 16, maxWidth: 800, alignSelf: 'center' },
  quickLinksGridMobile: { flexDirection: 'column' },
  quickLinkCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 20, flex: 1 },
  quickLinkCardMobile: { flex: 0 },
  quickLinkIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLinkTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  quickLinkDescription: { fontSize: 13, color: '#64748B' },
  // Footer
  footer: { backgroundColor: '#0F172A', paddingVertical: 32, paddingHorizontal: 24 },
  footerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, alignSelf: 'center', width: '100%' },
  footerContentMobile: { flexDirection: 'column', gap: 16 },
  footerLogo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerLogoText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  footerText: { color: '#64748B', fontSize: 14 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90%' },
  modalContentMobile: { maxWidth: '100%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  modalBody: { padding: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 14, fontSize: 16, color: '#1E293B' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  modalCancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  modalSubmitBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, backgroundColor: '#3B82F6' },
  modalSubmitText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
