import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://prizescan-2.preview.emergentagent.com';

interface ReferralStats {
  referral_code: string;
  referral_link: string;
  total_referrals: number;
  pending_referrals: number;
  active_referrals: number;
  bonus_entries_earned: number;
  max_referrals: number;
  referrals_remaining: number;
}

interface ReferralItem {
  id: string;
  referred_phone: string;
  status: string;
  scans_completed: number;
  entries_earned: number;
  joined_at: string;
}

export default function ReferralScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    setIsLoading(true);
    try {
      // Load stats
      const statsRes = await fetch(`${API_URL}/api/referral/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Load referral list
      const listRes = await fetch(`${API_URL}/api/referral/list`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        setReferrals(listData.referrals || []);
      }
    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = async () => {
    if (!stats?.referral_link) return;
    
    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(stats.referral_link);
    } else {
      Clipboard.setString(stats.referral_link);
    }
    
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareVia = async (platform: 'whatsapp' | 'sms' | 'facebook' | 'general') => {
    if (!stats?.referral_link) return;

    const message = `🎉 Join TaxDraw and win prizes! Scan your tax receipts to earn entries into prize draws.\n\nUse my referral link to get started:\n${stats.referral_link}`;

    try {
      switch (platform) {
        case 'whatsapp':
          const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
          const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);
          if (canOpenWhatsApp) {
            await Linking.openURL(whatsappUrl);
          } else {
            // Fallback to web WhatsApp
            await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
          }
          break;
          
        case 'sms':
          const smsUrl = Platform.OS === 'ios' 
            ? `sms:&body=${encodeURIComponent(message)}`
            : `sms:?body=${encodeURIComponent(message)}`;
          await Linking.openURL(smsUrl);
          break;
          
        case 'facebook':
          await Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(stats.referral_link)}&quote=${encodeURIComponent(message)}`);
          break;
          
        case 'general':
        default:
          await Share.share({
            message: message,
            url: stats.referral_link,
            title: 'Join TaxDraw',
          });
          break;
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'active_1': return '#3B82F6';
      case 'active_5': return '#10B981';
      default: return '#64748B';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Registered';
      case 'active_1': return '1 Scan (+1)';
      case 'active_5': return '5+ Scans (+4)';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refer & Earn</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <LinearGradient
          colors={['#2563EB', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="gift" size={40} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Invite Friends, Earn Entries!</Text>
          <Text style={styles.heroSubtitle}>
            Earn up to 4 bonus entries for each friend who joins and scans receipts
          </Text>
          
          {/* Stats Row */}
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNumber}>{stats?.bonus_entries_earned || 0}</Text>
              <Text style={styles.heroStatLabel}>Entries Earned</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNumber}>{stats?.active_referrals || 0}</Text>
              <Text style={styles.heroStatLabel}>Active Referrals</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNumber}>{stats?.referrals_remaining || 20}</Text>
              <Text style={styles.heroStatLabel}>Slots Left</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Referral Link Card */}
        <View style={styles.linkCard}>
          <Text style={styles.linkLabel}>Your Referral Link</Text>
          <View style={styles.linkRow}>
            <View style={styles.linkBox}>
              <Text style={styles.linkText} numberOfLines={1}>
                {stats?.referral_link || 'Loading...'}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.copyBtn, copiedLink && styles.copyBtnSuccess]}
              onPress={copyLink}
            >
              <Ionicons 
                name={copiedLink ? "checkmark" : "copy"} 
                size={20} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>
          
          {/* Your Code */}
          <View style={styles.codeRow}>
            <Text style={styles.codeLabel}>Your Code:</Text>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{stats?.referral_code || '---'}</Text>
            </View>
          </View>
        </View>

        {/* Share Options */}
        <View style={styles.shareSection}>
          <Text style={styles.sectionTitle}>Share Via</Text>
          <View style={styles.shareButtons}>
            <TouchableOpacity style={styles.shareBtn} onPress={() => shareVia('whatsapp')}>
              <View style={[styles.shareIcon, { backgroundColor: '#25D366' }]}>
                <Ionicons name="logo-whatsapp" size={28} color="#fff" />
              </View>
              <Text style={styles.shareLabel}>WhatsApp</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareBtn} onPress={() => shareVia('sms')}>
              <View style={[styles.shareIcon, { backgroundColor: '#34B7F1' }]}>
                <Ionicons name="chatbubble" size={28} color="#fff" />
              </View>
              <Text style={styles.shareLabel}>SMS</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareBtn} onPress={() => shareVia('facebook')}>
              <View style={[styles.shareIcon, { backgroundColor: '#1877F2' }]}>
                <Ionicons name="logo-facebook" size={28} color="#fff" />
              </View>
              <Text style={styles.shareLabel}>Facebook</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareBtn} onPress={() => shareVia('general')}>
              <View style={[styles.shareIcon, { backgroundColor: '#64748B' }]}>
                <Ionicons name="share-social" size={28} color="#fff" />
              </View>
              <Text style={styles.shareLabel}>More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorks}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Friend Registers</Text>
              <Text style={styles.stepDesc}>They click your link and create an account</Text>
            </View>
            <View style={styles.stepReward}>
              <Text style={styles.stepRewardText}>0 entries</Text>
            </View>
          </View>
          
          <View style={styles.stepConnector} />
          
          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: '#3B82F6' }]}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>First Valid Scan</Text>
              <Text style={styles.stepDesc}>They scan their first tax receipt</Text>
            </View>
            <View style={[styles.stepReward, { backgroundColor: '#DBEAFE' }]}>
              <Text style={[styles.stepRewardText, { color: '#2563EB' }]}>+1 entry</Text>
            </View>
          </View>
          
          <View style={styles.stepConnector} />
          
          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: '#10B981' }]}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>5 Valid Scans</Text>
              <Text style={styles.stepDesc}>They become an active user</Text>
            </View>
            <View style={[styles.stepReward, { backgroundColor: '#D1FAE5' }]}>
              <Text style={[styles.stepRewardText, { color: '#059669' }]}>+3 entries</Text>
            </View>
          </View>
          
          <View style={styles.maxReferralsNote}>
            <Ionicons name="information-circle" size={16} color="#64748B" />
            <Text style={styles.maxReferralsText}>Maximum 20 rewarded referrals per user</Text>
          </View>
        </View>

        {/* Your Referrals */}
        <View style={styles.referralsSection}>
          <Text style={styles.sectionTitle}>Your Referrals ({stats?.total_referrals || 0})</Text>
          
          {referrals.length === 0 ? (
            <View style={styles.emptyReferrals}>
              <Ionicons name="people-outline" size={48} color="#475569" />
              <Text style={styles.emptyText}>No referrals yet</Text>
              <Text style={styles.emptySubtext}>Share your link to start earning!</Text>
            </View>
          ) : (
            referrals.map((ref) => (
              <View key={ref.id} style={styles.referralItem}>
                <View style={styles.referralAvatar}>
                  <Ionicons name="person" size={20} color="#64748B" />
                </View>
                <View style={styles.referralInfo}>
                  <Text style={styles.referralPhone}>{ref.referred_phone}</Text>
                  <Text style={styles.referralDate}>
                    {ref.scans_completed} scans • Joined {new Date(ref.joined_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.referralStatus, { backgroundColor: getStatusColor(ref.status) + '20' }]}>
                  <Text style={[styles.referralStatusText, { color: getStatusColor(ref.status) }]}>
                    {getStatusLabel(ref.status)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  heroStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  heroStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  linkCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  linkLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 10,
    fontWeight: '500',
  },
  linkRow: {
    flexDirection: 'row',
    gap: 10,
  },
  linkBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  linkText: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtnSuccess: {
    backgroundColor: '#10B981',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  codeLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  codeBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  codeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
  },
  shareSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  shareButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shareBtn: {
    alignItems: 'center',
    flex: 1,
  },
  shareIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shareLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  howItWorks: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
    marginLeft: 12,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  stepDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  stepReward: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepRewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  stepConnector: {
    width: 2,
    height: 20,
    backgroundColor: '#334155',
    marginLeft: 15,
    marginVertical: 4,
  },
  maxReferralsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  maxReferralsText: {
    fontSize: 12,
    color: '#64748B',
  },
  referralsSection: {
    marginBottom: 24,
  },
  emptyReferrals: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#1E293B',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  referralAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralInfo: {
    flex: 1,
    marginLeft: 12,
  },
  referralPhone: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  referralDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  referralStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  referralStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
