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

export default function FeaturesPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [activeTab, setActiveTab] = useState('consumer');
  const [contactForm, setContactForm] = useState({
    name: '',
    organization: '',
    email: '',
    country: '',
    message: '',
  });

  const tabs = [
    { id: 'consumer', label: 'Consumer App', icon: 'phone-portrait' },
    { id: 'admin', label: 'Admin Portal', icon: 'desktop' },
    { id: 'api', label: 'Receipt API', icon: 'code-slash' },
    { id: 'security', label: 'Security', icon: 'shield-checkmark' },
    { id: 'integrations', label: 'Integrations', icon: 'git-network' },
  ];

  const features: Record<string, any[]> = {
    consumer: [
      { name: 'QR Code Scanning', description: 'Scan receipts via camera or upload image', icon: 'qr-code', status: 'live' },
      { name: 'Web Browser Scanning', description: 'No app download required - scan from any browser', icon: 'globe', status: 'live' },
      { name: 'Real-time Validation', description: 'Instant verification against Revenue Authority database', icon: 'checkmark-circle', status: 'live' },
      { name: 'Entry Tracking', description: 'View all scans and accumulated draw entries', icon: 'list', status: 'live' },
      { name: 'Draw Participation', description: 'Automatic entry into weekly and monthly draws', icon: 'ticket', status: 'live' },
      { name: 'Push Notifications', description: 'Alerts for new draws, wins, and reminders', icon: 'notifications', status: 'live' },
      { name: 'Winner Announcements', description: 'Real-time notification when you win', icon: 'trophy', status: 'live' },
      { name: 'Referral Program', description: 'Earn bonus entries by inviting friends', icon: 'people', status: 'live' },
      { name: 'Offline Mode', description: 'Scan receipts without internet, sync later', icon: 'cloud-offline', status: 'live' },
      { name: 'Multi-language Support', description: 'Available in local languages', icon: 'language', status: 'live' },
    ],
    admin: [
      { name: 'Real-time Dashboard', description: 'Live metrics on scans, users, and compliance', icon: 'analytics', status: 'live' },
      { name: 'Draw Management', description: 'Create, configure, and execute prize draws', icon: 'calendar', status: 'live' },
      { name: 'Winner Selection', description: 'Cryptographically secure random selection', icon: 'shuffle', status: 'live' },
      { name: 'User Management', description: 'View and manage citizen accounts', icon: 'people', status: 'live' },
      { name: 'Prize Disbursement', description: 'Track and confirm prize payouts', icon: 'cash', status: 'live' },
      { name: 'Audit Reports', description: 'Comprehensive audit trails for compliance', icon: 'document-text', status: 'live' },
      { name: 'Analytics Export', description: 'Export data for external analysis', icon: 'download', status: 'live' },
      { name: 'Role-based Access', description: 'Control who can access what features', icon: 'lock-closed', status: 'live' },
      { name: 'Custom Branding', description: 'White-label with your authority branding', icon: 'color-palette', status: 'live' },
      { name: 'Executive Reports', description: 'High-level summaries for leadership', icon: 'briefcase', status: 'live' },
    ],
    api: [
      { name: 'RESTful API', description: 'Modern, well-documented REST endpoints', icon: 'code', status: 'live' },
      { name: 'QR Decode Endpoint', description: 'Extract data from any receipt QR format', icon: 'qr-code', status: 'live' },
      { name: 'Validation Endpoint', description: 'Verify receipts against your database', icon: 'checkmark-done', status: 'live' },
      { name: 'Submission Endpoint', description: 'Record scans and award entries', icon: 'send', status: 'live' },
      { name: 'Batch Processing', description: 'Handle bulk receipt submissions', icon: 'layers', status: 'live' },
      { name: 'Webhook Events', description: '16 event types for real-time notifications', icon: 'git-branch', status: 'live' },
      { name: 'API Versioning', description: 'Stable v1 API with backwards compatibility', icon: 'git-compare', status: 'live' },
      { name: 'Rate Limiting', description: 'Protect against abuse with smart limits', icon: 'speedometer', status: 'live' },
      { name: 'SDK Libraries', description: 'Client libraries for popular languages', icon: 'library', status: 'coming' },
      { name: 'Sandbox Environment', description: 'Test integrations safely', icon: 'flask', status: 'live' },
    ],
    security: [
      { name: 'Duplicate Detection', description: 'Prevent same receipt being scanned twice', icon: 'copy', status: 'live' },
      { name: 'Fraud Scoring', description: 'ML-based suspicious activity detection', icon: 'warning', status: 'live' },
      { name: 'Device Fingerprinting', description: 'Track and limit abuse from same device', icon: 'finger-print', status: 'live' },
      { name: 'Rate Limiting', description: 'Prevent automated abuse attempts', icon: 'timer', status: 'live' },
      { name: 'Audit Logging', description: 'Complete trail of all system actions', icon: 'document-lock', status: 'live' },
      { name: 'Data Encryption', description: 'AES-256 encryption at rest and in transit', icon: 'lock-closed', status: 'live' },
      { name: 'JWT Authentication', description: 'Secure token-based user authentication', icon: 'key', status: 'live' },
      { name: 'HMAC Webhooks', description: 'Signed webhook payloads for verification', icon: 'shield', status: 'live' },
      { name: 'GDPR Compliance', description: 'Data privacy controls and exports', icon: 'checkmark-done-circle', status: 'live' },
      { name: 'SOC 2 Ready', description: 'Enterprise security standards', icon: 'ribbon', status: 'live' },
    ],
    integrations: [
      { name: 'Revenue Authority API', description: 'Direct connection to your tax database', icon: 'business', status: 'live' },
      { name: 'SMS Providers', description: 'Twilio, Africa\'s Talking integration ready', icon: 'chatbubble', status: 'ready' },
      { name: 'Push Notifications', description: 'Expo Push Service for mobile alerts', icon: 'notifications', status: 'live' },
      { name: 'Email Service', description: 'Transactional email support', icon: 'mail', status: 'ready' },
      { name: 'Payment Gateways', description: 'Prize disbursement via M-Pesa, bank transfer', icon: 'card', status: 'ready' },
      { name: 'Analytics Platforms', description: 'Export to your BI tools', icon: 'bar-chart', status: 'live' },
      { name: 'SSO Integration', description: 'Single sign-on for admin users', icon: 'log-in', status: 'ready' },
      { name: 'Webhook Endpoints', description: 'Push events to your systems', icon: 'git-branch', status: 'live' },
    ],
  };

  const supportedCountries = [
    { name: 'Tanzania', authority: 'TRA', system: 'EFDMS', flag: '🇹🇿', status: 'ready', color: '#10B981' },
    { name: 'Kenya', authority: 'KRA', system: 'eTIMS', flag: '🇰🇪', status: 'ready', color: '#3B82F6' },
    { name: 'Uganda', authority: 'URA', system: 'EFRIS', flag: '🇺🇬', status: 'ready', color: '#F59E0B' },
    { name: 'Rwanda', authority: 'RRA', system: 'EBM', flag: '🇷🇼', status: 'ready', color: '#8B5CF6' },
    { name: 'Ethiopia', authority: 'ERCA', system: 'E-Tax', flag: '🇪🇹', status: 'coming', color: '#06B6D4' },
    { name: 'Nigeria', authority: 'FIRS', system: 'TaxPro', flag: '🇳🇬', status: 'coming', color: '#22C55E' },
    { name: 'South Africa', authority: 'SARS', system: 'eFiling', flag: '🇿🇦', status: 'coming', color: '#EF4444' },
    { name: 'Ghana', authority: 'GRA', system: 'E-VAT', flag: '🇬🇭', status: 'coming', color: '#EC4899' },
  ];

  const currentFeatures = features[activeTab] || [];
  const liveCount = currentFeatures.filter(f => f.status === 'live').length;
  const totalCount = currentFeatures.length;

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
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>Enterprise</Text>
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
              <TouchableOpacity style={[styles.navLink, styles.navLinkActive]} onPress={() => router.push('/features')}>
                <Text style={[styles.navLinkText, styles.navLinkTextActive]}>Features</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navLink} onPress={() => router.push('/case-studies')}>
                <Text style={styles.navLinkText}>Pilot Programs</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navLink} onPress={() => router.push('/documentation')}>
                <Text style={styles.navLinkText}>Documentation</Text>
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
            <TouchableOpacity style={[styles.mobileMenuItem, styles.mobileMenuItemActive]} onPress={() => setShowMobileMenu(false)}>
              <Text style={[styles.mobileMenuItemText, styles.mobileMenuItemTextActive]}>Features</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mobileMenuItem} onPress={() => { setShowMobileMenu(false); router.push('/case-studies'); }}>
              <Text style={styles.mobileMenuItemText}>Pilot Programs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mobileMenuItem} onPress={() => { setShowMobileMenu(false); router.push('/documentation'); }}>
              <Text style={styles.mobileMenuItemText}>Documentation</Text>
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
            <Ionicons name="checkmark-done-circle" size={14} color="#60A5FA" />
            <Text style={styles.heroBadgeText}>48+ Features Ready</Text>
          </View>
          <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
            Everything You Need.{'\n'}
            <Text style={styles.heroTitleHighlight}>Nothing You Don't.</Text>
          </Text>
          <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>
            A complete platform built for Revenue Authorities. From citizen apps to admin dashboards, 
            APIs to security - it's all here, ready to deploy.
          </Text>
        </View>
      </LinearGradient>

      {/* Tabs Section */}
      <View style={styles.tabsSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContainer}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={20} 
                color={activeTab === tab.id ? '#fff' : '#64748B'} 
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Features Count */}
      <View style={styles.countSection}>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            <Text style={styles.countHighlight}>{liveCount}</Text> of {totalCount} features live
          </Text>
        </View>
      </View>

      {/* Features Grid */}
      <View style={styles.featuresSection}>
        <View style={[styles.featuresGrid, isMobile && styles.featuresGridMobile]}>
          {currentFeatures.map((feature, index) => (
            <View key={index} style={[styles.featureCard, isMobile && styles.featureCardMobile]}>
              <View style={styles.featureHeader}>
                <View style={[styles.featureIconWrap, { backgroundColor: feature.status === 'live' ? '#EFF6FF' : '#FEF3C7' }]}>
                  <Ionicons 
                    name={feature.icon as any} 
                    size={22} 
                    color={feature.status === 'live' ? '#3B82F6' : '#F59E0B'} 
                  />
                </View>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: feature.status === 'live' ? '#DCFCE7' : feature.status === 'ready' ? '#FEF3C7' : '#E0E7FF' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: feature.status === 'live' ? '#166534' : feature.status === 'ready' ? '#92400E' : '#3730A3' }
                  ]}>
                    {feature.status === 'live' ? 'Live' : feature.status === 'ready' ? 'Ready' : 'Coming'}
                  </Text>
                </View>
              </View>
              <Text style={styles.featureName}>{feature.name}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Summary Stats */}
      <View style={[styles.summarySection, { backgroundColor: '#F8FAFC' }]}>
        <Text style={styles.summaryTitle}>Platform Overview</Text>
        <View style={[styles.summaryGrid, isMobile && styles.summaryGridMobile]}>
          {[
            { value: '48+', label: 'Total Features', icon: 'checkmark-done', color: '#3B82F6' },
            { value: '5', label: 'Categories', icon: 'grid', color: '#8B5CF6' },
            { value: '95%', label: 'Features Live', icon: 'pulse', color: '#10B981' },
            { value: '24/7', label: 'Support', icon: 'headset', color: '#F59E0B' },
          ].map((stat, index) => (
            <View key={index} style={[styles.summaryCard, isMobile && styles.summaryCardMobile]}>
              <View style={[styles.summaryIconWrap, { backgroundColor: stat.color + '15' }]}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={styles.summaryValue}>{stat.value}</Text>
              <Text style={styles.summaryLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.ctaSection}>
        <Text style={[styles.ctaTitle, isMobile && styles.ctaTitleMobile]}>See These Features In Action</Text>
        <Text style={styles.ctaSubtitle}>Book a personalized demo and explore how Taxxa can work for you</Text>
        <View style={[styles.ctaButtons, isMobile && styles.ctaButtonsMobile]}>
          <TouchableOpacity style={styles.ctaButtonPrimary} onPress={() => setShowContactModal(true)}>
            <Ionicons name="calendar" size={20} color="#3B82F6" />
            <Text style={styles.ctaButtonPrimaryText}>Schedule Demo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctaButtonSecondary} onPress={() => router.push('/demo')}>
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.ctaButtonSecondaryText}>Try Interactive Demo</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

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
              <TextInput 
                style={styles.input} 
                placeholder="Your name" 
                placeholderTextColor="#94A3B8"
                value={contactForm.name} 
                onChangeText={(text) => setContactForm({...contactForm, name: text})} 
              />
              <Text style={styles.inputLabel}>Organization *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Revenue Authority / Ministry" 
                placeholderTextColor="#94A3B8"
                value={contactForm.organization} 
                onChangeText={(text) => setContactForm({...contactForm, organization: text})} 
              />
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="your.email@revenue.gov" 
                placeholderTextColor="#94A3B8"
                keyboardType="email-address" 
                value={contactForm.email} 
                onChangeText={(text) => setContactForm({...contactForm, email: text})} 
              />
              <Text style={styles.inputLabel}>Country *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Your country" 
                placeholderTextColor="#94A3B8"
                value={contactForm.country} 
                onChangeText={(text) => setContactForm({...contactForm, country: text})} 
              />
              <Text style={styles.inputLabel}>Message</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="Tell us about your requirements..." 
                placeholderTextColor="#94A3B8"
                multiline 
                numberOfLines={4} 
                value={contactForm.message} 
                onChangeText={(text) => setContactForm({...contactForm, message: text})} 
              />
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
  container: { flex: 1, backgroundColor: '#fff' },
  // Navigation
  nav: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 16, paddingHorizontal: 24, position: isWeb ? 'sticky' as any : 'relative', top: 0, zIndex: 100 },
  navContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, alignSelf: 'center', width: '100%' },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 22, fontWeight: '700', color: '#1E293B' },
  logoBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  logoBadgeText: { fontSize: 11, fontWeight: '600', color: '#3B82F6' },
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
  // Tabs
  tabsSection: { paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabsScroll: { flexGrow: 0 },
  tabsContainer: { paddingHorizontal: 24, gap: 8, justifyContent: 'center', minWidth: '100%' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, backgroundColor: '#F1F5F9' },
  tabActive: { backgroundColor: '#3B82F6' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#fff' },
  // Count
  countSection: { paddingVertical: 16, alignItems: 'center' },
  countBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  countText: { fontSize: 14, color: '#166534' },
  countHighlight: { fontWeight: '700' },
  // Features Grid
  featuresSection: { paddingHorizontal: 24, paddingBottom: 48 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center', maxWidth: 1200, alignSelf: 'center' },
  featuresGridMobile: { flexDirection: 'column' },
  featureCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: 280, borderWidth: 1, borderColor: '#E2E8F0' },
  featureCardMobile: { width: '100%' },
  featureHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  featureIconWrap: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  featureName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  featureDescription: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  // Summary
  summarySection: { paddingVertical: 60, paddingHorizontal: 24 },
  summaryTitle: { fontSize: 28, fontWeight: '700', color: '#1E293B', textAlign: 'center', marginBottom: 32 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'center', gap: 20, maxWidth: 800, alignSelf: 'center' },
  summaryGridMobile: { flexDirection: 'column' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', flex: 1, minWidth: 150 },
  summaryCardMobile: { flexDirection: 'row', gap: 16, justifyContent: 'flex-start' },
  summaryIconWrap: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  summaryValue: { fontSize: 32, fontWeight: '700', color: '#1E293B' },
  summaryLabel: { fontSize: 14, color: '#64748B', marginTop: 4 },
  // CTA
  ctaSection: { padding: 60, alignItems: 'center' },
  ctaTitle: { fontSize: 36, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 12 },
  ctaTitleMobile: { fontSize: 28 },
  ctaSubtitle: { fontSize: 18, color: 'rgba(255,255,255,0.85)', marginBottom: 32, textAlign: 'center' },
  ctaButtons: { flexDirection: 'row', gap: 16 },
  ctaButtonsMobile: { flexDirection: 'column', width: '100%', alignItems: 'center' },
  ctaButtonPrimary: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', paddingHorizontal: 28, paddingVertical: 16, borderRadius: 8 },
  ctaButtonPrimaryText: { color: '#3B82F6', fontSize: 17, fontWeight: '600' },
  ctaButtonSecondary: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 8, borderWidth: 2, borderColor: '#fff' },
  ctaButtonSecondaryText: { color: '#fff', fontSize: 17, fontWeight: '600' },
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
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 14, fontSize: 16, color: '#1E293B' },
  textArea: { height: 100, textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  modalCancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  modalSubmitBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, backgroundColor: '#3B82F6' },
  modalSubmitText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
