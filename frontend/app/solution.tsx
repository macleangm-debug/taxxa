import React from 'react';
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

export default function SolutionPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const coreComponents = [
    {
      icon: 'phone-portrait',
      title: 'Consumer Mobile App',
      description: 'Citizens scan QR codes on tax receipts to earn entries into prize draws. Available on iOS and Android.',
      features: ['QR code scanning', 'Real-time validation', 'Entry tracking', 'Push notifications'],
      color: '#4F46E5',
    },
    {
      icon: 'desktop',
      title: 'Tax Authority Portal',
      description: 'Comprehensive back-office for managing draws, monitoring compliance, and analyzing transaction data.',
      features: ['Real-time dashboard', 'Draw management', 'User analytics', 'Audit reports'],
      color: '#7C3AED',
    },
    {
      icon: 'code-slash',
      title: 'Integration APIs',
      description: 'RESTful APIs for seamless integration with existing tax systems and third-party services.',
      features: ['Receipt validation', 'Webhook events', 'Bulk operations', 'Multi-jurisdiction'],
      color: '#2563EB',
    },
    {
      icon: 'shield-checkmark',
      title: 'Fraud Prevention',
      description: 'Multi-layered security with cryptographic verification and real-time anomaly detection.',
      features: ['Duplicate detection', 'Rate limiting', 'Geo-tracking', 'Audit trails'],
      color: '#059669',
    },
  ];

  const benefits = [
    { icon: 'trending-up', title: 'Increase Revenue', stat: '15-25%', description: 'Average increase in tax collection' },
    { icon: 'people', title: 'Citizen Engagement', stat: '2M+', description: 'Active users within first year' },
    { icon: 'analytics', title: 'Real-time Data', stat: '100%', description: 'Transaction visibility' },
    { icon: 'happy', title: 'Public Trust', stat: '85%', description: 'Positive public perception' },
  ];

  const differentiators = [
    {
      title: 'Behavioral Economics',
      description: 'Uses proven lottery mechanics to create positive incentives rather than relying solely on penalties.',
      icon: 'bulb',
    },
    {
      title: 'Immediate Feedback',
      description: 'Real-time validation and entry confirmation keeps users engaged and motivated.',
      icon: 'flash',
    },
    {
      title: 'Transparent Draws',
      description: 'Cryptographically secure and publicly auditable draw process builds trust.',
      icon: 'eye',
    },
    {
      title: 'Scalable Architecture',
      description: 'Cloud-native platform handles millions of transactions without performance degradation.',
      icon: 'cloud',
    },
  ];

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
            <Text style={styles.badgeText}>THE TAXXA SOLUTION</Text>
          </View>
          <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
            Transform Tax Compliance{"\n"}
            <Text style={styles.heroTitleAccent}>Into Citizen Engagement</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            A comprehensive platform that makes tax compliance rewarding for citizens while providing tax authorities with unprecedented transaction visibility.
          </Text>
          <View style={[styles.heroButtons, isMobile && styles.heroButtonsMobile]}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/demo')}>
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>See Interactive Demo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/features')}>
              <Text style={styles.secondaryButtonText}>View All Features</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Core Components */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Platform Components</Text>
        <Text style={styles.sectionSubtitle}>Everything you need for a successful tax compliance program</Text>
        
        <View style={[styles.componentsGrid, isMobile && styles.componentsGridMobile]}>
          {coreComponents.map((component, index) => (
            <View key={index} style={[styles.componentCard, isMobile && styles.componentCardMobile]}>
              <View style={[styles.componentIcon, { backgroundColor: component.color + '20' }]}>
                <Ionicons name={component.icon as any} size={32} color={component.color} />
              </View>
              <Text style={styles.componentTitle}>{component.title}</Text>
              <Text style={styles.componentDescription}>{component.description}</Text>
              <View style={styles.featureList}>
                {component.features.map((feature, fIndex) => (
                  <View key={fIndex} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Benefits Stats */}
      <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.benefitsSection}>
        <Text style={styles.benefitsTitle}>Proven Results</Text>
        <View style={[styles.benefitsGrid, isMobile && styles.benefitsGridMobile]}>
          {benefits.map((benefit, index) => (
            <View key={index} style={[styles.benefitCard, isMobile && styles.benefitCardMobile]}>
              <Ionicons name={benefit.icon as any} size={28} color="#fff" />
              <Text style={styles.benefitStat}>{benefit.stat}</Text>
              <Text style={styles.benefitTitle}>{benefit.title}</Text>
              <Text style={styles.benefitDescription}>{benefit.description}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Differentiators */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Taxxa Works</Text>
        <Text style={styles.sectionSubtitle}>The science behind our approach</Text>
        
        <View style={[styles.diffGrid, isMobile && styles.diffGridMobile]}>
          {differentiators.map((diff, index) => (
            <View key={index} style={[styles.diffCard, isMobile && styles.diffCardMobile]}>
              <View style={styles.diffIconContainer}>
                <Ionicons name={diff.icon as any} size={24} color="#4F46E5" />
              </View>
              <Text style={styles.diffTitle}>{diff.title}</Text>
              <Text style={styles.diffDescription}>{diff.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Ready to Transform Tax Compliance?</Text>
        <Text style={styles.ctaSubtitle}>Schedule a personalized demo with our team</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/landing')}>
          <Ionicons name="calendar" size={20} color="#fff" />
          <Text style={styles.ctaButtonText}>Request Demo</Text>
        </TouchableOpacity>
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
    maxWidth: 900,
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
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    lineHeight: 56,
  },
  heroTitleMobile: {
    fontSize: 32,
    lineHeight: 40,
  },
  heroTitleAccent: {
    color: '#A5B4FC',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#94A3B8',
    marginBottom: 32,
    lineHeight: 28,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  heroButtonsMobile: {
    flexDirection: 'column',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 40,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 40,
  },
  componentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
  },
  componentsGridMobile: {
    flexDirection: 'column',
  },
  componentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '48%',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  componentCardMobile: {
    width: '100%',
  },
  componentIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  componentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  componentDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 22,
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#475569',
  },
  benefitsSection: {
    padding: 60,
  },
  benefitsTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    maxWidth: 1000,
    alignSelf: 'center',
  },
  benefitsGridMobile: {
    flexDirection: 'column',
  },
  benefitCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    width: '22%',
    minWidth: 180,
  },
  benefitCardMobile: {
    width: '100%',
  },
  benefitStat: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
  },
  benefitDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 4,
  },
  diffGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
  },
  diffGridMobile: {
    flexDirection: 'column',
  },
  diffCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '23%',
    minWidth: 240,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  diffCardMobile: {
    width: '100%',
  },
  diffIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  diffTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  diffDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
  },
  ctaSection: {
    backgroundColor: '#1E293B',
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
    color: '#94A3B8',
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 18,
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
