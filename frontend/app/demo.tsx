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

const isWeb = Platform.OS === 'web';

export default function DemoPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [currentStep, setCurrentStep] = useState(0);

  const demoSteps = [
    {
      id: 'intro',
      title: 'Welcome to Taxxa',
      subtitle: 'Interactive Platform Demo',
      description: 'Taxxa is a comprehensive tax compliance platform that incentivizes citizens to request receipts through prize draws.',
      icon: 'rocket',
      color: '#3B82F6',
      action: null,
      highlights: [
        { icon: 'people', text: 'For Tax Authorities & Citizens' },
        { icon: 'shield-checkmark', text: 'Cryptographically Secure' },
        { icon: 'globe', text: '8 African Countries Supported' },
      ]
    },
    {
      id: 'consumer-app',
      title: 'Consumer Mobile App',
      subtitle: 'For Citizens',
      description: 'Users download the app, scan tax receipts, and automatically enter prize draws.',
      icon: 'phone-portrait',
      color: '#8B5CF6',
      action: { label: 'Try Consumer App', route: '/' },
      highlights: [
        { icon: 'qr-code', text: 'QR Code Scanner' },
        { icon: 'trophy', text: 'Prize Draw Entries' },
        { icon: 'notifications', text: 'Push Notifications' },
        { icon: 'people', text: 'Referral Program' },
      ]
    },
    {
      id: 'scan-flow',
      title: 'Receipt Scanning Flow',
      subtitle: '3-Step Validation',
      description: 'Every scan goes through a rigorous validation process to ensure authenticity.',
      icon: 'qr-code',
      color: '#10B981',
      action: { label: 'Try Scan Feature', route: '/scan' },
      highlights: [
        { icon: 'search', text: 'Step 1: Decode QR Code' },
        { icon: 'shield-checkmark', text: 'Step 2: Validate Receipt' },
        { icon: 'cloud-upload', text: 'Step 3: Submit for Entry' },
        { icon: 'checkmark-done', text: '8 Validation Checks' },
      ]
    },
    {
      id: 'admin-portal',
      title: 'Admin Portal',
      subtitle: 'For Tax Authorities',
      description: 'Comprehensive back-office for managing draws, users, and monitoring compliance.',
      icon: 'desktop',
      color: '#F59E0B',
      action: { label: 'Open Admin Portal', route: '/admin' },
      highlights: [
        { icon: 'analytics', text: 'Real-time Dashboard' },
        { icon: 'trophy', text: 'Draw Management' },
        { icon: 'people', text: 'User Analytics' },
        { icon: 'document-text', text: 'Audit Reports' },
      ]
    },
    {
      id: 'draw-system',
      title: 'Cryptographic Draw System',
      subtitle: 'Verifiable Fairness',
      description: 'Draws use cryptographic random selection with full audit trail for regulatory compliance.',
      icon: 'lock-closed',
      color: '#EF4444',
      action: { label: 'View Draws', route: '/admin/draws' },
      highlights: [
        { icon: 'key', text: 'Cryptographic Seeds' },
        { icon: 'document-text', text: 'Full Audit Trail' },
        { icon: 'shield-checkmark', text: 'Tamper-Proof Selection' },
        { icon: 'download', text: 'Exportable Reports' },
      ]
    },
    {
      id: 'jurisdictions',
      title: '8 African Jurisdictions',
      subtitle: 'Tax Authority Integrations',
      description: 'Pre-built integrations for major African tax authorities, ready for deployment.',
      icon: 'globe',
      color: '#06B6D4',
      action: { label: 'View Features', route: '/features' },
      highlights: [
        { icon: 'flag', text: 'Tanzania - TRA EFDMS' },
        { icon: 'flag', text: 'Kenya - KRA eTIMS' },
        { icon: 'flag', text: 'Uganda - URA EFRIS' },
        { icon: 'flag', text: 'Rwanda, Ethiopia, Nigeria, SA, Ghana' },
      ]
    },
    {
      id: 'integrations',
      title: 'Enterprise Integrations',
      subtitle: 'Connect Your Systems',
      description: 'Webhooks, SMS providers, and APIs for seamless integration with existing infrastructure.',
      icon: 'git-network',
      color: '#8B5CF6',
      action: null,
      highlights: [
        { icon: 'notifications', text: '16 Webhook Events' },
        { icon: 'chatbox', text: 'Twilio & Africa\'s Talking SMS' },
        { icon: 'code-slash', text: 'REST API with OpenAPI Docs' },
        { icon: 'download', text: 'Data Export (CSV/JSON)' },
      ]
    },
    {
      id: 'prizes',
      title: 'Prize Management',
      subtitle: 'Disbursement Tracking',
      description: 'Track prize claims, record disbursements at public events, and generate compliance reports.',
      icon: 'cash',
      color: '#22C55E',
      action: null,
      highlights: [
        { icon: 'list', text: 'Pending Prize Tracking' },
        { icon: 'checkmark-done', text: 'Dual Verification' },
        { icon: 'camera', text: 'Photo Evidence Support' },
        { icon: 'document-text', text: 'Exportable Reports' },
      ]
    },
    {
      id: 'summary',
      title: 'Ready to Deploy',
      subtitle: 'Next Steps',
      description: 'Taxxa is ready for deployment. Contact us to discuss your specific requirements.',
      icon: 'rocket',
      color: '#3B82F6',
      action: { label: 'View All Features', route: '/features' },
      highlights: [
        { icon: 'checkmark-circle', text: '30 Features Live' },
        { icon: 'globe', text: '8 Countries Supported' },
        { icon: 'time', text: '8-12 Week Implementation' },
        { icon: 'call', text: 'Contact for Demo' },
      ]
    },
  ];

  const currentDemoStep = demoSteps[currentStep];
  const progress = ((currentStep + 1) / demoSteps.length) * 100;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={[currentDemoStep.color, '#1E293B']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.stepCounter}>{currentStep + 1}/{demoSteps.length}</Text>
        </View>

        <View style={styles.headerContent}>
          <View style={[styles.stepIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name={currentDemoStep.icon as any} size={40} color="#fff" />
          </View>
          <Text style={styles.stepSubtitle}>{currentDemoStep.subtitle}</Text>
          <Text style={styles.stepTitle}>{currentDemoStep.title}</Text>
          <Text style={styles.stepDescription}>{currentDemoStep.description}</Text>
        </View>
      </LinearGradient>

      {/* Highlights */}
      <View style={styles.highlightsSection}>
        <Text style={styles.highlightsTitle}>Key Points</Text>
        <View style={styles.highlightsGrid}>
          {currentDemoStep.highlights.map((highlight, index) => (
            <View key={index} style={styles.highlightCard}>
              <View style={[styles.highlightIcon, { backgroundColor: currentDemoStep.color + '20' }]}>
                <Ionicons name={highlight.icon as any} size={24} color={currentDemoStep.color} />
              </View>
              <Text style={styles.highlightText}>{highlight.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action Button */}
      {currentDemoStep.action && (
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: currentDemoStep.color }]}
            onPress={() => router.push(currentDemoStep.action!.route)}
          >
            <Ionicons name="open" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>{currentDemoStep.action.label}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation */}
      <View style={styles.navSection}>
        <TouchableOpacity 
          style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
          onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          <Ionicons name="chevron-back" size={24} color={currentStep === 0 ? '#94A3B8' : '#1E293B'} />
          <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navButton, styles.navButtonPrimary]}
          onPress={() => setCurrentStep(Math.min(demoSteps.length - 1, currentStep + 1))}
          disabled={currentStep === demoSteps.length - 1}
        >
          <Text style={styles.navButtonTextPrimary}>
            {currentStep === demoSteps.length - 1 ? 'End Demo' : 'Next'}
          </Text>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Step Indicators */}
      <View style={styles.stepsIndicator}>
        {demoSteps.map((step, index) => (
          <TouchableOpacity 
            key={step.id}
            style={[
              styles.stepDot,
              index === currentStep && styles.stepDotActive,
              index < currentStep && styles.stepDotCompleted
            ]}
            onPress={() => setCurrentStep(index)}
          >
            {index < currentStep && (
              <Ionicons name="checkmark" size={12} color="#fff" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Links */}
      <View style={styles.quickLinks}>
        <Text style={styles.quickLinksTitle}>Quick Links</Text>
        <View style={styles.quickLinksGrid}>
          <TouchableOpacity 
            style={styles.quickLink}
            onPress={() => router.push('/features')}
          >
            <Ionicons name="list" size={20} color="#3B82F6" />
            <Text style={styles.quickLinkText}>All Features</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickLink}
            onPress={() => router.push('/landing')}
          >
            <Ionicons name="business" size={20} color="#3B82F6" />
            <Text style={styles.quickLinkText}>B2G Page</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickLink}
            onPress={() => router.push('/admin')}
          >
            <Ionicons name="desktop" size={20} color="#3B82F6" />
            <Text style={styles.quickLinkText}>Admin Portal</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickLink}
            onPress={() => router.push('/')}
          >
            <Ionicons name="phone-portrait" size={20} color="#3B82F6" />
            <Text style={styles.quickLinkText}>Consumer App</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginHorizontal: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  stepCounter: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  headerContent: {
    alignItems: 'center',
  },
  stepIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 500,
  },
  highlightsSection: {
    padding: 24,
  },
  highlightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: isWeb ? 200 : '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  highlightIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  actionSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  navSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    gap: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonPrimary: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    flex: 1,
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  navButtonTextDisabled: {
    color: '#94A3B8',
  },
  navButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    width: 24,
    backgroundColor: '#3B82F6',
  },
  stepDotCompleted: {
    backgroundColor: '#10B981',
  },
  quickLinks: {
    padding: 24,
    paddingTop: 0,
  },
  quickLinksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 16,
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  quickLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
});
