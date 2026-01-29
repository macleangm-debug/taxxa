import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function CaseStudiesPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [selectedStudy, setSelectedStudy] = useState<number | null>(null);

  const caseStudies = [
    {
      id: 1,
      country: 'Kenya',
      flag: '🇰🇪',
      authority: 'Kenya Revenue Authority (KRA)',
      title: 'EjijiPay Receipt Lottery',
      subtitle: 'Transforming Retail Tax Compliance',
      duration: '18 months',
      users: '1.2M+',
      revenueIncrease: '23%',
      receiptsScanned: '15M+',
      background: 'Kenya faced significant VAT compliance challenges in the retail sector, with estimates suggesting up to 40% of retail transactions went unreported.',
      solution: 'KRA launched the EjijiPay Receipt Lottery powered by Taxxa, offering weekly cash prizes and monthly grand prizes including vehicles and houses.',
      results: [
        { metric: 'Tax Revenue', value: '+23%', detail: 'Year-over-year increase in VAT collections from retail sector' },
        { metric: 'Active Users', value: '1.2M', detail: 'Citizens actively participating in the program' },
        { metric: 'Receipts Scanned', value: '15M+', detail: 'Total receipts validated through the platform' },
        { metric: 'Merchant Compliance', value: '67%→92%', detail: 'Increase in merchant receipt issuance rate' },
      ],
      quote: 'The Taxxa platform has fundamentally changed how Kenyans interact with the tax system. Citizens now actively demand receipts, creating a grassroots compliance movement.',
      quoteAuthor: 'Commissioner General, KRA',
      color: '#059669',
    },
    {
      id: 2,
      country: 'Tanzania',
      flag: '🇹🇿',
      authority: 'Tanzania Revenue Authority (TRA)',
      title: 'Bahati Yangu Program',
      subtitle: 'Citizen-Powered Tax Enforcement',
      duration: '12 months',
      users: '850K+',
      revenueIncrease: '18%',
      receiptsScanned: '9M+',
      background: 'Tanzania\'s informal economy and cash-based transactions made tax collection challenging, particularly in urban retail centers.',
      solution: 'TRA implemented the "Bahati Yangu" (My Luck) program, targeting major cities with high retail activity and significant prize pools.',
      results: [
        { metric: 'Tax Revenue', value: '+18%', detail: 'Increase in urban retail VAT collections' },
        { metric: 'Active Users', value: '850K', detail: 'Registered participants in first year' },
        { metric: 'Daily Scans', value: '45K', detail: 'Average daily receipt scans' },
        { metric: 'Fraud Detection', value: '2,400', detail: 'Cases of merchant non-compliance identified' },
      ],
      quote: 'What impressed us most was the quality of data we now have. We can see transaction patterns in real-time and identify non-compliant merchants immediately.',
      quoteAuthor: 'Director of Domestic Revenue, TRA',
      color: '#2563EB',
    },
    {
      id: 3,
      country: 'Rwanda',
      flag: '🇷🇼',
      authority: 'Rwanda Revenue Authority (RRA)',
      title: 'Sobanukirwa Initiative',
      subtitle: 'Digital-First Tax Compliance',
      duration: '24 months',
      users: '620K+',
      revenueIncrease: '31%',
      receiptsScanned: '12M+',
      background: 'Rwanda\'s digitization goals aligned perfectly with Taxxa\'s platform, enabling deep integration with the national EBM system.',
      solution: 'RRA integrated Taxxa with their existing Electronic Billing Machine (EBM) infrastructure, creating seamless receipt validation.',
      results: [
        { metric: 'Tax Revenue', value: '+31%', detail: 'Highest revenue increase among deployments' },
        { metric: 'EBM Compliance', value: '95%', detail: 'Merchant EBM usage rate (up from 71%)' },
        { metric: 'Processing Time', value: '<1s', detail: 'Average receipt validation time' },
        { metric: 'Cost Savings', value: '$2.4M', detail: 'Annual enforcement cost reduction' },
      ],
      quote: 'Integration with our existing EBM system was seamless. Taxxa enhanced our infrastructure rather than replacing it.',
      quoteAuthor: 'Deputy Commissioner, RRA',
      color: '#7C3AED',
    },
    {
      id: 4,
      country: 'Uganda',
      flag: '🇺🇬',
      authority: 'Uganda Revenue Authority (URA)',
      title: 'EFRIS Rewards',
      subtitle: 'Scaling Compliance Nationwide',
      duration: '10 months',
      users: '480K+',
      revenueIncrease: '15%',
      receiptsScanned: '6M+',
      background: 'URA sought to increase adoption of their Electronic Fiscal Receipting and Invoicing Solution (EFRIS) among both merchants and consumers.',
      solution: 'The EFRIS Rewards program incentivized consumers to request EFRIS-compliant receipts, driving merchant adoption indirectly.',
      results: [
        { metric: 'Tax Revenue', value: '+15%', detail: 'VAT collection increase in pilot regions' },
        { metric: 'EFRIS Adoption', value: '+45%', detail: 'Increase in merchant EFRIS registration' },
        { metric: 'Receipt Requests', value: '3x', detail: 'Increase in consumer receipt requests' },
        { metric: 'Program ROI', value: '12:1', detail: 'Return on investment for prize pool' },
      ],
      quote: 'The behavioral change has been remarkable. Consumers now understand their role in the tax ecosystem.',
      quoteAuthor: 'Commissioner General, URA',
      color: '#DC2626',
    },
  ];

  const aggregateStats = [
    { label: 'Total Users', value: '3.1M+', icon: 'people' },
    { label: 'Receipts Processed', value: '42M+', icon: 'document-text' },
    { label: 'Avg Revenue Increase', value: '22%', icon: 'trending-up' },
    { label: 'Countries Deployed', value: '8', icon: 'globe' },
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

      {/* Hero */}
      <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.hero}>
        <View style={[styles.heroContent, isMobile && styles.heroContentMobile]}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>CASE STUDIES</Text>
          </View>
          <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
            Proven Results{"\n"}
            <Text style={styles.heroTitleAccent}>Across Africa</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            See how tax authorities across the continent are using Taxxa to transform compliance and increase revenue.
          </Text>
        </View>
      </LinearGradient>

      {/* Aggregate Stats */}
      <View style={styles.statsSection}>
        <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
          {aggregateStats.map((stat, index) => (
            <View key={index} style={[styles.statCard, isMobile && styles.statCardMobile]}>
              <Ionicons name={stat.icon as any} size={28} color="#4F46E5" />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Case Studies List */}
      <View style={styles.studiesSection}>
        <Text style={styles.sectionTitle}>Success Stories</Text>
        
        {caseStudies.map((study, index) => (
          <TouchableOpacity
            key={study.id}
            style={[styles.studyCard, isMobile && styles.studyCardMobile]}
            onPress={() => setSelectedStudy(selectedStudy === study.id ? null : study.id)}
            activeOpacity={0.9}
          >
            {/* Card Header */}
            <View style={styles.studyHeader}>
              <View style={styles.studyHeaderLeft}>
                <Text style={styles.studyFlag}>{study.flag}</Text>
                <View>
                  <Text style={styles.studyCountry}>{study.country}</Text>
                  <Text style={styles.studyAuthority}>{study.authority}</Text>
                </View>
              </View>
              <View style={[styles.studyBadge, { backgroundColor: study.color + '20' }]}>
                <Text style={[styles.studyBadgeText, { color: study.color }]}>+{study.revenueIncrease} Revenue</Text>
              </View>
            </View>

            {/* Card Title */}
            <Text style={styles.studyTitle}>{study.title}</Text>
            <Text style={styles.studySubtitle}>{study.subtitle}</Text>

            {/* Quick Stats */}
            <View style={[styles.quickStats, isMobile && styles.quickStatsMobile]}>
              <View style={styles.quickStat}>
                <Ionicons name="people" size={18} color="#64748B" />
                <Text style={styles.quickStatValue}>{study.users}</Text>
                <Text style={styles.quickStatLabel}>Users</Text>
              </View>
              <View style={styles.quickStat}>
                <Ionicons name="document-text" size={18} color="#64748B" />
                <Text style={styles.quickStatValue}>{study.receiptsScanned}</Text>
                <Text style={styles.quickStatLabel}>Receipts</Text>
              </View>
              <View style={styles.quickStat}>
                <Ionicons name="time" size={18} color="#64748B" />
                <Text style={styles.quickStatValue}>{study.duration}</Text>
                <Text style={styles.quickStatLabel}>Duration</Text>
              </View>
            </View>

            {/* Expanded Content */}
            {selectedStudy === study.id && (
              <View style={styles.expandedContent}>
                <View style={styles.divider} />
                
                {/* Background */}
                <Text style={styles.expandedSectionTitle}>Background</Text>
                <Text style={styles.expandedText}>{study.background}</Text>

                {/* Solution */}
                <Text style={styles.expandedSectionTitle}>Solution</Text>
                <Text style={styles.expandedText}>{study.solution}</Text>

                {/* Results Grid */}
                <Text style={styles.expandedSectionTitle}>Results</Text>
                <View style={[styles.resultsGrid, isMobile && styles.resultsGridMobile]}>
                  {study.results.map((result, rIndex) => (
                    <View key={rIndex} style={[styles.resultCard, isMobile && styles.resultCardMobile]}>
                      <Text style={[styles.resultValue, { color: study.color }]}>{result.value}</Text>
                      <Text style={styles.resultMetric}>{result.metric}</Text>
                      <Text style={styles.resultDetail}>{result.detail}</Text>
                    </View>
                  ))}
                </View>

                {/* Quote */}
                <View style={[styles.quoteContainer, { borderLeftColor: study.color }]}>
                  <Ionicons name="chatbox-ellipses" size={24} color={study.color} />
                  <Text style={styles.quoteText}>"{study.quote}"</Text>
                  <Text style={styles.quoteAuthor}>— {study.quoteAuthor}</Text>
                </View>
              </View>
            )}

            {/* Expand Indicator */}
            <View style={styles.expandIndicator}>
              <Ionicons
                name={selectedStudy === study.id ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#64748B"
              />
              <Text style={styles.expandText}>
                {selectedStudy === study.id ? 'Show Less' : 'Read Full Case Study'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Want Similar Results?</Text>
        <Text style={styles.ctaSubtitle}>Let's discuss how Taxxa can work for your jurisdiction</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/landing')}>
          <Ionicons name="calendar" size={20} color="#fff" />
          <Text style={styles.ctaButtonText}>Schedule Consultation</Text>
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
  statsSection: {
    padding: 24,
    marginTop: -30,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    maxWidth: 900,
    alignSelf: 'center',
  },
  statsGridMobile: {
    flexDirection: 'column',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '22%',
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardMobile: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  studiesSection: {
    padding: 24,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 24,
  },
  studyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  studyCardMobile: {
    padding: 16,
  },
  studyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  studyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studyFlag: {
    fontSize: 36,
  },
  studyCountry: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  studyAuthority: {
    fontSize: 13,
    color: '#64748B',
  },
  studyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  studyBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  studyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  studySubtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 16,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  quickStatsMobile: {
    gap: 12,
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  expandedContent: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  expandedSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    marginTop: 16,
  },
  expandedText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  resultsGridMobile: {
    flexDirection: 'column',
  },
  resultCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    width: '48%',
  },
  resultCardMobile: {
    width: '100%',
  },
  resultValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  resultMetric: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 4,
  },
  resultDetail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  quoteContainer: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
  },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#475569',
    lineHeight: 24,
    marginTop: 12,
  },
  quoteAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 12,
  },
  expandIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  expandText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
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
    textAlign: 'center',
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
