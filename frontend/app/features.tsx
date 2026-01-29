import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const isWeb = Platform.OS === 'web';

export default function FeaturesPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [activeTab, setActiveTab] = useState('all');

  // All platform features organized by category
  const featureCategories = [
    {
      id: 'consumer',
      name: 'Consumer App',
      icon: 'phone-portrait',
      color: '#3B82F6',
      description: 'Mobile-first experience for citizens',
      features: [
        {
          name: 'QR Code Scanner',
          description: 'Scan tax receipts with built-in camera. Supports 6+ QR formats with auto-detection.',
          icon: 'qr-code',
          status: 'live'
        },
        {
          name: 'Multi-Step Validation',
          description: 'Receipts go through decode → validate → submit flow with real-time feedback.',
          icon: 'shield-checkmark',
          status: 'live'
        },
        {
          name: 'Draw Entries',
          description: 'Earn lottery entries for each valid scan. Bonus entries for high-value purchases.',
          icon: 'ticket',
          status: 'live'
        },
        {
          name: 'Prize Notifications',
          description: 'Push notifications for draw reminders, winner announcements, and updates.',
          icon: 'notifications',
          status: 'live'
        },
        {
          name: 'Referral Program',
          description: 'Invite friends and earn bonus entries when they scan receipts.',
          icon: 'people',
          status: 'live'
        },
        {
          name: 'Scan History',
          description: 'View all past scans with receipt details, validation status, and entries earned.',
          icon: 'time',
          status: 'live'
        },
        {
          name: 'Profile Management',
          description: 'Manage personal details, notification preferences, and view total entries.',
          icon: 'person',
          status: 'live'
        }
      ]
    },
    {
      id: 'admin',
      name: 'Admin Portal',
      icon: 'desktop',
      color: '#8B5CF6',
      description: 'Comprehensive back-office management',
      features: [
        {
          name: 'Dashboard Analytics',
          description: 'Real-time metrics on users, scans, draws, and compliance rates.',
          icon: 'analytics',
          status: 'live'
        },
        {
          name: 'User Management',
          description: 'View all users, their activity, scan history, and entry balances.',
          icon: 'people',
          status: 'live'
        },
        {
          name: 'Draw Management',
          description: 'Create, schedule, and execute prize draws with configurable rules.',
          icon: 'trophy',
          status: 'live'
        },
        {
          name: 'Cryptographic Draws',
          description: 'Verifiable random selection using cryptographic seeds with full audit trail.',
          icon: 'lock-closed',
          status: 'live'
        },
        {
          name: 'Audit Reports',
          description: 'Detailed draw audit logs with proof of fairness for regulatory compliance.',
          icon: 'document-text',
          status: 'live'
        },
        {
          name: 'Broadcast Notifications',
          description: 'Send push notifications to all users or specific segments.',
          icon: 'megaphone',
          status: 'live'
        },
        {
          name: 'Prize Disbursement',
          description: 'Track and confirm prize payouts with witness verification.',
          icon: 'cash',
          status: 'live'
        },
        {
          name: 'Export Reports',
          description: 'Export data in CSV/JSON for external reporting and audits.',
          icon: 'download',
          status: 'live'
        }
      ]
    },
    {
      id: 'api',
      name: 'Receipt API',
      icon: 'code-slash',
      color: '#10B981',
      description: 'Industry-standard receipt processing',
      features: [
        {
          name: 'Auto Format Detection',
          description: 'Automatically detects JSON, pipe-delimited, URL-encoded, Base64, and custom formats.',
          icon: 'search',
          status: 'live'
        },
        {
          name: 'Flexible Schema',
          description: '30+ fields covering all Tax Authority requirements globally.',
          icon: 'layers',
          status: 'live'
        },
        {
          name: '8-Point Validation',
          description: 'Format checks, TIN validation, amounts, dates, duplicates, Tax Authority verification.',
          icon: 'checkmark-done',
          status: 'live'
        },
        {
          name: '8 African Jurisdictions',
          description: 'Tanzania, Kenya, Uganda, Rwanda, Ethiopia, Nigeria, South Africa, Ghana.',
          icon: 'globe',
          status: 'live'
        },
        {
          name: 'RESTful Endpoints',
          description: 'Clean REST API: decode → validate → submit workflow.',
          icon: 'git-branch',
          status: 'live'
        }
      ]
    },
    {
      id: 'security',
      name: 'Security & Compliance',
      icon: 'shield',
      color: '#EF4444',
      description: 'Enterprise-grade security measures',
      features: [
        {
          name: 'JWT Authentication',
          description: 'Secure token-based authentication with expiration and refresh.',
          icon: 'key',
          status: 'live'
        },
        {
          name: 'OTP Verification',
          description: 'SMS-based OTP for registration with configurable providers (Twilio, Africa\'s Talking).',
          icon: 'chatbubble-ellipses',
          status: 'live'
        },
        {
          name: 'Duplicate Detection',
          description: 'Prevents the same receipt from being submitted twice.',
          icon: 'copy',
          status: 'live'
        },
        {
          name: 'Fraud Prevention',
          description: 'Rate limiting, geo-location tracking, and suspicious activity monitoring.',
          icon: 'warning',
          status: 'live'
        },
        {
          name: 'Full Audit Trail',
          description: 'Every action logged with timestamps, user IDs, and details.',
          icon: 'list',
          status: 'live'
        },
        {
          name: 'Data Encryption',
          description: 'Sensitive data encrypted at rest and in transit.',
          icon: 'lock-closed',
          status: 'live'
        }
      ]
    },
    {
      id: 'integration',
      name: 'Integrations',
      icon: 'link',
      color: '#F59E0B',
      description: 'Connect with existing systems',
      features: [
        {
          name: 'SMS Providers',
          description: 'Twilio, Africa\'s Talking for East Africa. Easy to add more.',
          icon: 'chatbox',
          status: 'ready'
        },
        {
          name: 'Push Notifications',
          description: 'Expo Push Service for iOS and Android notifications.',
          icon: 'notifications',
          status: 'live'
        },
        {
          name: 'Tax Authority APIs',
          description: 'Framework for integrating with any Tax Authority\'s verification system.',
          icon: 'business',
          status: 'ready'
        },
        {
          name: 'Webhook Support',
          description: 'Configurable webhooks for real-time event notifications.',
          icon: 'git-network',
          status: 'planned'
        },
        {
          name: 'Analytics Export',
          description: 'Export data to external BI tools for advanced analytics.',
          icon: 'bar-chart',
          status: 'live'
        }
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    const config = {
      live: { color: '#10B981', bg: '#ECFDF5', label: 'Live' },
      ready: { color: '#3B82F6', bg: '#EFF6FF', label: 'Ready' },
      planned: { color: '#F59E0B', bg: '#FFFBEB', label: 'Planned' }
    };
    const c = config[status] || config.planned;
    return (
      <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
        <View style={[styles.statusDot, { backgroundColor: c.color }]} />
        <Text style={[styles.statusText, { color: c.color }]}>{c.label}</Text>
      </View>
    );
  };

  const filteredCategories = activeTab === 'all' 
    ? featureCategories 
    : featureCategories.filter(c => c.id === activeTab);

  const stats = {
    totalFeatures: featureCategories.reduce((sum, c) => sum + c.features.length, 0),
    liveFeatures: featureCategories.reduce((sum, c) => sum + c.features.filter(f => f.status === 'live').length, 0),
    categories: featureCategories.length
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#0F172A', '#1E3A5F']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerText}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>PLATFORM CAPABILITIES</Text>
            </View>
            <Text style={styles.headerTitle}>All Features</Text>
            <Text style={styles.headerSubtitle}>
              Everything included in the Taxxa platform
            </Text>
          </View>
          
          {/* Stats Cards */}
          <View style={[styles.statsRow, isMobile && styles.statsRowMobile]}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalFeatures}</Text>
              <Text style={styles.statLabel}>Total Features</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.liveFeatures}</Text>
              <Text style={styles.statLabel}>Live Now</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.categories}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'all' && styles.tabActive]}
              onPress={() => setActiveTab('all')}
            >
              <Ionicons name="apps" size={18} color={activeTab === 'all' ? '#fff' : '#64748B'} />
              <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All</Text>
            </TouchableOpacity>
            {featureCategories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.tab, activeTab === cat.id && styles.tabActive]}
                onPress={() => setActiveTab(cat.id)}
              >
                <Ionicons 
                  name={cat.icon as any} 
                  size={18} 
                  color={activeTab === cat.id ? '#fff' : '#64748B'} 
                />
                <Text style={[styles.tabText, activeTab === cat.id && styles.tabTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Feature Categories */}
      <View style={styles.content}>
        {filteredCategories.map(category => (
          <View key={category.id} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                <Ionicons name={category.icon as any} size={24} color={category.color} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
              </View>
              <View style={styles.categoryCount}>
                <Text style={styles.categoryCountText}>{category.features.length}</Text>
              </View>
            </View>

            <View style={[styles.featuresGrid, isMobile && styles.featuresGridMobile]}>
              {category.features.map((feature, index) => (
                <View key={index} style={[styles.featureCard, isMobile && styles.featureCardMobile]}>
                  <View style={styles.featureHeader}>
                    <View style={[styles.featureIcon, { backgroundColor: category.color + '15' }]}>
                      <Ionicons name={feature.icon as any} size={20} color={category.color} />
                    </View>
                    {getStatusBadge(feature.status)}
                  </View>
                  <Text style={styles.featureName}>{feature.name}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Technical Specs Section */}
      <View style={styles.specsSection}>
        <Text style={styles.specsSectionTitle}>Technical Specifications</Text>
        <View style={[styles.specsGrid, isMobile && styles.specsGridMobile]}>
          <View style={styles.specCard}>
            <Ionicons name="server" size={24} color="#3B82F6" />
            <Text style={styles.specTitle}>Backend</Text>
            <Text style={styles.specValue}>FastAPI + MongoDB</Text>
          </View>
          <View style={styles.specCard}>
            <Ionicons name="phone-portrait" size={24} color="#8B5CF6" />
            <Text style={styles.specTitle}>Mobile</Text>
            <Text style={styles.specValue}>React Native + Expo</Text>
          </View>
          <View style={styles.specCard}>
            <Ionicons name="globe" size={24} color="#10B981" />
            <Text style={styles.specTitle}>API Standard</Text>
            <Text style={styles.specValue}>REST + OpenAPI 3.0</Text>
          </View>
          <View style={styles.specCard}>
            <Ionicons name="lock-closed" size={24} color="#EF4444" />
            <Text style={styles.specTitle}>Auth</Text>
            <Text style={styles.specValue}>JWT + OTP</Text>
          </View>
        </View>
      </View>

      {/* Supported Jurisdictions */}
      <View style={styles.jurisdictionsSection}>
        <Text style={styles.specsSectionTitle}>Supported Tax Authorities</Text>
        <View style={[styles.jurisdictionsGrid, isMobile && styles.jurisdictionsGridMobile]}>
          <View style={styles.jurisdictionCard}>
            <View style={[styles.jurisdictionFlag, { backgroundColor: '#22C55E' }]}>
              <Text style={styles.jurisdictionFlagText}>TZ</Text>
            </View>
            <View style={styles.jurisdictionInfo}>
              <Text style={styles.jurisdictionName}>Tanzania</Text>
              <Text style={styles.jurisdictionAuthority}>TRA - EFDMS/VFD</Text>
              <View style={[styles.statusBadge, { backgroundColor: '#EFF6FF' }]}>
                <Text style={[styles.statusText, { color: '#3B82F6' }]}>Integration Ready</Text>
              </View>
            </View>
          </View>
          <View style={styles.jurisdictionCard}>
            <View style={[styles.jurisdictionFlag, { backgroundColor: '#EF4444' }]}>
              <Text style={styles.jurisdictionFlagText}>KE</Text>
            </View>
            <View style={styles.jurisdictionInfo}>
              <Text style={styles.jurisdictionName}>Kenya</Text>
              <Text style={styles.jurisdictionAuthority}>KRA - eTIMS</Text>
              <View style={[styles.statusBadge, { backgroundColor: '#EFF6FF' }]}>
                <Text style={[styles.statusText, { color: '#3B82F6' }]}>Integration Ready</Text>
              </View>
            </View>
          </View>
          <View style={styles.jurisdictionCard}>
            <View style={[styles.jurisdictionFlag, { backgroundColor: '#64748B' }]}>
              <Text style={styles.jurisdictionFlagText}>+</Text>
            </View>
            <View style={styles.jurisdictionInfo}>
              <Text style={styles.jurisdictionName}>More Countries</Text>
              <Text style={styles.jurisdictionAuthority}>Flexible Framework</Text>
              <View style={[styles.statusBadge, { backgroundColor: '#FFFBEB' }]}>
                <Text style={[styles.statusText, { color: '#F59E0B' }]}>On Request</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        style={styles.ctaSection}
      >
        <Text style={styles.ctaTitle}>Ready to Increase Tax Compliance?</Text>
        <Text style={styles.ctaSubtitle}>
          Schedule a demo to see the full platform in action
        </Text>
        <View style={styles.ctaButtons}>
          <TouchableOpacity 
            style={styles.ctaButtonPrimary}
            onPress={() => router.push('/landing')}
          >
            <Ionicons name="calendar" size={20} color="#3B82F6" />
            <Text style={styles.ctaButtonPrimaryText}>Schedule Demo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.ctaButtonSecondary}
            onPress={() => router.push('/admin')}
          >
            <Ionicons name="desktop" size={20} color="#fff" />
            <Text style={styles.ctaButtonSecondaryText}>Try Admin Portal</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 Taxxa. All rights reserved.</Text>
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
  headerContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  headerText: {
    marginBottom: 32,
  },
  headerBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  headerBadgeText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#94A3B8',
    lineHeight: 28,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statsRowMobile: {
    flexDirection: 'column',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 16,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabActive: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    padding: 24,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  categorySection: {
    marginBottom: 40,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 16,
  },
  categoryName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  categoryCount: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featuresGridMobile: {
    flexDirection: 'column',
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: isWeb ? 'calc(33.333% - 11px)' : '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  featureCardMobile: {
    width: '100%',
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  specsSection: {
    backgroundColor: '#fff',
    padding: 40,
    marginTop: 20,
  },
  specsSectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 32,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    maxWidth: 1000,
    alignSelf: 'center',
  },
  specsGridMobile: {
    flexDirection: 'column',
  },
  specCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: isWeb ? 200 : '100%',
  },
  specTitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
  },
  specValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 4,
  },
  jurisdictionsSection: {
    padding: 40,
  },
  jurisdictionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    maxWidth: 1000,
    alignSelf: 'center',
  },
  jurisdictionsGridMobile: {
    flexDirection: 'column',
  },
  jurisdictionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    width: isWeb ? 300 : '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  jurisdictionFlag: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jurisdictionFlagText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  jurisdictionInfo: {
    marginLeft: 16,
    flex: 1,
  },
  jurisdictionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  jurisdictionAuthority: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  ctaSection: {
    padding: 60,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 32,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  ctaButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  ctaButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  ctaButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ctaButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#94A3B8',
  },
});
