import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { drawAPI } from '../../src/utils/api';
import { format, formatDistanceToNow } from 'date-fns';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface PrizeTier {
  tier: number;
  name: string;
  prize_type?: string;
  amount?: number;
  item_name?: string;
  item_description?: string;
  image_url?: string;
  winners: number;
}

interface Draw {
  id: string;
  draw_type: string;
  start_date: string;
  end_date: string;
  draw_date?: string;
  status: string;
  prize_tiers: PrizeTier[];
  total_entries: number;
  user_entries: number;
  user_won?: {
    prize_tier: number;
    amount: number;
    item_name?: string;
  };
}

export default function DrawsScreen() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDraws = useCallback(async () => {
    try {
      const response = await drawAPI.getDraws();
      setDraws(response.data);
    } catch (error) {
      console.error('Error loading draws:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDraws();
  }, [loadDraws]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadDraws();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'completed': return '#64748B';
      case 'upcoming': return '#3B82F6';
      default: return '#64748B';
    }
  };

  const getPrizeDisplay = (tier: PrizeTier) => {
    if (tier.prize_type === 'item') {
      return tier.item_name || tier.name;
    }
    return `$${(tier.amount || 0).toLocaleString()}`;
  };

  const getTotalCashPrize = (tiers: PrizeTier[]) => {
    return tiers
      .filter(t => t.prize_type !== 'item')
      .reduce((sum, tier) => sum + (tier.amount || 0) * tier.winners, 0);
  };

  const hasItemPrizes = (tiers: PrizeTier[]) => {
    return tiers.some(t => t.prize_type === 'item');
  };

  const activeDraws = draws.filter((d) => d.status === 'active');
  const completedDraws = draws.filter((d) => d.status === 'completed');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <Text style={styles.title}>Prize Draws</Text>
            <Text style={styles.subtitle}>Scan more receipts to increase your chances!</Text>
          </View>

          <Text style={styles.sectionTitle}>Active Draws</Text>
          {activeDraws.length > 0 ? (
            activeDraws.map((draw) => (
              <View key={draw.id} style={styles.drawCard}>
                <View style={styles.drawHeader}>
                  <View style={styles.drawTypeContainer}>
                    <Ionicons name="trophy" size={24} color="#F59E0B" />
                    <Text style={styles.drawType}>
                      {draw.draw_type.charAt(0).toUpperCase() + draw.draw_type.slice(1)} Draw
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(draw.status)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(draw.status) }]}>
                      {draw.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Draw Date Banner */}
                {draw.draw_date && (
                  <View style={styles.drawDateBanner}>
                    <Ionicons name="calendar" size={20} color="#F59E0B" />
                    <View style={styles.drawDateInfo}>
                      <Text style={styles.drawDateLabel}>Draw Date</Text>
                      <Text style={styles.drawDateTime}>
                        {format(new Date(draw.draw_date), 'EEEE, MMM d, yyyy')}
                      </Text>
                      <Text style={styles.drawTimeText}>
                        at {format(new Date(draw.draw_date), 'h:mm a')}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Prize Pool Summary */}
                <View style={styles.prizePool}>
                  {hasItemPrizes(draw.prize_tiers) ? (
                    <>
                      <Text style={styles.prizeLabel}>Prizes Include</Text>
                      <Text style={styles.prizeHighlight}>
                        Cash + Amazing Items!
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.prizeLabel}>Total Prize Pool</Text>
                      <Text style={styles.prizeAmount}>${getTotalCashPrize(draw.prize_tiers).toLocaleString()}</Text>
                    </>
                  )}
                </View>

                {/* Prize Tiers */}
                <View style={styles.tiersContainer}>
                  {draw.prize_tiers.map((tier) => (
                    <View key={tier.tier} style={styles.tierItem}>
                      {tier.image_url ? (
                        <Image source={{ uri: tier.image_url }} style={styles.tierImage} />
                      ) : (
                        <View style={[styles.tierIcon, { backgroundColor: tier.tier === 1 ? '#F59E0B20' : tier.tier === 2 ? '#94A3B820' : '#CD7F3220' }]}>
                          <Ionicons 
                            name={tier.prize_type === 'item' ? 'gift' : tier.tier === 1 ? 'medal' : tier.tier === 2 ? 'ribbon' : 'star'} 
                            size={20} 
                            color={tier.tier === 1 ? '#F59E0B' : tier.tier === 2 ? '#94A3B8' : '#CD7F32'} 
                          />
                        </View>
                      )}
                      <View style={styles.tierInfo}>
                        <Text style={styles.tierName}>{tier.name}</Text>
                        {tier.prize_type === 'item' && tier.item_description && (
                          <Text style={styles.tierDescription}>{tier.item_description}</Text>
                        )}
                      </View>
                      <View style={styles.tierValueContainer}>
                        <Text style={[styles.tierAmount, { color: tier.prize_type === 'item' ? '#F59E0B' : '#10B981' }]}>
                          {getPrizeDisplay(tier)}
                        </Text>
                        <Text style={styles.tierWinners}>x{tier.winners}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* User's Entries & Time Remaining */}
                <View style={styles.drawFooter}>
                  <View style={styles.entriesInfo}>
                    <Text style={styles.yourEntries}>Your Entries</Text>
                    <Text style={styles.entriesCount}>{draw.user_entries}</Text>
                  </View>
                  <View style={styles.timeInfo}>
                    <Ionicons name="time" size={16} color="#64748B" />
                    <Text style={styles.timeText}>
                      {draw.draw_date 
                        ? `Draws ${formatDistanceToNow(new Date(draw.draw_date), { addSuffix: true })}`
                        : `Ends ${formatDistanceToNow(new Date(draw.end_date), { addSuffix: true })}`
                      }
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={48} color="#64748B" />
              <Text style={styles.emptyText}>No active draws right now</Text>
            </View>
          )}

          {completedDraws.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Past Draws</Text>
              {completedDraws.map((draw) => (
                <View key={draw.id} style={[styles.drawCard, styles.completedCard]}>
                  <View style={styles.drawHeader}>
                    <View style={styles.drawTypeContainer}>
                      <Ionicons name="trophy" size={20} color="#64748B" />
                      <Text style={[styles.drawType, { color: '#94A3B8' }]}>
                        {draw.draw_type.charAt(0).toUpperCase() + draw.draw_type.slice(1)} Draw
                      </Text>
                    </View>
                    {draw.user_won && (
                      <View style={styles.wonBadge}>
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text style={styles.wonText}>
                          WON {draw.user_won.item_name || `$${draw.user_won.amount}`}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.completedDate}>
                    Drew on {format(new Date(draw.draw_date || draw.end_date), 'MMM d, yyyy')}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  contentWrapper: { width: '100%', maxWidth: isWeb ? 480 : undefined, alignSelf: 'center' },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 },
  
  drawCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 16 },
  completedCard: { opacity: 0.7 },
  drawHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  drawTypeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  drawType: { fontSize: 18, fontWeight: '600', color: '#fff' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  
  drawDateBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F59E0B15', 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F59E0B30',
  },
  drawDateInfo: { flex: 1 },
  drawDateLabel: { fontSize: 12, color: '#F59E0B', fontWeight: '500' },
  drawDateTime: { fontSize: 16, fontWeight: '600', color: '#fff', marginTop: 2 },
  drawTimeText: { fontSize: 14, color: '#F59E0B' },
  
  prizePool: { alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#334155' },
  prizeLabel: { fontSize: 14, color: '#94A3B8' },
  prizeAmount: { fontSize: 32, fontWeight: 'bold', color: '#10B981', marginTop: 4 },
  prizeHighlight: { fontSize: 20, fontWeight: 'bold', color: '#F59E0B', marginTop: 4 },
  
  tiersContainer: { marginTop: 16 },
  tierItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155' },
  tierImage: { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
  tierIcon: { width: 48, height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  tierInfo: { flex: 1 },
  tierName: { fontSize: 14, color: '#fff', fontWeight: '500' },
  tierDescription: { fontSize: 12, color: '#64748B', marginTop: 2 },
  tierValueContainer: { alignItems: 'flex-end' },
  tierAmount: { fontSize: 14, fontWeight: '600' },
  tierWinners: { fontSize: 12, color: '#64748B', marginTop: 2 },
  
  drawFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  entriesInfo: { alignItems: 'center' },
  yourEntries: { fontSize: 12, color: '#94A3B8' },
  entriesCount: { fontSize: 24, fontWeight: 'bold', color: '#3B82F6' },
  timeInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 14, color: '#64748B' },
  
  emptyCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 12 },
  completedDate: { fontSize: 14, color: '#64748B' },
  wonBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B20', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, gap: 4 },
  wonText: { fontSize: 12, fontWeight: '600', color: '#F59E0B' },
});
