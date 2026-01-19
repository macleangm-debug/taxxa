import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scanAPI } from '../../src/utils/api';
import { format } from 'date-fns';

interface ScanHistoryItem {
  id: string;
  timestamp: string;
  status: string;
  merchant_name?: string;
  amount?: number;
  entries_earned: number;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const response = await scanAPI.getHistory(50);
      setHistory(response.data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadHistory();
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return { name: 'checkmark-circle', color: '#10B981' };
      case 'duplicate':
        return { name: 'copy', color: '#F59E0B' };
      case 'invalid':
      case 'expired':
        return { name: 'close-circle', color: '#EF4444' };
      default:
        return { name: 'help-circle', color: '#64748B' };
    }
  };

  const renderItem = ({ item }: { item: ScanHistoryItem }) => {
    const icon = getStatusIcon(item.status);
    
    return (
      <View style={styles.historyItem}>
        <View style={[styles.statusIcon, { backgroundColor: `${icon.color}20` }]}>
          <Ionicons name={icon.name as any} size={24} color={icon.color} />
        </View>
        
        <View style={styles.itemDetails}>
          <Text style={styles.merchantName}>
            {item.merchant_name || 'Unknown Merchant'}
          </Text>
          <Text style={styles.timestamp}>
            {format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')}
          </Text>
          {item.amount && (
            <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
          )}
        </View>
        
        <View style={styles.entriesContainer}>
          {item.status === 'valid' ? (
            <>
              <Text style={styles.entriesValue}>+{item.entries_earned}</Text>
              <Text style={styles.entriesLabel}>entries</Text>
            </>
          ) : (
            <Text style={[styles.statusText, { color: icon.color }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan History</Text>
        <Text style={styles.subtitle}>
          {history.length} total scans
        </Text>
      </View>

      {history.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color="#64748B" />
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptyText}>
            Start scanning receipts to earn draw entries!
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#3B82F6"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 16,
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
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  historyItem: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  amount: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  entriesContainer: {
    alignItems: 'center',
  },
  entriesValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  entriesLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
});
