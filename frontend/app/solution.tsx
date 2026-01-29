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

export default function SolutionPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    organization: '',
    email: '',
    country: '',
    message: '',
  });

  const coreComponents = [
    {
      icon: 'phone-portrait',
      title: 'Mobile App & Web Scanner',
      description: 'Citizens scan QR codes using our mobile app OR any web browser. No app download required for web scanning.',
      features: ['iOS & Android apps', 'Browser-based scanning', 'Instant validation', 'Works offline'],
      color: '#3B82F6',
    },
    {
      icon: 'business',
      title: 'Revenue Authority Dashboard',
      description: 'Real-time connection to your tax authority platform. All receipt data flows directly to your existing systems.',
      features: ['Live data sync', 'Custom integrations', 'Audit-ready reports', 'API access'],
      color: '#8B5CF6',
    },
    {
      icon: 'shield-checkmark',
      title: 'Built-in Fraud Prevention',
      description: 'QR codes contain all transaction data. No merchant connection needed - we validate against your revenue database.',
      features: ['QR data extraction', 'Duplicate detection', 'Anomaly alerts', 'Geo-verification'],
      color: '#10B981',
    },
    {
      icon: 'trophy',
      title: 'Prize Draw Engine',
      description: 'Cryptographically secure, publicly auditable draws that build trust and drive participation.',
      features: ['Transparent selection', 'Blockchain-ready', 'Instant notifications', 'Winner verification'],
      color: '#F59E0B',
    },
  ];

  const stats = [
    { value: '23%', label: 'Average Revenue Increase', icon: 'trending-up' },
    { value: '3.1M+', label: 'Active Citizens', icon: 'people' },
    { value: '<1s', label: 'Validation Speed', icon: 'flash' },
    { value: '8', label: 'Countries Live', icon: 'globe' },
  ];

  const handleSubmitInquiry = () => {
    alert('Thank you for your inquiry. Our team will contact you within 24-48 hours.');
    setShowContactModal(false);
    setContactForm({ name: '', organization: '', email: '', country: '', message: '' });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Navigation - Same as Landing */}
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
              <TouchableOpacity style={[styles.navLink, styles.navLinkActive]} onPress={() => router.push('/solution')}>
                <Text style={[styles.navLinkText, styles.navLinkTextActive]}>Solution</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navLink} onPress={() => router.push('/how-it-works')}>
                <Text style={styles.navLinkText}>How It Works</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navLink} onPress={() => router.push('/case-studies')}>
                <Text style={styles.navLinkText}>Case Studies</Text>
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
            <TouchableOpacity style={[styles.mobileMenuItem, styles.mobileMenuItemActive]} onPress={() => setShowMobileMenu(false)}>
              <Text style={[styles.mobileMenuItemText, styles.mobileMenuItemTextActive]}>Solution</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mobileMenuItem} onPress={() => { setShowMobileMenu(false); router.push('/how-it-works'); }}>
              <Text style={styles.mobileMenuItemText}>How It Works</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mobileMenuItem} onPress={() => { setShowMobileMenu(false); router.push('/case-studies'); }}>
              <Text style={styles.mobileMenuItemText}>Case Studies</Text>
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
            <Ionicons name="rocket" size={14} color="#60A5FA" />
            <Text style={styles.heroBadgeText}>The Complete Tax Compliance Platform</Text>
          </View>
          <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
            Turn Every Receipt Into{'\n'}
            <Text style={styles.heroTitleHighlight}>A Revenue Opportunity</Text>
          </Text>
          <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>
            Citizens scan. You collect. Everyone wins. Taxxa connects directly to your Revenue Authority 
            platform, turning passive consumers into active compliance partners.
          </Text>
          <View style={[styles.heroButtons, isMobile && styles.heroButtonsMobile]}>
            <TouchableOpacity style={[styles.heroButtonPrimary, isMobile && styles.heroButtonMobile]} onPress={() => setShowContactModal(true)}>
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={styles.heroButtonPrimaryText}>Schedule Demo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.heroButtonSecondary, isMobile && styles.heroButtonMobile]} onPress={() => router.push('/how-it-works')}>
              <Ionicons name="play-circle" size={20} color="#3B82F6" />
              <Text style={styles.heroButtonSecondaryText}>See How It Works</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
          {stats.map((stat, index) => (
            <View key={index} style={[styles.statCard, isMobile && styles.statCardMobile]}>
              <Ionicons name={stat.icon as any} size={24} color="#3B82F6" />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Key Message */}
      <View style={styles.messageSection}>
        <View style={styles.messageCard}>
          <Ionicons name="information-circle" size={32} color="#3B82F6" />
          <Text style={styles.messageTitle}>No Merchant Integration Required</Text>
          <Text style={styles.messageText}>
            The QR code on every tax receipt already contains all transaction data. Taxxa reads this information 
            and validates it directly against your Revenue Authority database. Zero setup with merchants.
          </Text>
        </View>
      </View>

      {/* Platform Components */}
      <View style={[styles.section, { backgroundColor: '#F8FAFC' }]}>
        <Text style={styles.sectionTitle}>One Platform, Complete Solution</Text>
        <Text style={styles.sectionSubtitle}>Everything connects to your existing Revenue Authority systems</Text>
        
        <View style={[styles.componentsGrid, isMobile && styles.componentsGridMobile]}>
          {coreComponents.map((component, index) => (
            <View key={index} style={[styles.componentCard, isMobile && styles.componentCardMobile]}>
              <View style={[styles.componentIcon, { backgroundColor: component.color + '15' }]}>
                <Ionicons name={component.icon as any} size={28} color={component.color} />
              </View>
              <Text style={styles.componentTitle}>{component.title}</Text>
              <Text style={styles.componentDescription}>{component.description}</Text>
              <View style={styles.featureList}>
                {component.features.map((feature, fIndex) => (
                  <View key={fIndex} style={styles.featureItem}>
                    <Ionicons name="checkmark" size={16} color={component.color} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* How Scanning Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scan Anywhere, Any Device</Text>
        <Text style={styles.sectionSubtitle}>Maximum flexibility for citizens, maximum data for you</Text>
        
        <View style={[styles.scanOptionsGrid, isMobile && styles.scanOptionsGridMobile]}>
          <View style={[styles.scanOptionCard, isMobile && styles.scanOptionCardMobile]}>
            <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.scanOptionGradient}>
              <Ionicons name="phone-portrait" size={48} color="#fff" />
              <Text style={styles.scanOptionTitle}>Mobile App</Text>
              <Text style={styles.scanOptionDescription}>
                Full-featured iOS & Android apps with offline support, push notifications, and entry tracking
              </Text>
              <View style={styles.scanOptionBadge}>
                <Text style={styles.scanOptionBadgeText}>Best Experience</Text>
              </View>
            </LinearGradient>
          </View>
          
          <View style={[styles.scanOptionCard, isMobile && styles.scanOptionCardMobile]}>
            <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.scanOptionGradient}>
              <Ionicons name="globe" size={48} color="#fff" />
              <Text style={styles.scanOptionTitle}>Web Browser</Text>
              <Text style={styles.scanOptionDescription}>
                No download required. Citizens scan directly from any browser on any device instantly
              </Text>
              <View style={styles.scanOptionBadge}>
                <Text style={styles.scanOptionBadgeText}>Zero Friction</Text>
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <LinearGradient colors={['#1E3A5F', '#0F172A']} style={styles.ctaSection}>
        <Text style={[styles.ctaTitle, isMobile && styles.ctaTitleMobile]}>Ready to Boost Compliance?</Text>
        <Text style={styles.ctaSubtitle}>Join tax authorities across Africa seeing 15-30% revenue increases</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => setShowContactModal(true)}>
          <Ionicons name="calendar" size={20} color="#1E293B" />
          <Text style={styles.ctaButtonText}>Schedule Your Demo</Text>
        </TouchableOpacity>
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
                placeholderTextColor="#64748B"
                value={contactForm.name}
                onChangeText={(text) => setContactForm({...contactForm, name: text})}
              />
              <Text style={styles.inputLabel}>Organization *</Text>
              <TextInput
                style={styles.input}
                placeholder="Tax Authority / Ministry name"
                placeholderTextColor="#64748B"
                value={contactForm.organization}
                onChangeText={(text) => setContactForm({...contactForm, organization: text})}
              />
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="your.email@gov.xx"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                value={contactForm.email}
                onChangeText={(text) => setContactForm({...contactForm, email: text})}
              />
              <Text style={styles.inputLabel}>Country *</Text>
              <TextInput
                style={styles.input}
                placeholder="Your country"
                placeholderTextColor="#64748B"
                value={contactForm.country}
                onChangeText={(text) => setContactForm({...contactForm, country: text})}
              />
              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about your requirements..."
                placeholderTextColor="#64748B"
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
  nav: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 16,
    paddingHorizontal: 24,
    position: isWeb ? 'sticky' as any : 'relative',
    top: 0,
    zIndex: 100,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  hero: { paddingVertical: 80, paddingHorizontal: 24 },
  heroMobile: { paddingVertical: 48 },
  heroContent: { maxWidth: 800, alignSelf: 'center' },
  heroContentMobile: { alignItems: 'center' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 24 },
  heroBadgeText: { color: '#60A5FA', fontSize: 14, fontWeight: '600' },
  heroTitle: { fontSize: 52, fontWeight: '800', color: '#fff', marginBottom: 20, lineHeight: 60 },
  heroTitleMobile: { fontSize: 32, lineHeight: 40, textAlign: 'center' },
  heroTitleHighlight: { color: '#60A5FA' },
  heroSubtitle: { fontSize: 20, color: '#94A3B8', marginBottom: 32, lineHeight: 32 },
  heroSubtitleMobile: { fontSize: 16, textAlign: 'center', lineHeight: 26 },
  heroButtons: { flexDirection: 'row', gap: 16 },
  heroButtonsMobile: { flexDirection: 'column', width: '100%' },
  heroButtonMobile: { width: '100%', justifyContent: 'center' },
  heroButtonPrimary: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#3B82F6', paddingHorizontal: 28, paddingVertical: 16, borderRadius: 8 },
  heroButtonPrimaryText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  heroButtonSecondary: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', paddingHorizontal: 28, paddingVertical: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  heroButtonSecondaryText: { color: '#3B82F6', fontSize: 17, fontWeight: '600' },
  // Stats
  statsSection: { paddingVertical: 40, paddingHorizontal: 24, marginTop: -40, zIndex: 10 },
  statsGrid: { flexDirection: 'row', justifyContent: 'center', gap: 16, maxWidth: 1000, alignSelf: 'center' },
  statsGridMobile: { flexDirection: 'column' },
  statCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', flex: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  statCardMobile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: '700', color: '#1E293B', marginTop: 8 },
  statLabel: { fontSize: 14, color: '#64748B', marginTop: 4, textAlign: 'center' },
  // Message
  messageSection: { paddingHorizontal: 24, paddingVertical: 20 },
  messageCard: { backgroundColor: '#EFF6FF', borderRadius: 16, padding: 24, maxWidth: 800, alignSelf: 'center', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
  messageTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginTop: 12, marginBottom: 8, textAlign: 'center' },
  messageText: { fontSize: 16, color: '#475569', textAlign: 'center', lineHeight: 26 },
  // Section
  section: { paddingVertical: 60, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 36, fontWeight: '700', color: '#1E293B', textAlign: 'center', marginBottom: 12 },
  sectionSubtitle: { fontSize: 18, color: '#64748B', textAlign: 'center', marginBottom: 48, maxWidth: 600, alignSelf: 'center' },
  // Components Grid
  componentsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, justifyContent: 'center', maxWidth: 1100, alignSelf: 'center' },
  componentsGridMobile: { flexDirection: 'column' },
  componentCard: { backgroundColor: '#fff', borderRadius: 16, padding: 28, width: '48%', minWidth: 280, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  componentCardMobile: { width: '100%' },
  componentIcon: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  componentTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  componentDescription: { fontSize: 15, color: '#64748B', marginBottom: 16, lineHeight: 24 },
  featureList: { gap: 8 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14, color: '#475569' },
  // Scan Options
  scanOptionsGrid: { flexDirection: 'row', gap: 24, justifyContent: 'center', maxWidth: 800, alignSelf: 'center' },
  scanOptionsGridMobile: { flexDirection: 'column' },
  scanOptionCard: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  scanOptionCardMobile: { flex: 0 },
  scanOptionGradient: { padding: 32, alignItems: 'center' },
  scanOptionTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 16, marginBottom: 12 },
  scanOptionDescription: { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24 },
  scanOptionBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 20 },
  scanOptionBadgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  // CTA
  ctaSection: { padding: 60, alignItems: 'center' },
  ctaTitle: { fontSize: 36, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 12 },
  ctaTitleMobile: { fontSize: 28 },
  ctaSubtitle: { fontSize: 18, color: '#94A3B8', marginBottom: 32, textAlign: 'center' },
  ctaButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 18, borderRadius: 8 },
  ctaButtonText: { color: '#1E293B', fontSize: 18, fontWeight: '600' },
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
  textArea: { height: 100, textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  modalCancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  modalSubmitBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, backgroundColor: '#3B82F6' },
  modalSubmitText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
