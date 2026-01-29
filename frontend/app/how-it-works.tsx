import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function HowItWorksPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [activeTab, setActiveTab] = useState<'citizen' | 'authority'>('citizen');

  const citizenSteps = [
    {
      step: 1,
      title: 'Download the App',
      description: 'Citizens download the free Taxxa app from the App Store or Google Play and create an account using their phone number.',
      icon: 'download',
      details: ['Available on iOS and Android', 'Quick OTP verification', 'No credit card required'],
    },
    {
      step: 2,
      title: 'Make a Purchase',
      description: 'When making any retail purchase, the citizen requests an official tax receipt from the merchant.',
      icon: 'cart',
      details: ['Works with any registered merchant', 'All receipt values qualify', 'Higher values = more entries'],
    },
    {
      step: 3,
      title: 'Scan the QR Code',
      description: 'Using the app, scan the QR code printed on the tax receipt. The system validates the receipt in real-time.',
      icon: 'qr-code',
      details: ['Instant validation', 'Duplicate detection', 'Fraud prevention'],
    },
    {
      step: 4,
      title: 'Earn Entries',
      description: 'Valid receipts earn draw entries. The number of entries depends on the purchase value and any active promotions.',
      icon: 'ticket',
      details: ['1 entry per valid receipt', 'Bonus for high-value purchases', 'Referral bonuses available'],
    },
    {
      step: 5,
      title: 'Win Prizes',
      description: 'Weekly and monthly draws select winners from all valid entries. Prizes range from cash to vehicles and property.',
      icon: 'trophy',
      details: ['Transparent draw process', 'Cryptographically secure', 'Publicly auditable'],
    },
  ];

  const authoritySteps = [
    {
      step: 1,
      title: 'Platform Setup',
      description: 'Taxxa team works with your IT department to configure the platform for your jurisdiction\'s requirements.',
      icon: 'settings',
      details: ['Custom branding', 'Integration with existing systems', 'Staff training included'],
    },
    {
      step: 2,
      title: 'Merchant Registration',
      description: 'Registered merchants receive QR code-enabled receipt printers or software integration for their existing systems.',
      icon: 'business',
      details: ['POS integration available', 'QR receipt templates', 'Compliance monitoring'],
    },
    {
      step: 3,
      title: 'Launch Campaign',
      description: 'Public awareness campaign announces the program. Citizens download the app and begin scanning receipts.',
      icon: 'megaphone',
      details: ['Marketing support', 'Launch event coordination', 'Media materials provided'],
    },
    {
      step: 4,
      title: 'Monitor Compliance',
      description: 'Real-time dashboard shows receipt volumes, merchant activity, and compliance metrics across the jurisdiction.',
      icon: 'stats-chart',
      details: ['Real-time analytics', 'Anomaly detection', 'Merchant scoring'],
    },
    {
      step: 5,
      title: 'Conduct Draws',
      description: 'Regular prize draws are conducted with full transparency. Winners are verified and prizes disbursed.',
      icon: 'gift',
      details: ['Automated draw process', 'Winner verification', 'Prize tracking'],
    },
    {
      step: 6,
      title: 'Analyze & Optimize',
      description: 'Detailed reports show program impact on tax revenue and compliance. Optimize prize structures and targeting.',
      icon: 'analytics',
      details: ['Revenue impact reports', 'Behavioral insights', 'Program optimization'],
    },
  ];

  const steps = activeTab === 'citizen' ? citizenSteps : authoritySteps;

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
            <Text style={styles.logoSubtext}>Enterprise</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.hero}>
        <View style={[styles.heroContent, isMobile && styles.heroContentMobile]}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>HOW IT WORKS</Text>
          </View>
          <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
            Simple for Citizens,{"\n"}
            <Text style={styles.heroTitleAccent}>Powerful for Authorities</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Taxxa creates a win-win ecosystem where citizens are rewarded for compliance while tax authorities gain unprecedented visibility.
          </Text>
        </View>
      </LinearGradient>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <View style={[styles.tabWrapper, isMobile && styles.tabWrapperMobile]}>
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
            <Text style={[styles.tabText, activeTab === 'authority' && styles.tabTextActive]}>For Tax Authorities</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Steps */}
      <View style={styles.stepsSection}>
        <View style={styles.stepsContainer}>
          {steps.map((item, index) => (
            <View key={index} style={[styles.stepCard, isMobile && styles.stepCardMobile]}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{item.step}</Text>
                </View>
                <View style={styles.stepIconContainer}>
                  <Ionicons name={item.icon as any} size={28} color="#4F46E5" />
                </View>
              </View>
              <Text style={styles.stepTitle}>{item.title}</Text>
              <Text style={styles.stepDescription}>{item.description}</Text>
              <View style={styles.stepDetails}>
                {item.details.map((detail, dIndex) => (
                  <View key={dIndex} style={styles.detailItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.detailText}>{detail}</Text>
                  </View>
                ))}
              </View>
              {index < steps.length - 1 && !isMobile && (
                <View style={styles.connector}>
                  <Ionicons name="arrow-forward" size={24} color="#CBD5E1" />
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Video Placeholder */}
      <View style={styles.videoSection}>
        <Text style={styles.videoTitle}>See It In Action</Text>
        <TouchableOpacity style={styles.videoPlaceholder} onPress={() => router.push('/demo')}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={48} color="#fff" />
          </View>
          <Text style={styles.videoLabel}>Watch Interactive Demo</Text>
        </TouchableOpacity>
      </View>

      {/* FAQ Section */}
      <View style={styles.faqSection}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={[styles.faqGrid, isMobile && styles.faqGridMobile]}>
          {[
            { q: 'How long does implementation take?', a: 'Typical implementation takes 4-8 weeks depending on integration requirements.' },
            { q: 'What receipt formats are supported?', a: 'We support QR codes, barcodes, and machine-readable formats from major POS systems.' },
            { q: 'How are winners selected?', a: 'Winners are selected using a cryptographically secure random algorithm that is publicly auditable.' },
            { q: 'What happens to the transaction data?', a: 'Data is encrypted and stored securely. Tax authorities receive anonymized analytics unless specific investigations require detail.' },
          ].map((faq, index) => (
            <View key={index} style={[styles.faqCard, isMobile && styles.faqCardMobile]}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
        <Text style={styles.ctaSubtitle}>Let us show you how Taxxa can work for your jurisdiction</Text>
        <View style={[styles.ctaButtons, isMobile && styles.ctaButtonsMobile]}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/landing')}>
            <Ionicons name="calendar" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Schedule Demo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/documentation')}>
            <Text style={styles.secondaryButtonText}>View Documentation</Text>
          </TouchableOpacity>
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
    color: '#10B981',
    fontWeight: '500',
  },
  hero: {
    padding: 40,
    paddingTop: 60,
    paddingBottom: 60,
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
    marginBottom: 24,
  },
  badgeText: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    lineHeight: 50,
  },
  heroTitleMobile: {
    fontSize: 28,
    lineHeight: 36,
  },
  heroTitleAccent: {
    color: '#A5B4FC',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#94A3B8',
    lineHeight: 28,
  },
  tabContainer: {
    padding: 24,
    alignItems: 'center',
  },
  tabWrapper: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
  },
  tabWrapperMobile: {
    flexDirection: 'column',
    width: '100%',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#fff',
  },
  stepsSection: {
    padding: 24,
  },
  stepsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    maxWidth: 1200,
    alignSelf: 'center',
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  stepCardMobile: {
    width: '100%',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 16,
  },
  stepDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#475569',
  },
  connector: {
    position: 'absolute',
    right: -20,
    top: '50%',
  },
  videoSection: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  videoTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
  },
  videoPlaceholder: {
    width: '100%',
    maxWidth: 800,
    aspectRatio: 16 / 9,
    backgroundColor: '#334155',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  videoLabel: {
    color: '#94A3B8',
    fontSize: 16,
  },
  faqSection: {
    padding: 40,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 32,
  },
  faqGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  faqGridMobile: {
    flexDirection: 'column',
  },
  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  faqCardMobile: {
    width: '100%',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
  },
  ctaSection: {
    backgroundColor: '#4F46E5',
    padding: 60,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
    textAlign: 'center',
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  ctaButtonsMobile: {
    flexDirection: 'column',
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
