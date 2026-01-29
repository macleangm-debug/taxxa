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

export default function HowItWorksPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'citizen' | 'authority'>('citizen');
  const [contactForm, setContactForm] = useState({
    name: '',
    organization: '',
    email: '',
    country: '',
    message: '',
  });

  const citizenSteps = [
    {
      step: 1,
      title: 'Get Access Instantly',
      description: 'Download the app OR simply visit our web scanner. No account required for basic scanning.',
      icon: 'flash',
      highlight: 'App or Browser - Your Choice',
    },
    {
      step: 2,
      title: 'Shop & Get Receipt',
      description: 'Make any purchase and request your tax receipt. The QR code contains all the data we need.',
      icon: 'cart',
      highlight: 'Every Receipt Counts',
    },
    {
      step: 3,
      title: 'Scan the QR Code',
      description: 'Point your camera at the QR code. We validate it directly with the Revenue Authority in under 1 second.',
      icon: 'qr-code',
      highlight: 'Real-Time Validation',
    },
    {
      step: 4,
      title: 'Win Big Prizes',
      description: 'Every valid scan enters you into weekly and monthly draws. Cash, cars, houses - real prizes, real winners.',
      icon: 'trophy',
      highlight: 'Life-Changing Rewards',
    },
  ];

  const authoritySteps = [
    {
      step: 1,
      title: 'Connect Your Platform',
      description: 'We integrate directly with your existing Revenue Authority systems. Your data, your rules, our technology.',
      icon: 'git-network',
      highlight: '2-4 Week Integration',
    },
    {
      step: 2,
      title: 'Configure Your Program',
      description: 'Set prize structures, draw frequencies, and eligibility rules. Full control through admin dashboard.',
      icon: 'settings',
      highlight: 'Your Rules Apply',
    },
    {
      step: 3,
      title: 'Launch & Promote',
      description: 'We provide marketing materials and launch support. Citizens start scanning, you start seeing results.',
      icon: 'megaphone',
      highlight: 'Full Launch Support',
    },
    {
      step: 4,
      title: 'Monitor & Grow',
      description: 'Real-time dashboards show compliance rates, scan volumes, and revenue impact. Optimize as you go.',
      icon: 'analytics',
      highlight: 'Measurable ROI',
    },
  ];

  const steps = activeTab === 'citizen' ? citizenSteps : authoritySteps;

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
              <TouchableOpacity style={[styles.navLink, styles.navLinkActive]} onPress={() => router.push('/how-it-works')}>
                <Text style={[styles.navLinkText, styles.navLinkTextActive]}>How It Works</Text>
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
            <TouchableOpacity style={styles.mobileMenuItem} onPress={() => { setShowMobileMenu(false); router.push('/solution'); }}>
              <Text style={styles.mobileMenuItemText}>Solution</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.mobileMenuItem, styles.mobileMenuItemActive]} onPress={() => setShowMobileMenu(false)}>
              <Text style={[styles.mobileMenuItemText, styles.mobileMenuItemTextActive]}>How It Works</Text>
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
            <Ionicons name="bulb" size={14} color="#60A5FA" />
            <Text style={styles.heroBadgeText}>Simple Yet Powerful</Text>
          </View>
          <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
            Scan a Receipt.{'\n'}
            <Text style={styles.heroTitleHighlight}>Change a Nation.</Text>
          </Text>
          <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>
            No complex setup. No merchant integration. Just citizens scanning receipts and tax revenue growing. 
            Here's how the magic happens.
          </Text>
        </View>
      </LinearGradient>

      {/* Tab Selector */}
      <View style={styles.tabSection}>
        <View style={[styles.tabContainer, isMobile && styles.tabContainerMobile]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'citizen' && styles.tabActive]}
            onPress={() => setActiveTab('citizen')}
          >
            <Ionicons name="people" size={20} color={activeTab === 'citizen' ? '#fff' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'citizen' && styles.tabTextActive]}>For Citizens</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'authority' && styles.tabActive]}
            onPress={() => setActiveTab('authority')}
          >
            <Ionicons name="business" size={20} color={activeTab === 'authority' ? '#fff' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'authority' && styles.tabTextActive]}>For Revenue Authorities</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Steps */}
      <View style={styles.stepsSection}>
        <View style={[styles.stepsGrid, isMobile && styles.stepsGridMobile]}>
          {steps.map((item, index) => (
            <View key={index} style={[styles.stepCard, isMobile && styles.stepCardMobile]}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{item.step}</Text>
                </View>
                <View style={styles.stepIconContainer}>
                  <Ionicons name={item.icon as any} size={28} color="#3B82F6" />
                </View>
              </View>
              <Text style={styles.stepTitle}>{item.title}</Text>
              <Text style={styles.stepDescription}>{item.description}</Text>
              <View style={styles.stepHighlight}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.stepHighlightText}>{item.highlight}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Key Differentiator */}
      <View style={styles.differentiatorSection}>
        <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.differentiatorCard}>
          <Ionicons name="shield-checkmark" size={48} color="#fff" />
          <Text style={styles.differentiatorTitle}>Direct Revenue Authority Connection</Text>
          <Text style={styles.differentiatorText}>
            Unlike other systems, Taxxa doesn't require merchants to do anything. The QR code on every tax 
            receipt already contains the transaction data. We validate it directly against your Revenue Authority 
            database. Zero merchant friction. 100% accuracy.
          </Text>
        </LinearGradient>
      </View>

      {/* Scanning Options */}
      <View style={[styles.section, { backgroundColor: '#F8FAFC' }]}>
        <Text style={styles.sectionTitle}>Multiple Ways to Scan</Text>
        <Text style={styles.sectionSubtitle}>Citizens choose what works best for them</Text>
        
        <View style={[styles.optionsGrid, isMobile && styles.optionsGridMobile]}>
          <View style={[styles.optionCard, isMobile && styles.optionCardMobile]}>
            <View style={styles.optionIconWrap}>
              <Ionicons name="phone-portrait" size={32} color="#3B82F6" />
            </View>
            <Text style={styles.optionTitle}>Mobile App</Text>
            <Text style={styles.optionDescription}>Full features including offline mode, push notifications, and entry history</Text>
            <View style={styles.optionFeatures}>
              <View style={styles.optionFeature}>
                <Ionicons name="cloud-offline" size={14} color="#10B981" />
                <Text style={styles.optionFeatureText}>Works Offline</Text>
              </View>
              <View style={styles.optionFeature}>
                <Ionicons name="notifications" size={14} color="#10B981" />
                <Text style={styles.optionFeatureText}>Win Alerts</Text>
              </View>
            </View>
          </View>
          
          <View style={[styles.optionCard, isMobile && styles.optionCardMobile]}>
            <View style={styles.optionIconWrap}>
              <Ionicons name="globe" size={32} color="#8B5CF6" />
            </View>
            <Text style={styles.optionTitle}>Web Browser</Text>
            <Text style={styles.optionDescription}>Instant access from any device. No download required. Perfect for quick scans</Text>
            <View style={styles.optionFeatures}>
              <View style={styles.optionFeature}>
                <Ionicons name="flash" size={14} color="#10B981" />
                <Text style={styles.optionFeatureText}>No Install</Text>
              </View>
              <View style={styles.optionFeature}>
                <Ionicons name="desktop" size={14} color="#10B981" />
                <Text style={styles.optionFeatureText}>Any Device</Text>
              </View>
            </View>
          </View>
          
          <View style={[styles.optionCard, isMobile && styles.optionCardMobile]}>
            <View style={styles.optionIconWrap}>
              <Ionicons name="chatbubbles" size={32} color="#F59E0B" />
            </View>
            <Text style={styles.optionTitle}>USSD / SMS</Text>
            <Text style={styles.optionDescription}>For areas with limited internet. Text the receipt code and participate instantly</Text>
            <View style={styles.optionFeatures}>
              <View style={styles.optionFeature}>
                <Ionicons name="wifi" size={14} color="#10B981" />
                <Text style={styles.optionFeatureText}>No Internet</Text>
              </View>
              <View style={styles.optionFeature}>
                <Ionicons name="phone-portrait" size={14} color="#10B981" />
                <Text style={styles.optionFeatureText}>Any Phone</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <LinearGradient colors={['#1E3A5F', '#0F172A']} style={styles.ctaSection}>
        <Text style={[styles.ctaTitle, isMobile && styles.ctaTitleMobile]}>See It In Action</Text>
        <Text style={styles.ctaSubtitle}>Book a personalized demo with our team</Text>
        <View style={[styles.ctaButtons, isMobile && styles.ctaButtonsMobile]}>
          <TouchableOpacity style={styles.ctaButtonPrimary} onPress={() => setShowContactModal(true)}>
            <Ionicons name="calendar" size={20} color="#1E293B" />
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
  hero: { paddingVertical: 80, paddingHorizontal: 24 },
  heroMobile: { paddingVertical: 48 },
  heroContent: { maxWidth: 800, alignSelf: 'center' },
  heroContentMobile: { alignItems: 'center' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 24 },
  heroBadgeText: { color: '#60A5FA', fontSize: 14, fontWeight: '600' },
  heroTitle: { fontSize: 52, fontWeight: '800', color: '#fff', marginBottom: 20, lineHeight: 60 },
  heroTitleMobile: { fontSize: 32, lineHeight: 40, textAlign: 'center' },
  heroTitleHighlight: { color: '#60A5FA' },
  heroSubtitle: { fontSize: 20, color: '#94A3B8', lineHeight: 32 },
  heroSubtitleMobile: { fontSize: 16, textAlign: 'center', lineHeight: 26 },
  // Tabs
  tabSection: { paddingVertical: 32, paddingHorizontal: 24 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, maxWidth: 500, alignSelf: 'center' },
  tabContainerMobile: { flexDirection: 'column' },
  tab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 10, flex: 1 },
  tabActive: { backgroundColor: '#3B82F6' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#fff' },
  // Steps
  stepsSection: { paddingHorizontal: 16, paddingBottom: 48 },
  stepsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 960, alignSelf: 'center', width: '100%' },
  stepsGridMobile: { flexDirection: 'column' },
  stepCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, width: 220, borderWidth: 1, borderColor: '#E2E8F0' },
  stepCardMobile: { width: '100%' },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  stepNumber: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  stepIconContainer: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  stepDescription: { fontSize: 15, color: '#64748B', lineHeight: 24, marginBottom: 16 },
  stepHighlight: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  stepHighlightText: { fontSize: 13, fontWeight: '600', color: '#166534' },
  // Differentiator
  differentiatorSection: { paddingHorizontal: 24, paddingBottom: 48 },
  differentiatorCard: { borderRadius: 20, padding: 40, alignItems: 'center', maxWidth: 800, alignSelf: 'center' },
  differentiatorTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 16, marginBottom: 12, textAlign: 'center' },
  differentiatorText: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 26 },
  // Section
  section: { paddingVertical: 60, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 36, fontWeight: '700', color: '#1E293B', textAlign: 'center', marginBottom: 12 },
  sectionSubtitle: { fontSize: 18, color: '#64748B', textAlign: 'center', marginBottom: 48 },
  // Options
  optionsGrid: { flexDirection: 'row', gap: 24, justifyContent: 'center', maxWidth: 1000, alignSelf: 'center' },
  optionsGridMobile: { flexDirection: 'column' },
  optionCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 28, borderWidth: 1, borderColor: '#E2E8F0' },
  optionCardMobile: { flex: 0 },
  optionIconWrap: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  optionTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  optionDescription: { fontSize: 15, color: '#64748B', lineHeight: 24, marginBottom: 16 },
  optionFeatures: { flexDirection: 'row', gap: 16 },
  optionFeature: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  optionFeatureText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  // CTA
  ctaSection: { padding: 60, alignItems: 'center' },
  ctaTitle: { fontSize: 36, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 12 },
  ctaTitleMobile: { fontSize: 28 },
  ctaSubtitle: { fontSize: 18, color: '#94A3B8', marginBottom: 32, textAlign: 'center' },
  ctaButtons: { flexDirection: 'row', gap: 16 },
  ctaButtonsMobile: { flexDirection: 'column', width: '100%', alignItems: 'center' },
  ctaButtonPrimary: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', paddingHorizontal: 28, paddingVertical: 16, borderRadius: 8 },
  ctaButtonPrimaryText: { color: '#1E293B', fontSize: 17, fontWeight: '600' },
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
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 14, fontSize: 16, color: '#1E293B' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  modalCancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  modalSubmitBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, backgroundColor: '#3B82F6' },
  modalSubmitText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
