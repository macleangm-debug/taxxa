import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function DocumentationPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: 'rocket' },
    { id: 'receipt-api', title: 'Receipt API', icon: 'qr-code' },
    { id: 'webhooks', title: 'Webhooks', icon: 'git-branch' },
    { id: 'authentication', title: 'Authentication', icon: 'lock-closed' },
    { id: 'admin-api', title: 'Admin API', icon: 'settings' },
  ];

  const apiEndpoints = {
    'getting-started': {
      title: 'Getting Started',
      description: 'Welcome to the Taxxa API documentation. This guide will help you integrate with our platform.',
      content: [
        {
          title: 'Base URL',
          code: 'https://api.taxxa.gov/{jurisdiction}',
          description: 'All API requests are made to jurisdiction-specific endpoints.',
        },
        {
          title: 'Authentication',
          code: 'Authorization: Bearer {your_api_key}',
          description: 'Include your API key in the Authorization header for all requests.',
        },
        {
          title: 'Response Format',
          code: JSON.stringify({ success: true, data: {}, message: 'string' }, null, 2),
          description: 'All responses follow a consistent JSON structure.',
        },
      ],
    },
    'receipt-api': {
      title: 'Receipt API v1',
      description: 'The Receipt API provides a 3-step flow for processing tax receipts: Decode → Validate → Submit.',
      content: [
        {
          title: 'POST /api/v1/receipts/decode',
          code: `curl -X POST https://api.taxxa.gov/ke/api/v1/receipts/decode \\
  -H "Authorization: Bearer {api_key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "qr_data": "KRA-2024-001-ABC123...",
    "scan_location": {
      "latitude": -1.2921,
      "longitude": 36.8219
    }
  }'`,
          description: 'Decode raw QR code data into structured receipt information.',
          response: JSON.stringify({
            success: true,
            data: {
              receipt_number: 'KRA-2024-001-ABC123',
              merchant: { name: 'Sample Store', tin: '123456789' },
              amount: 5000,
              currency: 'KES',
              tax_amount: 800,
              timestamp: '2024-01-15T10:30:00Z'
            }
          }, null, 2),
        },
        {
          title: 'POST /api/v1/receipts/validate',
          code: `curl -X POST https://api.taxxa.gov/ke/api/v1/receipts/validate \\
  -H "Authorization: Bearer {api_key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "receipt_number": "KRA-2024-001-ABC123",
    "user_id": "user_123"
  }'`,
          description: 'Validate receipt against tax authority database and check for duplicates.',
          response: JSON.stringify({
            success: true,
            data: {
              is_valid: true,
              validation_code: 'VAL-789XYZ',
              entries_earned: 1,
              bonus_entries: 0
            }
          }, null, 2),
        },
        {
          title: 'POST /api/v1/receipts/submit',
          code: `curl -X POST https://api.taxxa.gov/ke/api/v1/receipts/submit \\
  -H "Authorization: Bearer {api_key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "validation_code": "VAL-789XYZ",
    "user_id": "user_123"
  }'`,
          description: 'Submit validated receipt to earn draw entries.',
          response: JSON.stringify({
            success: true,
            data: {
              scan_id: 'scan_456',
              entries_awarded: 1,
              total_entries: 15,
              active_draws: [{ id: 'draw_001', name: 'Weekly Draw', closes_at: '2024-01-21' }]
            }
          }, null, 2),
        },
      ],
    },
    'webhooks': {
      title: 'Webhooks',
      description: 'Subscribe to real-time events from the Taxxa platform.',
      content: [
        {
          title: 'Available Events',
          code: `// Draw Events
draw.created      // New draw created
draw.started      // Draw entry period begins
draw.completed    // Draw completed, winners selected

// Winner Events  
winner.selected   // Winner selected (per winner)
prize.claimed     // Winner claims prize
prize.disbursed   // Prize payment completed

// Receipt Events
receipt.scanned   // Receipt scanned by user
receipt.validated // Receipt passes validation
receipt.rejected  // Receipt fails validation

// System Events
system.fraud_alert  // Potential fraud detected`,
          description: 'Subscribe to specific events based on your integration needs.',
        },
        {
          title: 'POST /api/webhooks/endpoints',
          code: `curl -X POST https://api.taxxa.gov/ke/api/webhooks/endpoints \\
  -H "Authorization: Bearer {api_key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-server.com/webhook",
    "events": ["draw.completed", "winner.selected"],
    "secret": "your_webhook_secret"
  }'`,
          description: 'Register a new webhook endpoint.',
        },
        {
          title: 'Webhook Payload',
          code: JSON.stringify({
            event: 'winner.selected',
            timestamp: '2024-01-21T15:00:00Z',
            data: {
              draw_id: 'draw_001',
              winner_id: 'user_789',
              prize_tier: 1,
              prize_value: 100000
            },
            signature: 'sha256=abc123...'
          }, null, 2),
          description: 'All webhook payloads include an HMAC signature for verification.',
        },
      ],
    },
    'authentication': {
      title: 'Authentication',
      description: 'Secure your API integrations with proper authentication.',
      content: [
        {
          title: 'API Key Authentication',
          code: `# Include in request header
Authorization: Bearer txa_live_abc123def456

# API keys have prefixes:
# txa_live_  - Production keys
# txa_test_  - Sandbox/testing keys`,
          description: 'Use API keys for server-to-server communication.',
        },
        {
          title: 'JWT Token (Mobile App)',
          code: `POST /api/auth/login
{
  "phone_number": "+254700000001",
  "password": "user_password"
}

// Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 604800
}`,
          description: 'Mobile app users authenticate with JWT tokens.',
        },
        {
          title: 'Webhook Signature Verification',
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
          description: 'Always verify webhook signatures to ensure authenticity.',
        },
      ],
    },
    'admin-api': {
      title: 'Admin API',
      description: 'Endpoints for tax authority administrators.',
      content: [
        {
          title: 'GET /api/admin/dashboard',
          code: `curl -X GET https://api.taxxa.gov/ke/api/admin/dashboard \\
  -H "Authorization: Bearer {admin_api_key}"`,
          description: 'Get real-time dashboard statistics.',
          response: JSON.stringify({
            total_users: 1200000,
            total_scans: 15000000,
            active_draws: 3,
            compliance_rate: 0.94
          }, null, 2),
        },
        {
          title: 'POST /api/admin/draws',
          code: `curl -X POST https://api.taxxa.gov/ke/api/admin/draws \\
  -H "Authorization: Bearer {admin_api_key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Weekly Draw #52",
    "draw_type": "weekly",
    "prize_pool": [
      {"tier": 1, "amount": 1000000, "winners": 1},
      {"tier": 2, "amount": 100000, "winners": 10}
    ],
    "start_date": "2024-01-15",
    "end_date": "2024-01-21"
  }'`,
          description: 'Create a new prize draw.',
        },
        {
          title: 'POST /api/admin/draws/{id}/execute',
          code: `curl -X POST https://api.taxxa.gov/ke/api/admin/draws/draw_001/execute \\
  -H "Authorization: Bearer {admin_api_key}"`,
          description: 'Execute a draw and select winners. Returns cryptographic proof.',
          response: JSON.stringify({
            draw_id: 'draw_001',
            winners: [{ tier: 1, user_id: 'user_789', entry_id: 'entry_456' }],
            audit_hash: 'sha256:abc123...',
            random_seed: '0x7f3a...',
            verifiable: true
          }, null, 2),
        },
      ],
    },
  };

  const currentSection = apiEndpoints[activeSection as keyof typeof apiEndpoints];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/landing')}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/landing')}>
          <View style={styles.logoContainer}>
            <Ionicons name="receipt" size={28} color="#4F46E5" />
            <Text style={styles.logoText}>Taxxa</Text>
            <Text style={styles.logoSubtext}>Docs</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.hero}>
        <View style={[styles.heroContent, isMobile && styles.heroContentMobile]}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>API DOCUMENTATION</Text>
          </View>
          <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
            Developer{"\n"}
            <Text style={styles.heroTitleAccent}>Documentation</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Everything you need to integrate with the Taxxa platform.
          </Text>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={[styles.mainContent, isMobile && styles.mainContentMobile]}>
        {/* Sidebar */}
        <View style={[styles.sidebar, isMobile && styles.sidebarMobile]}>
          <Text style={styles.sidebarTitle}>Documentation</Text>
          {sections.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={[
                styles.sidebarItem,
                activeSection === section.id && styles.sidebarItemActive,
              ]}
              onPress={() => setActiveSection(section.id)}
            >
              <Ionicons
                name={section.icon as any}
                size={18}
                color={activeSection === section.id ? '#4F46E5' : '#64748B'}
              />
              <Text
                style={[
                  styles.sidebarItemText,
                  activeSection === section.id && styles.sidebarItemTextActive,
                ]}
              >
                {section.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content Area */}
        <View style={[styles.contentArea, isMobile && styles.contentAreaMobile]}>
          <Text style={styles.contentTitle}>{currentSection.title}</Text>
          <Text style={styles.contentDescription}>{currentSection.description}</Text>

          {currentSection.content.map((item, index) => (
            <View key={index} style={styles.codeBlock}>
              <View style={styles.codeHeader}>
                <Text style={styles.codeTitle}>{item.title}</Text>
              </View>
              <Text style={styles.codeDescription}>{item.description}</Text>
              <View style={styles.codeContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text style={styles.code}>{item.code}</Text>
                </ScrollView>
              </View>
              {(item as any).response && (
                <View style={styles.responseContainer}>
                  <Text style={styles.responseLabel}>Response:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Text style={styles.code}>{(item as any).response}</Text>
                  </ScrollView>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Quick Links */}
      <View style={styles.quickLinksSection}>
        <Text style={styles.quickLinksTitle}>Quick Links</Text>
        <View style={[styles.quickLinksGrid, isMobile && styles.quickLinksGridMobile]}>
          {[
            { title: 'API Status', icon: 'pulse', description: 'Check system status', color: '#10B981' },
            { title: 'Postman Collection', icon: 'download', description: 'Download API collection', color: '#F59E0B' },
            { title: 'SDKs', icon: 'code-slash', description: 'Official client libraries', color: '#4F46E5' },
            { title: 'Support', icon: 'help-circle', description: 'Get technical help', color: '#EC4899' },
          ].map((link, index) => (
            <TouchableOpacity key={index} style={[styles.quickLinkCard, isMobile && styles.quickLinkCardMobile]}>
              <View style={[styles.quickLinkIcon, { backgroundColor: link.color + '20' }]}>
                <Ionicons name={link.icon as any} size={24} color={link.color} />
              </View>
              <Text style={styles.quickLinkTitle}>{link.title}</Text>
              <Text style={styles.quickLinkDescription}>{link.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Taxxa. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1E293B',
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  logoSubtext: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
  },
  hero: {
    padding: 40,
    paddingTop: 40,
    paddingBottom: 40,
  },
  heroContent: {
    maxWidth: 800,
    alignSelf: 'center',
  },
  heroContentMobile: {
    paddingHorizontal: 0,
  },
  badge: {
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  badgeText: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    lineHeight: 44,
  },
  heroTitleMobile: {
    fontSize: 28,
    lineHeight: 36,
  },
  heroTitleAccent: {
    color: '#A5B4FC',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    lineHeight: 24,
  },
  mainContent: {
    flexDirection: 'row',
    padding: 24,
    gap: 24,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  mainContentMobile: {
    flexDirection: 'column',
  },
  sidebar: {
    width: 240,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    height: 'auto',
    alignSelf: 'flex-start',
  },
  sidebarMobile: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sidebarTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  sidebarItemActive: {
    backgroundColor: '#EEF2FF',
  },
  sidebarItemText: {
    fontSize: 14,
    color: '#64748B',
  },
  sidebarItemTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
  },
  contentAreaMobile: {
    width: '100%',
  },
  contentTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  contentDescription: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 24,
  },
  codeBlock: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  codeHeader: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  codeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'monospace',
  },
  codeDescription: {
    fontSize: 14,
    color: '#64748B',
    padding: 16,
    paddingBottom: 8,
  },
  codeContainer: {
    backgroundColor: '#1E293B',
    padding: 16,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 20,
  },
  responseContainer: {
    backgroundColor: '#0F172A',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  responseLabel: {
    fontSize: 12,
    color: '#10B981',
    marginBottom: 8,
    fontWeight: '600',
  },
  quickLinksSection: {
    padding: 40,
    backgroundColor: '#F1F5F9',
  },
  quickLinksTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 24,
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    maxWidth: 800,
    alignSelf: 'center',
  },
  quickLinksGridMobile: {
    flexDirection: 'column',
  },
  quickLinkCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '22%',
    minWidth: 160,
    alignItems: 'center',
  },
  quickLinkCardMobile: {
    width: '100%',
    flexDirection: 'row',
    gap: 16,
  },
  quickLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickLinkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  quickLinkDescription: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    backgroundColor: '#0F172A',
    alignItems: 'center',
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
});
