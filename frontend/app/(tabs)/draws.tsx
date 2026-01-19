import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { drawAPI } from '../../src/utils/api';
import { format, formatDistanceToNow } from 'date-fns';

interface Draw {
  id: string;
  draw_type: string;
  start_date: string;
  end_date: string;
  status: string;
  prize_tiers: Array<{
    tier: number;
    name: string;
    amount: number;
    winners: number;
  }>;
  total_entries: number;
  user_entries: number;
  user_won?: {
    prize_tier: number;
    amount: number;
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
      case 'active':
        return '#10B981';
      case 'completed':
        return '#64748B';
      case 'upcoming':
        return '#3B82F6';
      default:
        return '#64748B';
    }
  };

  const getTotalPrize = (tiers: Draw['prize_tiers']) => {
    return tiers.reduce((sum, tier) => sum + tier.amount * tier.winners, 0);
  };

  const activeDraws = draws.filter((d) => d.status === 'active');
  const completedDraws = draws.filter((d) => d.status === 'completed');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Prize Draws</Text>
          <Text style={styles.subtitle}>
            Scan more receipts to increase your chances!
          </Text>
        </View>

        {/* Active Draws */}
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

              <View style={styles.prizePool}>
                <Text style={styles.prizeLabel}>Total Prize Pool</Text>
                <Text style={styles.prizeAmount}>${getTotalPrize(draw.prize_tiers).toLocaleString()}</Text>
              </View>

              <View style={styles.tiersContainer}>
                {draw.prize_tiers.map((tier) => (
                  <View key={tier.tier} style={styles.tierItem}>
                    <View style={styles.tierInfo}>
                      <Ionicons 
                        name={tier.tier === 1 ? 'medal' : tier.tier === 2 ? 'ribbon' : 'star'} 
                        size={16} 
                        color={tier.tier === 1 ? '#F59E0B' : tier.tier === 2 ? '#94A3B8' : '#CD7F32'} 
                      />
                      <Text style={styles.tierName}>{tier.name}</Text>
                    </View>
                    <Text style={styles.tierAmount}>${tier.amount.toLocaleString()}</Text>
                    <Text style={styles.tierWinners}>x{tier.winners}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.drawFooter}>
                <View style={styles.entriesInfo}>
                  <Text style={styles.yourEntries}>Your Entries</Text>
                  <Text style={styles.entriesCount}>{draw.user_entries}</Text>
                </View>
                <View style={styles.timeInfo}>
                  <Ionicons name="time" size={16} color="#64748B" />
                  <Text style={styles.timeText}>
                    Ends {formatDistanceToNow(new Date(draw.end_date), { addSuffix: true })}
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

        {/* Completed Draws */}
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
                      <Text style={styles.wonText}>WON ${draw.user_won.amount}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.completedDate}>
                  Ended {format(new Date(draw.end_date), 'MMM d, yyyy')}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  drawCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  completedCard: {
    opacity: 0.7,
  },
  drawHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  drawTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drawType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  prizePool: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  prizeLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  prizeAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 4,
  },
  tiersContainer: {
    marginTop: 16,
  },
  tierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tierInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierName: {
    fontSize: 14,
    color: '#fff',
  },
  tierAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginRight: 12,
  },
  tierWinners: {
    fontSize: 12,
    color: '#64748B',
  },
  drawFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  entriesInfo: {
    alignItems: 'center',
  },
  yourEntries: {
    fontSize: 12,
    color: '#94A3B8',
  },
  entriesCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  completedDate: {
    fontSize: 14,
    color: '#64748B',
  },
  wonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  wonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
});
