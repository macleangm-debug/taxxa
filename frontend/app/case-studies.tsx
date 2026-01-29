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

export default function PilotOpportunitiesPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedPilot, setSelectedPilot] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    organization: '',
    email: '',
    country: '',
    message: '',
    pilotType: '',
  });

  const pilotPrograms = [
    {
      id: 'starter',
      name: 'Proof of Concept',
      duration: '30-60 Days',
      description: 'Rapid validation in a controlled environment. See real results before full commitment.',
      icon: 'flask',
      color: '#3B82F6',
      features: [
        'Single region deployment',
        'Full platform access',
        'Integration support',
        'Performance reporting',
        'Dedicated success manager',
      ],
      outcomes: [
        'Validate citizen engagement',
        'Test system integration',
        'Measure compliance lift',
        'Build stakeholder confidence',
      ],
      ideal: 'First step for any Revenue Authority',
    },
    {
      id: 'growth',
      name: 'Regional Rollout',
      duration: '3-6 Months',
      description: 'Expand across multiple regions. Measure real impact on tax revenue with comprehensive analytics.',
      icon: 'trending-up',
      color: '#8B5CF6',
      features: [
        'Multi-region deployment',
        'Advanced analytics dashboard',
        'Custom prize structures',
        'API integration',
        'Marketing support',
        'Quarterly business reviews',
      ],
      outcomes: [
        'Quantify revenue impact',
        'Optimize prize economics',
        'Identify growth opportunities',
        'Prepare for national scale',
      ],
      ideal: 'Proven concept, ready to expand',
    },
    {
      id: 'national',
      name: 'National Program',
      duration: 'Ongoing Partnership',
      description: 'Full national deployment with white-glove support. Designed for maximum impact and long-term success.',
      icon: 'globe',
      color: '#10B981',
      features: [
        'Nationwide deployment',
        'Unlimited capacity',
        'Custom branding & programs',
        'Advanced fraud prevention',
        'Dedicated engineering team',
        'Executive reporting suite',
        'Priority support & SLA',
      ],
      outcomes: [
        'Transform national compliance',
        'Sustainable revenue growth',
        'Long-term citizen engagement',
        'Comprehensive data insights',
      ],
      ideal: 'Full transformation commitment',
    },
  ];

  const projectedBenefits = [
    {
      metric: '15-30%',
      label: 'Projected Revenue Increase',
      description: 'Based on behavioral economics research and similar incentive programs globally',
      icon: 'trending-up',
    },
    {
      metric: '60 Days',
      label: 'Time to First Results',
      description: 'See measurable engagement within the first two months of deployment',
      icon: 'time',
    },
    {
      metric: '10:1',
      label: 'Expected ROI',
      description: 'Prize pool investment typically returns 10x in additional tax collection',
      icon: 'cash',
    },
    {
      metric: '90%+',
      label: 'Target Citizen Satisfaction',
      description: 'Citizens appreciate being rewarded for honest behavior',
      icon: 'happy',
    },
  ];

  const whyPilot = [
    {
      title: 'Zero Risk Validation',
      description: 'Test the concept in your jurisdiction before full commitment. We share the risk.',
      icon: 'shield-checkmark',
    },
    {
      title: 'Data-Driven Decisions',
      description: 'Get real performance data specific to your market to inform your strategy.',
      icon: 'analytics',
    },
    {
      title: 'Build Internal Support',
      description: 'Demonstrate success to stakeholders and secure buy-in for national programs.',
      icon: 'people',
    },
    {
      title: 'Customized Approach',
      description: 'We adapt the program to your legal framework, currency, and cultural context.',
      icon: 'settings',
    },
  ];

  const handleSubmitInquiry = () => {
    alert('Thank you for your interest! Our partnerships team will contact you within 24 hours to discuss pilot opportunities.');
    setShowContactModal(false);
    setContactForm({ name: '', organization: '', email: '', country: '', message: '', pilotType: '' });
  };

  const openPilotModal = (pilotType: string) => {
    setContactForm({ ...contactForm, pilotType });
    setShowContactModal(true);
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
                <Text style={[styles.navLinkText, styles.navLinkTextActive]}>Pilot Programs</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navLink} onPress={() => router.push('/documentation')}>
                <Text style={styles.navLinkText}>Documentation</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButtonPrimary} onPress={() => setShowContactModal(true)}>
                <Text style={styles.navButtonPrimaryText}>Become a Partner</Text>
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
              <Text style={[styles.mobileMenuItemText, styles.mobileMenuItemTextActive]}>Pilot Programs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mobileMenuItem} onPress={() => { setShowMobileMenu(false); router.push('/documentation'); }}>
              <Text style={styles.mobileMenuItemText}>Documentation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mobileMenuCTA} onPress={() => { setShowMobileMenu(false); setShowContactModal(true); }}>
              <Text style={styles.mobileMenuCTAText}>Become a Partner</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Hero Section */}
      <LinearGradient colors={['#0F172A', '#1E3A5F', '#0F172A']} style={[styles.hero, isMobile && styles.heroMobile]}>
        <View style={[styles.heroContent, isMobile && styles.heroContentMobile]}>
          <View style={styles.heroBadge}>
            <Ionicons name="rocket" size={14} color="#60A5FA" />
            <Text style={styles.heroBadgeText}>Limited Partnership Slots Available</Text>
          </View>
          <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
            Be a Pioneer.{'\n'}
            <Text style={styles.heroTitleHighlight}>Lead the Change.</Text>
          </Text>
          <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>
            Join forward-thinking Revenue Authorities transforming tax compliance. 
            Launch a pilot program and see results in your jurisdiction within 60 days.
          </Text>
          <TouchableOpacity style={styles.heroCTA} onPress={() => setShowContactModal(true)}>
            <Ionicons name="calendar" size={20} color="#1E293B" />
            <Text style={styles.heroCTAText}>Apply for Pilot Program</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Projected Benefits */}
      <View style={styles.benefitsSection}>
        <Text style={styles.sectionTitle}>What You Can Expect</Text>
        <Text style={styles.sectionSubtitle}>Projected outcomes based on behavioral economics research</Text>
        
        <View style={[styles.benefitsGrid, isMobile && styles.benefitsGridMobile]}>
          {projectedBenefits.map((benefit, index) => (
            <View key={index} style={[styles.benefitCard, isMobile && styles.benefitCardMobile]}>
              <View style={styles.benefitIconWrap}>
                <Ionicons name={benefit.icon as any} size={24} color="#3B82F6" />
              </View>
              <Text style={styles.benefitMetric}>{benefit.metric}</Text>
              <Text style={styles.benefitLabel}>{benefit.label}</Text>
              <Text style={styles.benefitDescription}>{benefit.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Why Pilot Section */}
      <View style={[styles.section, { backgroundColor: '#F8FAFC' }]}>
        <Text style={styles.sectionTitle}>Why Start With a Pilot?</Text>
        <Text style={styles.sectionSubtitle}>Smart leaders test before they invest</Text>
        
        <View style={[styles.whyGrid, isMobile && styles.whyGridMobile]}>
          {whyPilot.map((item, index) => (
            <View key={index} style={[styles.whyCard, isMobile && styles.whyCardMobile]}>
              <View style={styles.whyIconWrap}>
                <Ionicons name={item.icon as any} size={28} color="#3B82F6" />
              </View>
              <Text style={styles.whyTitle}>{item.title}</Text>
              <Text style={styles.whyDescription}>{item.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Pilot Programs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Your Pilot Program</Text>
        <Text style={styles.sectionSubtitle}>Flexible options to match your readiness level</Text>
        
        <View style={[styles.pilotsGrid, isMobile && styles.pilotsGridMobile]}>
          {pilotPrograms.map((pilot) => (
            <View key={pilot.id} style={[styles.pilotCard, isMobile && styles.pilotCardMobile, { borderTopColor: pilot.color }]}>
              <View style={[styles.pilotIconWrap, { backgroundColor: pilot.color + '15' }]}>
                <Ionicons name={pilot.icon as any} size={32} color={pilot.color} />
              </View>
              <Text style={styles.pilotName}>{pilot.name}</Text>
              <View style={[styles.pilotDuration, { backgroundColor: pilot.color + '15' }]}>
                <Text style={[styles.pilotDurationText, { color: pilot.color }]}>{pilot.duration}</Text>
              </View>
              <Text style={styles.pilotDescription}>{pilot.description}</Text>
              
              <Text style={styles.pilotSectionLabel}>INCLUDES</Text>
              <View style={styles.pilotFeatures}>
                {pilot.features.map((feature, idx) => (
                  <View key={idx} style={styles.pilotFeature}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.pilotFeatureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.pilotSectionLabel}>OUTCOMES</Text>
              <View style={styles.pilotOutcomes}>
                {pilot.outcomes.map((outcome, idx) => (
                  <View key={idx} style={styles.pilotOutcome}>
                    <Ionicons name="arrow-forward" size={14} color={pilot.color} />
                    <Text style={styles.pilotOutcomeText}>{outcome}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.pilotFooter}>
                <TouchableOpacity 
                  style={[styles.pilotCTA, { backgroundColor: pilot.color, flex: 1 }]}
                  onPress={() => openPilotModal(pilot.name)}
                >
                  <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
                  <Text style={styles.pilotCTAText}>Get Pricing</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.pilotIdeal}>{pilot.ideal}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Process Timeline */}
      <View style={[styles.section, { backgroundColor: '#0F172A' }]}>
        <Text style={[styles.sectionTitle, { color: '#fff' }]}>From Application to Launch</Text>
        <Text style={[styles.sectionSubtitle, { color: '#94A3B8' }]}>A streamlined process to get you live quickly</Text>
        
        <View style={[styles.timelineGrid, isMobile && styles.timelineGridMobile]}>
          {[
            { week: 'Week 1-2', title: 'Discovery', description: 'We assess your systems, requirements, and goals', icon: 'search' },
            { week: 'Week 3-4', title: 'Integration', description: 'Connect Taxxa to your Revenue Authority platform', icon: 'git-network' },
            { week: 'Week 5-6', title: 'Configuration', description: 'Set up prize structures, branding, and rules', icon: 'settings' },
            { week: 'Week 7-8', title: 'Launch', description: 'Go live with marketing support and monitoring', icon: 'rocket' },
          ].map((step, index) => (
            <View key={index} style={[styles.timelineStep, isMobile && styles.timelineStepMobile]}>
              <View style={styles.timelineIcon}>
                <Ionicons name={step.icon as any} size={24} color="#3B82F6" />
              </View>
              <Text style={styles.timelineWeek}>{step.week}</Text>
              <Text style={styles.timelineTitle}>{step.title}</Text>
              <Text style={styles.timelineDescription}>{step.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.ctaSection}>
        <Text style={[styles.ctaTitle, isMobile && styles.ctaTitleMobile]}>Ready to Transform Tax Compliance?</Text>
        <Text style={styles.ctaSubtitle}>Limited pilot slots available for 2025. Apply now to secure your position.</Text>
        <View style={[styles.ctaButtons, isMobile && styles.ctaButtonsMobile]}>
          <TouchableOpacity style={styles.ctaButtonPrimary} onPress={() => setShowContactModal(true)}>
            <Ionicons name="paper-plane" size={20} color="#3B82F6" />
            <Text style={styles.ctaButtonPrimaryText}>Apply for Pilot</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctaButtonSecondary} onPress={() => router.push('/demo')}>
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.ctaButtonSecondaryText}>See Demo First</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.trustIndicators}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.trustText}>Enterprise Security</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.trustText}>Data Sovereignty</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="ribbon" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.trustText}>Compliance Ready</Text>
          </View>
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
              <View>
                <Text style={styles.modalTitle}>Apply for Pilot Program</Text>
                {contactForm.pilotType && (
                  <Text style={styles.modalSubtitle}>Selected: {contactForm.pilotType}</Text>
                )}
              </View>
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
                placeholder="Revenue Authority / Ministry name" 
                placeholderTextColor="#94A3B8"
                value={contactForm.organization} 
                onChangeText={(text) => setContactForm({...contactForm, organization: text})} 
              />
              
              <Text style={styles.inputLabel}>Official Email *</Text>
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

              <Text style={styles.inputLabel}>Preferred Pilot Program</Text>
              <View style={styles.pilotSelector}>
                {['Discovery Pilot', 'Scale Pilot', 'National Pilot'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.pilotOption,
                      contactForm.pilotType === type && styles.pilotOptionActive
                    ]}
                    onPress={() => setContactForm({...contactForm, pilotType: type})}
                  >
                    <Text style={[
                      styles.pilotOptionText,
                      contactForm.pilotType === type && styles.pilotOptionTextActive
                    ]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.inputLabel}>Tell us about your goals</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="What challenges are you facing? What outcomes are you hoping to achieve?" 
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
                <Text style={styles.modalSubmitText}>Submit Application</Text>
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
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(251, 191, 36, 0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 24 },
  heroBadgeText: { color: '#FCD34D', fontSize: 14, fontWeight: '600' },
  heroTitle: { fontSize: 52, fontWeight: '800', color: '#fff', marginBottom: 20, lineHeight: 60 },
  heroTitleMobile: { fontSize: 32, lineHeight: 40, textAlign: 'center' },
  heroTitleHighlight: { color: '#60A5FA' },
  heroSubtitle: { fontSize: 20, color: '#94A3B8', lineHeight: 32, marginBottom: 32 },
  heroSubtitleMobile: { fontSize: 16, textAlign: 'center', lineHeight: 26 },
  heroCTA: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', paddingHorizontal: 28, paddingVertical: 16, borderRadius: 8 },
  heroCTAText: { color: '#1E293B', fontSize: 17, fontWeight: '600' },
  // Benefits
  benefitsSection: { paddingVertical: 60, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 36, fontWeight: '700', color: '#1E293B', textAlign: 'center', marginBottom: 12 },
  sectionSubtitle: { fontSize: 18, color: '#64748B', textAlign: 'center', marginBottom: 48 },
  benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center', maxWidth: 1100, alignSelf: 'center' },
  benefitsGridMobile: { flexDirection: 'column' },
  benefitCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 24, width: 240, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  benefitCardMobile: { width: '100%' },
  benefitIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  benefitMetric: { fontSize: 36, fontWeight: '700', color: '#1E293B' },
  benefitLabel: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginTop: 4, textAlign: 'center' },
  benefitDescription: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  // Why
  section: { paddingVertical: 60, paddingHorizontal: 24 },
  whyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center', maxWidth: 1000, alignSelf: 'center' },
  whyGridMobile: { flexDirection: 'column' },
  whyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 220, borderWidth: 1, borderColor: '#E2E8F0' },
  whyCardMobile: { width: '100%' },
  whyIconWrap: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  whyTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  whyDescription: { fontSize: 14, color: '#64748B', lineHeight: 22 },
  // Pilots
  pilotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, justifyContent: 'center', maxWidth: 1200, alignSelf: 'center' },
  pilotsGridMobile: { flexDirection: 'column' },
  pilotCard: { backgroundColor: '#fff', borderRadius: 16, padding: 28, width: 340, borderWidth: 1, borderColor: '#E2E8F0', borderTopWidth: 4 },
  pilotCardMobile: { width: '100%' },
  pilotIconWrap: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  pilotName: { fontSize: 24, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  pilotDuration: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  pilotDurationText: { fontSize: 14, fontWeight: '600' },
  pilotDescription: { fontSize: 15, color: '#64748B', lineHeight: 24, marginBottom: 20 },
  pilotSectionLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  pilotFeatures: { gap: 8, marginBottom: 16 },
  pilotFeature: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pilotFeatureText: { fontSize: 14, color: '#475569' },
  pilotOutcomes: { gap: 8, marginBottom: 20 },
  pilotOutcome: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pilotOutcomeText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  pilotFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  pilotInvestmentLabel: { fontSize: 12, color: '#94A3B8' },
  pilotInvestment: { fontSize: 16, fontWeight: '700' },
  pilotCTA: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  pilotCTAText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  pilotIdeal: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic', marginTop: 16 },
  // Timeline
  timelineGrid: { flexDirection: 'row', gap: 20, justifyContent: 'center', maxWidth: 1000, alignSelf: 'center' },
  timelineGridMobile: { flexDirection: 'column' },
  timelineStep: { alignItems: 'center', width: 200 },
  timelineStepMobile: { width: '100%', flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  timelineIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  timelineWeek: { fontSize: 13, color: '#60A5FA', fontWeight: '600', marginBottom: 4 },
  timelineTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  timelineDescription: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 22 },
  // CTA
  ctaSection: { padding: 60, alignItems: 'center' },
  ctaTitle: { fontSize: 36, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 12 },
  ctaTitleMobile: { fontSize: 28 },
  ctaSubtitle: { fontSize: 18, color: 'rgba(255,255,255,0.85)', marginBottom: 32, textAlign: 'center' },
  ctaButtons: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  ctaButtonsMobile: { flexDirection: 'column', width: '100%', alignItems: 'center' },
  ctaButtonPrimary: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', paddingHorizontal: 28, paddingVertical: 16, borderRadius: 8 },
  ctaButtonPrimaryText: { color: '#3B82F6', fontSize: 17, fontWeight: '600' },
  ctaButtonSecondary: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 8, borderWidth: 2, borderColor: '#fff' },
  ctaButtonSecondaryText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  trustIndicators: { flexDirection: 'row', gap: 24, flexWrap: 'wrap', justifyContent: 'center' },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  // Footer
  footer: { backgroundColor: '#0F172A', paddingVertical: 32, paddingHorizontal: 24 },
  footerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, alignSelf: 'center', width: '100%' },
  footerContentMobile: { flexDirection: 'column', gap: 16 },
  footerLogo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerLogoText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  footerText: { color: '#64748B', fontSize: 14 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90%' },
  modalContentMobile: { maxWidth: '100%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  modalSubtitle: { fontSize: 14, color: '#3B82F6', marginTop: 4 },
  modalBody: { padding: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 14, fontSize: 16, color: '#1E293B' },
  textArea: { height: 100, textAlignVertical: 'top' },
  pilotSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  pilotOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  pilotOptionActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  pilotOptionText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  pilotOptionTextActive: { color: '#3B82F6' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  modalCancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  modalSubmitBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, backgroundColor: '#3B82F6' },
  modalSubmitText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
