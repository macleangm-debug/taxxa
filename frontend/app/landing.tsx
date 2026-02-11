import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  TextInput,
  Modal,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000, prefix = '', suffix = '' }: { end: number; duration?: number; prefix?: string; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      countRef.current = Math.floor(eased * end);
      setCount(countRef.current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toLocaleString();
  };

  return (
    <Text style={styles.statNumber}>{prefix}{formatNumber(count)}{suffix}</Text>
  );
};

// Floating Animation Component
const FloatingElement = ({ children, delay = 0, duration = 3000 }: { children: React.ReactNode; delay?: number; duration?: number }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -15,
          duration: duration / 2,
          useNativeDriver: true,
          delay,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

// Fade In Animation Component
const FadeInView = ({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  
  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        delay,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

// Scan Animation Component
const ScanDemo = () => {
  const [step, setStep] = useState(0);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const entriesAnim = useRef(new Animated.Value(0)).current;

  const startDemo = () => {
    setStep(1);
    scanLineAnim.setValue(0);
    successScale.setValue(0);
    entriesAnim.setValue(0);

    // Step 1: Scanning animation
    Animated.timing(scanLineAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      // Step 2: Success
      setStep(2);
      Animated.spring(successScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
      
      // Step 3: Entries earned
      setTimeout(() => {
        setStep(3);
        Animated.spring(entriesAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }).start();
        
        // Reset after delay
        setTimeout(() => setStep(0), 3000);
      }, 1000);
    });
  };

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180],
  });

  return (
    <View style={styles.demoContainer}>
      {/* Phone Frame */}
      <View style={styles.phoneFrame}>
        <View style={styles.phoneNotch} />
        <View style={styles.phoneScreen}>
          {step === 0 && (
            <View style={styles.demoIdleState}>
              <View style={styles.qrCodePlaceholder}>
                <Ionicons name="qr-code" size={80} color="#10B981" />
              </View>
              <Text style={styles.demoIdleText}>Tap to scan receipt</Text>
            </View>
          )}
          
          {step === 1 && (
            <View style={styles.scanningState}>
              <View style={styles.scanArea}>
                <Animated.View 
                  style={[
                    styles.scanLine,
                    { transform: [{ translateY: scanLineTranslate }] }
                  ]} 
                />
                <View style={styles.scanCorner} />
                <View style={[styles.scanCorner, styles.scanCornerTR]} />
                <View style={[styles.scanCorner, styles.scanCornerBL]} />
                <View style={[styles.scanCorner, styles.scanCornerBR]} />
              </View>
              <Text style={styles.scanningText}>Scanning receipt...</Text>
            </View>
          )}
          
          {step >= 2 && (
            <Animated.View style={[styles.successState, { transform: [{ scale: successScale }] }]}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={48} color="#fff" />
              </View>
              <Text style={styles.successText}>Receipt Verified!</Text>
              {step >= 3 && (
                <Animated.View style={[styles.entriesEarned, { transform: [{ scale: entriesAnim }] }]}>
                  <Text style={styles.entriesNumber}>+5</Text>
                  <Text style={styles.entriesLabel}>Entries Earned</Text>
                </Animated.View>
              )}
            </Animated.View>
          )}
        </View>
      </View>
      
      {step === 0 && (
        <Pressable style={styles.scanButton} onPress={startDemo}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.scanButtonGradient}
          >
            <Ionicons name="scan" size={20} color="#fff" />
            <Text style={styles.scanButtonText}>Try Live Demo</Text>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
};

// ROI Calculator Component
const ROICalculator = () => {
  const [population, setPopulation] = useState('10');
  const [avgTransaction, setAvgTransaction] = useState('50');
  const [taxRate, setTaxRate] = useState('15');
  const [evasionRate, setEvasionRate] = useState('25');
  
  const recoveredRevenue = () => {
    const pop = parseFloat(population) || 0;
    const trans = parseFloat(avgTransaction) || 0;
    const tax = parseFloat(taxRate) || 0;
    const evasion = parseFloat(evasionRate) || 0;
    
    // Simplified calculation
    const annualTransactions = pop * 1000000 * 365 * 2; // Population * days * avg transactions
    const evadedAmount = annualTransactions * trans * (evasion / 100);
    const recoverable = evadedAmount * (tax / 100) * 0.4; // 40% recovery rate
    
    return recoverable;
  };

  const formatCurrency = (num: number) => {
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(0)}M`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <View style={styles.calculatorContainer}>
      <View style={styles.calculatorGrid}>
        <View style={styles.calculatorInput}>
          <Text style={styles.calcLabel}>Population (millions)</Text>
          <TextInput
            style={styles.calcInput}
            value={population}
            onChangeText={setPopulation}
            keyboardType="numeric"
            placeholderTextColor="#64748B"
          />
        </View>
        <View style={styles.calculatorInput}>
          <Text style={styles.calcLabel}>Avg Transaction ($)</Text>
          <TextInput
            style={styles.calcInput}
            value={avgTransaction}
            onChangeText={setAvgTransaction}
            keyboardType="numeric"
            placeholderTextColor="#64748B"
          />
        </View>
        <View style={styles.calculatorInput}>
          <Text style={styles.calcLabel}>Tax Rate (%)</Text>
          <TextInput
            style={styles.calcInput}
            value={taxRate}
            onChangeText={setTaxRate}
            keyboardType="numeric"
            placeholderTextColor="#64748B"
          />
        </View>
        <View style={styles.calculatorInput}>
          <Text style={styles.calcLabel}>Est. Evasion Rate (%)</Text>
          <TextInput
            style={styles.calcInput}
            value={evasionRate}
            onChangeText={setEvasionRate}
            keyboardType="numeric"
            placeholderTextColor="#64748B"
          />
        </View>
      </View>
      <View style={styles.calculatorResult}>
        <Text style={styles.resultLabel}>Potential Annual Recovery</Text>
        <Text style={styles.resultValue}>{formatCurrency(recoveredRevenue())}</Text>
        <Text style={styles.resultNote}>Based on 40% compliance increase with Taxxa</Text>
      </View>
    </View>
  );
};

export default function ModernLandingPage() {
  const router = useRouter();
  const [showContactModal, setShowContactModal] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Rotate through steps automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const howItWorks = [
    { icon: 'cart', title: 'Shop & Request Receipt', desc: 'Make a purchase and ask for an official tax receipt with QR code' },
    { icon: 'qr-code', title: 'Scan QR Code', desc: 'Open the app and scan your receipt QR code instantly' },
    { icon: 'ticket', title: 'Enter Draws', desc: 'Each valid receipt earns entries into weekly, monthly & annual draws' },
    { icon: 'trophy', title: 'Win Tax-Free Prizes', desc: 'Winners announced live - prizes range from $100 to $1M' },
  ];

  const stats = [
    { value: 2500000, suffix: '+', label: 'Receipts Scanned' },
    { value: 94, suffix: '%', label: 'Compliance Rate' },
    { value: 18, suffix: '%', label: 'Revenue Increase' },
    { value: 50, suffix: 'M', prefix: '$', label: 'Prizes Awarded' },
  ];

  const testimonials = [
    {
      quote: "Taxxa transformed our tax compliance from 67% to 94% in just 18 months. The ROI is extraordinary.",
      author: "Maria Santos",
      role: "Deputy Finance Minister, Country A",
      image: "👩‍💼",
    },
    {
      quote: "Citizens now actively participate in tax compliance. It's a paradigm shift in public engagement.",
      author: "Dr. James Okonkwo",
      role: "Tax Authority Commissioner, Country B",
      image: "👨‍💼",
    },
    {
      quote: "The real-time analytics gave us unprecedented visibility into retail transactions.",
      author: "Li Wei Chen",
      role: "Director of Revenue, Country C",
      image: "👨‍💼",
    },
  ];

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}
    >
      {/* Noise Overlay */}
      {isWeb && <View style={styles.noiseOverlay} />}
      
      {/* Navigation */}
      <View style={styles.nav}>
        <View style={styles.navContent}>
          <View style={styles.navLogo}>
            <View style={styles.logoIcon}>
              <Ionicons name="receipt" size={24} color="#10B981" />
            </View>
            <Text style={styles.logoText}>Taxxa</Text>
            <View style={styles.enterpriseBadge}>
              <Text style={styles.enterpriseText}>Enterprise</Text>
            </View>
          </View>
          <View style={styles.navLinks}>
            <Pressable><Text style={styles.navLink}>Solution</Text></Pressable>
            <Pressable><Text style={styles.navLink}>How It Works</Text></Pressable>
            <Pressable><Text style={styles.navLink}>Results</Text></Pressable>
            <Pressable><Text style={styles.navLink}>Pricing</Text></Pressable>
            <Pressable 
              style={styles.navCTA}
              onPress={() => setShowContactModal(true)}
            >
              <Text style={styles.navCTAText}>Request Demo</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <FadeInView delay={0}>
            <View style={styles.heroBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.heroBadgeText}>Trusted by 12 Tax Authorities Worldwide</Text>
            </View>
          </FadeInView>
          
          <FadeInView delay={200}>
            <Text style={styles.heroTitle}>
              Increase Tax Compliance{'\n'}
              <Text style={styles.heroTitleGradient}>Through Citizen Engagement</Text>
            </Text>
          </FadeInView>
          
          <FadeInView delay={400}>
            <Text style={styles.heroSubtitle}>
              Taxxa is a proven digital platform that incentivizes consumers to request 
              tax receipts, dramatically increasing compliance rates and providing tax 
              authorities with unprecedented transaction visibility.
            </Text>
          </FadeInView>
          
          <FadeInView delay={600}>
            <View style={styles.heroCTAs}>
              <Pressable 
                style={styles.primaryCTA}
                onPress={() => setShowContactModal(true)}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryCTAGradient}
                >
                  <Ionicons name="calendar" size={20} color="#fff" />
                  <Text style={styles.primaryCTAText}>Schedule a Demo</Text>
                </LinearGradient>
              </Pressable>
              <Pressable 
                style={styles.secondaryCTA}
                onPress={() => router.push('/admin')}
              >
                <Ionicons name="laptop-outline" size={20} color="#fff" />
                <Text style={styles.secondaryCTAText}>View Admin Portal</Text>
              </Pressable>
            </View>
          </FadeInView>
          
          <FadeInView delay={800}>
            <View style={styles.trustBadges}>
              <View style={styles.trustBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                <Text style={styles.trustBadgeText}>SOC 2 Ready</Text>
              </View>
              <View style={styles.trustBadge}>
                <Ionicons name="lock-closed" size={16} color="#F59E0B" />
                <Text style={styles.trustBadgeText}>GDPR Compliant</Text>
              </View>
              <View style={styles.trustBadge}>
                <Ionicons name="cloud-done" size={16} color="#3B82F6" />
                <Text style={styles.trustBadgeText}>99.9% Uptime SLA</Text>
              </View>
            </View>
          </FadeInView>
        </View>
        
        {/* Hero Visual - Interactive Demo */}
        <FadeInView delay={400} style={styles.heroVisual}>
          <FloatingElement duration={4000}>
            <View style={styles.demoCard}>
              <View style={styles.demoCardHeader}>
                <View style={styles.demoCardDots}>
                  <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                  <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                  <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                </View>
                <Text style={styles.demoCardTitle}>Taxxa Admin Portal</Text>
              </View>
              <View style={styles.demoCardContent}>
                <View style={styles.miniStatsGrid}>
                  <View style={styles.miniStat}>
                    <Text style={styles.miniStatValue}>1.2M</Text>
                    <Text style={styles.miniStatLabel}>Scans Today</Text>
                  </View>
                  <View style={styles.miniStat}>
                    <Text style={styles.miniStatValue}>94%</Text>
                    <Text style={styles.miniStatLabel}>Compliance</Text>
                  </View>
                  <View style={styles.miniStat}>
                    <Text style={[styles.miniStatValue, { color: '#10B981' }]}>+18%</Text>
                    <Text style={styles.miniStatLabel}>Revenue</Text>
                  </View>
                </View>
                <View style={styles.miniChart}>
                  <View style={styles.chartBar} />
                  <View style={[styles.chartBar, { height: 60 }]} />
                  <View style={[styles.chartBar, { height: 80 }]} />
                  <View style={[styles.chartBar, { height: 55 }]} />
                  <View style={[styles.chartBar, { height: 90 }]} />
                  <View style={[styles.chartBar, { height: 70 }]} />
                  <View style={[styles.chartBar, { height: 100 }]} />
                </View>
                <Text style={styles.chartLabel}>Real-Time Analytics</Text>
              </View>
            </View>
          </FloatingElement>
        </FadeInView>
      </View>

      {/* Live Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statsBarContent}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <AnimatedCounter 
                end={stat.value} 
                prefix={stat.prefix || ''} 
                suffix={stat.suffix || ''} 
              />
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* How It Works Section */}
      <View style={styles.section}>
        <FadeInView>
          <Text style={styles.sectionLabel}>THE PROCESS</Text>
          <Text style={styles.sectionTitle}>How Taxxa Works</Text>
          <Text style={styles.sectionSubtitle}>
            A simple four-step process that transforms tax compliance into an engaging experience
          </Text>
        </FadeInView>
        
        <View style={styles.howItWorksGrid}>
          {howItWorks.map((step, index) => (
            <FadeInView key={index} delay={index * 150}>
              <Pressable 
                style={[
                  styles.stepCard,
                  activeStep === index && styles.stepCardActive
                ]}
                onPress={() => setActiveStep(index)}
              >
                <View style={[styles.stepNumber, activeStep === index && styles.stepNumberActive]}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={[styles.stepIcon, activeStep === index && styles.stepIconActive]}>
                  <Ionicons 
                    name={step.icon as any} 
                    size={32} 
                    color={activeStep === index ? '#10B981' : '#64748B'} 
                  />
                </View>
                <Text style={[styles.stepTitle, activeStep === index && styles.stepTitleActive]}>
                  {step.title}
                </Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
                {activeStep === index && (
                  <View style={styles.stepConnector} />
                )}
              </Pressable>
            </FadeInView>
          ))}
        </View>
      </View>

      {/* Interactive Demo Section */}
      <View style={styles.demoSection}>
        <View style={styles.demoSectionContent}>
          <FadeInView>
            <Text style={styles.sectionLabel}>TRY IT YOURSELF</Text>
            <Text style={styles.sectionTitle}>Experience the Scan Flow</Text>
            <Text style={styles.sectionSubtitle}>
              Click the button below to see how citizens scan receipts and earn draw entries
            </Text>
          </FadeInView>
          <FadeInView delay={300}>
            <ScanDemo />
          </FadeInView>
        </View>
      </View>

      {/* ROI Calculator Section */}
      <View style={styles.section}>
        <FadeInView>
          <Text style={styles.sectionLabel}>CALCULATE YOUR ROI</Text>
          <Text style={styles.sectionTitle}>Revenue Recovery Estimator</Text>
          <Text style={styles.sectionSubtitle}>
            See how much additional tax revenue Taxxa could help you recover
          </Text>
        </FadeInView>
        <FadeInView delay={300}>
          <ROICalculator />
        </FadeInView>
      </View>

      {/* Testimonials Section */}
      <View style={styles.testimonialsSection}>
        <FadeInView>
          <Text style={styles.sectionLabel}>SUCCESS STORIES</Text>
          <Text style={styles.sectionTitle}>Trusted by Finance Ministries</Text>
        </FadeInView>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.testimonialsScroll}
        >
          {testimonials.map((testimonial, index) => (
            <FadeInView key={index} delay={index * 200}>
              <View style={styles.testimonialCard}>
                <View style={styles.quoteIcon}>
                  <Ionicons name="chatbubble-ellipses" size={24} color="#10B981" />
                </View>
                <Text style={styles.testimonialQuote}>"{testimonial.quote}"</Text>
                <View style={styles.testimonialAuthor}>
                  <Text style={styles.testimonialImage}>{testimonial.image}</Text>
                  <View>
                    <Text style={styles.testimonialName}>{testimonial.author}</Text>
                    <Text style={styles.testimonialRole}>{testimonial.role}</Text>
                  </View>
                </View>
              </View>
            </FadeInView>
          ))}
        </ScrollView>
      </View>

      {/* Problem & Solution Section */}
      <View style={styles.problemSection}>
        <View style={styles.problemContent}>
          <FadeInView>
            <Text style={styles.sectionLabel}>THE CHALLENGE</Text>
            <Text style={styles.sectionTitle}>Why Traditional Compliance Fails</Text>
          </FadeInView>
          
          <View style={styles.problemGrid}>
            {[
              { icon: 'close-circle', title: 'No Consumer Incentive', desc: 'Citizens have no personal benefit from requesting receipts', color: '#EF4444' },
              { icon: 'cash', title: 'Penalty-Only Approach', desc: 'Enforcement relies on expensive audits and creates adversarial relationships', color: '#F97316' },
              { icon: 'time', title: 'Delayed Detection', desc: 'Tax evasion discovered months later, after revenue is already lost', color: '#EAB308' },
              { icon: 'eye-off', title: 'Information Gap', desc: 'Tax authorities lack real-time visibility into retail transactions', color: '#8B5CF6' },
              { icon: 'people', title: 'Public Disengagement', desc: 'Citizens view tax compliance as the government\'s problem', color: '#6366F1' },
              { icon: 'wallet', title: 'High Enforcement Costs', desc: 'Manual audits often cost more than recovered revenue', color: '#EC4899' },
            ].map((problem, index) => (
              <FadeInView key={index} delay={index * 100}>
                <View style={styles.problemCard}>
                  <View style={[styles.problemIcon, { backgroundColor: `${problem.color}20` }]}>
                    <Ionicons name={problem.icon as any} size={24} color={problem.color} />
                  </View>
                  <Text style={styles.problemTitle}>{problem.title}</Text>
                  <Text style={styles.problemDesc}>{problem.desc}</Text>
                </View>
              </FadeInView>
            ))}
          </View>
        </View>
      </View>

      {/* Solutions Section */}
      <View style={styles.solutionsSection}>
        <FadeInView>
          <Text style={styles.sectionLabel}>OUR SOLUTION</Text>
          <Text style={styles.sectionTitle}>How Taxxa Solves These Challenges</Text>
          <Text style={styles.sectionSubtitle}>
            A behavioral economics approach that aligns citizen and government interests
          </Text>
        </FadeInView>
        
        <View style={styles.solutionsGrid}>
          {[
            {
              icon: 'gift',
              title: 'Incentivized Collection',
              desc: 'Prize draws motivate citizens to request receipts, creating natural demand for compliant transactions',
              cta: 'See Prize Structure',
              color: '#10B981'
            },
            {
              icon: 'shield-checkmark',
              title: 'Real-Time Verification',
              desc: 'Every receipt is instantly validated against your tax database, ensuring authenticity',
              cta: 'View Integration Docs',
              color: '#3B82F6'
            },
            {
              icon: 'analytics',
              title: 'Comprehensive Analytics',
              desc: 'Real-time dashboards showing transaction volumes, compliance rates, and geographic distribution',
              cta: 'Explore Dashboard',
              color: '#8B5CF6'
            },
            {
              icon: 'lock-closed',
              title: 'Cryptographic Fairness',
              desc: 'Verifiable random selection with full audit trails builds public trust through mathematical proof',
              cta: 'Learn About Security',
              color: '#F59E0B'
            },
          ].map((solution, index) => (
            <FadeInView key={index} delay={index * 150}>
              <View style={styles.solutionCard}>
                <View style={[styles.solutionIconWrapper, { backgroundColor: `${solution.color}15` }]}>
                  <Ionicons name={solution.icon as any} size={32} color={solution.color} />
                </View>
                <Text style={styles.solutionTitle}>{solution.title}</Text>
                <Text style={styles.solutionDesc}>{solution.desc}</Text>
                <Pressable style={styles.solutionCTA}>
                  <Text style={[styles.solutionCTAText, { color: solution.color }]}>{solution.cta}</Text>
                  <Ionicons name="arrow-forward" size={16} color={solution.color} />
                </Pressable>
              </View>
            </FadeInView>
          ))}
        </View>
      </View>

      {/* Features Grid Section */}
      <View style={styles.featuresSection}>
        <FadeInView>
          <Text style={styles.sectionLabel}>PLATFORM CAPABILITIES</Text>
          <Text style={styles.sectionTitle}>Enterprise-Grade Features</Text>
          <Text style={styles.sectionSubtitle}>
            Everything you need to deploy, manage, and scale a successful receipt lottery program
          </Text>
        </FadeInView>
        
        <View style={styles.featuresGrid}>
          {[
            {
              category: 'Integration',
              icon: 'code-slash',
              color: '#3B82F6',
              items: [
                'RESTful API with comprehensive documentation',
                'QR, barcode, and digital receipt support',
                'Webhook notifications for real-time events',
                'OAuth 2.0 and API key authentication',
                'Sandbox environment for testing',
              ]
            },
            {
              category: 'Administration',
              icon: 'settings',
              color: '#10B981',
              items: [
                'Multi-tenant regional deployment',
                'Role-based access control (RBAC)',
                'Configurable draw frequencies & prizes',
                'Merchant management & compliance tracking',
                'Automated fraud detection algorithms',
              ]
            },
            {
              category: 'Analytics',
              icon: 'bar-chart',
              color: '#8B5CF6',
              items: [
                'Real-time transaction dashboards',
                'Geographic heat maps of activity',
                'Merchant compliance scoring',
                'Revenue impact projections',
                'Exportable reports (PDF, CSV, API)',
              ]
            },
            {
              category: 'Security',
              icon: 'shield-checkmark',
              color: '#F59E0B',
              items: [
                'End-to-end encryption (TLS 1.3)',
                'SOC 2 Type II compliance ready',
                'GDPR-compliant data handling',
                'Cryptographic audit trails',
                'Regular third-party security audits',
              ]
            },
          ].map((feature, index) => (
            <FadeInView key={index} delay={index * 150}>
              <View style={styles.featureCard}>
                <View style={styles.featureCardHeader}>
                  <View style={[styles.featureIconBg, { backgroundColor: `${feature.color}15` }]}>
                    <Ionicons name={feature.icon as any} size={24} color={feature.color} />
                  </View>
                  <Text style={styles.featureCategoryTitle}>{feature.category}</Text>
                </View>
                <View style={styles.featureList}>
                  {feature.items.map((item, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color={feature.color} />
                      <Text style={styles.featureItemText}>{item}</Text>
                    </View>
                  ))}
                </View>
                <Pressable style={[styles.featureCTA, { borderColor: feature.color }]}>
                  <Text style={[styles.featureCTAText, { color: feature.color }]}>Learn More</Text>
                  <Ionicons name="arrow-forward" size={16} color={feature.color} />
                </Pressable>
              </View>
            </FadeInView>
          ))}
        </View>
      </View>

      {/* Deployment Process */}
      <View style={styles.deploymentSection}>
        <FadeInView>
          <Text style={styles.sectionLabel}>IMPLEMENTATION</Text>
          <Text style={styles.sectionTitle}>Rapid Deployment Process</Text>
          <Text style={styles.sectionSubtitle}>
            From first contact to full launch in as little as 8-12 weeks
          </Text>
        </FadeInView>
        
        <View style={styles.deploymentTimeline}>
          {[
            {
              phase: 'Phase 1',
              title: 'Discovery & Planning',
              duration: '2-3 Weeks',
              icon: 'search',
              tasks: ['Technical assessment', 'API specification', 'Security requirements', 'Project timeline'],
            },
            {
              phase: 'Phase 2',
              title: 'Integration',
              duration: '4-6 Weeks',
              icon: 'code-slash',
              tasks: ['API integration', 'Custom branding', 'Prize configuration', 'Admin training'],
            },
            {
              phase: 'Phase 3',
              title: 'Testing',
              duration: '2-3 Weeks',
              icon: 'checkmark-done',
              tasks: ['End-to-end testing', 'Security audit', 'Load testing', 'UAT'],
            },
            {
              phase: 'Phase 4',
              title: 'Launch & Support',
              duration: 'Ongoing',
              icon: 'rocket',
              tasks: ['Launch coordination', 'Real-time monitoring', '24/7 support', 'Quarterly reviews'],
            },
          ].map((phase, index) => (
            <FadeInView key={index} delay={index * 200}>
              <View style={styles.phaseCard}>
                <View style={styles.phaseHeader}>
                  <View style={styles.phaseIconCircle}>
                    <Ionicons name={phase.icon as any} size={24} color="#10B981" />
                  </View>
                  <View style={styles.phaseBadge}>
                    <Text style={styles.phaseBadgeText}>{phase.phase}</Text>
                  </View>
                </View>
                <Text style={styles.phaseTitle}>{phase.title}</Text>
                <Text style={styles.phaseDuration}>{phase.duration}</Text>
                <View style={styles.phaseTasks}>
                  {phase.tasks.map((task, idx) => (
                    <View key={idx} style={styles.phaseTask}>
                      <View style={styles.phaseTaskDot} />
                      <Text style={styles.phaseTaskText}>{task}</Text>
                    </View>
                  ))}
                </View>
                {index < 3 && <View style={styles.phaseConnector} />}
              </View>
            </FadeInView>
          ))}
        </View>
        
        <FadeInView delay={800}>
          <View style={styles.deploymentCTA}>
            <Text style={styles.deploymentCTATitle}>Ready to Get Started?</Text>
            <Pressable 
              style={styles.deploymentCTAButton}
              onPress={() => setShowContactModal(true)}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.deploymentCTAGradient}
              >
                <Text style={styles.deploymentCTAButtonText}>Schedule Discovery Call</Text>
                <Ionicons name="calendar" size={20} color="#fff" />
              </LinearGradient>
            </Pressable>
          </View>
        </FadeInView>
      </View>

      {/* Global Case Studies */}
      <View style={styles.caseStudiesSection}>
        <FadeInView>
          <Text style={styles.sectionLabel}>PROVEN RESULTS</Text>
          <Text style={styles.sectionTitle}>Global Success Stories</Text>
        </FadeInView>
        
        <View style={styles.caseStudiesGrid}>
          {[
            {
              country: 'Taiwan',
              flag: '🇹🇼',
              program: 'Uniform Invoice Lottery',
              since: 'Since 1951',
              result: 'Near-universal receipt issuance, credited with significantly reducing tax evasion for over 70 years.',
              metric: '99%',
              metricLabel: 'Compliance',
            },
            {
              country: 'Portugal',
              flag: '🇵🇹',
              program: 'Fatura da Sorte',
              since: 'Since 2014',
              result: 'Increased invoice requests by 15% and generated millions in previously unreported transactions.',
              metric: '+15%',
              metricLabel: 'Receipt Requests',
            },
            {
              country: 'Slovakia',
              flag: '🇸🇰',
              program: 'Receipt Lottery',
              since: 'Since 2013',
              result: 'Documented VAT revenue increases and improved merchant compliance rates nationwide.',
              metric: '+20%',
              metricLabel: 'VAT Revenue',
            },
          ].map((study, index) => (
            <FadeInView key={index} delay={index * 200}>
              <View style={styles.caseStudyCard}>
                <View style={styles.caseStudyHeader}>
                  <Text style={styles.caseStudyFlag}>{study.flag}</Text>
                  <View>
                    <Text style={styles.caseStudyCountry}>{study.country}</Text>
                    <Text style={styles.caseStudyProgram}>{study.program}</Text>
                  </View>
                </View>
                <View style={styles.caseStudyMetric}>
                  <Text style={styles.caseStudyMetricValue}>{study.metric}</Text>
                  <Text style={styles.caseStudyMetricLabel}>{study.metricLabel}</Text>
                </View>
                <Text style={styles.caseStudyResult}>{study.result}</Text>
                <Text style={styles.caseStudySince}>{study.since}</Text>
                <Pressable style={styles.caseStudyCTA}>
                  <Text style={styles.caseStudyCTAText}>Read Full Case Study</Text>
                  <Ionicons name="arrow-forward" size={16} color="#10B981" />
                </Pressable>
              </View>
            </FadeInView>
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <LinearGradient
          colors={['#064E3B', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaGradient}
        >
          <FadeInView>
            <Text style={styles.ctaTitle}>Ready to Transform Tax Compliance?</Text>
            <Text style={styles.ctaSubtitle}>
              Join 12 countries already using Taxxa to increase revenue and citizen engagement
            </Text>
            <View style={styles.ctaButtons}>
              <Pressable 
                style={styles.ctaButton}
                onPress={() => setShowContactModal(true)}
              >
                <Text style={styles.ctaButtonText}>Schedule Demo</Text>
                <Ionicons name="arrow-forward" size={20} color="#0F172A" />
              </Pressable>
              <Pressable style={styles.ctaButtonSecondary}>
                <Ionicons name="document-text" size={20} color="#fff" />
                <Text style={styles.ctaButtonSecondaryText}>Download Case Study</Text>
              </Pressable>
            </View>
          </FadeInView>
        </LinearGradient>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerBrand}>
            <View style={styles.footerLogo}>
              <Ionicons name="receipt" size={28} color="#10B981" />
              <Text style={styles.footerLogoText}>Taxxa</Text>
            </View>
            <Text style={styles.footerTagline}>The Lottery of Good Governance</Text>
          </View>
          <View style={styles.footerLinks}>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Product</Text>
              <Text style={styles.footerLink}>Features</Text>
              <Text style={styles.footerLink}>Pricing</Text>
              <Text style={styles.footerLink}>Security</Text>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Company</Text>
              <Text style={styles.footerLink}>About</Text>
              <Text style={styles.footerLink}>Careers</Text>
              <Text style={styles.footerLink}>Contact</Text>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Resources</Text>
              <Text style={styles.footerLink}>Documentation</Text>
              <Text style={styles.footerLink}>API Reference</Text>
              <Text style={styles.footerLink}>Blog</Text>
            </View>
          </View>
        </View>
        <View style={styles.footerBottom}>
          <Text style={styles.footerCopyright}>© 2026 Taxxa. All rights reserved.</Text>
        </View>
      </View>

      {/* Contact Modal */}
      <Modal
        visible={showContactModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowContactModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable 
              style={styles.modalClose}
              onPress={() => setShowContactModal(false)}
            >
              <Ionicons name="close" size={24} color="#94A3B8" />
            </Pressable>
            <Text style={styles.modalTitle}>Request a Demo</Text>
            <Text style={styles.modalSubtitle}>
              Fill out the form and our team will contact you within 24 hours
            </Text>
            <View style={styles.modalForm}>
              <TextInput 
                style={styles.modalInput}
                placeholder="Full Name"
                placeholderTextColor="#64748B"
              />
              <TextInput 
                style={styles.modalInput}
                placeholder="Organization / Ministry"
                placeholderTextColor="#64748B"
              />
              <TextInput 
                style={styles.modalInput}
                placeholder="Email Address"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
              />
              <TextInput 
                style={styles.modalInput}
                placeholder="Country"
                placeholderTextColor="#64748B"
              />
              <TextInput 
                style={[styles.modalInput, styles.modalTextarea]}
                placeholder="Tell us about your needs..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={4}
              />
              <Pressable style={styles.modalSubmit}>
                <Text style={styles.modalSubmitText}>Submit Request</Text>
              </Pressable>
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
    backgroundColor: '#0F172A',
  },
  noiseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03,
    backgroundColor: '#fff',
    zIndex: 100,
    pointerEvents: 'none',
  },
  
  // Navigation
  nav: {
    position: isWeb ? 'sticky' : 'relative',
    top: 0,
    zIndex: 50,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    backdropFilter: 'blur(12px)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.5)',
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    maxWidth: 1400,
    marginHorizontal: 'auto',
    width: '100%',
  },
  navLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  enterpriseBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  enterpriseText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  navLink: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '500',
  },
  navCTA: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  navCTAText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Hero Section
  hero: {
    flexDirection: isWeb ? 'row' : 'column',
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 60,
    maxWidth: 1400,
    marginHorizontal: 'auto',
    width: '100%',
    gap: 60,
  },
  heroContent: {
    flex: 1,
    maxWidth: isWeb ? 600 : '100%',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 8,
    marginBottom: 24,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  heroBadgeText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  heroTitle: {
    fontSize: isWeb ? 56 : 36,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: isWeb ? 68 : 44,
    marginBottom: 24,
  },
  heroTitleGradient: {
    color: '#10B981',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#94A3B8',
    lineHeight: 28,
    marginBottom: 32,
  },
  heroCTAs: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  primaryCTA: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  primaryCTAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  primaryCTAText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryCTAText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '500',
  },
  trustBadges: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustBadgeText: {
    color: '#64748B',
    fontSize: 13,
  },
  
  // Hero Visual
  heroVisual: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 0,
    width: isWeb ? 420 : 320,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
  },
  demoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  demoCardDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  demoCardTitle: {
    color: '#94A3B8',
    fontSize: 13,
  },
  demoCardContent: {
    padding: 20,
  },
  miniStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatValue: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
  },
  miniStatLabel: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    gap: 8,
  },
  chartBar: {
    flex: 1,
    height: 40,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    opacity: 0.8,
  },
  chartLabel: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },

  // Stats Bar
  statsBar: {
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
    paddingVertical: 40,
  },
  statsBarContent: {
    flexDirection: isWeb ? 'row' : 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    maxWidth: 1200,
    marginHorizontal: 'auto',
    gap: 32,
    paddingHorizontal: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#F8FAFC',
    fontSize: 48,
    fontWeight: '700',
    fontFamily: isWeb ? 'monospace' : undefined,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 8,
  },

  // Section Styles
  section: {
    paddingHorizontal: 32,
    paddingVertical: 80,
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
  },
  sectionLabel: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: isWeb ? 40 : 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionSubtitle: {
    color: '#94A3B8',
    fontSize: 18,
    textAlign: 'center',
    maxWidth: 600,
    marginHorizontal: 'auto',
    marginBottom: 48,
    lineHeight: 28,
  },

  // How It Works
  howItWorksGrid: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 24,
  },
  stepCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
    overflow: 'hidden',
  },
  stepCardActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  stepNumber: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberActive: {
    backgroundColor: '#10B981',
  },
  stepNumberText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  stepIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIconActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  stepTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  stepTitleActive: {
    color: '#10B981',
  },
  stepDesc: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
  },
  stepConnector: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#10B981',
  },

  // Demo Section
  demoSection: {
    backgroundColor: '#1E293B',
    paddingVertical: 80,
  },
  demoSectionContent: {
    maxWidth: 800,
    marginHorizontal: 'auto',
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  demoContainer: {
    alignItems: 'center',
    gap: 24,
  },
  phoneFrame: {
    width: 280,
    height: 560,
    backgroundColor: '#0F172A',
    borderRadius: 40,
    padding: 12,
    borderWidth: 4,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
  },
  phoneNotch: {
    width: 120,
    height: 28,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    alignSelf: 'center',
    marginBottom: 8,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoIdleState: {
    alignItems: 'center',
  },
  qrCodePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  demoIdleText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  scanningState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  scanArea: {
    width: 200,
    height: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  scanCorner: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#10B981',
  },
  scanCornerTR: {
    left: 'auto',
    right: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  scanCornerBL: {
    top: 'auto',
    bottom: 0,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  scanCornerBR: {
    top: 'auto',
    bottom: 0,
    left: 'auto',
    right: 0,
    borderTopWidth: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  scanningText: {
    color: '#10B981',
    fontSize: 14,
    marginTop: 20,
  },
  successState: {
    alignItems: 'center',
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successText: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  entriesEarned: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  entriesNumber: {
    color: '#F59E0B',
    fontSize: 32,
    fontWeight: '700',
  },
  entriesLabel: {
    color: '#F59E0B',
    fontSize: 12,
  },
  scanButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Calculator
  calculatorContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: '#334155',
  },
  calculatorGrid: {
    flexDirection: isWeb ? 'row' : 'column',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  calculatorInput: {
    flex: 1,
    minWidth: isWeb ? 200 : '100%',
  },
  calcLabel: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 8,
  },
  calcInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F8FAFC',
    fontSize: 16,
  },
  calculatorResult: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  resultLabel: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 8,
  },
  resultValue: {
    color: '#10B981',
    fontSize: 48,
    fontWeight: '700',
    fontFamily: isWeb ? 'monospace' : undefined,
  },
  resultNote: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 8,
  },

  // Testimonials
  testimonialsSection: {
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  testimonialsScroll: {
    paddingTop: 32,
    paddingHorizontal: 16,
    gap: 24,
  },
  testimonialCard: {
    width: 360,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quoteIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  testimonialQuote: {
    color: '#F8FAFC',
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testimonialImage: {
    fontSize: 36,
  },
  testimonialName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  testimonialRole: {
    color: '#64748B',
    fontSize: 13,
  },

  // CTA Section
  ctaSection: {
    marginHorizontal: 32,
    marginVertical: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  ctaGradient: {
    padding: 64,
    alignItems: 'center',
  },
  ctaTitle: {
    color: '#F8FAFC',
    fontSize: isWeb ? 36 : 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaSubtitle: {
    color: '#94A3B8',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 500,
  },
  ctaButtons: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 16,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#10B981',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 24,
  },
  ctaButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
  },
  ctaButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 24,
  },
  ctaButtonSecondaryText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '500',
  },

  // Footer
  footer: {
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 64,
    paddingHorizontal: 32,
  },
  footerContent: {
    flexDirection: isWeb ? 'row' : 'column',
    justifyContent: 'space-between',
    maxWidth: 1200,
    marginHorizontal: 'auto',
    gap: 48,
    marginBottom: 48,
  },
  footerBrand: {
    maxWidth: 300,
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  footerLogoText: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
  },
  footerTagline: {
    color: '#64748B',
    fontSize: 14,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 64,
    flexWrap: 'wrap',
  },
  footerColumn: {
    gap: 12,
  },
  footerColumnTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  footerLink: {
    color: '#64748B',
    fontSize: 14,
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerCopyright: {
    color: '#64748B',
    fontSize: 13,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 480,
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 24,
  },
  modalForm: {
    gap: 16,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F8FAFC',
    fontSize: 15,
  },
  modalTextarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalSubmit: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Problem Section
  problemSection: {
    backgroundColor: '#1E293B',
    paddingVertical: 80,
  },
  problemContent: {
    maxWidth: 1200,
    marginHorizontal: 'auto',
    paddingHorizontal: 32,
  },
  problemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 40,
    justifyContent: 'center',
  },
  problemCard: {
    width: isWeb ? 'calc(33.333% - 14px)' : '100%',
    minWidth: 280,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  problemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  problemTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  problemDesc: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
  },

  // Solutions Section
  solutionsSection: {
    paddingHorizontal: 32,
    paddingVertical: 80,
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
  },
  solutionsGrid: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 24,
    marginTop: 20,
  },
  solutionCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#334155',
  },
  solutionIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  solutionTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  solutionDesc: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 20,
  },
  solutionCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  solutionCTAText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Features Section
  featuresSection: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    maxWidth: 1200,
    marginHorizontal: 'auto',
    marginTop: 20,
  },
  featureCard: {
    width: isWeb ? 'calc(50% - 12px)' : '100%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#334155',
  },
  featureCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  featureIconBg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureCategoryTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
  },
  featureList: {
    gap: 14,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureItemText: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  featureCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  featureCTAText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Deployment Section
  deploymentSection: {
    paddingHorizontal: 32,
    paddingVertical: 80,
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
  },
  deploymentTimeline: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 20,
    marginTop: 48,
  },
  phaseCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  phaseIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  phaseBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  phaseTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  phaseDuration: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  phaseTasks: {
    gap: 10,
  },
  phaseTask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  phaseTaskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748B',
  },
  phaseTaskText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  phaseConnector: {
    display: isWeb ? 'flex' : 'none',
    position: 'absolute',
    right: -22,
    top: '50%',
    width: 24,
    height: 2,
    backgroundColor: '#334155',
  },
  deploymentCTA: {
    alignItems: 'center',
    marginTop: 48,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 32,
  },
  deploymentCTATitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  deploymentCTAButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  deploymentCTAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  deploymentCTAButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Case Studies Section
  caseStudiesSection: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  caseStudiesGrid: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 24,
    maxWidth: 1200,
    marginHorizontal: 'auto',
    marginTop: 40,
  },
  caseStudyCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#334155',
  },
  caseStudyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  caseStudyFlag: {
    fontSize: 48,
  },
  caseStudyCountry: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
  },
  caseStudyProgram: {
    color: '#64748B',
    fontSize: 13,
  },
  caseStudyMetric: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  caseStudyMetricValue: {
    color: '#10B981',
    fontSize: 36,
    fontWeight: '700',
    fontFamily: isWeb ? 'monospace' : undefined,
  },
  caseStudyMetricLabel: {
    color: '#10B981',
    fontSize: 13,
    marginTop: 4,
  },
  caseStudyResult: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  caseStudySince: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 20,
  },
  caseStudyCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  caseStudyCTAText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
});
