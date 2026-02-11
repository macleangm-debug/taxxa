import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Modal,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const isWeb = Platform.OS === 'web';

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000, suffix = '', prefix = '' }: { end: number; duration?: number; suffix?: string; prefix?: string }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    setHasAnimated(true);
    
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, hasAnimated]);

  return <Text style={styles.statValue}>{prefix}{count.toLocaleString()}{suffix}</Text>;
};

// Floating particles background
const ParticleBackground = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 15,
  }));

  return (
    <View style={styles.particleContainer}>
      {particles.map((p) => (
        <View
          key={p.id}
          style={[
            styles.particle,
            {
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              opacity: 0.3,
            },
          ]}
        />
      ))}
    </View>
  );
};

export default function LandingPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  
  const [showContactModal, setShowContactModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showApiPlayground, setShowApiPlayground] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [demoStep, setDemoStep] = useState(0);
  const [apiResponse, setApiResponse] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('/api/scan');
  const [apiMethod, setApiMethod] = useState('POST');
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  
  const [contactForm, setContactForm] = useState({
    name: '',
    organization: '',
    email: '',
    country: '',
    message: '',
  });

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Simulated API call
  const simulateApiCall = async () => {
    setIsApiLoading(true);
    setApiResponse('');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const responses: Record<string, any> = {
      '/api/scan': {
        success: true,
        data: {
          receipt_id: 'REC-2026-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          status: 'valid',
          merchant: 'SuperMart Tanzania',
          amount: 125000,
          currency: 'TZS',
          entries_earned: 3,
          verification_hash: 'sha256:' + Math.random().toString(36).substr(2, 32),
          timestamp: new Date().toISOString(),
        }
      },
      '/api/draws/active': {
        success: true,
        data: {
          draws: [
            { id: 'DRAW-W-2026-06', type: 'weekly', prize_pool: 50000000, entries: 125847, ends_in: '3d 14h' },
            { id: 'DRAW-M-2026-02', type: 'monthly', prize_pool: 500000000, entries: 1458293, ends_in: '18d 7h' },
          ]
        }
      },
      '/api/user/stats': {
        success: true,
        data: {
          total_scans: 47,
          valid_scans: 45,
          entries_earned: 156,
          current_rank: 'Gold',
          wins: 2,
          total_winnings: 250000,
        }
      },
    };
    
    setApiResponse(JSON.stringify(responses[apiEndpoint] || { error: 'Endpoint not found' }, null, 2));
    setIsApiLoading(false);
  };

  const features = [
    {
      icon: 'scan-outline',
      title: 'QR Receipt Scanning',
      description: 'Instant verification against national tax authority database with cryptographic proof',
      stat: '2.5M+',
      statLabel: 'Receipts Verified',
      color: '#3B82F6',
    },
    {
      icon: 'trophy-outline',
      title: 'Prize Draw System',
      description: 'Provably fair lottery using blockchain-verified random selection',
      stat: '99.99%',
      statLabel: 'Fairness Score',
      color: '#10B981',
    },
    {
      icon: 'analytics-outline',
      title: 'Real-time Analytics',
      description: 'Live dashboards showing compliance rates, transaction volumes, and trends',
      stat: '< 50ms',
      statLabel: 'Data Latency',
      color: '#8B5CF6',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Fraud Detection',
      description: 'AI-powered anomaly detection identifies suspicious patterns instantly',
      stat: '98.7%',
      statLabel: 'Detection Rate',
      color: '#F59E0B',
    },
    {
      icon: 'globe-outline',
      title: 'Multi-tenant Platform',
      description: 'Deploy across multiple jurisdictions with localized configurations',
      stat: '15+',
      statLabel: 'Countries Ready',
      color: '#EC4899',
    },
    {
      icon: 'code-slash-outline',
      title: 'API-First Design',
      description: 'RESTful APIs with comprehensive documentation and SDKs',
      stat: '50+',
      statLabel: 'API Endpoints',
      color: '#06B6D4',
    },
  ];

  const apiEndpoints = [
    { path: '/api/scan', method: 'POST', description: 'Verify a receipt QR code' },
    { path: '/api/draws/active', method: 'GET', description: 'Get active prize draws' },
    { path: '/api/user/stats', method: 'GET', description: 'Get user statistics' },
  ];

  const comparisonData = [
    { feature: 'Real-time Verification', taxxa: true, others: false },
    { feature: 'Blockchain Audit Trail', taxxa: true, others: false },
    { feature: 'AI Fraud Detection', taxxa: true, others: false },
    { feature: 'Multi-jurisdiction Support', taxxa: true, others: 'Limited' },
    { feature: 'Mobile-first Design', taxxa: true, others: 'Partial' },
    { feature: 'Offline Capability', taxxa: true, others: false },
    { feature: 'API Access', taxxa: 'Full REST API', others: 'Limited' },
    { feature: 'Prize Draw Fairness Proof', taxxa: true, others: false },
  ];

  const demoSteps = [
    { title: 'Scan Receipt', icon: 'qr-code', description: 'Consumer scans QR code on tax receipt' },
    { title: 'Verify', icon: 'checkmark-circle', description: 'Receipt verified against tax authority DB' },
    { title: 'Earn Entry', icon: 'ticket', description: 'Valid receipt = lottery entry earned' },
    { title: 'Win Prizes', icon: 'gift', description: 'Weekly/monthly draws with real prizes' },
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
            <LinearGradient colors={['#3B82F6', '#8B5CF6']} style={styles.logoIcon}>
              <Ionicons name="receipt" size={22} color="#fff" />
            </LinearGradient>
            <Text style={styles.logoText}>Taxxa</Text>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>Enterprise</Text>
            </View>
          </TouchableOpacity>
          
          {!isMobile ? (
            <View style={styles.navLinks}>
              <TouchableOpacity style={styles.navLink}>
                <Text style={styles.navLinkText}>Features</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navLink} onPress={() => setShowApiPlayground(true)}>
                <Text style={styles.navLinkText}>API Playground</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navLink}>
                <Text style={styles.navLinkText}>Pricing</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navLink}>
                <Text style={styles.navLinkText}>Documentation</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButtonOutline} onPress={() => router.push('/admin')}>
                <Text style={styles.navButtonOutlineText}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButtonPrimary} onPress={() => setShowContactModal(true)}>
                <Text style={styles.navButtonPrimaryText}>Request Demo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.mobileMenuButton} onPress={() => setShowMobileMenu(!showMobileMenu)}>
              <Ionicons name={showMobileMenu ? "close" : "menu"} size={28} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        
        {isMobile && showMobileMenu && (
          <View style={styles.mobileMenuDropdown}>
            <TouchableOpacity style={styles.mobileMenuItem}>
              <Text style={styles.mobileMenuItemText}>Features</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mobileMenuItem} onPress={() => { setShowMobileMenu(false); setShowApiPlayground(true); }}>
              <Text style={styles.mobileMenuItemText}>API Playground</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mobileMenuItem}>
              <Text style={styles.mobileMenuItemText}>Pricing</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mobileMenuItem}>
              <Text style={styles.mobileMenuItemText}>Documentation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mobileMenuCTA} onPress={() => { setShowMobileMenu(false); setShowContactModal(true); }}>
              <Text style={styles.mobileMenuCTAText}>Request Demo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Hero Section */}
      <LinearGradient colors={['#0a0a1a', '#1a1a3a', '#0a0a1a']} style={styles.hero}>
        <ParticleBackground />
        <View style={[styles.heroContent, isMobile && styles.heroContentMobile]}>
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeDot} />
            <Text style={styles.heroBadgeText}>Interactive Demo Available</Text>
          </View>
          
          <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
            Experience{' '}
            <Text style={styles.heroTitleGradient}>Taxxa</Text>
            {'\n'}Before You Deploy
          </Text>
          
          <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>
            Transform tax compliance with incentivized receipt verification. 
            Explore our interactive demo - no account needed.
          </Text>
          
          <View style={[styles.heroButtons, isMobile && styles.heroButtonsMobile]}>
            <TouchableOpacity style={styles.heroButtonPrimary} onPress={() => setShowApiPlayground(true)}>
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.heroButtonPrimaryText}>Launch Interactive Demo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroButtonSecondary} onPress={() => setShowContactModal(true)}>
              <Text style={styles.heroButtonSecondaryText}>Schedule Demo</Text>
              <Ionicons name="arrow-forward" size={18} color="#8B5CF6" />
            </TouchableOpacity>
          </View>

          {/* Animated Stats */}
          <View style={[styles.statsRow, isMobile && styles.statsRowMobile]}>
            <View style={styles.statCard}>
              <AnimatedCounter end={45} suffix="+" />
              <Text style={styles.statLabel}>API Endpoints</Text>
            </View>
            <View style={styles.statCard}>
              <AnimatedCounter end={2500000} suffix="+" />
              <Text style={styles.statLabel}>Receipts Verified</Text>
            </View>
            <View style={styles.statCard}>
              <AnimatedCounter end={99} suffix="%" prefix="" />
              <Text style={styles.statLabel}>Uptime SLA</Text>
            </View>
            <View style={styles.statCard}>
              <AnimatedCounter end={15} suffix="+" />
              <Text style={styles.statLabel}>Countries</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Interactive Features Section */}
      <View style={styles.featuresSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>Features</Text>
          </View>
          <Text style={styles.sectionTitle}>What You'll Explore</Text>
          <Text style={styles.sectionSubtitle}>
            Click on any feature to see it in action within our interactive demo
          </Text>
        </View>

        <View style={[styles.featuresGrid, isMobile && styles.featuresGridMobile]}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.featureCard,
                activeFeature === index && styles.featureCardActive,
                hoveredCard === index && styles.featureCardHovered,
              ]}
              onPress={() => setActiveFeature(index)}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              activeOpacity={0.8}
            >
              <View style={[styles.featureIconWrapper, { backgroundColor: feature.color + '20' }]}>
                <Ionicons name={feature.icon as any} size={28} color={feature.color} />
              </View>
              <View style={styles.featureStatBadge}>
                <Text style={[styles.featureStatValue, { color: feature.color }]}>{feature.stat}</Text>
                <Text style={styles.featureStatLabel}>{feature.statLabel}</Text>
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
              {activeFeature === index && (
                <View style={[styles.featureActiveIndicator, { backgroundColor: feature.color }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Interactive Demo Section */}
      <LinearGradient colors={['#1a1a3a', '#0a0a1a']} style={styles.demoSection}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionBadge, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
            <Text style={[styles.sectionBadgeText, { color: '#A78BFA' }]}>Try It Now</Text>
          </View>
          <Text style={[styles.sectionTitle, { color: '#fff' }]}>See How It Works</Text>
          <Text style={[styles.sectionSubtitle, { color: '#94A3B8' }]}>
            Follow the journey from receipt scan to prize win
          </Text>
        </View>

        <View style={[styles.demoContainer, isMobile && styles.demoContainerMobile]}>
          {/* Demo Steps */}
          <View style={styles.demoSteps}>
            {demoSteps.map((step, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.demoStep,
                  demoStep === index && styles.demoStepActive,
                ]}
                onPress={() => setDemoStep(index)}
              >
                <View style={[
                  styles.demoStepIcon,
                  demoStep === index && styles.demoStepIconActive,
                ]}>
                  <Ionicons 
                    name={step.icon as any} 
                    size={24} 
                    color={demoStep === index ? '#fff' : '#64748B'} 
                  />
                </View>
                <View style={styles.demoStepContent}>
                  <Text style={[
                    styles.demoStepTitle,
                    demoStep === index && styles.demoStepTitleActive,
                  ]}>{step.title}</Text>
                  <Text style={styles.demoStepDesc}>{step.description}</Text>
                </View>
                {index < demoSteps.length - 1 && (
                  <View style={[
                    styles.demoStepConnector,
                    demoStep > index && styles.demoStepConnectorActive,
                  ]} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Demo Visualization */}
          <View style={styles.demoVisual}>
            <View style={styles.phoneFrame}>
              <View style={styles.phoneNotch} />
              <View style={styles.phoneScreen}>
                {demoStep === 0 && (
                  <View style={styles.demoScreenContent}>
                    <View style={styles.qrScanner}>
                      <View style={styles.qrCorner} />
                      <View style={[styles.qrCorner, styles.qrCornerTR]} />
                      <View style={[styles.qrCorner, styles.qrCornerBL]} />
                      <View style={[styles.qrCorner, styles.qrCornerBR]} />
                      <View style={styles.qrScanLine} />
                    </View>
                    <Text style={styles.demoScreenText}>Point camera at receipt QR code</Text>
                  </View>
                )}
                {demoStep === 1 && (
                  <View style={styles.demoScreenContent}>
                    <View style={styles.verifyingIndicator}>
                      <Ionicons name="shield-checkmark" size={48} color="#10B981" />
                    </View>
                    <Text style={styles.demoScreenText}>Verifying with Tax Authority...</Text>
                    <View style={styles.verifyBar}>
                      <View style={styles.verifyBarFill} />
                    </View>
                  </View>
                )}
                {demoStep === 2 && (
                  <View style={styles.demoScreenContent}>
                    <View style={styles.entryEarned}>
                      <Text style={styles.entryNumber}>+3</Text>
                      <Text style={styles.entryLabel}>Entries Earned!</Text>
                    </View>
                    <View style={styles.receiptInfo}>
                      <Text style={styles.receiptMerchant}>SuperMart Tanzania</Text>
                      <Text style={styles.receiptAmount}>TZS 125,000</Text>
                    </View>
                  </View>
                )}
                {demoStep === 3 && (
                  <View style={styles.demoScreenContent}>
                    <View style={styles.prizeShowcase}>
                      <Ionicons name="trophy" size={48} color="#F59E0B" />
                      <Text style={styles.prizeTitle}>Weekly Draw</Text>
                      <Text style={styles.prizeAmount}>TZS 50,000,000</Text>
                      <Text style={styles.prizeEntries}>Your entries: 156</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* API Playground Preview */}
      <View style={styles.apiPreviewSection}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionBadge, { backgroundColor: 'rgba(6, 182, 212, 0.1)' }]}>
            <Text style={[styles.sectionBadgeText, { color: '#06B6D4' }]}>API Playground</Text>
          </View>
          <Text style={styles.sectionTitle}>Test Our APIs Live</Text>
          <Text style={styles.sectionSubtitle}>
            Try real API calls right here - see exactly what you'll integrate
          </Text>
        </View>

        <View style={[styles.apiPreviewContainer, isMobile && styles.apiPreviewContainerMobile]}>
          <View style={styles.apiEndpointList}>
            {apiEndpoints.map((endpoint, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.apiEndpointItem,
                  apiEndpoint === endpoint.path && styles.apiEndpointItemActive,
                ]}
                onPress={() => { setApiEndpoint(endpoint.path); setApiMethod(endpoint.method); }}
              >
                <View style={[
                  styles.apiMethodBadge,
                  { backgroundColor: endpoint.method === 'POST' ? '#10B98120' : '#3B82F620' }
                ]}>
                  <Text style={[
                    styles.apiMethodText,
                    { color: endpoint.method === 'POST' ? '#10B981' : '#3B82F6' }
                  ]}>{endpoint.method}</Text>
                </View>
                <View style={styles.apiEndpointInfo}>
                  <Text style={styles.apiEndpointPath}>{endpoint.path}</Text>
                  <Text style={styles.apiEndpointDesc}>{endpoint.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.apiResponsePanel}>
            <View style={styles.apiResponseHeader}>
              <Text style={styles.apiResponseTitle}>Response Preview</Text>
              <TouchableOpacity 
                style={[styles.apiRunButton, isApiLoading && styles.apiRunButtonLoading]}
                onPress={simulateApiCall}
                disabled={isApiLoading}
              >
                {isApiLoading ? (
                  <Text style={styles.apiRunButtonText}>Running...</Text>
                ) : (
                  <>
                    <Ionicons name="play" size={16} color="#fff" />
                    <Text style={styles.apiRunButtonText}>Run Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.apiResponseBody}>
              <Text style={styles.apiResponseCode}>
                {apiResponse || '// Click "Run Request" to see the response'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.apiFullButton}
          onPress={() => setShowApiPlayground(true)}
        >
          <Ionicons name="code-slash" size={20} color="#fff" />
          <Text style={styles.apiFullButtonText}>Open Full API Playground</Text>
        </TouchableOpacity>
      </View>

      {/* Comparison Table */}
      <View style={styles.comparisonSection}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionBadge, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
            <Text style={[styles.sectionBadgeText, { color: '#EC4899' }]}>Comparison</Text>
          </View>
          <Text style={styles.sectionTitle}>Why Choose Taxxa</Text>
          <Text style={styles.sectionSubtitle}>
            See how we compare to traditional tax compliance solutions
          </Text>
        </View>

        <View style={styles.comparisonTable}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.comparisonHeaderFeature}>Feature</Text>
            <Text style={styles.comparisonHeaderTaxxa}>Taxxa</Text>
            <Text style={styles.comparisonHeaderOthers}>Others</Text>
          </View>
          {comparisonData.map((row, index) => (
            <View key={index} style={[styles.comparisonRow, index % 2 === 0 && styles.comparisonRowAlt]}>
              <Text style={styles.comparisonFeature}>{row.feature}</Text>
              <View style={styles.comparisonCell}>
                {row.taxxa === true ? (
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                ) : (
                  <Text style={styles.comparisonValue}>{row.taxxa}</Text>
                )}
              </View>
              <View style={styles.comparisonCell}>
                {row.others === true ? (
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                ) : row.others === false ? (
                  <Ionicons name="close-circle" size={22} color="#EF4444" />
                ) : (
                  <Text style={styles.comparisonValueOther}>{row.others}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <LinearGradient colors={['#3B82F6', '#8B5CF6']} style={styles.ctaSection}>
        <View style={styles.ctaContent}>
          <Text style={styles.ctaTitle}>Ready to Transform Tax Compliance?</Text>
          <Text style={styles.ctaSubtitle}>
            Join tax authorities worldwide using Taxxa to increase compliance and engage citizens
          </Text>
          <View style={[styles.ctaButtons, isMobile && styles.ctaButtonsMobile]}>
            <TouchableOpacity style={styles.ctaButtonPrimary} onPress={() => setShowContactModal(true)}>
              <Ionicons name="mail" size={20} color="#3B82F6" />
              <Text style={styles.ctaButtonPrimaryText}>Request a Demo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaButtonSecondary} onPress={() => setShowApiPlayground(true)}>
              <Ionicons name="code-slash" size={20} color="#fff" />
              <Text style={styles.ctaButtonSecondaryText}>Try API Playground</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ctaTrust}>
            <Ionicons name="shield-checkmark" size={16} color="#fff" />
            <Text style={styles.ctaTrustText}>SOC 2 Compliant</Text>
            <Text style={styles.ctaTrustDot}>•</Text>
            <Ionicons name="lock-closed" size={16} color="#fff" />
            <Text style={styles.ctaTrustText}>GDPR Ready</Text>
            <Text style={styles.ctaTrustDot}>•</Text>
            <Ionicons name="cloud" size={16} color="#fff" />
            <Text style={styles.ctaTrustText}>99.9% SLA</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerBrand}>
            <View style={styles.logo}>
              <LinearGradient colors={['#3B82F6', '#8B5CF6']} style={styles.logoIcon}>
                <Ionicons name="receipt" size={22} color="#fff" />
              </LinearGradient>
              <Text style={styles.logoTextWhite}>Taxxa</Text>
            </View>
            <Text style={styles.footerTagline}>
              Transforming tax compliance through citizen engagement.
            </Text>
          </View>
          <View style={styles.footerLinks}>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Product</Text>
              <TouchableOpacity><Text style={styles.footerLink}>Features</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>API Documentation</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Pricing</Text></TouchableOpacity>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Company</Text>
              <TouchableOpacity><Text style={styles.footerLink}>About</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Contact</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Careers</Text></TouchableOpacity>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Legal</Text>
              <TouchableOpacity><Text style={styles.footerLink}>Privacy</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Terms</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Security</Text></TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.footerBottom}>
          <Text style={styles.footerCopyright}>© 2026 Taxxa. All rights reserved.</Text>
        </View>
      </View>

      {/* API Playground Modal */}
      <Modal visible={showApiPlayground} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.apiPlaygroundModal, isMobile && styles.apiPlaygroundModalMobile]}>
            <View style={styles.apiPlaygroundHeader}>
              <View style={styles.apiPlaygroundTitleRow}>
                <Ionicons name="code-slash" size={24} color="#3B82F6" />
                <Text style={styles.apiPlaygroundTitle}>API Playground</Text>
              </View>
              <TouchableOpacity onPress={() => setShowApiPlayground(false)}>
                <Ionicons name="close" size={28} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.apiPlaygroundBody}>
              <Text style={styles.apiPlaygroundSubtitle}>
                Test Taxxa APIs in real-time. Select an endpoint and run a request.
              </Text>
              
              <View style={styles.apiPlaygroundContent}>
                <Text style={styles.apiPlaygroundSectionTitle}>Available Endpoints</Text>
                {apiEndpoints.map((endpoint, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.apiPlaygroundEndpoint,
                      apiEndpoint === endpoint.path && styles.apiPlaygroundEndpointActive,
                    ]}
                    onPress={() => { setApiEndpoint(endpoint.path); setApiMethod(endpoint.method); setApiResponse(''); }}
                  >
                    <View style={[
                      styles.apiMethodBadgeLarge,
                      { backgroundColor: endpoint.method === 'POST' ? '#10B98120' : '#3B82F620' }
                    ]}>
                      <Text style={[
                        styles.apiMethodTextLarge,
                        { color: endpoint.method === 'POST' ? '#10B981' : '#3B82F6' }
                      ]}>{endpoint.method}</Text>
                    </View>
                    <View style={styles.apiPlaygroundEndpointInfo}>
                      <Text style={styles.apiPlaygroundEndpointPath}>{endpoint.path}</Text>
                      <Text style={styles.apiPlaygroundEndpointDesc}>{endpoint.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}

                <View style={styles.apiPlaygroundRequest}>
                  <Text style={styles.apiPlaygroundSectionTitle}>Request</Text>
                  <View style={styles.apiCodeBlock}>
                    <Text style={styles.apiCodeText}>
                      {`curl -X ${apiMethod} \\
  https://api.taxxa.io${apiEndpoint} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"${apiMethod === 'POST' ? ` \\
  -d '{"qr_data": "receipt_qr_code_data"}'` : ''}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.apiPlaygroundResponse}>
                  <View style={styles.apiPlaygroundResponseHeader}>
                    <Text style={styles.apiPlaygroundSectionTitle}>Response</Text>
                    <TouchableOpacity 
                      style={[styles.apiPlaygroundRunButton, isApiLoading && styles.apiRunButtonLoading]}
                      onPress={simulateApiCall}
                      disabled={isApiLoading}
                    >
                      {isApiLoading ? (
                        <Text style={styles.apiPlaygroundRunButtonText}>Running...</Text>
                      ) : (
                        <>
                          <Ionicons name="play" size={18} color="#fff" />
                          <Text style={styles.apiPlaygroundRunButtonText}>Run Request</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                  <View style={styles.apiCodeBlock}>
                    <Text style={[styles.apiCodeText, { color: '#10B981' }]}>
                      {apiResponse || '// Response will appear here after running the request'}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Contact Modal */}
      <Modal visible={showContactModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.contactModal}>
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
                placeholder="Ministry / Tax Authority"
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
                <Text style={styles.modalSubmitText}>Submit Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  
  // Particles
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#8B5CF6',
    borderRadius: 100,
  },
  
  // Navigation
  nav: {
    backgroundColor: 'rgba(10, 10, 26, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    position: isWeb ? 'sticky' as any : 'relative',
    top: 0,
    zIndex: 100,
    backdropFilter: isWeb ? 'blur(20px)' : undefined,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1280,
    alignSelf: 'center',
    width: '100%',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  logoTextWhite: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  logoBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  logoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A78BFA',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  navLink: {
    paddingVertical: 8,
  },
  navLinkText: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
  },
  navButtonOutline: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  navButtonOutlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A78BFA',
  },
  navButtonPrimary: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
  },
  navButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  mobileMenuButton: {
    padding: 8,
  },
  mobileMenuDropdown: {
    backgroundColor: 'rgba(26, 26, 58, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.2)',
    paddingVertical: 8,
    marginTop: 16,
    borderRadius: 12,
  },
  mobileMenuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  mobileMenuItemText: {
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  mobileMenuCTA: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  mobileMenuCTAText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Hero
  hero: {
    paddingTop: 80,
    paddingBottom: 100,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    maxWidth: 900,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  heroContentMobile: {
    paddingHorizontal: 0,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  heroBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  heroBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A78BFA',
  },
  heroTitle: {
    fontSize: isWeb ? 56 : 40,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: isWeb ? 68 : 50,
    marginBottom: 24,
  },
  heroTitleMobile: {
    fontSize: 32,
    lineHeight: 42,
  },
  heroTitleGradient: {
    color: '#A78BFA',
  },
  heroSubtitle: {
    fontSize: 20,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 40,
    maxWidth: 700,
  },
  heroSubtitleMobile: {
    fontSize: 16,
    lineHeight: 26,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 60,
  },
  heroButtonsMobile: {
    flexDirection: 'column',
    width: '100%',
  },
  heroButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 12,
  },
  heroButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  heroButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  heroButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A78BFA',
  },
  
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statsRowMobile: {
    gap: 16,
  },
  statCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    minWidth: 140,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  
  // Features Section
  featuresSection: {
    paddingVertical: 100,
    paddingHorizontal: 24,
    backgroundColor: '#0f0f1f',
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 60,
  },
  sectionBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  sectionBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: isWeb ? 42 : 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 18,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 600,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    maxWidth: 1200,
    alignSelf: 'center',
  },
  featuresGridMobile: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderRadius: 20,
    padding: 28,
    width: isWeb ? 360 : '100%',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  featureCardActive: {
    borderColor: 'rgba(139, 92, 246, 0.5)',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  featureCardHovered: {
    transform: [{ scale: 1.02 }],
  },
  featureIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureStatBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    alignItems: 'flex-end',
  },
  featureStatValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  featureStatLabel: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 24,
  },
  featureActiveIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  
  // Demo Section
  demoSection: {
    paddingVertical: 100,
    paddingHorizontal: 24,
  },
  demoContainer: {
    flexDirection: 'row',
    maxWidth: 1100,
    alignSelf: 'center',
    gap: 60,
  },
  demoContainerMobile: {
    flexDirection: 'column',
    gap: 40,
  },
  demoSteps: {
    flex: 1,
    gap: 24,
  },
  demoStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 30, 60, 0.3)',
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  demoStepActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  demoStepIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoStepIconActive: {
    backgroundColor: '#8B5CF6',
  },
  demoStepContent: {
    flex: 1,
  },
  demoStepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
  },
  demoStepTitleActive: {
    color: '#fff',
  },
  demoStepDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
  },
  demoStepConnector: {
    position: 'absolute',
    left: 43,
    bottom: -24,
    width: 2,
    height: 24,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
  },
  demoStepConnectorActive: {
    backgroundColor: '#8B5CF6',
  },
  
  // Phone Demo
  demoVisual: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneFrame: {
    width: 280,
    height: 560,
    backgroundColor: '#1a1a2e',
    borderRadius: 40,
    padding: 12,
    borderWidth: 4,
    borderColor: '#2a2a4a',
  },
  phoneNotch: {
    width: 100,
    height: 28,
    backgroundColor: '#0a0a1a',
    borderRadius: 14,
    alignSelf: 'center',
    marginBottom: 12,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#0f0f1f',
    borderRadius: 28,
    overflow: 'hidden',
  },
  demoScreenContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  qrScanner: {
    width: 180,
    height: 180,
    position: 'relative',
    marginBottom: 24,
  },
  qrCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#8B5CF6',
    borderTopWidth: 4,
    borderLeftWidth: 4,
    top: 0,
    left: 0,
  },
  qrCornerTR: {
    top: 0,
    left: 'auto' as any,
    right: 0,
    borderLeftWidth: 0,
    borderRightWidth: 4,
  },
  qrCornerBL: {
    top: 'auto' as any,
    bottom: 0,
    borderTopWidth: 0,
    borderBottomWidth: 4,
  },
  qrCornerBR: {
    top: 'auto' as any,
    left: 'auto' as any,
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  qrScanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: '50%',
    height: 2,
    backgroundColor: '#8B5CF6',
  },
  demoScreenText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  verifyingIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  verifyBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  verifyBarFill: {
    width: '75%',
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  entryEarned: {
    alignItems: 'center',
    marginBottom: 24,
  },
  entryNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: '#10B981',
  },
  entryLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  receiptInfo: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  receiptMerchant: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  receiptAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  prizeShowcase: {
    alignItems: 'center',
  },
  prizeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  prizeAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 8,
  },
  prizeEntries: {
    fontSize: 14,
    color: '#94A3B8',
  },
  
  // API Preview
  apiPreviewSection: {
    paddingVertical: 100,
    paddingHorizontal: 24,
    backgroundColor: '#0f0f1f',
  },
  apiPreviewContainer: {
    flexDirection: 'row',
    maxWidth: 1100,
    alignSelf: 'center',
    gap: 24,
    marginBottom: 40,
  },
  apiPreviewContainerMobile: {
    flexDirection: 'column',
  },
  apiEndpointList: {
    flex: 1,
    gap: 12,
  },
  apiEndpointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  apiEndpointItemActive: {
    borderColor: 'rgba(59, 130, 246, 0.5)',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  apiMethodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  apiMethodText: {
    fontSize: 11,
    fontWeight: '700',
  },
  apiEndpointInfo: {
    flex: 1,
  },
  apiEndpointPath: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontFamily: isWeb ? 'monospace' : undefined,
  },
  apiEndpointDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  apiResponsePanel: {
    flex: 1.5,
    backgroundColor: 'rgba(10, 10, 26, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    overflow: 'hidden',
  },
  apiResponseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
  },
  apiResponseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  apiRunButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  apiRunButtonLoading: {
    backgroundColor: '#64748B',
  },
  apiRunButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  apiResponseBody: {
    padding: 16,
    minHeight: 200,
  },
  apiResponseCode: {
    fontSize: 13,
    color: '#10B981',
    fontFamily: isWeb ? 'monospace' : undefined,
    lineHeight: 22,
  },
  apiFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    paddingVertical: 16,
    borderRadius: 12,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  apiFullButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  
  // Comparison
  comparisonSection: {
    paddingVertical: 100,
    paddingHorizontal: 24,
    backgroundColor: '#0a0a1a',
  },
  comparisonTable: {
    maxWidth: 900,
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  comparisonHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  comparisonHeaderFeature: {
    flex: 2,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  comparisonHeaderTaxxa: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
    textAlign: 'center',
  },
  comparisonHeaderOthers: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  comparisonRowAlt: {
    backgroundColor: 'rgba(30, 30, 60, 0.3)',
  },
  comparisonFeature: {
    flex: 2,
    fontSize: 14,
    color: '#E2E8F0',
  },
  comparisonCell: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonValue: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  comparisonValueOther: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '500',
  },
  
  // CTA
  ctaSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  ctaContent: {
    maxWidth: 700,
    alignSelf: 'center',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: isWeb ? 36 : 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 32,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  ctaButtonsMobile: {
    flexDirection: 'column',
    width: '100%',
  },
  ctaButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  ctaButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ctaButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  ctaTrust: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  ctaTrustText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  ctaTrustDot: {
    color: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },
  
  // Footer
  footer: {
    backgroundColor: '#0a0a1a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  footerContent: {
    flexDirection: isWeb ? 'row' : 'column',
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
    marginBottom: 40,
    gap: 40,
  },
  footerBrand: {
    flex: 1,
  },
  footerTagline: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 16,
    maxWidth: 280,
    lineHeight: 22,
  },
  footerLinks: {
    flex: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 40,
  },
  footerColumn: {
    minWidth: 120,
  },
  footerColumnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footerLink: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerCopyright: {
    fontSize: 14,
    color: '#64748B',
  },
  
  // API Playground Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  apiPlaygroundModal: {
    backgroundColor: '#0f0f1f',
    borderRadius: 20,
    width: '100%',
    maxWidth: 900,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  apiPlaygroundModalMobile: {
    maxWidth: '100%',
  },
  apiPlaygroundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
  },
  apiPlaygroundTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  apiPlaygroundTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  apiPlaygroundBody: {
    padding: 24,
  },
  apiPlaygroundSubtitle: {
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 24,
  },
  apiPlaygroundContent: {
    gap: 24,
  },
  apiPlaygroundSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  apiPlaygroundEndpoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  apiPlaygroundEndpointActive: {
    borderColor: 'rgba(59, 130, 246, 0.5)',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  apiMethodBadgeLarge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  apiMethodTextLarge: {
    fontSize: 13,
    fontWeight: '700',
  },
  apiPlaygroundEndpointInfo: {
    flex: 1,
  },
  apiPlaygroundEndpointPath: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: isWeb ? 'monospace' : undefined,
  },
  apiPlaygroundEndpointDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  apiPlaygroundRequest: {
    marginTop: 8,
  },
  apiCodeBlock: {
    backgroundColor: 'rgba(10, 10, 26, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  apiCodeText: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: isWeb ? 'monospace' : undefined,
    lineHeight: 22,
  },
  apiPlaygroundResponse: {
    marginTop: 8,
  },
  apiPlaygroundResponseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  apiPlaygroundRunButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  apiPlaygroundRunButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Contact Modal
  contactModal: {
    backgroundColor: '#0f0f1f',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.2)',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
  },
  modalSubmitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
  },
  modalSubmitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
