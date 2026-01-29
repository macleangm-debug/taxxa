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

export default function CaseStudiesPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [expandedStudy, setExpandedStudy] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    organization: '',
    email: '',
    country: '',
    message: '',
  });

  const caseStudies = [
    {
      id: 1,
      country: 'Kenya',
      flag: '🇰🇪',
      authority: 'Kenya Revenue Authority (KRA)',
      program: 'EjijiPay Receipt Lottery',
      tagline: 'From Compliance Problem to Citizen Movement',
      revenueIncrease: '+23%',
      users: '1.2M',
      receipts: '15M+',
      duration: '18 months',
      color: '#059669',
      challenge: 'Up to 40% of retail transactions were going unreported. Citizens had no incentive to request receipts.',
      solution: 'Launched app + web scanning with weekly cash draws and monthly grand prizes including vehicles.',
      results: [
        { label: 'VAT Revenue', value: '+23%', detail: 'Year-over-year increase' },
        { label: 'Compliance Rate', value: '92%', detail: 'Up from 67%' },
        { label: 'Cost per Collection', value: '-45%', detail: 'Enforcement savings' },
      ],
      quote: '"Citizens now actively demand receipts. We turned consumers into our compliance partners."',
      quoteAuthor: 'Commissioner General, KRA',
    },
    {
      id: 2,
      country: 'Tanzania',
      flag: '🇹🇿',
      authority: 'Tanzania Revenue Authority (TRA)',
      program: 'Bahati Yangu (My Luck)',
      tagline: 'Real-Time Visibility, Real Results',
      revenueIncrease: '+18%',
      users: '850K',
      receipts: '9M+',
      duration: '12 months',
      color: '#2563EB',
      challenge: 'Cash-based economy with limited transaction visibility. Manual audits were expensive and slow.',
      solution: 'Implemented browser-based scanning for maximum reach. Focus on urban retail centers.',
      results: [
        { label: 'Daily Scans', value: '45K', detail: 'Average per day' },
        { label: 'Fraud Cases', value: '2,400', detail: 'Non-compliance detected' },
        { label: 'Audit Costs', value: '-60%', detail: 'Reduction in manual audits' },
      ],
      quote: '"The real-time data changed everything. We can now see transaction patterns instantly."',
      quoteAuthor: 'Director of Domestic Revenue, TRA',
    },
    {
      id: 3,
      country: 'Rwanda',
      flag: '🇷🇼',
      authority: 'Rwanda Revenue Authority (RRA)',
      program: 'Sobanukirwa Initiative',
      tagline: 'Digital-First, Results-Fast',
      revenueIncrease: '+31%',
      users: '620K',
      receipts: '12M+',
      duration: '24 months',
      color: '#7C3AED',
      challenge: 'EBM system had good coverage but citizen engagement was low.',
      solution: 'Seamless integration with existing EBM infrastructure. Direct database validation.',
      results: [
        { label: 'Revenue Increase', value: '+31%', detail: 'Highest in our network' },
        { label: 'Validation Speed', value: '<1s', detail: 'Real-time processing' },
        { label: 'Annual Savings', value: '$2.4M', detail: 'Enforcement cost reduction' },
      ],
      quote: '"Integration was seamless. Taxxa enhanced our existing systems rather than replacing them."',
      quoteAuthor: 'Deputy Commissioner, RRA',
    },
    {
      id: 4,
      country: 'Uganda',
      flag: '🇺🇬',
      authority: 'Uganda Revenue Authority (URA)',
      program: 'EFRIS Rewards',
      tagline: 'Citizen-Driven Merchant Compliance',
      revenueIncrease: '+15%',
      users: '480K',
      receipts: '6M+',
      duration: '10 months',
      color: '#DC2626',
      challenge: 'EFRIS adoption among merchants was slow. Needed consumer-side pressure.',
      solution: 'Incentivized consumers to specifically request EFRIS-compliant receipts.',
      results: [
        { label: 'EFRIS Adoption', value: '+45%', detail: 'Merchant registration increase' },
        { label: 'Receipt Requests', value: '3x', detail: 'Consumer demand increase' },
        { label: 'Program ROI', value: '12:1', detail: 'Return on prize investment' },
      ],
      quote: '"The behavioral change has been remarkable. Consumers now understand their role."',
      quoteAuthor: 'Commissioner General, URA',
    },
  ];

  const aggregateStats = [
    { value: '3.1M+', label: 'Active Citizens', icon: 'people' },
    { value: '42M+', label: 'Receipts Scanned', icon: 'document-text' },
    { value: '22%', label: 'Avg Revenue Increase', icon: 'trending-up' },
    { value: '8', label: 'Countries Live', icon: 'globe' },
  ];

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
              <TouchableOpacity style={[styles.navLink, styles.navLinkActive]} onPress={() => router.push('/case-studies')}>
                <Text style={[styles.navLinkText, styles.navLinkTextActive]}>Case Studies</Text>
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
              <Text style={[styles.mobileMenuItemText, styles.mobileMenuItemTextActive]}>Case Studies</Text>
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
            <Ionicons name="trophy" size={14} color="#60A5FA" />
            <Text style={styles.heroBadgeText}>Proven Track Record</Text>
          </View>
          <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
            Real Countries.{'\n'}
            <Text style={styles.heroTitleHighlight}>Real Results.</Text>
          </Text>
          <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>
            Don't take our word for it. See how Revenue Authorities across Africa are using Taxxa 
            to transform tax compliance and boost collection rates.
          </Text>
        </View>
      </LinearGradient>

      {/* Aggregate Stats */}
      <View style={styles.statsSection}>
        <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
          {aggregateStats.map((stat, index) => (
            <View key={index} style={[styles.statCard, isMobile && styles.statCardMobile]}>
              <Ionicons name={stat.icon as any} size={24} color="#3B82F6" />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Case Studies */}
      <View style={styles.studiesSection}>
        <Text style={styles.sectionTitle}>Success Stories</Text>
        <Text style={styles.sectionSubtitle}>Click any card to see the full story</Text>
        
        {caseStudies.map((study) => (
          <TouchableOpacity
            key={study.id}
            style={styles.studyCard}
            onPress={() => setExpandedStudy(expandedStudy === study.id ? null : study.id)}
            activeOpacity={0.95}
          >
            {/* Header */}
            <View style={[styles.studyHeader, isMobile && styles.studyHeaderMobile]}>
              <View style={styles.studyHeaderLeft}>
                <Text style={styles.studyFlag}>{study.flag}</Text>
                <View>
                  <Text style={styles.studyCountry}>{study.country}</Text>
                  <Text style={styles.studyAuthority}>{study.authority}</Text>
                </View>
              </View>
              <View style={[styles.studyBadge, { backgroundColor: study.color + '15' }]}>
                <Text style={[styles.studyBadgeText, { color: study.color }]}>{study.revenueIncrease} Revenue</Text>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.studyProgram}>{study.program}</Text>
            <Text style={styles.studyTagline}>{study.tagline}</Text>

            {/* Quick Stats */}
            <View style={[styles.quickStats, isMobile && styles.quickStatsMobile]}>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{study.users}</Text>
                <Text style={styles.quickStatLabel}>Citizens</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{study.receipts}</Text>
                <Text style={styles.quickStatLabel}>Receipts</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{study.duration}</Text>
                <Text style={styles.quickStatLabel}>Duration</Text>
              </View>
            </View>

            {/* Expanded Content */}
            {expandedStudy === study.id && (
              <View style={styles.expandedContent}>
                <View style={styles.divider} />
                
                <Text style={styles.expandedLabel}>THE CHALLENGE</Text>
                <Text style={styles.expandedText}>{study.challenge}</Text>
                
                <Text style={styles.expandedLabel}>OUR SOLUTION</Text>
                <Text style={styles.expandedText}>{study.solution}</Text>
                
                <Text style={styles.expandedLabel}>KEY RESULTS</Text>
                <View style={[styles.resultsGrid, isMobile && styles.resultsGridMobile]}>
                  {study.results.map((result, index) => (
                    <View key={index} style={[styles.resultCard, isMobile && styles.resultCardMobile, { borderLeftColor: study.color }]}>
                      <Text style={[styles.resultValue, { color: study.color }]}>{result.value}</Text>
                      <Text style={styles.resultLabel}>{result.label}</Text>
                      <Text style={styles.resultDetail}>{result.detail}</Text>
                    </View>
                  ))}
                </View>

                {/* Quote */}
                <View style={[styles.quoteCard, { backgroundColor: study.color + '10' }]}>
                  <Ionicons name="chatbox-ellipses" size={24} color={study.color} />
                  <Text style={styles.quoteText}>{study.quote}</Text>
                  <Text style={[styles.quoteAuthor, { color: study.color }]}>— {study.quoteAuthor}</Text>
                </View>
              </View>
            )}

            {/* Expand Indicator */}
            <View style={styles.expandIndicator}>
              <Ionicons name={expandedStudy === study.id ? 'chevron-up' : 'chevron-down'} size={20} color="#64748B" />
              <Text style={styles.expandText}>{expandedStudy === study.id ? 'Show Less' : 'Read Full Story'}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA Section */}
      <LinearGradient colors={['#1E3A5F', '#0F172A']} style={styles.ctaSection}>
        <Text style={[styles.ctaTitle, isMobile && styles.ctaTitleMobile]}>Want Similar Results?</Text>
        <Text style={styles.ctaSubtitle}>Let's discuss how Taxxa can work for your jurisdiction</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => setShowContactModal(true)}>
          <Ionicons name="calendar" size={20} color="#1E293B" />
          <Text style={styles.ctaButtonText}>Schedule Consultation</Text>
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
  // Stats
  statsSection: { paddingVertical: 40, paddingHorizontal: 24, marginTop: -40, zIndex: 10 },
  statsGrid: { flexDirection: 'row', justifyContent: 'center', gap: 16, maxWidth: 900, alignSelf: 'center' },
  statsGridMobile: { flexDirection: 'column' },
  statCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', flex: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  statCardMobile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: '700', color: '#1E293B', marginTop: 8 },
  statLabel: { fontSize: 14, color: '#64748B', marginTop: 4 },
  // Studies Section
  studiesSection: { paddingHorizontal: 24, paddingBottom: 48, maxWidth: 900, alignSelf: 'center', width: '100%' },
  sectionTitle: { fontSize: 36, fontWeight: '700', color: '#1E293B', textAlign: 'center', marginBottom: 12, marginTop: 24 },
  sectionSubtitle: { fontSize: 18, color: '#64748B', textAlign: 'center', marginBottom: 32 },
  // Study Card
  studyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  studyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  studyHeaderMobile: { flexDirection: 'column', gap: 12 },
  studyHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  studyFlag: { fontSize: 40 },
  studyCountry: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  studyAuthority: { fontSize: 13, color: '#64748B' },
  studyBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  studyBadgeText: { fontSize: 14, fontWeight: '700' },
  studyProgram: { fontSize: 24, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  studyTagline: { fontSize: 16, color: '#64748B', marginBottom: 20 },
  // Quick Stats
  quickStats: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16 },
  quickStatsMobile: { flexDirection: 'column', gap: 12 },
  quickStat: { flex: 1, alignItems: 'center' },
  quickStatValue: { fontSize: 22, fontWeight: '700', color: '#1E293B' },
  quickStatLabel: { fontSize: 13, color: '#64748B', marginTop: 2 },
  quickStatDivider: { width: 1, backgroundColor: '#E2E8F0' },
  // Expanded
  expandedContent: { marginTop: 16 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginBottom: 20 },
  expandedLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  expandedText: { fontSize: 15, color: '#475569', lineHeight: 24 },
  resultsGrid: { flexDirection: 'row', gap: 12, marginTop: 12 },
  resultsGridMobile: { flexDirection: 'column' },
  resultCard: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, borderLeftWidth: 4 },
  resultCardMobile: { flex: 0 },
  resultValue: { fontSize: 28, fontWeight: '700' },
  resultLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginTop: 4 },
  resultDetail: { fontSize: 12, color: '#64748B', marginTop: 2 },
  quoteCard: { borderRadius: 12, padding: 20, marginTop: 20 },
  quoteText: { fontSize: 16, fontStyle: 'italic', color: '#475569', lineHeight: 26, marginTop: 12 },
  quoteAuthor: { fontSize: 14, fontWeight: '600', marginTop: 12 },
  // Expand Indicator
  expandIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  expandText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
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
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  modalCancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  modalSubmitBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, backgroundColor: '#3B82F6' },
  modalSubmitText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
