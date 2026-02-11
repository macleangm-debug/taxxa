import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const isWeb = Platform.OS === 'web';

// Code Block Component
const CodeBlock = ({ code, language = 'javascript', title }: { code: string; language?: string; title?: string }) => {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = async () => {
    if (isWeb) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <View style={styles.codeBlockContainer}>
      {title && (
        <View style={styles.codeBlockHeader}>
          <Text style={styles.codeBlockTitle}>{title}</Text>
          <Pressable style={styles.copyButton} onPress={copyToClipboard}>
            <Ionicons name={copied ? "checkmark" : "copy-outline"} size={16} color={copied ? "#10B981" : "#94A3B8"} />
            <Text style={[styles.copyText, copied && { color: '#10B981' }]}>
              {copied ? 'Copied!' : 'Copy'}
            </Text>
          </Pressable>
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text style={styles.codeBlock}>{code}</Text>
      </ScrollView>
    </View>
  );
};

// Endpoint Card Component
const EndpointCard = ({ method, path, description, params, response }: any) => {
  const [expanded, setExpanded] = useState(false);
  
  const methodColors: Record<string, string> = {
    GET: '#10B981',
    POST: '#3B82F6',
    PUT: '#F59E0B',
    DELETE: '#EF4444',
    PATCH: '#8B5CF6',
  };

  return (
    <View style={styles.endpointCard}>
      <Pressable style={styles.endpointHeader} onPress={() => setExpanded(!expanded)}>
        <View style={styles.endpointMethod}>
          <View style={[styles.methodBadge, { backgroundColor: methodColors[method] }]}>
            <Text style={styles.methodText}>{method}</Text>
          </View>
          <Text style={styles.endpointPath}>{path}</Text>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
      </Pressable>
      <Text style={styles.endpointDesc}>{description}</Text>
      
      {expanded && (
        <View style={styles.endpointDetails}>
          {params && params.length > 0 && (
            <View style={styles.paramsSection}>
              <Text style={styles.paramsSectionTitle}>Parameters</Text>
              {params.map((param: any, idx: number) => (
                <View key={idx} style={styles.paramRow}>
                  <Text style={styles.paramName}>{param.name}</Text>
                  <Text style={styles.paramType}>{param.type}</Text>
                  <Text style={styles.paramRequired}>{param.required ? 'required' : 'optional'}</Text>
                  <Text style={styles.paramDesc}>{param.description}</Text>
                </View>
              ))}
            </View>
          )}
          {response && (
            <View style={styles.responseSection}>
              <Text style={styles.paramsSectionTitle}>Response Example</Text>
              <CodeBlock code={response} language="json" />
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default function DocumentationPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [sandboxKey, setSandboxKey] = useState('');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'book-outline' },
    { id: 'authentication', label: 'Authentication', icon: 'lock-closed-outline' },
    { id: 'endpoints', label: 'API Endpoints', icon: 'code-slash-outline' },
    { id: 'webhooks', label: 'Webhooks', icon: 'git-branch-outline' },
    { id: 'sandbox', label: 'Sandbox', icon: 'flask-outline' },
  ];

  const endpoints = [
    {
      category: 'Receipts',
      items: [
        {
          method: 'POST',
          path: '/api/v4/scan',
          description: 'Scan and validate a receipt QR code',
          params: [
            { name: 'qr_data', type: 'string', required: true, description: 'Raw QR code data from receipt' },
            { name: 'geo_location', type: 'object', required: false, description: 'User location {lat, lng}' },
          ],
          response: `{
  "scan_id": "uuid-v4",
  "status": "valid",
  "message": "Receipt verified! +5 entries",
  "entries_earned": 5,
  "processing_time_ms": 3.2,
  "instance_id": "api-1"
}`
        },
        {
          method: 'POST',
          path: '/api/v4/scan/batch',
          description: 'Scan multiple receipts in a single request (max 100)',
          params: [
            { name: 'scans', type: 'array', required: true, description: 'Array of scan objects' },
          ],
          response: `{
  "total": 10,
  "successful": 8,
  "failed": 2,
  "results": [...]
}`
        },
        {
          method: 'GET',
          path: '/api/receipts/history',
          description: 'Get user\'s scan history with pagination',
          params: [
            { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
            { name: 'limit', type: 'number', required: false, description: 'Items per page (default: 20)' },
          ],
          response: `{
  "receipts": [...],
  "total": 150,
  "page": 1,
  "pages": 8
}`
        },
      ]
    },
    {
      category: 'Draws',
      items: [
        {
          method: 'GET',
          path: '/api/draws/active',
          description: 'Get all currently active prize draws',
          params: [],
          response: `{
  "draws": [
    {
      "id": "draw-123",
      "type": "weekly",
      "prize_pool": 10000,
      "end_date": "2026-02-18T00:00:00Z",
      "total_entries": 125000
    }
  ]
}`
        },
        {
          method: 'GET',
          path: '/api/draws/{draw_id}/entries',
          description: 'Get user\'s entries for a specific draw',
          params: [
            { name: 'draw_id', type: 'string', required: true, description: 'Draw identifier' },
          ],
          response: `{
  "draw_id": "draw-123",
  "entries": 45,
  "rank": 128,
  "total_participants": 5000
}`
        },
        {
          method: 'GET',
          path: '/api/v4/leaderboard/{draw_id}',
          description: 'Get real-time leaderboard from distributed cache',
          params: [
            { name: 'draw_id', type: 'string', required: true, description: 'Draw identifier' },
            { name: 'limit', type: 'number', required: false, description: 'Max entries (default: 100)' },
          ],
          response: `{
  "draw_id": "draw-123",
  "entries": [
    {"user_id": "user-1", "entries": 520},
    {"user_id": "user-2", "entries": 485}
  ],
  "instance_id": "api-3"
}`
        },
      ]
    },
    {
      category: 'Users',
      items: [
        {
          method: 'GET',
          path: '/api/users/me',
          description: 'Get current authenticated user profile',
          params: [],
          response: `{
  "id": "user-uuid",
  "phone_number": "+1234567890",
  "name": "John Doe",
  "total_scans": 150,
  "valid_scans": 142,
  "total_entries": 450,
  "referral_code": "JOHN2024"
}`
        },
        {
          method: 'GET',
          path: '/api/users/stats',
          description: 'Get user statistics and achievements',
          params: [],
          response: `{
  "stats": {
    "total_scans": 150,
    "this_week": 12,
    "this_month": 45,
    "wins": 2,
    "total_won": 250
  }
}`
        },
      ]
    },
    {
      category: 'Admin',
      items: [
        {
          method: 'GET',
          path: '/api/admin/analytics',
          description: 'Get platform analytics (admin only)',
          params: [
            { name: 'period', type: 'string', required: false, description: 'day, week, month, year' },
          ],
          response: `{
  "total_scans": 2500000,
  "compliance_rate": 94.2,
  "revenue_increase": 18.5,
  "active_users": 125000
}`
        },
        {
          method: 'GET',
          path: '/api/system/performance',
          description: 'Get system performance metrics',
          params: [],
          response: `{
  "capacity": {
    "scans_per_minute": 480000,
    "db_ops_per_second": 500000
  },
  "components": {
    "bloom_filter": {...},
    "batch_processor": {...}
  }
}`
        },
      ]
    },
  ];

  const webhookEvents = [
    { event: 'receipt.scanned', description: 'Triggered when a receipt is successfully scanned', payload: '{ scan_id, user_id, status, entries_earned, timestamp }' },
    { event: 'receipt.rejected', description: 'Triggered when a receipt scan is rejected', payload: '{ scan_id, user_id, reason, timestamp }' },
    { event: 'draw.started', description: 'Triggered when a new draw period begins', payload: '{ draw_id, type, start_date, end_date, prize_pool }' },
    { event: 'draw.completed', description: 'Triggered when a draw is completed and winners selected', payload: '{ draw_id, winners: [...], total_entries }' },
    { event: 'user.milestone', description: 'Triggered when a user reaches a milestone (10, 50, 100 scans)', payload: '{ user_id, milestone, total_scans, bonus_entries }' },
    { event: 'fraud.detected', description: 'Triggered when potential fraud is detected', payload: '{ scan_id, user_id, fraud_type, confidence }' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable style={styles.backButton} onPress={() => router.push('/landing')}>
            <Ionicons name="arrow-back" size={20} color="#94A3B8" />
            <Text style={styles.backText}>Back to Home</Text>
          </Pressable>
          <View style={styles.headerTitle}>
            <Ionicons name="document-text" size={28} color="#10B981" />
            <Text style={styles.headerTitleText}>API Documentation</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v4.0</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.mainContent}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>DOCUMENTATION</Text>
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              style={[styles.sidebarItem, activeTab === tab.id && styles.sidebarItemActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={18} 
                color={activeTab === tab.id ? '#10B981' : '#64748B'} 
              />
              <Text style={[styles.sidebarItemText, activeTab === tab.id && styles.sidebarItemTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
          
          <View style={styles.sidebarDivider} />
          
          <Text style={styles.sidebarTitle}>QUICK LINKS</Text>
          <Pressable style={styles.sidebarItem}>
            <Ionicons name="download-outline" size={18} color="#64748B" />
            <Text style={styles.sidebarItemText}>Download SDK</Text>
          </Pressable>
          <Pressable style={styles.sidebarItem}>
            <Ionicons name="chatbubbles-outline" size={18} color="#64748B" />
            <Text style={styles.sidebarItemText}>Community Forum</Text>
          </Pressable>
          <Pressable style={styles.sidebarItem}>
            <Ionicons name="help-circle-outline" size={18} color="#64748B" />
            <Text style={styles.sidebarItemText}>Support</Text>
          </Pressable>
        </View>

        {/* Main Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'overview' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Getting Started</Text>
              <Text style={styles.sectionDesc}>
                Welcome to the Taxxa API documentation. Our RESTful API enables you to integrate 
                receipt scanning, prize draws, and analytics into your applications.
              </Text>
              
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name="flash" size={24} color="#F59E0B" />
                  <Text style={styles.infoCardTitle}>Base URL</Text>
                </View>
                <CodeBlock 
                  code="https://api.taxxa.io/api/v4" 
                  title="Production"
                />
                <CodeBlock 
                  code="https://sandbox.taxxa.io/api/v4" 
                  title="Sandbox"
                />
              </View>

              <Text style={styles.subSectionTitle}>Quick Start</Text>
              <View style={styles.stepsList}>
                {[
                  { step: 1, title: 'Get API Keys', desc: 'Sign up and generate your API credentials from the dashboard' },
                  { step: 2, title: 'Test in Sandbox', desc: 'Use sandbox environment to test your integration' },
                  { step: 3, title: 'Implement OAuth', desc: 'Set up user authentication flow' },
                  { step: 4, title: 'Go Live', desc: 'Switch to production keys when ready' },
                ].map((item) => (
                  <View key={item.step} style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{item.step}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>{item.title}</Text>
                      <Text style={styles.stepDesc}>{item.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <Text style={styles.subSectionTitle}>Rate Limits</Text>
              <View style={styles.rateLimitsTable}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.tableCellHeader]}>Tier</Text>
                  <Text style={[styles.tableCell, styles.tableCellHeader]}>Requests/min</Text>
                  <Text style={[styles.tableCell, styles.tableCellHeader]}>Burst</Text>
                </View>
                {[
                  { tier: 'Sandbox', rpm: '100', burst: '10' },
                  { tier: 'Starter', rpm: '1,000', burst: '50' },
                  { tier: 'Professional', rpm: '10,000', burst: '200' },
                  { tier: 'Enterprise', rpm: 'Unlimited', burst: '1,000' },
                ].map((row, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{row.tier}</Text>
                    <Text style={styles.tableCell}>{row.rpm}</Text>
                    <Text style={styles.tableCell}>{row.burst}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'authentication' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Authentication</Text>
              <Text style={styles.sectionDesc}>
                Taxxa API uses OAuth 2.0 for authentication. All API requests must include a valid 
                access token in the Authorization header.
              </Text>

              <View style={styles.authFlowCard}>
                <Text style={styles.subSectionTitle}>OAuth 2.0 Flow</Text>
                <View style={styles.authFlow}>
                  {[
                    { icon: 'person', label: 'User Authorization', color: '#3B82F6' },
                    { icon: 'arrow-forward', label: '', color: '#64748B' },
                    { icon: 'key', label: 'Auth Code', color: '#F59E0B' },
                    { icon: 'arrow-forward', label: '', color: '#64748B' },
                    { icon: 'shield-checkmark', label: 'Access Token', color: '#10B981' },
                  ].map((step, idx) => (
                    <View key={idx} style={styles.authFlowStep}>
                      <View style={[styles.authFlowIcon, { backgroundColor: `${step.color}20` }]}>
                        <Ionicons name={step.icon as any} size={24} color={step.color} />
                      </View>
                      {step.label && <Text style={styles.authFlowLabel}>{step.label}</Text>}
                    </View>
                  ))}
                </View>
              </View>

              <Text style={styles.subSectionTitle}>1. Request Authorization</Text>
              <CodeBlock 
                title="Authorization URL"
                code={`GET https://api.taxxa.io/oauth/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=YOUR_REDIRECT_URI
  &response_type=code
  &scope=receipts:read receipts:write draws:read users:read
  &state=RANDOM_STATE_STRING`}
              />

              <Text style={styles.subSectionTitle}>2. Exchange Code for Token</Text>
              <CodeBlock 
                title="Token Request"
                code={`POST https://api.taxxa.io/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTHORIZATION_CODE
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&redirect_uri=YOUR_REDIRECT_URI`}
              />

              <CodeBlock 
                title="Token Response"
                code={`{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl...",
  "scope": "receipts:read receipts:write draws:read users:read"
}`}
              />

              <Text style={styles.subSectionTitle}>3. Use Access Token</Text>
              <CodeBlock 
                title="API Request with Token"
                code={`curl -X POST https://api.taxxa.io/api/v4/scan \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"qr_data": "RECEIPT_QR_DATA"}'`}
              />

              <View style={styles.warningCard}>
                <Ionicons name="warning" size={24} color="#F59E0B" />
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>Security Best Practices</Text>
                  <Text style={styles.warningText}>
                    • Never expose client_secret in frontend code{'\n'}
                    • Store tokens securely (use httpOnly cookies){'\n'}
                    • Implement token refresh before expiry{'\n'}
                    • Use state parameter to prevent CSRF attacks
                  </Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'endpoints' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>API Endpoints</Text>
              <Text style={styles.sectionDesc}>
                Explore all available API endpoints. Click on any endpoint to see parameters and response examples.
              </Text>

              {endpoints.map((category, idx) => (
                <View key={idx} style={styles.endpointCategory}>
                  <Text style={styles.categoryTitle}>{category.category}</Text>
                  {category.items.map((endpoint, endpointIdx) => (
                    <EndpointCard key={endpointIdx} {...endpoint} />
                  ))}
                </View>
              ))}
            </View>
          )}

          {activeTab === 'webhooks' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Webhooks</Text>
              <Text style={styles.sectionDesc}>
                Receive real-time notifications when events happen in your Taxxa integration.
              </Text>

              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name="git-branch" size={24} color="#8B5CF6" />
                  <Text style={styles.infoCardTitle}>Webhook Endpoint</Text>
                </View>
                <Text style={styles.infoCardText}>
                  Configure your webhook URL in the dashboard. All events will be sent as POST requests 
                  with JSON payloads.
                </Text>
              </View>

              <Text style={styles.subSectionTitle}>Webhook Signature</Text>
              <Text style={styles.sectionDesc}>
                All webhook requests include a signature header for verification:
              </Text>
              <CodeBlock 
                title="Verify Signature (Node.js)"
                code={`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}
              />

              <Text style={styles.subSectionTitle}>Available Events</Text>
              <View style={styles.webhooksList}>
                {webhookEvents.map((webhook, idx) => (
                  <View key={idx} style={styles.webhookItem}>
                    <View style={styles.webhookHeader}>
                      <View style={styles.webhookEventBadge}>
                        <Text style={styles.webhookEventText}>{webhook.event}</Text>
                      </View>
                    </View>
                    <Text style={styles.webhookDesc}>{webhook.description}</Text>
                    <CodeBlock code={webhook.payload} />
                  </View>
                ))}
              </View>

              <Text style={styles.subSectionTitle}>Retry Policy</Text>
              <View style={styles.retryTable}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>Attempt 1</Text>
                  <Text style={styles.tableCell}>Immediate</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>Attempt 2</Text>
                  <Text style={styles.tableCell}>After 1 minute</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>Attempt 3</Text>
                  <Text style={styles.tableCell}>After 5 minutes</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>Attempt 4</Text>
                  <Text style={styles.tableCell}>After 30 minutes</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>Attempt 5</Text>
                  <Text style={styles.tableCell}>After 2 hours</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'sandbox' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sandbox Environment</Text>
              <Text style={styles.sectionDesc}>
                Test your integration without affecting production data. The sandbox environment 
                mirrors production functionality with test data.
              </Text>

              <View style={styles.sandboxCard}>
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.1)', 'rgba(59, 130, 246, 0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sandboxGradient}
                >
                  <View style={styles.sandboxHeader}>
                    <Ionicons name="flask" size={32} color="#10B981" />
                    <Text style={styles.sandboxTitle}>Sandbox Credentials</Text>
                  </View>
                  
                  <View style={styles.sandboxCredentials}>
                    <View style={styles.credentialRow}>
                      <Text style={styles.credentialLabel}>Base URL</Text>
                      <Text style={styles.credentialValue}>https://sandbox.taxxa.io/api/v4</Text>
                    </View>
                    <View style={styles.credentialRow}>
                      <Text style={styles.credentialLabel}>Test Client ID</Text>
                      <Text style={styles.credentialValue}>sandbox_client_taxxa_demo</Text>
                    </View>
                    <View style={styles.credentialRow}>
                      <Text style={styles.credentialLabel}>Test Secret</Text>
                      <Text style={styles.credentialValue}>sandbox_secret_xxxxxxxx</Text>
                    </View>
                  </View>

                  <Pressable style={styles.generateKeyButton}>
                    <Ionicons name="key" size={18} color="#fff" />
                    <Text style={styles.generateKeyText}>Generate Sandbox Key</Text>
                  </Pressable>
                </LinearGradient>
              </View>

              <Text style={styles.subSectionTitle}>Test QR Codes</Text>
              <Text style={styles.sectionDesc}>
                Use these test QR codes to simulate different scan scenarios:
              </Text>

              <View style={styles.testCodesGrid}>
                {[
                  { code: 'VALID_001', status: 'Valid', entries: 5, color: '#10B981' },
                  { code: 'VALID_002', status: 'Valid', entries: 10, color: '#10B981' },
                  { code: 'DUPLICATE', status: 'Duplicate', entries: 0, color: '#F59E0B' },
                  { code: 'INVALID_MERCHANT', status: 'Invalid', entries: 0, color: '#EF4444' },
                  { code: 'SUSPENDED_MERCHANT', status: 'Suspended', entries: 0, color: '#EF4444' },
                  { code: 'EXPIRED_RECEIPT', status: 'Expired', entries: 0, color: '#64748B' },
                ].map((test, idx) => (
                  <View key={idx} style={styles.testCodeCard}>
                    <View style={[styles.testCodeStatus, { backgroundColor: `${test.color}20` }]}>
                      <Text style={[styles.testCodeStatusText, { color: test.color }]}>{test.status}</Text>
                    </View>
                    <Text style={styles.testCodeValue}>{test.code}</Text>
                    <Text style={styles.testCodeEntries}>
                      {test.entries > 0 ? `+${test.entries} entries` : 'No entries'}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={styles.subSectionTitle}>Try It Now</Text>
              <View style={styles.tryItCard}>
                <Text style={styles.tryItLabel}>Test QR Code</Text>
                <TextInput
                  style={styles.tryItInput}
                  placeholder="Enter test code (e.g., VALID_001)"
                  placeholderTextColor="#64748B"
                  value={sandboxKey}
                  onChangeText={setSandboxKey}
                />
                <Pressable style={styles.tryItButton}>
                  <Text style={styles.tryItButtonText}>Test Scan</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </Pressable>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name="information-circle" size={24} color="#3B82F6" />
                  <Text style={styles.infoCardTitle}>Sandbox Limitations</Text>
                </View>
                <Text style={styles.infoCardText}>
                  • No real prizes or entries are awarded{'\n'}
                  • Data is reset daily at midnight UTC{'\n'}
                  • Rate limits are lower than production{'\n'}
                  • Webhooks are delivered to sandbox endpoints only
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  headerContent: {
    maxWidth: 1400,
    marginHorizontal: 'auto',
    width: '100%',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitleText: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
  },
  versionBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  versionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    backgroundColor: '#1E293B',
    borderRightWidth: 1,
    borderRightColor: '#334155',
    padding: 20,
    display: isWeb ? 'flex' : 'none',
  },
  sidebarTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
    marginTop: 8,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  sidebarItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  sidebarItemText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  sidebarItemTextActive: {
    color: '#10B981',
    fontWeight: '600',
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 20,
  },
  content: {
    flex: 1,
    padding: 32,
  },
  section: {
    maxWidth: 900,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
  },
  sectionDesc: {
    color: '#94A3B8',
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 32,
  },
  subSectionTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 32,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  infoCardTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '600',
  },
  infoCardText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 24,
  },
  codeBlockContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    marginTop: 12,
    overflow: 'hidden',
  },
  codeBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  codeBlockTitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copyText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  codeBlock: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 22,
    padding: 16,
  },
  stepsList: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDesc: {
    color: '#94A3B8',
    fontSize: 14,
  },
  rateLimitsTable: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#334155',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tableCell: {
    flex: 1,
    padding: 14,
    color: '#CBD5E1',
    fontSize: 14,
  },
  tableCellHeader: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  authFlowCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  authFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  authFlowStep: {
    alignItems: 'center',
  },
  authFlowIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authFlowLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  warningCard: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginTop: 24,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  warningText: {
    color: '#FCD34D',
    fontSize: 14,
    lineHeight: 24,
  },
  endpointCategory: {
    marginBottom: 32,
  },
  categoryTitle: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  endpointCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  endpointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  endpointMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  methodText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  endpointPath: {
    color: '#F8FAFC',
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  endpointDesc: {
    color: '#94A3B8',
    fontSize: 14,
  },
  endpointDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  paramsSection: {
    marginBottom: 16,
  },
  paramsSectionTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  paramRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  paramName: {
    color: '#10B981',
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontWeight: '600',
  },
  paramType: {
    color: '#8B5CF6',
    fontSize: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paramRequired: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '600',
  },
  paramDesc: {
    color: '#94A3B8',
    fontSize: 13,
    width: '100%',
    marginTop: 4,
  },
  responseSection: {
    marginTop: 8,
  },
  webhooksList: {
    gap: 16,
  },
  webhookItem: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  webhookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  webhookEventBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  webhookEventText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  webhookDesc: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 12,
  },
  retryTable: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  sandboxCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
  },
  sandboxGradient: {
    padding: 28,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
  },
  sandboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  sandboxTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
  },
  sandboxCredentials: {
    gap: 16,
    marginBottom: 24,
  },
  credentialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    padding: 14,
    borderRadius: 10,
  },
  credentialLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  credentialValue: {
    color: '#10B981',
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  generateKeyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
  },
  generateKeyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  testCodesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  testCodeCard: {
    width: isWeb ? 'calc(33.333% - 11px)' : '100%',
    minWidth: 180,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  testCodeStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  testCodeStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  testCodeValue: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    marginBottom: 4,
  },
  testCodeEntries: {
    color: '#64748B',
    fontSize: 12,
  },
  tryItCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tryItLabel: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  tryItInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F8FAFC',
    fontSize: 14,
    marginBottom: 16,
  },
  tryItButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 10,
  },
  tryItButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
