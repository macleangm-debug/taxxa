import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: 'scan',
      title: 'Scan Receipts',
      description: 'Simply scan the QR code on your tax receipt using your smartphone camera.',
      color: '#3B82F6',
    },
    {
      icon: 'ticket',
      title: 'Earn Entries',
      description: 'Each valid receipt earns you entries into weekly and monthly prize draws.',
      color: '#10B981',
    },
    {
      icon: 'trophy',
      title: 'Win Prizes',
      description: 'Win cash prizes and rewards through our transparent, auditable draw system.',
      color: '#F59E0B',
    },
    {
      icon: 'people',
      title: 'Refer Friends',
      description: 'Invite friends and earn bonus entries when they join and scan receipts.',
      color: '#8B5CF6',
    },
  ];

  const benefits = [
    {
      icon: 'cash',
      title: 'Win Real Money',
      description: 'Weekly and monthly cash prizes up to TSh 10,000,000',
    },
    {
      icon: 'shield-checkmark',
      title: 'Secure & Fair',
      description: 'Cryptographically verified draws with full audit trails',
    },
    {
      icon: 'flash',
      title: 'Instant Verification',
      description: 'Receipts verified in seconds through official tax authority systems',
    },
    {
      icon: 'notifications',
      title: 'Never Miss a Draw',
      description: 'Push notifications for draw reminders and winner announcements',
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Get a Tax Receipt',
      description: 'Make purchases from registered businesses and request your official tax receipt with QR code.',
      icon: 'receipt',
    },
    {
      step: 2,
      title: 'Scan the QR Code',
      description: 'Open TaxDraw app and scan the QR code on your receipt. We verify it with tax authorities instantly.',
      icon: 'qr-code',
    },
    {
      step: 3,
      title: 'Earn Draw Entries',
      description: 'Each valid receipt earns you entries. More receipts = more chances to win!',
      icon: 'star',
    },
    {
      step: 4,
      title: 'Win Prizes!',
      description: 'Winners are selected through transparent, cryptographically secure draws every week and month.',
      icon: 'gift',
    },
  ];

  const stats = [
    { value: '50K+', label: 'Active Users' },
    { value: 'TSh 100M+', label: 'Prizes Awarded' },
    { value: '1M+', label: 'Receipts Scanned' },
    { value: '99.9%', label: 'Uptime' },
  ];

  const forGovernment = [
    {
      icon: 'trending-up',
      title: 'Increase Tax Compliance',
      description: 'Incentivize consumers to request receipts, reducing tax evasion.',
    },
    {
      icon: 'analytics',
      title: 'Real-Time Data',
      description: 'Access detailed analytics on consumer spending and merchant compliance.',
    },
    {
      icon: 'eye',
      title: 'Transparency',
      description: 'Full audit trails and verifiable draw mechanisms build public trust.',
    },
    {
      icon: 'globe',
      title: 'Scalable Solution',
      description: 'Deploy across multiple regions with multi-currency support.',
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Navigation */}
      <View style={styles.nav}>
        <View style={styles.navContent}>
          <View style={styles.logo}>
            <Ionicons name="receipt" size={28} color="#3B82F6" />
            <Text style={styles.logoText}>TaxDraw</Text>
          </View>
          <View style={styles.navLinks}>
            <TouchableOpacity style={styles.navLink}>
              <Text style={styles.navLinkText}>Features</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navLink}>
              <Text style={styles.navLinkText}>How It Works</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navLink}>
              <Text style={styles.navLinkText}>For Government</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.navButtonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.navButtonPrimary}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.navButtonPrimaryText}>Get Started</Text>
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
            <Ionicons name="sparkles" size={14} color="#F59E0B" />
            <Text style={styles.heroBadgeText}>Transforming Tax Compliance</Text>
          </View>
          <Text style={styles.heroTitle}>
            Scan Receipts.{'\n'}
            <Text style={styles.heroTitleHighlight}>Win Prizes.</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Turn your everyday purchases into chances to win big. Scan tax receipts, 
            earn entries, and participate in weekly and monthly prize draws.
          </Text>
          <View style={styles.heroButtons}>
            <TouchableOpacity 
              style={styles.heroButtonPrimary}
              onPress={() => router.push('/(auth)/register')}
            >
              <Ionicons name="phone-portrait" size={20} color="#fff" />
              <Text style={styles.heroButtonPrimaryText}>Download App</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroButtonSecondary}>
              <Ionicons name="play-circle" size={20} color="#3B82F6" />
              <Text style={styles.heroButtonSecondaryText}>Watch Demo</Text>
            </TouchableOpacity>
          </View>
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Phone Mockup */}
        <View style={styles.heroImage}>
          <View style={styles.phoneMockup}>
            <View style={styles.phoneScreen}>
              <View style={styles.phoneHeader}>
                <Text style={styles.phoneHeaderText}>TaxDraw</Text>
              </View>
              <View style={styles.phoneContent}>
                <Ionicons name="scan" size={48} color="#3B82F6" />
                <Text style={styles.phoneTitle}>Scan to Win!</Text>
                <Text style={styles.phoneSubtitle}>Your entries: 24</Text>
                <View style={styles.phoneButton}>
                  <Text style={styles.phoneButtonText}>Scan Receipt</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Features Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTag}>FEATURES</Text>
          <Text style={styles.sectionTitle}>Everything You Need to Win</Text>
          <Text style={styles.sectionSubtitle}>
            Simple, secure, and rewarding. Here's how TaxDraw makes tax compliance exciting.
          </Text>
        </View>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                <Ionicons name={feature.icon as any} size={28} color={feature.color} />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* How It Works Section */}
      <View style={[styles.section, styles.sectionDark]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTag, { color: '#60A5FA' }]}>HOW IT WORKS</Text>
          <Text style={[styles.sectionTitle, { color: '#fff' }]}>Start Winning in 4 Easy Steps</Text>
          <Text style={[styles.sectionSubtitle, { color: '#94A3B8' }]}>
            From receipt to reward in minutes. It's that simple.
          </Text>
        </View>
        <View style={styles.stepsContainer}>
          {howItWorks.map((item, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{item.step}</Text>
              </View>
              <View style={styles.stepContent}>
                <View style={styles.stepIconContainer}>
                  <Ionicons name={item.icon as any} size={32} color="#3B82F6" />
                </View>
                <Text style={styles.stepTitle}>{item.title}</Text>
                <Text style={styles.stepDescription}>{item.description}</Text>
              </View>
              {index < howItWorks.length - 1 && <View style={styles.stepConnector} />}
            </View>
          ))}
        </View>
      </View>

      {/* Benefits Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTag}>BENEFITS</Text>
          <Text style={styles.sectionTitle}>Why Choose TaxDraw?</Text>
          <Text style={styles.sectionSubtitle}>
            More than just a lottery app. We're building trust in the tax system.
          </Text>
        </View>
        <View style={styles.benefitsGrid}>
          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitCard}>
              <View style={styles.benefitIcon}>
                <Ionicons name={benefit.icon as any} size={24} color="#3B82F6" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* For Government Section */}
      <View style={[styles.section, styles.sectionGradient]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTag, { color: '#A5B4FC' }]}>FOR TAX AUTHORITIES</Text>
          <Text style={[styles.sectionTitle, { color: '#fff' }]}>Partner With Us</Text>
          <Text style={[styles.sectionSubtitle, { color: '#C7D2FE' }]}>
            Join tax authorities worldwide using TaxDraw to boost compliance and revenue.
          </Text>
        </View>
        <View style={styles.govGrid}>
          {forGovernment.map((item, index) => (
            <View key={index} style={styles.govCard}>
              <View style={styles.govIcon}>
                <Ionicons name={item.icon as any} size={28} color="#fff" />
              </View>
              <Text style={styles.govTitle}>{item.title}</Text>
              <Text style={styles.govDescription}>{item.description}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.govButton}>
          <Text style={styles.govButtonText}>Request Partnership Info</Text>
          <Ionicons name="arrow-forward" size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Testimonials */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTag}>TESTIMONIALS</Text>
          <Text style={styles.sectionTitle}>What Our Users Say</Text>
        </View>
        <View style={styles.testimonialsGrid}>
          <View style={styles.testimonialCard}>
            <View style={styles.testimonialStars}>
              {[1,2,3,4,5].map(i => (
                <Ionicons key={i} name="star" size={16} color="#F59E0B" />
              ))}
            </View>
            <Text style={styles.testimonialText}>
              "I won TSh 500,000 just by scanning my grocery receipts! Now I always ask for receipts everywhere I shop."
            </Text>
            <View style={styles.testimonialAuthor}>
              <View style={styles.testimonialAvatar}>
                <Text style={styles.testimonialAvatarText}>JM</Text>
              </View>
              <View>
                <Text style={styles.testimonialName}>John M.</Text>
                <Text style={styles.testimonialLocation}>Dar es Salaam</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.testimonialCard}>
            <View style={styles.testimonialStars}>
              {[1,2,3,4,5].map(i => (
                <Ionicons key={i} name="star" size={16} color="#F59E0B" />
              ))}
            </View>
            <Text style={styles.testimonialText}>
              "The app is so easy to use. Scan, earn entries, and wait for the draw. I've already won twice!"
            </Text>
            <View style={styles.testimonialAuthor}>
              <View style={styles.testimonialAvatar}>
                <Text style={styles.testimonialAvatarText}>AN</Text>
              </View>
              <View>
                <Text style={styles.testimonialName}>Amina N.</Text>
                <Text style={styles.testimonialLocation}>Arusha</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.testimonialCard}>
            <View style={styles.testimonialStars}>
              {[1,2,3,4,5].map(i => (
                <Ionicons key={i} name="star" size={16} color="#F59E0B" />
              ))}
            </View>
            <Text style={styles.testimonialText}>
              "As a business owner, I've seen more customers asking for receipts. It's a win-win for everyone!"
            </Text>
            <View style={styles.testimonialAuthor}>
              <View style={styles.testimonialAvatar}>
                <Text style={styles.testimonialAvatarText}>PK</Text>
              </View>
              <View>
                <Text style={styles.testimonialName}>Peter K.</Text>
                <Text style={styles.testimonialLocation}>Mwanza</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <LinearGradient
        colors={['#2563EB', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ctaSection}
      >
        <Text style={styles.ctaTitle}>Ready to Start Winning?</Text>
        <Text style={styles.ctaSubtitle}>
          Download TaxDraw today and turn your receipts into rewards.
        </Text>
        <View style={styles.ctaButtons}>
          <TouchableOpacity 
            style={styles.ctaButtonPrimary}
            onPress={() => router.push('/(auth)/register')}
          >
            <Ionicons name="logo-apple" size={24} color="#000" />
            <View>
              <Text style={styles.ctaButtonSmallText}>Download on the</Text>
              <Text style={styles.ctaButtonLargeText}>App Store</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.ctaButtonPrimary}
            onPress={() => router.push('/(auth)/register')}
          >
            <Ionicons name="logo-google-playstore" size={24} color="#000" />
            <View>
              <Text style={styles.ctaButtonSmallText}>Get it on</Text>
              <Text style={styles.ctaButtonLargeText}>Google Play</Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerBrand}>
            <View style={styles.logo}>
              <Ionicons name="receipt" size={28} color="#3B82F6" />
              <Text style={styles.logoText}>TaxDraw</Text>
            </View>
            <Text style={styles.footerTagline}>
              Transforming tax compliance through incentives.
            </Text>
            <View style={styles.socialLinks}>
              <TouchableOpacity style={styles.socialLink}>
                <Ionicons name="logo-facebook" size={20} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialLink}>
                <Ionicons name="logo-twitter" size={20} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialLink}>
                <Ionicons name="logo-instagram" size={20} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialLink}>
                <Ionicons name="logo-linkedin" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.footerLinks}>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Product</Text>
              <TouchableOpacity><Text style={styles.footerLink}>Features</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>How It Works</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Pricing</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>FAQ</Text></TouchableOpacity>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Company</Text>
              <TouchableOpacity><Text style={styles.footerLink}>About Us</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Careers</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Press</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Contact</Text></TouchableOpacity>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Legal</Text>
              <TouchableOpacity><Text style={styles.footerLink}>Privacy Policy</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Terms of Service</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Cookie Policy</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Compliance</Text></TouchableOpacity>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Support</Text>
              <TouchableOpacity><Text style={styles.footerLink}>Help Center</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Community</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Status</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Report Issue</Text></TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={styles.footerBottom}>
          <Text style={styles.footerCopyright}>
            © 2026 TaxDraw. All rights reserved.
          </Text>
          <Text style={styles.footerMadeWith}>
            Made with ❤️ for tax compliance
          </Text>
        </View>
      </View>
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
    gap: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
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
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  navButtonPrimary: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
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
  },
  heroContent: {
    flex: 1,
    maxWidth: isWeb ? 600 : '100%',
    alignSelf: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  heroBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  heroTitle: {
    fontSize: isWeb ? 56 : 40,
    fontWeight: '800',
    color: '#fff',
    lineHeight: isWeb ? 68 : 48,
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
    marginBottom: 48,
    flexWrap: 'wrap',
  },
  heroButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
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
    gap: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  heroButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#60A5FA',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
    flexWrap: 'wrap',
  },
  statItem: {
    minWidth: 100,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  heroImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    display: isWeb ? 'flex' : 'none',
  },
  phoneMockup: {
    width: 280,
    height: 560,
    backgroundColor: '#1E293B',
    borderRadius: 40,
    padding: 12,
    borderWidth: 4,
    borderColor: '#334155',
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 32,
    overflow: 'hidden',
  },
  phoneHeader: {
    backgroundColor: '#1E293B',
    padding: 16,
    alignItems: 'center',
  },
  phoneHeaderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  phoneContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  phoneTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
  },
  phoneSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
  },
  phoneButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  phoneButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  // Sections
  section: {
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  sectionDark: {
    backgroundColor: '#0F172A',
  },
  sectionGradient: {
    backgroundColor: '#4F46E5',
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 48,
    maxWidth: 600,
    alignSelf: 'center',
  },
  sectionTag: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 1,
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
  // Features
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    maxWidth: 1000,
    alignSelf: 'center',
  },
  featureCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 32,
    width: isWeb ? 280 : '100%',
    alignItems: 'center',
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Steps
  stepsContainer: {
    maxWidth: 800,
    alignSelf: 'center',
  },
  stepItem: {
    flexDirection: isWeb ? 'row' : 'column',
    alignItems: isWeb ? 'flex-start' : 'center',
    marginBottom: 40,
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: isWeb ? 24 : 0,
    marginBottom: isWeb ? 0 : 16,
  },
  stepNumberText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
    alignItems: isWeb ? 'flex-start' : 'center',
  },
  stepIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: isWeb ? 'left' : 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#94A3B8',
    lineHeight: 24,
    textAlign: isWeb ? 'left' : 'center',
    maxWidth: 400,
  },
  stepConnector: {
    width: isWeb ? 2 : 48,
    height: isWeb ? 40 : 2,
    backgroundColor: '#334155',
    marginLeft: isWeb ? 23 : 0,
    marginVertical: isWeb ? 0 : 16,
  },
  // Benefits
  benefitsGrid: {
    maxWidth: 800,
    alignSelf: 'center',
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    marginBottom: 16,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  benefitDescription: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
  },
  // Government
  govGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    maxWidth: 1000,
    alignSelf: 'center',
    marginBottom: 40,
  },
  govCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 32,
    width: isWeb ? 280 : '100%',
    alignItems: 'center',
  },
  govIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  govTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  govDescription: {
    fontSize: 15,
    color: '#C7D2FE',
    textAlign: 'center',
    lineHeight: 24,
  },
  govButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignSelf: 'center',
  },
  govButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  // Testimonials
  testimonialsGrid: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 24,
    maxWidth: 1000,
    alignSelf: 'center',
  },
  testimonialCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 32,
  },
  testimonialStars: {
    flexDirection: 'row',
    gap: 4,
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
  testimonialLocation: {
    fontSize: 14,
    color: '#64748B',
  },
  // CTA
  ctaSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: isWeb ? 40 : 32,
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
    maxWidth: 500,
  },
  ctaButtons: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 16,
  },
  ctaButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
  },
  ctaButtonSmallText: {
    fontSize: 12,
    color: '#64748B',
  },
  ctaButtonLargeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  // Footer
  footer: {
    backgroundColor: '#0F172A',
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
    marginBottom: 24,
    maxWidth: 300,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 16,
  },
  socialLink: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footerLink: {
    fontSize: 15,
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
  footerMadeWith: {
    fontSize: 14,
    color: '#64748B',
  },
});
