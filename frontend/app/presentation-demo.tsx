import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const isWeb = Platform.OS === 'web';

// African Countries Configuration
const AFRICAN_COUNTRIES = {
  tanzania: {
    name: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    currencySymbol: 'TZS',
    locale: 'sw-TZ',
    taxAuthority: 'Tanzania Revenue Authority (TRA)',
    vatRate: '18%',
    merchants: [
      { name: 'Shoppers Plaza Dar es Salaam', amount: 125000 },
      { name: 'Game Stores Arusha', amount: 287500 },
      { name: 'Mlimani City Mall', amount: 45000 },
    ],
    prizes: {
      weekly: 50000000,
      monthly: 500000000,
      quarterly: 2000000000,
    },
    stats: {
      compliance: 67,
      targetCompliance: 85,
      registeredMerchants: 45000,
      dailyScans: 125000,
      revenueIncrease: 22,
    },
  },
  kenya: {
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    currencySymbol: 'KES',
    locale: 'sw-KE',
    taxAuthority: 'Kenya Revenue Authority (KRA)',
    vatRate: '16%',
    merchants: [
      { name: 'Carrefour Nairobi', amount: 8500 },
      { name: 'Naivas Supermarket Mombasa', amount: 12750 },
      { name: 'Quickmart Kisumu', amount: 3200 },
    ],
    prizes: {
      weekly: 5000000,
      monthly: 50000000,
      quarterly: 200000000,
    },
    stats: {
      compliance: 72,
      targetCompliance: 90,
      registeredMerchants: 78000,
      dailyScans: 250000,
      revenueIncrease: 18,
    },
  },
};

type CountryKey = keyof typeof AFRICAN_COUNTRIES;

// Format currency
const formatCurrency = (amount: number, currency: string) => {
  return `${currency} ${amount.toLocaleString()}`;
};

// Animated Counter
const AnimatedCounter = ({ end, duration = 2000, suffix = '', prefix = '' }: { end: number; duration?: number; suffix?: string; prefix?: string }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
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
  }, [end, duration]);

  return <Text style={styles.counterValue}>{prefix}{count.toLocaleString()}{suffix}</Text>;
};

