import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  TextInput,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function LandingPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [showContactModal, setShowContactModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    organization: '',
    email: '',
    country: '',
    message: '',
  });

  // Why traditional compliance fails
  const whyComplianceFails = [
    {
      icon: 'close-circle',
      title: 'No Consumer Incentive',
      description: 'Consumers have no personal benefit from requesting receipts, so most don\'t bother - allowing businesses to underreport sales.',
      color: '#EF4444',
    },
    {
      icon: 'cash',
      title: 'Penalty-Only Approach',
      description: 'Traditional enforcement relies solely on penalties and audits, which are expensive, reactive, and create adversarial relationships.',
      color: '#F97316',
    },
    {
      icon: 'time',
      title: 'Delayed Detection',
      description: 'Tax evasion is typically discovered months or years later during audits, by which time significant revenue has already been lost.',
      color: '#EAB308',
    },
    {
      icon: 'analytics',
      title: 'Information Asymmetry',
      description: 'Tax authorities lack real-time visibility into retail transactions, relying on self-reported data from the very entities they\'re trying to regulate.',
      color: '#8B5CF6',
    },
    {
      icon: 'people',
      title: 'Public Disengagement',
      description: 'Citizens view tax compliance as the government\'s problem, not realizing they\'re indirect victims when businesses evade taxes.',
      color: '#6366F1',
    },
    {
      icon: 'wallet',
      title: 'High Enforcement Costs',
      description: 'Manual audits, investigations, and legal proceedings are resource-intensive, often costing more than the recovered revenue.',
      color: '#EC4899',
    },
  ];

  // The challenges we solve
  const challenges = [
    {
      icon: 'trending-down',
      title: 'Tax Evasion',
      description: 'Businesses underreport sales when consumers don\'t request receipts, leading to significant revenue loss.',
      color: '#EF4444',
    },
    {
      icon: 'document-text',
      title: 'Low Receipt Demand',
      description: 'Without incentives, consumers rarely request official tax receipts for their purchases.',
      color: '#F59E0B',
    },
    {
      icon: 'eye-off',
      title: 'Limited Visibility',
      description: 'Tax authorities lack real-time data on retail transactions and merchant compliance.',
      color: '#8B5CF6',
    },
    {
      icon: 'people',
      title: 'Public Distrust',
      description: 'Citizens often perceive tax systems as opaque and unfair, reducing voluntary compliance.',
      color: '#6366F1',
    },
  ];

  const solutions = [
    {
      icon: 'gift',
      title: 'Incentivized Receipt Collection',
      description: 'Citizens are motivated to request and scan tax receipts through prize draw incentives, creating natural demand for compliant transactions.',
    },
    {
      icon: 'shield-checkmark',
      title: 'Real-Time Verification',
      description: 'Every scanned receipt is instantly validated against your tax authority database, ensuring authenticity and creating an immutable audit trail.',
    },
    {
      icon: 'analytics',
      title: 'Comprehensive Analytics',
      description: 'Access real-time dashboards showing transaction volumes, merchant compliance rates, geographic distribution, and trend analysis.',
    },
    {
      icon: 'lock-closed',
      title: 'Cryptographic Transparency',
      description: 'All prize draws use verifiable random selection with full audit trails, building public trust through mathematical proof of fairness.',
    },
  ];

  const deploymentProcess = [
    {
      phase: 'Phase 1',
      title: 'Discovery & Planning',
      duration: '2-3 Weeks',
      description: 'We assess your existing tax infrastructure, define integration requirements, and create a detailed implementation roadmap.',
      tasks: [
        'Technical infrastructure assessment',
        'API specification review',
        'Security & compliance requirements',
        'Project timeline & milestones',
      ],
      icon: 'search',
    },
    {
      phase: 'Phase 2',
      title: 'Integration & Development',
      duration: '4-6 Weeks',
      description: 'Our team integrates Taxxa with your receipt verification systems and configures the platform for your jurisdiction.',
      tasks: [
        'API integration with tax authority systems',
        'Custom branding & localization',
        'Prize structure configuration',
        'Admin portal setup & training',
      ],
      icon: 'code-slash',
    },
    {
      phase: 'Phase 3',
      title: 'Testing & Validation',
      duration: '2-3 Weeks',
      description: 'Comprehensive testing ensures system reliability, security, and seamless user experience before public launch.',
      tasks: [
        'End-to-end system testing',
        'Security penetration testing',
        'Load & performance testing',
        'User acceptance testing (UAT)',
      ],
      icon: 'checkmark-done',
    },
    {
      phase: 'Phase 4',
      title: 'Launch & Support',
      duration: 'Ongoing',
      description: 'We support your public launch with marketing materials, monitor system performance, and provide continuous optimization.',
      tasks: [
        'Public launch coordination',
        'Real-time monitoring & alerts',
        '24/7 technical support',
        'Quarterly performance reviews',
      ],
      icon: 'rocket',
    },
  ];

  const benefits = [
    {
      metric: '15-30%',
      label: 'Increase in Receipt Issuance',
      description: 'Based on implementations in similar lottery receipt programs globally',
    },
    {
      metric: '10-20%',
      label: 'VAT Revenue Growth',
      description: 'Documented increases from Taiwan, Portugal, and Slovakia programs',
    },
    {
      metric: 'Real-Time',
      label: 'Transaction Visibility',
      description: 'Instant access to retail transaction data across all participating merchants',
    },
    {
      metric: '99.9%',
      label: 'System Uptime',
      description: 'Enterprise-grade infrastructure with redundancy and disaster recovery',
    },
  ];

  const caseStudies = [
    {
      country: 'Taiwan',
      code: 'TW',
      program: 'Uniform Invoice Lottery',
      result: 'Running since 1951, this program has achieved near-universal receipt issuance and is credited with significantly reducing tax evasion.',
      color: '#E53935',
    },
    {
      country: 'Portugal',
      code: 'PT',
      program: 'Fatura da Sorte',
      result: 'Launched in 2014, the program increased invoice requests by 15% and generated millions in previously unreported transactions.',
      color: '#43A047',
    },
    {
      country: 'Slovakia',
      code: 'SK',
      program: 'Receipt Lottery',
      result: 'Implemented in 2013, resulting in documented VAT revenue increases and improved merchant compliance rates.',
      color: '#1E88E5',
    },
  ];

  const testimonials = [
    {
      quote: "The architecture is solid - using cryptographic verification for draw fairness is exactly what government systems need. This builds trust that traditional random selection cannot.",
      name: "Dr. Michael Chen",
      title: "Blockchain & Government Systems Researcher",
      organization: "MIT Digital Currency Initiative",
      avatar: "MC",
    },
    {
      quote: "Receipt lottery systems have proven effective globally. The key is seamless integration with existing tax infrastructure - which this platform handles elegantly.",
      name: "Sarah Okonkwo",
      title: "Tax Policy Consultant",
      organization: "World Bank Group",
      avatar: "SO",
    },
    {
      quote: "From a technical standpoint, the API-first approach allows any tax authority to integrate without overhauling their existing systems. That's critical for adoption.",
      name: "Andreas Mueller",
      title: "Senior Solutions Architect",
      organization: "Former SAP Public Sector",
      avatar: "AM",
    },
  ];

  const features = [
    {
      category: 'Integration',
      items: [
        'RESTful API with comprehensive documentation',
        'Support for QR, barcode, and digital receipts',
        'Webhook notifications for real-time events',
        'OAuth 2.0 and API key authentication',
        'Sandbox environment for testing',
      ],
    },
    {
      category: 'Administration',
      items: [
        'Multi-tenant architecture for regional deployment',
        'Role-based access control (RBAC)',
        'Configurable draw frequencies and prize structures',
        'Merchant management and compliance tracking',
        'Automated fraud detection algorithms',
      ],
    },
    {
      category: 'Analytics',
      items: [
        'Real-time transaction dashboards',
        'Geographic heat maps of scanning activity',
        'Merchant compliance scoring',
        'Revenue impact projections',
        'Exportable reports (PDF, CSV, API)',
      ],
    },
    {
      category: 'Security',
      items: [
        'End-to-end encryption (TLS 1.3)',
        'SOC 2 Type II compliance ready',
        'GDPR-compliant data handling',
        'Cryptographic audit trails',
        'Regular third-party security audits',
      ],
    },
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
          <View style={styles.logo}>
            <View style={styles.logoIcon}>
              <Ionicons name="receipt" size={24} color="#fff" />
            </View>
            <Text style={styles.logoText}>Taxxa</Text>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>Enterprise</Text>
            </View>
          </View>
          <View style={styles.navLinks}>
            <TouchableOpacity style={styles.navLink}>
              <Text style={styles.navLinkText}>Solution</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navLink}>
              <Text style={styles.navLinkText}>How It Works</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navLink}>
              <Text style={styles.navLinkText}>Case Studies</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navLink}>
              <Text style={styles.navLinkText}>Documentation</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.navButtonPrimary}
              onPress={() => setShowContactModal(true)}
            >
              <Text style={styles.navButtonPrimaryText}>Request Demo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Hero Section */}
      <LinearGradient
        colors={['#0F172A', '#1E3A5F', '#0F172A']}
        style={styles.hero}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroBadge}>
            <Ionicons name="globe" size={14} color="#60A5FA" />
            <Text style={styles.heroBadgeText}>Trusted by Tax Authorities Worldwide</Text>
          </View>
          <Text style={styles.heroTitle}>
            Increase Tax Compliance{'\n'}
            <Text style={styles.heroTitleHighlight}>Through Citizen Engagement</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Taxxa is a proven digital platform that incentivizes consumers to request tax receipts, 
            dramatically increasing compliance rates and providing tax authorities with unprecedented 
            transaction visibility.
          </Text>
          <View style={styles.heroButtons}>
            <TouchableOpacity 
              style={styles.heroButtonPrimary}
              onPress={() => setShowContactModal(true)}
            >
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={styles.heroButtonPrimaryText}>Schedule a Demo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.heroButtonSecondary}
              onPress={() => router.push('/admin')}
            >
              <Ionicons name="desktop" size={20} color="#3B82F6" />
              <Text style={styles.heroButtonSecondaryText}>View Admin Portal</Text>
            </TouchableOpacity>
          </View>
          
          {/* Trust Indicators */}
          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              <Text style={styles.trustText}>SOC 2 Ready</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="lock-closed" size={20} color="#10B981" />
              <Text style={styles.trustText}>GDPR Compliant</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="cloud" size={20} color="#10B981" />
              <Text style={styles.trustText}>99.9% Uptime SLA</Text>
            </View>
          </View>
        </View>
        
        {/* Dashboard Preview */}
        {isWeb && (
          <View style={styles.heroImage}>
            <View style={styles.dashboardPreview}>
              <View style={styles.dashboardHeader}>
                <View style={styles.dashboardDots}>
                  <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                  <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                  <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                </View>
                <Text style={styles.dashboardTitle}>Taxxa Admin Portal</Text>
              </View>
              <View style={styles.dashboardBody}>
                <View style={styles.dashboardSidebar}>
                  <View style={styles.sidebarItem}><Ionicons name="grid" size={16} color="#3B82F6" /></View>
                  <View style={styles.sidebarItem}><Ionicons name="people" size={16} color="#64748B" /></View>
                  <View style={styles.sidebarItem}><Ionicons name="trophy" size={16} color="#64748B" /></View>
                  <View style={styles.sidebarItem}><Ionicons name="analytics" size={16} color="#64748B" /></View>
                </View>
                <View style={styles.dashboardContent}>
                  <View style={styles.miniStatsGrid}>
                    <View style={styles.miniStatCard}>
                      <Text style={styles.miniStatValue}>1.2M</Text>
                      <Text style={styles.miniStatLabel}>Scans Today</Text>
                    </View>
                    <View style={styles.miniStatCard}>
                      <Text style={styles.miniStatValue}>94%</Text>
                      <Text style={styles.miniStatLabel}>Compliance</Text>
                    </View>
                    <View style={styles.miniStatCard}>
                      <Text style={styles.miniStatValue}>+18%</Text>
                      <Text style={styles.miniStatLabel}>Revenue</Text>
                    </View>
                  </View>
                  <View style={styles.chartPlaceholder}>
                    <Ionicons name="bar-chart" size={48} color="#3B82F6" />
                    <Text style={styles.chartText}>Real-Time Analytics</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Why Compliance Fails Section - Compact Cards */}
      <View style={[styles.section, styles.sectionLight]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTag, { color: '#EF4444' }]}>THE PROBLEM</Text>
          <Text style={styles.sectionTitle}>Why Traditional Compliance Doesn't Work</Text>
          <Text style={styles.sectionSubtitle}>
            Tax authorities worldwide struggle with the same fundamental challenges.
          </Text>
        </View>
        <View style={styles.compactCardGrid}>
          {whyComplianceFails.map((item, index) => (
            <View key={index} style={styles.compactCard}>
              <View style={[styles.compactCardIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={styles.compactCardTitle}>{item.title}</Text>
              <Text style={styles.compactCardDesc}>{item.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* The Taxxa Solution */}
      <View style={[styles.section, styles.sectionDark]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTag, { color: '#10B981' }]}>THE SOLUTION</Text>
          <Text style={[styles.sectionTitle, { color: '#fff' }]}>How Taxxa Solves This</Text>
          <Text style={[styles.sectionSubtitle, { color: '#94A3B8' }]}>
            Instead of fighting human nature, Taxxa works with it - turning citizens into active 
            participants in tax compliance through incentives and engagement.
          </Text>
        </View>
        <View style={styles.solutionsGrid}>
          {solutions.map((solution, index) => (
            <View key={index} style={styles.solutionCard}>
              <View style={styles.solutionIcon}>
                <Ionicons name={solution.icon as any} size={32} color="#3B82F6" />
              </View>
              <Text style={styles.solutionTitle}>{solution.title}</Text>
              <Text style={styles.solutionDescription}>{solution.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Deployment Process - Compact Horizontal Cards */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTag}>DEPLOYMENT</Text>
          <Text style={styles.sectionTitle}>Implementation Process</Text>
          <Text style={styles.sectionSubtitle}>
            From initial assessment to public launch in 8-12 weeks.
          </Text>
        </View>
        <View style={styles.deploymentGrid}>
          {deploymentProcess.map((phase, index) => (
            <View key={index} style={styles.deploymentCard}>
              <View style={styles.deploymentCardHeader}>
                <View style={styles.deploymentPhaseNumber}>
                  <Text style={styles.deploymentPhaseNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.deploymentHeaderInfo}>
                  <Text style={styles.deploymentCardPhase}>{phase.phase}</Text>
                  <Text style={styles.deploymentCardTitle}>{phase.title}</Text>
                </View>
                <View style={styles.deploymentDuration}>
                  <Ionicons name="time-outline" size={14} color="#64748B" />
                  <Text style={styles.deploymentDurationText}>{phase.duration}</Text>
                </View>
              </View>
              <View style={styles.deploymentTasksRow}>
                {phase.tasks.slice(0, 3).map((task, taskIndex) => (
                  <View key={taskIndex} style={styles.deploymentTaskChip}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.deploymentTaskChipText}>{task}</Text>
                  </View>
                ))}
                {phase.tasks.length > 3 && (
                  <View style={styles.deploymentTaskMore}>
                    <Text style={styles.deploymentTaskMoreText}>+{phase.tasks.length - 3} more</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Impact Metrics */}
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.metricsSection}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTag, { color: '#C7D2FE' }]}>PROVEN RESULTS</Text>
          <Text style={[styles.sectionTitle, { color: '#fff' }]}>Expected Impact</Text>
          <Text style={[styles.sectionSubtitle, { color: '#E0E7FF' }]}>
            Based on global receipt lottery program data and our implementation experience.
          </Text>
        </View>
        <View style={styles.metricsGrid}>
          {benefits.map((benefit, index) => (
            <View key={index} style={styles.metricCard}>
              <Text style={styles.metricValue}>{benefit.metric}</Text>
              <Text style={styles.metricLabel}>{benefit.label}</Text>
              <Text style={styles.metricDescription}>{benefit.description}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Case Studies */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTag}>GLOBAL PRECEDENTS</Text>
          <Text style={styles.sectionTitle}>Proven Worldwide</Text>
          <Text style={styles.sectionSubtitle}>
            Receipt lottery programs have been successfully implemented by governments around the world.
          </Text>
        </View>
        <View style={styles.caseStudiesGrid}>
          {caseStudies.map((study, index) => (
            <View key={index} style={styles.caseStudyCard}>
              <View style={styles.caseStudyHeader}>
                <View style={[styles.countryBadge, { backgroundColor: study.color }]}>
                  <Text style={styles.countryBadgeText}>{study.code}</Text>
                </View>
                <View style={styles.caseStudyInfo}>
                  <Text style={styles.caseStudyCountry}>{study.country}</Text>
                  <Text style={styles.caseStudyProgram}>{study.program}</Text>
                </View>
              </View>
              <Text style={styles.caseStudyResult}>{study.result}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Technical Features */}
      <View style={[styles.section, styles.sectionLight]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTag}>TECHNICAL SPECIFICATIONS</Text>
          <Text style={styles.sectionTitle}>Enterprise-Grade Platform</Text>
          <Text style={styles.sectionSubtitle}>
            Built for government-scale deployments with security, reliability, and flexibility.
          </Text>
        </View>
        <View style={styles.featuresGrid}>
          {features.map((category, index) => (
            <View key={index} style={styles.featureCategory}>
              <Text style={styles.featureCategoryTitle}>{category.category}</Text>
              {category.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.featureItemText}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Testimonials */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTag}>EXPERT PERSPECTIVES</Text>
          <Text style={styles.sectionTitle}>What Experts Say</Text>
          <Text style={styles.sectionSubtitle}>
            Insights from policy experts, technologists, and government systems specialists.
          </Text>
        </View>
        <View style={styles.testimonialsGrid}>
          {testimonials.map((testimonial, index) => (
            <View key={index} style={styles.testimonialCard}>
              <Ionicons name="chatbubble-ellipses" size={32} color="#E2E8F0" style={styles.quoteIcon} />
              <Text style={styles.testimonialText}>"{testimonial.quote}"</Text>
              <View style={styles.testimonialAuthor}>
                <View style={styles.testimonialAvatar}>
                  <Text style={styles.testimonialAvatarText}>{testimonial.avatar}</Text>
                </View>
                <View>
                  <Text style={styles.testimonialName}>{testimonial.name}</Text>
                  <Text style={styles.testimonialTitle}>{testimonial.title}</Text>
                  <Text style={styles.testimonialOrg}>{testimonial.organization}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <View style={styles.ctaContent}>
          <Text style={styles.ctaTitle}>Ready to Transform Tax Compliance?</Text>
          <Text style={styles.ctaSubtitle}>
            Schedule a personalized demonstration and learn how Taxxa can be configured 
            for your jurisdiction's specific requirements.
          </Text>
          <View style={styles.ctaButtons}>
            <TouchableOpacity 
              style={styles.ctaButtonPrimary}
              onPress={() => setShowContactModal(true)}
            >
              <Ionicons name="mail" size={20} color="#fff" />
              <Text style={styles.ctaButtonPrimaryText}>Request a Quote</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.ctaButtonSecondary}
              onPress={() => setShowContactModal(true)}
            >
              <Ionicons name="calendar" size={20} color="#1E293B" />
              <Text style={styles.ctaButtonSecondaryText}>Schedule Demo</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ctaContact}>
            <Text style={styles.ctaContactText}>Or contact us directly:</Text>
            <Text style={styles.ctaContactEmail}>partnerships@taxxa.io</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerBrand}>
            <View style={styles.logo}>
              <View style={styles.logoIcon}>
                <Ionicons name="receipt" size={24} color="#fff" />
              </View>
              <Text style={styles.logoTextWhite}>Taxxa</Text>
            </View>
            <Text style={styles.footerTagline}>
              Transforming tax compliance through citizen engagement and modern technology.
            </Text>
          </View>
          
          <View style={styles.footerLinks}>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Platform</Text>
              <TouchableOpacity><Text style={styles.footerLink}>Solution Overview</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Technical Specs</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>API Documentation</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Security</Text></TouchableOpacity>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Resources</Text>
              <TouchableOpacity><Text style={styles.footerLink}>Case Studies</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>White Papers</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Research</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Blog</Text></TouchableOpacity>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Company</Text>
              <TouchableOpacity><Text style={styles.footerLink}>About Us</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Leadership</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Careers</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Contact</Text></TouchableOpacity>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Legal</Text>
              <TouchableOpacity><Text style={styles.footerLink}>Privacy Policy</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Terms of Service</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Data Processing</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Compliance</Text></TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={styles.footerBottom}>
          <Text style={styles.footerCopyright}>
            © 2026 Taxxa Technologies. All rights reserved.
          </Text>
          <View style={styles.footerCerts}>
            <View style={styles.certBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#10B981" />
              <Text style={styles.certText}>SOC 2</Text>
            </View>
            <View style={styles.certBadge}>
              <Ionicons name="lock-closed" size={14} color="#10B981" />
              <Text style={styles.certText}>GDPR</Text>
            </View>
            <View style={styles.certBadge}>
              <Ionicons name="ribbon" size={14} color="#10B981" />
              <Text style={styles.certText}>ISO 27001</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Contact Modal */}
      <Modal visible={showContactModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Information</Text>
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
                placeholder="Ministry / Tax Authority / Organization"
                placeholderTextColor="#64748B"
                value={contactForm.organization}
                onChangeText={(text) => setContactForm({...contactForm, organization: text})}
              />
              
              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="your.email@gov.xx"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                value={contactForm.email}
                onChangeText={(text) => setContactForm({...contactForm, email: text})}
              />
              
              <Text style={styles.inputLabel}>Country / Region *</Text>
              <TextInput
                style={styles.input}
                placeholder="Select your country"
                placeholderTextColor="#64748B"
                value={contactForm.country}
                onChangeText={(text) => setContactForm({...contactForm, country: text})}
              />
              
              <Text style={styles.inputLabel}>How can we help? *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about your requirements, questions, or interest in Taxxa..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={4}
                value={contactForm.message}
                onChangeText={(text) => setContactForm({...contactForm, message: text})}
              />
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCancelBtn}
                onPress={() => setShowContactModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSubmitBtn}
                onPress={handleSubmitInquiry}
              >
                <Text style={styles.modalSubmitText}>Submit Inquiry</Text>
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
    backgroundColor: '#fff',
  },
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
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },
  logoTextWhite: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  logoBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  logoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    display: isWeb ? 'flex' : 'none',
  },
  navLink: {
    paddingVertical: 8,
  },
  navLinkText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  navButtonPrimary: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  navButtonPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // Hero
  hero: {
    flexDirection: isWeb ? 'row' : 'column',
    paddingVertical: 80,
    paddingHorizontal: 24,
    minHeight: isWeb ? 700 : 600,
    alignItems: 'center',
  },
  heroContent: {
    flex: 1,
    maxWidth: isWeb ? 600 : '100%',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  heroBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60A5FA',
  },
  heroTitle: {
    fontSize: isWeb ? 48 : 36,
    fontWeight: '800',
    color: '#fff',
    lineHeight: isWeb ? 58 : 44,
    marginBottom: 24,
  },
  heroTitleHighlight: {
    color: '#60A5FA',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#94A3B8',
    lineHeight: 28,
    marginBottom: 32,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
    flexWrap: 'wrap',
  },
  heroButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 10,
  },
  heroButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  heroButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  heroButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#60A5FA',
  },
  trustRow: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  heroImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 48,
  },
  dashboardPreview: {
    width: 500,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dashboardDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dashboardTitle: {
    color: '#64748B',
    fontSize: 13,
  },
  dashboardBody: {
    flexDirection: 'row',
    minHeight: 300,
  },
  dashboardSidebar: {
    width: 48,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    paddingTop: 16,
    gap: 16,
  },
  sidebarItem: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardContent: {
    flex: 1,
    padding: 16,
  },
  miniStatsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  miniStatLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  chartPlaceholder: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  chartText: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 8,
  },
  // Sections
  section: {
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  sectionDark: {
    backgroundColor: '#0F172A',
  },
  sectionLight: {
    backgroundColor: '#F8FAFC',
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 48,
    maxWidth: 700,
    alignSelf: 'center',
  },
  sectionTag: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: isWeb ? 40 : 32,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 28,
  },
  // Compact Cards for Why Compliance Fails
  compactCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    maxWidth: 1100,
    alignSelf: 'center',
  },
  compactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: isWeb ? 340 : '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  compactCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  compactCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  compactCardDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  // Solutions
  solutionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    maxWidth: 1000,
    alignSelf: 'center',
  },
  solutionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 28,
    width: isWeb ? 460 : '100%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  solutionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  solutionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  solutionDescription: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 24,
  },
  // Deployment Grid - Compact Cards
  deploymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    maxWidth: 1100,
    alignSelf: 'center',
  },
  deploymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: isWeb ? 530 : '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deploymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deploymentPhaseNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deploymentPhaseNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  deploymentHeaderInfo: {
    flex: 1,
  },
  deploymentCardPhase: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deploymentCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
  },
  deploymentDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  deploymentDurationText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  deploymentTasksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deploymentTaskChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  deploymentTaskChipText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  deploymentTaskMore: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deploymentTaskMoreText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  // Metrics
  metricsSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    maxWidth: 1000,
    alignSelf: 'center',
  },
  metricCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 28,
    width: isWeb ? 220 : '45%',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  metricDescription: {
    fontSize: 13,
    color: '#C7D2FE',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Case Studies
  caseStudiesGrid: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 24,
    maxWidth: 1000,
    alignSelf: 'center',
  },
  caseStudyCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  caseStudyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  countryBadge: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  countryBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  caseStudyInfo: {
    flex: 1,
  },
  caseStudyCountry: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  caseStudyProgram: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  caseStudyResult: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
  },
  // Features
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 32,
    maxWidth: 1000,
    alignSelf: 'center',
  },
  featureCategory: {
    width: isWeb ? 220 : '45%',
  },
  featureCategoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  featureItemText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  // Testimonials
  testimonialsGrid: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 24,
    maxWidth: 1100,
    alignSelf: 'center',
  },
  testimonialCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quoteIcon: {
    marginBottom: 16,
  },
  testimonialText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 26,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testimonialAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testimonialAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  testimonialTitle: {
    fontSize: 13,
    color: '#64748B',
  },
  testimonialOrg: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  // CTA
  ctaSection: {
    backgroundColor: '#0F172A',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  ctaContent: {
    maxWidth: 600,
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
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 28,
  },
  ctaButtons: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 16,
    marginBottom: 32,
  },
  ctaButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 10,
    minWidth: 200,
  },
  ctaButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  ctaButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 10,
    minWidth: 200,
  },
  ctaButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  ctaContact: {
    alignItems: 'center',
  },
  ctaContactText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  ctaContactEmail: {
    fontSize: 16,
    color: '#60A5FA',
    fontWeight: '500',
  },
  // Footer
  footer: {
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 64,
    paddingHorizontal: 24,
  },
  footerContent: {
    flexDirection: isWeb ? 'row' : 'column',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    marginBottom: 48,
  },
  footerBrand: {
    flex: isWeb ? 1.5 : undefined,
    marginBottom: isWeb ? 0 : 40,
    marginRight: isWeb ? 48 : 0,
  },
  footerTagline: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 16,
    maxWidth: 300,
    lineHeight: 24,
  },
  footerLinks: {
    flex: isWeb ? 2.5 : undefined,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: isWeb ? 'space-between' : 'flex-start',
    gap: isWeb ? 0 : 32,
  },
  footerColumn: {
    minWidth: isWeb ? 120 : '45%',
  },
  footerColumnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
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
    borderTopColor: '#1E293B',
    paddingVertical: 24,
    flexDirection: isWeb ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  footerCopyright: {
    fontSize: 14,
    color: '#64748B',
  },
  footerCerts: {
    flexDirection: 'row',
    gap: 16,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  certText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: '#1E293B',
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
    borderTopColor: '#E2E8F0',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSubmitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#3B82F6',
  },
  modalSubmitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