export default function PresentationDemo() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  
  const [selectedCountry, setSelectedCountry] = useState<CountryKey>('tanzania');
  const [demoMode, setDemoMode] = useState<'select' | 'citizen' | 'admin' | 'sidebyside'>('select');
  const [scanPhase, setScanPhase] = useState<'idle' | 'scanning' | 'verifying' | 'result'>('idle');
  const [selectedMerchant, setSelectedMerchant] = useState<number | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPrizeConfig, setShowPrizeConfig] = useState(false);
  const [customPrizes, setCustomPrizes] = useState({ ...AFRICAN_COUNTRIES.tanzania.prizes });
  
  const country = AFRICAN_COUNTRIES[selectedCountry];

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (isWeb && document.documentElement) {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Simulate scan
  const startScan = async (merchantIndex: number) => {
    setSelectedMerchant(merchantIndex);
    setScanPhase('scanning');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    setScanPhase('verifying');
    
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const merchant = country.merchants[merchantIndex];
    const entries = Math.floor(merchant.amount / 10000) + 1;
    
    setScanResult({
      receipt_id: `${selectedCountry.toUpperCase().slice(0, 2)}-${Date.now().toString(36).toUpperCase()}`,
      merchant: merchant.name,
      amount: merchant.amount,
      entries,
      vatAmount: Math.floor(merchant.amount * 0.18),
      timestamp: new Date().toISOString(),
      verificationCode: `VRF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    });
    setScanPhase('result');
  };

  const resetScan = () => {
    setScanPhase('idle');
    setSelectedMerchant(null);
    setScanResult(null);
  };

  // Live stats simulation
  const [liveStats, setLiveStats] = useState({
    scansToday: 0,
    revenueToday: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        scansToday: prev.scansToday + Math.floor(Math.random() * 50) + 10,
        revenueToday: prev.revenueToday + Math.floor(Math.random() * 5000000) + 100000,
        activeUsers: Math.floor(Math.random() * 5000) + 15000,
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update prizes when country changes
  useEffect(() => {
    setCustomPrizes({ ...AFRICAN_COUNTRIES[selectedCountry].prizes });
  }, [selectedCountry]);

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreen]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.push('/landing')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <LinearGradient colors={['#3B82F6', '#8B5CF6']} style={styles.logoIcon}>
            <Ionicons name="receipt" size={20} color="#fff" />
          </LinearGradient>
          <Text style={styles.headerTitle}>Taxxa Presentation Mode</Text>
        </View>
        
        <View style={styles.headerRight}>
          {/* Country Selector */}
          <View style={styles.countrySelector}>
            {Object.entries(AFRICAN_COUNTRIES).map(([key, c]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.countryOption,
                  selectedCountry === key && styles.countryOptionActive,
                ]}
                onPress={() => setSelectedCountry(key as CountryKey)}
              >
                <Text style={styles.countryFlag}>{c.flag}</Text>
                <Text style={[
                  styles.countryName,
                  selectedCountry === key && styles.countryNameActive,
                ]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity style={styles.prizeConfigBtn} onPress={() => setShowPrizeConfig(true)}>
            <Ionicons name="settings" size={20} color="#A78BFA" />
            <Text style={styles.prizeConfigText}>Prizes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.fullscreenBtn} onPress={toggleFullscreen}>
            <Ionicons name={isFullscreen ? "contract" : "expand"} size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode Selector */}
      {demoMode === 'select' && (
        <View style={styles.modeSelector}>
          <Text style={styles.modeSelectorTitle}>Select Demo View for {country.flag} {country.name}</Text>
          <Text style={styles.modeSelectorSubtitle}>
            Presenting to: {country.taxAuthority}
          </Text>
          
          <View style={styles.modeCards}>
            <TouchableOpacity style={styles.modeCard} onPress={() => setDemoMode('citizen')}>
              <View style={[styles.modeIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Ionicons name="phone-portrait" size={48} color="#10B981" />
              </View>
              <Text style={styles.modeCardTitle}>Citizen App Demo</Text>
              <Text style={styles.modeCardDesc}>
                Show how citizens scan receipts and earn lottery entries
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modeCard} onPress={() => setDemoMode('admin')}>
              <View style={[styles.modeIconWrapper, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <Ionicons name="bar-chart" size={48} color="#3B82F6" />
              </View>
              <Text style={styles.modeCardTitle}>Admin Dashboard</Text>
              <Text style={styles.modeCardDesc}>
                Show real-time analytics, compliance rates, and revenue data
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modeCard} onPress={() => setDemoMode('sidebyside')}>
              <View style={[styles.modeIconWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <Ionicons name="git-compare" size={48} color="#8B5CF6" />
              </View>
              <Text style={styles.modeCardTitle}>Side-by-Side View</Text>
              <Text style={styles.modeCardDesc}>
                Show citizen scanning while admin sees it in real-time
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Citizen App Demo */}
      {demoMode === 'citizen' && (
        <View style={styles.demoArea}>
          <View style={styles.demoHeader}>
            <TouchableOpacity onPress={() => { setDemoMode('select'); resetScan(); }} style={styles.demoBackBtn}>
              <Ionicons name="arrow-back" size={20} color="#94A3B8" />
              <Text style={styles.demoBackText}>Back to Menu</Text>
            </TouchableOpacity>
            <Text style={styles.demoTitle}>{country.flag} Citizen Mobile App</Text>
          </View>
          
          <View style={styles.phoneContainer}>
            <View style={styles.phoneFrame}>
              <View style={styles.phoneNotch} />
              <View style={styles.phoneScreen}>
                {scanPhase === 'idle' && (
                  <ScrollView style={styles.phoneContent}>
                    <View style={styles.appHeader}>
                      <Text style={styles.appLogo}>TaxDraw</Text>
                      <Text style={styles.appTagline}>{country.name}</Text>
                    </View>
                    
                    <View style={styles.prizeCard}>
                      <Text style={styles.prizeCardLabel}>This Week's Prize Pool</Text>
                      <Text style={styles.prizeCardValue}>
                        {formatCurrency(customPrizes.weekly, country.currency)}
                      </Text>
                      <Text style={styles.prizeCardSub}>Draw in 3 days</Text>
                    </View>
                    
                    <Text style={styles.merchantsTitle}>Scan a Receipt</Text>
                    <Text style={styles.merchantsSubtitle}>Select a sample merchant receipt:</Text>
                    
                    {country.merchants.map((merchant, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.merchantCard}
                        onPress={() => startScan(index)}
                      >
                        <View style={styles.merchantInfo}>
                          <Ionicons name="storefront" size={24} color="#3B82F6" />
                          <View style={styles.merchantDetails}>
                            <Text style={styles.merchantName}>{merchant.name}</Text>
                            <Text style={styles.merchantAmount}>
                              {formatCurrency(merchant.amount, country.currency)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.scanBtn}>
                          <Ionicons name="scan" size={20} color="#fff" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {scanPhase === 'scanning' && (
                  <View style={styles.scanningView}>
                    <View style={styles.scannerFrame}>
                      <View style={styles.scannerCorner} />
                      <View style={[styles.scannerCorner, styles.scannerCornerTR]} />
                      <View style={[styles.scannerCorner, styles.scannerCornerBL]} />
                      <View style={[styles.scannerCorner, styles.scannerCornerBR]} />
                      <View style={styles.scannerBeam} />
                    </View>
                    <Text style={styles.scanningText}>Scanning QR Code...</Text>
                    <Text style={styles.scanningMerchant}>
                      {country.merchants[selectedMerchant!]?.name}
                    </Text>
                  </View>
                )}

                {scanPhase === 'verifying' && (
                  <View style={styles.verifyingView}>
                    <View style={styles.verifyIcon}>
                      <Ionicons name="shield-checkmark" size={64} color="#8B5CF6" />
                    </View>
                    <Text style={styles.verifyingText}>
                      Verifying with {country.taxAuthority}...
                    </Text>
                    <View style={styles.verifyProgress}>
                      <View style={styles.verifyProgressFill} />
                    </View>
                    <View style={styles.verifySteps}>
                      <View style={styles.verifyStepDone}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={styles.verifyStepText}>QR Code Valid</Text>
                      </View>
                      <View style={styles.verifyStepDone}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={styles.verifyStepText}>EFD Machine Verified</Text>
                      </View>
                      <View style={styles.verifyStepActive}>
                        <Ionicons name="ellipse" size={20} color="#8B5CF6" />
                        <Text style={styles.verifyStepText}>VAT Record Check</Text>
                      </View>
                    </View>
                  </View>
                )}

                {scanPhase === 'result' && scanResult && (
                  <View style={styles.resultView}>
                    <View style={styles.resultSuccess}>
                      <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                      <Text style={styles.resultTitle}>Receipt Verified!</Text>
                    </View>
                    
                    <View style={styles.entriesEarned}>
                      <Text style={styles.entriesNumber}>+{scanResult.entries}</Text>
                      <Text style={styles.entriesLabel}>Lottery Entries</Text>
                    </View>
                    
                    <View style={styles.resultDetails}>
                      <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Merchant</Text>
                        <Text style={styles.resultValue}>{scanResult.merchant}</Text>
                      </View>
                      <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Amount</Text>
                        <Text style={styles.resultValue}>
                          {formatCurrency(scanResult.amount, country.currency)}
                        </Text>
                      </View>
                      <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>VAT Paid</Text>
                        <Text style={styles.resultValue}>
                          {formatCurrency(scanResult.vatAmount, country.currency)}
                        </Text>
                      </View>
                      <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Receipt ID</Text>
                        <Text style={[styles.resultValue, styles.mono]}>{scanResult.receipt_id}</Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity style={styles.scanAgainBtn} onPress={resetScan}>
                      <Ionicons name="scan" size={20} color="#fff" />
                      <Text style={styles.scanAgainText}>Scan Another Receipt</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Admin Dashboard Demo */}
      {demoMode === 'admin' && (
        <ScrollView style={styles.adminDemoArea}>
          <View style={styles.demoHeader}>
            <TouchableOpacity onPress={() => setDemoMode('select')} style={styles.demoBackBtn}>
              <Ionicons name="arrow-back" size={20} color="#94A3B8" />
              <Text style={styles.demoBackText}>Back to Menu</Text>
            </TouchableOpacity>
            <Text style={styles.demoTitle}>{country.flag} {country.taxAuthority} Dashboard</Text>
          </View>
          
          <View style={styles.adminContent}>
            {/* Live Stats Banner */}
            <View style={styles.liveBanner}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE DATA</Text>
            </View>
            
            {/* Key Metrics */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <View style={styles.metricIcon}>
                  <Ionicons name="scan" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.metricLabel}>Scans Today</Text>
                <AnimatedCounter end={country.stats.dailyScans + liveStats.scansToday} suffix="" />
              </View>
              
              <View style={styles.metricCard}>
                <View style={[styles.metricIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <Ionicons name="trending-up" size={24} color="#10B981" />
                </View>
                <Text style={styles.metricLabel}>VAT Revenue Today</Text>
                <Text style={styles.counterValue}>
                  {formatCurrency(liveStats.revenueToday, country.currency)}
                </Text>
              </View>
              
              <View style={styles.metricCard}>
                <View style={[styles.metricIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                  <Ionicons name="people" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.metricLabel}>Active Users</Text>
                <AnimatedCounter end={liveStats.activeUsers} suffix="" />
              </View>
              
              <View style={styles.metricCard}>
                <View style={[styles.metricIcon, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                  <Ionicons name="storefront" size={24} color="#8B5CF6" />
                </View>
                <Text style={styles.metricLabel}>Registered Merchants</Text>
                <AnimatedCounter end={country.stats.registeredMerchants} suffix="" />
              </View>
            </View>
            
            {/* Compliance Gauge */}
            <View style={styles.complianceSection}>
              <Text style={styles.sectionTitle}>VAT Compliance Rate</Text>
              <View style={styles.complianceGauge}>
                <View style={styles.gaugeTrack}>
                  <View style={[styles.gaugeFill, { width: `${country.stats.compliance}%` }]} />
                  <View style={[styles.gaugeTarget, { left: `${country.stats.targetCompliance}%` }]} />
                </View>
                <View style={styles.gaugeLabels}>
                  <Text style={styles.gaugeValue}>{country.stats.compliance}%</Text>
                  <Text style={styles.gaugeTargetLabel}>Target: {country.stats.targetCompliance}%</Text>
                </View>
              </View>
              <View style={styles.complianceStats}>
                <View style={styles.complianceStat}>
                  <Text style={styles.complianceStatValue}>+{country.stats.revenueIncrease}%</Text>
                  <Text style={styles.complianceStatLabel}>Revenue Increase (YoY)</Text>
                </View>
                <View style={styles.complianceStat}>
                  <Text style={styles.complianceStatValue}>{country.vatRate}</Text>
                  <Text style={styles.complianceStatLabel}>VAT Rate</Text>
                </View>
              </View>
            </View>
            
            {/* Prize Pool Overview */}
            <View style={styles.prizeSection}>
              <Text style={styles.sectionTitle}>Active Prize Pools</Text>
              <View style={styles.prizeGrid}>
                <View style={styles.prizeItem}>
                  <Ionicons name="calendar" size={24} color="#10B981" />
                  <Text style={styles.prizeItemLabel}>Weekly</Text>
                  <Text style={styles.prizeItemValue}>
                    {formatCurrency(customPrizes.weekly, country.currency)}
                  </Text>
                </View>
                <View style={styles.prizeItem}>
                  <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
                  <Text style={styles.prizeItemLabel}>Monthly</Text>
                  <Text style={styles.prizeItemValue}>
                    {formatCurrency(customPrizes.monthly, country.currency)}
                  </Text>
                </View>
                <View style={styles.prizeItem}>
                  <Ionicons name="trophy" size={24} color="#F59E0B" />
                  <Text style={styles.prizeItemLabel}>Quarterly</Text>
                  <Text style={styles.prizeItemValue}>
                    {formatCurrency(customPrizes.quarterly, country.currency)}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Recent Activity Feed */}
            <View style={styles.activitySection}>
              <Text style={styles.sectionTitle}>Live Transaction Feed</Text>
              <View style={styles.activityFeed}>
                {[...Array(5)].map((_, i) => (
                  <View key={i} style={styles.activityItem}>
                    <View style={[styles.activityDot, { backgroundColor: i === 0 ? '#10B981' : '#3B82F6' }]} />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityText}>
                        Receipt verified at {country.merchants[i % 3].name}
                      </Text>
                      <Text style={styles.activityAmount}>
                        {formatCurrency(country.merchants[i % 3].amount, country.currency)}
                      </Text>
                    </View>
                    <Text style={styles.activityTime}>{i === 0 ? 'Just now' : `${i * 2}s ago`}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Side-by-Side View */}
      {demoMode === 'sidebyside' && (
        <View style={styles.sideBySide}>
          <View style={styles.demoHeader}>
            <TouchableOpacity onPress={() => { setDemoMode('select'); resetScan(); }} style={styles.demoBackBtn}>
              <Ionicons name="arrow-back" size={20} color="#94A3B8" />
              <Text style={styles.demoBackText}>Back to Menu</Text>
            </TouchableOpacity>
            <Text style={styles.demoTitle}>{country.flag} Real-Time Demo: Citizen ↔ Authority</Text>
          </View>
          
          <View style={styles.sideBySideContent}>
            {/* Citizen Side */}
            <View style={styles.sideBySidePanel}>
              <View style={styles.panelHeader}>
                <Ionicons name="phone-portrait" size={20} color="#10B981" />
                <Text style={styles.panelTitle}>Citizen Mobile App</Text>
              </View>
              <View style={styles.miniPhoneFrame}>
                <View style={styles.miniPhoneScreen}>
                  {scanPhase === 'idle' && (
                    <View style={styles.miniPhoneContent}>
                      <Text style={styles.miniTitle}>TaxDraw {country.name}</Text>
                      <Text style={styles.miniSubtitle}>Select receipt to scan:</Text>
                      {country.merchants.map((m, i) => (
                        <TouchableOpacity
                          key={i}
                          style={styles.miniMerchantBtn}
                          onPress={() => startScan(i)}
                        >
                          <Text style={styles.miniMerchantName}>{m.name}</Text>
                          <Text style={styles.miniMerchantAmount}>
                            {formatCurrency(m.amount, country.currency)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {scanPhase === 'scanning' && (
                    <View style={styles.miniScanView}>
                      <Ionicons name="scan" size={48} color="#8B5CF6" />
                      <Text style={styles.miniScanText}>Scanning...</Text>
                    </View>
                  )}
                  {scanPhase === 'verifying' && (
                    <View style={styles.miniScanView}>
                      <Ionicons name="shield-checkmark" size={48} color="#8B5CF6" />
                      <Text style={styles.miniScanText}>Verifying...</Text>
                    </View>
                  )}
                  {scanPhase === 'result' && scanResult && (
                    <View style={styles.miniResultView}>
                      <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                      <Text style={styles.miniResultTitle}>Verified!</Text>
                      <Text style={styles.miniResultEntries}>+{scanResult.entries} entries</Text>
                      <TouchableOpacity style={styles.miniResetBtn} onPress={resetScan}>
                        <Text style={styles.miniResetText}>Scan Again</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
            
            {/* Authority Side */}
            <View style={styles.sideBySidePanel}>
              <View style={styles.panelHeader}>
                <Ionicons name="bar-chart" size={20} color="#3B82F6" />
                <Text style={styles.panelTitle}>{country.taxAuthority}</Text>
              </View>
              <View style={styles.authorityPanel}>
                <View style={styles.authLiveStats}>
                  <View style={styles.authStatItem}>
                    <Text style={styles.authStatValue}>{(country.stats.dailyScans + liveStats.scansToday).toLocaleString()}</Text>
                    <Text style={styles.authStatLabel}>Scans Today</Text>
                  </View>
                  <View style={styles.authStatItem}>
                    <Text style={styles.authStatValue}>{country.stats.compliance}%</Text>
                    <Text style={styles.authStatLabel}>Compliance</Text>
                  </View>
                </View>
                
                {scanPhase !== 'idle' && (
                  <View style={styles.authTransaction}>
                    <View style={styles.authTransactionHeader}>
                      <View style={[styles.authTransactionDot, { 
                        backgroundColor: scanPhase === 'result' ? '#10B981' : '#F59E0B' 
                      }]} />
                      <Text style={styles.authTransactionTitle}>
                        {scanPhase === 'result' ? 'Transaction Verified' : 'Processing Transaction...'}
                      </Text>
                    </View>
                    {selectedMerchant !== null && (
                      <View style={styles.authTransactionDetails}>
                        <Text style={styles.authTransactionMerchant}>
                          {country.merchants[selectedMerchant].name}
                        </Text>
                        <Text style={styles.authTransactionAmount}>
                          {formatCurrency(country.merchants[selectedMerchant].amount, country.currency)}
                        </Text>
                        {scanResult && (
                          <>
                            <Text style={styles.authTransactionVat}>
                              VAT: {formatCurrency(scanResult.vatAmount, country.currency)}
                            </Text>
                            <Text style={styles.authTransactionId}>
                              ID: {scanResult.receipt_id}
                            </Text>
                          </>
                        )}
                      </View>
                    )}
                  </View>
                )}
                
                <View style={styles.authFeed}>
                  <Text style={styles.authFeedTitle}>Live Feed</Text>
                  {[...Array(3)].map((_, i) => (
                    <View key={i} style={styles.authFeedItem}>
                      <Text style={styles.authFeedText}>
                        {country.merchants[i].name}
                      </Text>
                      <Text style={styles.authFeedAmount}>
                        {formatCurrency(country.merchants[i].amount, country.currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Prize Configuration Modal */}
      <Modal visible={showPrizeConfig} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.prizeModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configure Prize Pools ({country.currency})</Text>
              <TouchableOpacity onPress={() => setShowPrizeConfig(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Weekly Prize</Text>
              <View style={styles.currencyInput}>
                <Text style={styles.currencyPrefix}>{country.currency}</Text>
                <Text style={styles.currencyValue}>
                  {customPrizes.weekly.toLocaleString()}
                </Text>
              </View>
              <View style={styles.prizeSlider}>
                {[10000000, 25000000, 50000000, 100000000].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.prizePreset, customPrizes.weekly === val && styles.prizePresetActive]}
                    onPress={() => setCustomPrizes({ ...customPrizes, weekly: val })}
                  >
                    <Text style={styles.prizePresetText}>{(val / 1000000)}M</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.inputLabel}>Monthly Prize</Text>
              <View style={styles.currencyInput}>
                <Text style={styles.currencyPrefix}>{country.currency}</Text>
                <Text style={styles.currencyValue}>
                  {customPrizes.monthly.toLocaleString()}
                </Text>
              </View>
              <View style={styles.prizeSlider}>
                {[100000000, 250000000, 500000000, 1000000000].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.prizePreset, customPrizes.monthly === val && styles.prizePresetActive]}
                    onPress={() => setCustomPrizes({ ...customPrizes, monthly: val })}
                  >
                    <Text style={styles.prizePresetText}>{(val / 1000000)}M</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.inputLabel}>Quarterly Grand Prize</Text>
              <View style={styles.currencyInput}>
                <Text style={styles.currencyPrefix}>{country.currency}</Text>
                <Text style={styles.currencyValue}>
                  {customPrizes.quarterly.toLocaleString()}
                </Text>
              </View>
              <View style={styles.prizeSlider}>
                {[500000000, 1000000000, 2000000000, 5000000000].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.prizePreset, customPrizes.quarterly === val && styles.prizePresetActive]}
                    onPress={() => setCustomPrizes({ ...customPrizes, quarterly: val })}
                  >
                    <Text style={styles.prizePresetText}>{(val / 1000000000)}B</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.modalApplyBtn} onPress={() => setShowPrizeConfig(false)}>
              <Text style={styles.modalApplyText}>Apply Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(10, 10, 26, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  countrySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  countryOptionActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  countryFlag: {
    fontSize: 20,
  },
  countryName: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  countryNameActive: {
    color: '#fff',
  },
  prizeConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  prizeConfigText: {
    fontSize: 14,
    color: '#A78BFA',
    fontWeight: '500',
  },
  fullscreenBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  
  // Mode Selector
  modeSelector: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  modeSelectorTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  modeSelectorSubtitle: {
    fontSize: 18,
    color: '#94A3B8',
    marginBottom: 48,
  },
  modeCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
  },
  modeCard: {
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderRadius: 20,
    padding: 32,
    width: 280,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  modeIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modeCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  modeCardDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Demo Area
  demoArea: {
    flex: 1,
    padding: 24,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  demoBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demoBackText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  demoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Phone Frame
  phoneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneFrame: {
    width: 320,
    height: 640,
    backgroundColor: '#1a1a2e',
    borderRadius: 44,
    padding: 12,
    borderWidth: 4,
    borderColor: '#2a2a4a',
  },
  phoneNotch: {
    width: 120,
    height: 32,
    backgroundColor: '#0a0a1a',
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 8,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#0f0f1f',
    borderRadius: 32,
    overflow: 'hidden',
  },
  phoneContent: {
    flex: 1,
    padding: 20,
  },
  
  // App UI
  appHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appLogo: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  appTagline: {
    fontSize: 14,
    color: '#94A3B8',
  },
  prizeCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  prizeCardLabel: {
    fontSize: 12,
    color: '#A78BFA',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  prizeCardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  prizeCardSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  merchantsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  merchantsSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  merchantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  merchantDetails: {
    flex: 1,
  },
  merchantName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  merchantAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  scanBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Scanning View
  scanningView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  scannerFrame: {
    width: 200,
    height: 200,
    position: 'relative',
    marginBottom: 24,
  },
  scannerCorner: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderColor: '#10B981',
    borderTopWidth: 4,
    borderLeftWidth: 4,
    top: 0,
    left: 0,
  },
  scannerCornerTR: {
    left: 'auto' as any,
    right: 0,
    borderLeftWidth: 0,
    borderRightWidth: 4,
  },
  scannerCornerBL: {
    top: 'auto' as any,
    bottom: 0,
    borderTopWidth: 0,
    borderBottomWidth: 4,
  },
  scannerCornerBR: {
    top: 'auto' as any,
    left: 'auto' as any,
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scannerBeam: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: '40%',
    height: 3,
    backgroundColor: '#10B981',
  },
  scanningText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  scanningMerchant: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  
  // Verifying View
  verifyingView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  verifyIcon: {
    marginBottom: 20,
  },
  verifyingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  verifyProgress: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 3,
    marginBottom: 24,
    overflow: 'hidden',
  },
  verifyProgressFill: {
    width: '66%',
    height: '100%',
    backgroundColor: '#8B5CF6',
  },
  verifySteps: {
    width: '100%',
    gap: 8,
  },
  verifyStepDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
  },
  verifyStepActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
  },
  verifyStepText: {
    fontSize: 13,
    color: '#E2E8F0',
  },
  
  // Result View
  resultView: {
    flex: 1,
    padding: 20,
  },
  resultSuccess: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 12,
  },
  entriesEarned: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  entriesNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#10B981',
  },
  entriesLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  resultDetails: {
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.1)',
  },
  resultLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  resultValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E2E8F0',
  },
  mono: {
    fontFamily: isWeb ? 'monospace' : undefined,
  },
  scanAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 12,
  },
  scanAgainText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Admin Demo
  adminDemoArea: {
    flex: 1,
  },
  adminContent: {
    padding: 24,
  },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  metricCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderRadius: 16,
    padding: 20,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  counterValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  
  // Compliance Section
  complianceSection: {
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
  },
  complianceGauge: {
    marginBottom: 20,
  },
  gaugeTrack: {
    height: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
  },
  gaugeTarget: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#F59E0B',
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  gaugeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  gaugeTargetLabel: {
    fontSize: 14,
    color: '#F59E0B',
  },
  complianceStats: {
    flexDirection: 'row',
    gap: 24,
  },
  complianceStat: {
    flex: 1,
  },
  complianceStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10B981',
  },
  complianceStatLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  
  // Prize Section
  prizeSection: {
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  prizeGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  prizeItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(10, 10, 26, 0.5)',
    borderRadius: 12,
  },
  prizeItemLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    marginBottom: 4,
  },
  prizeItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  
  // Activity Section
  activitySection: {
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderRadius: 16,
    padding: 24,
  },
  activityFeed: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: 'rgba(10, 10, 26, 0.5)',
    borderRadius: 10,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#E2E8F0',
  },
  activityAmount: {
    fontSize: 13,
    color: '#10B981',
  },
  activityTime: {
    fontSize: 12,
    color: '#64748B',
  },
  
  // Side by Side
  sideBySide: {
    flex: 1,
  },
  sideBySideContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 24,
    gap: 24,
  },
  sideBySidePanel: {
    flex: 1,
    backgroundColor: 'rgba(30, 30, 60, 0.3)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: 'rgba(10, 10, 26, 0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Mini Phone
  miniPhoneFrame: {
    margin: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 8,
    borderWidth: 2,
    borderColor: '#2a2a4a',
  },
  miniPhoneScreen: {
    backgroundColor: '#0f0f1f',
    borderRadius: 18,
    minHeight: 300,
  },
  miniPhoneContent: {
    padding: 16,
  },
  miniTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  miniSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  miniMerchantBtn: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  miniMerchantName: {
    fontSize: 13,
    color: '#E2E8F0',
    marginBottom: 2,
  },
  miniMerchantAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  miniScanView: {
    padding: 40,
    alignItems: 'center',
  },
  miniScanText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 12,
  },
  miniResultView: {
    padding: 24,
    alignItems: 'center',
  },
  miniResultTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 8,
  },
  miniResultEntries: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  miniResetBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  miniResetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Authority Panel
  authorityPanel: {
    padding: 16,
  },
  authLiveStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  authStatItem: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 26, 0.5)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  authStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  authStatLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  authTransaction: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  authTransactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  authTransactionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  authTransactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  authTransactionDetails: {
    paddingLeft: 18,
  },
  authTransactionMerchant: {
    fontSize: 13,
    color: '#E2E8F0',
  },
  authTransactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 4,
  },
  authTransactionVat: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  authTransactionId: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontFamily: isWeb ? 'monospace' : undefined,
  },
  authFeed: {
    backgroundColor: 'rgba(10, 10, 26, 0.5)',
    borderRadius: 10,
    padding: 12,
  },
  authFeedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
  },
  authFeedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.1)',
  },
  authFeedText: {
    fontSize: 12,
    color: '#E2E8F0',
  },
  authFeedAmount: {
    fontSize: 12,
    color: '#10B981',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  prizeModal: {
    backgroundColor: '#0f0f1f',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
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
    fontSize: 18,
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
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  currencyPrefix: {
    fontSize: 14,
    color: '#64748B',
  },
  currencyValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  prizeSlider: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  prizePreset: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    alignItems: 'center',
  },
  prizePresetActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  prizePresetText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  modalApplyBtn: {
    margin: 20,
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalApplyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
